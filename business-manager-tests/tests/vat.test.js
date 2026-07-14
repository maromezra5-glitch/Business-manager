// בדיקות יחידה על getVat — משפיע ישירות על דוח הרווח וההפסד ודוח ה-Z.
const { loadLogic } = require('./load-logic');

describe('getVat', () => {
  test('כשלא הוגדר מע"מ בהגדרות העסק, ברירת המחדל היא 17%', () => {
    const { getVat } = loadLogic({ settings: {}, tips: {} });
    expect(getVat()).toBe(17);
  });

  test('משתמש בערך המע"מ שהוגדר בהגדרות העסק', () => {
    const { getVat } = loadLogic({ settings: { vat: 18 }, tips: {} });
    expect(getVat()).toBe(18);
  });

  test('ערך לא-מספרי (למשל מחרוזת ריקה) חוזר לברירת המחדל 17%, לא NaN', () => {
    const { getVat } = loadLogic({ settings: { vat: '' }, tips: {} });
    expect(getVat()).toBe(17);
  });

  test('מע"מ 0% נשמר כפי שהוא ולא נופל בטעות לברירת המחדל', () => {
    const { getVat } = loadLogic({ settings: { vat: 0 }, tips: {} });
    expect(getVat()).toBe(0);
  });
});
