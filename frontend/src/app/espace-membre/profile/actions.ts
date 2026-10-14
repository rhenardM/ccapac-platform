"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import {
  deleteProfilePhoto,
  isProfilePhotoStorageUrl,
  uploadProfilePhoto,
} from "@/lib/profile-photo-storage";

const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
const PROFILE_PHOTO_UPLOAD_COOLDOWN_MS = 60 * 1000;
const ALLOWED_PROFILE_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_PROFILE_PHOTO_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

type ProfilePhotoActionResult = {
  success: boolean;
  imageUrl?: string | null;
  error?: string;
};

function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] || "";
}

function validateProfilePhoto(file: File) {
  if (!file || file.size === 0) {
    return "Veuillez choisir une image.";
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    return "L'image ne doit pas dépasser 5 MB.";
  }

  if (!ALLOWED_PROFILE_PHOTO_TYPES.has(file.type)) {
    return "Format non accepté. Utilisez JPG, PNG ou WebP.";
  }

  const extension = getFileExtension(file.name);
  if (!ALLOWED_PROFILE_PHOTO_EXTENSIONS.has(extension)) {
    return "Extension non acceptée. Utilisez JPG, PNG ou WebP.";
  }

  return null;
}

function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (type === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

async function validateProfilePhotoSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (!hasImageSignature(header, file.type)) {
    return "Le fichier choisi n'est pas une image valide.";
  }

  return null;
}

async function hasRecentProfilePhotoUpload(userId: string) {
  const recentActivity = await prisma.memberActivity.findFirst({
    where: {
      userId,
      type: "PROFILE_UPDATE",
      metadata: {
        path: ["action"],
        equals: "profile_photo_upload",
      },
      createdAt: {
        gte: new Date(Date.now() - PROFILE_PHOTO_UPLOAD_COOLDOWN_MS),
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(recentActivity);
}

async function getCurrentMember() {
  const user = await getUser();

  if (!user || user.role !== "MEMBER") {
    return null;
  }

  return user;
}

export async function updateProfilePhotoAction(
  formData: FormData
): Promise<ProfilePhotoActionResult> {
  const user = await getCurrentMember();

  if (!user) {
    return { success: false, error: "Non autorisé" };
  }

  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return { success: false, error: "Veuillez choisir une image." };
  }

  const validationError = validateProfilePhoto(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const signatureError = await validateProfilePhotoSignature(file);
  if (signatureError) {
    return { success: false, error: signatureError };
  }

  const userId = user.dbUserId;
  const isRateLimited = await hasRecentProfilePhotoUpload(userId);
  if (isRateLimited) {
    return {
      success: false,
      error: "Veuillez patienter avant de changer à nouveau la photo.",
    };
  }

  try {
    const uploadResult = await uploadProfilePhoto(file, userId);
    const imageUrl = uploadResult.secure_url;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      }),
      prisma.memberActivity.create({
        data: {
          userId: user.dbUserId,
          type: "PROFILE_UPDATE",
          metadata: {
            action: "profile_photo_upload",
            field: "image",
          },
        },
      }),
    ]);

    revalidatePath("/espace-membre/profile");
    revalidatePath("/espace-membre");

    return {
      success: true,
      imageUrl,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la photo de profil:", error);
    return {
      success: false,
      error: "Impossible de mettre à jour la photo pour le moment.",
    };
  }
}

export async function removeProfilePhotoAction(): Promise<ProfilePhotoActionResult> {
  const user = await getCurrentMember();

  if (!user) {
    return { success: false, error: "Non autorisé" };
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.dbUserId },
        data: { image: null },
      }),
      prisma.memberActivity.create({
        data: {
          userId: user.dbUserId,
          type: "PROFILE_UPDATE",
          metadata: {
            action: "profile_photo_remove",
            field: "image",
            removed: true,
          },
        },
      }),
    ]);

    if (user.image && isProfilePhotoStorageUrl(user.image)) {
      try {
        await deleteProfilePhoto(user.dbUserId);
      } catch (error) {
        console.error("Erreur lors de la suppression Cloudinary:", error);
      }
    }

    revalidatePath("/espace-membre/profile");
    revalidatePath("/espace-membre");

    return {
      success: true,
      imageUrl: null,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de la photo de profil:", error);
    return {
      success: false,
      error: "Impossible de supprimer la photo pour le moment.",
    };
  }
}
