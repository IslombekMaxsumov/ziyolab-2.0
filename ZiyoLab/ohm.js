// =====================================================================
// ohm.js — Ohm's law, a free-exploration investigation
//
// Every section (prediction, measuring, data, analysis, conclusion, challenge,
// results, quiz) is on the page from the start and works in ANY order:
//   • nothing is locked and nothing has to be completed first
//   • a wrong or unusual choice is never refused — the page shows what the data
//     (or the circuit) says about it
//   • answers are re-judged live: change a measurement, the prediction or an
//     answer and the feedback follows
//
// Scientific model (the ONLY source of numbers on this page):
//   I = V / R        (A)  current
//   P = V · I        (W)  power
// Every reading, table row, graph point and answer check below comes
// from measureCircuit(). Nothing is random or pre-filled.
//
// clamp, mixColor and updateSliderFill come from lab-common.js; buildQuiz
// from quiz.js; createStageNav from nav.js.
// =====================================================================

// ===================== ELEMENTS =====================
const voltageSlider = document.getElementById('voltageSlider');
const resistanceSlider = document.getElementById('resistanceSlider');
const voltageValue = document.getElementById('voltageValue');
const resistanceValue = document.getElementById('resistanceValue');

const stepsList = document.getElementById('stepsList');

const predictionOptions = document.getElementById('predictionOptions');
const predictionNote = document.getElementById('predictionNote');

const workspace = document.getElementById('workspace');
const measureBtn = document.getElementById('measureBtn');
const recordBtn = document.getElementById('recordBtn');
const observationText = document.getElementById('observationText');
const recordStatus = document.getElementById('recordStatus');
const voltmeterValue = document.getElementById('voltmeterValue');
const ammeterValue = document.getElementById('ammeterValue');
const powerValue = document.getElementById('powerValue');
const ammeterReading = document.getElementById('ammeterReading');
const voltmeterReading = document.getElementById('voltmeterReading');

const dataBody = document.getElementById('dataBody');
const clearBtn = document.getElementById('clearBtn');
const graphDynamic = document.getElementById('graphDynamic');
const graphStatus = document.getElementById('graphStatus');
const graphLegend = document.getElementById('graphLegend');

const analysisPanel = document.getElementById('analysisPanel');
const analysisList = document.getElementById('analysisList');

const conclusionPanel = document.getElementById('conclusionPanel');
const trendSelect = document.getElementById('trendSelect');
const relationSelect = document.getElementById('relationSelect');
const conclusionBtn = document.getElementById('conclusionBtn');
const conclusionFeedback = document.getElementById('conclusionFeedback');

const challengePanel = document.getElementById('challengePanel');
const challengeInput = document.getElementById('challengeInput');
const challengeBtn = document.getElementById('challengeBtn');
const challengeFeedback = document.getElementById('challengeFeedback');

const resultsPanel = document.getElementById('resultsPanel');
const quizPanel = document.getElementById('quizPanel');
const resetBtn = document.getElementById('resetBtn');
const quizList = document.getElementById('quizList');
const quizScore = document.getElementById('quizScore');

// ===================== SETTINGS =====================
const DEFAULT_VOLTAGE = 6;
const DEFAULT_RESISTANCE = 10;
const V_AXIS_MAX = 12;        // matches the voltage slider's maximum
const MAX_TRIALS = 60;        // only so the table and graph stay readable
const LINE_POINTS = 3;        // different voltages after which the graph joins the points
const MEASURE_DELAY_MS = 450; // short pause so the meters feel like they are reading

const CHALLENGE = { R: 12, I: 0.75 };   // the matching voltage is V = I · R = 9 V
const SAFE_POWER_W = 10;                // beyond this an ordinary resistor would overheat

const GREEN_RGB = [73, 99, 79];
const ORANGE_RGB = [200, 107, 61];

const PREDICTION_LABEL = {
  down: 'tok kuchi kamayadi',
  same: 'tok kuchi o‘zgarmaydi',
  up: 'tok kuchi ortadi, lekin kuchlanishga proporsional emas',
  prop: 'tok kuchi kuchlanishga to‘g‘ri proporsional ravishda ortadi'
};

const TREND_LABEL = { up: 'ortadi', down: 'kamayadi', same: 'o‘zgarmaydi' };

