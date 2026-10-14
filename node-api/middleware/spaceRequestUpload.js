const path = require("path");
const multer = require("multer");

const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinary");

function sanitizeFileName(fileName) {
  const extension = path
    .extname(fileName)
    .toLowerCase();

  const baseName = path
    .basename(fileName, extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  return {
    baseName: baseName || "document",
    extension,
  };
}

function createUniqueFileName(originalName) {
  const { baseName, extension } =
    sanitizeFileName(originalName);

  return (
    [
      Date.now(),
      Math.round(Math.random() * 1e9),
      baseName,
    ].join("-") + extension
  );
}

class CloudinaryRawStorage {
  _handleFile(req, file, callback) {
    if (!isCloudinaryConfigured()) {
      return callback(
        new Error(
          "Configuration Cloudinary manquante sur le serveur."
        )
      );
    }

    const filename = createUniqueFileName(
      file.originalname
    );

    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          type: "upload",
          folder: "ccapac/space-requests",
          public_id: filename,
          overwrite: false,
          use_filename: false,
        },
        (error, result) => {
          if (error || !result) {
            console.error(
              "Cloudinary upload error:",
              error
            );

            return callback(
              error ||
                new Error(
                  "Cloudinary n'a pas retourné le document envoyé."
                )
            );
          }

          return callback(null, {
            filename,
            path: result.secure_url,
            size: Number(result.bytes || 0),
            cloudinaryPublicId:
              result.public_id,
            cloudinaryResourceType:
              result.resource_type || "raw",
          });
        }
      );

    file.stream.on("error", (error) => {
      uploadStream.destroy(error);
    });

    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, callback) {
    if (!file?.cloudinaryPublicId) {
      return callback(null);
    }

    cloudinary.uploader
      .destroy(file.cloudinaryPublicId, {
        resource_type:
          file.cloudinaryResourceType || "raw",
        invalidate: true,
      })
      .then(() => callback(null))
      .catch((error) => callback(error));
  }
}

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  /* Certains navigateurs Windows utilisent ce MIME. */
  "application/octet-stream",
];

const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
];

function fileFilter(req, file, callback) {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const validExtension =
    allowedExtensions.includes(extension);
  const validMimeType =
    allowedMimeTypes.includes(file.mimetype);

  if (!validExtension || !validMimeType) {
    return callback(
      new Error(
        "Seuls les fichiers PDF, DOC et DOCX sont autorisés."
      )
    );
  }

  return callback(null, true);
}

const uploadOptions = {
  storage: new CloudinaryRawStorage(),
  fileFilter,
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
};

const uploadSpaceRequestDocument =
  multer(uploadOptions);

const uploadWorkflowDocument =
  multer(uploadOptions);

module.exports = {
  uploadSpaceRequestDocument,
  uploadWorkflowDocument,
};