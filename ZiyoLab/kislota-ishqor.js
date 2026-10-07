// =====================================================================
// kislota-ishqor.js — acid/base neutralisation investigation
//
// A free-exploration investigation: every section (prediction, apparatus, data, analysis,
// conclusion, challenge, results, quiz) is on the page from the start and works in ANY order.
//   • nothing is locked and nothing has to be completed first
//   • a wrong or unusual choice is never refused — the page shows what the data (or the
//     chemistry model) says about it
//   • answers are re-judged live: change a measurement, the prediction or an answer and the
//     feedback follows
//
// CHEMICAL MODEL (educational simplification — see "Model haqida" on the page)
//   • strong acid (HCl) titrated with strong base (NaOH): both fully dissociated
//   • flask: 25.0 mL of 0.100 M HCl;  burette: 0.100 M NaOH (50 mL)
//   • volumes are additive, temperature 25 °C, Kw = 1.0e-14
//   • moles:            n = C · V
//   • net strong acid:  x = (n_acid − n_base) / V_total      (negative = excess base)
//   • water autoionisation included:
//         [H+] = (x + sqrt(x² + 4·Kw)) / 2        →   pH = −log10 [H+]
//     (for x < 0 an algebraically identical form avoids rounding error)
// Not modelled: weak acids/bases, activity coefficients, temperature effects,
// dissolved CO2, instrument/burette error. Colours are a rough "universal indicator".
//
// computePH() is the ONLY source of pH values on this page. Nothing is random.
//
// clamp, mixColor and updateSliderFill come from lab-common.js; buildQuiz from quiz.js;
// createStageNav from nav.js.
// =====================================================================

// ===================== ELEMENTS =====================
const stepsList = document.getElementById('stepsList');

const predictionOptions = document.getElementById('predictionOptions');
const predictionNote = document.getElementById('predictionNote');

const workspace = document.getElementById('workspace');
const amountSlider = document.getElementById('amountSlider');
const amountValue = document.getElementById('amountValue');
const addBtn = document.getElementById('addBtn');
const buretteInfo = document.getElementById('buretteInfo');
const addedValue = document.getElementById('addedValue');
const phValue = document.getElementById('phValue');
const phReading = document.getElementById('phReading');
const measureBtn = document.getElementById('measureBtn');
const recordBtn = document.getElementById('recordBtn');
const newFlaskBtn = document.getElementById('newFlaskBtn');
const observationText = document.getElementById('observationText');
const recordStatus = document.getElementById('recordStatus');
const flaskCaption = document.getElementById('flaskCaption');
const buretteLiquid = document.getElementById('buretteLiquid');
const flaskLiquid = document.getElementById('flaskLiquid');

const dataBody = document.getElementById('dataBody');
const clearBtn = document.getElementById('clearBtn');
const graphDynamic = document.getElementById('graphDynamic');
const graphStatus = document.getElementById('graphStatus');

const analysisPanel = document.getElementById('analysisPanel');
const analysisList = document.getElementById('analysisList');

const conclusionPanel = document.getElementById('conclusionPanel');
const trendSelect = document.getElementById('trendSelect');
const whereSelect = document.getElementById('whereSelect');
const excessSelect = document.getElementById('excessSelect');
const conclusionBtn = document.getElementById('conclusionBtn');
const conclusionFeedback = document.getElementById('conclusionFeedback');

const challengePanel = document.getElementById('challengePanel');
const challengeList = document.getElementById('challengeList');

const resultsPanel = document.getElementById('resultsPanel');
const quizPanel = document.getElementById('quizPanel');
const resetBtn = document.getElementById('resetBtn');

const quizList = document.getElementById('quizList');
const quizScore = document.getElementById('quizScore');

// ===================== SETTINGS =====================
const MODEL = {
  acidC: 0.100,     // mol/L  HCl in the flask
  acidV: 25.0,      // mL
  baseC: 0.100,     // mol/L  NaOH in the burette
  buretteMax: 50.0, // mL
  Kw: 1.0e-14
};

const DEFAULT_AMOUNT = 2.0;
const MAX_TRIALS = 60;        // only so the table and graph stay readable
const MEASURE_DELAY_MS = 450; // short pause so the pH meter feels like it is reading

// apparatus geometry (must match the SVG in the HTML)
const BURETTE_TOP = 24, BURETTE_HEIGHT = 150;
const FLASK_BOTTOM = 312, FLASK_LEVEL_EMPTY = 290, FLASK_LEVEL_RISE = 40;

const ACID_RGB = [200, 107, 61];
const NEUTRAL_RGB = [217, 184, 95];
const BASE_RGB = [73, 99, 79];

const PREDICTION_LABEL = {
  down: 'pH kamayadi',
  flat: 'pH deyarli o‘zgarmaydi',
  linear: 'pH qo‘shilgan ishqorga mutanosib, bir tekis ortadi',
  stop7: 'pH ortadi, lekin 7 ga yetgach to‘xtaydi',
  jump: 'pH avval sekin o‘zgaradi, bir joyda keskin sakraydi, keyin yana sekin o‘zgaradi'
};

const TREND_LABEL = { up: 'ortadi', down: 'kamayadi', same: 'o‘zgarmaydi' };
const WHERE_LABEL = { start: 'boshida', near: 'neytrallanish nuqtasi yaqinida', end: 'oxirida' };
const STATE_LABEL = { acid: 'kislotali', neutral: 'taxminan neytral', base: 'ishqoriy' };

// ===================== STATE =====================
let prediction = null;          // 'down' | 'flat' | 'linear' | 'stop7' | 'jump' | null (not chosen)
let addedVolume = 0;            // mL of base currently in the flask
let measurement = null;         // pH-meter reading for the CURRENT flask contents (or null)
let lastMeasured = null;        // the reading before that, for the observation text
let measuring = false;
let measureTimer = null;
let trials = [];                // recorded rows: { V, pH }  ← source of table, graph, analysis
let analysisAnswers = {};       // question id → the option the student picked (changeable at any time)
let conclusionShown = false;    // the conclusion has been checked at least once
let challengeAnswers = {};      // stage index → was the latest choice right (display only)
let challengeAttempts = 0;