// ===================== STATE =====================
let prediction = null;          // 'down' | 'same' | 'up' | 'prop' | null (not chosen)
let measurement = null;         // the reading currently on the meters (or null)
let lastMeasured = null;        // the reading before that, for the observation text
let measuring = false;
let measureTimer = null;
let trials = [];                // recorded rows: { V, R, I }  ← source of table, graph, analysis
let analysisAnswers = {};       // question id → the option the student picked (changeable at any time)
let conclusionShown = false;    // the conclusion has been checked at least once
let challengeAttempts = 0;
let challengeSolved = false;    // shown in the results only; never gates anything

// ===================== MODEL =====================
function measureCircuit(V, R) {
  const I = V / R;
  return { V, R, I, P: V * I };
}

function fmtV(v) { return v.toFixed(1); }
function fmtR(r) { return r.toFixed(0); }
function fmtI(i) { return i.toFixed(2); }

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

// ===================== CIRCUIT REACTION =====================
// Visual only: resistor colour follows R, the dots' speed follows I.
function updateCircuitReaction(resistance, current) {
  const rFrac = clamp((resistance - 1) / (50 - 1), 0, 1);
  const resistorColor = mixColor(GREEN_RGB, ORANGE_RGB, rFrac);
  document.querySelectorAll('.resistor-zigzag').forEach((el) => {
    el.style.stroke = resistorColor;
  });

  const iFrac = clamp(current / 6, 0, 1);
  const duration = (2.6 - iFrac * 2.0).toFixed(2);
  const opacity = (0.5 + iFrac * 0.4).toFixed(2);
  document.querySelectorAll('.current-dot').forEach((dot) => {
    dot.style.animationDuration = duration + 's';
    dot.style.opacity = opacity;
  });
}

function updateSetup() {
  const V = parseFloat(voltageSlider.value);
  const R = parseFloat(resistanceSlider.value);
  voltageValue.textContent = V.toFixed(1);
  resistanceValue.textContent = R.toFixed(0);
  updateCircuitReaction(R, measureCircuit(V, R).I);
}

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

// ===================== MEASURING =====================
function setReadouts(m) {
  // m: a measurement, 'busy', or null (nothing measured)
  let v = '—', a = '—', p = '—';
  if (m === 'busy') {
    v = a = p = '…';
  } else if (m) {
    v = fmtV(m.V);
    a = fmtI(m.I);
    p = fmtI(m.P);
  }
  voltmeterValue.textContent = v;
  ammeterValue.textContent = a;
  powerValue.textContent = p;
  voltmeterReading.textContent = (m && m !== 'busy') ? v + ' V' : v;
  ammeterReading.textContent = (m && m !== 'busy') ? a + ' A' : a;
}

function describeChange(name, unit, from, to, decimals) {
  const diff = to - from;
  if (Math.abs(diff) < 1e-9) return `${name} o‘zgarmadi`;
  const amount = Math.abs(diff).toFixed(decimals);
  return `${name} ${amount} ${unit} ga ${diff > 0 ? 'ortdi' : 'kamaydi'}`;
}

function observationFor(m, prev) {
  let text = `O‘lchandi: V = ${fmtV(m.V)} V, R = ${fmtR(m.R)} Ω → I = ${fmtI(m.I)} A.`;
  if (prev) {
    text += ` Oldingi o‘lchovga nisbatan: ${describeChange('kuchlanish', 'V', prev.V, m.V, 1)}, `
      + `${describeChange('qarshilik', 'Ω', prev.R, m.R, 0)}; `
      + `${describeChange('tok kuchi', 'A', prev.I, m.I, 2)}.`;
  }
  return text;
}

// Called when a slider moves: the reading on the meters belongs to the old settings.
function invalidateMeasurement() {
  clearTimeout(measureTimer);
  measuring = false;
  measureBtn.disabled = false;
  recordBtn.disabled = true;
  recordStatus.textContent = '';
  if (measurement) {
    observationText.textContent = 'Sozlamalar o‘zgardi — yangi qiymatni ko‘rish uchun yana «O‘lchash» ni bosing.';
  }
  measurement = null;
  setReadouts(null);
}

function doMeasure() {
  if (measuring) return;
  measuring = true;
  measureBtn.disabled = true;
  recordBtn.disabled = true;
  recordStatus.textContent = '';
  setReadouts('busy');

  // read the settings at the moment the button was pressed
  const V = parseFloat(voltageSlider.value);
  const R = parseFloat(resistanceSlider.value);

  measureTimer = setTimeout(() => {
    measuring = false;
    measureBtn.disabled = false;

    const m = measureCircuit(V, R);
    m.recorded = false;
    observationText.textContent = observationFor(m, lastMeasured);
    lastMeasured = m;
    measurement = m;
    setReadouts(m);
    recordBtn.disabled = trials.length >= MAX_TRIALS;
    if (trials.length >= MAX_TRIALS) {
      recordStatus.textContent = `Jadvalda ${MAX_TRIALS} ta qator bor (o‘qish qulay bo‘lishi uchun chegara). Ba’zi qatorlarni o‘chirsangiz, yangisini yozishingiz mumkin.`;
    }
  }, MEASURE_DELAY_MS);
}

