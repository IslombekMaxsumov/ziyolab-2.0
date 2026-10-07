// =====================================================================
// hujayra.js — cell investigation: "Is the unknown sample a plant or an animal cell?"
//
// A free-exploration investigation: every section (prediction, microscope, evidence notebook,
// comparison, analysis, conclusion, challenge, results, quiz) is on the page from the start and
// works in ANY order.
//   • nothing is locked and nothing has to be completed first
//   • a wrong or unusual choice is never refused — the page explains what the evidence says
//   • answers are re-judged live: change the notebook, the prediction or an answer and the
//     feedback follows
//
// BIOLOGY MODEL (educational simplification, also stated on the page):
//   • only plant vs animal cells are compared (fungi, bacteria, protists are ignored)
//   • the three samples are schematic; real cells vary in shape, size and organelle number
//   • how much a finding helps to tell the two apart ("evidence strength"):
//       cell wall present   → plant,  strong      cell wall absent    → animal, strong
//       chloroplast present → plant,  strong      chloroplast absent  → animal, WEAK
//                                                 (many plant cells, e.g. roots, have none)
//       large central vacuole → plant, moderate   small vacuoles → no discrimination
//                                                 (animal cells can have small vacuoles too)
//       nucleus, mitochondria, membrane, cytoplasm → no discrimination (both cell types)
//   • strength points: strong 3, moderate 2, weak 1.  An identity is "supported" when its
//     points are at least 3 and higher than the other identity's points.
//
// clamp, mixColor and updateSliderFill come from lab-common.js; buildQuiz from quiz.js;
// createStageNav from nav.js.
// =====================================================================

// ===================== ELEMENTS =====================
const stepsList = document.getElementById('stepsList');

const predictionOptions = document.getElementById('predictionOptions');
const predictionNote = document.getElementById('predictionNote');

const workspace = document.getElementById('cell');
const cellLayer = document.getElementById('cellLayer');
const cellCaption = document.getElementById('cellCaption');
const structureList = document.getElementById('structureList');
const infoWindow = document.getElementById('infoWindow');
const infoTitle = document.getElementById('infoTitle');
const infoText = document.getElementById('infoText');
const infoDetail = document.getElementById('infoDetail');
const infoFunction = document.getElementById('infoFunction');
const infoObservation = document.getElementById('infoObservation');
const infoImplication = document.getElementById('infoImplication');
const addEvidenceBtn = document.getElementById('addEvidenceBtn');

const evidencePanel = document.getElementById('evidencePanel');
const evidenceBody = document.getElementById('evidenceBody');
const evidenceHint = document.getElementById('evidenceHint');
const clearBtn = document.getElementById('clearBtn');

const comparePanel = document.getElementById('comparePanel');
const compareBody = document.getElementById('compareBody');
const compareFilters = document.getElementById('compareFilters');
const compareHint = document.getElementById('compareHint');

const analysisPanel = document.getElementById('analysisPanel');
const analysisList = document.getElementById('analysisList');

const conclusionPanel = document.getElementById('conclusionPanel');
const identitySelect = document.getElementById('identitySelect');
const citeList = document.getElementById('citeList');
const conclusionBtn = document.getElementById('conclusionBtn');
const conclusionFeedback = document.getElementById('conclusionFeedback');

const challengePanel = document.getElementById('challengePanel');
const challengeList = document.getElementById('challengeList');

const resultsPanel = document.getElementById('resultsPanel');
const quizPanel = document.getElementById('quizPanel');
const resetBtn = document.getElementById('resetBtn');

const quizList = document.getElementById('quizList');
const quizScore = document.getElementById('quizScore');

// ===================== BIOLOGY DATA =====================
const ORDER = ['membrane', 'cytoplasm', 'nucleus', 'mito', 'wall', 'chloroplast', 'vacuole'];

const STRUCTS = {
  membrane: {
    name: 'Hujayra membranasi',
    fn: 'Hujayrani tashqi muhitdan ajratadi va moddalarning kirib-chiqishini nazorat qiladi (tanlab o‘tkazadi). Barcha hujayralarda bor.'
  },
  cytoplasm: {
    name: 'Sitoplazma',
    fn: 'Hujayra ichidagi suyuq muhit; organellalar shu yerda joylashgan va ko‘p kimyoviy reaksiyalar shu yerda sodir bo‘ladi.'
  },
  nucleus: {
    name: 'Yadro',
    fn: 'Irsiy axborotni (DNK) saqlaydi va hujayra faoliyatini boshqaradi.'
  },
  mito: {
    name: 'Mitoxondriya',
    fn: 'Hujayra nafasi orqali oziq moddalardan hujayra uchun foydali energiya (ATF) hosil qiladi. O‘simlik va hayvon hujayralarida ham uchraydi.'
  },
  wall: {
    name: 'Hujayra devori',
    fn: 'Membrana tashqarisidagi qattiq qavat (o‘simliklarda asosan sellyuloza); hujayraga shakl va mustahkamlik beradi.'
  },
  chloroplast: {
    name: 'Xloroplast',
    fn: 'Fotosintez joyi: yorug‘lik energiyasi yordamida shakar hosil qiladi va yashil xlorofillni saqlaydi. Yashil o‘simlik hujayralarining ko‘pchiligida bor, lekin hammasida emas.'
  },
  vacuole: {
    name: 'Vakuol',
    fn: 'Suv, tuzlar va boshqa moddalarni saqlaydi. O‘simlikning yetuk hujayralarida odatda bitta katta markaziy vakuol bo‘ladi; hayvon hujayralarida mayda vakuolalar yoki pufakchalar bo‘lishi mumkin.'
  }
};