// ===================== CHEMICAL MODEL =====================
// Returns the pH after adding baseV mL of baseC mol/L strong base to acidV mL of acidC mol/L strong acid.
function computePH(acidC, acidV, baseC, baseV) {
  const nAcid = acidC * acidV / 1000;           // mol H+
  const nBase = baseC * baseV / 1000;           // mol OH-
  const totalL = (acidV + baseV) / 1000;
  const x = (nAcid - nBase) / totalL;           // net strong-acid concentration, mol/L

  let h;                                        // [H+]
  if (x >= 0) h = (x + Math.sqrt(x * x + 4 * MODEL.Kw)) / 2;
  else h = (2 * MODEL.Kw) / (Math.sqrt(x * x + 4 * MODEL.Kw) - x);

  return { pH: -Math.log10(h), nAcid, nBase, totalL, x };
}

// pH for the experiment's own solutions (0.100 M / 25.0 mL acid, 0.100 M base)
function phAfterAdding(baseV) {
  return computePH(MODEL.acidC, MODEL.acidV, MODEL.baseC, baseV).pH;
}

function classify(pH) {
  if (pH < 6.5) return 'acid';
  if (pH > 7.5) return 'base';
  return 'neutral';
}

function round2(v) { return Math.round(v * 100) / 100; }
function fmtMl(v) { return v.toFixed(1); }
function fmtPH(p) { return p.toFixed(2); }
function comma(text) { return String(text).replace('.', ','); }

function colorForPH(ph) {
  if (ph <= 7) return mixColor(NEUTRAL_RGB, ACID_RGB, clamp((7 - ph) / 6, 0, 1));
  return mixColor(NEUTRAL_RGB, BASE_RGB, clamp((ph - 7) / 6, 0, 1));
}

// ===================== APPARATUS =====================
function updateScene() {
  const frac = addedVolume / MODEL.buretteMax;

  // burette: the liquid level drops as base is dispensed
  const level = BURETTE_TOP + frac * BURETTE_HEIGHT;
  buretteLiquid.setAttribute('y', level.toFixed(1));
  buretteLiquid.setAttribute('height', (BURETTE_TOP + BURETTE_HEIGHT - level).toFixed(1));

  // flask: the level rises with the total volume and the colour follows the solution's pH
  const flaskY = FLASK_LEVEL_EMPTY - frac * FLASK_LEVEL_RISE;
  flaskLiquid.setAttribute('y', flaskY.toFixed(1));
  flaskLiquid.setAttribute('height', (FLASK_BOTTOM - flaskY).toFixed(1));
  flaskLiquid.setAttribute('fill', colorForPH(phAfterAdding(addedVolume)));

  addedValue.textContent = fmtMl(addedVolume);
  flaskCaption.textContent = `Kolbada: ${comma(fmtMl(MODEL.acidV))} mL kislota + ${comma(fmtMl(addedVolume))} mL ishqor`;
  buretteInfo.textContent = `Burette: ${comma(fmtMl(addedVolume))} mL ishlatildi, ${comma(fmtMl(MODEL.buretteMax - addedVolume))} mL qoldi.`;
  addBtn.disabled = addedVolume >= MODEL.buretteMax;
}

function setReadout(state) {
  // state: a measurement, 'busy', or null
  let text = '—';
  if (state === 'busy') text = '…';
  else if (state) text = fmtPH(state.pH);
  phValue.textContent = text;
  phReading.textContent = text;
}

// ===================== FREE NAVIGATION =====================
createStageNav({
  stepsList,
  stages: [
    { el: document.getElementById('investigation') },
    { el: workspace },
    { el: analysisPanel },
    { el: conclusionPanel },
    { el: challengePanel },
    { el: resultsPanel },
    { el: quizPanel }
  ]
});

// ===================== PREDICTION (optional, changeable at any time) =====================
function predictionText() {
  return prediction ? `«${PREDICTION_LABEL[prediction]}»` : null;
}

function syncPrediction() {
  predictionOptions.querySelectorAll('.prediction-option').forEach((b) => {
    const selected = b.dataset.value === prediction;
    b.classList.toggle('selected', selected);
    b.setAttribute('aria-checked', selected ? 'true' : 'false');
  });
  predictionNote.textContent = prediction
    ? `Bashoratingiz: ${predictionText()}. Uni istalgan payt o‘zgartirishingiz yoki bekor qilishingiz mumkin.`
    : 'Bashorat ixtiyoriy. Yuqoridagi bosqichlar panelidan istalgan bosqichga istalgan paytda o‘tishingiz mumkin.';
}

predictionOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('.prediction-option');
  if (!btn) return;
  prediction = prediction === btn.dataset.value ? null : btn.dataset.value;   // click again to clear
  syncPrediction();
  refreshFeedback();
});

// ===================== ADDING BASE AND MEASURING =====================
amountSlider.addEventListener('input', () => {
  updateSliderFill(amountSlider);
  amountValue.textContent = parseFloat(amountSlider.value).toFixed(1);
});

// Anything that changes the flask makes the old pH reading outdated.
function invalidateMeasurement() {
  clearTimeout(measureTimer);
  measuring = false;
  measureBtn.disabled = false;
  recordBtn.disabled = true;
  recordStatus.textContent = '';
  measurement = null;
  setReadout(null);
}

