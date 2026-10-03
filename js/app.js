/* ============================================================
   Expense & Budget Visualizer — app.js
   Vanilla JS | LocalStorage | No frameworks
   ============================================================ */

'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const LS_KEYS = {
  transactions: 'ebv_transactions',
  categories:   'ebv_categories',
  limits:       'ebv_limits',
  theme:        'ebv_theme',
};

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Housing', 'Health', 'Entertainment', 'Shopping', 'Salary', 'Other'];

const CHART_COLORS = [
  '#2563eb','#16a34a','#dc2626','#f59e0b','#7c3aed',
  '#0891b2','#db2777','#65a30d','#ea580c','#6366f1',
];

// ── State ──────────────────────────────────────────────────────────────────
let transactions = [];   // { id, description, amount, type, category, date }
let categories   = [];   // string[]
let limits       = {};   // { [category]: number }
let sortMode     = 'date-desc';

// ── LocalStorage helpers ───────────────────────────────────────────────────
function save() {
  localStorage.setItem(LS_KEYS.transactions, JSON.stringify(transactions));
  localStorage.setItem(LS_KEYS.categories,   JSON.stringify(categories));
  localStorage.setItem(LS_KEYS.limits,       JSON.stringify(limits));
}

function load() {
  try { transactions = JSON.parse(localStorage.getItem(LS_KEYS.transactions)) || []; } catch { transactions = []; }
  try { categories   = JSON.parse(localStorage.getItem(LS_KEYS.categories))   || [...DEFAULT_CATEGORIES]; } catch { categories = [...DEFAULT_CATEGORIES]; }
  try { limits       = JSON.parse(localStorage.getItem(LS_KEYS.limits))       || {}; } catch { limits = {}; }

  // Ensure default categories are always present (merge without duplicates)
  DEFAULT_CATEGORIES.forEach(c => { if (!categories.includes(c)) categories.unshift(c); });
}

// ── Theme ──────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem(LS_KEYS.theme) || 'light';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(LS_KEYS.theme, theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Format helpers ─────────────────────────────────────────────────────────
function fmt(n) {
  return '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Category dropdowns ─────────────────────────────────────────────────────
function populateCategorySelects() {
  const selects = [
    document.getElementById('txCategory'),
    document.getElementById('limitCategory'),
  ];
  selects.forEach(sel => {
    const current = sel.value;
    sel.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
    if (categories.includes(current)) sel.value = current;
  });
}

// ── Summary ────────────────────────────────────────────────────────────────
function updateSummary() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  document.getElementById('totalBalance').textContent = fmt(balance);
  document.getElementById('totalIncome').textContent  = fmt(income);
  document.getElementById('totalExpense').textContent = fmt(expense);
  document.getElementById('txCount').textContent      = transactions.length;
}

// ── Spending per category (expenses only) ──────────────────────────────────
function spendingByCategory() {
  const map = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return map;
}

// ── Check if a transaction's category is over limit ────────────────────────
function isCategoryOverLimit(category) {
  if (!limits[category]) return false;
  const spent = spendingByCategory()[category] || 0;
  return spent > limits[category];
}

// ── Transaction Form ───────────────────────────────────────────────────────
const txForm        = document.getElementById('transactionForm');
const txDescription = document.getElementById('txDescription');
const txAmount      = document.getElementById('txAmount');
const txType        = document.getElementById('txType');
const txCategory    = document.getElementById('txCategory');
const txDate        = document.getElementById('txDate');
const formError     = document.getElementById('formError');

// Set default date to today
txDate.value = todayISO();

txForm.addEventListener('submit', e => {
  e.preventDefault();
  const desc   = txDescription.value.trim();
  const amount = parseFloat(txAmount.value);
  const type   = txType.value;
  const cat    = txCategory.value;
  const date   = txDate.value;

  // Validation
  if (!desc) return showFormError('Please enter a description.');
  if (isNaN(amount) || amount <= 0) return showFormError('Please enter a valid positive amount.');
  if (!date) return showFormError('Please select a date.');

  hideFormError();

  const tx = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    description: desc,
    amount: amount,
    type: type,
    category: cat,
    date: date,
  };

  transactions.unshift(tx);
  save();
  renderAll();

  // Reset form
  txDescription.value = '';
  txAmount.value      = '';
  txDate.value        = todayISO();
  txDescription.focus();
});

