/* ============================================================
   HACK HOUSE NAGPUR 1.0 — APP.JS
   State machine, keyboard navigation, animations, canvas bg
   ============================================================ */

'use strict';

// ============================================================
// GOOGLE SHEETS ENDPOINT
// Paste your Apps Script Web App URL below after setup.
// See: google_sheets_setup.md
// ============================================================
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzJSB14eckRbXFNHgZ8sqYJzbPgvemQ-v1OdWjxOkxegJSkOHdW4p63ctwWgZr0AzYMng/exec';

// ============================================================
// STEP DEFINITIONS
// ============================================================

const STEPS = [
  {
    id: 'intro',
    type: 'intro',
    question: 'This is not a hackathon.',
    helper: "It's a 48-hour build sprint in Nagpur. You'll come in with nothing and leave with something real. We're keeping this small (~10 people). If you've built before and want to push harder — you're in the right place.",
    cta: "Let's go →",
  },
  {
    id: 'name',
    type: 'text',
    label: '01 →',
    question: "What's your name?",
    placeholder: 'Your full name',
    key: 'name',
  },
  {
    id: 'contact',
    type: 'text',
    label: '02 →',
    question: 'How do I reach you?',
    helper: "WhatsApp preferred. We won't spam you — promise.",
    placeholder: '+91 XXXXX XXXXX or email',
    key: 'contact',
  },
  {
    id: 'built',
    type: 'textarea',
    rows: 3,
    label: '03 →',
    question: 'What have you actually built?',
    helper: "GitHub links / live apps / anything real. No ideas please. We'll look.",
    placeholder: 'https://...',
    key: 'built',
  },
  {
    id: 'would_build',
    type: 'textarea',
    rows: 3,
    label: '04 →',
    question: 'If I gave you 48 hours right now — what would you build?',
    helper: "Be specific. 'An app' is not an answer.",
    placeholder: 'Be specific...',
    key: 'would_build',
  },
  {
    id: 'blocker',
    type: 'choice',
    label: '05 →',
    question: 'What usually stops you from shipping?',
    helper: "Honest answers only. We've all been there.",
    options: [
      'I overthink',
      'I keep improving instead of finishing',
      'I lose momentum',
      'I actually ship 👀',
    ],
    key: 'blocker',
  },
  {
    id: 'commitment',
    type: 'choice',
    label: '06 →',
    question: 'Can you go all-in for 48 hours?',
    helper: "This means no half-days, no 'I have something in the morning.'",
    options: [
      'Yes, fully locked in ✓',
      'Mostly, with some breaks',
      'Not really',
    ],
    key: 'commitment',
    flagRejected: true,
    rejectedOption: 'Not really',
  },
  {
    id: 'stack',
    type: 'text',
    label: '07 →',
    question: "What's your stack?",
    helper: 'Tech, tools, whatever you actually use. No need to impress.',
    placeholder: 'e.g. React, Node, Supabase, Figma...',
    key: 'stack',
  },
  {
    id: 'builder_type',
    type: 'choice',
    label: '08 →',
    question: 'What kind of builder are you?',
    helper: 'Pick the one that makes you slightly uncomfortable.',
    options: [
      'Ship fast, fix later 🚀',
      'Perfectionist (working on it)',
      'Idea machine 💡',
      'Chaos but it works 🔥',
    ],
    key: 'builder_type',
  },
  {
    id: 'why_you',
    type: 'textarea',
    rows: 4,
    label: '09 →',
    question: 'Why should we pick you?',
    helper: "Keep it real. No corporate answers. No 'I am passionate about technology.'",
    placeholder: 'Be honest.',
    key: 'why_you',
  },
  {
    id: 'closing',
    type: 'closing',
    question: "That's it.",
    helper: "If this felt slightly uncomfortable — that's the point. We're shortlisting a small group. You'll hear back soon.",
    muted: 'Built in Nagpur. By builders, for builders.',
  },
];

// ============================================================
// STATE
// ============================================================

let currentStep = 0;
let isAnimating = false;
let answers = {};
let selectedChoiceIndex = -1;

// ============================================================
// DOM REFERENCES
// ============================================================

const onboardingEl = document.getElementById('onboarding');
const applyBtn = document.getElementById('apply-btn');
const formView = document.getElementById('form-view');
const stepContainer = document.getElementById('step-container');
const progressBar = document.getElementById('progress-bar');
const backBtn = document.getElementById('back-btn');
const bgCanvas = document.getElementById('bg-canvas');

// ============================================================
// CANVAS BACKGROUND — Reactbits style animated grid + particles
// ============================================================

