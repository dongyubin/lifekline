// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 六十甲子
const SIXTY_NA_JIA = TIAN_GAN.flatMap(gan => DI_ZHI.map(zhi => gan + zhi));

// 节气数据表（使用默认值）
// 实际应用中需要更精确的节气数据

/**
 * 计算年柱
 * @param year 阳历年份
 * @param month 阳历月份
 * @param day 阳历日期
 * @returns 年柱
 */
export function calculateYearPillar(year: number, month: number, day: number): string {
  // 计算当年立春的日期
  const springStart = getJieQiDate(year, 1); // 立春是第二个节气（索引1）
  
  // 如果出生在立春之前，年柱属于前一年
  const pillarYear = month < springStart.month || (month === springStart.month && day < springStart.day) 
    ? year - 1 
    : year;
  
  // 计算年柱索引
  // 1900年是庚子年，索引为36
  const baseYear = 1900;
  const baseIndex = 36;
  const yearDiff = pillarYear - baseYear;
  const yearIndex = (baseIndex + yearDiff) % 60;
  
  return SIXTY_NA_JIA[yearIndex];
}

/**
 * 计算月柱
 * @param year 阳历年份
 * @param month 阳历月份
 * @param day 阳历日期
 * @returns 月柱
 */
export function calculateMonthPillar(year: number, month: number, day: number): string {
  // 确定农历年份（考虑立春）
  const springStart = getJieQiDate(year, 1);
  const lunarYear = month < springStart.month || (month === springStart.month && day < springStart.day) 
    ? year - 1 
    : year;
  
  // 确定月份对应的节气
  let monthIndex: number;
  if (month === 1) {
    // 正月：立春 - 惊蛰
    const jingZhe = getJieQiDate(lunarYear + 1, 2);
    monthIndex = (day >= springStart.day) ? 0 : 11;
  } else {
    // 其他月份
    const jieQiIndex = month * 2 - 2;
    const jieQi = getJieQiDate(lunarYear + 1, jieQiIndex);
    monthIndex = (day >= jieQi.day) ? month - 1 : month - 2;
  }
  
  // 计算月柱天干
  const yearPillar = calculateYearPillar(year, month, day);
  const yearGanIndex = TIAN_GAN.indexOf(yearPillar[0]);
  const monthGanIndex = (yearGanIndex * 2 + monthIndex + 1) % 10;
  
  // 月柱地支是固定的
  const monthZhiIndex = (monthIndex + 2) % 12; // 寅月开始为正月
  
  return TIAN_GAN[monthGanIndex] + DI_ZHI[monthZhiIndex];
}

/**
 * 计算日柱
 * @param year 阳历年份
 * @param month 阳历月份
 * @param day 阳历日期
 * @returns 日柱
 */
export function calculateDayPillar(year: number, month: number, day: number): string {
  // 1900年1月1日是庚子日，索引为36
  const baseYear = 1900;
  const baseMonth = 1;
  const baseDay = 1;
  const baseIndex = 36;
  
  // 计算从基准日期到目标日期的天数
  const days = countDaysBetween(baseYear, baseMonth, baseDay, year, month, day);
  
  // 计算日柱索引
  const dayIndex = (baseIndex + days) % 60;
  
  return SIXTY_NA_JIA[dayIndex];
}

/**
 * 计算时柱
 * @param dayPillar 日柱
 * @param hour 小时
 * @param minute 分钟
 * @returns 时柱
 */
export function calculateHourPillar(dayPillar: string, hour: number, minute: number): string {
  // 确定时辰（古代一个时辰等于现代两个小时）
  // 子时：23:00-01:00
  let shiChenIndex: number;
  if (hour === 23 || hour === 0) {
    shiChenIndex = 0; // 子时
  } else if (hour === 1) {
    shiChenIndex = 1; // 丑时
  } else {
    shiChenIndex = Math.floor((hour + 1) / 2);
  }
  
  // 计算时柱天干
  const dayGanIndex = TIAN_GAN.indexOf(dayPillar[0]);
  const hourGanIndex = (dayGanIndex * 2 + shiChenIndex) % 10;
  
  // 时柱地支
  const hourZhiIndex = (shiChenIndex + 11) % 12;
  
  return TIAN_GAN[hourGanIndex] + DI_ZHI[hourZhiIndex];
}

/**
 * 获取指定年份和节气的日期
 * @param year 阳历年份
 * @param jieQiIndex 节气索引（0-11）
 * @returns {month: number, day: number} 节气日期
 */
function getJieQiDate(year: number, jieQiIndex: number): { month: number, day: number } {
  // 这里需要实现节气计算
  // 由于节气计算复杂，我们使用预计算的数据
  // TODO: 实现完整的节气计算逻辑
  
  // 临时返回固定日期
  const defaultJieQi: number[][] = [
    [1, 6],  // 小寒
    [2, 4],  // 立春
    [3, 6],  // 惊蛰
    [4, 5],  // 清明
    [5, 6],  // 立夏
    [6, 6],  // 芒种
    [7, 7],  // 小暑
    [8, 8],  // 立秋
    [9, 8],  // 白露
    [10, 8], // 寒露
    [11, 7], // 立冬
    [12, 7]  // 大雪
  ];
  
  return {
    month: defaultJieQi[jieQiIndex][0],
    day: defaultJieQi[jieQiIndex][1]
  };
}

