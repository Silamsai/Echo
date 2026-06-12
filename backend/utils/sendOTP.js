const nodemailer = require('nodemailer');

// Build the transporter dynamically based on configured variables
const createTransporter = () => {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback to Gmail service if host is not specified
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

const sendOTPEmail = async (email, otp, username) => {
  const fromAddress = process.env.EMAIL_FROM || `"ECHO" <${process.env.EMAIL_USER}>`;
  const physicalAddress = process.env.EMAIL_PHYSICAL_ADDRESS || 'ECHO Chat Inc., 123 Tech Loop, San Francisco, CA 94107';

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Your ECHO Verification Code',
    text: `Hey ${username} 👋\n\nWelcome to ECHO! Use the verification code below to complete your registration:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\nNever share this code with anyone.\n\n© 2026 ECHO. All rights reserved.\n${physicalAddress}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECHO OTP Verification</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 0;">
          <tr>
            <td align="center">
              <table width="100%" max-width="480" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03);margin:0 auto;text-align:left;">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 20px;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#4f46e5;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">ECHO</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:1px;color:#64748b;margin-left:8px;vertical-align:middle;text-transform:uppercase;">Real-Time Chat</span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">Hey ${username} 👋</p>
                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Welcome to ECHO! Please verify your email address to activate your account. Use the 6-digit verification code below:
                    </p>
                    <!-- OTP Box -->
                    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                      <div style="font-size:11px;color:#64748b;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Verification Code</div>
                      <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0f172a;font-family:'Courier New',Courier,monospace;">${otp}</div>
                    </div>
                    <p style="color:#475569;font-size:13px;line-height:1.5;margin:0 0 8px;">
                      This verification code will expire in <strong style="color:#0f172a;">10 minutes</strong>.
                    </p>
                    <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;">
                      If you did not sign up for an account with ECHO, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="color:#64748b;font-size:11px;margin:0 0 6px;">© 2026 ECHO. All rights reserved.</p>
                    <p style="color:#94a3b8;font-size:10px;margin:0;line-height:1.4;">${physicalAddress}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendResetEmail = async (email, code, username) => {
  const fromAddress = process.env.EMAIL_FROM || `"ECHO Support" <${process.env.EMAIL_USER}>`;
  const physicalAddress = process.env.EMAIL_PHYSICAL_ADDRESS || 'ECHO Chat Inc., 123 Tech Loop, San Francisco, CA 94107';

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Reset your ECHO Password',
    text: `Hey ${username} 👋\n\nWe received a request to reset your password. Use the verification code below to reset it:\n\n${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\nNever share this code with anyone.\n\n© 2026 ECHO. All rights reserved.\n${physicalAddress}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECHO Password Reset</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 0;">
          <tr>
            <td align="center">
              <table width="100%" max-width="480" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03);margin:0 auto;text-align:left;">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 20px;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#dc2626;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">ECHO</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:1px;color:#64748b;margin-left:8px;vertical-align:middle;text-transform:uppercase;">Password Reset</span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">Hey ${username} 👋</p>
                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      We received a request to reset your password. Use the verification code below to complete the reset process:
                    </p>
                    <!-- OTP Box -->
                    <div style="background-color:#fdf2f2;border:1px solid #fde2e2;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                      <div style="font-size:11px;color:#b91c1c;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Reset Code</div>
                      <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#991b1b;font-family:'Courier New',Courier,monospace;">${code}</div>
                    </div>
                    <p style="color:#475569;font-size:13px;line-height:1.5;margin:0 0 8px;">
                      This password reset code will expire in <strong style="color:#0f172a;">10 minutes</strong>.
                    </p>
                    <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;">
                      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="color:#64748b;font-size:11px;margin:0 0 6px;">© 2026 ECHO. All rights reserved.</p>
                    <p style="color:#94a3b8;font-size:10px;margin:0;line-height:1.4;">${physicalAddress}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendResetEmail };
