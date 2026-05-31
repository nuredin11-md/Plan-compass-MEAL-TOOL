/**
 * Ethiopian Date and Fiscal Year (EFY) Conversion Utilities
 * Handles Conversion, reporting periods (July–June, Sene to Hamle)
 * and quarter mapping.
 */

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
}

const ET_MONTH_NAMES = [
  "Meskerem", // 1
  "Tekemt",    // 2
  "Hidar",     // 3
  "Tahsas",    // 4
  "Tir",       // 5
  "Yekatit",   // 6
  "Megabit",   // 7
  "Miazia",    // 8
  "Genbot",    // 9
  "Sene",      // 10
  "Hamle",     // 11
  "Nehase",    // 12
  "Pagume"     // 13
];

/**
 * Calculates the Ethiopian Date approx based on Gregorian date.
 * (Accurate for 1900-2100).
 */
export function toEthiopianDate(gregorianDate: Date | string | null): EthiopianDate {
  const d = gregorianDate ? new Date(gregorianDate) : new Date();
  if (isNaN(d.getTime())) {
    return { year: 2018, month: 10, day: 1, monthName: "Sene" };
  }

  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();

  // Determine leap year info
  const eurLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
  
  let ey = gy - 8;
  let em = 1;
  let ed = 1;

  // Gregorian Day of Year
  const monthsDays = [0, 31, eurLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gDayOfYear = gd;
  for (let i = 1; i < gm; i++) {
    gDayOfYear += monthsDays[i];
  }

  // September 11 or 12 is New Year
  // Ethiopian leap year is the year before GC leap year (e.g. 2011 EFY, 2015 EFY, 2019 EFY)
  const isEtLeap = (ey % 4 === 3);
  const newYearDay = isEtLeap ? 12 : 11; // Sep 11 or Sep 12
  
  // Day of New year in GC is Sep 11 (254th day) or Sep 12 (255th day in leap yr)
  const sepNewYearDoy = eurLeap ? (newYearDay === 11 ? 255 : 256) : (newYearDay === 11 ? 254 : 255);

  if (gDayOfYear >= sepNewYearDoy) {
    ey = gy - 7;
    const daysSinceNewYear = gDayOfYear - sepNewYearDoy;
    em = Math.floor(daysSinceNewYear / 30) + 1;
    ed = (daysSinceNewYear % 30) + 1;
  } else {
    ey = gy - 8;
    // Calculate days since previous year's new year
    const prevEurLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
    const prevEtLeap = ((ey - 1) % 4 === 3);
    const prevNewYearDay = prevEtLeap ? 12 : 11;
    const daysInPrevYear = prevEurLeap ? 366 : 365;
    const prevSepNewYearDoy = prevEurLeap ? (prevNewYearDay === 11 ? 255 : 256) : (prevNewYearDay === 11 ? 254 : 255);
    
    const daysSinceNewYear = gDayOfYear + (daysInPrevYear - prevSepNewYearDoy);
    em = Math.floor(daysSinceNewYear / 30) + 1;
    ed = (daysSinceNewYear % 30) + 1;
  }

  // Safety boundaries
  if (em > 13) {
    em = 13;
  }
  if (em === 13) {
    const pagumeMax = isEtLeap ? 6 : 5;
    if (ed > pagumeMax) ed = pagumeMax;
  }

  return {
    year: ey,
    month: em,
    day: ed,
    monthName: ET_MONTH_NAMES[em - 1] || "Pagume"
  };
}

/**
 * Retrives EFY string e.g. "2018 EFY"
 */
export function getEFYString(date: Date | string | null): string {
  const et = toEthiopianDate(date);
  return `${et.year} EFY`;
}

/**
 * Returns the Quarter of the Ethiopian Fiscal Year (July-June is the calendar sequence)
 * Q1: Hamle - Meskerem (approx. July - Sept)
 * Q2: Tekemt - Tahsas (approx. Oct - Dec)
 * Q3: Tir - Megabit (approx. Jan - Mar)
 * Q4: Miazia - Sene (approx. Apr - June)
 */
export function getEFYQuarter(date: Date | string | null): { quarter: string; label: string } {
  const d = date ? new Date(date) : new Date();
  const month = d.getMonth() + 1; // 1-12 (Jan-Dec)

  let q = "Q1";
  let label = "Q1 (July–September)";

  // Gregorian July is month 7, Sene/Hamle transition.
  if (month >= 7 && month <= 9) {
    q = "Q1";
    label = "Q1 (July–September)";
  } else if (month >= 10 && month <= 12) {
    q = "Q2";
    label = "Q2 (October–December)";
  } else if (month >= 1 && month <= 3) {
    q = "Q3";
    label = "Q3 (January–March)";
  } else if (month >= 4 && month <= 6) {
    q = "Q4";
    label = "Q4 (April–June)";
  }

  const et = toEthiopianDate(date);
  return {
    quarter: `${q} ${et.year} EFY`,
    label: `${q} ${et.year} EFY - ${label}`
  };
}

/**
 * Formats an Ethiopian Date string nicely
 */
export function formatEthiopianDisplay(gregDate: Date | string | null): string {
  const et = toEthiopianDate(gregDate);
  return `${et.monthName} ${et.day}, ${et.year} EFY`;
}

/**
 * High-fidelity helper that parses a Gregorian date into Ethiopian structure and fiscal quarter
 */
export function gregorianToEthiopian(date: Date | string | null) {
  const et = toEthiopianDate(date);
  const qObj = getEFYQuarter(date);
  return {
    year: et.year,
    month: et.month,
    day: et.day,
    formatted: `${et.monthName} ${et.day}, ${et.year} EFY`,
    formattedQuarter: qObj.quarter
  };
}
