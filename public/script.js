const STORAGE_KEY = 'spendora.workspace.state.v2';

function createSeedTransactions() {
  return [
    { id: 'seed-1', timestamp: new Date('2026-07-09T09:00:00').getTime(), date: 'Jul 09', merchant: 'Blinkit', category: 'Food', amount: 480, status: 'Review', note: 'Groceries and quick top-ups', source: 'seed' },
    { id: 'seed-2', timestamp: new Date('2026-07-08T12:00:00').getTime(), date: 'Jul 08', merchant: 'Uber', category: 'Travel', amount: 320, status: 'Normal', note: 'Commute and local rides', source: 'seed' },
    { id: 'seed-3', timestamp: new Date('2026-07-07T08:30:00').getTime(), date: 'Jul 07', merchant: 'Netflix', category: 'Subscriptions', amount: 649, status: 'Expected', note: 'Recurring subscription', source: 'seed' },
    { id: 'seed-4', timestamp: new Date('2026-07-06T19:15:00').getTime(), date: 'Jul 06', merchant: 'Apple', category: 'Shopping', amount: 2200, status: 'Check', note: 'Higher-ticket hardware purchase', source: 'seed' },
    { id: 'seed-5', timestamp: new Date('2026-07-05T13:40:00').getTime(), date: 'Jul 05', merchant: 'Zomato', category: 'Food', amount: 900, status: 'Approved', note: 'Food delivery check', source: 'seed' },
    { id: 'seed-6', timestamp: new Date('2026-07-04T10:10:00').getTime(), date: 'Jul 04', merchant: 'Metro', category: 'Travel', amount: 70, status: 'Normal', note: 'Local transit', source: 'seed' },
  ];
}

const defaults = {
  balance: 50000,
  bills: 15000,
  expenses: 11000,
  buffer: 10000,
  salaryDate: '2026-07-25',
  profileName: 'Adwaith Gopinath',
  monthlySalary: 60000,
  lowBalanceWarning: 15000,
  dailySpendLimit: 5000,
  transactions: createSeedTransactions()
};

function loadPersistedState() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const merged = {
    ...defaults,
    ...source,
  };
  merged.transactions = Array.isArray(source.transactions) && source.transactions.length
    ? source.transactions
    : createSeedTransactions();
  return merged;
}

const state = normalizeState(loadPersistedState());

const page = document.body?.dataset?.page || 'dashboard';
console.log('Spendora: init (page)', page);

const el = (id) => document.getElementById(id);
const setText = (id, value) => {
  const node = el(id);
  if (node) node.textContent = value;
};
const setHTML = (id, value) => {
  const node = el(id);
  if (node) node.innerHTML = value;
};
const clamp = (min, max, value) => Math.min(max, Math.max(min, value));

const inputBalance = el('input-balance');
const inputBills = el('input-bills');
const inputExpenses = el('input-expenses');
const inputBuffer = el('input-buffer');
const salaryDateInput = el('salary-date');
const settingsNameInput = el('settings-name');
const settingsSalaryInput = el('settings-salary');
const settingsLowBalanceInput = el('settings-low-balance');
const settingsDailyLimitInput = el('settings-daily-limit');

const chatFeed = el('chat-messages');
const chatForm = el('chat-form');
const chatInput = el('chat-input');
const prompts = [...document.querySelectorAll('.prompt')];
const recentActivityList = el('recent-activity-list');
const categoryMixList = el('category-mix-list');

const menuToggle = el('menu-toggle');
const backdrop = el('backdrop');
const resetBtn = el('reset-btn');
const recalcBtn = el('recalc-btn');
const searchInput = el('insight-search');
const filterSelect = el('insight-filter');
const insightsTableBody = el('insights-table-body');
const insightsExportBtn = el('insights-export');
const insightPeriodBtn = el('insight-period');
const forecastCommitments = el('forecast-commitments');
const signalsList = el('signals-list');
const settingsSaveBtn = el('settings-save');
const settingsStatus = el('settings-status');
let insightsMode = 'actual';

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const dialProgress = document.querySelector('.dial-progress');
if (dialProgress) {
  dialProgress.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  dialProgress.style.strokeDashoffset = `${CIRCUMFERENCE}`;
}

const insightRows = [
  { date: 'Jul 09', merchant: 'Blinkit', category: 'Food', amount: 480, status: 'Review' },
  { date: 'Jul 08', merchant: 'Uber', category: 'Travel', amount: 320, status: 'Normal' },
  { date: 'Jul 07', merchant: 'Netflix', category: 'Subscriptions', amount: 649, status: 'Expected' },
  { date: 'Jul 06', merchant: 'Apple', category: 'Shopping', amount: 2200, status: 'Check' },
  { date: 'Jul 05', merchant: 'Zomato', category: 'Food', amount: 900, status: 'Approved' },
  { date: 'Jul 04', merchant: 'Metro', category: 'Travel', amount: 70, status: 'Normal' },
];

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function integer(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatSalary(value) {
  return `${money(value)} salary`;
}

function formatShortDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AG';
}

