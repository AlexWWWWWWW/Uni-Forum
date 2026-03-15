// 认证系统测试脚本
require('dotenv').config();
const { generateVerificationCode, sendVerificationEmail } = require('./src/utils/emailService');

console.log('====================================');
console.log('  Uni-Forum 认证系统测试');
console.log('====================================\n');

// 测试验证码生成
console.log('📝 测试1: 生成验证码');
const code = generateVerificationCode();
console.log(`✅ 生成的验证码: ${code}`);
console.log(`✅ 验证码长度: ${code.length} 位\n`);

// 测试邮件发送（需要提供真实邮箱）
const testEmail = async () => {
  console.log('📧 测试2: 发送验证码邮件');
  
  // 从命令行参数获取测试邮箱
  const email = process.argv[2];
  
  if (!email) {
    console.log('⚠️  使用方法: node test-auth.js your-email@example.com');
    console.log('⚠️  跳过邮件发送测试\n');
    return;
  }
  
  console.log(`📮 发送到: ${email}`);
  console.log(`🔢 验证码: ${code}`);
  
  try {
    await sendVerificationEmail(email, code);
    console.log('✅ 邮件发送成功！');
    console.log('✅ 请检查收件箱（可能在垃圾邮件中）\n');
  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    process.exit(1);
  }
};

// 显示配置信息
console.log('⚙️  邮件配置:');
console.log(`   服务器: smtp.qq.com:465 (SSL)`);
console.log(`   发件人: ${process.env.EMAIL_USER}`);
console.log(`   授权码: ${process.env.EMAIL_PASSWORD ? '已配置 ✓' : '未配置 ✗'}\n`);

// 执行测试
testEmail().then(() => {
  console.log('====================================');
  console.log('  测试完成');
  console.log('====================================');
});