/**
 * 计算两个日期之间的天数
 * @param year1 起始年份
 * @param month1 起始月份
 * @param day1 起始日期
 * @param year2 结束年份
 * @param month2 结束月份
 * @param day2 结束日期
 * @returns 天数差
 */
function countDaysBetween(year1: number, month1: number, day1: number, year2: number, month2: number, day2: number): number {
  const date1 = new Date(year1, month1 - 1, day1);
  const date2 = new Date(year2, month2 - 1, day2);
  const timeDiff = date2.getTime() - date1.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * 计算起运年龄（虚岁）
 * @param year 阳历年份
 * @param month 阳历月份
 * @param day 阳历日期
 * @param gender 性别 ('Male' | 'Female')
 * @returns 起运年龄（虚岁）
 */
export function calculateStartAge(year: number, month: number, day: number, gender: string): number {
  // 获取出生当年的节气
  const springStart = getJieQiDate(year, 1); // 立春
  const summerStart = getJieQiDate(year, 4); // 立夏
  const autumnStart = getJieQiDate(year, 7); // 立秋
  const winterStart = getJieQiDate(year, 10); // 立冬
  
  // 确定出生季节
  let season: string;
  if ((month < springStart.month || (month === springStart.month && day < springStart.day)) ||
      (month > winterStart.month || (month === winterStart.month && day >= winterStart.day))) {
    season = 'winter'; // 冬季
  } else if ((month > springStart.month || (month === springStart.month && day >= springStart.day)) &&
             (month < summerStart.month || (month === summerStart.month && day < summerStart.day))) {
    season = 'spring'; // 春季
  } else if ((month > summerStart.month || (month === summerStart.month && day >= summerStart.day)) &&
             (month < autumnStart.month || (month === autumnStart.month && day < autumnStart.day))) {
    season = 'summer'; // 夏季
  } else {
    season = 'autumn'; // 秋季
  }
  
  // 基础起运年龄
  let baseAge: number;
  switch (season) {
    case 'spring':
      baseAge = 1;
      break;
    case 'summer':
      baseAge = 3;
      break;
    case 'autumn':
      baseAge = 5;
      break;
    case 'winter':
      baseAge = 7;
      break;
    default:
      baseAge = 1;
  }
  
  // 计算出生日到最近节气的天数差
  let nearestJieQiDate: { month: number; day: number };
  if (season === 'spring') {
    nearestJieQiDate = springStart;
  } else if (season === 'summer') {
    nearestJieQiDate = summerStart;
  } else if (season === 'autumn') {
    nearestJieQiDate = autumnStart;
  } else {
    nearestJieQiDate = winterStart;
  }
  
  const daysDiff = Math.abs(day - nearestJieQiDate.day);
  
  // 根据天数差调整起运年龄
  // 每相差10天，起运年龄增减1岁
  const ageAdjustment = Math.floor(daysDiff / 10);
  
  return baseAge + ageAdjustment;
}

/**
 * 判断大运方向
 * @param yearPillar 年柱
 * @param gender 性别 ('Male' | 'Female')
 * @returns 是否顺行
 */
export function isDaYunForward(yearPillar: string, gender: string): boolean {
  if (!yearPillar) return true;
  
  const firstChar = yearPillar.trim().charAt(0);
  const yangStems = ['甲', '丙', '戊', '庚', '壬'];
  
  const isYangYear = yangStems.includes(firstChar);
  return gender === 'Male' ? isYangYear : !isYangYear;
}

/**
 * 计算第一步大运
 * @param monthPillar 月柱
 * @param isForward 是否顺行
 * @returns 第一步大运
 */
export function calculateFirstDaYun(monthPillar: string, isForward: boolean): string {
  if (!monthPillar) return '';
  
  // 找到月柱在六十甲子中的索引
  const pillarIndex = SIXTY_NA_JIA.indexOf(monthPillar);
  if (pillarIndex === -1) return '';
  
  // 计算第一步大运的索引
  // 通常从月柱开始，顺行或逆行一定的步数
  // 这里使用3步作为示例（实际计算需要更复杂的逻辑）
  const step = 3;
  let firstDaYunIndex: number;
  
  if (isForward) {
    firstDaYunIndex = (pillarIndex + step) % 60;
  } else {
    firstDaYunIndex = (pillarIndex - step + 60) % 60;
  }
  
  return SIXTY_NA_JIA[firstDaYunIndex];
}

/**
 * 计算完整的四柱
 * @param year 阳历年份
 * @param month 阳历月份
 * @param day 阳历日期
 * @param hour 小时
 * @param minute 分钟
 * @returns {yearPillar, monthPillar, dayPillar, hourPillar}
 */
export function calculateBazi(year: number, month: number, day: number, hour: number, minute: number): {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
} {
  const yearPillar = calculateYearPillar(year, month, day);
  const monthPillar = calculateMonthPillar(year, month, day);
  const dayPillar = calculateDayPillar(year, month, day);
  const hourPillar = calculateHourPillar(dayPillar, hour, minute);
  
  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar
  };
}