function parseCurrencyInput(value) {
  const digits = String(value || '').replace(/[^\d.]/g, '');
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : defaults.monthlySalary;
}

function saveState() {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify({
      balance: state.balance,
      bills: state.bills,
      expenses: state.expenses,
      buffer: state.buffer,
      salaryDate: state.salaryDate,
      profileName: state.profileName,
      monthlySalary: state.monthlySalary,
      lowBalanceWarning: state.lowBalanceWarning,
      dailySpendLimit: state.dailySpendLimit,
      transactions: state.transactions,
    }));
  } catch {
    // Storage is optional; the app still works without persistence.
  }
}

function showSettingsStatus(message = 'Saved locally') {
  if (!settingsStatus) return;
  settingsStatus.textContent = message;
  settingsStatus.classList.add('settings-status--active');
  window.clearTimeout(showSettingsStatus.timer);
  showSettingsStatus.timer = window.setTimeout(() => {
    settingsStatus.classList.remove('settings-status--active');
  }, 1600);
}

function updateProfileDisplay() {
  document.querySelectorAll('.profile-name').forEach((node) => {
    node.textContent = state.profileName;
  });
  document.querySelectorAll('.profile-meta').forEach((node) => {
    node.textContent = formatSalary(state.monthlySalary);
  });
  document.querySelectorAll('.profile-avatar--initials').forEach((node) => {
    node.textContent = getInitials(state.profileName);
  });

  if (settingsNameInput && settingsNameInput.value !== state.profileName) settingsNameInput.value = state.profileName;
  if (settingsSalaryInput) {
    const nextValue = money(state.monthlySalary);
    if (settingsSalaryInput.value !== nextValue) settingsSalaryInput.value = nextValue;
  }
  if (settingsLowBalanceInput && Number(settingsLowBalanceInput.value) !== state.lowBalanceWarning) {
    settingsLowBalanceInput.value = state.lowBalanceWarning;
  }
  if (settingsDailyLimitInput && Number(settingsDailyLimitInput.value) !== state.dailySpendLimit) {
    settingsDailyLimitInput.value = state.dailySpendLimit;
  }
}