function doAdd() {
  const amount = parseFloat(amountSlider.value);
  const newVolume = Math.min(MODEL.buretteMax, round2(addedVolume + amount));
  const actuallyAdded = round2(newVolume - addedVolume);
  if (actuallyAdded <= 0) return;

  addedVolume = newVolume;
  invalidateMeasurement();
  updateScene();

  let text = `${comma(fmtMl(actuallyAdded))} mL ishqor qo‘shildi. Kolbada jami ${comma(fmtMl(addedVolume))} mL ishqor. Eritma rangini kuzating; pH ni ko‘rish uchun «pH o‘lchash» ni bosing.`;
  if (actuallyAdded < amount - 1e-9) text = `Burette bo‘shadi: faqat ${comma(fmtMl(actuallyAdded))} mL qo‘shildi (jami ${comma(fmtMl(addedVolume))} mL). «Yangi kolba» bilan burette qayta to‘ladi.`;
  observationText.textContent = text;
}

function describeChange(name, unit, from, to, decimals) {
  const diff = to - from;
  if (Math.abs(diff) < 1e-9) return `${name} o‘zgarmadi`;
  return `${name} ${Math.abs(diff).toFixed(decimals)} ${unit} ga ${diff > 0 ? 'ortdi' : 'kamaydi'}`;
}

function observationFor(m, prev) {
  let text = `O‘lchandi: ${fmtMl(m.V)} mL ishqor qo‘shilganda pH = ${fmtPH(m.pH)}.`;
  if (prev) {
    text += ` Oldingi o‘lchov: ${fmtMl(prev.V)} mL da pH ${fmtPH(prev.pH)}; `
      + `${describeChange('ishqor', 'mL', prev.V, m.V, 1)}, ${describeChange('pH', '', prev.pH, m.pH, 2).replace('  ', ' ')}.`;
  }
  return text;
}

function doMeasure() {
  if (measuring) return;
  measuring = true;
  measureBtn.disabled = true;
  recordBtn.disabled = true;
  recordStatus.textContent = '';
  setReadout('busy');

  const volumeNow = addedVolume;   // the flask as it is when the button is pressed

  measureTimer = setTimeout(() => {
    measuring = false;
    measureBtn.disabled = false;

    const m = { V: volumeNow, pH: phAfterAdding(volumeNow), recorded: false };
    observationText.textContent = observationFor(m, lastMeasured);
    lastMeasured = m;
    measurement = m;
    setReadout(m);
    recordBtn.disabled = trials.length >= MAX_TRIALS;
    if (trials.length >= MAX_TRIALS) {
      recordStatus.textContent = `Jadvalda ${MAX_TRIALS} ta qator bor (o‘qish qulay bo‘lishi uchun chegara). Ba’zi qatorlarni o‘chirsangiz, yangisini yozishingiz mumkin.`;
    }
  }, MEASURE_DELAY_MS);
}

function doRecord() {
  if (!measurement || measurement.recorded || trials.length >= MAX_TRIALS) return;
  const repeated = trials.some((t) => t.V === measurement.V);
  trials.push({ V: measurement.V, pH: measurement.pH });
  measurement.recorded = true;
  recordBtn.disabled = true;
  recordStatus.textContent = `Yozildi: №${trials.length} — ${fmtMl(measurement.V)} mL, pH ${fmtPH(measurement.pH)}.`
    + (repeated ? ' Bu hajm jadvalda bor edi — takroriy o‘lchovda natija bir xil chiqdi.' : '');
  onTrialsChanged(trials.length - 1);
}

function doNewFlask() {
  addedVolume = 0;
  lastMeasured = null;
  invalidateMeasurement();
  updateScene();
  observationText.textContent = 'Yangi kolba: 25,0 mL 0,100 M HCl, burette to‘ldirilgan. Jadvaldagi o‘lchovlar saqlanib qoldi.';
}

addBtn.addEventListener('click', doAdd);
measureBtn.addEventListener('click', doMeasure);
recordBtn.addEventListener('click', doRecord);
newFlaskBtn.addEventListener('click', doNewFlask);

// ===================== DATA HELPERS =====================
// Recorded rows, sorted by volume, one point per volume (repeats give the same pH).
function sortedPoints() {
  const seen = new Set();
  const points = [];
  trials.slice().sort((a, b) => a.V - b.V).forEach((t) => {
    if (!seen.has(t.V)) { seen.add(t.V); points.push(t); }
  });
  return points;
}

// What the student's own data shows. `usable` is false while there are fewer than 2 different
// volumes — the questions then explain that, instead of refusing to answer.
// `complete` says whether the data already cover both sides of the neutral point.
function analyseData() {
  const pts = sortedPoints();
  const hasAcidic = pts.some((p) => p.pH < 6);
  const hasBasic = pts.some((p) => p.pH > 8);
  if (pts.length < 2) return { usable: false, count: pts.length, hasAcidic, hasBasic };

  const first = pts[0];
  const last = pts[pts.length - 1];

  const intervals = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    intervals.push({ a, b, dV: b.V - a.V, dpH: b.pH - a.pH, slope: (b.pH - a.pH) / (b.V - a.V) });
  }
  const steepest = intervals.reduce((best, iv) => (iv.slope > best.slope ? iv : best), intervals[0]);
  const meanSlope = (last.pH - first.pH) / (last.V - first.V);

  const crossIdx = intervals.findIndex((iv) => (iv.a.pH - 7) * (iv.b.pH - 7) <= 0);
  const steepIdx = intervals.indexOf(steepest);
  let where = null;                       // only meaningful once the data have crossed pH 7
  if (crossIdx >= 0) where = Math.abs(steepIdx - crossIdx) <= 1 ? 'near' : (steepIdx < crossIdx ? 'start' : 'end');

  let trend = 'same';
  if (last.pH > first.pH + 0.05) trend = 'up';
  else if (last.pH < first.pH - 0.05) trend = 'down';

  return {
    usable: true,
    count: pts.length,
    complete: hasAcidic && hasBasic,
    pts, first, last, intervals, steepest, meanSlope,
    crossing: crossIdx >= 0 ? intervals[crossIdx] : null,
    where,
    trend,
    shape: steepest.slope >= 2.5 * meanSlope ? 'jump' : 'gradual'
  };
}

