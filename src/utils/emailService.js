const nodemailer = require('nodemailer');

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true, // 使用 SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// 生成6位数验证码
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 发送验证码邮件
const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"Uni-Forum" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Uni-Forum 登录验证码【${code}】`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Uni-Forum</h1>
            <p>大学生论坛社区</p>
          </div>
          <div class="content">
            <h2>您的登录验证码</h2>
            <p>您好！</p>
            <p>您正在登录 Uni-Forum，请使用以下验证码完成登录：</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p><strong>验证码有效期：5分钟</strong></p>
            
            <div class="warning">
              ⚠️ 如果这不是您本人的操作，请忽略此邮件。<br>
              请勿将验证码透露给他人，以防账号被盗。
            </div>
            
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复</p>
              <p>© 2026 Uni-Forum. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 验证码邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ 邮件发送失败:', error);
    throw error;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail
};