function doRecord() {
  if (!measurement || measurement.recorded || trials.length >= MAX_TRIALS) return;
  trials.push({ V: measurement.V, R: measurement.R, I: measurement.I });
  measurement.recorded = true;
  recordBtn.disabled = true;
  recordStatus.textContent = `Yozildi: №${trials.length} — ${fmtV(measurement.V)} V, ${fmtR(measurement.R)} Ω, ${fmtI(measurement.I)} A.`;
  onTrialsChanged(trials.length - 1);
}

measureBtn.addEventListener('click', doMeasure);
recordBtn.addEventListener('click', doRecord);

// ===================== WHAT THE DATA SHOWS =====================
// "Main series" = the recorded rows that share the most common resistance.
// The graph line and the analysis use it, because one voltage–current
// relationship only makes sense when resistance is kept constant.
function getMainSeries() {
  const groups = new Map();
  trials.forEach((t) => {
    if (!groups.has(t.R)) groups.set(t.R, []);
    groups.get(t.R).push(t);
  });
  let best = [];
  groups.forEach((g) => { if (g.length > best.length) best = g; });
  return best.slice().sort((a, b) => a.V - b.V);
}

function distinctVoltages(series) {
  return new Set(series.map((t) => t.V)).size;
}

// Describes whatever the student's data shows. `usable` is false while the table
// cannot say anything about a trend yet (fewer than 2 different voltages) — the
// questions then explain that, instead of refusing to answer.
function analyseData() {
  const series = getMainSeries();
  const n = distinctVoltages(series);
  if (n < 2) return { usable: false, n, count: trials.length };

  const first = series[0];
  const last = series[series.length - 1];

  let trend = 'same';
  if (last.I > first.I * 1.0001) trend = 'up';
  else if (last.I < first.I * 0.9999) trend = 'down';

  const ratios = series.map((t) => t.I / t.V);               // A per volt
  const meanRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  const maxDev = Math.max(...ratios.map((r) => Math.abs(r - meanRatio) / meanRatio));
  const proportional = maxDev < 0.02;

  return {
    usable: true,
    n,
    series,
    R: first.R,
    first,
    last,
    trend,
    proportional,
    meanRatio,
    maxDevPct: maxDev * 100,
    vOverI: series.map((t) => t.V / t.I),
    sameResistance: new Set(trials.map((t) => t.R)).size === 1,
    allResistances: [...new Set(trials.map((t) => t.R))].sort((a, b) => a - b),
    actualRelation: trend === 'same' ? 'none' : (proportional ? 'direct' : 'other')
  };
}

// Said instead of a verdict while the table is too small to judge an answer.
function needDataMessage(a) {
  return a.count === 0
    ? 'Jadval hozircha bo‘sh, shuning uchun javobingizni solishtiradigan ma’lumot yo‘q. O‘lchov qo‘shsangiz, bu javob avtomatik qayta baholanadi.'
    : `Jadvalda hozircha ${a.n} ta turli kuchlanishdagi o‘lchov bor — javobingizni solishtirish uchun yetarli emas. Yana o‘lchov qo‘shsangiz, bu javob avtomatik qayta baholanadi.`;
}

// How well did the prediction match? 'yes' | 'partly' | 'no'
function predictionVerdict(pred, a) {
  if (pred === 'prop') {
    if (a.trend === 'up' && a.proportional) return 'yes';
    return a.trend === 'up' ? 'partly' : 'no';
  }
  if (pred === 'up') {
    if (a.trend === 'up' && !a.proportional) return 'yes';
    return (a.trend === 'up' && a.proportional) ? 'partly' : 'no';
  }
  if (pred === 'down') return a.trend === 'down' ? 'yes' : 'no';
  return a.trend === 'same' ? 'yes' : 'no';
}