// Said instead of a verdict while the table is too small to judge an answer.
function needDataMessage(a) {
  return a.count === 0
    ? 'Jadval hozircha bo‘sh, shuning uchun javobingizni solishtiradigan ma’lumot yo‘q. O‘lchov qo‘shsangiz, bu javob avtomatik qayta baholanadi.'
    : 'Jadvalda hozircha bitta hajmdagi o‘lchov bor — javobingizni solishtirish uchun yana o‘lchov qo‘shing. Qo‘shsangiz, bu javob avtomatik qayta baholanadi.';
}

const PARTIAL_NOTE = ' (Ma’lumotlaringiz hali neytrallanish nuqtasining ikki tomonini qamramagan, shuning uchun bu hozirgi o‘lchovlarga ko‘ra baho.)';

// How well did the prediction match? 'yes' | 'partly' | 'no'
function predictionVerdict(pred, a) {
  if (pred === 'jump') return a.shape === 'jump' ? 'yes' : 'partly';
  if (pred === 'linear') return a.shape === 'jump' ? 'partly' : 'yes';
  if (pred === 'stop7') return a.last.pH <= 7.5 ? 'yes' : 'partly';
  return 'no';   // 'down' and 'flat' contradict a rising pH
}

// ===================== TABLE =====================
function renderTable(newIndex) {
  dataBody.innerHTML = '';

  if (trials.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'table-empty';
    td.textContent = 'Hali o‘lchov yo‘q. Ishqor qo‘shing, «pH o‘lchash», so‘ng «Jadvalga yozish» tugmasini bosing.';
    tr.appendChild(td);
    dataBody.appendChild(tr);
    return;
  }

  trials.forEach((t, i) => {
    const tr = document.createElement('tr');
    [i + 1, fmtMl(t.V), fmtPH(t.pH)].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });

    const actionTd = document.createElement('td');
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'row-delete';
    del.dataset.index = i;
    del.textContent = '✕';
    del.setAttribute('aria-label', `${i + 1}-o‘lchovni o‘chirish`);
    actionTd.appendChild(del);
    tr.appendChild(actionTd);

    if (i === newIndex) {
      tr.classList.add('row-new');
      setTimeout(() => tr.classList.remove('row-new'), 1200);
    }
    dataBody.appendChild(tr);
  });
}

dataBody.addEventListener('click', (e) => {
  const del = e.target.closest('.row-delete');
  if (!del) return;
  trials.splice(parseInt(del.dataset.index, 10), 1);
  onTrialsChanged();
});

clearBtn.addEventListener('click', () => {
  trials = [];
  recordStatus.textContent = '';
  onTrialsChanged();
});

// ===================== GRAPH (drawn only from `trials`) =====================
const GX0 = 46, GX1 = 360, GY0 = 180, GY1 = 10;
const X_MAX = MODEL.buretteMax;   // mL
const Y_MAX = 14;                 // pH

function svgEl(name, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
  return el;
}

function renderGraph() {
  graphDynamic.innerHTML = '';

  const xOf = (v) => GX0 + (v / X_MAX) * (GX1 - GX0);
  const yOf = (p) => GY0 - (p / Y_MAX) * (GY0 - GY1);

  // grid + tick labels
  for (let p = 0; p <= Y_MAX; p += 2) {
    const y = yOf(p);
    if (p > 0) graphDynamic.appendChild(svgEl('line', { x1: GX0, y1: y, x2: GX1, y2: y, class: 'graph-grid' }));
    const label = svgEl('text', { x: GX0 - 6, y: y + 3, 'text-anchor': 'end', class: 'graph-axis-label' });
    label.textContent = p;
    graphDynamic.appendChild(label);
  }
  for (let v = 0; v <= X_MAX; v += 10) {
    const x = xOf(v);
    if (v > 0) graphDynamic.appendChild(svgEl('line', { x1: x, y1: GY1, x2: x, y2: GY0, class: 'graph-grid' }));
    const label = svgEl('text', { x: x, y: GY0 + 14, 'text-anchor': 'middle', class: 'graph-axis-label' });
    label.textContent = v;
    graphDynamic.appendChild(label);
  }

  // reference line at pH 7 (a fixed marker, not data)
  graphDynamic.appendChild(svgEl('line', { x1: GX0, y1: yOf(7), x2: GX1, y2: yOf(7), class: 'graph-guide' }));
  const neutralLabel = svgEl('text', { x: GX1 - 2, y: yOf(7) - 4, 'text-anchor': 'end', class: 'graph-axis-label' });
  neutralLabel.textContent = 'pH 7';
  graphDynamic.appendChild(neutralLabel);

  const pts = sortedPoints();

  // a line joining the MEASURED points (never a model curve, never points the student did not record)
  if (pts.length >= 2) {
    const points = pts.map((t) => `${xOf(t.V).toFixed(1)},${yOf(t.pH).toFixed(1)}`).join(' ');
    graphDynamic.appendChild(svgEl('polyline', { points, class: 'graph-curve' }));
  }

  trials.forEach((t, i) => {
    const dot = svgEl('circle', { cx: xOf(t.V).toFixed(1), cy: yOf(t.pH).toFixed(1), r: 5, class: 'graph-marker' });
    const title = svgEl('title', {});
    title.textContent = `№${i + 1}: ${fmtMl(t.V)} mL, pH ${fmtPH(t.pH)}`;
    dot.appendChild(title);
    graphDynamic.appendChild(dot);
  });

  // status: says what the graph shows so far — never what the student "must" do
  graphStatus.classList.remove('ready');
  const a = analyseData();
  if (trials.length === 0) {
    graphStatus.textContent = 'Grafik hozircha bo‘sh. O‘lchovlarni jadvalga yozsangiz, har bir qator grafikda nuqta bo‘ladi.';
  } else if (pts.length < 2) {
    graphStatus.textContent = 'Hozircha bitta nuqta bor. Boshqa hajmlarda ham o‘lchasangiz, ularni bog‘lovchi chiziq chiziladi.';
  } else if (!a.hasBasic) {
    graphStatus.textContent = `${pts.length} ta nuqta bor, hammasi pH 8 dan past. Ishqor qo‘shishni davom ettirsangiz, neytrallanishdagi keskin sakrashni ko‘rasiz.`;
  } else if (!a.hasAcidic) {
    graphStatus.textContent = `${pts.length} ta nuqta bor, hammasi pH 6 dan yuqori. Yangi kolba bilan kichikroq hajmlarda ham o‘lchasangiz, egri chiziqning boshini ko‘rasiz.`;
  } else {
    graphStatus.classList.add('ready');
    graphStatus.textContent = `${pts.length} ta turli hajm, pH ${fmtPH(pts[0].pH)} dan ${fmtPH(pts[pts.length - 1].pH)} gacha — egri chiziq ikki tomonni qamragan.`;
  }
}