function createTransaction(entry) {
  return {
    id: `txn-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: Date.now(),
    date: formatShortDate(new Date()),
    source: 'decision',
    note: '',
    ...entry,
  };
}

function getSortedTransactions() {
  return [...state.transactions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function parseDateValue(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLong(date) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function daysUntil(date) {
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.ceil((target - current) / 86400000));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPaydayDate() {
  const parsed = parseDateValue(state.salaryDate);
  return parsed || parseDateValue(defaults.salaryDate) || new Date();
}

function getDerivedState() {
  const committed = state.bills + state.expenses + state.buffer;
  const safe = state.balance - committed;
  const paydayDate = getPaydayDate();
  const runwayDays = daysUntil(paydayDate);
  const dailyBurn = runwayDays > 0 ? Math.round((state.bills + state.expenses) / runwayDays) : state.bills + state.expenses;
  const tightThreshold = Math.max(0, Number(state.lowBalanceWarning) || Math.round(state.balance * 0.1));
  const health = clamp(0, 100, Math.round(40 + Math.max(0, safe / Math.max(1, state.balance)) * 55 + Math.min(15, runwayDays)));
  const bufferHealthScore = state.buffer > 0 ? Math.round((state.buffer / Math.max(1, state.bills + state.expenses)) * 100) : 0;
  const stateLabel = safe < 0 ? 'deficit' : safe < tightThreshold ? 'tight' : 'healthy';
  return { committed, safe, paydayDate, runwayDays, dailyBurn, health, bufferHealthScore, stateLabel, tightThreshold };
}

function setStateFromInputs() {
  if (inputBalance) state.balance = Number(inputBalance.value);
  if (inputBills) state.bills = Number(inputBills.value);
  if (inputExpenses) state.expenses = Number(inputExpenses.value);
  if (inputBuffer) state.buffer = Number(inputBuffer.value);
  if (salaryDateInput) state.salaryDate = salaryDateInput.value || defaults.salaryDate;
  if (settingsNameInput) state.profileName = settingsNameInput.value.trim() || defaults.profileName;
  if (settingsSalaryInput) state.monthlySalary = parseCurrencyInput(settingsSalaryInput.value);
  if (settingsLowBalanceInput) state.lowBalanceWarning = Number(settingsLowBalanceInput.value);
  if (settingsDailyLimitInput) state.dailySpendLimit = Number(settingsDailyLimitInput.value);
}

function syncInputsFromState() {
  if (inputBalance) inputBalance.value = state.balance;
  if (inputBills) inputBills.value = state.bills;
  if (inputExpenses) inputExpenses.value = state.expenses;
  if (inputBuffer) inputBuffer.value = state.buffer;
  if (salaryDateInput) salaryDateInput.value = state.salaryDate;
  if (settingsNameInput) settingsNameInput.value = state.profileName;
  if (settingsSalaryInput) settingsSalaryInput.value = money(state.monthlySalary);
  if (settingsLowBalanceInput) settingsLowBalanceInput.value = state.lowBalanceWarning;
  if (settingsDailyLimitInput) settingsDailyLimitInput.value = state.dailySpendLimit;
}

function updateBudgetBars(balance, bills, expenses, buffer) {
  const essentials = balance > 0 ? Math.round((bills / balance) * 100) : 0;
  const lifestyle = balance > 0 ? Math.round((expenses / balance) * 100) : 0;
  const reserve = balance > 0 ? Math.round((buffer / balance) * 100) : 0;

  setText('budget-essential', `${essentials}%`);
  setText('budget-lifestyle', `${lifestyle}%`);
  setText('budget-buffer', `${reserve}%`);

  const eBar = el('budget-essential-bar');
  const lBar = el('budget-lifestyle-bar');
  const rBar = el('budget-buffer-bar');
  if (eBar) eBar.style.width = `${clamp(0, 100, essentials)}%`;
  if (lBar) lBar.style.width = `${clamp(0, 100, lifestyle)}%`;
  if (rBar) rBar.style.width = `${clamp(0, 100, reserve)}%`;
}

function setLivePill(stateLabel) {
  const livePill = el('live-pill');
  if (!livePill) return;
  livePill.classList.remove('status-pill--success', 'status-pill--warn', 'status-pill--danger');
  if (stateLabel === 'deficit') {
    livePill.classList.add('status-pill--danger');
    livePill.style.background = 'rgba(242, 108, 130, 0.12)';
    livePill.style.borderColor = 'rgba(242, 108, 130, 0.22)';
    livePill.style.color = '#f0c0ca';
    livePill.innerHTML = '<span class="status-dot"></span>Attention';
  } else if (stateLabel === 'tight') {
    livePill.classList.add('status-pill--warn');
    livePill.style.background = 'rgba(217, 161, 73, 0.12)';
    livePill.style.borderColor = 'rgba(217, 161, 73, 0.22)';
    livePill.style.color = '#ead2a0';
    livePill.innerHTML = '<span class="status-dot"></span>Tight runway';
  } else {
    livePill.classList.add('status-pill--success');
    livePill.style.background = 'rgba(43, 191, 137, 0.12)';
    livePill.style.borderColor = 'rgba(43, 191, 137, 0.24)';
    livePill.style.color = '#bff0dc';
    livePill.innerHTML = '<span class="status-dot"></span>Live data';
  }
}

function renderSharedState() {
  const derived = getDerivedState();

  setText('today-label', formatDateLong(new Date()));
  setText('stat-balance', money(state.balance));
  setText('stat-safe', money(derived.safe));
  setText('stat-committed', money(derived.committed));
  setText('stat-runway', `${derived.runwayDays} days`);
  setText('dashboard-runway', `${derived.runwayDays} days`);
  setText('safe-spend-val', integer(derived.safe));
  setText('hero-safe-value', money(derived.safe));
  setText('hero-balance-chip', money(state.balance));
  setText('hero-committed-chip', money(derived.committed));
  setText('hero-runway-chip', `${derived.runwayDays} days`);
  setText('hero-health-chip', `${derived.health}/100`);
  setText('health-score', `${derived.health}/100`);
  setText('payday-countdown', `${derived.runwayDays} days`);
  setText('daily-burn', money(derived.dailyBurn));
  setText('buffer-health', derived.bufferHealthScore >= 140 ? 'Very strong' : derived.bufferHealthScore >= 80 ? 'Strong' : derived.bufferHealthScore >= 45 ? 'Tight' : 'At risk');
  setText('f-balance', money(state.balance));
  setText('f-costs', money(derived.committed));
  setText('f-result', money(derived.safe));
  setText('hero-safe-tag', `Available today: ${money(derived.safe)}`);
  setText('hero-runway-tag', `${derived.runwayDays} days to salary`);
  setText('hero-buffer-tag', state.buffer > 0 ? `Reserve cash protected: ${money(state.buffer)}` : 'Reserve off');
  setText('safe-spend-caption', derived.stateLabel === 'deficit'
    ? 'Pause discretionary spending for now'
    : derived.stateLabel === 'tight'
      ? 'You can spend, but stay deliberate'
      : 'Protected and ready to use');
  setText('hero-safe-note', derived.stateLabel === 'deficit'
    ? `You are ${money(Math.abs(derived.safe))} past your comfort zone.`
    : derived.stateLabel === 'tight'
      ? `You are close to your limit, so small purchases should be checked first. Your daily comfort limit is ${money(state.dailySpendLimit)}.`
      : `Your essentials are protected, so buying decisions stay controlled. Your daily comfort limit is ${money(state.dailySpendLimit)}.`);
  setText('risk-message', derived.stateLabel === 'deficit'
    ? `This month is overcommitted by ${money(Math.abs(derived.safe))}. The safest move is to pause discretionary spending and rebuild the reserve.`
    : derived.stateLabel === 'tight'
      ? `You still have room, but purchases over about ${money(Math.max(0, derived.safe * 0.6))} deserve a second look. Your low-balance warning is set to ${money(state.lowBalanceWarning)}.`
      : `You have room for normal spending, but keep an eye on higher-ticket items so your runway stays healthy. Your low-balance warning is set to ${money(state.lowBalanceWarning)}.`);
  setText('forecast-message', derived.runwayDays > 0
    ? `At your current pace, the budget stays workable if daily non-essential spending stays near ${money(derived.dailyBurn)}. Your daily limit is ${money(state.dailySpendLimit)}.`
    : 'Payday has arrived, so the next best move is to reset the scenario and protect the reserve again.');
  setText('topbar-subtitle', derived.runwayDays > 0
    ? `You have ${money(Math.max(0, derived.safe))} in flexible spending power and ${derived.runwayDays} days of runway left.`
    : 'You are at payday. Rebuild the reserve before making the next big purchase.');
  setText('dial-status', derived.stateLabel === 'deficit'
    ? 'Budget deficit'
    : derived.stateLabel === 'tight'
      ? 'Tight runway'
      : 'Healthy runway');

  const aiSafe = el('ai-safe-intro');
  if (aiSafe) aiSafe.textContent = integer(derived.safe);

  const dialStatus = el('dial-status');
  if (dialStatus) {
    dialStatus.textContent = derived.stateLabel === 'deficit'
      ? 'Budget deficit'
      : derived.stateLabel === 'tight'
        ? 'Tight runway'
        : 'Healthy runway';
  }

  const safeSpendCaption = el('safe-spend-caption');
  if (safeSpendCaption) {
    safeSpendCaption.textContent = derived.stateLabel === 'deficit'
      ? 'Pause discretionary spending for now'
      : derived.stateLabel === 'tight'
        ? 'You can spend, but stay deliberate'
        : 'Protected and ready to use';
  }

  const dialProgress = document.querySelector('.dial-progress');
  if (dialProgress) {
    dialProgress.style.strokeDashoffset = `${CIRCUMFERENCE - CIRCUMFERENCE * clamp(0, 1, derived.safe / Math.max(1, state.balance))}`;
  }

  updateProfileDisplay();
  setLivePill(derived.stateLabel);
  updateBudgetBars(state.balance, state.bills, state.expenses, state.buffer);
  renderRecentActivity();
  renderCategoryMix();
}

function setScenario(values) {
  state.balance = values.balance;
  state.bills = values.bills;
  state.expenses = values.expenses;
  state.buffer = values.buffer;
  state.salaryDate = values.salaryDate;
  syncInputsFromState();
  saveState();
  renderAll();
}

function clearChat() {
  if (!chatFeed) return;
  chatFeed.innerHTML = `
    <div class="msg msg--ai">
      <div class="msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
      <div class="msg-bubble msg-bubble--ai">Your current available spending room is <strong>₹<span id="ai-safe-intro">${integer(getDerivedState().safe)}</span></strong>. Ask about any purchase and get a straightforward recommendation.</div>
    </div>
  `;
}

function verdictBadge(type) {
  if (type === 'GREEN') return '<div class="verdict verdict--green"><i class="fa-solid fa-circle-check"></i> Proceed</div>';
  if (type === 'YELLOW') return '<div class="verdict verdict--yellow"><i class="fa-solid fa-triangle-exclamation"></i> Review</div>';
  if (type === 'RED') return '<div class="verdict verdict--red"><i class="fa-solid fa-circle-xmark"></i> Not recommended</div>';
  return '';
}

function addUserMsg(text) {
  if (!chatFeed) return;
  const el = document.createElement('div');
  el.className = 'msg msg--user';
  el.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-user"></i></div><div class="msg-bubble msg-bubble--user">${escHtml(text)}</div>`;
  chatFeed.appendChild(el);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

function addAIMsg(html) {
  if (!chatFeed) return;
  const el = document.createElement('div');
  el.className = 'msg msg--ai';
  el.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div><div class="msg-bubble msg-bubble--ai">${html}</div>`;
  chatFeed.appendChild(el);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

function showTyping() {
  if (!chatFeed) return null;
  const el = document.createElement('div');
  el.className = 'msg msg--ai';
  el.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div><div class="msg-bubble msg-bubble--ai"><strong>Thinking...</strong></div>`;
  chatFeed.appendChild(el);
  chatFeed.scrollTop = chatFeed.scrollHeight;
  return el;
}

function analyzePurchaseQuery(query) {
  const q = query.toLowerCase();
  if (!q.match(/\b(buy|order|afford|purchase|trip|go on|go to)\b/)) {
    return { type: 'generic', q };
  }

  let cost = 0;
  let item = 'this purchase';
  let merchant = 'Purchase request';
  let category = 'Shopping';

  if (q.includes('ps5')) {
    cost = 45000;
    item = 'a PlayStation 5';
    merchant = 'PlayStation 5';
    category = 'Shopping';
  } else if (q.includes('sushi') || q.includes('dinner')) {
    cost = 900;
    item = 'sushi delivery';
    merchant = 'Sushi';
    category = 'Food';
  } else if (q.includes('trip') || q.includes('goa') || q.includes('gokarna')) {
    cost = 12000;
    item = 'your weekend trip';
    merchant = 'Weekend trip';
    category = 'Travel';
  } else if (q.includes('bike') || q.includes('motorcycle')) {
    cost = 180000;
    item = 'a new bike';
    merchant = 'Bike purchase';
    category = 'Transport';
  } else if (q.includes('phone') || q.includes('iphone') || q.includes('oneplus')) {
    cost = 70000;
    item = 'a new phone';
    merchant = 'Phone upgrade';
    category = 'Shopping';
  } else if (q.includes('laptop') || q.includes('macbook')) {
    cost = 120000;
    item = 'a laptop';
    merchant = 'Laptop upgrade';
    category = 'Shopping';
  } else {
    const match = q.match(/\u20b9?\s*(\d[\d,]*)/);
    cost = match ? parseInt(match[1].replace(/,/g, ''), 10) : 3000;
  }

  return { type: 'purchase', q, cost, item, merchant, category };
}

function getResponse(query) {
  const derived = getDerivedState();
  const q = query.toLowerCase();
  const monthlyBurn = state.bills + state.expenses;
  const dailyBurn = derived.runwayDays > 0 ? Math.round(monthlyBurn / derived.runwayDays) : monthlyBurn;

  if (q.match(/\b(buy|order|afford|purchase|trip|go on|go to)\b/)) {
    let cost = 0;
    let item = 'this purchase';

    if (q.includes('ps5')) {
      cost = 45000;
      item = 'a PlayStation 5';
    } else if (q.includes('sushi') || q.includes('dinner')) {
      cost = 900;
      item = 'sushi delivery';
    } else if (q.includes('trip') || q.includes('goa') || q.includes('gokarna')) {
      cost = 12000;
      item = 'your weekend trip';
    } else if (q.includes('bike') || q.includes('motorcycle')) {
      cost = 180000;
      item = 'a new bike';
    } else if (q.includes('phone') || q.includes('iphone') || q.includes('oneplus')) {
      cost = 70000;
      item = 'a new phone';
    } else if (q.includes('laptop') || q.includes('macbook')) {
      cost = 120000;
      item = 'a laptop';
    } else {
      const match = q.match(/[₹]?\s*(\d[\d,]*)/);
      cost = match ? parseInt(match[1].replace(/,/g, ''), 10) : 3000;
    }

    if (cost <= derived.safe) {
      return `${verdictBadge('GREEN')}<div>You can comfortably afford <strong>${item}</strong> (${money(cost)}). After the purchase, your safe-to-spend drops to <strong>${money(derived.safe - cost)}</strong>, while essentials and buffer stay untouched.</div><div class="verdict-note">Remaining runway after essentials: ${money(Math.max(0, derived.safe))}</div>`;
    }
    if (cost <= derived.safe + state.buffer) {
      const dip = cost - derived.safe;
      return `${verdictBadge('YELLOW')}<div>You can buy <strong>${item}</strong> (${money(cost)}), but it dips <strong>${money(dip)}</strong> into the buffer. That leaves only <strong>${money(state.buffer - dip)}</strong> as emergency cover.</div><div class="verdict-note">Remaining runway after essentials: ${money(Math.max(0, derived.safe))}</div>`;
    }
    if (cost <= state.balance - state.bills) {
      return `${verdictBadge('RED')}<div>Buying <strong>${item}</strong> (${money(cost)}) would wipe the buffer and leave you exposed before payday. Wait, or reduce the amount first.</div><div class="verdict-note">Remaining runway after essentials: ${money(Math.max(0, derived.safe))}</div>`;
    }
    return `${verdictBadge('RED')}<div><strong>${item}</strong> (${money(cost)}) is above what remains after fixed bills. It would create a deficit of <strong>${money(cost - (state.balance - state.bills))}</strong>.</div><div class="verdict-note">Remaining runway after essentials: ${money(Math.max(0, derived.safe))}</div>`;
  }

  if (q.match(/\b(why|overspend|spent|spending)\b/)) {
    return `${verdictBadge('YELLOW')}<div>Your food and travel budget is <strong>${money(state.expenses)}</strong>, which works out to about <strong>${money(Math.round(state.expenses / Math.max(1, derived.runwayDays || 1)))}</strong> a day across the remaining runway.</div><div class="verdict-note">The biggest gain now is not a complicated chart. It is 2-3 fewer impulse orders this week.</div>`;
  }

  if (q.match(/\b(payday|salary|run out|forecast|survive)\b/)) {
    if (derived.safe >= 0) {
      return `${verdictBadge('GREEN')}<div>You are on track to reach payday with your emergency buffer intact.</div><div class="verdict-note">At roughly ${money(dailyBurn)} a day, you still have enough room for normal spending.</div>`;
    }
    return `${verdictBadge('RED')}<div>You are currently in a deficit of <strong>${money(Math.abs(derived.safe))}</strong>.</div><div class="verdict-note">The safest move is to pause discretionary spending and rebuild the buffer before the next salary lands.</div>`;
  }

  if (q.match(/\b(save|saving|savings|invest)\b/)) {
    return `${verdictBadge('GREEN')}<div>Your buffer is currently set to <strong>${money(state.buffer)}</strong>. Adding <strong>${money(2000)}</strong> more next month would make your runway noticeably smoother.</div><div class="verdict-note">A healthier safety target for this profile is usually one full month of fixed costs plus a small cushion.</div>`;
  }

  return `<div class="verdict verdict--green"><i class="fa-solid fa-circle-info"></i> Examples</div><div>Ask me things like:</div><div class="verdict-note">"Can I buy a PS5?"<br>"Can I order sushi tonight?"<br>"Will I run out of money before payday?"<br>"Why did I overspend this month?"</div>`;
}

function renderForecastBars() {
  const bars = [...document.querySelectorAll('.forecast-bar')];
  if (!bars.length) return;
  const derived = getDerivedState();
  const pressure = derived.stateLabel === 'deficit' ? 32 : derived.stateLabel === 'tight' ? 18 : 0;
  const reservePressure = state.buffer < state.lowBalanceWarning ? 10 : 0;
  const widths = [92, 78, 64, 50].map((width, index) => clamp(12, 96, width - pressure - reservePressure - index * 2));
  const labels = derived.stateLabel === 'deficit'
    ? ['Pause spend', 'Cut variable', 'Protect bills', 'Rebuild reserve']
    : derived.stateLabel === 'tight'
      ? ['Stable', 'Watch spend', 'Be selective', 'Protect buffer']
      : ['Stable', 'Comfortable', 'Room available', 'Buffer intact'];

  bars.forEach((bar, index) => {
    const fill = bar.querySelector('.forecast-track i');
    const label = bar.querySelector('strong');
    if (fill) fill.style.width = `${widths[index]}%`;
    if (label) label.textContent = labels[index] || labels[labels.length - 1];
  });
}

function getTransactionSeverity(status) {
  if (status === 'Review' || status === 'Check') return 'warn';
  if (status === 'Blocked') return 'danger';
  return 'ok';
}

function renderRecentActivity() {
  if (!recentActivityList) return;
  const rows = getSortedTransactions().slice(0, 3);

  recentActivityList.innerHTML = rows.map((row) => `
    <div class="activity-row">
      <div>
        <strong>${escHtml(row.merchant)}</strong>
        <span>${escHtml(row.note || `${row.category} transaction`)}</span>
      </div>
      <strong class="amount amount--${getTransactionSeverity(row.status)}">${money(row.amount)}</strong>
    </div>
  `).join('');
}

function renderCategoryMix() {
  if (!categoryMixList) return;
  const transactions = getSortedTransactions().filter((row) => row.source !== 'decision');
  const totals = transactions.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + row.amount;
    return acc;
  }, {});
  const categories = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const grandTotal = categories.reduce((sum, [, amount]) => sum + amount, 0) || 1;

  categoryMixList.innerHTML = categories.map(([category, amount]) => {
    const percent = Math.max(8, Math.round((amount / grandTotal) * 100));
    return `
      <div class="budget-row">
        <div class="budget-meta"><span>${escHtml(category)}</span><strong>${percent}%</strong></div>
        <div class="budget-track"><span style="width:${percent}%"></span></div>
      </div>
    `;
  }).join('');
}

