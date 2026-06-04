const AppConfig = require('../models/AppConfig');
const { uploadToCloudinary } = require('../middleware/upload');

const getConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne({ key: 'main_config' });
    if (!config) {
      config = await AppConfig.create({ key: 'main_config' });
    }
    res.status(200).json(config);
  } catch (err) {
    console.error('getConfig error:', err);
    res.status(500).json({ message: 'Server error loading config.' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { logoUrl, sidebarIcons, features } = req.body;
    let config = await AppConfig.findOne({ key: 'main_config' });
    if (!config) {
      config = new AppConfig({ key: 'main_config' });
    }

    if (logoUrl !== undefined) config.logoUrl = logoUrl;
    if (sidebarIcons !== undefined) {
      config.sidebarIcons = {
        chats: sidebarIcons.chats !== undefined ? sidebarIcons.chats : config.sidebarIcons.chats,
        search: sidebarIcons.search !== undefined ? sidebarIcons.search : config.sidebarIcons.search,
        requests: sidebarIcons.requests !== undefined ? sidebarIcons.requests : config.sidebarIcons.requests,
        profile: sidebarIcons.profile !== undefined ? sidebarIcons.profile : config.sidebarIcons.profile,
        settings: sidebarIcons.settings !== undefined ? sidebarIcons.settings : config.sidebarIcons.settings,
      };
    }
    if (features !== undefined) {
      config.features = {
        voiceCalls: features.voiceCalls !== undefined ? features.voiceCalls : config.features.voiceCalls,
        videoCalls: features.videoCalls !== undefined ? features.videoCalls : config.features.videoCalls,
        imageSharing: features.imageSharing !== undefined ? features.imageSharing : config.features.imageSharing,
        voiceNotes: features.voiceNotes !== undefined ? features.voiceNotes : config.features.voiceNotes,
        otpVerification: features.otpVerification !== undefined ? features.otpVerification : config.features.otpVerification,
      };
    }

    await config.save();
    res.status(200).json({ message: 'Configuration updated successfully.', config });
  } catch (err) {
    console.error('updateConfig error:', err);
    res.status(500).json({ message: 'Server error updating config.' });
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Upload logo to Cloudinary folder 'echo_branding'
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'echo_branding',
      resource_type: 'auto',
    });

    res.status(200).json({
      message: 'Logo uploaded successfully.',
      url: result.secure_url,
    });
  } catch (err) {
    console.error('uploadLogo error:', err);
    res.status(500).json({ message: 'Server error uploading logo.' });
  }
};

module.exports = { getConfig, updateConfig, uploadLogo };
