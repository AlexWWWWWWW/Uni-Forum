// 生成楼层号（G, LG1, LG2, ...）
const generateFloorNumber = (index) => {
  if (index === 0) {
    return 'G';
  }
  return `LG${index}`;
};

module.exports = { generateFloorNumber };

