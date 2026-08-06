/* SPA 45 trainer application. Curriculum data lives in ../data/content.js. */

const STORE_KEY = 'spa45_fiveweek_v2';
const OLD_STORE_KEY = 'spa45_fiveweek_v1';
const DB_NAME = 'spa45_audio_v2';
const DB_VERSION = 1;
const AUDIO_STORE = 'clips';
const THEME_KEY = 'spa45-theme';
const EXPRESSION_CARDS_KEY = 'spa45_expression_cards_v1';
const EXPRESSION_REVIEW_KEY = 'spa45_expression_review_v1';

const defaultState = {
  contentVersion: '5.1-bottleneck-packets-balanced-order',
  settings: {
    revealSec: 10,
    ttsRate: 0.95,
    speakQuestion: true,
    darkMode: false,
    questionVoice: '',
    passageVoice: ''
  },
  records: {},
  reviewMeta: {},
  completed: {},
  startedSessions: {},
  sessionHistory: {},
  lastSession: null
};

const COMMON_BOTTLENECKS = [
  ['misunderstood', '질문의 핵심을 정확히 이해하지 못했다'],
  ['slowStart', '답변을 시작하는 데 오래 걸렸다'],
  ['indirect', '질문에 직접 답하지 못했다'],
  ['thinContent', '이유·예시·세부내용이 부족했다'],
  ['wordRecall', '필요한 단어나 표현이 떠오르지 않았다'],
  ['incomplete', '문장을 끝까지 완성하지 못했다'],
  ['disfluent', '긴 침묵·반복·머뭇거림이 많았다']
];

const TYPE_BOTTLENECKS = {
  interview: [
    ['weakPersonalLink', '내 경험이나 의견을 질문과 자연스럽게 연결하지 못했다']
  ],
  listening: [
    ['missedMainIdea', '듣기 지문의 핵심 주제를 놓쳤다'],
    ['missedKeyDetails', '중요한 세부내용이나 결론을 기억하지 못했다']
  ],
  situation: [
    ['unclearFirstAction', '상황에서 가장 먼저 할 행동을 분명하게 말하지 못했다'],
    ['missingFollowup', '행동의 이유나 후속 조치를 충분히 설명하지 못했다']
  ],
  photo: [
    ['missedSceneOverview', '사진의 전체 장소나 핵심 장면을 먼저 말하지 못했다'],
    ['unsupportedInference', '사진에서 확인하기 어려운 내용을 단정적으로 추측했다']
  ],
  product: [
    ['missedProductFeatures', '제품의 핵심 특징을 충분히 설명하지 못했다'],
    ['missingBenefitConcern', '제품의 장점이나 가능한 우려 사항을 연결하지 못했다']
  ],
  visual: [
    ['missedMainData', '자료의 가장 중요한 특징이나 수치를 먼저 말하지 못했다'],
    ['wrongComparison', '수치·순위·비교 관계를 정확하게 설명하지 못했다']
  ]
};

const DIFFICULTY_LABELS = {
  1: '매우 쉬움',
  2: '쉬움',
  3: '보통',
  4: '어려움',
  5: '매우 어려움'
};

const VALID_OUTCOMES = new Set(['fail', 'partial', 'success']);

function isEvaluationComplete(record) {
  return VALID_OUTCOMES.has(record?.outcome);
}

function syncDifficultyUI() {
  document.querySelectorAll('#rating button').forEach(button => {
    const selected = Number(button.dataset.rate) === currentDifficulty;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  if ($('difficultySelection')) {
    $('difficultySelection').textContent = currentDifficulty
      ? `선택: ${currentDifficulty} · ${DIFFICULTY_LABELS[currentDifficulty]}`
      : '난이도를 선택하지 않았습니다.';
  }
}

const EXPRESSION_CATEGORIES = ['의견 말하기','이유 설명','장점 설명','예시 들기','비교하기','문제 설명','문제 해결','해결책 제안','경험 이야기','사진 묘사','그래프 비교','추측하기','결론 내리기','요약','가정 상황','자기소개','추천과 설득','조언하기','습관 설명','시간 벌기','기타'];

const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function loadLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch (error) {
    console.warn(`${key} 데이터를 읽지 못했습니다.`, error);
    return clone(fallback);
  }
}

let state = loadState();
let expressionCards = loadLocalJSON(EXPRESSION_CARDS_KEY, []);
let expressionReview = loadLocalJSON(EXPRESSION_REVIEW_KEY, {});
let db = null;
let currentSession = null;
let currentTasks = [];
let currentCoreTasks = [];
let currentBoosterTasks = [];
let boosterMode = false;
let currentTaskIndex = 0;
let currentDifficulty = 0;
let currentOutcome = '';
let questionSeen = false;
let replayUsed = false;
let listenPlays = 0;
let passageCompleted = false;
let passagePaused = false;
let passageInterrupted = false;
let passagePreparing = false;
let speechRequestToken = 0;
let questionHiddenAt = null;
let revealInterval = null;
let mediaRecorder = null;
let stream = null;
let recordStartAt = 0;
let recordInterval = null;
let recordingTarget = 'first';
let currentMime = '';
let currentExt = 'webm';
let clipUrls = { first: null, retry: null };
let clipCache = { first: null, retry: null };
let voicesCache = [];
let activeUtterance = null;
let activeSpeechKind = '';
let stage = 'answer';
let openWeeks = null;
let expressionFilter = '전체';
let expressionReviewQueue = [];
let expressionReviewIndex = 0;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...clone(defaultState),
        ...parsed,
        settings: { ...defaultState.settings, ...(parsed.settings || {}) },
        records: parsed.records || {},
        reviewMeta: parsed.reviewMeta || {},
        completed: parsed.completed || {},
        startedSessions: parsed.startedSessions || {},
        sessionHistory: parsed.sessionHistory || {}
      };
    }
    const old = localStorage.getItem(OLD_STORE_KEY);
    if (old) {
      const parsed = JSON.parse(old);
      return {
        ...clone(defaultState),
        settings: { ...defaultState.settings, ...(parsed.settings || {}) },
        records: parsed.records || {},
        completed: parsed.completed || {},
        lastSession: parsed.lastSession || null
      };
    }
  } catch (error) {
    console.warn('저장 상태를 읽지 못했습니다.', error);
  }
  return clone(defaultState);
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  updateStats();
}

function saveExpressionData() {
  localStorage.setItem(EXPRESSION_CARDS_KEY, JSON.stringify(expressionCards));
  localStorage.setItem(EXPRESSION_REVIEW_KEY, JSON.stringify(expressionReview));
  updateStats();
}

function fmt(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function bytesText(bytes) {
  if (!bytes) return '0 MB';
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function extForMime(mime = '') {
  const value = mime.toLowerCase();
  if (value.includes('mp4') || value.includes('m4a')) return 'm4a';
  if (value.includes('ogg')) return 'ogg';
  if (value.includes('wav')) return 'wav';
  return 'webm';
}

function preferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateTheme(nextTheme = preferredTheme(), announce = false) {
  const theme = nextTheme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  state.settings.darkMode = theme === 'dark';
  if ($('darkMode')) $('darkMode').checked = theme === 'dark';
  const toggle = $('themeQuick');
  const label = theme === 'dark' ? '라이트모드로 전환' : '야간모드로 전환';
  if (toggle) {
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
  if ($('themeButtonText')) $('themeButtonText').textContent = label;
  if ($('themeColorMeta')) $('themeColorMeta').setAttribute('content', theme === 'dark' ? '#0B0E14' : '#F7FAFF');
  if (announce && $('themeAnnounce')) $('themeAnnounce').textContent = theme === 'dark' ? '야간모드가 적용되었습니다.' : '라이트모드가 적용되었습니다.';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  updateTheme(next, true);
}

function stopAllSpeech() {
  const wasPassage = activeSpeechKind === 'passage';
  if (wasPassage) passageInterrupted = true;
  speechRequestToken += 1;
  if ('speechSynthesis' in window) {
    try { speechSynthesis.cancel(); } catch (_) {}
  }
  activeUtterance = null;
  activeSpeechKind = '';
  passagePaused = false;
  passagePreparing = false;
  $('stopQuestionSpeech')?.classList.add('hidden');
  syncPassageControls();
}

function setTab(name) {
  stopAllSpeech();
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('active', panel.id === `panel-${name}`));
  if (name === 'records') renderRecords();
  if (name === 'settings') renderStorageStats();
}

document.querySelectorAll('.tab').forEach(button => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
});
$('backCourse').addEventListener('click', () => setTab('course'));
$('themeQuick').addEventListener('click', toggleTheme);

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const dbPut = value => idbRequest(db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE).put(value));
const dbGet = key => idbRequest(db.transaction(AUDIO_STORE).objectStore(AUDIO_STORE).get(key));
const dbDelete = key => idbRequest(db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE).delete(key));
const dbAll = () => idbRequest(db.transaction(AUDIO_STORE).objectStore(AUDIO_STORE).getAll());
const dbClear = () => idbRequest(db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE).clear());

async function initDB() {
  try {
    db = await openDB();
    await renderStorageStats();
    updateStats();
  } catch (error) {
    console.error(error);
    $('storageStatus').textContent = '사용 불가';
    $('storageStatus').className = 'status-bad';
    $('storageHelp').textContent = 'IndexedDB를 열 수 없습니다. 시크릿 모드가 아닌 최신 브라우저에서 다시 시도하세요.';
  }
}

function buildSourceCatalog() {
  const catalog = {};
  for (const session of SESSIONS) {
    session.interview.forEach((question, index) => {
      const source = session.interviewIds?.[index] || `${session.id}-i${index + 1}`;
      catalog[source] = {
        id: source,
        source,
        type: 'interview',
        title: index === 0 ? '기본 질문' : `꼬리 질문 ${index}`,
        question,
        originSession: session.id,
        originOrder: session.order,
        guide: '이전 답을 보지 말고 다시 말해 보세요.'
      };
    });
    session.specials.forEach((special, specialIndex) => {
      const questions = special.questions?.length ? special.questions : [{ role: 'main', label: '문제', text: special.question }];
      questions.forEach((question, questionIndex) => {
        const source = `${session.id}-s${specialIndex + 1}-q${questionIndex + 1}`;
        const isMain = questionIndex === 0;
        catalog[source] = {
          ...clone(special),
          id: source,
          source,
          title: `${special.title} · ${question.label || `질문 ${questionIndex + 1}`}`,
          question: question.text || question,
          questionRole: question.role || 'followUp',
          questionIndex,
          allowListen: special.type === 'listening' && isMain,
          revealPassageAfter: special.type === 'listening' && isMain,
          originSession: session.id,
          originOrder: session.order,
          guide: special.type === 'listening'
            ? (isMain ? '지문을 듣고 핵심을 자기 문장으로 요약하세요.' : '앞서 들은 내용을 근거로 후속 질문에 답하세요.')
            : special.type === 'situation'
              ? '같은 상황을 바탕으로 행동과 이유를 분명히 답하세요.'
              : '같은 자료를 근거로 설명·비교·해석하세요.'
        };
      });
    });
  }
  return catalog;
}

const SOURCE_CATALOG = buildSourceCatalog();
function strategyConfigs(session) {
  return Array.isArray(STRATEGY_TASKS?.[session.id]) ? STRATEGY_TASKS[session.id] : [];
}

function strategyTask(session, config, index) {
  const id = config.id || `${session.id}-x${index + 1}`;
  if (config.type === 'visual-extra') {
    const specialIndex = session.specials.findIndex(item => item.title === config.attachToSpecial);
    const special = session.specials[specialIndex];
    if (!special) return null;
    const baseCount = special.questions?.length || 1;
    const attached = strategyConfigs(session).filter(item => item.type === 'visual-extra' && item.attachToSpecial === special.title);
    const attachedIndex = attached.findIndex(item => item === config);
    return {
      ...clone(special),
      ...clone(config),
      type: 'visual',
      id,
      source: id,
      title: `${special.title} · ${config.title}`,
      visualTitle: special.title,
      question: config.question,
      questionRole: 'strategy',
      questionIndex: baseCount + attachedIndex,
      visualQuestionIndex: baseCount + attachedIndex,
      visualQuestionCount: baseCount + attached.length,
      visualGroupId: `${session.id}-s${specialIndex + 1}`,
      originOrder: session.order,
      phase: 'strategy',
      guide: config.guide || '자료 전체를 먼저 보고 핵심만 골라 답하세요.',
      expressions: clone(config.expressions || [])
    };
  }
  return {
    ...clone(config),
    id,
    source: id,
    originOrder: session.order,
    phase: 'strategy',
    questionRole: config.type === 'listening' ? 'main' : 'strategy',
    allowListen: config.type === 'listening',
    revealPassageAfter: config.type === 'listening',
    expressions: clone(config.expressions || [])
  };
}

function strategyTasks(session) {
  return strategyConfigs(session).map((config, index) => strategyTask(session, config, index)).filter(Boolean);
}

function interviewTasks(session, officialTask = null, phase = 'practice') {
  return session.interview.map((question, index) => {
    const id = session.interviewIds?.[index] || `${session.id}-i${index + 1}`;
    return ({
    id,
    source: id,
    type: 'interview',
    title: index === 0 ? '기본 질문' : `꼬리 질문 ${index}`,
    question,
    originOrder: session.order,
    officialTask,
    phase,
    guide: index === 0 ? '핵심 답변 뒤에 이유나 세부내용을 붙이세요.' : '앞선 답변과 연결해 구체적으로 답하세요.'
  });
  });
}