// ===================== ANY CHANGE TO THE DATA =====================
function onTrialsChanged(newIndex) {
  renderTable(newIndex);
  renderGraph();
  clearBtn.disabled = trials.length === 0;

  // a deleted/cleared row may free a slot
  if (measurement && !measurement.recorded && trials.length < MAX_TRIALS) recordBtn.disabled = false;

  refreshAnalysisOptions();
  refreshFeedback();
}

// Re-judge everything that depends on the data or the prediction.
function refreshFeedback() {
  Object.keys(analysisAnswers).forEach(paintAnswer);
  if (conclusionShown) paintConclusion();
  renderResults();
}

function showFeedback(box, ok, paragraphs) {
  box.innerHTML = '';
  paragraphs.forEach((text) => {
    const p = document.createElement('p');
    p.textContent = text;
    box.appendChild(p);
  });
  box.classList.remove('hidden');
  box.classList.toggle('wrong', ok === false);
}

// ===================== ANALYSIS (free: pick any option, any time, as often as you like) =====================
function intervalLabel(iv) { return `${fmtMl(iv.a.V)} → ${fmtMl(iv.b.V)} mL`; }
function intervalValue(iv) { return `${iv.a.V}|${iv.b.V}`; }
function findInterval(a, value) { return a.intervals.find((iv) => intervalValue(iv) === value); }
function intervalFact(iv) { return `${intervalLabel(iv)}: pH ${fmtPH(iv.a.pH)} → ${fmtPH(iv.b.pH)}`; }

const STALE_INTERVAL = { ok: null, msg: 'Jadval o‘zgargan: bu oraliq endi mavjud emas. Yangi oraliqlardan birini tanlang.' };

// check() looks at the student's CURRENT data and explains with their own numbers.
// `dynamic` questions list the intervals of the current table.
const analysisDefs = [
  {
    id: 'trend',
    prompt: 'Ishqor qo‘shilgani sari pH qanday o‘zgardi?',
    options: () => [
      { value: 'up', label: 'Ortdi' },
      { value: 'down', label: 'Kamaydi' },
      { value: 'same', label: 'O‘zgarmadi' }
    ],
    check(value, cur) {
      const evidence = `${fmtMl(cur.first.V)} mL da pH = ${fmtPH(cur.first.pH)}, ${fmtMl(cur.last.V)} mL da pH = ${fmtPH(cur.last.pH)}`;
      if (value === cur.trend) return { ok: true, msg: `Ma’lumotlaringizga mos: ${evidence}.` };
      return { ok: false, msg: `Jadvalda: ${evidence} — pH ${TREND_LABEL[cur.trend]}. Siz boshqacha tanladingiz; xohlasangiz yana o‘lchab tekshirib ko‘ring.` };
    }
  },
  {
    id: 'steepest',
    prompt: 'Qaysi oraliqda pH eng tez o‘zgardi? (Oraliq uzunligini hisobga oling: pH / mL.)',
    dynamic: true,
    layout: 'grid',
    options: (a) => (a.usable ? a.intervals.map((iv) => ({ value: intervalValue(iv), label: intervalLabel(iv) })) : []),
    check(value, cur) {
      const iv = findInterval(cur, value);
      if (!iv) return STALE_INTERVAL;
      if (iv.slope >= 0.75 * cur.steepest.slope) {
        return { ok: true, msg: `${intervalFact(iv)} — ${iv.slope.toFixed(2)} pH/mL. Bu jadvaldagi eng tik oraliqlardan biri (eng kattasi ${cur.steepest.slope.toFixed(2)} pH/mL).` };
      }
      return { ok: false, msg: `${intervalFact(iv)} — atigi ${iv.slope.toFixed(2)} pH/mL, eng tik oraliqda esa ${cur.steepest.slope.toFixed(2)} pH/mL (${intervalLabel(cur.steepest)}).` };
    }
  },
  {
    id: 'neutral',
    prompt: 'Eritma qaysi oraliqda neytral (pH = 7) holatdan o‘tdi?',
    dynamic: true,
    layout: 'grid',
    options: (a) => (a.usable ? a.intervals.map((iv) => ({ value: intervalValue(iv), label: intervalLabel(iv) })) : []),
    check(value, cur) {
      const iv = findInterval(cur, value);
      if (!iv) return STALE_INTERVAL;
      if ((iv.a.pH - 7) * (iv.b.pH - 7) <= 0) {
        return { ok: true, msg: `${intervalFact(iv)} — pH 7 shu oraliqda. Neytrallanish nuqtasi taxminan ${fmtMl(iv.a.V)} va ${fmtMl(iv.b.V)} mL orasida.` };
      }
      return {
        ok: false,
        msg: cur.crossing
          ? `${intervalFact(iv)} — bu oraliq pH 7 ni kesib o‘tmaydi. Jadvalda pH 7 ${intervalLabel(cur.crossing)} oralig‘ida o‘tgan.`
          : `${intervalFact(iv)} — bu oraliq pH 7 ni kesib o‘tmaydi. Jadvaldagi hech bir oraliqda pH 7 dan o‘tilmagan: hali neytrallanish nuqtasigacha yetmagansiz.`
      };
    }
  },
  {
    id: 'excess',
    prompt: 'Neytrallanish nuqtasidan keyin ishqor qo‘shishni davom ettirganda eritma qanday bo‘ladi?',
    options: () => [
      { value: 'acid', label: 'Kislotali (pH < 7)' },
      { value: 'neutral', label: 'Taxminan neytral' },
      { value: 'base', label: 'Ishqoriy (pH > 7)' }
    ],
    check(value, cur) {
      const fact = `${fmtMl(cur.last.V)} mL da pH = ${fmtPH(cur.last.pH)}`;
      const actual = classify(cur.last.pH);
      if (value === actual) {
        return { ok: true, msg: `Jadvaldagi oxirgi o‘lchov: ${fact}.${actual === 'base' ? ' Kislota tugagach, qo‘shilgan har bir mL ishqor ortiqcha OH⁻ beradi.' : ' Bu hali neytrallanishdan oldingi holat.'}` };
      }
      return {
        ok: false,
        msg: cur.last.pH < 7
          ? `Jadvaldagi oxirgi o‘lchov: ${fact} — pH hali 7 dan past, ya’ni siz neytrallanish nuqtasiga yetmagansiz. Ishqor qo‘shishni davom ettirsangiz nima bo‘lishini o‘zingiz ko‘rasiz.`
          : `Jadvaldagi oxirgi o‘lchov: ${fact} — pH 7 dan yuqori, eritma ${STATE_LABEL[actual]}.`
      };
    }
  },
  {
    id: 'prediction',
    prompt: 'O‘lchovlaringiz bashoratingizni qo‘llab-quvvatladimi?',
    options: () => [
      { value: 'yes', label: 'Ha, to‘liq' },
      { value: 'partly', label: 'Qisman' },
      { value: 'no', label: 'Yo‘q' }
    ],
    check(value, cur) {
      if (!prediction) {
        return { ok: null, msg: 'Siz bashorat tanlamagansiz, shuning uchun solishtiradigan narsa yo‘q. Yuqorida bashorat tanlab ko‘ring — javob avtomatik qayta baholanadi.' };
      }
      const verdict = predictionVerdict(prediction, cur);
      const mine = `Bashoratingiz: ${predictionText()}.`;
      const data = `Ma’lumotlar: pH ${fmtPH(cur.first.pH)} dan ${fmtPH(cur.last.pH)} gacha ${TREND_LABEL[cur.trend]}; eng tez o‘zgarish ${intervalLabel(cur.steepest)} oralig‘ida `
        + `(${cur.steepest.slope.toFixed(2)} pH/mL, o‘rtacha ${cur.meanSlope.toFixed(2)} pH/mL), ${cur.last.pH > 7 ? '7 dan o‘tib ketdi' : '7 ga yetmadi'}.`;
      return { ok: value === verdict, msg: `${mine} ${data}${cur.complete ? '' : PARTIAL_NOTE}` };
    }
  }
];

