// =====================================================================
// nav.js — free navigation between the stages of an investigation lab.
//
// Every stage is on the page from the start and every step in the bar can be
// opened at any time, in any order. Nothing is locked, nothing has to be
// completed first. The highlighted step only shows WHERE the student currently
// is: it follows the scrolling, and clicking a step jumps to that section.
//
// Usage:
//   createStageNav({ stepsList: <ol>, stages: [{ el: <section> }, ...] });
// The <li> elements of the list and the stages are matched by position.
// =====================================================================

function createStageNav(cfg) {
  const items = [...cfg.stepsList.children];
  const targets = cfg.stages.map((s) => s.el);
  const navbar = document.querySelector('.navbar');
  const bar = cfg.stepsList.closest('.stage-nav') || cfg.stepsList;
  let current = -1;
  let ignoreScrollUntil = 0;     // while a smooth scroll is running the highlight is set by the click

  items.forEach((li, i) => {
    li.querySelector('.step-num').textContent = i + 1;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
  });

  function setCurrent(i) {
    if (i === current) return;
    current = i;
    items.forEach((li, k) => {
      li.classList.toggle('active', k === i);
      if (k === i) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    // keep the highlighted step visible when the bar scrolls sideways (phones)
    const list = cfg.stepsList;
    if (list.scrollWidth > list.clientWidth) {
      const li = items[i];
      list.scrollLeft = li.offsetLeft - (list.clientWidth - li.offsetWidth) / 2;
    }
  }

  // the section that is currently under the navigation bar
  function detect() {
    if (Date.now() < ignoreScrollUntil) return;
    const line = navbar.offsetHeight + bar.offsetHeight + 60;
    let idx = 0;
    targets.forEach((el, i) => { if (el.getBoundingClientRect().top <= line) idx = i; });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) idx = targets.length - 1;
    setCurrent(idx);
  }

  function goTo(i) {
    ignoreScrollUntil = Date.now() + 900;
    setCurrent(i);
    targets[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  items.forEach((li, i) => {
    li.addEventListener('click', () => goTo(i));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(i); }
    });
  });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; detect(); });
  }, { passive: true });
  window.addEventListener('resize', detect);

  detect();
  return { goTo, detect };
}
