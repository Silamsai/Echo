import { v2 as cloudinary } from 'cloudinary';

let initialized = false;

export const initCloudinary = (env) => {
    if (initialized) return;
    cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
    });
    initialized = true;
};

export default cloudinary;