const analysisUI = {};   // question id → { optsDiv, feedback }

function createAnalysisQuestion(def, idx) {
  const qDiv = document.createElement('div');
  qDiv.className = 'quiz-question';

  const qText = document.createElement('p');
  qText.className = 'quiz-question-text';
  qText.textContent = `${idx + 1}. ${def.prompt}`;
  qDiv.appendChild(qText);

  const optsDiv = document.createElement('div');
  optsDiv.className = def.layout === 'grid' ? 'quiz-options quiz-options-grid' : 'quiz-options';

  const feedback = document.createElement('p');
  feedback.className = 'quiz-feedback hidden';
  feedback.setAttribute('aria-live', 'polite');

  qDiv.appendChild(optsDiv);
  qDiv.appendChild(feedback);
  analysisUI[def.id] = { optsDiv, feedback };
  renderAnalysisOptions(def);
  return qDiv;
}

// (Re)build the option buttons of one question from the current data.
function renderAnalysisOptions(def) {
  const ui = analysisUI[def.id];
  const options = def.options(analyseData());
  ui.optsDiv.innerHTML = '';

  if (options.length === 0) {
    const note = document.createElement('p');
    note.className = 'quiz-note';
    note.textContent = 'Oraliqlar jadvaldagi o‘lchovlardan tuziladi. Hozircha oraliq yo‘q — kamida ikki xil hajmda o‘lchasangiz, variantlar shu yerda paydo bo‘ladi.';
    ui.optsDiv.appendChild(note);
    return;
  }
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.dataset.value = opt.value;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      analysisAnswers[def.id] = opt.value;
      paintAnswer(def.id);
    });
    ui.optsDiv.appendChild(btn);
  });
}

// Only the questions whose options come from the table change when the data change.
function refreshAnalysisOptions() {
  analysisDefs.filter((d) => d.dynamic).forEach(renderAnalysisOptions);
}

// Show the picked option and what the data says about it.
function paintAnswer(id) {
  const def = analysisDefs.find((d) => d.id === id);
  const ui = analysisUI[id];
  const value = analysisAnswers[id];
  const buttons = [...ui.optsDiv.querySelectorAll('.quiz-option')];
  buttons.forEach((b) => b.classList.remove('selected', 'correct', 'incorrect'));
  if (value === undefined) { ui.feedback.classList.add('hidden'); return; }

  const a = analyseData();
  const result = a.usable ? def.check(value, a) : { ok: null, msg: needDataMessage(a) };
  const btn = buttons.find((b) => b.dataset.value === value);
  if (btn) btn.classList.add(result.ok === true ? 'correct' : result.ok === false ? 'incorrect' : 'selected');
  ui.feedback.textContent = result.msg;
  ui.feedback.classList.remove('hidden');
  ui.feedback.classList.toggle('wrong', result.ok === false);
}

analysisDefs.forEach((def, idx) => analysisList.appendChild(createAnalysisQuestion(def, idx)));