function expandSpecial(session, special, specialIndex, officialTask = null, phase = 'practice') {
  const questions = special.questions?.length ? special.questions : [{ role: 'main', label: '문제', text: special.question }];
  const attachedCount = strategyConfigs(session).filter(item => item.type === 'visual-extra' && item.attachToSpecial === special.title).length;
  const visualQuestionCount = questions.length + attachedCount;
  return questions.map((question, questionIndex) => {
    const isMain = questionIndex === 0;
    let guide = '';
    if (special.type === 'listening') guide = isMain ? '지문의 핵심과 세부내용을 자기 문장으로 재구성하세요.' : '앞서 들은 내용을 근거로 질문에 직접 답하세요.';
    else if (special.type === 'situation') guide = isMain ? '첫 행동을 분명히 말한 뒤 이유를 붙이세요.' : '같은 상황을 이어서 더 구체적으로 답하세요.';
    else guide = isMain ? '전체 특징부터 말하고 중요한 정보만 선별하세요.' : '자료를 근거로 비교·해석·의견을 말하세요.';
    const isVisual = special.type === 'visual';
    return {
      ...clone(special),
      id: `${session.id}-s${specialIndex + 1}-q${questionIndex + 1}`,
      source: `${session.id}-s${specialIndex + 1}-q${questionIndex + 1}`,
      title: `${special.title} · ${question.label || `질문 ${questionIndex + 1}`}`,
      visualTitle: special.title,
      question: question.text || question,
      questionRole: question.role || 'followUp',
      questionIndex,
      visualQuestionIndex: isVisual ? questionIndex : undefined,
      visualQuestionCount: isVisual ? visualQuestionCount : undefined,
      visualGroupId: isVisual ? `${session.id}-s${specialIndex + 1}` : undefined,
      allowListen: special.type === 'listening' && isMain,
      revealPassageAfter: special.type === 'listening' && isMain,
      originOrder: session.order,
      officialTask: question.officialTask || officialTask,
      phase,
      guide
    };
  });
}

function sessionSpecialTasks(session) {
  const extras = strategyTasks(session).filter(task => task.visualGroupId);
  const output = [];
  session.specials.forEach((special, specialIndex) => {
    output.push(...expandSpecial(session, special, specialIndex));
    output.push(...extras.filter(task => task.visualGroupId === `${session.id}-s${specialIndex + 1}`));
  });
  return output;
}

function buildMockTaskSets(session) {
  const seed = (session.week - 1) * 3;
  const warmups = [0, 1].map(index => ({
    id: `${session.id}-task1-q${index + 1}`,
    source: `${session.id}-task1-q${index + 1}`,
    type: 'interview',
    title: `개인 질문 ${index + 1}`,
    question: WARMUP_BANK[(seed + index) % WARMUP_BANK.length],
    originOrder: session.order,
    officialTask: 1,
    phase: 'mock',
    guide: '짧고 자연스럽게 바로 답하세요.'
  }));
  const listeningIndex = session.specials.findIndex(item => item.type === 'listening');
  const situationIndex = session.specials.findIndex(item => item.type === 'situation');
  let visualIndex = session.specials.findIndex(item => item.type === 'visual' && item.kind !== 'product');
  if (visualIndex < 0) visualIndex = session.specials.findIndex(item => item.type === 'visual');
  const listeningAll = listeningIndex >= 0 ? expandSpecial(session, session.specials[listeningIndex], listeningIndex, 2, 'mock') : [];
  const listening = listeningAll.slice(0, 2);
  const interviews = interviewTasks(session, null, 'mock');
  const task3 = interviews.slice(0, 2).map(item => ({ ...item, officialTask: 3 }));
  const situationAll = situationIndex >= 0 ? expandSpecial(session, session.specials[situationIndex], situationIndex, 4, 'mock') : [];
  const task4 = situationAll.length ? situationAll.slice(0, 2) : interviews.slice(2).map(item => ({ ...item, officialTask: 4 }));
  const visualAll = visualIndex >= 0 ? expandSpecial(session, session.specials[visualIndex], visualIndex, 5, 'mock') : [];
  const task5 = visualAll.slice(0, 2);
  const used = new Set([...listening, ...task4, ...task5].map(item => item.id));
  const usedVisualGroup = task5[0]?.visualGroupId || null;
  const booster = [];
  interviews.slice(2).forEach(item => booster.push({ ...item, phase: 'booster', title: `약점 보강 · ${item.title}` }));
  session.specials.forEach((special, specialIndex) => {
    expandSpecial(session, special, specialIndex, null, 'booster').forEach(item => {
      if (usedVisualGroup && item.visualGroupId === usedVisualGroup) return;
      if (!used.has(item.id)) booster.push({ ...item, title: `약점 보강 · ${item.title}` });
    });
  });
  return { core: [...warmups, ...listening, ...task3, ...task4, ...task5], booster };
}

function buildPracticeTasks(session) {
  const interviews = interviewTasks(session);
  const strategies = strategyTasks(session).filter(task => !task.visualGroupId);
  const at = placement => strategies.filter(task => (task.placement || 'after-interviews') === placement);
  return [
    ...at('opening'),
    ...interviews.slice(0, 1),
    ...at('after-interview-1'),
    ...interviews.slice(1, 2),
    ...at('after-interview-2'),
    ...interviews.slice(2),
    ...at('after-interviews'),
    ...sessionSpecialTasks(session),
    ...at('closing'),
    ...at('after-special')
  ];
}

function buildTaskSets(session) {
  if (session.mock5) return buildMockTaskSets(session);
  return { core: buildPracticeTasks(session), booster: [] };
}

function buildTasks(session) {
  return buildTaskSets(session).core;
}

function displayMode(session) {
  return session.mock5 ? '모의고사' : session.mode;
}

function isSessionStarted(sessionId) {
  return !!state.startedSessions[sessionId] || Object.values(state.records).some(record => record.sessionId === sessionId);
}

function markSessionStarted(sessionId = currentSession?.id) {
  if (!sessionId || state.completed[sessionId]) return;
  state.startedSessions[sessionId] = true;
}

function ensureWeekState() {
  if (openWeeks) return;
  const mobile = window.matchMedia('(max-width: 520px)').matches;
  openWeeks = new Set(mobile ? [] : [1, 2, 3, 4, 5]);
}

function renderCourse() {
  ensureWeekState();
  const root = $('courseGrid');
  root.innerHTML = '';
  for (let week = 1; week <= 5; week += 1) {
    const sessions = SESSIONS.filter(session => session.week === week);
    const completedCount = sessions.filter(session => state.completed[session.id]).length;
    const details = document.createElement('details');
    details.className = 'week';
    details.open = openWeeks.has(week);
    details.innerHTML = `
      <summary>
        <div class="week-title"><span class="week-chevron">›</span><h3>Week ${week}</h3></div>
        <div class="week-meta"><span class="week-focus">${esc(sessions[0].focus)}</span><span class="week-progress">완료 ${completedCount}/7</span></div>
      </summary>
      <div class="session-grid"></div>`;
    details.addEventListener('toggle', () => {
      if (details.open) openWeeks.add(week);
      else openWeeks.delete(week);
    });
    const grid = details.querySelector('.session-grid');
    sessions.forEach(session => {
      const button = document.createElement('button');
      const done = !!state.completed[session.id];
      const started = !done && isSessionStarted(session.id);
      button.type = 'button';
      button.className = `session${done ? ' done' : started ? ' started' : ''}${state.lastSession === session.id ? ' current' : ''}`;
      button.innerHTML = `
        ${done ? '<span class="check">✓</span>' : ''}
        <div class="session-card-top">
          <strong class="${session.kind === 'weekend' ? 'weekend-name' : ''}">${esc(session.label)}</strong>
          <span class="session-meta">${session.minutes}분 · ${esc(displayMode(session))}</span>
        </div>
        <span class="session-theme">${esc(session.theme)}</span>`;
      button.addEventListener('click', () => openSession(session.id));
      grid.appendChild(button);
    });
    root.appendChild(details);
  }
}

async function updateStats() {
  const records = Object.values(state.records);
  $('doneSessions').textContent = `${Object.keys(state.completed).length}/35`;
  $('savedAnswers').textContent = records.length;
  $('dueReviews').textContent = expressionCards.length;
  renderCourse();
  if (db) {
    try { $('audioCount').textContent = (await dbAll()).length; } catch (_) {}
  }
}

function sessionTaskUniverse() {
  const map = new Map();
  [...currentCoreTasks, ...currentBoosterTasks].forEach(task => map.set(task.id, task));
  return [...map.values()];
}

function updateSessionChips() {
  if (!currentSession) return;
  const specialQuestionCount = currentSession.specials.reduce((total, special) => total + (special.questions?.length || 1), 0);
  const strategyCount = strategyConfigs(currentSession).length;
  if (currentSession.mock5) {
    $('sessionChips').innerHTML = boosterMode
      ? `<span class="chip">선택 약점 보강</span><span class="chip">${currentTasks.length}문항</span>`
      : `<span class="chip">모의고사</span><span class="chip">실전 ${currentCoreTasks.length}문항</span><span class="chip">선택 보강 ${currentBoosterTasks.length}문항</span>`;
    return;
  }
  $('sessionChips').innerHTML = `<span class="chip">${esc(displayMode(currentSession))}</span><span class="chip">일반 질문 3개</span><span class="chip">전략 강화 ${strategyCount}문제</span><span class="chip">특수 질문 ${specialQuestionCount}개</span>`;
}

async function openSession(id) {
  if (mediaRecorder?.state === 'recording') return alert('녹음을 먼저 종료해 주세요.');
  stopAllSpeech();
  currentSession = SESSIONS.find(session => session.id === id);
  state.lastSession = id;
  saveState();
  const taskSets = buildTaskSets(currentSession);
  currentCoreTasks = taskSets.core;
  currentBoosterTasks = taskSets.booster;
  boosterMode = false;
  currentTasks = currentCoreTasks;
  currentTaskIndex = 0;
  $('noSession').classList.add('hidden');
  $('practiceArea').classList.remove('hidden');
  $('sessionEnd').classList.add('hidden');
  $('taskCard').classList.remove('hidden');
  $('sessionPromptArea').classList.add('hidden');
  $('startBooster')?.classList.add('hidden');
  $('sessionMeta').textContent = `WEEK ${currentSession.week} · ${currentSession.label} · ${currentSession.minutes}분`;
  $('sessionTitle').textContent = currentSession.theme;
  $('sessionDesc').textContent = currentSession.focus;
  updateSessionChips();
  $('mockBanner').classList.add('hidden');
  renderTaskNav();
  await loadTask(0);
  setTab('practice');
}

function updateSessionProgressUI() {
  const total = currentTasks.length;
  const current = total ? currentTaskIndex + 1 : 0;
  const completed = currentTasks.filter(task => isEvaluationComplete(state.records[task.id])).length;
  const progressValue = total ? Math.round((completed / total) * 100) : 0;
  $('sessionProgress').style.width = `${progressValue}%`;
  $('sessionProgressTrack')?.setAttribute('aria-valuenow', String(progressValue));
  $('sessionProgressTrack')?.setAttribute('aria-label', `평가 완료 ${completed}/${total}`);
  if ($('sessionPosition')) $('sessionPosition').textContent = `${current} / ${total}`;
  if ($('sessionCompleted')) $('sessionCompleted').textContent = `${completed} / ${total}`;
}

function syncTaskNavArrows() {
  const nav = $('taskNav');
  if (!nav) return;
  const tolerance = 2;
  const canScroll = nav.scrollWidth > nav.clientWidth + tolerance;
  $('navLeft').disabled = !canScroll || nav.scrollLeft <= tolerance;
  $('navRight').disabled = !canScroll || nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - tolerance;
}

