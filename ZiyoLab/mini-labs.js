// ===================== MODAL CORE =====================
const miniModal = document.getElementById('miniModal');
const miniModalBody = document.getElementById('miniModalBody');
const miniModalClose = document.getElementById('miniModalClose');
const miniModalOverlay = document.getElementById('miniModalOverlay');

function openMiniModal(key) {
  const exp = miniExperiments[key];
  if (!exp) return;
  miniModalBody.innerHTML = exp.html;
  miniModal.classList.add('open');
  miniModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  exp.init();
}

function closeMiniModal() {
  miniModal.classList.remove('open');
  miniModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  miniModalBody.innerHTML = '';
}

miniModalClose.addEventListener('click', closeMiniModal);
miniModalOverlay.addEventListener('click', closeMiniModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && miniModal.classList.contains('open')) closeMiniModal();
});

document.querySelectorAll('[data-mini]').forEach((btn) => {
  btn.addEventListener('click', () => openMiniModal(btn.dataset.mini));
});

// ===================== ABOUT CONTENT =====================
const ABOUT_LABELS = ['Kelib chiqishi', 'Nima uchun kerak?', 'Haqiqiy hayotda', 'Asosiy g‘oya'];

const aboutData = {
  spring: [
    'Ingliz olimi Robert Guk 17-asrda kuch va prujina cho‘zilishi orasidagi bog‘liqlikni kashf etgan.',
    'Bu qonun kuchlar va elastik materiallarni tushunish uchun asos bo‘ladi.',
    'Prujina tarozilar, amortizatorlar va turli mexanik qurilmalarda qo‘llaniladi.',
    'Elastik chegarada, kuch qancha katta bo‘lsa, cho‘zilish shuncha katta bo‘ladi.'
  ],
  pendulum: [
    'Mayatnik harakati fizikaning klassik tajribalaridan biri bo‘lib, vaqt va harakatni o‘rganishda tarixiy ahamiyatga ega.',
    'Bu tajriba davriy harakatni tushunish uchun foydalidir.',
    'Mayatniklar soatlarda, o‘lchash asboblarida va fizik tajribalarda qo‘llanilgan.',
    'Mayatnik davri asosan uning uzunligiga bog‘liq.'
  ],
  concentration: [
    'Konsentratsiya tushunchasi kimyoda moddalar miqdorini aniq ifodalash zaruratidan kelib chiqqan.',
    'Konsentratsiyani bilish eritmaning xossalarini to‘g‘ri baholash uchun muhim.',
    'Bu tushuncha laboratoriyalarda, tibbiyotda, oziq-ovqat, ichimliklarda va suvni tozalashda qo‘llaniladi.',
    'Erigan modda yoki erituvchi miqdorini o‘zgartirish konsentratsiyani o‘zgartiradi.'
  ],
  density: [
    'Zichlik tushunchasi moddalarning massa va hajm nisbatini ifodalash uchun fanga kiritilgan.',
    'Massa va hajmni solishtirish moddani aniqlash uchun yordam beradi.',
    'Zichlik moddalarni aniqlashda, suzish/cho‘kish hodisalarida va muhandislik o‘lchovlarida qo‘llaniladi.',
    'ρ = m / V — zichlik massaning hajmga nisbati sifatida hisoblanadi.'
  ],
  diffusion: [
    'Diffuziya — zarrachalarning yuqori konsentratsiyadan past konsentratsiyaga tabiiy harakati sifatida o‘rganilgan.',
    'Bu jarayon biologiya va kimyoda moddalar almashinuvini tushunish uchun muhim.',
    'Diffuziya gazlar almashinuvida, hujayralarda va moddalarning tarqalishida namoyon bo‘ladi.',
    'Zarrachalarning tasodifiy harakati ularning tekis tarqalishiga olib keladi.'
  ],
  foodchain: [
    'Oziqa zanjiri tushunchasi ekotizimlardagi organizmlar orasidagi bog‘liqlikni o‘rganishdan kelib chiqqan.',
    'Organizmlar orasidagi energiya almashinuvini tushunish ekotizimni to‘g‘ri baholash uchun zarur.',
    'Bu bilim ekologiya, atrof-muhitni muhofaza qilish va biologik xilma-xillikni o‘rganishda qo‘llaniladi.',
    'Energiya oddiy zanjir bo‘yicha oqadi: o‘simlik → o‘txo‘r hayvon → yirtqich.'
  ]
};

