/* ═══════════════════════════════════════════
   LUCKY DRAW — app.js
   Pure vanilla JS · localStorage persistence
═══════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────
//  STATE
// ──────────────────────────────────────────
const STORAGE_KEY = 'luckydraw_v1';

let state = {
  participants: [],   // string[]
  prizes: [
    { id: 'p1', name: '頭  獎', count: 1,  color: '#FF4D4D' },
    { id: 'p2', name: '二  獎', count: 2,  color: '#00E5FF' },
    { id: 'p3', name: '三  獎', count: 3,  color: '#FFD740' },
  ],
  winners: [],        // { name, prizeId, prizeName, time }[]
};

let selectedPrizeId = null;
let drawQty         = 1;
let isSpinning      = false;

// ──────────────────────────────────────────
//  PERSISTENCE
// ──────────────────────────────────────────
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (_) {}
}

// ──────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function genId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2000);
  setTimeout(() => el.remove(), 2400);
}
function nowStr() {
  return new Date().toLocaleString('zh-TW', { hour12: false });
}
function getWonNames() {
  return new Set(state.winners.map(w => w.name));
}
function getPrize(id) {
  return state.prizes.find(p => p.id === id);
}
function wonCountForPrize(id) {
  return state.winners.filter(w => w.prizeId === id).length;
}
function availablePool() {
  const won = getWonNames();
  return state.participants.filter(n => !won.has(n));
}

// ──────────────────────────────────────────
//  NAV / VIEWS
// ──────────────────────────────────────────
const views = { draw: null, setup: null, history: null };

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    views[btn.dataset.view] = document.getElementById('view-' + btn.dataset.view);
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
}
function switchView(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  if (name === 'draw')    renderDraw();
  if (name === 'setup')   renderSetup();
  if (name === 'history') renderHistory();
}

// ──────────────────────────────────────────
//  DRAW VIEW
// ──────────────────────────────────────────
function renderDraw() {
  renderPrizeBar();
  updateQtyDisplay();
  updateStatus();
}

function renderPrizeBar() {
  const bar = document.getElementById('prize-bar');
  if (!state.prizes.length) { bar.innerHTML = '<span style="color:var(--text3);font-size:13px">請先在「名單設定」新增獎項</span>'; return; }
  bar.innerHTML = state.prizes.map(p => {
    const won  = wonCountForPrize(p.id);
    const full = won >= p.count;
    return `<button class="prize-pill ${selectedPrizeId === p.id ? 'active' : ''} ${full ? 'full' : ''}"
      data-prize="${esc(p.id)}" style="${selectedPrizeId === p.id ? `background:${esc(p.color)};border-color:${esc(p.color)};box-shadow:0 0 30px ${esc(p.color)}55` : ''}">
      ${esc(p.name)}
      <span class="pill-count">${won}/${p.count}</span>
    </button>`;
  }).join('');
  bar.querySelectorAll('.prize-pill:not(.full)').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedPrizeId = btn.dataset.prize;
      drawQty = 1;
      document.getElementById('winner-chips').innerHTML = '';
      resetReel();
      renderDraw();
    });
  });
}

function resetReel() {
  const track = document.getElementById('reel-track');
  track.style.transition = 'none';
  track.style.transform = 'translateY(0)';
  track.innerHTML = `<div class="reel-name idle">— — —</div>`;
  const label = document.getElementById('machine-label');
  if (selectedPrizeId) {
    const p = getPrize(selectedPrizeId);
    label.textContent = p ? `🏆 ${p.name}` : '選擇獎項開始抽獎';
  } else {
    label.textContent = '選擇獎項開始抽獎';
  }
}

function updateQtyDisplay() {
  document.getElementById('qty-num').textContent = drawQty;
  const btn = document.getElementById('btn-draw');
  const pool = availablePool();
  const prize = selectedPrizeId ? getPrize(selectedPrizeId) : null;
  const canDraw = prize ? (prize.count - wonCountForPrize(selectedPrizeId)) : 0;
  btn.disabled = !selectedPrizeId || isSpinning || pool.length === 0 || canDraw <= 0;
  if (prize && canDraw <= 0 && selectedPrizeId) {
    btn.querySelector('.btn-draw-text').textContent = '此獎項已抽完 ✓';
  } else {
    btn.querySelector('.btn-draw-text').textContent = '開始抽獎';
  }
}

function updateStatus() {
  const pool = availablePool();
  const el = document.getElementById('status-bar');
  if (!state.participants.length) {
    el.innerHTML = '請先在「名單設定」匯入參與者';
  } else {
    el.innerHTML = `共 <strong style="color:var(--text)">${state.participants.length}</strong> 人・
      已中獎 <strong style="color:var(--coral)">${state.winners.length}</strong> 人・
      剩餘 <strong style="color:var(--cyan)">${pool.length}</strong> 人可抽`;
  }
}

// Qty buttons
document.getElementById('qty-minus').addEventListener('click', () => {
  if (drawQty > 1) { drawQty--; updateQtyDisplay(); }
});
document.getElementById('qty-plus').addEventListener('click', () => {
  const prize = selectedPrizeId ? getPrize(selectedPrizeId) : null;
  if (!prize) return;
  const canDraw = prize.count - wonCountForPrize(selectedPrizeId);
  const pool    = availablePool();
  const max     = Math.min(canDraw, pool.length);
  if (drawQty < max) { drawQty++; updateQtyDisplay(); }
});

// Draw button
document.getElementById('btn-draw').addEventListener('click', startDraw);

async function startDraw() {
  if (isSpinning || !selectedPrizeId) return;
  const pool  = availablePool();
  const prize = getPrize(selectedPrizeId);
  if (!prize || !pool.length) return;

  const canDraw = prize.count - wonCountForPrize(selectedPrizeId);
  const toDraw  = Math.min(drawQty, canDraw, pool.length);
  if (toDraw <= 0) return;

  // Shuffle and pick
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked   = shuffled.slice(0, toDraw);

  isSpinning = true;
  document.getElementById('btn-draw').classList.add('spinning');
  document.getElementById('btn-draw').disabled = true;
  document.getElementById('winner-chips').innerHTML = '';

  for (let i = 0; i < picked.length; i++) {
    await spinAndReveal(pool, picked[i], prize.color);
    // Record winner
    state.winners.push({ name: picked[i], prizeId: prize.id, prizeName: prize.name, time: nowStr() });
    saveState();
    // Add chip
    const chip = document.createElement('div');
    chip.className = 'winner-chip';
    chip.textContent = picked[i];
    chip.style.background = `linear-gradient(135deg, ${prize.color}cc, ${prize.color})`;
    document.getElementById('winner-chips').appendChild(chip);
    await sleep(200);
  }

  isSpinning = false;
  document.getElementById('btn-draw').classList.remove('spinning');
  renderDraw();
  renderPrizeBar();
  launchConfetti(prize.color);
}

function spinAndReveal(pool, finalName, accentColor) {
  return new Promise(resolve => {
    const track = document.getElementById('reel-track');
    // Build a long list of random names ending with finalName
    const spinList = [];
    const len = 18 + Math.floor(Math.random() * 12);
    for (let i = 0; i < len; i++) {
      spinList.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    spinList.push(finalName);

    // Render all items
    track.innerHTML = spinList.map((n, i) => {
      const isLast = i === spinList.length - 1;
      return `<div class="reel-name ${isLast ? 'winner' : ''}"
        style="${isLast ? `color:${accentColor};text-shadow:0 0 20px ${accentColor}88` : ''}">${esc(n)}</div>`;
    }).join('');

    // Animate with easing
    const itemH   = 100;
    const totalY  = (spinList.length - 1) * itemH;
    const dur     = 2200 + Math.random() * 600; // ms

    track.style.transition = 'none';
    track.style.transform  = 'translateY(0)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        track.style.transition = `transform ${dur}ms cubic-bezier(0.25, 0.1, 0.1, 1)`;
        track.style.transform  = `translateY(-${totalY}px)`;
        setTimeout(resolve, dur + 200);
      });
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ──────────────────────────────────────────
//  CONFETTI
// ──────────────────────────────────────────
const canvas = document.getElementById('confetti-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let confettiRaf = null;

function launchConfetti(accentColor = '#FF4D4D') {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [accentColor, '#FF4D4D', '#00E5FF', '#FFD740', '#ffffff', '#FF7043'];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10,
      w: 6 + Math.random() * 8,
      h: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: 3 + Math.random() * 5,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      alpha: 1,
    });
  }

  if (confettiRaf) cancelAnimationFrame(confettiRaf);
  animateConfetti();
}
function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
    if (p.y > canvas.height * 0.6) p.alpha -= 0.015;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
  particles = particles.filter(p => p.alpha > 0);
  if (particles.length) confettiRaf = requestAnimationFrame(animateConfetti);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ──────────────────────────────────────────
//  SETUP VIEW
// ──────────────────────────────────────────
function renderSetup() {
  renderParticipantChips();
  renderPrizeEditor();
}

// Import tabs
document.querySelectorAll('.itab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.itab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.itab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('itab-' + tab.dataset.itab).classList.add('active');
  });
});

// Paste import
document.getElementById('btn-import-paste').addEventListener('click', () => {
  const text = document.getElementById('paste-input').value.trim();
  if (!text) { toast('請先輸入名單'); return; }
  const added = importText(text);
  document.getElementById('paste-input').value = '';
  saveState();
  renderParticipantChips();
  updateStatus();
  toast(`✅ 新增 ${added} 人，共 ${state.participants.length} 人`);
});

document.getElementById('btn-clear-participants').addEventListener('click', () => {
  if (!confirm('確定要清除所有參與者名單？')) return;
  state.participants = [];
  saveState();
  renderParticipantChips();
  updateStatus();
  toast('名單已清除');
});

function importText(text) {
  const existing = new Set(state.participants);
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let added = 0;
  lines.forEach(line => {
    // CSV: take last column (or single column)
    const parts = line.split(',').map(s => s.trim());
    const name  = parts[parts.length - 1];
    if (name && name !== '姓名' && name !== 'name' && !existing.has(name)) {
      state.participants.push(name);
      existing.add(name);
      added++;
    }
  });
  return added;
}

function renderParticipantChips() {
  const won   = getWonNames();
  const chips = document.getElementById('participant-chips');
  const meta  = document.getElementById('participant-meta');
  if (!state.participants.length) {
    chips.innerHTML = '<span class="chips-empty">尚無參與者</span>';
    meta.textContent = '';
    return;
  }
  chips.innerHTML = state.participants.map(n =>
    `<span class="p-chip ${won.has(n) ? 'won' : ''}">${esc(n)}</span>`
  ).join('');
  meta.textContent = `共 ${state.participants.length} 人・已中獎 ${won.size} 人・剩餘 ${state.participants.length - won.size} 人`;
}

// File upload
const fileInput = document.getElementById('file-input');
const fileDrop  = document.getElementById('file-drop');
fileDrop.addEventListener('click', () => fileInput.click());
fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
fileDrop.addEventListener('drop', e => {
  e.preventDefault(); fileDrop.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { handleFile(fileInput.files[0]); fileInput.value = ''; });

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const added = importText(e.target.result);
    saveState();
    renderParticipantChips();
    updateStatus();
    toast(`✅ 從檔案新增 ${added} 人，共 ${state.participants.length} 人`);
  };
  reader.readAsText(file, 'UTF-8');
}

// Prize editor
const PRIZE_COLORS = ['#FF4D4D','#00E5FF','#FFD740','#69FF47','#FF9800','#E040FB'];

function renderPrizeEditor() {
  const el = document.getElementById('prize-editor');
  el.innerHTML = state.prizes.map((p, i) => `
    <div class="prize-row" data-pid="${esc(p.id)}">
      <div class="prize-index" style="color:${esc(p.color)};border-color:${esc(p.color)}">${i + 1}</div>
      <input type="text"   class="p-name"  value="${esc(p.name)}"  placeholder="獎項名稱" />
      <input type="number" class="p-count" value="${esc(p.count)}" min="1" placeholder="名額" />
      <button class="prize-del" data-pid="${esc(p.id)}">✕</button>
    </div>`).join('');

  // Delete buttons
  el.querySelectorAll('.prize-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.prizes.length <= 1) { toast('至少需要一個獎項'); return; }
      state.prizes = state.prizes.filter(p => p.id !== btn.dataset.pid);
      saveState();
      renderPrizeEditor();
    });
  });
}

document.getElementById('btn-add-prize').addEventListener('click', () => {
  const i = state.prizes.length;
  state.prizes.push({ id: genId(), name: `第 ${i + 1} 獎`, count: 1, color: PRIZE_COLORS[i % PRIZE_COLORS.length] });
  saveState();
  renderPrizeEditor();
});

document.getElementById('btn-save-prizes').addEventListener('click', () => {
  document.querySelectorAll('.prize-row').forEach(row => {
    const pid   = row.dataset.pid;
    const prize = state.prizes.find(p => p.id === pid);
    if (!prize) return;
    prize.name  = row.querySelector('.p-name').value.trim()  || prize.name;
    prize.count = parseInt(row.querySelector('.p-count').value) || 1;
  });
  saveState();
  renderPrizeEditor();
  if (selectedPrizeId) renderDraw();
  toast('✅ 獎項設定已儲存');
});

// ──────────────────────────────────────────
//  HISTORY VIEW
// ──────────────────────────────────────────
function renderHistory() {
  const wrap = document.getElementById('history-table-wrap');
  if (!state.winners.length) {
    wrap.innerHTML = `<div class="empty-state"><span class="empty-icon">🎲</span><p>尚無中獎紀錄</p></div>`;
    return;
  }
  wrap.innerHTML = `<table>
    <thead><tr>
      <th>#</th><th>姓名</th><th>獎項</th><th>時間</th>
    </tr></thead>
    <tbody>${state.winners.map((w, i) => {
      const prize = state.prizes.find(p => p.id === w.prizeId);
      const color = prize ? prize.color : '#888';
      return `<tr>
        <td class="rank-num">${i + 1}</td>
        <td style="font-weight:700;color:var(--text)">${esc(w.name)}</td>
        <td><span class="prize-tag" style="color:${esc(color)};border-color:${esc(color)}55;background:${esc(color)}11">${esc(w.prizeName)}</span></td>
        <td style="font-size:12px">${esc(w.time)}</td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

document.getElementById('btn-export').addEventListener('click', () => {
  if (!state.winners.length) { toast('尚無資料可匯出'); return; }
  let csv = '\uFEFF序號,姓名,獎項,時間\n';
  state.winners.forEach((w, i) => {
    csv += `${i + 1},"${w.name}","${w.prizeName}","${w.time}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `中獎名單_${new Date().toLocaleDateString('zh-TW').replace(/\//g,'-')}.csv`;
  a.click(); URL.revokeObjectURL(url);
});

document.getElementById('btn-clear-results').addEventListener('click', () => {
  if (!confirm('確定要清除所有中獎結果？')) return;
  state.winners = [];
  saveState();
  renderHistory();
  renderDraw();
  toast('中獎結果已清除');
});

// ──────────────────────────────────────────
//  INIT
// ──────────────────────────────────────────
loadState();
initNav();
renderDraw();

// Resize confetti canvas
window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});