// ===================== TABLE =====================
function renderTable(newIndex) {
  dataBody.innerHTML = '';

  if (trials.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'table-empty';
    td.textContent = 'Hali o‘lchov yo‘q. Kuchlanish va qarshilikni tanlang, «O‘lchash», so‘ng «Jadvalga yozish» tugmasini bosing.';
    tr.appendChild(td);
    dataBody.appendChild(tr);
    return;
  }

  trials.forEach((t, i) => {
    const tr = document.createElement('tr');
    [i + 1, fmtV(t.V), fmtR(t.R), fmtI(t.I)].forEach((value) => {
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

function svgEl(name, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
  return el;
}

// Round a raw step up to 1, 2, 2.5, 5 or 10 × a power of ten.
function niceStep(raw) {
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function tickLabel(value) {
  return String(Number(value.toFixed(3)));
}

function renderGraph() {
  graphDynamic.innerHTML = '';

  const maxI = trials.length ? Math.max(...trials.map((t) => t.I)) : 1;
  const yStep = niceStep((maxI * 1.05) / 4);
  const yMax = yStep * 4;

  const xOf = (v) => GX0 + (v / V_AXIS_MAX) * (GX1 - GX0);
  const yOf = (i) => GY0 - (i / yMax) * (GY0 - GY1);

  // grid lines + tick labels
  for (let k = 0; k <= 4; k++) {
    const val = yStep * k;
    const y = yOf(val);
    if (k > 0) graphDynamic.appendChild(svgEl('line', { x1: GX0, y1: y, x2: GX1, y2: y, class: 'graph-grid' }));
    const label = svgEl('text', { x: GX0 - 6, y: y + 3, 'text-anchor': 'end', class: 'graph-axis-label' });
    label.textContent = tickLabel(val);
    graphDynamic.appendChild(label);
  }
  for (let v = 0; v <= V_AXIS_MAX; v += 2) {
    const x = xOf(v);
    if (v > 0) graphDynamic.appendChild(svgEl('line', { x1: x, y1: GY1, x2: x, y2: GY0, class: 'graph-grid' }));
    const label = svgEl('text', { x: x, y: GY0 + 14, 'text-anchor': 'middle', class: 'graph-axis-label' });
    label.textContent = v;
    graphDynamic.appendChild(label);
  }

  const series = getMainSeries();
  const distinct = distinctVoltages(series);

  // line joining the measured points of the main series (once there are enough different voltages)
  if (distinct >= LINE_POINTS) {
    const points = series.map((t) => `${xOf(t.V).toFixed(1)},${yOf(t.I).toFixed(1)}`).join(' ');
    graphDynamic.appendChild(svgEl('polyline', { points, class: 'graph-curve' }));
  }

  // the measured points
  trials.forEach((t, i) => {
    const inMain = series.includes(t);
    const dot = svgEl('circle', {
      cx: xOf(t.V).toFixed(1),
      cy: yOf(t.I).toFixed(1),
      r: 5,
      class: inMain ? 'graph-marker' : 'graph-marker graph-marker-other'
    });
    const title = svgEl('title', {});
    title.textContent = `№${i + 1}: ${fmtV(t.V)} V, ${fmtR(t.R)} Ω, ${fmtI(t.I)} A`;
    dot.appendChild(title);
    graphDynamic.appendChild(dot);
  });

  // status text: says what the graph shows, never what the student "must" do
  graphStatus.classList.remove('ready');
  graphLegend.innerHTML = '';
  if (trials.length === 0) {
    graphStatus.textContent = 'Grafik hozircha bo‘sh. O‘lchovlarni jadvalga yozsangiz, har bir qator grafikda nuqta bo‘ladi.';
    return;
  }

  const others = trials.length - series.length;
  if (distinct < LINE_POINTS) {
    graphStatus.textContent = `R = ${fmtR(series[0].R)} Ω da hozircha ${distinct} ta turli kuchlanish. `
      + `${LINE_POINTS} ta va undan ko‘p turli kuchlanishda o‘lchasangiz, nuqtalarni bog‘lovchi chiziq chiziladi.`;
  } else {
    graphStatus.classList.add('ready');
    graphStatus.textContent = `R = ${fmtR(series[0].R)} Ω da ${distinct} ta turli kuchlanish — chiziq shu nuqtalarni bog‘laydi.`;
  }
  if (others > 0) {
    graphStatus.textContent += ` Boshqa qarshilikdagi ${others} ta nuqta chiziqqa kiritilmagan.`;
  }

  graphLegend.innerHTML = `<span><i class="legend-mark"></i>R = ${fmtR(series[0].R)} Ω (asosiy qator)</span>`
    + (others > 0 ? '<span><i class="legend-mark legend-mark-other"></i>boshqa qarshiliklar</span>' : '');
}

// ===================== ANY CHANGE TO THE DATA =====================
function onTrialsChanged(newIndex) {
  renderTable(newIndex);
  renderGraph();
  clearBtn.disabled = trials.length === 0;

  // a deleted/cleared row may free a slot
  if (measurement && !measurement.recorded && trials.length < MAX_TRIALS) recordBtn.disabled = false;

  refreshFeedback();
}

// Re-judge everything that depends on the data or the prediction (analysis, conclusion, results).
function refreshFeedback() {
  Object.keys(analysisAnswers).forEach(paintAnswer);
  if (conclusionShown) paintConclusion();
  renderResults();
}

// ===================== ANALYSIS (free: pick any option, any time, as often as you like) =====================
// check() looks at the student's CURRENT data and explains with their own numbers.
const analysisDefs = [
  {
    id: 'trend',
    prompt: 'Qarshilik o‘zgarmas turganda, kuchlanish oshirilgach tok kuchi nima bo‘ldi?',
    options: [
      { value: 'up', label: 'Ortdi' },
      { value: 'down', label: 'Kamaydi' },
      { value: 'same', label: 'O‘zgarmadi' }
    ],
    check(value, a) {
      const f = a.first, l = a.last;
      const evidence = `${fmtV(f.V)} V da I = ${fmtI(f.I)} A, ${fmtV(l.V)} V da I = ${fmtI(l.I)} A`;
      if (value === a.trend) return { ok: true, msg: `Ma’lumotlaringizga mos: ${evidence}.` };
      return { ok: false, msg: `Jadvalda: ${evidence} — tok ${TREND_LABEL[a.trend]}. Siz boshqacha tanladingiz; xohlasangiz o‘lchov qo‘shib tekshirib ko‘ring.` };
    }
  },
  {
    id: 'constant',
    prompt: 'Barcha o‘lchovlarda qarshilik bir xil bo‘ldimi?',
    options: [
      { value: 'yes', label: 'Ha' },
      { value: 'no', label: 'Yo‘q' }
    ],
    check(value, a) {
      const actual = a.sameResistance ? 'yes' : 'no';
      if (value === actual) {
        return a.sameResistance
          ? { ok: true, msg: `Ha, hamma o‘lchovlarda R = ${fmtR(a.R)} Ω. Demak, tokning o‘zgarishiga faqat kuchlanish sabab bo‘ldi.` }
          : { ok: true, msg: `Yo‘q: ${a.allResistances.map(fmtR).join(', ')} Ω qarshiliklar bor. Grafikdagi chiziq faqat R = ${fmtR(a.R)} Ω o‘lchovlarini bog‘laydi.` };
      }
      return a.sameResistance
        ? { ok: false, msg: `Jadvalda hamma qatorda R = ${fmtR(a.R)} Ω — qarshilik bir xil bo‘lgan.` }
        : { ok: false, msg: `Jadvalda ${a.allResistances.map(fmtR).join(', ')} Ω qarshiliklar bor — qarshilik o‘zgargan.` };
    }
  },
  {
    id: 'ratio',
    prompt: 'Jadvaldagi har bir o‘lchov uchun kuchlanishni tok kuchiga bo‘ling (V ÷ I). Natijalar qanday?',
    options: [
      { value: 'same', label: 'Deyarli bir xil son' },
      { value: 'grows', label: 'Kuchlanish oshgan sari ortib boradi' },
      { value: 'falls', label: 'Kuchlanish oshgan sari kamayib boradi' }
    ],
    check(value, a) {
      const list = a.vOverI.map((x) => x.toFixed(1)).join(', ');
      if (a.proportional) {
        if (value === 'same') return { ok: true, msg: `V ÷ I = ${list} Ω — deyarli o‘zgarmaydi va qo‘ygan qarshiligingizga (${fmtR(a.R)} Ω) teng.` };
        return { ok: false, msg: `Jadvalda V ÷ I = ${list} Ω — bu sonlar deyarli bir xil.` };
      }
      return { ok: false, msg: `Jadvalda V ÷ I = ${list} Ω — bu sonlar bir xil emas. (Qarshilik o‘zgargan qatorlar bo‘lsa shunday bo‘ladi.)` };
    }
  },
  {
    id: 'prediction',
    prompt: 'O‘lchovlaringiz bashoratingizni qo‘llab-quvvatladimi?',
    options: [
      { value: 'yes', label: 'Ha, to‘liq' },
      { value: 'partly', label: 'Qisman' },
      { value: 'no', label: 'Yo‘q' }
    ],
    check(value, a) {
      if (!prediction) {
        return { ok: null, msg: 'Siz bashorat tanlamagansiz, shuning uchun solishtiradigan narsa yo‘q. Yuqorida bashorat tanlab ko‘ring — javob avtomatik qayta baholanadi.' };
      }
      const verdict = predictionVerdict(prediction, a);
      const mine = `Bashoratingiz: ${predictionText()}.`;
      const data = a.trend === 'up' && a.proportional
        ? `Ma’lumotlar: tok ortdi va I / V ≈ ${a.meanRatio.toFixed(3)} A/V hamma o‘lchovda deyarli bir xil (to‘g‘ri proporsional).`
        : `Ma’lumotlar: tok ${TREND_LABEL[a.trend]}${a.proportional ? '' : ', lekin I / V o‘zgarib turdi'}.`;
      return { ok: value === verdict, msg: `${mine} ${data}` };
    }
  }
];

const analysisUI = {};   // question id → { qDiv, buttons: Map(value → button), feedback }

function createAnalysisQuestion(def, idx) {
  const qDiv = document.createElement('div');
  qDiv.className = 'quiz-question';

  const qText = document.createElement('p');
  qText.className = 'quiz-question-text';
  qText.textContent = `${idx + 1}. ${def.prompt}`;
  qDiv.appendChild(qText);

  const optsDiv = document.createElement('div');
  optsDiv.className = 'quiz-options';

  const feedback = document.createElement('p');
  feedback.className = 'quiz-feedback hidden';
  feedback.setAttribute('aria-live', 'polite');

  const buttons = new Map();
  def.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      analysisAnswers[def.id] = opt.value;
      paintAnswer(def.id);
    });
    buttons.set(opt.value, btn);
    optsDiv.appendChild(btn);
  });

  qDiv.appendChild(optsDiv);
  qDiv.appendChild(feedback);
  analysisUI[def.id] = { qDiv, buttons, feedback };
  return qDiv;
}

// Show the picked option and what the data says about it.
function paintAnswer(id) {
  const def = analysisDefs.find((d) => d.id === id);
  const ui = analysisUI[id];
  const value = analysisAnswers[id];
  ui.buttons.forEach((b) => b.classList.remove('selected', 'correct', 'incorrect'));
  if (value === undefined) { ui.feedback.classList.add('hidden'); return; }

  const a = analyseData();
  const result = a.usable ? def.check(value, a) : { ok: null, msg: needDataMessage(a) };
  const btn = ui.buttons.get(value);
  btn.classList.add(result.ok === true ? 'correct' : result.ok === false ? 'incorrect' : 'selected');
  ui.feedback.textContent = result.msg;
  ui.feedback.classList.remove('hidden');
  ui.feedback.classList.toggle('wrong', result.ok === false);
}

analysisDefs.forEach((def, idx) => analysisList.appendChild(createAnalysisQuestion(def, idx)));

// ===================== CONCLUSION (can be checked at any time, as often as you like) =====================
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

function paintConclusion() {
  const trend = trendSelect.value;
  const relation = relationSelect.value;
  if (!trend && !relation) {
    showFeedback(conclusionFeedback, null, ['Gapdagi bo‘shliqlardan birini yoki ikkalasini tanlang — tanlovingiz ma’lumotlaringiz bilan solishtiriladi.']);
    return;
  }

  const a = analyseData();
  if (!a.usable) {
    showFeedback(conclusionFeedback, null, [needDataMessage(a)]);
    return;
  }

  const notes = [];
  const good = [];

  if (trend) {
    if (trend === a.trend) good.push(`tok kuchi ${TREND_LABEL[trend]} — jadvalda ${fmtV(a.first.V)} V da I = ${fmtI(a.first.I)} A, ${fmtV(a.last.V)} V da I = ${fmtI(a.last.I)} A`);
    else notes.push(`Siz «${TREND_LABEL[trend]}» dedingiz, lekin jadvalda ${fmtV(a.first.V)} V da I = ${fmtI(a.first.I)} A, `
      + `${fmtV(a.last.V)} V da esa I = ${fmtI(a.last.I)} A.`);
  }

  if (relation) {
    if (relation === a.actualRelation) {
      good.push(`bog‘liqlik «${relation === 'direct' ? 'to‘g‘ri proporsional' : 'mavjud emas'}» — I / V ≈ ${a.meanRatio.toFixed(3)} A/V (eng katta og‘ish ${a.maxDevPct.toFixed(1)} %)`);
    } else if (relation === 'inverse') {
      notes.push(`Teskari proporsionallikda kuchlanish oshganda tok kamayishi kerak edi. Sizda esa I / V ≈ ${a.meanRatio.toFixed(3)} A/V `
        + 'hamma qatorda deyarli bir xil.');
    } else if (relation === 'none') {
      notes.push(`Bog‘liqlik bo‘lmasa, tok o‘zgarmay qolardi. Sizda ${fmtI(a.first.I)} A dan ${fmtI(a.last.I)} A gacha o‘zgardi.`);
    } else {
      notes.push('Har bir qatorda I / V ni hisoblab ko‘ring: u o‘zgaradimi yoki deyarli bir xilmi?');
    }
  }

  const paragraphs = [];
  if (good.length) paragraphs.push(`Ma’lumotlaringizga mos: ${good.join('; ')}.`);
  notes.forEach((n) => paragraphs.push(n));

  // the whole sentence agrees with the data → connect it with the model and the prediction
  if (!notes.length && trend && relation) {
    const rFromData = a.vOverI.reduce((s, x) => s + x, 0) / a.vOverI.length;
    paragraphs.push(`R = V / I ≈ ${rFromData.toFixed(1)} Ω chiqadi (R = ${fmtR(a.R)} Ω da) — bu siz qo‘ygan qarshilik, ya’ni I = V / R.`);
    if (prediction) {
      const verdictText = {
        yes: 'o‘lchovlar bilan to‘liq mos keldi',
        partly: 'qisman mos keldi: tok ortishini to‘g‘ri aytgansiz, lekin bog‘liqlik aslida to‘g‘ri proporsional',
        no: 'o‘lchovlarga mos kelmadi'
      }[predictionVerdict(prediction, a)];
      paragraphs.push(`Bashoratingiz ${predictionText()} ${verdictText}.`);
    }
  } else if (!notes.length && (!trend || !relation)) {
    paragraphs.push('Ikkinchi bo‘shliqni ham tanlab ko‘ring — uni ham ma’lumotlaringiz bilan solishtiramiz.');
  }

  showFeedback(conclusionFeedback, notes.length ? false : true, paragraphs);
}

conclusionBtn.addEventListener('click', () => {
  conclusionShown = true;
  paintConclusion();
});
[trendSelect, relationSelect].forEach((s) => s.addEventListener('change', () => {
  if (conclusionShown) paintConclusion();
}));

// ===================== CHALLENGE (any value is simulated — the circuit reacts) =====================
function checkChallenge() {
  const raw = challengeInput.value.trim().replace(',', '.');
  const V = parseFloat(raw);
  if (raw === '' || !isFinite(V)) {
    showFeedback(challengeFeedback, null, ['Kuchlanishni son bilan kiriting, masalan: 4,5 — shunda zanjirning reaksiyasini ko‘rasiz.']);
    return;
  }

  challengeAttempts++;
  const sim = measureCircuit(V, CHALLENGE.R);   // run the entered voltage through the same model
  const fmt = (x, d) => String(Number(x.toFixed(d))).replace('.', ',');
  const vText = fmt(V, 2);
  const iText = fmt(sim.I, 3);
  const target = String(CHALLENGE.I).replace('.', ',');
  const matches = Math.abs(sim.I - CHALLENGE.I) <= 0.005;

  const lines = [];
  if (V === 0) {
    lines.push(`0 V kuchlanishda zanjirdan tok o‘tmaydi: I = V / R = 0 / ${CHALLENGE.R} = 0 A.`);
  } else if (V < 0) {
    lines.push(`${vText} V — batareya teskari ulangan holat. Tok teskari yo‘nalishda oqadi: I = V / R = ${vText} / ${CHALLENGE.R} = ${iText} A (rezistor tok yo‘nalishiga befarq).`);
  } else {
    lines.push(`${vText} V kuchlanishda zanjirdan I = V / R = ${vText} / ${CHALLENGE.R} = ${iText} A o‘tadi.`);
  }

  if (matches) {
    challengeSolved = true;
    lines.push(`Bu kerakli ${target} A ga mos keladi. Formulani V uchun yechsangiz ham shu chiqadi: V = I · R = ${target} · ${CHALLENGE.R} = ${fmt(CHALLENGE.I * CHALLENGE.R, 2)} V.`);
  } else if (V > 0) {
    const direction = sim.I > CHALLENGE.I ? 'ko‘p' : 'kam';
    lines.push(`Bu kerakli ${target} A dan ${direction}. ${sim.I > CHALLENGE.I ? 'Kuchlanishni kamaytirsangiz' : 'Kuchlanishni oshirsangiz'} tok ${target} A ga yaqinlashadi (I = V / R formulasidan V ni ifodalab ko‘ring).`);
  } else {
    lines.push(`Kerakli tok ${target} A (musbat yo‘nalishda), bu esa musbat kuchlanishni talab qiladi.`);
  }

  const power = Math.abs(sim.P);
  if (power > SAFE_POWER_W) {
    lines.push(`Bu rezistorda P = V · I = ${fmt(power, 1)} W quvvat ajraladi. Oddiy rezistor atigi 0,25–2 W ga chidaydi — haqiqiy qurilmada u qizib, kuyib ketardi (bu yerda xavfsiz virtual holat).`);
  }

  showFeedback(challengeFeedback, matches ? true : (V > 0 ? false : null), lines);
  renderResults();
}

challengeBtn.addEventListener('click', checkChallenge);
challengeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkChallenge();
});