function aboutHtml(key) {
  const texts = aboutData[key];
  const blocks = ABOUT_LABELS.map((label, i) => `
    <div class="mini-about-block">
      <h4>${label}</h4>
      <p>${texts[i]}</p>
    </div>
  `).join('');
  return `
    <div class="mini-about">
      <div class="mini-about-title">Tajriba haqida</div>
      <div class="mini-about-grid">${blocks}</div>
    </div>
  `;
}

// ===================== 1. SPRING =====================
function buildSpringPath(bottomY) {
  const topY = 10;
  const coils = 8;
  const segH = (bottomY - topY) / coils;
  let d = `M80,${topY}`;
  for (let i = 1; i <= coils; i++) {
    const y = topY + segH * i;
    const x = 80 + (i % 2 === 0 ? 18 : -18);
    d += ` L${x},${y}`;
  }
  return d;
}

const springExperiment = {
  html: `
    <h2 class="mini-title">Prujina va kuch</h2>
    <p class="mini-subtitle">Massani o‘zgartirib, prujina cho‘zilishini kuzating.</p>
    <div class="mini-stage">
      <div class="mini-stage-inner">
        <div class="mini-visual">
          <svg viewBox="0 0 160 210">
            <line x1="30" y1="10" x2="130" y2="10" stroke="#F3F0E8" stroke-width="4"/>
            <path id="springPath" d="" stroke="#D9B85F" stroke-width="3" fill="none"/>
            <rect id="springWeight" x="60" y="40" width="40" height="28" rx="4" fill="#C86B3D"/>
          </svg>
        </div>
      </div>
      <div class="mini-controls">
        <div class="mini-control-row">
          <div class="mini-control-head"><label>Massa</label><span id="springMassVal">5 kg</span></div>
          <input type="range" id="springMass" min="1" max="10" step="1" value="5">
        </div>
      </div>
      <div class="mini-results">
        <div class="mini-result-tile"><span class="measurement-label">Kuch (F)</span><span class="measurement-value"><span id="springForce">49.0</span><small>N</small></span></div>
        <div class="mini-result-tile"><span class="measurement-label">Cho‘zilish</span><span class="measurement-value"><span id="springExt">40.8</span><small>sm</small></span></div>
      </div>
    </div>
    <div class="mini-actions">
      <button type="button" class="btn btn-secondary" id="springReset">Qayta boshlash</button>
    </div>
    ${aboutHtml('spring')}
  `,
  init() {
    const massSlider = document.getElementById('springMass');
    const massVal = document.getElementById('springMassVal');
    const forceEl = document.getElementById('springForce');
    const extEl = document.getElementById('springExt');
    const path = document.getElementById('springPath');
    const weight = document.getElementById('springWeight');

    function update() {
      updateSliderFill(massSlider);
      const mass = parseFloat(massSlider.value);
      massVal.textContent = mass + ' kg';
      const force = mass * 9.8;
      const ext = force / 1.2;
      forceEl.textContent = force.toFixed(1);
      extEl.textContent = ext.toFixed(1);
      const bottomY = 40 + ext * 1.4;
      path.setAttribute('d', buildSpringPath(bottomY));
      weight.setAttribute('y', bottomY);
    }

    massSlider.addEventListener('input', update);
    document.getElementById('springReset').addEventListener('click', () => {
      massSlider.value = 5;
      update();
    });
    update();
  }
};

// ===================== 2. PENDULUM =====================
const pendulumExperiment = {
  html: `
    <h2 class="mini-title">Mayatnik harakati</h2>
    <p class="mini-subtitle">Uzunlikni o‘zgartirib, tebranish davrini kuzating.</p>
    <div class="mini-stage">
      <div class="mini-stage-inner">
        <div class="mini-visual">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="20" r="4" fill="#F3F0E8"/>
            <g id="penGroup">
              <line id="penRod" x1="100" y1="20" x2="100" y2="120" stroke="#F3F0E8" stroke-width="2"/>
              <circle id="penBob" cx="100" cy="120" r="14" fill="#C86B3D"/>
            </g>
          </svg>
        </div>
      </div>
      <div class="mini-controls">
        <div class="mini-control-row">
          <div class="mini-control-head"><label>Uzunlik</label><span id="penLenVal">60 sm</span></div>
          <input type="range" id="penLen" min="20" max="100" step="5" value="60">
        </div>
      </div>
      <div class="mini-results">
        <div class="mini-result-tile"><span class="measurement-label">Taxminiy davr (T)</span><span class="measurement-value"><span id="penPeriod">1.55</span><small>s</small></span></div>
      </div>
    </div>
    <div class="mini-actions">
      <button type="button" class="btn btn-secondary" id="penReset">Qayta boshlash</button>
    </div>
    ${aboutHtml('pendulum')}
  `,
  init() {
    const lenSlider = document.getElementById('penLen');
    const lenVal = document.getElementById('penLenVal');
    const periodEl = document.getElementById('penPeriod');
    const rod = document.getElementById('penRod');
    const bob = document.getElementById('penBob');
    const group = document.getElementById('penGroup');

    function update() {
      updateSliderFill(lenSlider);
      const lenCm = parseFloat(lenSlider.value);
      lenVal.textContent = lenCm + ' sm';
      const period = 2 * Math.PI * Math.sqrt((lenCm / 100) / 9.8);
      periodEl.textContent = period.toFixed(2);

      const rodPx = 30 + lenCm * 0.85;
      const bobY = 20 + rodPx;
      rod.setAttribute('y2', bobY);
      bob.setAttribute('cy', bobY);
      group.style.animationDuration = (period * 1.6).toFixed(2) + 's';
    }

    lenSlider.addEventListener('input', update);
    document.getElementById('penReset').addEventListener('click', () => {
      lenSlider.value = 60;
      update();
    });
    update();
  }
};