// what a finding suggests (shown after inspecting; reused in the feedback)
const IMPLICATION = {
  wall: {
    yes: 'Hujayra devori topildi. Bu o‘simlik hujayrasi ehtimolini kuchli oshiradi: hayvon hujayralarida devor bo‘lmaydi.',
    no: 'Hujayra devori topilmadi. Bu hayvon hujayrasi ehtimolini kuchli oshiradi: o‘simlik hujayralarida devor bo‘ladi.'
  },
  chloroplast: {
    yes: 'Xloroplast topildi — fotosintez qiluvchi hujayra belgisi. Bu o‘simlik hujayrasi ehtimolini kuchli oshiradi.',
    no: 'Xloroplast topilmadi. Bu hayvon hujayrasiga mos keladi, lekin yolg‘iz o‘zi yetarli emas: ba’zi o‘simlik hujayralarida (masalan, ildizda) xloroplast bo‘lmaydi.'
  },
  vacuole: {
    large: 'Katta markaziy vakuol o‘simlikning yetuk hujayralariga xos. Bu o‘rtacha kuchdagi dalil: boshqa dalillar bilan birga ishonchliroq bo‘ladi.',
    small: 'Mayda vakuolalar o‘simlik va hayvon hujayralarida ham uchrashi mumkin. Bu dalil namunani ajratmaydi.'
  },
  nucleus: {
    yes: 'Yadro bor. O‘simlik ham, hayvon hujayrasi ham yadroga ega, shuning uchun bu namunani ajratmaydi.'
  },
  mito: {
    yes: 'Mitoxondriya bor. Ular o‘simlik hujayralarida ham bo‘ladi (o‘simliklar ham hujayra nafasi qiladi), shuning uchun bu namunani ajratmaydi.'
  },
  membrane: {
    yes: 'Hujayra membranasi bor. Barcha hujayralarda membrana bo‘ladi — bu namunani ajratmaydi.'
  },
  cytoplasm: {
    yes: 'Sitoplazma bor. Barcha hujayralarda bo‘ladi — bu namunani ajratmaydi.'
  }
};

const POINTS = { strong: 3, moderate: 2, weak: 1, none: 0 };
const STRENGTH_WORD = { strong: 'kuchli', moderate: 'o‘rtacha', weak: 'kuchsiz', none: 'ajratmaydi' };
const IDENT_NAME = { plant: 'o‘simlik hujayrasi', animal: 'hayvon hujayrasi' };
const PRED_LABEL = { plant: 'o‘simlik hujayrasi', animal: 'hayvon hujayrasi', unsure: 'hozircha ayta olmayman' };

// Three unknown samples (cycled on every reset). `obs` is what the student sees for each structure.
const SAMPLES = [
  {
    letter: 'A', truth: 'plant', outline: 'plant',
    cell: { wall: true, chloroplast: true, vacuole: 'large' },
    obs: {
      membrane: 'Devorning ichki tomonida yupqa membrana chizig‘i ko‘rinadi.',
      cytoplasm: 'Hujayra ichi donador suyuqlik bilan to‘lgan.',
      nucleus: 'Bitta aniq yadro bor; u hujayra chetiga surilgan.',
      mito: 'Mayda cho‘ziq tanachalar (mitoxondriyalar) bor.',
      wall: 'Membrana tashqarisida qalin, qattiq qavat; hujayra burchakli shaklga ega.',
      chloroplast: 'Ko‘plab yashil, yassi-oval tanachalar bor.',
      vacuole: 'Hujayra hajmining katta qismini bitta katta markaziy vakuol egallagan.'
    }
  },
  {
    letter: 'B', truth: 'animal', outline: 'animal',
    cell: { wall: false, chloroplast: false, vacuole: 'small' },
    obs: {
      membrane: 'Hujayra chegarasi yupqa, egiluvchan membrana bilan o‘ralgan.',
      cytoplasm: 'Hujayra ichi donador suyuqlik bilan to‘lgan.',
      nucleus: 'Bitta yirik yadro hujayra markaziga yaqin joylashgan.',
      mito: 'Mayda cho‘ziq tanachalar (mitoxondriyalar) bor.',
      wall: 'Membrana tashqarisida qattiq qavat topilmadi; hujayra chegarasi egiluvchan.',
      chloroplast: 'Yashil tanachalar topilmadi.',
      vacuole: 'Faqat bir nechta mayda vakuolalar bor; katta markaziy vakuol yo‘q.'
    }
  },
  {
    letter: 'C', truth: 'plant', outline: 'plant',
    cell: { wall: true, chloroplast: false, vacuole: 'large' },
    obs: {
      membrane: 'Devorning ichki tomonida yupqa membrana chizig‘i ko‘rinadi.',
      cytoplasm: 'Hujayra ichi donador suyuqlik bilan to‘lgan.',
      nucleus: 'Bitta aniq yadro bor; u hujayra chetiga surilgan.',
      mito: 'Mayda cho‘ziq tanachalar (mitoxondriyalar) bor.',
      wall: 'Membrana tashqarisida qalin, qattiq qavat; hujayra burchakli shaklga ega.',
      chloroplast: 'Yashil tanachalar topilmadi.',
      vacuole: 'Hujayra hajmining katta qismini bitta katta markaziy vakuol egallagan.'
    }
  }
];

// reference cells for the comparison panel (all structures typical of each kind)
const REFERENCE_PLANT = { outline: 'plant', cell: { wall: true, chloroplast: true, vacuole: 'large' } };
const REFERENCE_ANIMAL = { outline: 'animal', cell: { wall: false, chloroplast: false, vacuole: 'small' } };

const COMPARE_ROWS = [
  { key: 'wall', plant: 'Bor (o‘simliklarda asosan sellyuloza)', animal: 'Yo‘q', type: 'diff' },
  { key: 'chloroplast', plant: 'Yashil hujayralarning ko‘pchiligida bor (hammasida emas)', animal: 'Yo‘q', type: 'diff' },
  { key: 'vacuole', plant: 'Yetuk hujayralarda odatda katta markaziy vakuol', animal: 'Mayda vakuolalar yoki pufakchalar bo‘lishi mumkin', type: 'diff' },
  { key: 'nucleus', plant: 'Bor', animal: 'Bor', type: 'shared' },
  { key: 'mito', plant: 'Bor', animal: 'Bor', type: 'shared' },
  { key: 'membrane', plant: 'Bor', animal: 'Bor', type: 'shared' },
  { key: 'cytoplasm', plant: 'Bor', animal: 'Bor', type: 'shared' }
];

// ===================== STATE =====================
let sampleIndex = 0;
let sample = SAMPLES[0];
let prediction = null;          // 'plant' | 'animal' | 'unsure' | null (not chosen)
let selectedKey = null;
let inspected = new Set();
let evidence = [];              // recorded rows: { key, present, text, leans, strength, points, implication }
let compareFilter = 'all';
let analysisAnswers = {};       // question id → the option the student picked (changeable at any time)
let conclusionShown = false;    // the conclusion has been checked at least once
let challengeAnswers = {};      // stage index → was the latest choice right (display only)
let challengeAttempts = 0;

