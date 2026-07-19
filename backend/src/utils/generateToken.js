import jwt from 'jsonwebtoken';

const generateToken = (user, env) => {
    return jwt.sign(
        {
            userId: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN || '7d' }
    );
};

export default generateToken;
