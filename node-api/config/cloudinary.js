const { v2: cloudinary } = require("cloudinary");

const configuration = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

cloudinary.config(configuration);

function isCloudinaryConfigured() {
  return Boolean(
    configuration.cloud_name &&
      configuration.api_key &&
      configuration.api_secret
  );
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};