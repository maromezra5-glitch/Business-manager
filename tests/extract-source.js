// ── מחלץ פונקציות בודדות מתוך business-manager.html לצורך בדיקות יחידה ──
// המערכת היא קובץ HTML יחיד עם <script> מוטמע (לא מודולים) — אז במקום
// לשכפל לוגיקה (שתתפוס חוסר-סנכרון), הבדיקות קוראות תמיד את הקוד האמיתי
// והעדכני מהקובץ עצמו, מחלצות רק את הפונקציות הרלוונטיות עם תואם-סוגריים
// אמיתי (לא regex נאיבי שנשבר על סוגריים מקוננים בתוך הפונקציה).
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'business-manager.html');

function extractFunction(src, name) {
  const marker = 'function ' + name + '(';
  const start = src.indexOf(marker);
  if (start === -1) throw new Error('Function not found in source: ' + name);
  const braceStart = src.indexOf('{', start);
  let depth = 0, i = braceStart;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

function extractFunctions(names) {
  const src = fs.readFileSync(HTML_PATH, 'utf8');
  return names.map(function(n) { return extractFunction(src, n); }).join('\n\n');
}

module.exports = { extractFunctions, extractFunction, HTML_PATH };