function renderTaskNav() {
  const nav = $('taskNav');
  nav.innerHTML = '';
  currentTasks.forEach((task, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `task-dot${index === currentTaskIndex ? ' active' : ''}${isEvaluationComplete(state.records[task.id]) ? ' done' : ''}`;
    button.textContent = index + 1;
    button.title = task.title;
    button.setAttribute('aria-label', `${index + 1}번 문제 · ${task.title}`);
    if (index === currentTaskIndex) button.setAttribute('aria-current', 'step');
    button.addEventListener('click', async () => {
      if (mediaRecorder?.state === 'recording') return alert('녹음을 먼저 종료해 주세요.');
      saveBeforeNavigate();
      await loadTask(index);
    });
    nav.appendChild(button);
  });
  updateSessionProgressUI();
  requestAnimationFrame(() => {
    nav.querySelector('.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    requestAnimationFrame(syncTaskNavArrows);
  });
}

$('taskNav').addEventListener('scroll', syncTaskNavArrows, { passive: true });
$('navLeft').addEventListener('click', () => $('taskNav').scrollBy({ left: -240, behavior: 'smooth' }));
$('navRight').addEventListener('click', () => $('taskNav').scrollBy({ left: 240, behavior: 'smooth' }));
window.addEventListener('resize', syncTaskNavArrows);

function taskTypeName(task) {
  const base = {
    interview: '인터뷰',
    listening: task.questionRole === 'main' ? '듣고 요약' : '듣기 후속 질문',
    situation: '상황형 질문',
    visual: task.kind === 'photo' ? '사진·그림' : task.kind === 'product' ? '제품 이미지' : '시각자료'
  }[task.type] || '훈련';
  if (task.officialTask) return `Task ${task.officialTask} · ${base}`;
  return task.phase === 'strategy' ? `전략 강화 · ${base}` : base;
}

function bottleneckType(task) {
  if (!task) return 'interview';
  if (task.type === 'listening') return 'listening';
  if (task.type === 'situation') return 'situation';
  if (task.type === 'visual' && task.kind === 'photo') return 'photo';
  if (task.type === 'visual' && task.kind === 'product') return 'product';
  if (task.type === 'visual') return 'visual';
  return 'interview';
}

function bottleneckDefinitions(task) {
  return {
    common: COMMON_BOTTLENECKS,
    typeSpecific: TYPE_BOTTLENECKS[bottleneckType(task)] || []
  };
}

function renderChecks(task = currentTasks[currentTaskIndex]) {
  const groups = bottleneckDefinitions(task);
  const renderGroup = (title, definitions) => definitions.length
    ? `<div class="bottleneck-group"><div class="bottleneck-group-title">${esc(title)}</div><div class="checks-grid">${definitions.map(([key, label]) => `<label class="checkitem"><input type="checkbox" data-key="${key}" /> ${esc(label)}</label>`).join('')}</div></div>`
    : '';
  $('checks').innerHTML = `${renderGroup('공통 병목', groups.common)}${renderGroup('이 문제 유형에서 걸린 부분', groups.typeSpecific)}`;
}

function selectedBottleneckEntries(task, record, group = 'all') {
  const groups = bottleneckDefinitions(task);
  const definitions = group === 'common' ? groups.common : group === 'typeSpecific' ? groups.typeSpecific : [...groups.common, ...groups.typeSpecific];
  return definitions.filter(([key]) => !!record?.bottlenecks?.[key]);
}

function selectedBottleneckText(task, record, group) {
  const selected = selectedBottleneckEntries(task, record, group);
  return selected.length ? selected.map(([, label]) => `- ${label}`).join('\n') : '- 선택한 항목 없음';
}

function legacySelfAssessmentText(record) {
  if (!record?.checks || record?.bottlenecks) return '';
  const legacyLabels = {
    understood: '질문 이해', quick: '빠른 시작', direct: '직접 답변', reason: '이유',
    detail: '세부내용·예시', complete: '문장 완성', pause: '침묵 최소화', flow: '연결어'
  };
  const selected = Object.entries(record.checks).filter(([, value]) => value).map(([key]) => legacyLabels[key] || key);
  return selected.length ? `\n이전 버전 긍정형 자가평가: ${selected.join(', ')}\n위 기록은 병목 진단으로 해석하지 마세요.` : '';
}

function effectiveRevealSec(task) {
  let seconds = Math.max(5, Number(state.settings.revealSec) || 10);
  const length = fullQuestion(task).length;
  if (task.type === 'situation') seconds = Math.max(seconds, 15);
  else if (task.type === 'listening' || task.type === 'visual') seconds = Math.max(seconds, 10);
  else if (length > 130) seconds = Math.max(seconds, 12);
  else if (length > 80) seconds = Math.max(seconds, 8);
  return seconds;
}

function fullQuestion(task) {
  return task.type === 'situation' ? `Situation: ${task.scenario}\n\n${task.question}` : task.question;
}

async function loadTask(index) {
  const previousTask = currentTasks[currentTaskIndex] || null;
  const nextTask = currentTasks[index];
  const sameVisualGroup = !!(previousTask?.visualGroupId && nextTask?.visualGroupId && previousTask.visualGroupId === nextTask.visualGroupId);
  stopAllSpeech();
  stopLiveResources();
  clearReveal();
  revokeClipUrls();
  currentTaskIndex = index;
  currentDifficulty = 0;
  currentOutcome = '';
  questionSeen = false;
  replayUsed = false;
  listenPlays = 0;
  passageCompleted = false;
  passagePaused = false;
  passageInterrupted = false;
  questionHiddenAt = null;
  recordingTarget = 'first';
  stage = 'answer';

  const task = currentTasks[index];
  $('answerStage').classList.remove('hidden');
  $('evaluationStage').classList.add('hidden');
  $('mockBanner').classList.toggle('hidden', !(currentSession?.mock5 && task.phase === 'mock'));
  const visualStep = task.visualGroupId ? ` · 자료 질문 ${Number(task.visualQuestionIndex) + 1}/${task.visualQuestionCount}` : '';
  $('taskType').textContent = `${taskTypeName(task)}${visualStep} · ${index + 1}/${currentTasks.length}`;
  $('taskTitle').textContent = task.visualGroupId ? (task.visualTitle || task.title.split(' · ')[0]) : task.title;
  $('taskGuide').textContent = task.guide || '';
  $('questionDisplay').className = 'question-hidden';
  $('questionDisplay').textContent = task.type === 'listening' && task.allowListen ? '지문을 들은 뒤 질문을 확인하세요.' : '먼저 ‘질문 보기·듣기’를 누르세요.';
  $('revealBtn').textContent = '질문 보기·듣기';
  $('revealBtn').classList.remove('hidden');
  $('revealBtn').disabled = !!(task.type === 'listening' && task.allowListen);
  $('stopQuestionSpeech').classList.add('hidden');
  $('recordToggle').disabled = true;
  syncRecordButton();
  $('recordLabel').textContent = '질문이 사라진 뒤 녹음을 시작하세요.';
  $('recordTimer').textContent = '00:00';
  $('micHelp').classList.add('hidden');

  renderVisual(task, sameVisualGroup);
  renderListen(task);
  renderScenario(task);
  renderChecks(task);

  const old = state.records[task.id] || {};
  $('transcript').value = old.transcript || '';
  $('retryFlag').checked = !!old.retry;
  if (old.bottlenecks) {
    Object.entries(old.bottlenecks).forEach(([key, checked]) => {
      const input = document.querySelector(`#checks input[data-key="${key}"]`);
      if (input) input.checked = checked;
    });
  }
  currentDifficulty = old.difficulty || 0;
  currentOutcome = old.outcome || '';
  syncDifficultyUI();
  document.querySelectorAll('#outcome button').forEach(button => button.classList.toggle('selected', button.dataset.outcome === currentOutcome));
  $('taskPromptArea').classList.add('hidden');
  resetExpressionCapture(task);
  setTake('first');
  await loadTakes(task);
  $('revealRule').textContent = `현재 문제 표시시간: ${effectiveRevealSec(task)}초 · 다시보기 동일 · 1회 가능`;
  renderTaskNav();
  const scrollTarget = sameVisualGroup ? $('questionShell') : $('practiceArea');
  window.scrollTo({ top: Math.max(0, scrollTarget.offsetTop - 12), behavior: 'smooth' });
}

function renderScenario(task) {
  $('scenarioArea').innerHTML = task.type === 'situation' ? '<div class="notice">상황 설명은 질문과 함께 표시되고 설정 시간 뒤 가려집니다.</div>' : '';
}

function renderVisual(task, preserveExisting = false) {
  const area = $('visualArea');
  if (task.type !== 'visual') {
    area.innerHTML = '';
    area.dataset.visualGroup = '';
    return;
  }
  const groupId = task.visualGroupId || task.id;
  if (preserveExisting && area.dataset.visualGroup === groupId && area.firstElementChild) {
    const badge = area.querySelector('.visual-set-badge');
    if (badge) badge.textContent = `자료 세트 · 질문 ${Number(task.visualQuestionIndex) + 1}/${task.visualQuestionCount}`;
    return;
  }
  const badge = task.visualGroupId ? `<span class="visual-set-badge">자료 세트 · 질문 ${Number(task.visualQuestionIndex) + 1}/${task.visualQuestionCount}</span>` : '';
  area.dataset.visualGroup = groupId;
  area.innerHTML = `<div class="visual-wrap"><div class="visual-heading"><h3>${esc(task.visualTitle || task.title)}</h3>${badge}</div>${visualHTML(task)}</div>`;
}
function visualHTML(v){if(v.kind==='bar')return barSVG(v);if(v.kind==='line')return lineSVG(v);if(v.kind==='pie')return pieSVG(v);if(v.kind==='table')return `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr>${v.headers.map(h=>`<th style="border:1px solid #d0d5dd;padding:8px;background:#f2f4f7">${esc(h)}</th>`).join('')}</tr></thead><tbody>${v.rows.map(r=>`<tr>${r.map(c=>`<td style="border:1px solid #d0d5dd;padding:8px;text-align:center">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;if(v.kind==='photo')return `<figure class="photo-frame"><img class="photo-image" src="${esc(v.image||'')}" alt="${esc(v.title||'Photo description practice image')}" loading="lazy" decoding="async" /></figure>`;if(v.kind==='product')return `<div class="product-card"><div class="product-icon">${productIcon(v.title)}</div><div><h2 style="margin:0 0 8px">${esc(v.title)}</h2><div class="feature-list">${v.features.map(f=>`<div class="feature">✓ ${esc(f)}</div>`).join('')}</div></div></div>`;return ''}
function productIcon(title){if(title.includes('sensor'))return'📡';if(title.includes('cabin'))return'🚘';if(title.includes('app'))return'📱';if(title.includes('charger'))return'🔌';return'📊'}
function barSVG(v){const W=680,H=360,pL=58,pR=22,pT=48,pB=72,vals=[...v.values,...(v.values2||[])],max=Math.max(...vals)*1.16||1,plotW=W-pL-pR,plotH=H-pT-pB,groups=v.values.length,groupW=plotW/groups,dual=!!v.values2,bw=dual?groupW*.28:groupW*.5;let grid='',bars='';for(let g=0;g<=4;g++){const y=pT+plotH*g/4,val=Math.round(max*(1-g/4));grid+=`<line x1="${pL}" y1="${y}" x2="${W-pR}" y2="${y}" stroke="#e4e7ec"/><text x="${pL-8}" y="${y+4}" text-anchor="end" font-size="11" fill="#667085">${val}</text>`}v.values.forEach((val,i)=>{const center=pL+i*groupW+groupW/2;const draw=(x,value,color)=>{const h=plotH*value/max,y=pT+plotH-h;return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="6" fill="${color}"/><text x="${x+bw/2}" y="${y-6}" text-anchor="middle" font-size="11" fill="#344054">${value}${esc(v.unit||'')}</text>`};bars+=draw(center-(dual?bw+3:bw/2),val,'#3157d5');if(dual)bars+=draw(center+3,v.values2[i],'#f79009');bars+=`<text x="${center}" y="${H-pB+22}" text-anchor="middle" font-size="11" fill="#475467">${esc(v.labels[i])}</text>`});const legend=dual?`<g transform="translate(${pL} 20)"><rect width="13" height="13" rx="3" fill="#3157d5"/><text x="19" y="11" font-size="11" fill="#344054">${esc(v.series1||'Series 1')}</text><rect x="170" width="13" height="13" rx="3" fill="#f79009"/><text x="189" y="11" font-size="11" fill="#344054">${esc(v.series2||'Series 2')}</text></g>`:`<text x="${pL}" y="24" font-size="11" fill="#344054">Unit: ${esc(v.unit||'value')}</text>`;return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img">${legend}${grid}<line x1="${pL}" y1="${pT+plotH}" x2="${W-pR}" y2="${pT+plotH}" stroke="#98a2b3"/>${bars}</svg>`}
function lineSVG(v){const W=680,H=350,pL=58,pR=24,pT=52,pB=64,all=[...v.values,...(v.values2||[])],rawMin=Math.min(...all),rawMax=Math.max(...all),range=rawMax-rawMin||1,min=Math.max(0,rawMin-range*.18),max=rawMax+range*.18,plotW=W-pL-pR,plotH=H-pT-pB,step=plotW/(v.values.length-1);const yOf=val=>pT+plotH-(val-min)/(max-min||1)*plotH;const path=vals=>vals.map((val,i)=>`${i?'L':'M'} ${pL+i*step} ${yOf(val)}`).join(' ');let grid='';for(let g=0;g<=4;g++){const y=pT+plotH*g/4,val=Math.round(max-(max-min)*g/4);grid+=`<line x1="${pL}" y1="${y}" x2="${W-pR}" y2="${y}" stroke="#e4e7ec"/><text x="${pL-8}" y="${y+4}" text-anchor="end" font-size="11" fill="#667085">${val}</text>`}const dots=(vals,color)=>vals.map((val,i)=>`<circle cx="${pL+i*step}" cy="${yOf(val)}" r="4.5" fill="${color}"/><text x="${pL+i*step}" y="${yOf(val)-9}" text-anchor="middle" font-size="10" fill="#475467">${val}</text>`).join('');const labels=v.labels.map((lab,i)=>`<text x="${pL+i*step}" y="${H-pB+23}" text-anchor="middle" font-size="11" fill="#475467">${esc(lab)}</text>`).join('');const second=v.values2?`<path d="${path(v.values2)}" fill="none" stroke="#f79009" stroke-width="4"/>${dots(v.values2,'#f79009')}`:'';const legend=`<g transform="translate(${pL} 20)"><line x1="0" y1="6" x2="24" y2="6" stroke="#3157d5" stroke-width="4"/><text x="31" y="10" font-size="11" fill="#344054">${esc(v.series1||v.unit||'Series 1')}</text>${v.values2?`<line x1="190" y1="6" x2="214" y2="6" stroke="#f79009" stroke-width="4"/><text x="221" y="10" font-size="11" fill="#344054">${esc(v.series2||'Series 2')}</text>`:''}</g>`;return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img">${legend}${grid}<line x1="${pL}" y1="${pT+plotH}" x2="${W-pR}" y2="${pT+plotH}" stroke="#98a2b3"/><path d="${path(v.values)}" fill="none" stroke="#3157d5" stroke-width="4"/>${dots(v.values,'#3157d5')}${second}${labels}</svg>`}
function pieSVG(v){const total=v.values.reduce((a,b)=>a+b,0),colors=['#3157d5','#7f56d9','#f79009','#12b76a','#f04438'];let acc=0,circles='';v.values.forEach((val,i)=>{const pct=val/total*100;circles+=`<circle r="70" cx="125" cy="125" fill="transparent" stroke="${colors[i%colors.length]}" stroke-width="70" stroke-dasharray="${pct} ${100-pct}" stroke-dashoffset="${-acc}" transform="rotate(-90 125 125)" pathLength="100"/>`;acc+=pct});const legend=v.labels.map((l,i)=>`<g transform="translate(275 ${52+i*42})"><rect width="16" height="16" rx="4" fill="${colors[i%colors.length]}"/><text x="26" y="13" font-size="13" fill="#344054">${esc(l)}: ${v.values[i]}${esc(v.unit||'')}</text></g>`).join('');return `<svg viewBox="0 0 620 260" class="chart-svg">${circles}<circle cx="125" cy="125" r="36" fill="#fff"/>${legend}</svg>`}
function renderListen(task) {
  const area = $('listenArea');
  if (task.type !== 'listening') {
    area.innerHTML = '';
    return;
  }
  if (!task.allowListen) {
    area.innerHTML = '<div class="listen-card"><b>앞서 들은 지문을 바탕으로 답하세요.</b><div class="listen-status">후속 질문에서는 지문을 다시 재생하지 않습니다.</div></div>';
    return;
  }
  area.innerHTML = `
    <div class="listen-card">
      <b>듣기 요약 지문</b>
      <div class="listen-controls">
        <button class="btn secondary" id="passagePlay" type="button">▶ 지문 듣기</button>
        <button class="btn secondary" id="passagePause" type="button" disabled>⏸ 일시정지</button>
        <button class="btn secondary" id="passageStop" type="button" disabled>■ 중지</button>
        <button class="btn secondary" id="passageRestart" type="button">↺ 처음부터</button>
      </div>
      <div class="listen-status" id="listenStatus" role="status" aria-live="polite">0/${task.maxPlays || 2}회 재생</div>
      <button class="btn secondary small hidden" id="showPassage" type="button">지문 확인</button>
      <div class="notice hidden" id="passageText"></div>
    </div>`;
  $('passagePlay').addEventListener('click', () => playPassage(task, false));
  $('passagePause').addEventListener('click', pausePassage);
  $('passageStop').addEventListener('click', () => stopPassage(true));
  $('passageRestart').addEventListener('click', () => playPassage(task, true));
  $('showPassage').addEventListener('click', () => {
    $('passageText').textContent = task.passage;
    $('passageText').classList.toggle('hidden');
  });
  syncPassageControls();
}

function voiceKey(voice) {
  return voice?.voiceURI || voice?.name || '';
}

function englishVoices() {
  return voicesCache.filter(voice => /^en[-_]/i.test(voice.lang));
}

function fallbackVoice() {
  const voices = englishVoices();
  return voices.find(voice => voice.lang === 'en-US' && /natural|neural|enhanced/i.test(voice.name))
    || voices.find(voice => voice.lang === 'en-US')
    || voices[0]
    || null;
}

function selectedVoice(kind) {
  const saved = kind === 'passage' ? state.settings.passageVoice : state.settings.questionVoice;
  return voicesCache.find(voice => voiceKey(voice) === saved) || fallbackVoice();
}

function populateVoiceSelect(selectId, settingKey) {
  const select = $(selectId);
  const voices = englishVoices();
  const saved = state.settings[settingKey];
  select.innerHTML = voices.length
    ? voices.map(voice => `<option value="${esc(voiceKey(voice))}">${esc(voice.name)} (${esc(voice.lang)})</option>`).join('')
    : '<option value="">기본 영어 음성</option>';
  const fallback = voices.find(voice => voiceKey(voice) === saved) || fallbackVoice();
  if (fallback) {
    select.value = voiceKey(fallback);
    if (!saved) state.settings[settingKey] = voiceKey(fallback);
  }
}

function refreshVoices() {
  voicesCache = speechSynthesis?.getVoices?.() || [];
  populateVoiceSelect('questionVoice', 'questionVoice');
  populateVoiceSelect('passageVoice', 'passageVoice');
  const count = englishVoices().length;
  $('voiceStatus').textContent = count ? `사용 가능한 영어 음성 ${count}개 · 샘플을 듣고 선택하세요.` : '영어 음성 목록을 기다리는 중입니다.';
}

async function ensureVoices() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    refreshVoices();
    if (englishVoices().length) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function speakText(text, kind, onEnd = () => {}, onStart = () => {}) {
  if (!('speechSynthesis' in window)) {
    onEnd();
    return Promise.resolve();
  }

  stopAllSpeech();
  const requestToken = ++speechRequestToken;
  activeSpeechKind = kind;
  activeUtterance = null;

  if (kind === 'passage') {
    passagePreparing = true;
    passagePaused = false;
    syncPassageControls();
  }

  return new Promise(async resolve => {
    await ensureVoices();
    if (requestToken !== speechRequestToken || activeSpeechKind !== kind) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = Number(state.settings.ttsRate) || 0.95;
    utterance.voice = selectedVoice(kind);
    activeUtterance = utterance;

    if (kind === 'question') $('stopQuestionSpeech').classList.remove('hidden');

    const finish = () => {
      if (requestToken !== speechRequestToken) {
        resolve();
        return;
      }
      if (activeUtterance === utterance) activeUtterance = null;
      if (activeSpeechKind === kind) activeSpeechKind = '';
      if (kind === 'passage') {
        passagePreparing = false;
        passagePaused = false;
        syncPassageControls();
      }
      if (kind === 'question') $('stopQuestionSpeech').classList.add('hidden');
      onEnd();
      resolve();
    };

    utterance.onstart = () => {
      if (requestToken !== speechRequestToken) return;
      if (kind === 'passage') {
        passagePreparing = false;
        passagePaused = false;
        syncPassageControls();
      }
      onStart();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    try {
      speechSynthesis.speak(utterance);
      if (kind === 'passage') syncPassageControls();
    } catch (_) {
      finish();
    }
  });
}

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = refreshVoices;
  refreshVoices();
}

function syncPassageControls() {
  const play = $('passagePlay');
  if (!play) return;

  const task = currentTasks[currentTaskIndex];
  const max = task?.maxPlays || 2;
  const passageActive = activeSpeechKind === 'passage';
  const speakingPassage = passageActive && !!activeUtterance && !passagePaused && !passagePreparing;
  const canStartNew = listenPlays < max;

  if (passagePaused) {
    play.textContent = '▶ 이어 듣기';
    play.disabled = false;
  } else if (passagePreparing) {
    play.textContent = '음성 준비 중…';
    play.disabled = true;
  } else if (speakingPassage) {
    play.textContent = '재생 중';
    play.disabled = true;
  } else {
    play.textContent = '▶ 지문 듣기';
    play.disabled = !canStartNew;
  }

  $('passagePause').disabled = !speakingPassage;
  $('passagePause').setAttribute('aria-pressed', passagePaused ? 'true' : 'false');
  $('passageStop').disabled = !passageActive;
  $('passageRestart').disabled = passagePreparing || !canStartNew;

  if ($('listenStatus')) {
    const suffix = passagePreparing
      ? ' · 음성 준비 중'
      : passagePaused
        ? ' · 일시정지'
        : speakingPassage
          ? ' · 재생 중'
          : passageCompleted
            ? ' · 재생 완료'
            : passageInterrupted
              ? ' · 중지됨'
              : '';
    $('listenStatus').textContent = `${listenPlays}/${max}회 재생${suffix}`;
  }
}

function stopPassage(manual = false) {
  if (activeSpeechKind !== 'passage') return;
  if (manual && !passageCompleted) passageInterrupted = true;
  speechRequestToken += 1;
  try { speechSynthesis.cancel(); } catch (_) {}
  activeUtterance = null;
  activeSpeechKind = '';
  passagePaused = false;
  passagePreparing = false;
  syncPassageControls();
}

function pausePassage() {
  if (activeSpeechKind !== 'passage' || !activeUtterance || passagePreparing || passagePaused) return;
  try {
    speechSynthesis.pause();
    passagePaused = true;
  } catch (_) {}
  syncPassageControls();
}

function resumePassage() {
  if (activeSpeechKind !== 'passage' || !passagePaused) return;
  try {
    speechSynthesis.resume();
    passagePaused = false;
  } catch (_) {}
  syncPassageControls();
}

function playPassage(task, restart = false) {
  const max = task.maxPlays || 2;

  if (passagePaused && !restart) {
    resumePassage();
    return;
  }

  if (passagePreparing) return;

  if (activeSpeechKind === 'passage') {
    if (!restart) return;
    if (listenPlays >= max) {
      toast('이 지문의 재생 가능 횟수를 모두 사용했습니다.');
      return;
    }
    stopPassage(true);
  }

  if (listenPlays >= max) {
    toast('이 지문의 재생 가능 횟수를 모두 사용했습니다.');
    return;
  }

  listenPlays += 1;
  passageCompleted = false;
  passageInterrupted = false;
  passagePreparing = true;
  syncPassageControls();

  speakText(
    task.passage,
    'passage',
    () => {
      if (passageInterrupted) {
        syncPassageControls();
        return;
      }
      passageCompleted = true;
      passagePaused = false;
      passagePreparing = false;
      $('revealBtn').disabled = false;
      syncPassageControls();
    },
    () => syncPassageControls()
  );
}

function clearReveal() {
  if (revealInterval) {
    clearInterval(revealInterval);
    revealInterval = null;
  }
}

function revealQuestion(isReplay = false) {
  const task = currentTasks[currentTaskIndex];
  const shown = fullQuestion(task);
  const seconds = effectiveRevealSec(task);
  questionSeen = true;
  if (isReplay) replayUsed = true;
  $('questionDisplay').className = 'question-text';
  $('questionDisplay').textContent = shown;
  $('revealBtn').disabled = true;
  if (mediaRecorder?.state !== 'recording') $('recordToggle').disabled = true;
  if (!isReplay && state.settings.speakQuestion) speakText(shown.replace(/\n/g, ' '), 'question');
  let left = seconds;
  $('countdown').textContent = `${left}초`;
  $('countdown').classList.remove('hidden');
  clearReveal();
  revealInterval = setInterval(() => {
    left -= 1;
    $('countdown').textContent = `${left}초`;
    if (left <= 0) hideQuestion();
  }, 1000);
}

function hideQuestion() {
  clearReveal();
  if (activeSpeechKind === 'question') stopAllSpeech();
  $('questionDisplay').className = 'question-hidden';
  $('questionDisplay').textContent = '질문이 가려졌습니다. 답을 미리 쓰지 말고 녹음을 시작하세요.';
  $('countdown').classList.add('hidden');
  questionHiddenAt = performance.now();
  if (mediaRecorder?.state !== 'recording') $('recordToggle').disabled = false;
  syncRecordingTargetHint(true);
  if (!replayUsed) {
    $('revealBtn').textContent = '질문 1회 다시 보기';
    $('revealBtn').disabled = false;
    $('revealBtn').classList.remove('hidden');
  } else {
    $('revealBtn').classList.add('hidden');
  }
}

$('revealBtn').addEventListener('click', () => revealQuestion(questionSeen));
$('stopQuestionSpeech').addEventListener('click', () => {
  if (activeSpeechKind === 'question') stopAllSpeech();
});

function chooseMime() {
  if (!window.MediaRecorder) return null;
  const types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  for (const type of types) {
    try {
      if (!MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type)) return type;
    } catch (_) {}
  }
  return '';
}

function stopLiveResources() {
  if (recordInterval) {
    clearInterval(recordInterval);
    recordInterval = null;
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function syncRecordButton() {
  const recording = mediaRecorder?.state === 'recording';
  const button = $('recordToggle');
  button.textContent = recording ? '■ 녹음 종료' : '● 녹음 시작';
  button.classList.toggle('danger', !recording);
  button.classList.toggle('secondary', recording);
}

async function startRecording() {
  const task = currentTasks[currentTaskIndex];
  if (!window.isSecureContext && location.protocol !== 'localhost:') return showMicError({ name: 'SecurityError' });
  if (!navigator.mediaDevices?.getUserMedia) return showMicError({ name: 'UnsupportedError' });
  if (!window.MediaRecorder) return showMicError({ name: 'MediaRecorderUnsupported' });
  if (clipCache[recordingTarget] && !confirm(`${recordingTarget === 'first' ? '1차 답변' : '재도전'} 녹음을 덮어쓸까요?`)) return;
  stopAllSpeech();
  try {
    $('recordLabel').textContent = '마이크 준비 중…';
    $('recordToggle').disabled = true;
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    currentMime = chooseMime();
    currentExt = extForMime(currentMime);
    mediaRecorder = new MediaRecorder(stream, currentMime ? { mimeType: currentMime } : undefined);
    const chunks = [];
    mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    mediaRecorder.onerror = event => showMicError(event.error || event);
    mediaRecorder.onstop = async () => {
      const duration = (performance.now() - recordStartAt) / 1000;
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || currentMime || 'audio/webm' });
      stopLiveResources();
      const createdAt = new Date().toISOString();
      const takeData = { duration, mime: blob.type, createdAt };
      const key = `${task.id}:${recordingTarget}`;
      await dbPut({
        key,
        taskId: task.id,
        source: task.source,
        sessionId: currentSession.id,
        take: recordingTarget,
        title: task.title,
        blob,
        mime: blob.type,
        ext: extForMime(blob.type),
        metrics: takeData,
        createdAt
      });
      const record = ensureRecord(task);
      record.takes = record.takes || {};
      record.takes[recordingTarget] = takeData;
      record.savedAt = createdAt;
      markSessionStarted();
      saveState();
      await loadTakes(task);
      $('recordLabel').textContent = '녹음이 기기에 저장되었습니다.';
      $('recordToggle').disabled = false;
      syncRecordButton();
      if (task.type === 'listening' && $('showPassage')) $('showPassage').classList.remove('hidden');
      renderStorageStats();
    };
    mediaRecorder.start(250);
    recordStartAt = performance.now();
    recordInterval = setInterval(() => { $('recordTimer').textContent = fmt((performance.now() - recordStartAt) / 1000); }, 250);
    $('recordLabel').innerHTML = '<span class="pulse"></span>녹음 중';
    $('recordToggle').disabled = false;
    syncRecordButton();
  } catch (error) {
    stopLiveResources();
    $('recordToggle').disabled = false;
    syncRecordButton();
    showMicError(error);
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
  mediaRecorder.stop();
  if (recordInterval) {
    clearInterval(recordInterval);
    recordInterval = null;
  }
  $('recordLabel').textContent = '녹음을 저장하는 중…';
  $('recordToggle').disabled = true;
  syncRecordButton();
}

function toggleRecording() {
  if (mediaRecorder?.state === 'recording') stopRecording();
  else startRecording();
}

function showMicError(error) {
  const name = error?.name || 'UnknownError';
  const local = location.protocol === 'file:' || location.protocol === 'content:';
  let message;
  if (local || name === 'SecurityError') message = '<b>HTTPS 주소가 필요합니다.</b><br>다운로드 파일로 직접 열지 말고 GitHub Pages 주소로 접속하세요.';
  else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') message = '<b>마이크 권한이 거부되었습니다.</b><br>사이트 권한에서 마이크를 허용한 뒤 새로고침하세요.';
  else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') message = '<b>사용 가능한 마이크를 찾지 못했습니다.</b><br>입력 장치 연결을 확인하세요.';
  else if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') message = '<b>마이크를 열 수 없습니다.</b><br>다른 앱이 마이크를 사용 중인지 확인하세요.';
  else if (name === 'MediaRecorderUnsupported' || name === 'UnsupportedError' || name === 'NotSupportedError' || name === 'TypeError') message = '<b>이 브라우저의 녹음 형식을 지원하지 않습니다.</b><br>최신 Chrome 또는 Safari에서 다시 시도하세요.';
  else message = `<b>녹음을 시작하지 못했습니다.</b><br>오류: ${esc(name)}`;
  $('micHelp').className = 'notice errornotice';
  $('micHelp').innerHTML = message;
  $('recordLabel').textContent = '마이크를 시작하지 못했습니다.';
}

$('recordToggle').addEventListener('click', toggleRecording);

function setTake(which) {
  recordingTarget = which;
  $('takeFirst').classList.toggle('selected', which === 'first');
  $('takeRetry').classList.toggle('selected', which === 'retry');
  syncRecordingTargetHint(questionSeen && !$('recordToggle').disabled);
}

function syncRecordingTargetHint(ready = false) {
  if (mediaRecorder?.state === 'recording') return;
  const target = recordingTarget === 'first' ? '1차 녹음' : '재도전 녹음';
  $('recordLabel').textContent = ready
    ? `저장 위치: ${target} · 녹음 시작을 누르세요.`
    : `저장 위치: ${target} · 질문 확인 후 녹음을 시작하세요.`;
}
$('takeFirst').addEventListener('click', () => setTake('first'));
$('takeRetry').addEventListener('click', () => setTake('retry'));

function revokeClipUrls() {
  for (const take of ['first', 'retry']) {
    if (clipUrls[take]) URL.revokeObjectURL(clipUrls[take]);
    clipUrls[take] = null;
    clipCache[take] = null;
  }
}

async function loadTakes(task) {
  revokeClipUrls();
  for (const take of ['first', 'retry']) {
    const clip = await dbGet(`${task.id}:${take}`);
    clipCache[take] = clip || null;
    if (clip) clipUrls[take] = URL.createObjectURL(clip.blob);
  }
  renderSavedTakes();
}

function renderSavedTakes() {
  const root = $('savedTakes');
  const cards = [];
  for (const take of ['first', 'retry']) {
    const clip = clipCache[take];
    if (!clip) continue;
    const label = take === 'first' ? '1차 답변' : '재도전';
    cards.push(`
      <div class="take-card">
        <div class="take-head">
          <div><h4>${label}</h4><div class="take-meta">${new Date(clip.createdAt).toLocaleString()} · ${esc(clip.ext || extForMime(clip.mime))}</div></div>
          <div class="btnrow"><button class="btn secondary small" data-download="${take}" type="button">다운로드</button><button class="btn danger small" data-delete="${take}" type="button">삭제</button></div>
        </div>
        <audio controls src="${clipUrls[take]}"></audio>
      </div>`);
  }
  root.innerHTML = cards.join('') || '<div class="listen-status">아직 저장된 녹음이 없습니다.</div>';
  root.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => downloadTake(button.dataset.download)));
  root.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteTake(button.dataset.delete)));
}

