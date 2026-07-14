// ── טוען את הפונקציות העסקיות האמיתיות מתוך business-manager.html לסביבת בדיקה מבודדת ──
// כל קריאה יוצרת "S" (מצב עסק מדומה) טרי משלה, כך שבדיקות לא מדליפות state זו לזו.
const vm = require('vm');
const { extractFunctions } = require('./extract-source');

const FN_NAMES = [
  'toNum', 'calcSalary',
  'daysInMonth', 'dateFull', 'getDow', 'timeDiff',
  'getShiftDefs', 'getTipsMinPerHr', 'getTipRec', 'getDetailedSupplementReport',
  'getVat'
];

function loadLogic(mockS) {
  const code = extractFunctions(FN_NAMES);
  const sandbox = {
    S: mockS,
    _defaultShiftDefs: [
      { id: 'morning', name: 'בוקר', from: '07:00', to: '15:00' },
      { id: 'evening', name: 'ערב', from: '15:00', to: '23:00' }
    ],
    console: console
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const result = {};
  FN_NAMES.forEach(function(n) {
    vm.runInContext('this.__tmp = ' + n + ';', sandbox);
    result[n] = sandbox.__tmp;
  });
  return result;
}

module.exports = { loadLogic, FN_NAMES };