// ===================== EVIDENCE LOGIC =====================
// What the sample shows for a structure.
function entryFor(key) {
  if (key === 'wall') return { present: sample.cell.wall };
  if (key === 'chloroplast') return { present: sample.cell.chloroplast };
  if (key === 'vacuole') return { present: true, size: sample.cell.vacuole };
  return { present: true };
}

// How strongly that finding separates plant from animal cells.
function classifyEvidence(key, entry) {
  if (key === 'wall') {
    return entry.present
      ? { leans: 'plant', strength: 'strong', implication: IMPLICATION.wall.yes }
      : { leans: 'animal', strength: 'strong', implication: IMPLICATION.wall.no };
  }
  if (key === 'chloroplast') {
    return entry.present
      ? { leans: 'plant', strength: 'strong', implication: IMPLICATION.chloroplast.yes }
      : { leans: 'animal', strength: 'weak', implication: IMPLICATION.chloroplast.no };
  }
  if (key === 'vacuole') {
    return entry.size === 'large'
      ? { leans: 'plant', strength: 'moderate', implication: IMPLICATION.vacuole.large }
      : { leans: 'none', strength: 'none', implication: IMPLICATION.vacuole.small };
  }
  return { leans: 'none', strength: 'none', implication: IMPLICATION[key].yes };
}

function scores() {
  const s = { plant: 0, animal: 0 };
  evidence.forEach((r) => { if (r.leans !== 'none') s[r.leans] += r.points; });
  return s;
}

// 'plant' | 'animal' | null (not enough evidence)
function supportedIdentity() {
  const s = scores();
  if (s.plant >= 3 && s.plant > s.animal) return 'plant';
  if (s.animal >= 3 && s.animal > s.plant) return 'animal';
  return null;
}

function strongestRows() {
  const best = Math.max(0, ...evidence.map((r) => r.points));
  return best === 0 ? [] : evidence.filter((r) => r.points === best);
}