function downloadTake(take) {
  const clip = clipCache[take];
  if (!clip) return;
  const link = document.createElement('a');
  link.href = clipUrls[take];
  link.download = `${currentTasks[currentTaskIndex].id}_${take}.${clip.ext || extForMime(clip.mime)}`;
  link.click();
}

async function deleteTake(take) {
  if (!confirm(`${take === 'first' ? '1차 답변' : '재도전'} 녹음을 삭제할까요?`)) return;
  const task = currentTasks[currentTaskIndex];
  await dbDelete(`${task.id}:${take}`);
  const record = state.records[task.id];
  if (record?.takes) delete record.takes[take];
  saveState();
  await loadTakes(task);
  renderStorageStats();
}

function collectBottlenecks() {
  return Object.fromEntries([...document.querySelectorAll('#checks input')].map(input => [input.dataset.key, input.checked]));
}

function ensureRecord(task) {
  if (!state.records[task.id]) {
    state.records[task.id] = {
      id: task.id,
      sessionId: currentSession.id,
      week: currentSession.week,
      label: currentSession.label,
      title: task.title,
      type: taskTypeName(task),
      question: fullQuestion(task),
      source: task.source,
      takes: {},
      savedAt: new Date().toISOString()
    };
  }
  return state.records[task.id];
}

