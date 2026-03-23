const cron = require('node-cron');
const Promotion = require('../models/Promotion');

// 每分钟检查一次过期推广并软删除
const EVERY_MINUTE_CRON = '* * * * *';

async function softDeleteExpiredPromotions() {
  const now = new Date();

  const result = await Promotion.updateMany(
    { isDeleted: false, expiresAt: { $lte: now } },
    { $set: { isDeleted: true, deletedAt: now } }
  );

  return result.modifiedCount || 0;
}

function startPromotionJob() {
  const run = async () => {
    try {
      const count = await softDeleteExpiredPromotions();
      if (count > 0) {
        console.log(`📢 promotionJob: 软删除了 ${count} 条过期推广`);
      }
    } catch (err) {
      console.error('📢 promotionJob failed:', err);
    }
  };

  run();
  cron.schedule(EVERY_MINUTE_CRON, run);
  console.log(`📢 promotionJob scheduled: ${EVERY_MINUTE_CRON}`);
}

module.exports = { startPromotionJob, softDeleteExpiredPromotions };