function rowLabel(r) {
  return `${STRUCTS[r.key].name} — ${r.present ? 'topildi' : 'topilmadi'}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function listNames(rows) {
  return rows.map((r) => STRUCTS[r.key].name.toLowerCase()).join(', ');
}

// ===================== DRAWING THE CELL =====================
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
  return el;
}

const rectShape = (x, y, w, h, rx) => ({ tag: 'rect', attrs: { x, y, width: w, height: h, rx } });
const circleShape = (cx, cy, r) => ({ tag: 'circle', attrs: { cx, cy, r } });
const ellipseShape = (cx, cy, rx, ry, rot) => ({
  tag: 'ellipse',
  attrs: { cx, cy, rx, ry, transform: `rotate(${rot} ${cx} ${cy})` }
});

const PLANT_CHLOROPLASTS = [[170, 62, 0], [240, 64, 0], [310, 64, 0], [343, 150, 90], [343, 235, 90], [120, 298, 0], [200, 300, 0], [285, 298, 0]];
const PLANT_MITO = [[62, 150, 20], [343, 192, 90], [160, 299, 0]];
const ANIMAL_MITO = [[275, 240, -25], [255, 110, 30], [100, 255, 10], [300, 175, -60]];
const ANIMAL_VACUOLES = [[95, 215, 10], [215, 285, 11], [290, 100, 9], [215, 58, 8]];

function addStruct(layer, key, shapes, interactive) {
  const g = svgEl('g', { class: `struct struct-${key}`, 'data-struct': key });
  shapes.forEach((s) => {
    const cls = s.cls || 'shape';
    g.appendChild(svgEl(s.tag, Object.assign({ class: cls }, s.attrs)));
  });
  if (interactive) {
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', STRUCTS[key].name);
    g.addEventListener('click', () => selectStruct(key));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectStruct(key); }
    });
  }
  layer.appendChild(g);
}

// Draw only the structures this cell really has (layers: back → front).
function drawCell(layer, outline, cell, interactive) {
  layer.innerHTML = '';
  const plant = outline === 'plant';
  const add = (key, shapes) => addStruct(layer, key, shapes, interactive);

  add('cytoplasm', [plant ? rectShape(40, 40, 320, 280, 9) : circleShape(200, 180, 150)]);

  if (cell.vacuole === 'large') add('vacuole', [ellipseShape(205, 190, 120, 82, 0)]);
  else add('vacuole', ANIMAL_VACUOLES.map(([x, y, r]) => circleShape(x, y, r)));

  if (cell.chloroplast) add('chloroplast', PLANT_CHLOROPLASTS.map(([x, y, rot]) => ellipseShape(x, y, 17, 9, rot)));

  if (plant) add('mito', PLANT_MITO.map(([x, y, rot]) => ellipseShape(x, y, 14, 7, rot)));
  else add('mito', ANIMAL_MITO.map(([x, y, rot]) => ellipseShape(x, y, 22, 11, rot)));

  if (plant) {
    add('nucleus', [circleShape(95, 90, 34),
      Object.assign(circleShape(85, 80, 4), { cls: 'dot' }), Object.assign(circleShape(105, 98, 3), { cls: 'dot' })]);
  } else {
    add('nucleus', [circleShape(160, 150, 58),
      Object.assign(circleShape(145, 135, 6), { cls: 'dot' }), Object.assign(circleShape(175, 160, 4), { cls: 'dot' })]);
  }

  add('membrane', [plant ? rectShape(38, 38, 324, 284, 10) : circleShape(200, 180, 152)]);
  if (cell.wall) add('wall', [rectShape(30, 30, 340, 300, 14)]);
}

// ===================== FREE NAVIGATION =====================
createStageNav({
  stepsList,
  stages: [
    { el: document.getElementById('investigation') },
    { el: workspace },
    { el: comparePanel },
    { el: analysisPanel },
    { el: conclusionPanel },
    { el: challengePanel },
    { el: resultsPanel },
    { el: quizPanel }
  ]
});

// ===================== HELPERS =====================
function applySampleLabels() {
  document.getElementById('sampleName').textContent = sample.letter;
  document.getElementById('sampleLabel').textContent = sample.letter;
  document.querySelectorAll('.sample-letter').forEach((el) => { el.textContent = sample.letter; });
}

// ===================== PREDICTION (optional, changeable at any time) =====================
function predictionText() {
  return prediction ? `«${PRED_LABEL[prediction]}»` : null;
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

// ===================== INSPECTING STRUCTURES =====================
function refreshStructureList() {
  structureList.querySelectorAll('.legend-item').forEach((btn) => {
    const key = btn.dataset.struct;
    btn.classList.toggle('active', key === selectedKey);
    btn.classList.toggle('inspected', inspected.has(key));
    btn.classList.toggle('recorded', evidence.some((r) => r.key === key));
  });
}

function refreshAddButton() {
  if (!selectedKey) {
    addEvidenceBtn.disabled = true;
    addEvidenceBtn.textContent = 'Dalillar daftariga yozish';
  } else if (evidence.some((r) => r.key === selectedKey)) {
    addEvidenceBtn.disabled = true;
    addEvidenceBtn.textContent = 'Daftarga yozilgan ✓';
  } else {
    addEvidenceBtn.disabled = false;
    addEvidenceBtn.textContent = 'Dalillar daftariga yozish';
  }
}

function selectStruct(key) {
  if (!STRUCTS[key]) return;
  selectedKey = key;
  inspected.add(key);

  cellLayer.querySelectorAll('.struct.active').forEach((el) => el.classList.remove('active'));
  const drawn = cellLayer.querySelector(`.struct[data-struct="${key}"]`);
  if (drawn) drawn.classList.add('active');

  const entry = entryFor(key);
  const meta = classifyEvidence(key, entry);

  infoTitle.textContent = STRUCTS[key].name;
  infoText.textContent = '';
  infoText.classList.add('hidden');
  infoDetail.classList.remove('hidden');
  infoFunction.textContent = STRUCTS[key].fn;
  infoObservation.textContent = sample.obs[key];
  infoImplication.textContent = meta.implication;
  infoImplication.className = 'implication';

  infoWindow.classList.remove('anim');
  void infoWindow.offsetWidth;
  infoWindow.classList.add('anim');

  cellCaption.textContent = entry.present
    ? `Tanlangan: ${STRUCTS[key].name}.`
    : `Tanlangan: ${STRUCTS[key].name} — namunada topilmadi.`;

  refreshStructureList();
  refreshAddButton();
}

structureList.addEventListener('click', (e) => {
  const btn = e.target.closest('.legend-item');
  if (btn) selectStruct(btn.dataset.struct);
});

// ===================== EVIDENCE NOTEBOOK =====================
function addEvidence() {
  if (!selectedKey) return;
  if (evidence.some((r) => r.key === selectedKey)) return;   // no duplicates

  const entry = entryFor(selectedKey);
  const meta = classifyEvidence(selectedKey, entry);
  evidence.push({
    key: selectedKey,
    present: entry.present,
    text: sample.obs[selectedKey],
    leans: meta.leans,
    strength: meta.strength,
    points: POINTS[meta.strength],
    implication: meta.implication
  });
  onEvidenceChanged(evidence.length - 1);
}

function removeEvidence(index) {
  evidence.splice(index, 1);
  onEvidenceChanged();
}

function renderEvidenceTable(newIndex) {
  evidenceBody.innerHTML = '';

  if (evidence.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'table-empty';
    td.textContent = 'Daftar bo‘sh. Tuzilmani tanlang, kuzatuvni o‘qing va «Dalillar daftariga yozish» tugmasini bosing.';
    tr.appendChild(td);
    evidenceBody.appendChild(tr);
    return;
  }

  evidence.forEach((r, i) => {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = STRUCTS[r.key].name;
    tr.appendChild(nameTd);

    const obsTd = document.createElement('td');
    obsTd.textContent = r.present ? 'Ha' : 'Yo‘q';
    obsTd.className = r.present ? 'obs-yes' : 'obs-no';
    tr.appendChild(obsTd);

    const textTd = document.createElement('td');
    textTd.textContent = r.text;
    tr.appendChild(textTd);

    const actionTd = document.createElement('td');
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'row-delete';
    del.dataset.index = i;
    del.textContent = '✕';
    del.setAttribute('aria-label', `${STRUCTS[r.key].name} dalilini o‘chirish`);
    actionTd.appendChild(del);
    tr.appendChild(actionTd);

    if (i === newIndex) {
      tr.classList.add('row-new');
      setTimeout(() => tr.classList.remove('row-new'), 1200);
    }
    evidenceBody.appendChild(tr);
  });
}

evidenceBody.addEventListener('click', (e) => {
  const del = e.target.closest('.row-delete');
  if (del) removeEvidence(parseInt(del.dataset.index, 10));
});

clearBtn.addEventListener('click', () => {
  evidence = [];
  onEvidenceChanged();
});

addEvidenceBtn.addEventListener('click', addEvidence);

function onEvidenceChanged(newIndex) {
  renderEvidenceTable(newIndex);
  clearBtn.disabled = evidence.length === 0;
  refreshStructureList();
  refreshAddButton();
  renderCompareTable();
  renderCiteList();
  updateCompareHint();
  refreshAnalysisOptions();

  // says what the notebook holds — never what the student "must" do
  evidenceHint.textContent = evidence.length === 0
    ? ''
    : `Daftarda ${evidence.length} ta tuzilma: ${listNames(evidence)}.`;

  refreshFeedback();
}

// ===================== COMPARISON =====================
function renderCompareTable() {
  compareBody.innerHTML = '';
  COMPARE_ROWS.forEach((row) => {
    if (compareFilter !== 'all' && row.type !== compareFilter) return;

    const tr = document.createElement('tr');
    tr.className = row.type === 'diff' ? 'cmp-diff' : 'cmp-shared';

    const nameTd = document.createElement('td');
    const wrap = document.createElement('span');
    wrap.className = 'cmp-struct';
    const dot = document.createElement('i');
    dot.className = `cmp-dot dot-${row.key}`;
    wrap.appendChild(dot);
    wrap.appendChild(document.createTextNode(STRUCTS[row.key].name));
    nameTd.appendChild(wrap);
    tr.appendChild(nameTd);

    [[row.plant, 'O‘simlik hujayrasi'], [row.animal, 'Hayvon hujayrasi']].forEach(([text, label]) => {
      const td = document.createElement('td');
      td.textContent = text;
      td.dataset.label = label;   // shown as a small caption in the stacked phone layout
      tr.appendChild(td);
    });

    const mineTd = document.createElement('td');
    const rec = evidence.find((r) => r.key === row.key);
    if (!rec) { mineTd.textContent = 'tekshirilmagan'; mineTd.className = 'cmp-mine-none'; }
    else if (row.key === 'vacuole') { mineTd.textContent = rec.strength === 'moderate' ? '✓ katta markaziy vakuol' : '✓ mayda vakuolalar'; mineTd.className = 'cmp-mine-yes'; }
    else if (rec.present) { mineTd.textContent = '✓ topildi'; mineTd.className = 'cmp-mine-yes'; }
    else { mineTd.textContent = '— topilmadi'; mineTd.className = 'cmp-mine-no'; }
    mineTd.dataset.label = 'Sizning namunangiz';
    tr.appendChild(mineTd);

    compareBody.appendChild(tr);
  });
}

compareFilters.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  compareFilter = btn.dataset.filter;
  compareFilters.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
  renderCompareTable();
});

// Tells the student what the notebook can and cannot show so far (information, not a gate).
function updateCompareHint() {
  compareHint.textContent = (evidence.length > 0 && supportedIdentity() === null)
    ? 'Daftardagi dalillar hozircha namunani ajratmaydi. Jadvaldagi «Farqlar» qatoridagi tuzilmalarni (hujayra devori, xloroplast, vakuol) namunada tekshirsangiz, tur aniqlashadi.'
    : '';
}

// ===================== CHALLENGE SCENARIOS =====================
const CHALLENGE_STAGES = [
  {
    prompt: 'Siz yangi hujayrani kuzatdingiz: yadro, mitoxondriya, hujayra membranasi va sitoplazma bor; hujayra devori va xloroplast topilmadi. Qaysi xulosa dalillar bilan eng yaxshi qo‘llab-quvvatlanadi?',
    correct: 'animal',
    options: [
      { value: 'plantNucleus', label: 'O‘simlik hujayrasi, chunki yadro va mitoxondriya bor' },
      { value: 'unsure', label: 'Aniqlab bo‘lmaydi: dalil yetarli emas' },
      { value: 'animal', label: 'Hayvon hujayrasi: devorning yo‘qligi o‘simlik hujayrasiga zid, qolgan tuzilmalar ikkala turda ham bor' },
      { value: 'plantChloro', label: 'O‘simlik hujayrasi, chunki ildiz hujayralarida ham xloroplast bo‘lmaydi' }
    ],
    right: 'Hayvon hujayrasi: hujayra devorining yo‘qligi o‘simlik hujayrasiga zid kuchli dalil; xloroplastning yo‘qligi uni faqat kuchaytiradi. Yadro, mitoxondriya, membrana va sitoplazma ikkala turda ham bor, shuning uchun ular xulosaga hissa qo‘shmaydi. (Soddalashtirish: bu laboratoriyada faqat o‘simlik va hayvon hujayralari taqqoslanadi.)',
    wrong: {
      plantNucleus: 'Yadro va mitoxondriya o‘simlik hujayralarida ham, hayvon hujayralarida ham bor — ular turni ajratmaydi.',
      unsure: 'Dalil yetarli: hujayra devorining yo‘qligi o‘simlik hujayrasiga qarshi kuchli dalil.',
      plantChloro: 'Xloroplastning yo‘qligi o‘simlik hujayrasini inkor etmaydi — to‘g‘ri. Lekin bu hujayrada hujayra devori ham yo‘q, o‘simlik hujayralarida esa devor bo‘ladi.'
    }
  },
  {
    prompt: 'Boshqa namunada yadro, mitoxondriya, hujayra devori va katta markaziy vakuol bor, lekin xloroplast topilmadi. Qaysi xulosa eng yaxshi qo‘llab-quvvatlanadi?',
    correct: 'plant',
    options: [
      { value: 'animalChloro', label: 'Hayvon hujayrasi, chunki xloroplast yo‘q' },
      { value: 'plant', label: 'O‘simlik hujayrasi: devor va katta markaziy vakuol o‘simlikka xos; xloroplast hamma o‘simlik hujayrasida bo‘lmaydi' },
      { value: 'animalMito', label: 'Hayvon hujayrasi, chunki mitoxondriya bor' },
      { value: 'unsure', label: 'Aniqlab bo‘lmaydi: xloroplast topilmagan' }
    ],
    right: 'O‘simlik hujayrasi: hujayra devori kuchli, katta markaziy vakuol esa o‘rtacha dalil. Xloroplast yorug‘lik tushmaydigan to‘qimalarda (masalan, ildizda) bo‘lmaydi, shuning uchun uning yo‘qligi yolg‘iz o‘zi o‘simlikni inkor etmaydi.',
    wrong: {
      animalChloro: 'Xloroplastning yo‘qligi kuchsiz dalil: ba’zi o‘simlik hujayralarida (masalan, ildizda) u bo‘lmaydi. Hujayra devori esa hayvon hujayrasida yo‘q.',
      animalMito: 'Mitoxondriya o‘simlik hujayralarida ham bor — bu dalil turni ajratmaydi.',
      unsure: 'Dalil yetarli: hujayra devori va katta markaziy vakuol o‘simlikka ishora qiladi; xloroplastning yo‘qligi bunga zid emas.'
    }
  },
  {
    prompt: 'Bir o‘quvchi: «Bu hujayrada mitoxondriya bor, demak u hayvon hujayrasi», dedi. Bu fikr haqida nima deyish mumkin?',
    correct: 'wrong',
    options: [
      { value: 'wrong', label: 'Xato: mitoxondriya o‘simlik hujayralarida ham bor, shuning uchun bu dalil turni ajratmaydi' },
      { value: 'right', label: 'To‘g‘ri: mitoxondriya faqat hayvon hujayralarida bo‘ladi' },
      { value: 'plantOnly', label: 'Xato: mitoxondriya faqat o‘simlik hujayralarida bo‘ladi' },
      { value: 'chloroOnly', label: 'To‘g‘ri, chunki o‘simliklar energiyani faqat xloroplastda ishlab chiqaradi' }
    ],
    right: 'Xato fikr: o‘simlik hujayralari ham hujayra nafasi qiladi, buning uchun ularda ham mitoxondriya bor. Turni ajratish uchun hujayra devori yoki xloroplast kabi farqlovchi belgilar kerak.',
    wrong: {
      right: 'Mitoxondriya hayvonlarga xos emas: o‘simlik hujayralarida ham bor.',
      plantOnly: 'Mitoxondriya faqat o‘simliklarga xos emas: hayvon hujayralarida ham bor.',
      chloroOnly: 'Xloroplast yorug‘likdan shakar hosil qiladi, lekin o‘simlik hujayralari energiyani mitoxondriyada ham ajratib oladi (hujayra nafasi).'
    }
  }
];

// ===================== QUIZ DATA (a free knowledge check) =====================
const quizData = [
  {
    q: 'Hujayraning genetik ma’lumotini qaysi qism saqlaydi?',
    options: ['Yadro', 'Membrana', 'Sitoplazma', 'Mitoxondriya'],
    correct: 'Yadro'
  },
  {
    q: 'Hujayraning "energiya stantsiyasi" deb qaysi tuzilma ataladi?',
    options: ['Yadro', 'Sitoplazma', 'Mitoxondriya', 'Membrana'],
    correct: 'Mitoxondriya'
  },
  {
    q: 'Hujayrani tashqi muhitdan ajratib turuvchi qism qaysi?',
    options: ['Sitoplazma', 'Membrana', 'Yadro', 'Mitoxondriya'],
    correct: 'Membrana'
  }
];

// ===================== ANY CHANGE TO THE EVIDENCE OR THE PREDICTION =====================
// Re-judge everything that depends on them (analysis, conclusion, results).
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
// check() returns { ok: true | false | null, msg }. null = "cannot judge yet" (the page says why).
const analysisDefs = [
  {
    id: 'strongest',
    prompt: 'Daftaringizdagi qaysi dalil namunaning turini eng kuchli ko‘rsatdi?',
    dynamic: true,
    options: () => evidence.map((r) => ({ value: r.key, label: rowLabel(r) })),
    emptyNote: 'Variantlar dalillar daftaridan olinadi. Daftar hozircha bo‘sh — tuzilmani tekshirib, daftarga yozsangiz, variantlar shu yerda paydo bo‘ladi.',
    check(value) {
      const row = evidence.find((r) => r.key === value);
      if (!row) return { ok: null, msg: 'Daftar o‘zgargan: bu dalil endi daftarda yo‘q. Mavjud dalillardan birini tanlang.' };
      const best = Math.max(...evidence.map((r) => r.points));
      if (best === 0) {
        return { ok: null, msg: `Daftaringizdagi hamma tuzilma ikkala hujayra turida ham bor — hozircha birortasi turni ajratmaydi. ${STRUCTS[row.key].name}: ${row.implication}` };
      }
      if (row.points === best) return { ok: true, msg: `«${row.text}» ${row.implication}` };
      if (row.points === 0) {
        return { ok: false, msg: `${STRUCTS[row.key].name} ikkala hujayra turida ham bor, shuning uchun namunani ajratmaydi. Daftaringizdagi eng kuchli dalil: ${listNames(strongestRows())}.` };
      }
      return { ok: false, msg: `${STRUCTS[row.key].name} foydali dalil (${STRENGTH_WORD[row.strength]}), lekin daftaringizda undan kuchliroq dalil bor: ${listNames(strongestRows())}.` };
    }
  },
  {
    id: 'shared',
    prompt: 'Quyidagilardan qaysi biri o‘simlik va hayvon hujayralarining ikkalasida ham bor, shuning uchun namunani ajratishga yordam bermaydi?',
    options: () => [
      { value: 'wall', label: 'Hujayra devori' },
      { value: 'nucleus', label: 'Yadro' },
      { value: 'chloroplast', label: 'Xloroplast' },
      { value: 'vacuole', label: 'Katta markaziy vakuol' }
    ],
    check(value) {
      if (value === 'nucleus') {
        return { ok: true, msg: 'Yadro, mitoxondriya, membrana va sitoplazma ikkala turda ham bor. Masalan, mitoxondriya o‘simlik hujayralarida ham bo‘ladi — shuning uchun «mitoxondriya bor, demak hayvon» deyish xato.' };
      }
      const why = {
        wall: 'Hujayra devori o‘simlik hujayralariga xos, hayvon hujayralarida bo‘lmaydi — u aynan farqlovchi belgi.',
        chloroplast: 'Xloroplast yashil o‘simlik hujayralarida bor, hayvon hujayralarida yo‘q — u farqlovchi belgi (lekin har bir o‘simlik hujayrasida emas).',
        vacuole: 'Katta markaziy vakuol o‘simlikning yetuk hujayralariga xos; hayvon hujayralarida odatda faqat mayda vakuolalar bo‘ladi.'
      }[value];
      return { ok: false, msg: `${why} Taqqoslash jadvalidagi «Umumiy» qatorlarda ikkala turda ham bor tuzilmalarni ko‘rasiz.` };
    }
  },
  {
    id: 'wall',
    prompt: 'Nega hujayra devorining bor-yo‘qligi hujayra turini aniqlashga yordam beradi?',
    options: () => [
      { value: 'energy', label: 'Hujayra devori energiya ishlab chiqaradi, shuning uchun o‘simliklarda bo‘ladi' },
      { value: 'plantOnly', label: 'Bu ikki tur orasida devor faqat o‘simlik hujayralarida bor; hayvon hujayralarida bo‘lmaydi' },
      { value: 'all', label: 'Devor barcha hujayralarda bo‘ladi, shuning uchun hech narsani isbotlamaydi' },
      { value: 'dna', label: 'Hujayra devori irsiy axborotni saqlaydi' }
    ],
    check(value) {
      if (value === 'plantOnly') {
        const rec = evidence.find((r) => r.key === 'wall');
        const mine = rec
          ? `Sizning namunangizda hujayra devori ${rec.present ? 'topildi' : 'topilmadi'}.`
          : 'Siz hujayra devorini hali tekshirmagansiz — tekshirsangiz, namunangizda bor-yo‘qligini ko‘rasiz.';
        return { ok: true, msg: `Devor hujayraga shakl va mustahkamlik beradi va o‘simlik hujayralariga xos. ${mine}` };
      }
      const why = {
        energy: 'Energiyani mitoxondriya (va fotosintezda xloroplast) ishlab chiqaradi; devor mustahkamlik beradi.',
        all: 'Hayvon hujayralarida hujayra devori bo‘lmaydi — shu sababli u ikki turni ajratadi.',
        dna: 'Irsiy axborotni yadro saqlaydi; devor — tashqi qattiq qavat.'
      }[value];
      return { ok: false, msg: why };
    }
  },
  {
    id: 'prediction',
    prompt: 'Dalillaringiz dastlabki bashoratingizni tasdiqladimi?',
    options: () => [
      { value: 'yes', label: 'Ha, bashoratim mos keldi' },
      { value: 'no', label: 'Yo‘q, bashoratim mos kelmadi' },
      { value: 'none', label: 'Bashoratim aniq emas edi («ayta olmayman»)' }
    ],
    check(value) {
      if (!prediction) {
        return { ok: null, msg: 'Siz bashorat tanlamagansiz, shuning uchun solishtiradigan narsa yo‘q. Yuqorida bashorat tanlab ko‘ring — javob avtomatik qayta baholanadi.' };
      }
      const ident = supportedIdentity();
      if (!ident) {
        return { ok: null, msg: 'Daftaringizdagi dalillar hozircha hujayra turini ajratmaydi, shuning uchun bashoratni dalillar bilan solishtirib bo‘lmaydi. Hujayra devori, xloroplast yoki vakuolni tekshirib ko‘rsangiz, javob avtomatik qayta baholanadi.' };
      }
      const expected = prediction === 'unsure' ? 'none' : (prediction === ident ? 'yes' : 'no');
      const evid = `Daftaringizdagi eng kuchli dalil: ${listNames(strongestRows())} → ${IDENT_NAME[ident]}.`;
      return { ok: value === expected, msg: `Bashoratingiz: ${predictionText()}. ${evid}` };
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
  optsDiv.className = 'quiz-options';

  const feedback = document.createElement('p');
  feedback.className = 'quiz-feedback hidden';
  feedback.setAttribute('aria-live', 'polite');

  qDiv.appendChild(optsDiv);
  qDiv.appendChild(feedback);
  analysisUI[def.id] = { optsDiv, feedback };
  renderAnalysisOptions(def);
  return qDiv;
}

// (Re)build the option buttons of one question (the "strongest evidence" options come from the notebook).
function renderAnalysisOptions(def) {
  const ui = analysisUI[def.id];
  const options = def.options();
  ui.optsDiv.innerHTML = '';

  if (options.length === 0) {
    const note = document.createElement('p');
    note.className = 'quiz-note';
    note.textContent = def.emptyNote;
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

function refreshAnalysisOptions() {
  analysisDefs.filter((d) => d.dynamic).forEach(renderAnalysisOptions);
}

// Show the picked option and what the evidence says about it.
function paintAnswer(id) {
  const def = analysisDefs.find((d) => d.id === id);
  const ui = analysisUI[id];
  const value = analysisAnswers[id];
  const buttons = [...ui.optsDiv.querySelectorAll('.quiz-option')];
  buttons.forEach((b) => b.classList.remove('selected', 'correct', 'incorrect'));
  if (value === undefined) { ui.feedback.classList.add('hidden'); return; }

  const result = def.check(value);
  const btn = buttons.find((b) => b.dataset.value === value);
  if (btn) btn.classList.add(result.ok === true ? 'correct' : result.ok === false ? 'incorrect' : 'selected');
  ui.feedback.textContent = result.msg;
  ui.feedback.classList.remove('hidden');
  ui.feedback.classList.toggle('wrong', result.ok === false);
}

analysisDefs.forEach((def, idx) => analysisList.appendChild(createAnalysisQuestion(def, idx)));

// ===================== CONCLUSION (can be checked at any time, as often as you like) =====================
// Citation checkboxes: one per recorded observation (their state survives notebook changes).
function renderCiteList() {
  const checked = new Set([...citeList.querySelectorAll('input:checked')].map((i) => i.value));
  citeList.innerHTML = '';
  if (evidence.length === 0) {
    const p = document.createElement('p');
    p.className = 'cite-empty';
    p.textContent = 'Dalillar daftari hozircha bo‘sh. Daftarga yozilgan kuzatuvlar shu yerda paydo bo‘ladi — xohlasangiz, ularni xulosangizga dalil sifatida belgilaysiz.';
    citeList.appendChild(p);
    return;
  }
  evidence.forEach((r) => {
    const label = document.createElement('label');
    label.className = 'cite-item';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = r.key;
    input.checked = checked.has(r.key);
    input.addEventListener('change', () => { if (conclusionShown) paintConclusion(); });
    label.appendChild(input);
    const span = document.createElement('span');
    span.textContent = `${rowLabel(r)} `;
    const em = document.createElement('em');
    em.textContent = `(${r.text})`;
    span.appendChild(em);
    label.appendChild(span);
    citeList.appendChild(label);
  });
}

// Returns { ok, paragraphs } for the identity and cited rows the student chose. Never refuses.
function evaluateConclusion(identity, citedKeys) {
  const ident = supportedIdentity();
  const cited = evidence.filter((r) => citedKeys.includes(r.key));
  const paras = [];

  if (!identity) {
    return { ok: null, paragraphs: ['Xulosangizni tanlang — u daftaringizdagi dalillar bilan solishtiriladi.'] };
  }

  if (identity === 'unsure') {
    if (ident) {
      paras.push(`Aslida dalillaringiz hujayra turini ko‘rsatyapti: ${listNames(strongestRows())} ${IDENT_NAME[ident]}ga ishora qiladi.`);
    } else if (evidence.length === 0) {
      paras.push('Daftar hozircha bo‘sh, shuning uchun aniq xulosa chiqarib bo‘lmasligi tabiiy. Tuzilmalarni tekshirsangiz, dalillar paydo bo‘ladi.');
    } else {
      paras.push('Ehtiyotkorligingiz o‘rinli: daftardagi dalillar hozircha namunani ajratmaydi. Ikki turni ajratadigan tuzilmalarni (hujayra devori, xloroplast, vakuol) ham tekshirib ko‘rsangiz, xulosa aniqlashadi.');
    }
    return { ok: null, paragraphs: paras };
  }

  if (!ident) {
    const shared = evidence.filter((r) => r.points === 0);
    paras.push(`Hozircha bu xulosa dalillar bilan qo‘llab-quvvatlanmaydi. Daftardagi ${shared.length ? listNames(shared) : 'yozuvlar'} ikkala hujayra turida ham bor — ular «${IDENT_NAME[identity]}» xulosasini ham, boshqasini ham asoslamaydi.`);
    paras.push('Namunani ajratadigan tuzilmalarni tekshirsangiz, bu javob avtomatik qayta baholanadi.');
    return { ok: false, paragraphs: paras };
  }

  if (identity !== ident) {
    const pointing = evidence.filter((r) => r.leans === ident && r.points >= 2);
    paras.push(`Dalillaringiz boshqa tomonga ishora qiladi: ${listNames(pointing)} — ${IDENT_NAME[ident]}ga mos. «${IDENT_NAME[identity]}» xulosasi bu kuzatuvlarga zid.`);
    return { ok: false, paragraphs: paras };
  }

  // the identity matches the evidence
  const supporting = (cited.length ? cited : evidence).filter((r) => r.leans === identity && r.points >= 2);
  cited.forEach((r) => paras.push(`${STRUCTS[r.key].name}: ${r.implication}`));

  let ok = true;
  if (cited.length && !cited.some((r) => r.leans === identity && r.points >= 2)) {
    paras.push(`Belgilagan dalillaringiz xulosani yetarlicha asoslamaydi. Daftaringizdagi kuchli dalil: ${listNames(strongestRows())}.`);
    ok = false;
  }

  const shared = evidence.filter((r) => r.points === 0);
  paras.push(`Xulosa dalillaringizga mos: Namuna ${sample.letter} — ${IDENT_NAME[ident]}. Asosiy dalil: ${listNames(supporting.length ? supporting : strongestRows())}.`
    + (shared.length ? ` ${capitalize(listNames(shared))} esa ikkala turda ham bor, shuning uchun xulosaga hissa qo‘shmaydi.` : ''));

  if (!prediction) paras.push('Siz bashorat tanlamagan edingiz — xohlasangiz, endi bashorat tanlab, uni dalillar bilan solishtirib ko‘ring.');
  else if (prediction === 'unsure') paras.push('Siz boshida «ayta olmayman» degan edingiz — endi dalil asosida aniq xulosa chiqardingiz.');
  else if (prediction === ident) paras.push(`Dastlabki bashoratingiz (${predictionText()}) dalillar bilan tasdiqlandi.`);
  else paras.push(`Dastlabki bashoratingiz (${predictionText()}) dalillar bilan tasdiqlanmadi — bu normal: dalil fikrni o‘zgartirishi kerak.`);
  return { ok, paragraphs: paras };
}

function paintConclusion() {
  const cited = [...citeList.querySelectorAll('input:checked')].map((i) => i.value);
  const result = evaluateConclusion(identitySelect.value, cited);
  showFeedback(conclusionFeedback, result.ok, result.paragraphs);
}

conclusionBtn.addEventListener('click', () => {
  conclusionShown = true;
  paintConclusion();
});
identitySelect.addEventListener('change', () => { if (conclusionShown) paintConclusion(); });

// ===================== CHALLENGE (reasoning from given observations; every choice is explained) =====================
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

  stage.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      challengeAttempts++;
      const match = opt.value === stage.correct;
      challengeAnswers[idx] = match;

      optsDiv.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('selected', 'correct', 'incorrect'));
      btn.classList.add(match ? 'correct' : 'incorrect');
      feedback.textContent = match ? stage.right : stage.wrong[opt.value];
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
  const ident = supportedIdentity();
  const strongest = strongestRows();
  document.getElementById('finalSample').textContent = `${sample.letter} — ${ident ? IDENT_NAME[ident] : 'hali aniqlanmagan'}`;
  document.getElementById('finalChecked').textContent = `${evidence.length} / ${ORDER.length}`;
  document.getElementById('finalStrongest').textContent = strongest.length ? STRUCTS[strongest[0].key].name : '—';
  const solved = CHALLENGE_STAGES.every((_, i) => challengeAnswers[i] === true);
  document.getElementById('finalChallenge').textContent = solved
    ? `✓ (${challengeAttempts} javob)`
    : (challengeAttempts ? `${challengeAttempts} javob` : '—');
}

// ===================== RESET (also used for the initial state) =====================
// advance = true switches to the next unknown sample (A → B → C → A …)
function resetExperiment(advance) {
  if (advance) sampleIndex = (sampleIndex + 1) % SAMPLES.length;
  sample = SAMPLES[sampleIndex];

  prediction = null;
  selectedKey = null;
  inspected = new Set();
  evidence = [];
  compareFilter = 'all';
  analysisAnswers = {};
  conclusionShown = false;
  challengeAnswers = {};
  challengeAttempts = 0;

  applySampleLabels();
  drawCell(cellLayer, sample.outline, sample.cell, true);
  syncPrediction();

  // inspector
  infoTitle.textContent = 'Tuzilmani tanlang';
  infoText.textContent = 'Ro‘yxatdan tuzilmani tanlang. Namunada u bor-yo‘qligini tekshirib, kuzatuvingizni dalillar daftariga yozasiz.';
  infoText.classList.remove('hidden');
  infoDetail.classList.add('hidden');
  infoFunction.textContent = '';
  infoObservation.textContent = '';
  infoImplication.textContent = '';
  infoWindow.classList.remove('anim');
  cellCaption.textContent = 'Hujayradagi shaklni bosing yoki o‘ng tomondagi ro‘yxatdan tuzilmani tanlang.';

  // notebook + comparison
  compareFilters.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
  onEvidenceChanged();

  // answers
  Object.keys(analysisUI).forEach(paintAnswer);
  identitySelect.value = '';
  conclusionFeedback.classList.add('hidden');
  conclusionFeedback.innerHTML = '';
  challengeUI.forEach((ui) => {
    ui.optsDiv.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('selected', 'correct', 'incorrect'));
    ui.feedback.classList.add('hidden');
  });
  renderResults();

  buildQuiz(quizList, quizScore, quizData);
}

resetBtn.addEventListener('click', () => resetExperiment(true));

// ===================== INIT =====================
drawCell(document.getElementById('refPlantLayer'), REFERENCE_PLANT.outline, REFERENCE_PLANT.cell, false);
drawCell(document.getElementById('refAnimalLayer'), REFERENCE_ANIMAL.outline, REFERENCE_ANIMAL.cell, false);
resetExperiment(false);
