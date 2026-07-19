import AppConfig from '../models/AppConfig.js';
import cloudinary from '../config/cloudinary.js';
import { parseFile, uploadToCloudinary } from '../middleware/upload.js';
import { connectDB } from '../config/db.js';

let cachedConfig = null;

// ─── GET /config ─────────────────────────────────────────────────────────────
export const getConfig = async (c) => {
    if (cachedConfig) {
        return c.json(cachedConfig, 200);
    }
    try {
        await connectDB(c.env);
        let config = await AppConfig.findOne({ key: 'main_config' });
        if (!config) {
            config = await AppConfig.create({ key: 'main_config' });
        }
        cachedConfig = config.toObject ? config.toObject() : config;
        return c.json(cachedConfig, 200);
    } catch (err) {
        console.error('Get config error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /config ─────────────────────────────────────────────────────────────
export const updateConfig = async (c) => {
    try {
        const body = await c.req.json();
        const { sidebarIcons, features } = body;

        await connectDB(c.env);
        let config = await AppConfig.findOne({ key: 'main_config' });
        if (!config) {
            config = new AppConfig({ key: 'main_config' });
        }

        if (sidebarIcons) {
            config.sidebarIcons = { ...config.sidebarIcons, ...sidebarIcons };
        }
        if (features) {
            config.features = { ...config.features, ...features };
        }

        await config.save();
        cachedConfig = config.toObject ? config.toObject() : config;
        return c.json({ message: 'App configuration updated.', config }, 200);
    } catch (err) {
        console.error('Update config error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /config/upload-logo ───────────────────────────────────────────────
export const uploadLogo = async (c) => {
    try {
        const { file } = await parseFile(c, 'logo');
        if (!file) return c.json({ message: 'No image file provided.' }, 400);

        const result = await uploadToCloudinary(file.buffer, {
            folder: 'echo/branding',
            transformation: [{ width: 200, height: 200, crop: 'limit' }],
        });

        await connectDB(c.env);
        let config = await AppConfig.findOne({ key: 'main_config' });
        if (!config) {
            config = new AppConfig({ key: 'main_config' });
        }
        config.logoUrl = result.secure_url;
        await config.save();

        cachedConfig = config.toObject ? config.toObject() : config;

        return c.json({ message: 'App logo uploaded successfully.', logoUrl: result.secure_url }, 200);
    } catch (err) {
        console.error('Upload logo error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};
