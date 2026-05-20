/**
 * 五行计算工具函数
 * 基于传统干支历法的五行属性计算
 */

const WUXING_ELEMENTS = ['metal', 'wood', 'water', 'fire', 'earth']
const WUXING_NAMES = ['金', '木', '水', '火', '土']

/**
 * 计算天干
 * @param {number} year - 年份
 * @returns {number} 天干索引 (0-9)
 */
function getHeavenlyStem(year) {
  return (year - 4) % 10
}

/**
 * 计算地支
 * @param {number} year - 年份
 * @returns {number} 地支索引 (0-11)
 */
function getEarthlyBranch(year) {
  return (year - 4) % 12
}

/**
 * 天干对应五行
 * @param {number} stemIndex - 天干索引
 * @returns {string} 五行属性
 */
function stemToWuxing(stemIndex) {
  const wuxingMap = ['metal', 'metal', 'wood', 'wood', 'water', 'water', 'fire', 'fire', 'earth', 'earth']
  return wuxingMap[stemIndex]
}

/**
 * 地支对应五行
 * @param {number} branchIndex - 地支索引
 * @returns {string} 五行属性
 */
function branchToWuxing(branchIndex) {
  const wuxingMap = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water']
  return wuxingMap[branchIndex]
}

/**
 * 计算年柱五行
 * @param {number} year - 年份
 * @returns {string} 五行属性
 */
function getYearWuxing(year) {
  const stemIndex = getHeavenlyStem(year)
  return stemToWuxing(stemIndex)
}

/**
 * 计算月柱五行 (简化版)
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {string} 五行属性
 */
function getMonthWuxing(year, month) {
  const branchIndex = getEarthlyBranch(year)
  const monthBranch = (branchIndex + month) % 12
  return branchToWuxing(monthBranch)
}

/**
 * 计算日柱五行 (简化版)
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @returns {string} 五行属性
 */
function getDayWuxing(year, month, day) {
  const baseDate = new Date(1900, 0, 1)
  const targetDate = new Date(year, month - 1, day)
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24))
  return WUXING_ELEMENTS[diffDays % 5]
}

/**
 * 计算今日五行属性 (日柱为主)
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @returns {{element: string, name: string}} 五行属性
 */
function getDailyWuxing(year, month, day) {
  const dayWuxing = getDayWuxing(year, month, day)
  const nameIndex = WUXING_ELEMENTS.indexOf(dayWuxing)
  
  return {
    element: dayWuxing,
    name: WUXING_NAMES[nameIndex]
  }
}

/**
 * 计算用户五行属性 (基于生日)
 * @param {string} birthday - 生日 (YYYY-MM-DD)
 * @returns {{year: string, month: string, day: string}} 各柱五行
 */
function getUserWuxing(birthday) {
  const [year, month, day] = birthday.split('-').map(Number)
  
  return {
    year: getYearWuxing(year),
    month: getMonthWuxing(year, month),
    day: getDayWuxing(year, month, day)
  }
}

/**
 * 计算缺失的五行属性
 * @param {string} birthday - 生日 (YYYY-MM-DD)
 * @param {string} currentDate - 当前日期 (YYYY-MM-DD)
 * @returns {string} 缺失的五行属性
 */
function getMissingWuxing(birthday, currentDate) {
  const userWuxing = getUserWuxing(birthday)
  const [year, month, day] = currentDate.split('-').map(Number)
  const dailyWuxing = getDailyWuxing(year, month, day)
  
  const allElements = new Set([
    userWuxing.year,
    userWuxing.month,
    userWuxing.day,
    dailyWuxing.element
  ])
  
  // 找出缺失的五行
  const missing = WUXING_ELEMENTS.find(element => !allElements.has(element))
  
  return missing || dailyWuxing.element
}

/**
 * 五行对应的色彩建议
 * @param {string} wuxing - 五行属性
 * @returns {string[]} 推荐色值
 */
function getWuxingColors(wuxing) {
  const colorMap = {
    metal: ['#FFFFFF', '#E8E8E8', '#C0C0C0', '#F5F5F5'],
    wood: ['#2E7D32', '#4CAF50', '#81C784', '#A5D6A7'],
    water: ['#1976D2', '#2196F3', '#64B5F6', '#90CAF9'],
    fire: ['#E53935', '#FF5722', '#FF8A65', '#FFCCBC'],
    earth: ['#8D6E63', '#A1887F', '#D7CCC8', '#EFEBE9']
  }
  
  return colorMap[wuxing] || colorMap.water
}

module.exports = {
  getDailyWuxing,
  getUserWuxing,
  getMissingWuxing,
  getWuxingColors,
  WUXING_ELEMENTS,
  WUXING_NAMES
}
