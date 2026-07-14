// בדיקות יחידה על calcSalary — הפונקציה שמחשבת כמה כל עובד מקבל בפועל.
// טעות כאן = תלוש שכר שגוי, אז זו הפונקציה הכי חשובה לבדוק בכל המערכת.
const { loadLogic } = require('./load-logic');

function freshLogic() {
  return loadLogic({ settings: {}, tips: {} });
}

describe('calcSalary — עובד שעתי', () => {
  test('שכר בסיס = שעות רגילות × תעריף שעתי', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 0 };
    const rec = { regHours: 180, ot125: 0, ot150: 0, travelDays: 0, bonus: 0, advance: 0 };
    expect(calcSalary(emp, rec).base).toBe(7200);
  });

  test('שעות נוספות 125% מחושבות בתעריף וחצי-רבע על הבסיס', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 0 };
    const rec = { regHours: 180, ot125: 10, ot150: 0, travelDays: 0, bonus: 0, advance: 0 };
    // 10 שעות * 40 ש"ח * 1.25 = 500
    expect(calcSalary(emp, rec).ot125).toBe(500);
  });

  test('שעות נוספות 150% מחושבות בכפול וחצי על הבסיס', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 0 };
    const rec = { regHours: 180, ot125: 0, ot150: 4, travelDays: 0, bonus: 0, advance: 0 };
    // 4 שעות * 40 ש"ח * 1.5 = 240
    expect(calcSalary(emp, rec).ot150).toBe(240);
  });

  test('נסיעות = מספר ימי נסיעה × תעריף יומי', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 25 };
    const rec = { regHours: 0, ot125: 0, ot150: 0, travelDays: 12, bonus: 0, advance: 0 };
    expect(calcSalary(emp, rec).travel).toBe(300);
  });
});

describe('calcSalary — עובד חודשי', () => {
  test('שכר בסיס הוא המשכורת הקבועה, בלי קשר לשעות בפועל', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'monthly', monthlySalary: 9000, travelPerDay: 0 };
    const rec = { regHours: 150, ot125: 0, ot150: 0, travelDays: 0, bonus: 0, advance: 0 };
    expect(calcSalary(emp, rec).base).toBe(9000);
  });

  test('תעריף שעתי לצורך שעות נוספות נגזר מ-182 שעות בחודש (התקן הישראלי)', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'monthly', monthlySalary: 18200, travelPerDay: 0 }; // 18200/182 = 100 ש"ח/שעה
    const rec = { regHours: 182, ot125: 10, ot150: 0, travelDays: 0, bonus: 0, advance: 0 };
    expect(calcSalary(emp, rec).ot125).toBeCloseTo(1250, 5); // 10 * 100 * 1.25
  });
});

describe('calcSalary — בונוס ומפרעה', () => {
  test('בונוס מתווסף לסכום הסופי', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 0 };
    const rec = { regHours: 100, ot125: 0, ot150: 0, travelDays: 0, bonus: 500, advance: 0 };
    expect(calcSalary(emp, rec).total).toBe(100 * 40 + 500);
  });

  test('מפרעה מנוכה מהסכום הסופי (לא מתעלמים ולא מכפילים)', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 0 };
    const rec = { regHours: 100, ot125: 0, ot150: 0, travelDays: 0, bonus: 0, advance: 800 };
    expect(calcSalary(emp, rec).total).toBe(100 * 40 - 800);
  });

  test('מפרעה גדולה מהשכר עצמו מובילה לסכום שלילי (לא נתפס/נחסם ל-0)', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 0 };
    const rec = { regHours: 10, ot125: 0, ot150: 0, travelDays: 0, bonus: 0, advance: 2000 };
    expect(calcSalary(emp, rec).total).toBeLessThan(0);
  });
});

describe('calcSalary — מקרי קצה', () => {
  test('rec ריק/undefined מחזיר אפסים ולא זורק שגיאה', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40 };
    const result = calcSalary(emp, null);
    expect(result.total).toBe(0);
    expect(result.base).toBe(0);
  });

  test('שדות מספריים חסרים/ריקים מתייחסים כ-0, לא NaN', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40, travelPerDay: 10 };
    const rec = { regHours: '', ot125: undefined, ot150: null, travelDays: 2, bonus: '', advance: '' };
    const result = calcSalary(emp, rec);
    expect(Number.isNaN(result.total)).toBe(false);
    expect(result.travel).toBe(20);
  });

  test('סה"כ שעות (hours) הוא סכום כל סוגי השעות', () => {
    const { calcSalary } = freshLogic();
    const emp = { type: 'hourly', hourlyRate: 40 };
    const rec = { regHours: 100, ot125: 5, ot150: 3, travelDays: 0, bonus: 0, advance: 0 };
    expect(calcSalary(emp, rec).hours).toBe(108);
  });
});