function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

function hideFormError() {
  formError.hidden = true;
  formError.textContent = '';
}

// ── Spending Limits ────────────────────────────────────────────────────────
document.getElementById('toggleLimits').addEventListener('click', function () {
  const body = document.getElementById('limitsBody');
  const isHidden = body.hidden;
  body.hidden = !isHidden;
  this.textContent = isHidden ? 'Hide' : 'Show';
});

document.getElementById('setLimitBtn').addEventListener('click', () => {
  const cat    = document.getElementById('limitCategory').value;
  const amount = parseFloat(document.getElementById('limitAmount').value);
  if (!cat) return;
  if (isNaN(amount) || amount <= 0) {
    // Remove limit if amount is cleared/invalid
    delete limits[cat];
  } else {
    limits[cat] = amount;
  }
  document.getElementById('limitAmount').value = '';
  save();
  renderLimits();
  renderTransactionList();  // re-highlight
});

function renderLimits() {
  const list    = document.getElementById('limitsList');
  const spending = spendingByCategory();
  list.innerHTML = '';

  const limitEntries = Object.entries(limits);
  if (limitEntries.length === 0) {
    list.innerHTML = '<li style="font-size:0.82rem;color:var(--text-muted)">No limits set yet.</li>';
    return;
  }

  limitEntries.forEach(([cat, limit]) => {
    const spent = spending[cat] || 0;
    const over  = spent > limit;
    const li    = document.createElement('li');
    li.className = 'limit-item' + (over ? ' over-limit' : '');
    li.innerHTML = `
      <span class="limit-item__name">${escHtml(cat)}</span>
      <span class="limit-item__amounts">
        ${fmt(spent)} / ${fmt(limit)}${over ? ' ⚠️ Over limit!' : ''}
      </span>
      <button class="btn btn-sm" data-remove-limit="${escHtml(cat)}" title="Remove limit">✕</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('[data-remove-limit]').forEach(btn => {
    btn.addEventListener('click', () => {
      delete limits[btn.dataset.removeLimit];
      save();
      renderLimits();
      renderTransactionList();
    });
  });
}

// ── Custom Categories ──────────────────────────────────────────────────────
document.getElementById('toggleCategories').addEventListener('click', function () {
  const body = document.getElementById('categoriesBody');
  const isHidden = body.hidden;
  body.hidden = !isHidden;
  this.textContent = isHidden ? 'Hide' : 'Show';
});

document.getElementById('addCategoryBtn').addEventListener('click', () => {
  const input = document.getElementById('newCategoryInput');
  const name  = input.value.trim();
  if (!name) return;
  if (categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
    input.value = '';
    return;
  }
  categories.push(name);
  input.value = '';
  save();
  populateCategorySelects();
  renderCategoryTags();
});

document.getElementById('newCategoryInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addCategoryBtn').click(); }
});

function renderCategoryTags() {
  const list = document.getElementById('categoryTagsList');
  list.innerHTML = '';
  categories.forEach(cat => {
    const isDefault = DEFAULT_CATEGORIES.includes(cat);
    const li = document.createElement('li');
    li.className = 'category-tag' + (isDefault ? ' is-default' : '');
    li.innerHTML = `
      <span>${escHtml(cat)}</span>
      ${isDefault
        ? ''
        : `<button class="category-tag__del" data-del-cat="${escHtml(cat)}" title="Remove category" aria-label="Remove ${escHtml(cat)}">✕</button>`}
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('[data-del-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.delCat;
      // Reassign transactions using this category to 'Other'
      transactions.forEach(t => { if (t.category === cat) t.category = 'Other'; });
      categories = categories.filter(c => c !== cat);
      delete limits[cat];
      save();
      populateCategorySelects();
      renderCategoryTags();
      renderAll();
    });
  });
}

// ── Sort ───────────────────────────────────────────────────────────────────
document.getElementById('sortSelect').addEventListener('change', function () {
  sortMode = this.value;
  renderTransactionList();
});