// ===================== 3. CONCENTRATION =====================
const concentrationExperiment = {
  html: `
    <h2 class="mini-title">Eritma konsentratsiyasi</h2>
    <p class="mini-subtitle">Erigan modda va suv miqdorini o‘zgartirib, konsentratsiyani kuzating.</p>
    <div class="mini-stage">
      <div class="mini-stage-inner">
        <div class="mini-visual">
          <svg viewBox="0 0 200 160">
            <rect x="20" y="15" width="160" height="130" rx="6" fill="#E8E5DC" stroke="#20231F" stroke-width="2"/>
            <g id="concParticles"></g>
          </svg>
        </div>
      </div>
      <div class="mini-controls">
        <div class="mini-control-row">
          <div class="mini-control-head"><label>Erigan modda</label><span id="soluteVal">20 g</span></div>
          <input type="range" id="soluteSlider" min="0" max="50" step="1" value="20">
        </div>
        <div class="mini-control-row">
          <div class="mini-control-head"><label>Suv</label><span id="waterVal">150 mL</span></div>
          <input type="range" id="waterSlider" min="50" max="300" step="10" value="150">
        </div>
      </div>
      <div class="mini-results">
        <div class="mini-result-tile"><span class="measurement-label">Konsentratsiya</span><span class="measurement-value"><span id="concValue">11.8</span><small>%</small></span></div>
      </div>
    </div>
    <div class="mini-actions">
      <button type="button" class="btn btn-secondary" id="concReset">Qayta boshlash</button>
    </div>
    ${aboutHtml('concentration')}
  `,
  init() {
    const soluteSlider = document.getElementById('soluteSlider');
    const waterSlider = document.getElementById('waterSlider');
    const soluteVal = document.getElementById('soluteVal');
    const waterVal = document.getElementById('waterVal');
    const concValue = document.getElementById('concValue');
    const group = document.getElementById('concParticles');

    function update() {
      updateSliderFill(soluteSlider);
      updateSliderFill(waterSlider);
      const solute = parseFloat(soluteSlider.value);
      const water = parseFloat(waterSlider.value);
      soluteVal.textContent = solute + ' g';
      waterVal.textContent = water + ' mL';

      const conc = (solute / (solute + water)) * 100;
      concValue.textContent = conc.toFixed(1);

      const count = Math.round(clamp(4 + conc * 1.1, 4, 45));
      group.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const cx = 32 + Math.random() * 136;
        const cy = 27 + Math.random() * 106;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx.toFixed(1));
        circle.setAttribute('cy', cy.toFixed(1));
        circle.setAttribute('r', 3.2);
        circle.setAttribute('fill', '#49634F');
        group.appendChild(circle);
      }
    }

    soluteSlider.addEventListener('input', update);
    waterSlider.addEventListener('input', update);
    document.getElementById('concReset').addEventListener('click', () => {
      soluteSlider.value = 20;
      waterSlider.value = 150;
      update();
    });
    update();
  }
};