function saveDraft() {
  if (!currentSession || !currentTasks.length) return false;
  const task = currentTasks[currentTaskIndex];
  const record = ensureRecord(task);
  Object.assign(record, {
    sessionId: currentSession.id,
    week: currentSession.week,
    label: currentSession.label,
    title: task.title,
    type: taskTypeName(task),
    question: fullQuestion(task),
    source: task.source,
    transcript: $('transcript').value.trim(),
    replayUsed,
    listenPlays,
    savedAt: new Date().toISOString()
  });
  markSessionStarted();
  saveState();
  renderTaskNav();
  return true;
}

function saveCurrent(showMessage = true) {
  if (!currentOutcome) {
    if (showMessage) alert('실패·부분 성공·성공 중 하나를 선택해 주세요.');
    return false;
  }
  const task = currentTasks[currentTaskIndex];
  const record = ensureRecord(task);
  Object.assign(record, {
    sessionId: currentSession.id,
    week: currentSession.week,
    label: currentSession.label,
    title: task.title,
    type: taskTypeName(task),
    question: fullQuestion(task),
    source: task.source,
    transcript: $('transcript').value.trim(),
    bottlenecks: collectBottlenecks(),
    difficulty: currentDifficulty,
    outcome: currentOutcome,
    retry: $('retryFlag').checked,
    replayUsed,
    listenPlays,
    savedAt: new Date().toISOString()
  });
  markSessionStarted();
  saveState();
  renderTaskNav();
  if (showMessage) toast('평가가 저장되었습니다.');
  return true;
}

function saveBeforeNavigate() {
  if (stage === 'evaluation' && currentOutcome) saveCurrent(false);
  else saveDraft();
}

function showEvaluation() {
  if (mediaRecorder?.state === 'recording') return alert('녹음을 먼저 종료해 주세요.');
  const hasAudio = !!clipCache.first || !!clipCache.retry;
  const hasTranscript = !!$('transcript').value.trim();
  if (!hasAudio && !hasTranscript && !confirm('녹음과 받아쓰기가 모두 비어 있습니다. 평가 화면으로 넘어갈까요?')) return;
  saveDraft();
  stage = 'evaluation';
  $('selfDiagnosisDetails').open = false;
  $('expressionDetails').open = false;
  $('answerStage').classList.add('hidden');
  $('evaluationStage').classList.remove('hidden');
  const task = currentTasks[currentTaskIndex];
  $('evaluationTitle').textContent = `${currentTaskIndex + 1}/${currentTasks.length} · 오늘 답변 돌아보기`;
  $('evaluationQuestion').textContent = fullQuestion(task);
  $('evaluationTranscript').textContent = $('transcript').value.trim() ? `받아쓰기: ${$('transcript').value.trim()}` : '받아쓰기 없음';
  window.scrollTo({ top: Math.max(0, $('taskCard').offsetTop - 8), behavior: 'smooth' });
}

function showAnswer() {
  stage = 'answer';
  $('evaluationStage').classList.add('hidden');
  $('answerStage').classList.remove('hidden');
  window.scrollTo({ top: Math.max(0, $('taskCard').offsetTop - 8), behavior: 'smooth' });
}

$('goEvaluation').addEventListener('click', showEvaluation);
$('backToAnswer').addEventListener('click', showAnswer);
$('nextTask').addEventListener('click', async () => {
  if (!saveCurrent(true)) return;
  if (currentTaskIndex < currentTasks.length - 1) await loadTask(currentTaskIndex + 1);
  else finishSession();
});

function finishSession() {
  stopAllSpeech();
  stopLiveResources();
  $('taskCard').classList.add('hidden');
  $('sessionEnd').classList.remove('hidden');
  updateSessionProgressUI();
  const canStartBooster = !!(currentSession?.mock5 && !boosterMode && currentBoosterTasks.length);
  $('startBooster')?.classList.toggle('hidden', !canStartBooster);
  if ($('sessionEndTitle')) $('sessionEndTitle').textContent = boosterMode ? '약점 보강 완료' : '회차 완료';
  if ($('sessionEndText')) $('sessionEndText').textContent = canStartBooster
    ? '실전 구간이 끝났습니다. 회차를 완료하거나 선택 약점 보강을 이어갈 수 있습니다.'
    : '받아쓴 답변을 모아 오늘 회차 종합 자료를 만들 수 있습니다.';
  window.scrollTo({ top: Math.max(0, $('sessionEnd').offsetTop - 20), behavior: 'smooth' });
}

$('startBooster')?.addEventListener('click', async () => {
  if (!currentBoosterTasks.length) return;
  boosterMode = true;
  currentTasks = currentBoosterTasks;
  currentTaskIndex = 0;
  $('sessionEnd').classList.add('hidden');
  $('taskCard').classList.remove('hidden');
  $('sessionPromptArea').classList.add('hidden');
  updateSessionChips();
  await loadTask(0);
});

$('restartSession').addEventListener('click', async () => {
  $('sessionEnd').classList.add('hidden');
  $('taskCard').classList.remove('hidden');
  await loadTask(0);
});

$('completeSession').addEventListener('click', () => {
  state.completed[currentSession.id] = true;
  delete state.startedSessions[currentSession.id];
  state.sessionHistory[currentSession.id] = new Date().toISOString();
  saveState();
  setTab('course');
});

document.querySelectorAll('#rating button').forEach(button => {
  button.addEventListener('click', () => {
    currentDifficulty = Number(button.dataset.rate);
    syncDifficultyUI();
  });
});

document.querySelectorAll('#outcome button').forEach(button => {
  button.addEventListener('click', () => {
    currentOutcome = button.dataset.outcome;
    document.querySelectorAll('#outcome button').forEach(item => item.classList.toggle('selected', item === button));
    });
});

function outcomeLabel(value) {
  return { fail: '실패', partial: '부분 성공', success: '성공' }[value] || '미선택';
}

function difficultyLabel(record) {
  if (record?.difficulty) return `${record.difficulty} / 5 · ${DIFFICULTY_LABELS[record.difficulty]}`;
  if (record?.rating) return `이전 버전 답변 체감 ${record.rating} / 5 · 체감 난이도로 해석하지 않음`;
  return '미선택';
}

function takeSummary(record, take) {
  const data = record?.takes?.[take];
  return data ? `있음 · ${fmt(data.duration)}` : '없음 · 해당 없음';
}

function absoluteAssetUrl(relativePath = '') {
  if (!relativePath) return '';
  const base = location.protocol === 'http:' || location.protocol === 'https:'
    ? location.href
    : 'https://nalkongchi.github.io/Spa/';
  try { return new URL(relativePath, base).href; }
  catch (_) { return relativePath; }
}

function referenceMaterialText(task) {
  if (task.type === 'interview') return '별도의 참고자료가 없는 인터뷰 질문입니다.';
  if (task.type === 'situation') {
    return `상황 원문:\n${task.scenario}\n\n학습자가 첫 행동, 이유, 의사소통과 후속 조치를 상황에 맞게 설명했는지 확인하세요.`;
  }
  if (task.type === 'listening') {
    return `듣기 지문 원문:\n${task.passage}\n\n이 원문은 학습자의 요약 정확도를 평가하기 위한 자료입니다. 재답변 전에 지문 전체를 모범 답안처럼 그대로 제시하지 마세요.`;
  }
  if (task.type === 'visual' && task.kind === 'photo') {
    return `자료 유형: 사진\n자료 제목: ${task.visualTitle || task.title}\n이미지 주소: ${absoluteAssetUrl(task.image)}\n같은 사진 자료의 현재 질문: ${Number(task.visualQuestionIndex ?? task.questionIndex ?? 0) + 1} / ${task.visualQuestionCount || 1}\n시각자료 그룹 ID: ${task.visualGroupId || '없음'}\n\n이미지를 실제로 확인할 수 있을 때만 사진 내용과 답변을 비교하세요. 이미지에 접근할 수 없으면 영어 표현과 답변 구조만 평가하세요.`;
  }
  if (task.type === 'visual' && task.kind === 'product') {
    const features = (task.features || []).map(value => `- ${value}`).join('\n') || '- 제공된 특징 없음';
    return `자료 유형: 제품 이미지\n자료 제목: ${task.visualTitle || task.title}\n제공된 특징:\n${features}\n\n학습자가 제품의 특징, 장점과 가능한 우려 사항을 자료에 맞게 설명했는지 확인하세요.`;
  }
  if (task.type === 'visual' && task.kind === 'table') {
    const headers = (task.headers || []).join(' | ');
    const rows = (task.rows || []).map(row => `- ${row.join(' | ')}`).join('\n');
    return `자료 유형: 표\n자료 제목: ${task.visualTitle || task.title}\n열 제목: ${headers}\n행 데이터:\n${rows}`;
  }
  if (task.type === 'visual') {
    const firstName = task.series1 || '기본 계열';
    const first = (task.labels || []).map((label, index) => `- ${label}: ${task.values?.[index] ?? '-'}${task.unit || ''}`).join('\n');
    const second = task.values2
      ? `\n\n${task.series2 || '두 번째 계열'}:\n${(task.labels || []).map((label, index) => `- ${label}: ${task.values2?.[index] ?? '-'}${task.unit || ''}`).join('\n')}`
      : '';
    return `자료 유형: ${task.kind || '시각자료'}\n자료 제목: ${task.visualTitle || task.title}\n단위: ${task.unit || '없음'}\n\n${firstName}:\n${first}${second}`;
  }
  return '별도의 참고자료가 없습니다.';
}