// ===================== CONCLUSION (can be checked at any time, as often as you like) =====================
function paintConclusion() {
  const trend = trendSelect.value;
  const where = whereSelect.value;
  const excess = excessSelect.value;
  if (!trend && !where && !excess) {
    showFeedback(conclusionFeedback, null, ['Gapdagi bo‘shliqlarning birini yoki bir nechtasini tanlang — tanlovingiz ma’lumotlaringiz bilan solishtiriladi.']);
    return;
  }

  const a = analyseData();
  if (!a.usable) {
    showFeedback(conclusionFeedback, null, [needDataMessage(a)]);
    return;
  }

  const good = [];
  const notes = [];
  const info = [];

  if (trend) {
    if (trend === a.trend) good.push(`pH ${TREND_LABEL[trend]} (${fmtMl(a.first.V)} mL da ${fmtPH(a.first.pH)}, ${fmtMl(a.last.V)} mL da ${fmtPH(a.last.pH)})`);
    else notes.push(`Siz «${TREND_LABEL[trend]}» dedingiz, lekin jadvalda ${fmtMl(a.first.V)} mL da pH = ${fmtPH(a.first.pH)}, `
      + `${fmtMl(a.last.V)} mL da esa pH = ${fmtPH(a.last.pH)}.`);
  }

  if (where) {
    if (a.where === null) {
      info.push(`Eng tez o‘zgarish hozircha ${intervalLabel(a.steepest)} oralig‘ida (${a.steepest.slope.toFixed(2)} pH/mL), lekin ma’lumotlaringiz pH 7 dan o‘tmagan — «${WHERE_LABEL[where]}» degan fikrni hali pH 7 ga nisbatan solishtirib bo‘lmaydi.`);
    } else if (where === a.where) {
      good.push(`eng tez o‘zgarish ${WHERE_LABEL[where]} — ${intervalLabel(a.steepest)} oralig‘ida (${a.steepest.slope.toFixed(2)} pH/mL, o‘rtacha ${a.meanSlope.toFixed(2)} pH/mL)`);
    } else {
      notes.push(`Eng tez o‘zgarish ${intervalLabel(a.steepest)} oralig‘ida bo‘lgan (${a.steepest.slope.toFixed(2)} pH/mL), o‘rtacha esa ${a.meanSlope.toFixed(2)} pH/mL. `
        + `pH 7 ${intervalLabel(a.crossing)} oralig‘ida o‘tgan — ya’ni eng tez o‘zgarish «${WHERE_LABEL[a.where]}» bo‘lgan.`);
    }
  }

  if (excess) {
    if (excess === classify(a.last.pH)) good.push(`oxirgi o‘lchovda eritma ${STATE_LABEL[excess]} (${fmtMl(a.last.V)} mL da pH ${fmtPH(a.last.pH)})`);
    else notes.push(`Jadvaldagi oxirgi o‘lchov: ${fmtMl(a.last.V)} mL da pH = ${fmtPH(a.last.pH)} — eritma ${STATE_LABEL[classify(a.last.pH)]}.`);
  }

  const paragraphs = [];
  if (good.length) paragraphs.push(`Ma’lumotlaringizga mos: ${good.join('; ')}.`);
  notes.forEach((n) => paragraphs.push(n));
  info.forEach((n) => paragraphs.push(n));

  // all three parts chosen and all agree → connect with the chemistry and the prediction
  if (!notes.length && !info.length && trend && where && excess) {
    paragraphs.push('Sababi: neytrallanish nuqtasi yaqinida ortiqcha H⁺ juda oz qoladi, shuning uchun bir necha tomchi ishqor ham [H⁺] ni ko‘p marta o‘zgartiradi; pH esa logarifmik shkala (1 birlik — 10 marta).');
    if (prediction) {
      const verdictText = {
        yes: 'o‘lchovlar bilan to‘liq mos keldi',
        partly: 'qisman mos keldi: pH ning ortishini to‘g‘ri aytgansiz, lekin egri chiziq shakli boshqacha chiqdi',
        no: 'o‘lchovlarga mos kelmadi'
      }[predictionVerdict(prediction, a)];
      paragraphs.push(`Bashoratingiz ${predictionText()} ${verdictText}.`);
    }
  } else if (!notes.length && !(trend && where && excess)) {
    paragraphs.push('Qolgan bo‘shliqlarni ham tanlab ko‘ring — ularni ham ma’lumotlaringiz bilan solishtiramiz.');
  }

  showFeedback(conclusionFeedback, notes.length ? false : true, paragraphs);
}

conclusionBtn.addEventListener('click', () => {
  conclusionShown = true;
  paintConclusion();
});
[trendSelect, whereSelect, excessSelect].forEach((s) => s.addEventListener('change', () => {
  if (conclusionShown) paintConclusion();
}));

// ===================== CHALLENGE (computed with the same model; every choice shows the calculation) =====================
// The scenario uses a 0.200 M base, so comparing VOLUMES is not enough — the amounts (mol) matter.
// Whatever the student picks, the page shows what the model calculates for it.
const CHALLENGE_STAGES = [
  { baseC: 0.200, baseV: 12.5, prompt: 'Burettadan 12,5 mL ishqor qo‘shildi (kislota hajmining yarmi). Eritma qanday bo‘ladi?' },
  { baseC: 0.200, baseV: 15.0, prompt: 'Xuddi shu 0,200 M ishqordan yana 2,5 mL qo‘shildi (jami 15,0 mL). Endi eritma qanday?' }
];
const CHALLENGE_OPTIONS = [
  { value: 'acid', label: 'Kislotali' },
  { value: 'neutral', label: 'Taxminan neytral' },
  { value: 'base', label: 'Ishqoriy' }
];

function mmol(n) { return comma((n * 1000).toFixed(2)); }

function molesLine(stage, r) {
  return `H⁺: 0,100 M × ${comma(fmtMl(MODEL.acidV))} mL = ${mmol(r.nAcid)} mmol; `
    + `OH⁻: ${comma(stage.baseC.toFixed(3))} M × ${comma(fmtMl(stage.baseV))} mL = ${mmol(r.nBase)} mmol.`;
}