function renderForecastCommitments() {
  if (!forecastCommitments) return;
  const derived = getDerivedState();
  const actual = getSortedTransactions().filter((row) => row.source !== 'decision');
  const recent = actual.slice(0, 3);
  const upcoming = [
    { icon: 'fa-house', title: 'Rent buffer', detail: `Fixed bills protected · ${money(state.bills)}` },
    ...recent.map((row) => ({
      icon: row.category === 'Food' ? 'fa-bowl-food' : row.category === 'Travel' ? 'fa-plane-departure' : 'fa-cart-shopping',
      title: row.merchant,
      detail: `${row.status} · ${money(row.amount)}`,
    })),
  ].slice(0, 3);

  forecastCommitments.innerHTML = upcoming.map((item) => `
    <div class="action-item">
      <i class="fa-solid ${item.icon}"></i>
      <div>
        <strong>${escHtml(item.title)}</strong>
        <span>${escHtml(item.detail)}</span>
      </div>
    </div>
  `).join('');

  const forecastMessage = el('forecast-message');
  if (forecastMessage) {
    const extra = actual[0]
      ? ` Your latest logged decision was ${actual[0].merchant}, which keeps the forecast grounded in live activity.`
      : '';
    forecastMessage.textContent = derived.runwayDays > 0
      ? `At your current pace, the budget stays workable if daily non-essential spending stays near ${money(derived.dailyBurn)}. Your daily limit is ${money(state.dailySpendLimit)}.${extra}`
      : 'Payday has arrived, so the next best move is to reset the scenario and protect the reserve again.';
  }
}