// ===================== RESULTS (a live summary of the current state, any time) =====================
function renderResults() {
  const a = analyseData();
  document.getElementById('finalTrials').textContent = trials.length;
  document.getElementById('finalResistance').textContent = trials.length ? fmtR(getMainSeries()[0].R) : '—';
  document.getElementById('finalRatio').textContent = a.usable ? a.meanRatio.toFixed(3) : '—';
  document.getElementById('finalChallenge').textContent = challengeSolved
    ? `✓ (${challengeAttempts} urinish)`
    : (challengeAttempts ? `${challengeAttempts} urinish` : '—');
}

// ===================== QUIZ DATA (a free knowledge check) =====================
const quizData = [
  {
    q: 'Qarshilik oshirilsa, kuchlanish o‘zgarmagan holatda tok kuchi qanday o‘zgaradi?',
    options: ['Ortadi', 'Kamayadi', 'O‘zgarmaydi'],
    correct: 'Kamayadi'
  },
  {
    q: 'Om qonunining formulasi qaysi?',
    options: ['I = V / R', 'V = I + R', 'R = I / V', 'P = V / I'],
    correct: 'I = V / R'
  },
  {
    q: 'Kuchlanish 2 baravar oshib, qarshilik o‘zgarmasa, tok kuchi qanday o‘zgaradi?',
    options: ['2 baravar oshadi', '2 baravar kamayadi', 'O‘zgarmaydi'],
    correct: '2 baravar oshadi'
  }
];