function compactReferenceText(task) {
  if (task.type === 'situation') return `상황: ${task.scenario}`;
  if (task.type === 'listening') return `듣기 자료: ${task.visualTitle || task.title}`;
  if (task.type === 'visual' && task.kind === 'photo') return `사진: ${task.visualTitle || task.title} · ${absoluteAssetUrl(task.image)}`;
  if (task.type === 'visual' && task.kind === 'table') return `표: ${(task.rows || []).map(row => row.join('/')).join('; ')}`;
  if (task.type === 'visual' && task.kind === 'product') return `제품 특징: ${(task.features || []).join(', ')}`;
  if (task.type === 'visual') {
    const first = (task.labels || []).map((label, index) => `${label} ${task.values?.[index]}${task.unit || ''}`).join(', ');
    const second = task.values2 ? ` / ${task.series2 || '계열 2'}: ${(task.labels || []).map((label, index) => `${label} ${task.values2?.[index]}${task.unit || ''}`).join(', ')}` : '';
    return `자료 핵심: ${task.series1 ? `${task.series1}: ` : ''}${first}${second}`;
  }
  return '';
}

function expressionSuggestionsText(task) {
  const suggestions = (task.expressions || []).map(item => `- ${item.text} · ${item.cue || item.category || '참고 표현'}`);
  return suggestions.length ? suggestions.join('\n') : '- 앱에서 별도로 제공한 표현 후보 없음';
}

function taskPromptText(task, record) {
  const visualInfo = task.visualGroupId
    ? `\n같은 시각자료 세트: ${Number(task.visualQuestionIndex ?? task.questionIndex ?? 0) + 1} / ${task.visualQuestionCount || 1}\n시각자료 그룹 ID: ${task.visualGroupId}`
    : '';
  const transcript = record.transcript || '(받아쓰기 없음 — 녹음 파일도 함께 전달되지 않았으므로 답변 내용을 평가할 수 없습니다.)';
  const transcriptStatus = record.transcript ? '사용자가 입력한 받아쓰기 또는 핵심 메모' : '받아쓰기 없음';
  const phaseLabel = boosterMode ? '선택 약점 보강' : currentSession.mock5 ? '실전 모의고사' : '일반 훈련';
  return `[SPA_APP_PACKET_V1]\n\n[전달 유형]\n단일 답변 피드백\n\n[처리 지침]\n이 채팅방에 먼저 입력된 SPA 고정 운영 지침을 적용하세요.\n이 질문은 웹앱에서 이미 제시되었고 학습자가 답변까지 완료했습니다.\n질문을 다시 출제하지 말고 즉시 답변을 분석하세요.\n피드백 후 같은 질문에 한 번 재답변하도록 요청하고 기다리세요.\n새로운 문제나 별도의 꼬리 질문은 임의로 만들지 마세요.\n\n──────────────────────────────\n[회차 정보]\n──────────────────────────────\n\n주차: Week ${currentSession.week}\n회차: ${currentSession.label}\n회차 주제: ${currentSession.theme}\n회차 훈련 초점: ${currentSession.focus}\n회차 ID: ${currentSession.id}\n훈련 구간: ${phaseLabel}\n\n현재 문제: ${currentTaskIndex + 1} / ${currentTasks.length}\n문제 ID: ${task.id}\n문제 출처 ID: ${task.source || task.id}\n문제 유형: ${taskTypeName(task)}\n문제 제목: ${task.title}${visualInfo}\n\n──────────────────────────────\n[현재 질문]\n──────────────────────────────\n\n${fullQuestion(task)}\n\n──────────────────────────────\n[문제 참고자료]\n──────────────────────────────\n\n${referenceMaterialText(task)}\n\n──────────────────────────────\n[학습자가 실제로 말한 답변]\n──────────────────────────────\n\n${transcript}\n\n받아쓰기 상태: ${transcriptStatus}\n\n받아쓰기는 학습자가 실제로 말한 내용을 가능한 한 그대로 옮긴 자료 또는 핵심 메모입니다. 대소문자와 문장부호보다 발화 내용과 문장 구성을 우선해서 평가하세요.\n\n──────────────────────────────\n[녹음 기록]\n──────────────────────────────\n\n1차 녹음: ${takeSummary(record, 'first')}\n재도전 녹음: ${takeSummary(record, 'retry')}\n\n녹음 파일 자체는 이 프롬프트에 첨부되지 않았습니다. 녹음이 있다는 정보만으로 실제 발음, 억양, 말하기 속도와 침묵 시간을 들은 것처럼 평가하지 마세요.\n\n──────────────────────────────\n[수행 결과]\n──────────────────────────────\n\n전체 수행 결과: ${outcomeLabel(record.outcome)}\n체감 난이도: ${difficultyLabel(record)}\n질문 다시보기: ${record.replayUsed ? '사용' : '미사용'}\n듣기 지문 재생: ${record.listenPlays || 0}회\n기록에서 다시 확인: ${record.retry ? '예' : '아니오'}\n\n체감 난이도는 답변 품질 점수가 아닙니다. 1은 매우 쉬움, 5는 매우 어려움을 뜻합니다.\n\n──────────────────────────────\n[학습자 자가진단]\n──────────────────────────────\n\n선택한 공통 병목:\n${selectedBottleneckText(task, record, 'common')}\n\n선택한 문제 유형별 병목:\n${selectedBottleneckText(task, record, 'typeSpecific')}${legacySelfAssessmentText(record)}\n\n선택하지 않은 항목은 문제가 없었다는 뜻이 아니라, 학습자가 이번 답변에서 직접 병목으로 선택하지 않았다는 뜻입니다. 음성으로만 확인할 수 있는 내용은 학습자의 체감 기록으로만 참고하세요.\n\n──────────────────────────────\n[앱 제공 표현 후보]\n──────────────────────────────\n\n${expressionSuggestionsText(task)}\n\n위 표현은 참고 후보입니다. 질문과 학습자의 실제 답변에 맞는 경우에만 사용하고 모든 표현을 억지로 넣지 마세요.\n\n──────────────────────────────\n[이번 요청]\n──────────────────────────────\n\n고정 운영 지침의 ‘단일 답변 피드백’ 방식에 따라 다음을 수행하세요.\n\n1. 질문에 직접 답했는지와 핵심 의미 전달 여부 확인\n2. 실제로 잘한 점 1~2개\n3. A·B·C로 구분한 핵심 교정 1~3개\n4. 학습자의 생각과 사실을 유지한 최소 수정본\n5. 필요한 경우에만 짧은 확장본\n6. 표현 카드 후보 1~3개\n7. 같은 질문에 재답변하도록 요청하고 대기\n\n다음 문제는 웹앱에서 진행하므로 새로운 질문을 출제하지 마세요.`;
}

function countSelectedBottlenecks(items, group) {
  const counts = new Map();
  items.forEach(({ task, record }) => {
    selectedBottleneckEntries(task, record, group).forEach(([, label]) => counts.set(label, (counts.get(label) || 0) + 1));
  });
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return sorted.length ? sorted.map(([label, count]) => `- ${label}: ${count}회`).join('\n') : '- 선택 기록 없음';
}

function sessionPromptText() {
  const allTasks = sessionTaskUniverse();
  const items = allTasks.map(task => ({ task, record: state.records[task.id] })).filter(({ record }) => record && (record.transcript || record.takes?.first || record.takes?.retry || record.outcome));
  const transcribed = items.filter(({ record }) => !!record.transcript).length;
  const firstTakes = items.filter(({ record }) => !!record.takes?.first).length;
  const retryTakes = items.filter(({ record }) => !!record.takes?.retry).length;
  const recordsText = items.length ? items.map(({ task, record }, index) => {
    const reference = compactReferenceText(task);
    return `[답변 ${index + 1}]\n\n문제 ID: ${task.id}\n문제 유형: ${taskTypeName(task)}\n문제 제목: ${task.title}\n질문:\n${fullQuestion(task)}${reference ? `\n${reference}` : ''}\n\n학습자 답변:\n${record.transcript || '(받아쓰기 없음)'}\n\n받아쓰기 상태: ${record.transcript ? '사용자가 입력한 받아쓰기 또는 핵심 메모' : '받아쓰기 없음'}\n1차 녹음: ${takeSummary(record, 'first')}\n재도전 녹음: ${takeSummary(record, 'retry')}\n수행 결과: ${outcomeLabel(record.outcome)}\n체감 난이도: ${difficultyLabel(record)}\n질문 다시보기: ${record.replayUsed ? '사용' : '미사용'}\n듣기 지문 재생: ${record.listenPlays || 0}회\n기록에서 다시 확인: ${record.retry ? '예' : '아니오'}\n\n선택한 공통 병목:\n${selectedBottleneckText(task, record, 'common')}\n\n선택한 문제 유형별 병목:\n${selectedBottleneckText(task, record, 'typeSpecific')}${legacySelfAssessmentText(record)}\n\n──────────────────────────────`;
  }).join('\n\n') : '저장된 답변 기록이 없습니다.';
  const difficultySummary = items.length
    ? items.map(({ task, record }, index) => `- 답변 ${index + 1} · ${task.title}: ${difficultyLabel(record)} · 수행 결과 ${outcomeLabel(record.outcome)}`).join('\n')
    : '- 기록 없음';
  return `[SPA_APP_PACKET_V1]\n\n[전달 유형]\n회차 종합 분석\n\n[처리 지침]\n이 채팅방에 먼저 입력된 SPA 고정 운영 지침을 적용하세요.\n새로운 문제를 출제하지 말고 이번 회차에 저장된 실제 답변 기록만 종합하세요.\n기록이 없는 문제를 수행한 것처럼 평가하지 마세요.\n\n──────────────────────────────\n[회차 정보]\n──────────────────────────────\n\n주차: Week ${currentSession.week}\n회차: ${currentSession.label}\n회차 주제: ${currentSession.theme}\n회차 훈련 초점: ${currentSession.focus}\n회차 ID: ${currentSession.id}\n실전·기본 문제 수: ${currentCoreTasks.length}\n선택 약점 보강 문제 수: ${currentBoosterTasks.length}\n답변 기록이 있는 문제 수: ${items.length}\n받아쓰기가 있는 문제 수: ${transcribed}\n1차 녹음이 있는 문제 수: ${firstTakes}\n재도전 녹음이 있는 문제 수: ${retryTakes}\n\n──────────────────────────────\n[문제별 답변 기록]\n──────────────────────────────\n\n${recordsText}\n\n──────────────────────────────\n[회차 병목 집계]\n──────────────────────────────\n\n공통 병목 선택 횟수:\n${countSelectedBottlenecks(items, 'common')}\n\n문제 유형별 병목 선택 횟수:\n${countSelectedBottlenecks(items, 'typeSpecific')}\n\n병목을 선택하지 않은 것은 해당 문제가 객관적으로 없었다는 의미가 아닙니다. 위 집계는 학습자가 직접 체감하고 선택한 항목만 보여줍니다.\n\n──────────────────────────────\n[체감 난이도 기록]\n──────────────────────────────\n\n${difficultySummary}\n\n체감 난이도는 답변 품질 점수가 아닙니다. 1은 매우 쉬움, 5는 매우 어려움을 뜻합니다.\n\n──────────────────────────────\n[이번 요청]\n──────────────────────────────\n\n고정 운영 지침의 ‘회차 종합 분석’ 방식에 따라 다음 형식으로 정리하세요.\n\n[오늘 잘된 점]\n실제 답변에서 확인된 강점 2~3개\n\n[답변에서 실제로 확인된 반복 문제]\n여러 받아쓰기에서 반복 확인된 문제 최대 4개\n\n[학습자가 반복적으로 체감한 병목]\n자가진단에서 반복 선택한 항목 최대 3개\n\n[영역별 진단]\n실제 답변 기록이 있는 영역만 평가\n\n[체감 난이도 패턴]\n성공했지만 어렵게 느낀 문제 또는 수행 결과와 난이도 차이가 큰 문제\n\n[저장할 표현 후보]\n재사용 가치가 높은 표현 3~5개. 각 표현에 영어 표현, 한국어 회상 단서, 학습자용 예문과 기능 분류 포함\n\n[다시 말해볼 답변]\n재연습 가치가 가장 높은 답변 1~2개와 선정 이유\n\n[다음 회차에서 확인할 것]\n반복된 문법, 단어 회수 또는 표현 문제 1~2개\n\n녹음 파일이 직접 첨부되지 않았다면 실제 발음, 억양, 말하기 속도와 침묵 시간을 평가하지 마세요.\n공식 SPA 점수나 등급을 단정하지 마세요.\n새로운 문제나 별도의 숙제를 임의로 추가하지 마세요.`;
}

$('taskPromptBtn').addEventListener('click', () => {
  if (!currentOutcome) return alert('먼저 수행 결과를 선택해 주세요.');
  saveCurrent(false);
  const task = currentTasks[currentTaskIndex];
  $('taskPrompt').textContent = taskPromptText(task, state.records[task.id]);
  $('taskPromptArea').classList.remove('hidden');
});
$('copyTaskPrompt').addEventListener('click', () => copyText($('taskPrompt').textContent));

$('sessionPromptBtn').addEventListener('click', () => {
  $('sessionPrompt').textContent = sessionPromptText();
  $('sessionPromptArea').classList.remove('hidden');
});
$('copySessionPrompt').addEventListener('click', () => copyText($('sessionPrompt').textContent));

function copyText(text) {
  navigator.clipboard?.writeText(text).then(() => toast('복사했습니다.')).catch(() => {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    toast('복사했습니다.');
  });
}

function toast(message) {
  const element = document.createElement('div');
  element.textContent = message;
  element.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#101828;color:white;padding:10px 16px;border-radius:999px;z-index:9999;font-weight:800;font-size:13px;max-width:90%;text-align:center';
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 1700);
}