// ===================== 4. DENSITY =====================
const densityExperiment = {
  html: `
    <h2 class="mini-title">Zichlik tajribasi</h2>
    <p class="mini-subtitle">Massa va hajmni o‘zgartirib, zichlikni hisoblang.</p>
    <div class="mini-stage">
      <div class="mini-stage-inner">
        <div class="mini-visual">
          <svg viewBox="0 0 160 200">
            <path d="M30,20 L30,160 Q30,175 45,175 L115,175 Q130,175 130,160 L130,20" fill="none" stroke="#20231F" stroke-width="2.4" stroke-linejoin="round"/>
            <rect x="33" y="60" width="94" height="112" fill="rgba(73,99,79,0.18)"/>
            <rect id="densityObj" x="60" y="80" width="40" height="30" rx="3" fill="#C86B3D" stroke="#20231F" stroke-width="1.5"/>
          </svg>
        </div>
      </div>
      <div class="mini-controls">
        <div class="mini-control-row">
          <div class="mini-control-head"><label>Massa</label><span id="densMassVal">10 kg</span></div>
          <input type="range" id="densMass" min="1" max="20" step="1" value="10">
        </div>
        <div class="mini-control-row">
          <div class="mini-control-head"><label>Hajm</label><span id="densVolVal">10 L</span></div>
          <input type="range" id="densVol" min="1" max="20" step="1" value="10">
        </div>
      </div>
      <div class="mini-results">
        <div class="mini-result-tile"><span class="measurement-label">Zichlik (ρ)</span><span class="measurement-value"><span id="densValue">1.00</span><small>kg/L</small></span></div>
      </div>
    </div>
    <div class="mini-actions">
      <button type="button" class="btn btn-secondary" id="densReset">Qayta boshlash</button>
    </div>
    ${aboutHtml('density')}
  `,
  init() {
    const massSlider = document.getElementById('densMass');
    const volSlider = document.getElementById('densVol');
    const massVal = document.getElementById('densMassVal');
    const volVal = document.getElementById('densVolVal');
    const densValue = document.getElementById('densValue');
    const obj = document.getElementById('densityObj');

    function update() {
      updateSliderFill(massSlider);
      updateSliderFill(volSlider);
      const mass = parseFloat(massSlider.value);
      const vol = parseFloat(volSlider.value);
      massVal.textContent = mass + ' kg';
      volVal.textContent = vol + ' L';

      const density = mass / vol;
      densValue.textContent = density.toFixed(2);

      const t = clamp(density / 2, 0, 1);
      const y = 65 + t * (150 - 65);
      obj.setAttribute('y', y.toFixed(1));
    }

    massSlider.addEventListener('input', update);
    volSlider.addEventListener('input', update);
    document.getElementById('densReset').addEventListener('click', () => {
      massSlider.value = 10;
      volSlider.value = 10;
      update();
    });
    update();
  }
};

// ===================== 5. DIFFUSION =====================
const diffusionExperiment = {
  html: `
    <h2 class="mini-title">Diffuziya</h2>
    <p class="mini-subtitle">Zarracha sonini o‘zgartiring va ularning tarqalishini kuzating.</p>
    <div class="mini-stage">
      <div class="mini-stage-inner">
        <div class="mini-visual">
          <svg viewBox="0 0 200 140">
            <rect x="10" y="10" width="180" height="120" rx="6" fill="#E8E5DC" stroke="#20231F" stroke-width="2"/>
            <g id="diffParticles"></g>
          </svg>
        </div>
      </div>
      <div class="mini-controls">
        <div class="mini-control-row">
          <div class="mini-control-head"><label>Konsentratsiya (zarrachalar soni)</label><span id="diffCountVal">15</span></div>
          <input type="range" id="diffCount" min="5" max="40" step="1" value="15">
        </div>
      </div>
      <p class="mini-feedback" id="diffFeedback">Zarrachalar chapda to‘plangan — konsentratsiyani o‘zgartiring.</p>
    </div>
    <div class="mini-actions">
      <button type="button" class="btn btn-secondary" id="diffReset">Qayta boshlash</button>
    </div>
    ${aboutHtml('diffusion')}
  `,
  init() {
    const countSlider = document.getElementById('diffCount');
    const countVal = document.getElementById('diffCountVal');
    const group = document.getElementById('diffParticles');
    const feedback = document.getElementById('diffFeedback');

    function buildParticles(count) {
      group.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'diffusion-particle');
        circle.setAttribute('cx', (18 + Math.random() * 14).toFixed(1));
        circle.setAttribute('cy', (20 + Math.random() * 100).toFixed(1));
        circle.setAttribute('r', 3);
        circle.setAttribute('fill', '#49634F');
        group.appendChild(circle);
      }
    }

    function spread() {
      group.querySelectorAll('.diffusion-particle').forEach((p) => {
        p.setAttribute('cx', (18 + Math.random() * 164).toFixed(1));
        p.setAttribute('cy', (18 + Math.random() * 104).toFixed(1));
      });
      feedback.textContent = 'Zarrachalar butun idish bo‘ylab tekis tarqaldi.';
    }

    countSlider.addEventListener('input', () => {
      updateSliderFill(countSlider);
      const count = parseInt(countSlider.value, 10);
      countVal.textContent = count;
      buildParticles(count);
      feedback.textContent = 'Zarrachalar chapda to‘plangan — tarqalishini kuzating.';
      setTimeout(spread, 250);
    });

    document.getElementById('diffReset').addEventListener('click', () => {
      countSlider.value = 15;
      countVal.textContent = 15;
      updateSliderFill(countSlider);
      buildParticles(15);
      feedback.textContent = 'Zarrachalar chapda to‘plangan — konsentratsiyani o‘zgartiring.';
    });

    updateSliderFill(countSlider);
    buildParticles(15);
  }
};

