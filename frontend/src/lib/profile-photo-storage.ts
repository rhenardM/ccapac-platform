import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const PROFILE_PHOTO_FOLDER = "ccapac/profile-photos";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary profile photo storage is not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function uploadProfilePhoto(file: File, userId: string) {
  configureCloudinary();

  const buffer = Buffer.from(await file.arrayBuffer());

  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: PROFILE_PHOTO_FOLDER,
        public_id: userId,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        width: 512,
        height: 512,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        format: "webp",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

type DestroyResult = {
  result?: string;
};

export async function deleteProfilePhoto(userId: string) {
  configureCloudinary();

  const result = (await cloudinary.uploader.destroy(
    `${PROFILE_PHOTO_FOLDER}/${userId}`,
    {
      invalidate: true,
      resource_type: "image",
    }
  )) as DestroyResult;

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Cloudinary profile photo deletion failed");
  }

  return result;
}

export function isProfilePhotoStorageUrl(url: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "res.cloudinary.com" &&
      parsedUrl.pathname.includes(`/${cloudName}/`) &&
      parsedUrl.pathname.includes(`/${PROFILE_PHOTO_FOLDER}/`)
    );
  } catch {
    return false;
  }
}