function normalizeExpression(value = '') {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function nextExpressionCardId() {
  return `expr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function expressionMeta(cardId) {
  return expressionReview[cardId] || { streak: 0, nextDueAt: 0, lastResult: '', lastReviewedAt: '' };
}

function isExpressionDue(cardId, now = Date.now()) {
  const meta = expressionMeta(cardId);
  return !meta.nextDueAt || meta.nextDueAt <= now;
}

function expressionStatus(cardId) {
  const meta = expressionMeta(cardId);
  return meta.streak >= 3 ? '익숙해짐' : '익히는 중';
}

function resetExpressionCapture(task) {
  const select = $('expressionCategory');
  if (select) {
    select.innerHTML = EXPRESSION_CATEGORIES.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('');
    select.value = task?.expressions?.[0]?.category || (task?.strategyArea === '듣기 요약' ? '요약' : task?.type === 'visual' ? (task.kind === 'photo' ? '사진 묘사' : '그래프 비교') : task?.type === 'situation' ? '문제 해결' : '기타');
  }
  if ($('expressionText')) $('expressionText').value = '';
  if ($('expressionCue')) $('expressionCue').value = '';
  if ($('expressionExample')) $('expressionExample').value = '';
  if ($('expressionSaveStatus')) $('expressionSaveStatus').textContent = '';
  const suggestions = $('expressionSuggestions');
  if (!suggestions) return;
  const items = Array.isArray(task?.expressions) ? task.expressions : [];
  suggestions.innerHTML = items.length
    ? `<span class="expression-suggestion-label">활용 가능한 표현</span>${items.map((item, index) => `<button class="expression-suggestion" data-expression-suggestion="${index}" type="button">${esc(item.text)}</button>`).join('')}`
    : '<span class="listen-status">이번 답변에서 다시 쓰고 싶은 표현을 직접 저장할 수 있습니다.</span>';
  suggestions.querySelectorAll('[data-expression-suggestion]').forEach(button => {
    button.addEventListener('click', () => {
      const item = items[Number(button.dataset.expressionSuggestion)];
      if (!item) return;
      $('expressionText').value = item.text || '';
      $('expressionCue').value = item.cue || '';
      $('expressionCategory').value = EXPRESSION_CATEGORIES.includes(item.category) ? item.category : '기타';
      $('expressionExample').focus();
    });
  });
}

function saveExpressionCardFromForm() {
  const task = currentTasks[currentTaskIndex];
  const expression = $('expressionText').value.trim();
  const cue = $('expressionCue').value.trim();
  const example = $('expressionExample').value.trim();
  const category = $('expressionCategory').value || '기타';
  if (!expression) {
    $('expressionSaveStatus').textContent = '기억할 표현을 먼저 입력하세요.';
    $('expressionText').focus();
    return;
  }
  if (expression.length > 110 && !confirm('표현이 조금 깁니다. 문장 전체보다 재사용 가능한 짧은 덩어리로 줄이는 편이 좋습니다. 그대로 저장할까요?')) return;
  const duplicate = expressionCards.find(card => normalizeExpression(card.expression) === normalizeExpression(expression));
  const now = new Date().toISOString();
  if (duplicate) {
    if (!confirm('이미 저장된 표현입니다. 기존 카드에 이번 단서와 예문을 반영할까요?')) return;
    duplicate.cue = cue || duplicate.cue;
    duplicate.example = example || duplicate.example;
    duplicate.category = category || duplicate.category;
    duplicate.updatedAt = now;
    duplicate.sourceTaskId = task?.id || duplicate.sourceTaskId;
    duplicate.sourceSessionId = currentSession?.id || duplicate.sourceSessionId;
    duplicate.sourceTitle = task?.title || duplicate.sourceTitle;
    $('expressionSaveStatus').textContent = '기존 표현 카드를 업데이트했습니다.';
  } else {
    const card = {
      id: nextExpressionCardId(),
      expression,
      cue: cue || '영어 표현을 떠올려 보세요.',
      example,
      category,
      sourceTaskId: task?.id || '',
      sourceSessionId: currentSession?.id || '',
      sourceTitle: task?.title || '',
      createdAt: now,
      updatedAt: now
    };
    expressionCards.push(card);
    expressionReview[card.id] = { streak: 0, nextDueAt: 0, lastResult: '', lastReviewedAt: '' };
    $('expressionSaveStatus').textContent = '표현 카드에 저장했습니다.';
  }
  saveExpressionData();
}

$('saveExpression')?.addEventListener('click', saveExpressionCardFromForm);

function formatReviewDate(timestamp) {
  if (!timestamp) return '지금';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function renderExpressionHub() {
  const now = Date.now();
  const due = expressionCards.filter(card => isExpressionDue(card.id, now));
  const learning = expressionCards.filter(card => expressionStatus(card.id) === '익히는 중').length;
  const mastered = expressionCards.length - learning;
  $('expressionDueCount').textContent = due.length;
  $('expressionTotalCount').textContent = expressionCards.length;
  $('expressionLearningCount').textContent = learning;
  $('expressionMasteredCount').textContent = mastered;
  $('expressionDueMessage').textContent = expressionCards.length
    ? (due.length ? '한국어 단서를 보고 영어 표현을 먼저 소리 내어 말해보세요.' : '오늘 복습은 끝났습니다. 저장한 표현은 기능별로 다시 볼 수 있어요.')
    : '새 문제를 풀고 재사용할 표현을 저장해보세요.';
  $('startExpressionReview').disabled = due.length === 0;

  const categories = ['전체', ...EXPRESSION_CATEGORIES.filter(category => expressionCards.some(card => card.category === category))];
  $('expressionCategoryFilter').innerHTML = categories.map(category => `<button class="expression-filter${expressionFilter === category ? ' active' : ''}" data-expression-filter="${esc(category)}" type="button">${esc(category)}</button>`).join('');
  $('expressionCategoryFilter').querySelectorAll('[data-expression-filter]').forEach(button => button.addEventListener('click', () => {
    expressionFilter = button.dataset.expressionFilter;
    renderExpressionHub();
  }));

  const filtered = expressionCards
    .filter(card => expressionFilter === '전체' || card.category === expressionFilter)
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
  const root = $('expressionCardList');
  if (!filtered.length) {
    root.innerHTML = `<div class="empty expression-empty">${expressionCards.length ? '이 기능으로 저장한 표현이 없습니다.' : '아직 저장한 표현이 없습니다.'}</div>`;
    return;
  }
  root.innerHTML = filtered.map(card => {
    const meta = expressionMeta(card.id);
    return `<article class="expression-card">
      <div class="expression-card-head"><span class="chip">${esc(card.category || '기타')}</span><span class="expression-status">${expressionStatus(card.id)}</span></div>
      <h3 lang="en">${esc(card.expression)}</h3>
      <p class="expression-cue">${esc(card.cue || '회상 단서 없음')}</p>
      ${card.example ? `<p class="expression-example" lang="en">${esc(card.example)}</p>` : ''}
      <div class="expression-card-meta"><span>다음 복습 ${formatReviewDate(meta.nextDueAt)}</span>${card.sourceTitle ? `<span>출처 ${esc(card.sourceTitle)}</span>` : ''}</div>
      <div class="btnrow expression-card-actions">
        <button class="btn secondary small" data-expression-edit="${card.id}" type="button">수정</button>
        <button class="btn secondary small" data-expression-reset="${card.id}" type="button">다시 복습</button>
        <button class="btn danger small" data-expression-delete="${card.id}" type="button">삭제</button>
      </div>
    </article>`;
  }).join('');
  root.querySelectorAll('[data-expression-edit]').forEach(button => button.addEventListener('click', () => editExpressionCard(button.dataset.expressionEdit)));
  root.querySelectorAll('[data-expression-reset]').forEach(button => button.addEventListener('click', () => resetExpressionReview(button.dataset.expressionReset)));
  root.querySelectorAll('[data-expression-delete]').forEach(button => button.addEventListener('click', () => deleteExpressionCard(button.dataset.expressionDelete)));
}

function setModalOpen(modal, open) {
  if (!modal) return;
  modal.classList.toggle('hidden', !open);
  document.body.classList.toggle('modal-open', open || !!document.querySelector('.app-modal:not(.hidden)'));
}

function populateExpressionEditCategories(selected = '기타') {
  const select = $('editExpressionCategory');
  if (!select) return;
  select.innerHTML = EXPRESSION_CATEGORIES.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('');
  select.value = EXPRESSION_CATEGORIES.includes(selected) ? selected : '기타';
}

function editExpressionCard(cardId) {
  const card = expressionCards.find(item => item.id === cardId);
  if (!card) return;
  $('editExpressionId').value = card.id;
  $('editExpressionText').value = card.expression || '';
  $('editExpressionCue').value = card.cue || '';
  $('editExpressionExample').value = card.example || '';
  populateExpressionEditCategories(card.category || '기타');
  setModalOpen($('expressionEditModal'), true);
  requestAnimationFrame(() => $('editExpressionText').focus());
}

function closeExpressionEditModal() {
  setModalOpen($('expressionEditModal'), false);
  $('editExpressionId').value = '';
}

function saveExpressionCardEdit() {
  const card = expressionCards.find(item => item.id === $('editExpressionId').value);
  if (!card) return closeExpressionEditModal();
  const expression = $('editExpressionText').value.trim();
  if (!expression) {
    $('editExpressionText').focus();
    return toast('기억할 표현을 입력해 주세요.');
  }
  card.expression = expression;
  card.cue = $('editExpressionCue').value.trim();
  card.example = $('editExpressionExample').value.trim();
  card.category = EXPRESSION_CATEGORIES.includes($('editExpressionCategory').value) ? $('editExpressionCategory').value : '기타';
  card.updatedAt = new Date().toISOString();
  saveExpressionData();
  closeExpressionEditModal();
  renderExpressionHub();
  toast('표현 카드를 수정했습니다.');
}

function resetExpressionReview(cardId) {
  expressionReview[cardId] = { ...expressionMeta(cardId), streak: 0, nextDueAt: 0, lastResult: 'reset' };
  saveExpressionData();
  renderExpressionHub();
}

function deleteExpressionCard(cardId) {
  const card = expressionCards.find(item => item.id === cardId);
  if (!card) return;
  $('deleteExpressionId').value = card.id;
  $('expressionDeleteMessage').textContent = `“${card.expression}” 카드는 삭제 후 복구할 수 없습니다.`;
  setModalOpen($('expressionDeleteModal'), true);
  requestAnimationFrame(() => $('cancelExpressionDelete').focus());
}

function closeExpressionDeleteModal() {
  setModalOpen($('expressionDeleteModal'), false);
  $('deleteExpressionId').value = '';
}

function confirmExpressionCardDelete() {
  const cardId = $('deleteExpressionId').value;
  if (!cardId) return closeExpressionDeleteModal();
  expressionCards = expressionCards.filter(item => item.id !== cardId);
  delete expressionReview[cardId];
  saveExpressionData();
  closeExpressionDeleteModal();
  renderExpressionHub();
  toast('표현 카드를 삭제했습니다.');
}

$('closeExpressionEdit').addEventListener('click', closeExpressionEditModal);
$('cancelExpressionEdit').addEventListener('click', closeExpressionEditModal);
$('saveExpressionEdit').addEventListener('click', saveExpressionCardEdit);
document.querySelector('[data-close-expression-modal]').addEventListener('click', closeExpressionEditModal);
$('cancelExpressionDelete').addEventListener('click', closeExpressionDeleteModal);
$('confirmExpressionDelete').addEventListener('click', confirmExpressionCardDelete);
document.querySelector('[data-close-expression-delete]').addEventListener('click', closeExpressionDeleteModal);

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!$('expressionEditModal').classList.contains('hidden')) closeExpressionEditModal();
  if (!$('expressionDeleteModal').classList.contains('hidden')) closeExpressionDeleteModal();
});

function startExpressionReview() {
  expressionReviewQueue = expressionCards.filter(card => isExpressionDue(card.id)).sort((a, b) => (expressionMeta(a.id).nextDueAt || 0) - (expressionMeta(b.id).nextDueAt || 0));
  expressionReviewIndex = 0;
  if (!expressionReviewQueue.length) return;
  $('expressionReviewPanel').classList.remove('hidden');
  showExpressionReviewCard();
  $('expressionReviewPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showExpressionReviewCard() {
  const card = expressionReviewQueue[expressionReviewIndex];
  if (!card) {
    $('expressionReviewPanel').classList.add('hidden');
    toast('오늘의 표현 복습을 마쳤습니다.');
    renderExpressionHub();
    return;
  }
  $('expressionReviewProgress').textContent = `${expressionReviewIndex + 1}/${expressionReviewQueue.length}`;
  $('expressionReviewCategory').textContent = card.category || '기타';
  $('expressionReviewCue').textContent = card.cue || '영어 표현을 떠올려 보세요.';
  $('expressionReviewText').textContent = card.expression;
  $('expressionReviewExample').textContent = card.example || '';
  $('expressionReviewAnswer').classList.add('hidden');
  $('revealExpressionAnswer').classList.remove('hidden');
  $('revealExpressionAnswer').focus();
}

function rateExpression(result) {
  const card = expressionReviewQueue[expressionReviewIndex];
  if (!card) return;
  const old = expressionMeta(card.id);
  let streak = old.streak || 0;
  let days = 1;
  if (result === 'again') {
    streak = 0;
    days = 1;
  } else if (result === 'assisted') {
    streak = Math.max(0, streak);
    days = streak >= 2 ? 3 : 2;
  } else {
    streak += 1;
    days = [0, 3, 7, 14, 30, 60][Math.min(streak, 5)];
  }
  expressionReview[card.id] = {
    streak,
    nextDueAt: Date.now() + days * 24 * 60 * 60 * 1000,
    lastResult: result,
    lastReviewedAt: new Date().toISOString()
  };
  saveExpressionData();
  expressionReviewIndex += 1;
  showExpressionReviewCard();
}

$('startExpressionReview')?.addEventListener('click', startExpressionReview);
$('revealExpressionAnswer')?.addEventListener('click', () => {
  $('expressionReviewAnswer').classList.remove('hidden');
  $('revealExpressionAnswer').classList.add('hidden');
});
document.querySelectorAll('[data-expression-rate]').forEach(button => button.addEventListener('click', () => rateExpression(button.dataset.expressionRate)));
$('closeExpressionReview')?.addEventListener('click', () => $('expressionReviewPanel').classList.add('hidden'));

function renderRecords() {
  renderExpressionHub();
  const root = $('recordList');
  const records = Object.values(state.records).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
  if (!records.length) {
    root.innerHTML = '<div class="empty">아직 저장된 답변이 없습니다.</div>';
    return;
  }
  root.innerHTML = records.map(record => `<div class="record-item"><div class="task-type">WEEK ${record.week} · ${esc(record.label)} · ${esc(record.type)}</div><h4>${esc(record.title)}</h4><p>${esc(record.question)}</p>${record.transcript ? `<div class="transcript">${esc(record.transcript)}</div>` : '<p>받아쓰기 없음</p>'}<div class="chips"><span class="chip">결과 ${record.outcome === 'success' ? '성공' : record.outcome === 'partial' ? '부분 성공' : record.outcome === 'fail' ? '실패' : '-'}</span><span class="chip">${record.difficulty ? `난이도 ${record.difficulty}/5` : record.rating ? `이전 체감 ${record.rating}/5` : '난이도 -'}</span>${record.takes?.first ? '<span class="chip">1차 녹음</span>' : ''}${record.takes?.retry ? '<span class="chip">재도전 녹음</span>' : ''}${record.retry ? '<span class="chip" style="color:var(--danger)">기록에서 다시 확인</span>' : ''}</div><div class="btnrow" style="margin-top:9px"><button class="btn secondary small" data-open="${record.sessionId}" type="button">회차 열기</button><button class="btn danger small" data-del="${record.id}" type="button">기록 삭제</button></div></div>`).join('');
  root.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openSession(button.dataset.open)));
  root.querySelectorAll('[data-del]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('텍스트 기록과 이 문제의 녹음을 모두 삭제할까요?')) return;
    delete state.records[button.dataset.del];
    await dbDelete(`${button.dataset.del}:first`);
    await dbDelete(`${button.dataset.del}:retry`);
    saveState();
    renderRecords();
    renderStorageStats();
  }));
}
$('clearFilter').addEventListener('click', () => { expressionFilter = '전체'; renderExpressionHub(); });

function syncSettings() {
  $('revealSec').value = state.settings.revealSec;
  $('ttsRate').value = String(state.settings.ttsRate);
  $('speakQuestion').checked = state.settings.speakQuestion;
  updateTheme(preferredTheme());
  refreshVoices();
}

$('revealSec').addEventListener('change', event => {
  state.settings.revealSec = Math.min(30, Math.max(5, Number(event.target.value) || 10));
  saveState();
  syncSettings();
});
$('ttsRate').addEventListener('change', event => { state.settings.ttsRate = Number(event.target.value); saveState(); });
$('speakQuestion').addEventListener('change', event => { state.settings.speakQuestion = event.target.checked; saveState(); });
$('darkMode')?.addEventListener('change', event => { const theme = event.target.checked ? 'dark' : 'light'; localStorage.setItem(THEME_KEY, theme); updateTheme(theme, true); });
$('questionVoice').addEventListener('change', event => { state.settings.questionVoice = event.target.value; saveState(); });
$('passageVoice').addEventListener('change', event => { state.settings.passageVoice = event.target.value; saveState(); });
$('sampleQuestionVoice').addEventListener('click', () => speakText('This is the question voice.', 'question'));
$('samplePassageVoice').addEventListener('click', () => speakText('This is the listening passage voice.', 'passage', syncPassageControls));

function exportJSON() {
  const payload = {
    format: 'spa45-records-v3',
    exportedAt: new Date().toISOString(),
    state,
    expressionCards,
    expressionReview,
    note: '텍스트 기록과 표현 카드를 포함한 백업입니다. 녹음까지 함께 보관하려면 전체 ZIP 백업을 사용하세요.'
  };
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'spa45_records_and_expressions.json');
}

function downloadBlob(blob, name) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

$('exportData').addEventListener('click', exportJSON);
$('importData').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!confirm('가져온 JSON 기록과 표현 카드로 현재 데이터를 교체할까요?')) return;
    const importedState = imported.state || imported;
    state = {
      ...clone(defaultState),
      ...importedState,
      settings: { ...defaultState.settings, ...(importedState.settings || {}) },
      records: importedState.records || {},
      reviewMeta: importedState.reviewMeta || {},
      completed: importedState.completed || {},
      startedSessions: importedState.startedSessions || {},
      sessionHistory: importedState.sessionHistory || {}
    };
    if (Array.isArray(imported.expressionCards)) expressionCards = imported.expressionCards;
    if (imported.expressionReview && typeof imported.expressionReview === 'object') expressionReview = imported.expressionReview;
    saveExpressionData();
    saveState();
    syncSettings();
    renderRecords();
    toast('JSON 기록을 가져왔습니다.');
  } catch (error) {
    alert(`JSON 가져오기에 실패했습니다.\n${error.message}`);
  } finally {
    event.target.value = '';
  }
});

async function sha256Hex(data) {
  if (!crypto?.subtle) return null;
  const buffer = data instanceof ArrayBuffer ? data : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function safeAudioName(clip) {
  const extension = clip.ext || extForMime(clip.mime);
  return `audio/${clip.taskId}_${clip.take}.${extension}`.replace(/[^A-Za-z0-9_./-]/g, '_');
}

async function exportAudioZip() {
  if (typeof JSZip === 'undefined') return alert('ZIP 모듈을 불러오지 못했습니다. vendor/jszip.min.js 파일을 확인하세요.');
  const clips = await dbAll();
  const zip = new JSZip();
  const manifest = { format: 'spa45-backup', version: 1, createdAt: new Date().toISOString(), clipCount: clips.length, entries: [] };
  zip.file('records.json', JSON.stringify({ format: 'spa45-records-v3', exportedAt: manifest.createdAt, state, expressionCards, expressionReview }, null, 2));
  for (const clip of clips) {
    const file = safeAudioName(clip);
    const data = new Uint8Array(await clip.blob.arrayBuffer());
    const sha256 = await sha256Hex(data);
    zip.file(file, data, { binary: true });
    manifest.entries.push({ key: clip.key, taskId: clip.taskId, source: clip.source, sessionId: clip.sessionId, take: clip.take, title: clip.title, mime: clip.mime, ext: clip.ext || extForMime(clip.mime), metrics: clip.metrics, createdAt: clip.createdAt, file, bytes: data.byteLength, sha256 });
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  $('exportAudio').disabled = true;
  $('exportAudio').textContent = 'ZIP 생성·검증 중…';
  try {
    const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const check = await JSZip.loadAsync(bytes);
    const parsed = JSON.parse(await check.file('manifest.json').async('text'));
    if (parsed.clipCount !== clips.length || !check.file('records.json')) throw new Error('manifest count mismatch');
    for (const entry of parsed.entries) {
      const archived = check.file(entry.file);
      if (!archived) throw new Error(`missing ${entry.file}`);
      const data = await archived.async('uint8array');
      if (data.byteLength !== entry.bytes) throw new Error(`size mismatch ${entry.file}`);
      if (entry.sha256 && await sha256Hex(data) !== entry.sha256) throw new Error(`hash mismatch ${entry.file}`);
    }
    downloadBlob(new Blob([bytes], { type: 'application/zip' }), `spa45_full_backup_${new Date().toISOString().slice(0, 10)}.zip`);
    toast(`ZIP 검증 완료 · 녹음 ${clips.length}개`);
  } catch (error) {
    console.error(error);
    alert(`ZIP 백업 검증에 실패했습니다. 다운로드하지 않았습니다.\n${error.message}`);
  } finally {
    $('exportAudio').disabled = false;
    $('exportAudio').textContent = '전체 ZIP 백업·검증';
  }
}

async function importAudioZip(file) {
  if (!file) return;
  if (typeof JSZip === 'undefined') return alert('ZIP 모듈을 불러오지 못했습니다.');
  if (!confirm('ZIP의 기록과 녹음으로 현재 데이터를 교체할까요?')) return;
  try {
    const zip = await JSZip.loadAsync(file);
    const manifestFile = zip.file('manifest.json');
    const recordsFile = zip.file('records.json');
    if (!manifestFile || !recordsFile) throw new Error('manifest.json 또는 records.json이 없습니다.');
    const manifest = JSON.parse(await manifestFile.async('text'));
    if (manifest.format !== 'spa45-backup' || !Array.isArray(manifest.entries)) throw new Error('지원하지 않는 백업 형식입니다.');
    const importedBundle = JSON.parse(await recordsFile.async('text'));
    const nextState = importedBundle.state || importedBundle;
    const restored = [];
    for (const entry of manifest.entries) {
      const archived = zip.file(entry.file);
      if (!archived) throw new Error(`녹음 누락: ${entry.file}`);
      const data = await archived.async('uint8array');
      if (data.byteLength !== entry.bytes) throw new Error(`크기 불일치: ${entry.file}`);
      if (entry.sha256 && await sha256Hex(data) !== entry.sha256) throw new Error(`무결성 불일치: ${entry.file}`);
      restored.push({ ...entry, blob: new Blob([data], { type: entry.mime || 'application/octet-stream' }) });
    }
    await dbClear();
    for (const clip of restored) {
      await dbPut({ key: clip.key, taskId: clip.taskId, source: clip.source, sessionId: clip.sessionId, take: clip.take, title: clip.title, blob: clip.blob, mime: clip.mime, ext: clip.ext, metrics: clip.metrics, createdAt: clip.createdAt });
    }
    state = {
      ...clone(defaultState),
      ...nextState,
      settings: { ...defaultState.settings, ...(nextState.settings || {}) },
      records: nextState.records || {},
      reviewMeta: nextState.reviewMeta || {},
      completed: nextState.completed || {},
      startedSessions: nextState.startedSessions || {},
      sessionHistory: nextState.sessionHistory || {}
    };
    if (Array.isArray(importedBundle.expressionCards)) expressionCards = importedBundle.expressionCards;
    if (importedBundle.expressionReview && typeof importedBundle.expressionReview === 'object') expressionReview = importedBundle.expressionReview;
    saveExpressionData();
    saveState();
    syncSettings();
    renderRecords();
    await renderStorageStats();
    toast(`ZIP 복원 완료 · 녹음 ${restored.length}개`);
  } catch (error) {
    console.error(error);
    alert(`ZIP 복원에 실패했습니다. 기존 데이터는 검증이 끝나기 전에는 지우지 않습니다.\n${error.message}`);
  } finally {
    $('importAudio').value = '';
  }
}

$('exportAudio').addEventListener('click', exportAudioZip);
$('importAudio').addEventListener('change', event => importAudioZip(event.target.files?.[0]));

function setPersistButtonLabel(desktop, mobile = desktop) {
  const button = $('persistStorage');
  if (!button) return;
  const desktopNode = button.querySelector('.desktop-copy');
  const mobileNode = button.querySelector('.mobile-copy');
  if (desktopNode) desktopNode.textContent = desktop;
  else button.textContent = desktop;
  if (mobileNode) mobileNode.textContent = mobile;
}

async function updatePersistenceStatus(request = false) {
  const status = $('storageStatus');
  const help = $('storageHelp');
  const button = $('persistStorage');
  if (!navigator.storage?.persisted) {
    status.textContent = '미지원';
    status.className = 'status-warn';
    help.textContent = '지속 저장 상태 확인을 지원하지 않습니다. ZIP 백업을 권장합니다.';
    button.disabled = true;
    return false;
  }
  try {
    let persisted = await navigator.storage.persisted();
    if (!persisted && request && navigator.storage.persist) persisted = await navigator.storage.persist();
    if (persisted) {
      status.textContent = '보존 저장 승인됨';
      status.className = 'status-good';
      help.textContent = '브라우저가 이 사이트 저장소의 우선 보존을 승인했습니다. 중요한 기록은 ZIP으로도 백업하세요.';
      button.disabled = true;
      setPersistButtonLabel('보존 저장 승인됨', '승인 완료');
      return true;
    }
    status.textContent = '일반 저장 · 백업 권장';
    status.className = 'status-warn';
    help.textContent = '브라우저 정리나 사이트 데이터 삭제 시 사라질 수 있습니다.';
    button.disabled = false;
    setPersistButtonLabel(request ? '승인되지 않음 · 다시 요청' : '저장 보존 요청', request ? '다시 요청' : '저장 유지');
    return false;
  } catch (_) {
    status.textContent = '상태 확인 오류';
    status.className = 'status-bad';
    help.textContent = '저장소 상태를 확인하지 못했습니다. ZIP 백업을 권장합니다.';
    return false;
  }
}

$('persistStorage').addEventListener('click', () => updatePersistenceStatus(true));

async function renderStorageStats() {
  if (!db) return;
  try {
    const clips = await dbAll();
    const size = clips.reduce((total, clip) => total + (clip.blob?.size || 0), 0);
    $('storageClipCount').textContent = `${clips.length}개`;
    $('storageBytes').textContent = bytesText(size);
    $('audioCount').textContent = clips.length;
    await updatePersistenceStatus(false);
  } catch (_) {
    $('storageStatus').textContent = '저장 기능 오류';
    $('storageStatus').className = 'status-bad';
  }
}

function syncResetButton() {
  $('resetData').disabled = !($('resetBackupCheck').checked && $('resetPhrase').value.trim() === '전체 초기화');
}
$('resetBackupCheck').addEventListener('change', syncResetButton);
$('resetPhrase').addEventListener('input', syncResetButton);
$('resetData').addEventListener('click', async () => {
  if ($('resetData').disabled) return;
  if (!confirm('정말로 모든 텍스트 기록과 녹음을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(EXPRESSION_CARDS_KEY);
  localStorage.removeItem(EXPRESSION_REVIEW_KEY);
  await dbClear();
  state = clone(defaultState);
  expressionCards = [];
  expressionReview = {};
  saveState();
  syncSettings();
  $('resetPhrase').value = '';
  $('resetBackupCheck').checked = false;
  syncResetButton();
  renderRecords();
  renderStorageStats();
  toast('전체 초기화가 완료되었습니다.');
});

window.addEventListener('beforeunload', () => {
  stopAllSpeech();
  stopLiveResources();
  revokeClipUrls();
});

(async function boot() {
  updateTheme(preferredTheme());
  renderCourse();
  syncSettings();
  renderRecords();
  renderChecks(null);
  populateExpressionEditCategories();
  syncDifficultyUI();
  if (typeof JSZip === 'undefined') console.warn('JSZip missing');
  await initDB();
  await updateStats();
})();