(function initCanvas() {
  const canvas = bgCanvas;
  const ctx = canvas.getContext('2d');

  let width, height, dpr;
  let particles = [];
  let animId;

  const PARTICLE_COUNT = 55;
  const GRID_SIZE = 48;
  const LINE_COLOR = 'rgba(4, 69, 175,';

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
    };
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    t += 0.004;

    // ---- Dot grid ----
    const cols = Math.ceil(width / GRID_SIZE) + 1;
    const rows = Math.ceil(height / GRID_SIZE) + 1;

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * GRID_SIZE;
        const y = row * GRID_SIZE;

        // Distance-based opacity from center
        const cx = width / 2;
        const cy = height / 2;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const maxDist = Math.sqrt(cx ** 2 + cy ** 2);
        const fadeFromCenter = 1 - (dist / maxDist);

        // Subtle wave ripple
        const wave = Math.sin(t + col * 0.3 + row * 0.3) * 0.5 + 0.5;
        const baseOpacity = 0.06 + wave * 0.04;
        const finalOpacity = baseOpacity * fadeFromCenter;

        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `${LINE_COLOR}${finalOpacity.toFixed(3)})`;
        ctx.fill();
      }
    }

    // ---- Floating particles ----
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const pulse = Math.sin(t * (p.pulseSpeed / 0.01) + p.pulseOffset) * 0.5 + 0.5;
      const opacity = p.opacity * (0.5 + pulse * 0.5);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${LINE_COLOR}${opacity.toFixed(3)})`;
      ctx.fill();
    });

    // ---- Connection lines between close particles ----
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const opacity = (1 - dist / 80) * 0.06;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `${LINE_COLOR}${opacity.toFixed(3)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  function start() {
    resize();
    initParticles();
    draw();
  }

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  // Pause when form is shown (performance)
  window.addEventListener('formStarted', () => {
    cancelAnimationFrame(animId);
  });

  start();
})();

// ============================================================
// ONBOARDING → FORM TRANSITION
// ============================================================

const applyBtns = document.querySelectorAll('.apply-cta');
applyBtns.forEach(btn => btn.addEventListener('click', startForm));

function startForm() {
  onboardingEl.classList.add('exiting');
  window.dispatchEvent(new Event('formStarted'));

  setTimeout(() => {
    onboardingEl.style.display = 'none';
    formView.classList.remove('hidden');
    currentStep = 0;
    renderStep(currentStep, 'enter');
    updateProgress();
    updateBackBtn();
    window.scrollTo(0, 0); // Ensure form starts at top
  }, 580);
}

// ============================================================
// STEP RENDERING
// ============================================================

function renderStep(index, direction = 'enter') {
  const step = STEPS[index];
  const el = buildStepEl(step, index);

  // Remove any existing step
  const existing = stepContainer.querySelector('.step');
  if (existing) {
    existing.classList.remove('entering');
    existing.classList.add('exiting');
    setTimeout(() => existing.remove(), 400);
  }

  el.classList.add('entering');
  stepContainer.appendChild(el);

  // Reset choice index
  selectedChoiceIndex = answers[step.key] !== undefined
    ? (step.options ? step.options.indexOf(answers[step.key]) : -1)
    : -1;

  // Stagger multiple choice items
  if (step.type === 'choice') {
    const items = el.querySelectorAll('.choice-item');
    items.forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), 60 + i * 55);
    });
    // Re-apply selected state
    if (selectedChoiceIndex >= 0) {
      items[selectedChoiceIndex]?.classList.add('selected');
    }
  }

  // Auto-focus text inputs
  if (step.type === 'text' || step.type === 'textarea') {
    const input = el.querySelector('input, textarea');
    if (input) {
      setTimeout(() => input.focus(), 200);
      if (answers[step.key]) input.value = answers[step.key];
    }
  }

  // Closing: show badge + log
  if (step.type === 'closing') {
    handleClosing();
  }
}