// ===================== SLIDERS =====================
function onSliderInput(slider) {
  updateSliderFill(slider);
  updateSetup();
  invalidateMeasurement();
}

voltageSlider.addEventListener('input', () => onSliderInput(voltageSlider));
resistanceSlider.addEventListener('input', () => onSliderInput(resistanceSlider));

// ===================== RESET (also used for the initial state) =====================
function resetExperiment() {
  clearTimeout(measureTimer);
  measuring = false;

  prediction = null;
  measurement = null;
  lastMeasured = null;
  trials = [];
  analysisAnswers = {};
  conclusionShown = false;
  challengeAttempts = 0;
  challengeSolved = false;

  // setup
  voltageSlider.value = DEFAULT_VOLTAGE;
  resistanceSlider.value = DEFAULT_RESISTANCE;
  updateSliderFill(voltageSlider);
  updateSliderFill(resistanceSlider);
  updateSetup();

  syncPrediction();

  // measuring
  setReadouts(null);
  measureBtn.disabled = false;
  recordBtn.disabled = true;
  observationText.textContent = 'Kuchlanish va qarshilikni tanlang, so‘ng «O‘lchash» tugmasini bosing.';
  recordStatus.textContent = '';

  // data
  renderTable();
  renderGraph();
  clearBtn.disabled = true;

  // answers
  Object.keys(analysisUI).forEach(paintAnswer);
  trendSelect.value = '';
  relationSelect.value = '';
  conclusionFeedback.classList.add('hidden');
  conclusionFeedback.innerHTML = '';
  challengeInput.value = '';
  challengeFeedback.classList.add('hidden');
  challengeFeedback.innerHTML = '';
  renderResults();

  buildQuiz(quizList, quizScore, quizData);
}

resetBtn.addEventListener('click', resetExperiment);

// ===================== INIT =====================
resetExperiment();