// ===================== 6. FOOD CHAIN =====================
const FOOD_CHAIN_CORRECT = ['Quyosh', 'O‘simlik', 'Chigirtka', 'Qurbaqa', 'Ilon'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const foodChainExperiment = {
  html: `
    <h2 class="mini-title">Oziqa zanjiri</h2>
    <p class="mini-subtitle">Organizmlarni energiya oqimi bo‘yicha to‘g‘ri tartibda joylashtiring.</p>
    <div class="mini-stage">
      <div class="mini-stage-inner" style="flex-direction: column; align-items: stretch;">
        <div class="chain-slots" id="chainSlots"></div>
        <div class="chain-pool" id="chainPool"></div>
      </div>
      <p class="mini-feedback" id="chainFeedback">Organizmlarni bosib, zanjirni tuzing.</p>
      <div class="mini-actions">
        <button type="button" class="btn btn-primary" id="chainCheck">Tekshirish</button>
      </div>
    </div>
    <div class="mini-actions">
      <button type="button" class="btn btn-secondary" id="chainReset">Qayta boshlash</button>
    </div>
    ${aboutHtml('foodchain')}
  `,
  init() {
    const slotsEl = document.getElementById('chainSlots');
    const poolEl = document.getElementById('chainPool');
    const feedback = document.getElementById('chainFeedback');
    let chain = [];

    function renderSlots() {
      slotsEl.innerHTML = '';
      for (let i = 0; i < FOOD_CHAIN_CORRECT.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'chain-slot';
        if (chain[i]) {
          slot.classList.add('filled');
          slot.textContent = chain[i];
        } else {
          slot.textContent = i + 1;
        }
        slotsEl.appendChild(slot);
      }
    }

    function renderPool() {
      const shuffled = shuffle(FOOD_CHAIN_CORRECT);
      poolEl.innerHTML = '';
      shuffled.forEach((name) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chain-item';
        btn.textContent = name;
        btn.addEventListener('click', () => {
          if (chain.length >= FOOD_CHAIN_CORRECT.length) return;
          chain.push(name);
          btn.disabled = true;
          renderSlots();
          feedback.textContent = chain.length === FOOD_CHAIN_CORRECT.length
            ? '«Tekshirish» tugmasini bosing.'
            : 'Organizmlarni bosib, zanjirni tuzing.';
        });
        poolEl.appendChild(btn);
      });
    }

    document.getElementById('chainCheck').addEventListener('click', () => {
      if (chain.length < FOOD_CHAIN_CORRECT.length) {
        feedback.textContent = 'Avval barcha 5 ta joyni to‘ldiring.';
        feedback.classList.add('wrong');
        return;
      }
      let correctCount = 0;
      [...slotsEl.children].forEach((slot, i) => {
        slot.classList.remove('correct', 'incorrect');
        if (chain[i] === FOOD_CHAIN_CORRECT[i]) {
          slot.classList.add('correct');
          correctCount++;
        } else {
          slot.classList.add('incorrect');
        }
      });
      if (correctCount === FOOD_CHAIN_CORRECT.length) {
        feedback.textContent = 'To‘g‘ri! Zanjir to‘g‘ri tartibda tuzildi.';
        feedback.classList.remove('wrong');
      } else {
        feedback.textContent = `${correctCount} / ${FOOD_CHAIN_CORRECT.length} to‘g‘ri. Qayta urinib ko‘ring.`;
        feedback.classList.add('wrong');
      }
    });

    document.getElementById('chainReset').addEventListener('click', () => {
      chain = [];
      feedback.textContent = 'Organizmlarni bosib, zanjirni tuzing.';
      feedback.classList.remove('wrong');
      renderSlots();
      renderPool();
    });

    renderSlots();
    renderPool();
  }
};

// ===================== REGISTRY =====================
const miniExperiments = {
  spring: springExperiment,
  pendulum: pendulumExperiment,
  concentration: concentrationExperiment,
  density: densityExperiment,
  diffusion: diffusionExperiment,
  foodchain: foodChainExperiment
};
