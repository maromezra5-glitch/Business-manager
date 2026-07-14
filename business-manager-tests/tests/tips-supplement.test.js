// בדיקות יחידה על getDetailedSupplementReport — "השלמת טיפים למינימום".
// זו הפונקציה הכי עדינה מבחינה משפטית במערכת: היא קובעת כמה העסק חייב
// להוסיף לעובד כשהטיפים שלו לא הגיעו לשכר המינימום לשעה. טעות כאן = חשיפה
// משפטית אמיתית מול עובד, לא רק "מספר לא נכון בגיליון".
const { loadLogic } = require('./load-logic');

function buildS({ minPerHr = 35, shiftDefs, tips = {} } = {}) {
  const settings = { tipsMinPerHr: minPerHr };
  if (shiftDefs) settings.shiftDefs = shiftDefs;
  return { settings, tips };
}

const SHIFTS = [{ id: 'evening', name: 'ערב', from: '17:00', to: '23:00' }];

describe('getDetailedSupplementReport — השלמה בסיסית', () => {
  test('טיפ מעל למינימום השעתי → אין השלמה בכלל', () => {
    const S = buildS({
      minPerHr: 35,
      shiftDefs: SHIFTS,
      tips: { '2026-07-01': { evening: { amount: 480, workers: [{ empId: 'e1', from: '17:00', to: '23:00' }] } } } // 6h * 80/h
    });
    const { getDetailedSupplementReport } = loadLogic(S);
    const report = getDetailedSupplementReport('2026-07');
    expect(report.e1.totalSuppl).toBe(0);
    expect(report.e1.totalTips).toBe(480);
  });

  test('טיפ מתחת למינימום השעתי → ההשלמה בדיוק מכסה את הפער', () => {
    const S = buildS({
      minPerHr: 35,
      shiftDefs: SHIFTS,
      tips: { '2026-07-01': { evening: { amount: 60, workers: [{ empId: 'e1', from: '17:00', to: '23:00' }] } } } // 6h * 10/h בפועל
    });
    const { getDetailedSupplementReport } = loadLogic(S);
    const report = getDetailedSupplementReport('2026-07');
    // מגיע לו 6*35=210 לפי מינימום, קיבל בפועל 60 → השלמה = 150
    expect(report.e1.totalSuppl).toBe(150);
  });

  test('אין נתונים לעובד כלל (לא עבד) → לא מופיע בדוח בכלל', () => {
    const S = buildS({ shiftDefs: SHIFTS, tips: {} });
    const { getDetailedSupplementReport } = loadLogic(S);
    const report = getDetailedSupplementReport('2026-07');
    expect(report.e1).toBeUndefined();
  });
});

describe('getDetailedSupplementReport — תיקון ידני (adjust) לא "מפעיל" השלמה מיותרת', () => {
  test('תיקון שלילי (קנס/טעות) לא מגדיל את ההשלמה שמגיעה לעובד', () => {
    // הבסיס לפני תיקון: 6h * 35/h (מדויק על המינימום) = 210, ואז מנכים 50 בתיקון ידני.
    // "final" (מה שהעובד רואה שהוא קיבל) יורד ל-160, אבל ה-suppl לא אמור לפצות
    // על ההורדה הידנית — היא לא קשורה לפער מול מינימום השכר.
    const S = buildS({
      minPerHr: 35,
      shiftDefs: SHIFTS,
      tips: { '2026-07-01': { evening: { amount: 210, workers: [{ empId: 'e1', from: '17:00', to: '23:00', adjust: -50 }] } } }
    });
    const { getDetailedSupplementReport } = loadLogic(S);
    const report = getDetailedSupplementReport('2026-07');
    expect(report.e1.totalSuppl).toBe(0); // לא 50 — זה הבדיקה הקריטית
    expect(report.e1.totalTips).toBe(160); // ה"final" בפועל כן משקף את הניכוי
  });

  test('תיקון חיובי כן נספר בבסיס לצורך חישוב ההשלמה', () => {
    const S = buildS({
      minPerHr: 35,
      shiftDefs: SHIFTS,
      // בסיס בפועל 60 (10/h), + תיקון חיובי 90 = 150 סה"כ, מול מינימום 210 → השלמה 60
      tips: { '2026-07-01': { evening: { amount: 60, workers: [{ empId: 'e1', from: '17:00', to: '23:00', adjust: 90 }] } } }
    });
    const { getDetailedSupplementReport } = loadLogic(S);
    const report = getDetailedSupplementReport('2026-07');
    expect(report.e1.totalSuppl).toBe(60);
  });
});

describe('getDetailedSupplementReport — כמה עובדים באותה משמרת', () => {
  test('הטיפ מתחלק לפי שעות עבודה יחסיות, וההשלמה מחושבת בנפרד לכל עובד', () => {
    const S = buildS({
      minPerHr: 35,
      shiftDefs: SHIFTS,
      tips: {
        '2026-07-01': {
          evening: {
            amount: 300, // 300 ל-9 שעות-עבודה משותפות = 33.33/h
            workers: [
              { empId: 'e1', from: '17:00', to: '23:00' }, // 6h
              { empId: 'e2', from: '20:00', to: '23:00' }  // 3h
            ]
          }
        }
      }
    });
    const { getDetailedSupplementReport } = loadLogic(S);
    const report = getDetailedSupplementReport('2026-07');
    // e1: 6h * 33.33 = 200, מינימום 6*35=210 → השלמה 10
    // e2: 3h * 33.33 = 100, מינימום 3*35=105 → השלמה 5
    expect(report.e1.totalSuppl).toBeCloseTo(10, 1);
    expect(report.e2.totalSuppl).toBeCloseTo(5, 1);
  });
});
