const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, username) => {
  const mailOptions = {
    from: `"ECHO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your ECHO Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECHO OTP Verification</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="500" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.3);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding:40px 40px 20px;">
                    <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#ffffff;">
                      <span style="background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">ECHO</span>
                    </div>
                    <div style="color:#94a3b8;font-size:13px;letter-spacing:3px;margin-top:4px;">REAL-TIME CHAT</div>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:20px 40px 40px;">
                    <p style="color:#e2e8f0;font-size:18px;margin:0 0 8px;">Hey <strong>${username}</strong> 👋</p>
                    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 32px;">
                      Welcome to ECHO! Use the verification code below to complete your registration. 
                      This code expires in <strong style="color:#6366f1;">10 minutes</strong>.
                    </p>
                    <!-- OTP Box -->
                    <div style="background:rgba(99,102,241,0.1);border:2px solid rgba(99,102,241,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                      <div style="font-size:13px;color:#94a3b8;letter-spacing:2px;margin-bottom:12px;">VERIFICATION CODE</div>
                      <div style="font-size:48px;font-weight:800;letter-spacing:16px;color:#ffffff;font-family:'Courier New',monospace;">${otp}</div>
                    </div>
                    <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
                      If you didn't request this, you can safely ignore this email.<br>
                      Never share this code with anyone.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:rgba(0,0,0,0.3);padding:16px 40px;text-align:center;">
                    <p style="color:#475569;font-size:11px;margin:0;">© 2024 ECHO. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
