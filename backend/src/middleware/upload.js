import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const ALLOWED_MIMETYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/mpeg',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Parse a single file from a Hono multipart request.
 * Returns { buffer, mimetype, originalname, size } or null.
 */
export const parseFile = async (c, fieldName = 'file') => {
    const body = await c.req.parseBody();
    const file = body[fieldName];

    if (!file || typeof file === 'string') return { body, file: null };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!ALLOWED_MIMETYPES.includes(file.type)) {
        throw new Error('Unsupported file type.');
    }

    if (buffer.length > MAX_FILE_SIZE) {
        throw new Error('File too large. Maximum size is 25MB.');
    }

    return {
        body,
        file: {
            buffer,
            mimetype: file.type,
            originalname: file.name,
            size: buffer.length,
        },
    };
};

/**
 * Upload buffer to Cloudinary.
 */
export const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(stream);
    });
};
