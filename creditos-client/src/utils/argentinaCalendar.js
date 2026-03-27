const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const addDays = (value, amount) => {
    const date = new Date(value);
    date.setDate(date.getDate() + amount);
    return date;
};

const nthWeekdayOfMonth = (year, monthIndex, weekday, nth) => {
    const firstDay = new Date(year, monthIndex, 1);
    const firstWeekdayOffset = (weekday - firstDay.getDay() + 7) % 7;
    const day = 1 + firstWeekdayOffset + (nth - 1) * 7;
    return new Date(year, monthIndex, day);
};

const calculateEasterSunday = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
};

const getArgentinaHolidayKeys = (year) => {
    const easterSunday = calculateEasterSunday(year);
    const carnivalMonday = addDays(easterSunday, -48);
    const carnivalTuesday = addDays(easterSunday, -47);
    const holyThursday = addDays(easterSunday, -3);
    const holyFriday = addDays(easterSunday, -2);

    const fixed = [
        new Date(year, 0, 1),
        new Date(year, 2, 24),
        new Date(year, 3, 2),
        new Date(year, 4, 1),
        new Date(year, 4, 25),
        new Date(year, 5, 20),
        new Date(year, 6, 9),
        new Date(year, 11, 8),
        new Date(year, 11, 25),
    ];

    const movableMondays = [
        nthWeekdayOfMonth(year, 5, 1, 3),
        nthWeekdayOfMonth(year, 7, 1, 3),
        nthWeekdayOfMonth(year, 9, 1, 2),
        nthWeekdayOfMonth(year, 10, 1, 4),
    ];

    return new Set(
        [
            ...fixed,
            ...movableMondays,
            carnivalMonday,
            carnivalTuesday,
            holyThursday,
            holyFriday,
        ].map((date) => toDateKey(startOfDay(date)))
    );
};

export const isArgentinaHoliday = (date) => {
    const normalized = startOfDay(date);
    return getArgentinaHolidayKeys(normalized.getFullYear()).has(toDateKey(normalized));
};