function renderSignals() {
  if (!signalsList) return;
  const actual = getSortedTransactions().filter((row) => row.source !== 'decision');
  const latest = actual[0];
  const reviewCount = actual.filter((row) => getTransactionSeverity(row.status) === 'warn').length;
  const foodTotal = actual.filter((row) => row.category === 'Food').reduce((sum, row) => sum + row.amount, 0);
  const travelTotal = actual.filter((row) => row.category === 'Travel').reduce((sum, row) => sum + row.amount, 0);
  const totalSpend = actual.reduce((sum, row) => sum + row.amount, 0) || 1;
  const foodRatio = foodTotal / totalSpend;
  const travelRatio = travelTotal / totalSpend;

  const signals = [];
  if (latest) {
    signals.push({
      icon: 'fa-bell',
      title: 'Latest activity',
      detail: `${latest.merchant} · ${money(latest.amount)} · ${latest.status.toLowerCase()}`,
    });
  }

  signals.push(
    {
      icon: 'fa-arrow-trend-up',
      title: 'Food spend trend',
      detail: `${foodRatio >= 0.35 ? 'Food is elevated' : 'Food is stable'} at ${(foodRatio * 100).toFixed(0)}% of tracked spend.`,
    },
    {
      icon: 'fa-plane-departure',
      title: 'Travel pressure',
      detail: travelRatio > 0.2 ? `Travel is taking ${(travelRatio * 100).toFixed(0)}% of spend.` : `Travel is balanced at ${(travelRatio * 100).toFixed(0)}%.`,
    },
    {
      icon: 'fa-circle-minus',
      title: 'Review count',
      detail: `${reviewCount} transactions need attention right now.`,
    }
  );

  signalsList.innerHTML = signals.map((item) => `
    <div class="action-item">
      <i class="fa-solid ${item.icon}"></i>
      <div>
        <strong>${escHtml(item.title)}</strong>
        <span>${escHtml(item.detail)}</span>
      </div>
    </div>
  `).join('');
}

