const crypto = require('crypto');

// 英文first name列表
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
  'Blake', 'Cameron', 'Dakota', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden',
  'Jamie', 'Kai', 'Logan', 'Marley', 'Noah', 'Parker', 'Peyton', 'Reese',
  'River', 'Rowan', 'Sage', 'Skyler', 'Tyler', 'Zion', 'Adrian', 'Aiden',
  'Ashton', 'Aubrey', 'Bailey', 'Blair', 'Brooks', 'Carter', 'Charlie', 'Dane',
  'Dylan', 'Ellis', 'Evan', 'Felix', 'Gray', 'Greer', 'Haven', 'Hunter',
  'Indigo', 'Jaden', 'Jasper', 'Jesse', 'Kendall', 'Kyle', 'Lane', 'Lee',
  'Lennox', 'Luca', 'Mason', 'Micah', 'Nico', 'Owen', 'Phoenix', 'Quinn',
  'Reed', 'Remy', 'Robin', 'Sage', 'Sam', 'Sawyer', 'Shiloh', 'Sloane',
  'Spencer', 'Sterling', 'Sullivan', 'Tatum', 'Teagan', 'Tristan', 'Vaughn', 'Wren'
];

/**
 * 生成匿名名称
 * 基于postId和userId生成一个稳定的hash，确保同一个post下同一个user的匿名名称保持一致
 * @param {String|ObjectId} postId - 帖子ID（MongoDB ObjectId或字符串）
 * @param {String|ObjectId} userId - 用户ID（MongoDB ObjectId或字符串）
 * @returns {String} 匿名名称（英文first name）
 */
function generateAnonymousName(postId, userId) {
  // 将postId和userId转换为字符串
  const postIdStr = postId.toString();
  const userIdStr = userId.toString();
  
  // 使用MD5 hash生成一个稳定的值
  const hash = crypto.createHash('md5')
    .update(`${postIdStr}_${userIdStr}`)
    .digest('hex');
  
  // 将hash的前8个字符转换为数字，用于选择名字
  const index = parseInt(hash.substring(0, 8), 16) % FIRST_NAMES.length;
  
  return FIRST_NAMES[index];
}

module.exports = {
  generateAnonymousName
};

