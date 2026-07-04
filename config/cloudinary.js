const cloudinaryLib = require("cloudinary").v2;

const requiredEnvKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

requiredEnvKeys.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required Cloudinary environment variable: ${key}`);
  }
});

cloudinaryLib.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log(`Cloudinary configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);

const deleteCloudinaryResource = async (publicId, resourceType = "image") => {
  if (!publicId) {
    return null;
  }

  return cloudinaryLib.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};

module.exports = {
  cloudinary: cloudinaryLib,
  deleteCloudinaryResource,
};