function exportInsights() {
  const rows = insightsMode === 'decisions'
    ? getSortedTransactions().filter((row) => row.source === 'decision')
    : insightsMode === 'all'
      ? getSortedTransactions()
      : getSortedTransactions().filter((row) => row.source !== 'decision');
  const csv = [
    ['date', 'merchant', 'category', 'amount', 'status', 'source', 'note'],
    ...rows.map((row) => [row.date, row.merchant, row.category, row.amount, row.status, row.source || 'seed', row.note || '']),
  ].map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `spendora-${insightsMode}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderInsights() {
  if (!insightsTableBody) return;
  const search = (searchInput?.value || '').trim().toLowerCase();
  const filter = (filterSelect?.value || 'All categories').toLowerCase();
  const actualTransactions = getSortedTransactions().filter((row) => row.source !== 'decision');
  const decisionTransactions = getSortedTransactions().filter((row) => row.source === 'decision');
  const modeRows = insightsMode === 'decisions'
    ? decisionTransactions
    : insightsMode === 'all'
      ? getSortedTransactions()
      : actualTransactions;

  if (insightPeriodBtn) {
    insightPeriodBtn.textContent = insightsMode === 'decisions'
      ? 'Decisions'
      : insightsMode === 'all'
        ? 'All activity'
        : 'This month';
  }

  const filtered = modeRows.filter((row) => {
    const matchesSearch = !search || `${row.date} ${row.merchant} ${row.category} ${row.amount} ${row.status} ${row.note || ''}`.toLowerCase().includes(search);
    const matchesFilter = filter === 'all categories' || row.category.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });
  const actualFiltered = filtered.filter((row) => row.source !== 'decision');

  insightsTableBody.innerHTML = filtered.length
    ? filtered.map((row) => `
      <tr>
        <td>${row.date}</td>
        <td>${escHtml(row.merchant)}</td>
        <td>${escHtml(row.category)}</td>
        <td class="text-right">${money(row.amount)}</td>
        <td><span class="table-pill ${getTransactionSeverity(row.status) === 'warn' ? 'table-pill--warn' : 'table-pill--ok'}">${escHtml(row.status)}</span></td>
      </tr>
    `).join('')
    : `<tr><td colspan="5"><div class="empty-state"><i class="fa-regular fa-folder-open"></i><strong>No matching transactions</strong><span>Try a different filter or search term.</span></div></td></tr>`;

  const spend = actualFiltered.reduce((sum, row) => sum + row.amount, 0);
  const fallbackSpend = actualTransactions.reduce((sum, row) => sum + row.amount, 0);
  const alerts = actualTransactions.filter((row) => getTransactionSeverity(row.status) === 'warn').length;
  setText('insight-spend', money(spend || fallbackSpend));
  setText('insight-rate', money(Math.round((spend || fallbackSpend) / Math.max(1, getDerivedState().runwayDays || 24))));
  setText('insight-alerts', String(alerts || 0));
  setText('insight-transactions', String(filtered.length || modeRows.length));
}

function initNavigation() {
  const currentPage = page;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const isActive = link.dataset.nav === currentPage;
    link.classList.toggle('nav-item--active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  menuToggle?.addEventListener('click', () => document.body.classList.toggle('nav-open'));
  backdrop?.addEventListener('click', () => document.body.classList.remove('nav-open'));
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => document.body.classList.remove('nav-open')));
}

function initCommonControls() {
  [inputBalance, inputBills, inputExpenses, inputBuffer, salaryDateInput, settingsNameInput, settingsSalaryInput, settingsLowBalanceInput, settingsDailyLimitInput].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', () => {
      setStateFromInputs();
      saveState();
      if (page === 'settings') showSettingsStatus('Unsaved changes stored');
      renderAll();
    });
    input.addEventListener('change', () => {
      setStateFromInputs();
      saveState();
      if (page === 'settings') showSettingsStatus('Saved locally');
      renderAll();
    });
  });

  resetBtn?.addEventListener('click', () => {
    state.balance = defaults.balance;
    state.bills = defaults.bills;
    state.expenses = defaults.expenses;
    state.buffer = defaults.buffer;
    state.salaryDate = defaults.salaryDate;
    state.profileName = defaults.profileName;
    state.monthlySalary = defaults.monthlySalary;
    state.lowBalanceWarning = defaults.lowBalanceWarning;
    state.dailySpendLimit = defaults.dailySpendLimit;
    state.transactions = createSeedTransactions();
    syncInputsFromState();
    saveState();
    renderAll();
    if (page === 'checks' || page === 'dashboard') clearChat();
  });
}

function initChecksPage() {
  if (!chatForm || !chatInput || !chatFeed) {
    console.warn('Spendora: initChecksPage missing elements', {
      chatForm: Boolean(chatForm),
      chatInput: Boolean(chatInput),
      chatFeed: Boolean(chatFeed),
      prompts: document.querySelectorAll ? document.querySelectorAll('.prompt').length : 0
    });
    return;
  }
  const submit = (query) => {
    if (!query.trim()) return;
    addUserMsg(query);
    const analysis = analyzePurchaseQuery(query);
    const loader = showTyping();
    window.setTimeout(() => {
      loader?.remove();
      const response = getResponse(query);
      addAIMsg(response);
      if (analysis.type === 'purchase') {
        const derived = getDerivedState();
        const verdict = analysis.cost <= derived.safe
          ? 'Approved'
          : analysis.cost <= derived.safe + state.buffer
            ? 'Review'
            : analysis.cost <= state.balance - state.bills
              ? 'Check'
              : 'Blocked';

        state.transactions = [
          createTransaction({
            merchant: analysis.merchant,
            category: analysis.category,
            amount: analysis.cost,
            status: verdict,
            note: `Decision logged • ${analysis.item}`,
          }),
          ...state.transactions,
        ].slice(0, 60);
        saveState();
        renderAll();
      }
    }, 650);
  };

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = chatInput.value.trim();
    chatInput.value = '';
    submit(query);
  });

  prompts.forEach((button) => button.addEventListener('click', () => submit(button.dataset.query || '')));
  chatInput.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      chatInput.focus();
    }
  });

  recalcBtn?.addEventListener('click', renderAll);
}

function initInsightsPage() {
  searchInput?.addEventListener('input', renderInsights);
  filterSelect?.addEventListener('change', renderInsights);
  insightPeriodBtn?.addEventListener('click', () => {
    insightsMode = insightsMode === 'actual' ? 'decisions' : insightsMode === 'decisions' ? 'all' : 'actual';
    renderInsights();
  });
  insightsExportBtn?.addEventListener('click', exportInsights);
}

function initSettingsPage() {
  settingsSaveBtn?.addEventListener('click', () => {
    setStateFromInputs();
    saveState();
    renderAll();
    showSettingsStatus('Settings saved');
  });
}

function initAllPageSpecific() {
  if (page === 'checks') initChecksPage();
  if (page === 'insights') initInsightsPage();
  if (page === 'settings') initSettingsPage();
}

function renderAll() {
  renderSharedState();
  renderForecastBars();
  renderForecastCommitments();
  renderSignals();
  renderInsights();
}

function init() {
  syncInputsFromState();
  initNavigation();
  initCommonControls();
  initAllPageSpecific();
  clearChat();
  renderAll();
  saveState();

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    Object.assign(state, normalizeState(JSON.parse(event.newValue)));
    syncInputsFromState();
    renderAll();
  });
}

init();