function buildStepEl(step, index) {
  const div = document.createElement('div');
  div.className = 'step';
  div.dataset.stepIndex = index;

  if (step.type === 'intro') {
    div.classList.add('step-intro');
    div.innerHTML = `
      <h1 class="step-question">${step.question}</h1>
      <p class="step-helper">${step.helper}</p>
      <div class="step-actions">
        <button class="ok-btn intro-cta" id="intro-ok">${step.cta}</button>
      </div>
    `;
    div.querySelector('#intro-ok').addEventListener('click', proceed);
  } else if (step.type === 'closing') {
    div.classList.add('step-closing');
    div.innerHTML = `
      <h2 class="step-question">${step.question}</h2>
      <p class="step-helper">${step.helper}</p>
      <p class="closing-muted">${step.muted}</p>
      <div class="submitted-badge" id="submitted-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Submitted
      </div>
    `;
  } else if (step.type === 'text') {
    div.innerHTML = `
      ${step.label ? `<div class="step-label" aria-label="Question ${step.label}">${step.label}</div>` : ''}
      <h2 class="step-question">${step.question}</h2>
      ${step.helper ? `<p class="step-helper">${step.helper}</p>` : ''}
      <input 
        type="text" 
        class="step-input" 
        id="input-${step.id}"
        placeholder="${step.placeholder || ''}" 
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        aria-label="${step.question}"
      />
      <div class="step-actions">
        <button class="ok-btn" aria-label="Confirm answer">OK ✓</button>
        <span class="enter-hint">press <kbd>Enter ↵</kbd></span>
      </div>
    `;
    div.querySelector('.ok-btn').addEventListener('click', proceed);
    div.querySelector('input').addEventListener('keydown', handleInputKeydown);
  } else if (step.type === 'textarea') {
    div.innerHTML = `
      ${step.label ? `<div class="step-label" aria-label="Question ${step.label}">${step.label}</div>` : ''}
      <h2 class="step-question">${step.question}</h2>
      ${step.helper ? `<p class="step-helper">${step.helper}</p>` : ''}
      <textarea 
        class="step-textarea" 
        id="textarea-${step.id}"
        rows="${step.rows || 3}" 
        placeholder="${step.placeholder || ''}"
        aria-label="${step.question}"
      ></textarea>
      <div class="step-actions">
        <button class="ok-btn" aria-label="Confirm answer">OK ✓</button>
        <span class="enter-hint">press <kbd>Ctrl + Enter ↵</kbd></span>
      </div>
    `;
    div.querySelector('.ok-btn').addEventListener('click', proceed);
    div.querySelector('textarea').addEventListener('keydown', handleTextareaKeydown);
  } else if (step.type === 'choice') {
    const keysRow = ['A', 'B', 'C', 'D'];
    const optionsHTML = step.options.map((opt, i) => `
      <button class="choice-item" data-index="${i}" aria-label="${opt}" role="radio" aria-checked="false">
        <span class="choice-key" aria-hidden="true">${keysRow[i]}</span>
        <span>${opt}</span>
      </button>
    `).join('');

    div.innerHTML = `
      ${step.label ? `<div class="step-label" aria-label="Question ${step.label}">${step.label}</div>` : ''}
      <h2 class="step-question">${step.question}</h2>
      ${step.helper ? `<p class="step-helper">${step.helper}</p>` : ''}
      <div class="choice-grid" role="radiogroup" aria-label="${step.question}">
        ${optionsHTML}
      </div>
      <div class="step-actions">
        <button class="ok-btn" aria-label="Confirm selection">OK ✓</button>
        <span class="enter-hint">press <kbd>Enter ↵</kbd></span>
      </div>
    `;

    div.querySelector('.ok-btn').addEventListener('click', proceed);

    div.querySelectorAll('.choice-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectChoice(div, parseInt(btn.dataset.index));
      });
    });
  }

  return div;
}

// ============================================================
// CHOICE SELECTION
// ============================================================

function selectChoice(stepEl, index) {
  const items = stepEl.querySelectorAll('.choice-item');
  items.forEach((item, i) => {
    item.classList.toggle('selected', i === index);
    item.setAttribute('aria-checked', i === index ? 'true' : 'false');
  });
  selectedChoiceIndex = index;
}

// ============================================================
// KEYBOARD HANDLERS
// ============================================================

function handleInputKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    proceed();
  } else if (e.key === 'Backspace' && e.target.value === '') {
    goBack();
  }
}

function handleTextareaKeydown(e) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    proceed();
  } else if (e.key === 'Backspace' && e.target.value === '') {
    goBack();
  }
}

// Global keyboard for choice questions
document.addEventListener('keydown', (e) => {
  if (formView.classList.contains('hidden')) return;
  const step = STEPS[currentStep];
  if (!step) return;

  if (step.type === 'choice') {
    if (e.key === 'Enter') {
      e.preventDefault();
      proceed();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(selectedChoiceIndex + 1, step.options.length - 1);
      const stepEl = stepContainer.querySelector('.step');
      if (stepEl) selectChoice(stepEl, next < 0 ? 0 : next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(selectedChoiceIndex - 1, 0);
      const stepEl = stepContainer.querySelector('.step');
      if (stepEl) selectChoice(stepEl, prev);
    } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
      const map = { a: 0, b: 1, c: 2, d: 3 };
      const idx = map[e.key.toLowerCase()];
      if (idx < step.options.length) {
        const stepEl = stepContainer.querySelector('.step');
        if (stepEl) selectChoice(stepEl, idx);
      }
    }
  }

  if (step.type === 'intro' && e.key === 'Enter') {
    e.preventDefault();
    proceed();
  }
});