function outcomeLine(stage, r) {
  const total = comma(fmtMl(MODEL.acidV + stage.baseV));
  const pH = comma(fmtPH(r.pH));
  if (Math.abs(r.nAcid - r.nBase) < 1e-12) return `Miqdorlar teng — neytrallanish nuqtasi, pH = ${pH}.`;
  if (r.nAcid > r.nBase) return `Ortiqcha H⁺: ${mmol(r.nAcid - r.nBase)} mmol, jami hajm ${total} mL → [H⁺] = ${comma(r.x.toFixed(4))} M, pH = ${pH}.`;
  return `Ortiqcha OH⁻: ${mmol(r.nBase - r.nAcid)} mmol, jami hajm ${total} mL → [OH⁻] = ${comma((-r.x).toFixed(4))} M, pH = ${pH}.`;
}

const challengeUI = [];   // per stage: { optsDiv, feedback }

function createChallengeQuestion(stage, idx) {
  const qDiv = document.createElement('div');
  qDiv.className = 'quiz-question';

  const qText = document.createElement('p');
  qText.className = 'quiz-question-text';
  qText.textContent = `${idx + 1}. ${stage.prompt}`;
  qDiv.appendChild(qText);

  const optsDiv = document.createElement('div');
  optsDiv.className = 'quiz-options';

  const feedback = document.createElement('p');
  feedback.className = 'quiz-feedback hidden';
  feedback.setAttribute('aria-live', 'polite');

  CHALLENGE_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      challengeAttempts++;
      const r = computePH(MODEL.acidC, MODEL.acidV, stage.baseC, stage.baseV);
      const expected = classify(r.pH);
      const match = opt.value === expected;
      challengeAnswers[idx] = match;

      optsDiv.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('selected', 'correct', 'incorrect'));
      btn.classList.add(match ? 'correct' : 'incorrect');
      feedback.textContent = `Siz «${opt.label}» dedingiz. Hisob: ${molesLine(stage, r)} ${outcomeLine(stage, r)} `
        + (match ? 'Tanlovingiz hisobga mos.' : `Hisobga ko‘ra eritma ${STATE_LABEL[expected]}.`);
      feedback.classList.remove('hidden');
      feedback.classList.toggle('wrong', !match);
      renderResults();
    });
    optsDiv.appendChild(btn);
  });

  qDiv.appendChild(optsDiv);
  qDiv.appendChild(feedback);
  challengeUI[idx] = { optsDiv, feedback };
  return qDiv;
}

CHALLENGE_STAGES.forEach((stage, idx) => challengeList.appendChild(createChallengeQuestion(stage, idx)));

// ===================== RESULTS (a live summary of the current state, any time) =====================
function renderResults() {
  const a = analyseData();
  document.getElementById('finalTrials').textContent = trials.length;
  document.getElementById('finalNeutral').textContent = (a.usable && a.crossing)
    ? `${fmtMl(a.crossing.a.V)}–${fmtMl(a.crossing.b.V)}`
    : '—';
  document.getElementById('finalRange').textContent = a.usable ? `${fmtPH(a.first.pH)} → ${fmtPH(a.last.pH)}` : '—';
  const solved = CHALLENGE_STAGES.every((_, i) => challengeAnswers[i] === true);
  document.getElementById('finalChallenge').textContent = solved
    ? `✓ (${challengeAttempts} javob)`
    : (challengeAttempts ? `${challengeAttempts} javob` : '—');
}

// ===================== QUIZ DATA (a free knowledge check) =====================
const quizData = [
  {
    q: 'pH 7 nimani bildiradi?',
    options: ['Kislotali', 'Neytral', 'Ishqoriy'],
    correct: 'Neytral'
  },
  {
    q: 'Agar kislota miqdori ko‘proq bo‘lsa, aralashma qanday bo‘ladi?',
    options: ['Kislotali', 'Neytral', 'Ishqoriy'],
    correct: 'Kislotali'
  },
  {
    q: 'Agar ishqor miqdori ko‘proq bo‘lsa, aralashma qanday bo‘ladi?',
    options: ['Kislotali', 'Neytral', 'Ishqoriy'],
    correct: 'Ishqoriy'
  }
];

// ===================== RESET (also used for the initial state) =====================
function resetExperiment() {
  clearTimeout(measureTimer);
  measuring = false;

  prediction = null;
  addedVolume = 0;
  measurement = null;
  lastMeasured = null;
  trials = [];
  analysisAnswers = {};
  conclusionShown = false;
  challengeAnswers = {};
  challengeAttempts = 0;

  syncPrediction();

  // apparatus + controls
  amountSlider.value = DEFAULT_AMOUNT;
  updateSliderFill(amountSlider);
  amountValue.textContent = DEFAULT_AMOUNT.toFixed(1);
  setReadout(null);
  measureBtn.disabled = false;
  recordBtn.disabled = true;
  updateScene();
  observationText.textContent = 'Ishqor qo‘shing, so‘ng «pH o‘lchash» tugmasini bosing.';
  recordStatus.textContent = '';

  // data
  renderTable();
  renderGraph();
  clearBtn.disabled = true;

  // answers
  refreshAnalysisOptions();
  Object.keys(analysisUI).forEach(paintAnswer);
  [trendSelect, whereSelect, excessSelect].forEach((s) => { s.value = ''; });
  conclusionFeedback.classList.add('hidden');
  conclusionFeedback.innerHTML = '';
  challengeUI.forEach((ui) => {
    ui.optsDiv.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('selected', 'correct', 'incorrect'));
    ui.feedback.classList.add('hidden');
  });
  renderResults();

  buildQuiz(quizList, quizScore, quizData);
}

resetBtn.addEventListener('click', resetExperiment);

// ===================== INIT =====================
resetExperiment();
