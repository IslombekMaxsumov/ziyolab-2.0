// ===================== MOBILE NAVIGATION =====================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('active');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu after clicking a link
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ===================== SMOOTH SCROLL WITH NAVBAR OFFSET =====================
const navbar = document.querySelector('.navbar');

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId.length <= 1) return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    const offset = navbar.offsetHeight;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ===================== SUBJECT FILTERS =====================
const subjectFilters = document.getElementById('subjectFilters');

if (subjectFilters) {
  const filterButtons = subjectFilters.querySelectorAll('.filter-btn');
  const subjectCards = document.querySelectorAll('#subjectsGrid .subject-card');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      subjectCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.subject === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

// ===================== SCROLL REVEAL =====================
const revealTargets = document.querySelectorAll('.subject-card, .feature-card, .stat-item, .about-block');

if (revealTargets.length && 'IntersectionObserver' in window) {
  revealTargets.forEach((el) => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach((el) => revealObserver.observe(el));
}