function getSortedTransactions() {
  const arr = [...transactions];
  switch (sortMode) {
    case 'date-desc':     return arr.sort((a, b) => b.date.localeCompare(a.date));
    case 'date-asc':      return arr.sort((a, b) => a.date.localeCompare(b.date));
    case 'amount-desc':   return arr.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':    return arr.sort((a, b) => a.amount - b.amount);
    case 'category-asc':  return arr.sort((a, b) => a.category.localeCompare(b.category));
    default:              return arr;
  }
}

// ── Transaction List ───────────────────────────────────────────────────────
function renderTransactionList() {
  const list    = document.getElementById('transactionList');
  const empty   = document.getElementById('txEmpty');
  const sorted  = getSortedTransactions();

  if (sorted.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  list.innerHTML = '';

  sorted.forEach(tx => {
    const over = tx.type === 'expense' && isCategoryOverLimit(tx.category);
    const li = document.createElement('li');
    li.className = 'tx-item' + (over ? ' over-limit' : '');
    li.dataset.id = tx.id;

    li.innerHTML = `
      <div class="tx-type-badge tx-type-badge--${tx.type}">
        ${tx.type === 'income' ? '↑' : '↓'}
      </div>
      <div class="tx-info">
        <div class="tx-desc" title="${escHtml(tx.description)}">${escHtml(tx.description)}</div>
        <div class="tx-meta">
          <span class="tx-category">${escHtml(tx.category)}</span>
          <span>${fmtDate(tx.date)}</span>
          ${over ? '<span style="color:var(--warning-border)">⚠️ Over limit</span>' : ''}
        </div>
      </div>
      <span class="tx-amount tx-amount--${tx.type}">
        ${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}
      </span>
      <button class="tx-del" data-del-tx="${tx.id}" title="Delete transaction" aria-label="Delete ${escHtml(tx.description)}">✕</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('[data-del-tx]').forEach(btn => {
    btn.addEventListener('click', () => {
      transactions = transactions.filter(t => t.id !== btn.dataset.delTx);
      save();
      renderAll();
    });
  });
}

// ── Clear All ──────────────────────────────────────────────────────────────
document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (!transactions.length) return;
  if (!confirm('Delete ALL transactions? This cannot be undone.')) return;
  transactions = [];
  save();
  renderAll();
});

// ── Donut Chart (pure Canvas) ──────────────────────────────────────────────
function renderChart() {
  const canvas  = document.getElementById('spendingChart');
  const legend  = document.getElementById('chartLegend');
  const msgEl   = document.getElementById('chartEmpty');
  const ctx     = canvas.getContext('2d');
  const spending = spendingByCategory();
  const entries  = Object.entries(spending).filter(([, v]) => v > 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  legend.innerHTML = '';

  if (entries.length === 0) {
    canvas.style.display = 'none';
    msgEl.style.display  = 'block';
    return;
  }

  canvas.style.display = 'block';
  msgEl.style.display  = 'none';

  const total  = entries.reduce((s, [, v]) => s + v, 0);
  const cx     = canvas.width  / 2;
  const cy     = canvas.height / 2;
  const radius = Math.min(cx, cy) * 0.82;
  const inner  = radius * 0.56;

  let startAngle = -Math.PI / 2;

  entries.forEach(([cat, val], i) => {
    const slice = (val / total) * 2 * Math.PI;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
    ctx.lineWidth = 2.5;
    ctx.stroke();

    startAngle += slice;

    // Legend item
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-dot" style="background:${color}"></span>
      <span>${escHtml(cat)} <span style="color:var(--text-muted)">${((val/total)*100).toFixed(1)}%</span></span>
    `;
    legend.appendChild(item);
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  ctx.fillStyle = bg;
  ctx.fill();

  // Center total label
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
  ctx.font = `bold ${Math.round(radius * 0.18)}px -apple-system, Segoe UI, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fmt(total), cx, cy);
}

// ── Redraw chart when theme changes (colours update) ──────────────────────
const themeObserver = new MutationObserver(() => renderChart());
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ── Render All ─────────────────────────────────────────────────────────────
function renderAll() {
  updateSummary();
  renderTransactionList();
  renderChart();
  renderLimits();
}

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  initTheme();
  load();
  populateCategorySelects();
  renderCategoryTags();
  renderAll();
}

// ── Security helper ─────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Boot ───────────────────────────────────────────────────────────────────
init();