// ============================================================
// PROCEED (NEXT STEP)
// ============================================================

function proceed() {
  if (isAnimating) return;
  const step = STEPS[currentStep];

  // Save answer
  if (step.type === 'text') {
    const input = stepContainer.querySelector('input');
    if (input) answers[step.key] = input.value.trim();
  } else if (step.type === 'textarea') {
    const textarea = stepContainer.querySelector('textarea');
    if (textarea) answers[step.key] = textarea.value.trim();
  } else if (step.type === 'choice') {
    if (selectedChoiceIndex === -1) return; // Must select something
    const value = step.options[selectedChoiceIndex];
    answers[step.key] = value;

    // Flag rejected commitment
    if (step.flagRejected && value === step.rejectedOption) {
      answers[`${step.key}_rejected`] = true;
      const stepEl = stepContainer.querySelector('.step');
      if (stepEl) {
        const selectedItem = stepEl.querySelectorAll('.choice-item')[selectedChoiceIndex];
        if (selectedItem) selectedItem.dataset.rejected = 'true';
      }
    }
  }

  if (currentStep < STEPS.length - 1) {
    goToStep(currentStep + 1);
  }
}

// ============================================================
// NAVIGATION
// ============================================================

function goToStep(index) {
  if (isAnimating) return;
  isAnimating = true;

  const existing = stepContainer.querySelector('.step');
  if (existing) {
    existing.classList.remove('entering');
    existing.classList.add('exiting');
  }

  setTimeout(() => {
    if (existing) existing.remove();
    currentStep = index;
    renderStep(currentStep, 'enter');
    updateProgress();
    updateBackBtn();
    isAnimating = false;
  }, 400);
}

function goBack() {
  if (currentStep <= 0 || isAnimating) return;
  goToStep(currentStep - 1);
}

backBtn.addEventListener('click', goBack);

// ============================================================
// PROGRESS BAR
// ============================================================

function updateProgress() {
  const total = STEPS.length - 1; // exclude closing screen from count
  const current = Math.min(currentStep, total);
  const pct = (current / total) * 100;
  progressBar.style.width = `${pct}%`;
  progressBar.parentElement.setAttribute('aria-valuenow', Math.round(pct));
}

// ============================================================
// BACK BUTTON VISIBILITY
// ============================================================

function updateBackBtn() {
  if (currentStep > 0 && STEPS[currentStep].type !== 'closing') {
    backBtn.classList.remove('hidden');
  } else {
    backBtn.classList.add('hidden');
  }
}

// ============================================================
// CLOSING SCREEN  
// ============================================================

async function handleClosing() {
  const submission = {
    timestamp: new Date().toISOString(),
    event: 'Hack House Nagpur 1.0',
    answers: { ...answers },
  };

  console.log('%c📦 Hack House Nagpur 1.0 — Submission', 'font-size:14px;font-weight:bold;color:#0445AF;');
  console.log(JSON.stringify(submission, null, 2));

  const badge = document.getElementById('submitted-badge');

  // Show loading state
  if (badge) {
    badge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 0.8s linear infinite" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Submitting...
    `;
    badge.style.background = '#EFF6FF';
    badge.style.borderColor = '#BFDBFE';
    badge.style.color = '#1D4ED8';
    setTimeout(() => badge.classList.add('visible'), 300);
  }

  // POST to Google Sheets
  if (SHEETS_ENDPOINT && SHEETS_ENDPOINT !== 'PASTE_YOUR_WEB_APP_URL_HERE') {
    try {
      const res = await fetch(SHEETS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for no-CORS
        body: JSON.stringify(submission),
      });

      const json = await res.json();

      if (json.status === 'ok') {
        showSubmittedBadge(badge, 'success');
      } else {
        console.error('Sheets error:', json.message);
        showSubmittedBadge(badge, 'error');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      showSubmittedBadge(badge, 'error');
    }
  } else {
    // Endpoint not configured — show success anyway (dev mode)
    console.warn('⚠️ SHEETS_ENDPOINT not configured. Data logged to console only.');
    setTimeout(() => showSubmittedBadge(badge, 'success'), 800);
  }
}

function showSubmittedBadge(badge, state) {
  if (!badge) return;
  if (state === 'success') {
    badge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Submitted
    `;
    badge.style.background = '#F0FDF4';
    badge.style.borderColor = '#BBF7D0';
    badge.style.color = '#16A34A';
  } else {
    badge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      Error — check console
    `;
    badge.style.background = '#FEF2F2';
    badge.style.borderColor = '#FECACA';
    badge.style.color = '#DC2626';
  }
  badge.classList.add('visible');
}
