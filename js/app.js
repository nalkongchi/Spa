/* SPA 45 trainer application. Curriculum data lives in ../data/content.js. */

const STORE_KEY = 'spa45_fiveweek_v2';
const OLD_STORE_KEY = 'spa45_fiveweek_v1';
const DB_NAME = 'spa45_audio_v2';
const DB_VERSION = 1;
const AUDIO_STORE = 'clips';
const THEME_KEY = 'spa45-theme';
const EXPRESSION_CARDS_KEY = 'spa45_expression_cards_v1';
const EXPRESSION_REVIEW_KEY = 'spa45_expression_review_v1';
const MAX_JSON_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_ZIP_FILE_BYTES = 128 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 1000;
const MAX_ZIP_AUDIO_BYTES = 20 * 1024 * 1024;
const MAX_ZIP_UNCOMPRESSED_BYTES = 192 * 1024 * 1024;
const MAX_ZIP_MANIFEST_BYTES = 1024 * 1024;
const MAX_ZIP_PATH_LENGTH = 240;
const MAX_ZIP_COMPRESSION_RATIO = 200;

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
  lastSession: null,
  resume: null
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

const storageReadBlocks = new Set();
const storageIssues = new Map();
let storageRecoveryTimer = null;

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function storageLabel(key) {
  if (key === STORE_KEY || key === OLD_STORE_KEY) return '텍스트 기록';
  if (key === EXPRESSION_CARDS_KEY) return '표현 카드';
  if (key === EXPRESSION_REVIEW_KEY) return '표현 복습';
  if (key === THEME_KEY) return '테마 설정';
  return '브라우저 데이터';
}

function renderStorageAlert() {
  const root = $('storageAlert');
  if (!root) return;
  if (!storageIssues.size) {
    root.classList.add('hidden');
    return;
  }
  const issues = [...storageIssues.values()];
  const issue = issues[0];
  $('storageAlertTitle').textContent = issue.title;
  $('storageAlertMessage').textContent = `${issue.message}${issues.length > 1 ? ` · 추가 문제 ${issues.length - 1}건` : ''}`;
  root.classList.remove('hidden', 'is-success');
  $('storageRetry').classList.toggle('hidden', !issues.some(item => item.retryable));
}

function setStorageIssue(id, issue) {
  if (storageRecoveryTimer) {
    clearTimeout(storageRecoveryTimer);
    storageRecoveryTimer = null;
  }
  storageIssues.set(id, issue);
  renderStorageAlert();
}

function showStorageRecovered() {
  const root = $('storageAlert');
  if (!root || storageIssues.size) return;
  $('storageAlertTitle').textContent = '다시 저장되었습니다.';
  $('storageAlertMessage').textContent = '브라우저 저장소가 정상으로 돌아왔습니다.';
  $('storageRetry').classList.add('hidden');
  root.classList.remove('hidden');
  root.classList.add('is-success');
  if (storageRecoveryTimer) clearTimeout(storageRecoveryTimer);
  storageRecoveryTimer = setTimeout(() => {
    root.classList.add('hidden');
    root.classList.remove('is-success');
    storageRecoveryTimer = null;
  }, 4000);
}

function clearStorageIssue(id) {
  const recovered = storageIssues.delete(id);
  if (!recovered) return;
  if (storageIssues.size) renderStorageAlert();
  else showStorageRecovered();
}

function storageWriteIssue(key, error, phase) {
  const name = error?.name || 'UnknownError';
  let title = `${storageLabel(key)} 저장 실패`;
  let message = '현재 메모리에서는 계속 사용할 수 있지만 새 내용이 보존되지 않을 수 있습니다.';
  if (phase === 'serialize') {
    message = '저장할 데이터를 JSON으로 변환하지 못했습니다. 현재 화면의 학습은 계속할 수 있습니다.';
  } else if (name === 'QuotaExceededError') {
    title = '브라우저 저장 공간 부족';
    message = '새 기록이 저장되지 않았습니다. 공간을 확보한 뒤 다시 시도해 주세요.';
  } else if (name === 'SecurityError' || name === 'NotAllowedError') {
    title = '브라우저 저장소 차단';
    message = '저장 권한이 차단되어 새 기록이 보존되지 않을 수 있습니다.';
  }
  setStorageIssue(`write:${key}`, { title, message, retryable: true });
}

function storageReadIssue(key, error, reason = 'read') {
  storageReadBlocks.add(key);
  const blocked = error?.name === 'SecurityError' || error?.name === 'NotAllowedError';
  setStorageIssue(`read:${key}`, {
    title: blocked ? '브라우저 저장소 읽기 차단' : `${storageLabel(key)} 읽기 실패`,
    message: blocked
      ? '기존 데이터를 확인할 수 없습니다. 원본 보호를 위해 이 항목의 자동 저장을 멈췄습니다.'
      : `${reason === 'shape' ? '저장된 데이터 구조를 확인할 수 없습니다.' : '저장된 JSON이 손상되었습니다.'} 원본은 그대로 보존하며 자동 덮어쓰기를 막았습니다.`,
    retryable: false
  });
}

function readStorageText(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? { status: 'missing', value: null } : { status: 'ok', value: raw };
  } catch (error) {
    storageReadIssue(key, error, 'read');
    return { status: 'error', value: null };
  }
}

function loadLocalJSON(key, fallback, validate) {
  const result = readStorageText(key);
  if (result.status !== 'ok') return clone(fallback);
  let parsed;
  try {
    parsed = JSON.parse(result.value);
  } catch (error) {
    storageReadIssue(key, error, 'parse');
    return clone(fallback);
  }
  if (validate && !validate(parsed)) {
    storageReadIssue(key, { name: 'DataError' }, 'shape');
    return clone(fallback);
  }
  return parsed;
}

function safeWriteText(key, value) {
  if (storageReadBlocks.has(key)) return false;
  try {
    localStorage.setItem(key, value);
    clearStorageIssue(`write:${key}`);
    return true;
  } catch (error) {
    storageWriteIssue(key, error, 'write');
    return false;
  }
}

function safeWriteJSON(key, value) {
  if (storageReadBlocks.has(key)) return false;
  let serialized;
  try {
    serialized = JSON.stringify(value);
    if (serialized === undefined) throw new TypeError('JSON serialization returned undefined');
  } catch (error) {
    storageWriteIssue(key, error, 'serialize');
    return false;
  }
  return safeWriteText(key, serialized);
}

function safeRemoveStorageKey(key) {
  try {
    localStorage.removeItem(key);
    storageReadBlocks.delete(key);
    storageIssues.delete(`read:${key}`);
    storageIssues.delete(`write:${key}`);
    renderStorageAlert();
    return true;
  } catch (error) {
    storageWriteIssue(key, error, 'write');
    return false;
  }
}

let state = loadState();
let expressionCards = loadLocalJSON(EXPRESSION_CARDS_KEY, [], Array.isArray);
let expressionReview = loadLocalJSON(EXPRESSION_REVIEW_KEY, {}, isPlainObject);
let db = null;
let dbStatus = 'pending';
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
let recordingStarting = false;
let recordingSaving = false;
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
let resumeSaveTimer = null;
let resumeDirty = false;
let isRestoringResume = false;
let pendingJSONImport = null;
let pendingZIPImport = null;
let zipValidationBusy = false;
let zipRestoreBusy = false;
let zipExportBusy = false;

function loadState() {
  const validState = value => isPlainObject(value)
    && (value.settings === undefined || isPlainObject(value.settings))
    && (value.records === undefined || isPlainObject(value.records))
    && (value.completed === undefined || isPlainObject(value.completed));
  const current = loadLocalJSON(STORE_KEY, null, validState);
  if (current) {
    return {
      ...clone(defaultState),
      ...current,
      settings: { ...defaultState.settings, ...(current.settings || {}) },
      records: current.records || {},
      reviewMeta: current.reviewMeta || {},
      completed: current.completed || {},
      startedSessions: current.startedSessions || {},
      sessionHistory: current.sessionHistory || {}
    };
  }
  if (!storageReadBlocks.has(STORE_KEY)) {
    const old = loadLocalJSON(OLD_STORE_KEY, null, validState);
    if (old) {
      return {
        ...clone(defaultState),
        settings: { ...defaultState.settings, ...(old.settings || {}) },
        records: old.records || {},
        completed: old.completed || {},
        lastSession: old.lastSession || null
      };
    }
  }
  return clone(defaultState);
}

function saveState() {
  const saved = safeWriteJSON(STORE_KEY, state);
  updateStats();
  return saved;
}

function saveExpressionData() {
  const cardsSaved = safeWriteJSON(EXPRESSION_CARDS_KEY, expressionCards);
  const reviewSaved = safeWriteJSON(EXPRESSION_REVIEW_KEY, expressionReview);
  updateStats();
  return cardsSaved && reviewSaved;
}

async function retryStorageFailures() {
  const writeKeys = [...storageIssues.keys()].filter(id => id.startsWith('write:')).map(id => id.slice(6));
  for (const key of writeKeys) {
    if (key === STORE_KEY) safeWriteJSON(key, state);
    else if (key === EXPRESSION_CARDS_KEY) safeWriteJSON(key, expressionCards);
    else if (key === EXPRESSION_REVIEW_KEY) safeWriteJSON(key, expressionReview);
    else if (key === THEME_KEY) safeWriteText(key, document.documentElement.dataset.theme || 'light');
  }
  if (dbStatus === 'unavailable') await initDB(true);
  if (storageIssues.size) renderStorageAlert();
}

$('storageRetry')?.addEventListener('click', retryStorageFailures);

function resumeSignature(value) {
  if (!value) return '';
  return JSON.stringify({
    sessionId: value.sessionId,
    taskSet: value.taskSet,
    taskIndex: value.taskIndex,
    taskId: value.taskId,
    draftTranscript: value.draftTranscript,
    recordingTarget: value.recordingTarget
  });
}

function currentResumeSnapshot() {
  if (!currentSession || !currentTasks.length) return null;
  const task = currentTasks[currentTaskIndex];
  if (!task) return null;
  return {
    sessionId: currentSession.id,
    taskSet: boosterMode ? 'booster' : 'core',
    taskIndex: currentTaskIndex,
    taskId: task.id,
    draftTranscript: $('transcript')?.value ?? '',
    recordingTarget: recordingTarget === 'retry' ? 'retry' : 'first',
    updatedAt: new Date().toISOString()
  };
}

function flushResumeSave(persist = true) {
  if (resumeSaveTimer) {
    clearTimeout(resumeSaveTimer);
    resumeSaveTimer = null;
  }
  if (isRestoringResume) return false;
  const snapshot = currentResumeSnapshot();
  if (!snapshot) {
    resumeDirty = false;
    return false;
  }
  if (!resumeDirty && resumeSignature(snapshot) === resumeSignature(state.resume)) return false;
  if (resumeSignature(snapshot) === resumeSignature(state.resume)) {
    resumeDirty = false;
    return false;
  }
  state.resume = snapshot;
  resumeDirty = false;
  if (persist) saveState();
  return true;
}

function scheduleResumeSave() {
  if (isRestoringResume || !currentSession) return;
  resumeDirty = true;
  if (resumeSaveTimer) clearTimeout(resumeSaveTimer);
  resumeSaveTimer = setTimeout(() => flushResumeSave(true), 700);
}

function fmt(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function bytesText(bytes) {
  if (!bytes) return '0 MB';
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function backupBytesText(bytes) {
  if (!bytes) return '0 MB';
  return bytes < 1024 ? `${bytes} B` : bytesText(bytes);
}

function extForMime(mime = '') {
  const value = mime.toLowerCase();
  if (value.includes('mp4') || value.includes('m4a')) return 'm4a';
  if (value.includes('ogg')) return 'ogg';
  if (value.includes('wav')) return 'wav';
  return 'webm';
}

function preferredTheme() {
  const result = readStorageText(THEME_KEY);
  if (result.status === 'ok' && (result.value === 'dark' || result.value === 'light')) return result.value;
  if (result.status === 'ok') storageReadIssue(THEME_KEY, { name: 'DataError' }, 'shape');
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
  safeWriteText(THEME_KEY, next);
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

function audioOperationBusy() {
  return recordingStarting || recordingSaving || mediaRecorder?.state === 'recording';
}

function blockWhileAudioBusy() {
  if (zipRestoreBusy) {
    alert('백업을 복원하고 있습니다. 완료될 때까지 잠시 기다려 주세요.');
    return true;
  }
  if (!audioOperationBusy()) return false;
  alert(recordingSaving ? '녹음을 저장하고 있습니다. 저장이 끝난 뒤 이동해 주세요.' : '녹음을 먼저 종료해 주세요.');
  return true;
}

function setTab(name, skipResumeFlush = false) {
  if (zipRestoreBusy) return;
  if (!skipResumeFlush) flushResumeSave(true);
  stopAllSpeech();
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('active', panel.id === `panel-${name}`));
  if (name === 'records') renderRecords();
  if (name === 'settings') renderStorageStats();
  if (name === 'course') renderResumeCard();
}

document.querySelectorAll('.tab').forEach(button => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
});
$('backCourse').addEventListener('click', () => setTab('course'));
$('themeQuick').addEventListener('click', toggleTheme);
$('resumeContinue')?.addEventListener('click', continueFromResume);

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      if (settled) return request.result.close();
      settled = true;
      resolve(request.result);
    };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      reject(request.error || new Error('IndexedDB open failed'));
    };
    request.onblocked = () => {
      if (settled) return;
      settled = true;
      const error = new Error('IndexedDB open blocked');
      error.name = 'BlockedError';
      reject(error);
    };
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requireDB() {
  if (dbStatus !== 'ready' || !db) {
    const error = new Error('녹음 저장소가 준비되지 않았습니다.');
    error.name = 'IndexedDBUnavailableError';
    throw error;
  }
  return db;
}

function idbRead(method, value) {
  try {
    const database = requireDB();
    const store = database.transaction(AUDIO_STORE).objectStore(AUDIO_STORE);
    return idbRequest(value === undefined ? store[method]() : store[method](value));
  } catch (error) {
    return Promise.reject(error);
  }
}

function idbWrite(method, value) {
  return new Promise((resolve, reject) => {
    let transaction;
    try {
      const database = requireDB();
      transaction = database.transaction(AUDIO_STORE, 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      if (value === undefined) store[method]();
      else store[method](value);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
  });
}

const dbPut = value => idbWrite('put', value);
const dbGet = key => idbRead('get', key);
const dbDelete = key => idbWrite('delete', key);
const dbAll = () => idbRead('getAll');
const dbClear = () => idbWrite('clear');

function dbDeleteMany(keys) {
  return new Promise((resolve, reject) => {
    let transaction;
    try {
      const database = requireDB();
      transaction = database.transaction(AUDIO_STORE, 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      keys.forEach(key => store.delete(key));
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
  });
}

function dbReplaceAll(values) {
  return new Promise((resolve, reject) => {
    let transaction;
    let failure = null;
    try {
      const database = requireDB();
      transaction = database.transaction(AUDIO_STORE, 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      store.clear();
      values.forEach(value => store.put(value));
    } catch (error) {
      if (transaction) {
        failure = error;
        transaction.onabort = () => reject(failure);
        transaction.onerror = () => { failure = transaction.error || failure; };
        try { transaction.abort(); } catch (_) { reject(error); }
        return;
      }
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => { failure = transaction.error || new Error('IndexedDB transaction failed'); };
    transaction.onabort = () => reject(failure || transaction.error || new Error('IndexedDB transaction aborted'));
  });
}

function syncAudioAvailability() {
  const ready = dbStatus === 'ready';
  const backupBusy = zipValidationBusy || zipRestoreBusy || zipExportBusy;
  const available = ready && !backupBusy;
  const exportButton = $('exportAudio');
  const importInput = $('importAudio');
  const importLabel = document.querySelector('label[for="importAudio"]');
  if (exportButton) exportButton.disabled = !available;
  if (importInput) importInput.disabled = !available;
  if (importLabel) {
    importLabel.classList.toggle('is-disabled', !available);
    importLabel.setAttribute('aria-disabled', available ? 'false' : 'true');
  }
  if ($('recordToggle')) {
    if (!available || recordingStarting || recordingSaving) $('recordToggle').disabled = true;
    else if (questionSeen && mediaRecorder?.state !== 'recording') $('recordToggle').disabled = false;
    if (!ready && currentSession) syncRecordingTargetHint(false);
  }
  const lockTargets = !available || audioOperationBusy();
  if ($('takeFirst')) $('takeFirst').disabled = lockTargets;
  if ($('takeRetry')) $('takeRetry').disabled = lockTargets;
}

function setDBUnavailable(message = '녹음 저장소를 열 수 없습니다.') {
  db?.close();
  db = null;
  dbStatus = 'unavailable';
  $('storageStatus').textContent = '사용 불가';
  $('storageStatus').className = 'status-bad';
  $('storageHelp').textContent = `${message} 텍스트 학습은 계속 사용할 수 있습니다.`;
  setStorageIssue('db', {
    title: '녹음 저장소 사용 불가',
    message: '텍스트 기록은 계속 사용할 수 있지만 녹음·재생·오디오 ZIP 기능은 잠시 꺼집니다.',
    retryable: true
  });
  syncAudioAvailability();
  renderSavedTakes();
}

async function initDB(manualRetry = false) {
  if (dbStatus === 'ready' && db) return true;
  dbStatus = 'pending';
  syncAudioAvailability();
  if (manualRetry) {
    $('storageStatus').textContent = '다시 연결 중';
    $('storageHelp').textContent = '녹음 저장소를 다시 확인하고 있습니다.';
  }
  try {
    db = await openDB();
    dbStatus = 'ready';
    db.onversionchange = () => {
      db?.close();
      db = null;
      dbStatus = 'unavailable';
      setStorageIssue('db', {
        title: '녹음 저장소 연결 종료',
        message: '텍스트 학습은 계속할 수 있지만 녹음 기능은 사용할 수 없습니다.',
        retryable: true
      });
      syncAudioAvailability();
      renderSavedTakes();
    };
    clearStorageIssue('db');
    syncAudioAvailability();
    await renderStorageStats();
    updateStats();
    if (currentSession && currentTasks[currentTaskIndex]) await loadTakes(currentTasks[currentTaskIndex]);
    return true;
  } catch (error) {
    setDBUnavailable(error?.name === 'BlockedError' ? '다른 탭이 저장소 연결을 막고 있습니다.' : '녹음 저장소를 열 수 없습니다.');
    return false;
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

function resolveResumeTarget(value = state.resume) {
  if (!value || typeof value !== 'object') return null;
  if (value.taskSet !== 'core' && value.taskSet !== 'booster') return null;
  if (!Number.isInteger(value.taskIndex) || typeof value.taskId !== 'string') return null;
  const session = SESSIONS.find(item => item.id === value.sessionId);
  if (!session) return null;
  const taskSets = buildTaskSets(session);
  const tasks = value.taskSet === 'booster' ? taskSets.booster : taskSets.core;
  if (value.taskIndex < 0 || value.taskIndex >= tasks.length) return null;
  if (tasks[value.taskIndex]?.id !== value.taskId) return null;
  return { session, taskSets, tasks, taskIndex: value.taskIndex, resume: value };
}

function renderResumeCard() {
  const card = $('resumeCard');
  if (!card) return;
  const value = state.resume;
  if (!value || typeof value !== 'object') {
    card.classList.add('hidden');
    return;
  }
  const target = resolveResumeTarget(value);
  const session = target?.session || SESSIONS.find(item => item.id === value.sessionId);
  const taskNumber = Number.isInteger(value.taskIndex) && value.taskIndex >= 0 ? value.taskIndex + 1 : '-';
  const savedAt = value.updatedAt && !Number.isNaN(new Date(value.updatedAt).getTime())
    ? new Date(value.updatedAt).toLocaleString('ko-KR')
    : '시간 정보 없음';
  $('resumeSessionName').textContent = session ? `${session.label} · ${session.theme}` : '이전 학습 위치';
  $('resumeTaskMeta').textContent = `${value.taskSet === 'booster' ? '약점 보강 · ' : ''}${taskNumber}번 문제 · 마지막 저장 ${savedAt}`;
  $('resumeDraftStatus').textContent = typeof value.draftTranscript === 'string' && value.draftTranscript.length
    ? '입력 중인 답변 초안이 있습니다.'
    : '저장된 답변 초안이 없습니다.';
  card.classList.remove('hidden');
}

async function continueFromResume() {
  const target = resolveResumeTarget();
  if (!target) {
    toast('저장된 이어서 하기 위치를 찾을 수 없습니다. 과정에서 회차를 다시 선택해 주세요.');
    return;
  }
  isRestoringResume = true;
  try {
    await openSession(target.session.id, target);
  } finally {
    isRestoringResume = false;
  }
}

function displayMode(session) {
  return session.mock5 ? '모의고사' : session.mode;
}

function isSessionStarted(sessionId) {
  return !!state.startedSessions[sessionId] || Object.values(state.records).some(record => record.sessionId === sessionId);
}

function isSessionFinishPending(session) {
  if (!session || state.completed[session.id] === true) return false;
  const coreTasks = buildTaskSets(session).core;
  return coreTasks.length > 0 && coreTasks.every(task => isEvaluationComplete(state.records[task.id]));
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
      const pending = isSessionFinishPending(session);
      const done = !!state.completed[session.id];
      const started = !done && !pending && isSessionStarted(session.id);
      button.type = 'button';
      button.className = `session${done ? ' done' : pending ? ' pending' : started ? ' started' : ''}${state.lastSession === session.id ? ' current' : ''}`;
      button.innerHTML = `
        ${done ? '<span class="check">✓</span>' : ''}
        <div class="session-card-top">
          <strong class="${session.kind === 'weekend' ? 'weekend-name' : ''}">${esc(session.label)}</strong>
          <span class="session-meta">${session.minutes}분 · ${esc(displayMode(session))}</span>
        </div>
        <span class="session-theme">${esc(session.theme)}</span>
        ${pending ? '<span class="session-status">평가 완료 · 마무리 필요</span><span class="session-pending-cta">회차 마무리 →</span>' : ''}`;
      button.addEventListener('click', async () => {
        const opened = await openSession(session.id);
        if (opened && pending) finishSession();
      });
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
  renderResumeCard();
  if (dbStatus === 'ready') {
    try { $('audioCount').textContent = (await dbAll()).length; } catch (_) { setDBUnavailable('녹음 저장소 상태를 확인할 수 없습니다.'); }
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

async function openSession(id, resumeTarget = null) {
  if (blockWhileAudioBusy()) return false;
  stopAllSpeech();
  currentSession = SESSIONS.find(session => session.id === id);
  if (!currentSession) return false;
  state.lastSession = id;
  saveState();
  const taskSets = resumeTarget?.taskSets || buildTaskSets(currentSession);
  currentCoreTasks = taskSets.core;
  currentBoosterTasks = taskSets.booster;
  boosterMode = resumeTarget?.resume?.taskSet === 'booster';
  currentTasks = boosterMode ? currentBoosterTasks : currentCoreTasks;
  currentTaskIndex = resumeTarget?.taskIndex || 0;
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
  await loadTask(currentTaskIndex);
  if (resumeTarget) {
    const value = resumeTarget.resume;
    $('transcript').value = typeof value.draftTranscript === 'string' ? value.draftTranscript : $('transcript').value;
    setTake(value.recordingTarget === 'retry' ? 'retry' : 'first');
  }
  setTab('practice');
  return true;
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
      if (blockWhileAudioBusy()) return;
      flushResumeSave(false);
      saveBeforeNavigate();
      await loadTask(index);
    });
    nav.appendChild(button);
  });
  updateSessionProgressUI();
  requestAnimationFrame(() => {
    const active = nav.querySelector('.active');
    if (active) {
      const navRect = nav.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const targetLeft = nav.scrollLeft + activeRect.left - navRect.left - ((nav.clientWidth - activeRect.width) / 2);
      nav.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
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

function scrollTaskBelowHeader(target) {
  const practiceArea = $('practiceArea');
  practiceArea.style.paddingBottom = '';
  const headerHeight = document.querySelector('.fixed-header')?.getBoundingClientRect().height || 0;
  const targetTop = window.scrollY + target.getBoundingClientRect().top;
  const desiredTop = Math.max(0, targetTop - headerHeight - 12);
  const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const missingScrollSpace = Math.max(0, desiredTop - maxScrollTop);
  if (missingScrollSpace) practiceArea.style.paddingBottom = `${Math.ceil(missingScrollSpace)}px`;
  window.scrollTo({ top: desiredTop, behavior: 'smooth' });
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
  const taskGuide = typeof task.guide === 'string' ? task.guide.trim() : '';
  $('taskGuide').textContent = taskGuide;
  $('answerStrategyDetails').classList.toggle('hidden', !taskGuide);
  $('answerStrategyDetails').open = false;
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
  $('revealRule').textContent = `현재 문제 표시시간: ${effectiveRevealSec(task)}초 · 다시보기 5초 · 1회 가능`;
  renderTaskNav();
  const scrollTarget = sameVisualGroup ? $('questionShell') : $('taskTitle');
  scrollTaskBelowHeader(scrollTarget);
  flushResumeSave(true);
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
  if (recordingStarting || recordingSaving || mediaRecorder?.state === 'recording') return;
  const task = currentTasks[currentTaskIndex];
  const shown = fullQuestion(task);
  const seconds = isReplay ? 5 : effectiveRevealSec(task);
  questionSeen = true;
  if (isReplay) replayUsed = true;
  $('questionDisplay').className = 'question-text';
  $('questionDisplay').textContent = shown;
  $('revealBtn').disabled = true;
  $('recordToggle').disabled = dbStatus !== 'ready';
  syncRecordingTargetHint(true);
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
  const recordingBusy = recordingStarting || recordingSaving || mediaRecorder?.state === 'recording' || dbStatus !== 'ready';
  $('recordToggle').disabled = recordingBusy;
  if (!recordingBusy) syncRecordingTargetHint(true);
  if (!replayUsed && !recordingBusy) {
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
  if (zipRestoreBusy) return;
  if (recordingStarting || recordingSaving || mediaRecorder?.state === 'recording') return;
  const task = currentTasks[currentTaskIndex];
  if (dbStatus !== 'ready') {
    setStorageIssue('db', {
      title: '녹음 저장소 사용 불가',
      message: '텍스트 학습은 계속할 수 있지만 녹음은 저장소 연결 후 사용할 수 있습니다.',
      retryable: true
    });
    return;
  }
  if (!window.isSecureContext && location.protocol !== 'localhost:') return showMicError({ name: 'SecurityError' });
  if (!navigator.mediaDevices?.getUserMedia) return showMicError({ name: 'UnsupportedError' });
  if (!window.MediaRecorder) return showMicError({ name: 'MediaRecorderUnsupported' });
  if (clipCache[recordingTarget] && !confirm(`${recordingTarget === 'first' ? '1차 답변' : '재도전'} 녹음을 덮어쓸까요?`)) return;
  const taskAtStart = task;
  const takeAtStart = recordingTarget;
  const sessionIdAtStart = currentSession.id;
  recordingStarting = true;
  $('takeFirst').disabled = true;
  $('takeRetry').disabled = true;
  if (revealInterval || $('questionDisplay').classList.contains('question-text')) hideQuestion();
  else {
    $('revealBtn').disabled = true;
    $('revealBtn').classList.add('hidden');
  }
  stopAllSpeech();
  try {
    $('recordLabel').textContent = '마이크 준비 중…';
    $('recordToggle').disabled = true;
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    currentMime = chooseMime();
    currentExt = extForMime(currentMime);
    mediaRecorder = new MediaRecorder(stream, currentMime ? { mimeType: currentMime } : undefined);
    const recorderAtStart = mediaRecorder;
    const chunks = [];
    recorderAtStart.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorderAtStart.onerror = event => showMicError(event.error || event);
    recorderAtStart.onstop = async () => {
      const duration = (performance.now() - recordStartAt) / 1000;
      const blob = new Blob(chunks, { type: recorderAtStart.mimeType || currentMime || 'audio/webm' });
      stopLiveResources();
      const createdAt = new Date().toISOString();
      const takeData = { duration, mime: blob.type, createdAt };
      const key = `${taskAtStart.id}:${takeAtStart}`;
      try {
        await dbPut({
          key,
          taskId: taskAtStart.id,
          source: taskAtStart.source,
          sessionId: sessionIdAtStart,
          take: takeAtStart,
          title: taskAtStart.title,
          blob,
          mime: blob.type,
          ext: extForMime(blob.type),
          metrics: takeData,
          createdAt
        });
        const record = ensureRecord(taskAtStart);
        record.takes = record.takes || {};
        record.takes[takeAtStart] = takeData;
        record.savedAt = createdAt;
        markSessionStarted(sessionIdAtStart);
        saveState();
        clearStorageIssue('recording');
        if (currentTasks[currentTaskIndex]?.id === taskAtStart.id) {
          try { await loadTakes(taskAtStart); } catch (_) {}
        }
        $('recordLabel').textContent = '녹음이 기기에 저장되었습니다.';
        if (taskAtStart.type === 'listening' && $('showPassage')) $('showPassage').classList.remove('hidden');
      } catch (error) {
        setStorageIssue('recording', {
          title: '녹음 저장 실패',
          message: `새 ${takeAtStart === 'first' ? '1차' : '재도전'} 녹음은 저장되지 않았습니다. 기존 녹음은 유지됩니다. 다시 녹음해 주세요.`,
          retryable: false
        });
        $('recordLabel').textContent = '녹음을 저장하지 못했습니다. 다시 녹음해 주세요.';
        $('micHelp').className = 'notice errornotice';
        $('micHelp').textContent = '새 녹음 저장에 실패했습니다. 기존 녹음은 그대로 유지됩니다.';
      } finally {
        recordingSaving = false;
        chunks.length = 0;
        $('recordToggle').disabled = dbStatus !== 'ready';
        if (!replayUsed) {
          $('revealBtn').textContent = '질문 1회 다시 보기';
          $('revealBtn').disabled = false;
          $('revealBtn').classList.remove('hidden');
        }
        syncRecordButton();
        renderStorageStats();
        syncAudioAvailability();
      }
    };
    recorderAtStart.start(250);
    recordingStarting = false;
    recordStartAt = performance.now();
    recordInterval = setInterval(() => { $('recordTimer').textContent = fmt((performance.now() - recordStartAt) / 1000); }, 250);
    $('recordLabel').innerHTML = '<span class="pulse"></span>녹음 중';
    $('recordToggle').disabled = false;
    syncRecordButton();
  } catch (error) {
    recordingStarting = false;
    stopLiveResources();
    $('recordToggle').disabled = false;
    if (questionSeen && !replayUsed) {
      $('revealBtn').textContent = '질문 1회 다시 보기';
      $('revealBtn').disabled = false;
      $('revealBtn').classList.remove('hidden');
    }
    syncRecordButton();
    syncAudioAvailability();
    showMicError(error);
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
  recordingSaving = true;
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
  if (recordingStarting || recordingSaving) return;
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
  if (audioOperationBusy() && which !== recordingTarget) return;
  recordingTarget = which;
  $('takeFirst').classList.toggle('selected', which === 'first');
  $('takeRetry').classList.toggle('selected', which === 'retry');
  syncRecordingTargetHint(questionSeen && !$('recordToggle').disabled);
}

function syncRecordingTargetHint(ready = false) {
  if (mediaRecorder?.state === 'recording') return;
  if (dbStatus !== 'ready') {
    $('recordLabel').textContent = '녹음 저장소를 사용할 수 없습니다. 위의 저장 안내에서 다시 시도해 주세요.';
    return;
  }
  const target = recordingTarget === 'first' ? '1차 녹음' : '재도전 녹음';
  const questionVisible = $('questionDisplay').classList.contains('question-text');
  $('recordLabel').textContent = ready
    ? questionVisible
      ? `저장 위치: ${target} · 준비되면 바로 녹음을 시작할 수 있습니다.`
      : `저장 위치: ${target} · 녹음 시작을 누르세요.`
    : `저장 위치: ${target} · 질문 확인 후 녹음을 시작하세요.`;
}
$('takeFirst').addEventListener('click', () => { setTake('first'); scheduleResumeSave(); });
$('takeRetry').addEventListener('click', () => { setTake('retry'); scheduleResumeSave(); });

function revokeClipUrls() {
  for (const take of ['first', 'retry']) {
    if (clipUrls[take]) URL.revokeObjectURL(clipUrls[take]);
    clipUrls[take] = null;
    clipCache[take] = null;
  }
}

async function loadTakes(task) {
  revokeClipUrls();
  if (dbStatus !== 'ready') {
    renderSavedTakes();
    return false;
  }
  try {
    for (const take of ['first', 'retry']) {
      const clip = await dbGet(`${task.id}:${take}`);
      clipCache[take] = clip || null;
      if (clip) clipUrls[take] = URL.createObjectURL(clip.blob);
    }
    renderSavedTakes();
    return true;
  } catch (error) {
    revokeClipUrls();
    setDBUnavailable('저장된 녹음을 읽을 수 없습니다.');
    return false;
  }
}

function renderSavedTakes() {
  const root = $('savedTakes');
  if (!root) return;
  if (dbStatus !== 'ready') {
    root.innerHTML = '<div class="notice errornotice">녹음 저장소를 사용할 수 없어 재생·삭제가 비활성화되었습니다.</div>';
    return;
  }
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
  if (dbStatus !== 'ready') return;
  const clip = clipCache[take];
  if (!clip) return;
  const link = document.createElement('a');
  link.href = clipUrls[take];
  link.download = `${currentTasks[currentTaskIndex].id}_${take}.${clip.ext || extForMime(clip.mime)}`;
  link.click();
}

async function deleteTake(take) {
  if (dbStatus !== 'ready') return setDBUnavailable('녹음 저장소가 준비되지 않았습니다.');
  if (!confirm(`${take === 'first' ? '1차 답변' : '재도전'} 녹음을 삭제할까요?`)) return;
  const task = currentTasks[currentTaskIndex];
  try {
    await dbDelete(`${task.id}:${take}`);
    const record = state.records[task.id];
    if (record?.takes) delete record.takes[take];
    saveState();
    await loadTakes(task);
    renderStorageStats();
  } catch (_) {
    setStorageIssue('recording', {
      title: '녹음 삭제 실패',
      message: '기존 녹음은 그대로 유지됩니다. 잠시 후 다시 시도해 주세요.',
      retryable: false
    });
  }
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
  const persisted = saveState();
  renderTaskNav();
  if (showMessage) toast(persisted ? '평가가 저장되었습니다.' : '평가는 화면에 반영됐지만 브라우저에 저장되지 않았습니다.');
  return true;
}

function saveBeforeNavigate() {
  if (stage === 'evaluation' && currentOutcome) saveCurrent(false);
  else saveDraft();
}

function showEvaluation() {
  if (blockWhileAudioBusy()) return;
  const hasAudio = !!clipCache.first || !!clipCache.retry;
  const hasTranscript = !!$('transcript').value.trim();
  if (!hasAudio && !hasTranscript && !confirm('녹음과 받아쓰기가 모두 비어 있습니다. 평가 화면으로 넘어갈까요?')) return;
  flushResumeSave(false);
  saveDraft();
  stage = 'evaluation';
  $('selfDiagnosisDetails').open = false;
  $('answerStrategyDetails').open = false;
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
$('transcript').addEventListener('input', scheduleResumeSave);
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

$('completeSession').addEventListener('click', async () => {
  state.completed[currentSession.id] = true;
  delete state.startedSessions[currentSession.id];
  state.sessionHistory[currentSession.id] = new Date().toISOString();
  if (state.resume?.sessionId === currentSession.id) state.resume = null;
  saveState();
  setTab('course', true);
  await updateStats();
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

document.getElementById('copyChatGPTStarterPrompt')?.addEventListener('click', () => {
  copyText(chatGPTStarterPromptText());
});

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
  if (!saveExpressionData()) $('expressionSaveStatus').textContent = '화면에는 반영됐지만 브라우저에 저장되지 않았습니다.';
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
  const persisted = saveExpressionData();
  closeExpressionEditModal();
  renderExpressionHub();
  toast(persisted ? '표현 카드를 수정했습니다.' : '수정 내용은 화면에만 반영됐습니다.');
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
  const persisted = saveExpressionData();
  closeExpressionDeleteModal();
  renderExpressionHub();
  toast(persisted ? '표현 카드를 삭제했습니다.' : '삭제 내용은 화면에만 반영됐습니다.');
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
  if (!$('zipImportModal').classList.contains('hidden')) closeZIPImportModal();
  if (!$('jsonImportModal').classList.contains('hidden')) closeJSONImportModal();
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
    if (dbStatus !== 'ready') return alert('녹음 저장소를 사용할 수 없어 녹음이 연결된 기록을 안전하게 삭제할 수 없습니다.');
    if (!confirm('텍스트 기록과 이 문제의 녹음을 모두 삭제할까요?')) return;
    try {
      await dbDeleteMany([`${button.dataset.del}:first`, `${button.dataset.del}:retry`]);
      delete state.records[button.dataset.del];
      saveState();
      renderRecords();
      renderStorageStats();
    } catch (_) {
      setStorageIssue('recording', {
        title: '기록 삭제 실패',
        message: '기존 텍스트와 녹음 기록은 유지됩니다. 잠시 후 다시 시도해 주세요.',
        retryable: false
      });
    }
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
$('darkMode')?.addEventListener('change', event => { const theme = event.target.checked ? 'dark' : 'light'; safeWriteText(THEME_KEY, theme); updateTheme(theme, true); });
$('questionVoice').addEventListener('change', event => { state.settings.questionVoice = event.target.value; saveState(); });
$('passageVoice').addEventListener('change', event => { state.settings.passageVoice = event.target.value; saveState(); });
$('sampleQuestionVoice').addEventListener('click', () => speakText('This is the question voice.', 'question'));
$('samplePassageVoice').addEventListener('click', () => speakText('This is the listening passage voice.', 'passage', syncPassageControls));

function importTaskCatalog() {
  const catalog = new Map();
  for (const session of SESSIONS) {
    const sets = buildTaskSets(session);
    for (const taskSet of ['core', 'booster']) {
      sets[taskSet].forEach((task, taskIndex) => catalog.set(task.id, { task, session, taskSet, taskIndex }));
    }
  }
  return catalog;
}

function inspectJSONComplexity(value, maxDepth = 10, maxNodes = 200000) {
  const stack = [[value, 0]];
  let nodes = 0;
  while (stack.length) {
    const [item, depth] = stack.pop();
    nodes += 1;
    if (nodes > maxNodes || depth > maxDepth) return false;
    if (item && typeof item === 'object') Object.values(item).forEach(child => stack.push([child, depth + 1]));
  }
  return true;
}

function importValidationStats() {
  return {
    unknownTaskIds: 0,
    invalidRecords: 0,
    repairedFields: 0,
    invalidCards: 0,
    remappedCardIds: 0,
    unknownSettings: 0,
    invalidStateEntries: 0,
    resumeInvalid: false,
    topLevelUnknown: 0,
    fileTypeWarning: false
  };
}

function normalizeImportedTake(value, stats) {
  if (!isPlainObject(value)) {
    stats.repairedFields += 1;
    return null;
  }
  if (!Number.isFinite(value.duration) || value.duration < 0 || typeof value.mime !== 'string' || typeof value.createdAt !== 'string') {
    stats.repairedFields += 1;
    return null;
  }
  return { duration: value.duration, mime: value.mime, createdAt: value.createdAt };
}

function normalizeImportedRecord(record, entry, stats) {
  if (!isPlainObject(record) || (record.transcript !== undefined && typeof record.transcript !== 'string')) {
    stats.invalidRecords += 1;
    return null;
  }
  const { task, session } = entry;
  const normalized = {
    id: task.id,
    sessionId: session.id,
    week: session.week,
    label: session.label,
    title: task.title,
    type: taskTypeName(task),
    question: fullQuestion(task),
    source: task.source,
    transcript: record.transcript || '',
    takes: {}
  };
  if (typeof record.savedAt === 'string') normalized.savedAt = record.savedAt;
  if (record.outcome === undefined || record.outcome === null) normalized.outcome = '';
  else if (record.outcome === '' || VALID_OUTCOMES.has(record.outcome)) normalized.outcome = record.outcome;
  else {
    normalized.outcome = '';
    stats.repairedFields += 1;
  }
  if (Number.isInteger(record.difficulty) && record.difficulty >= 0 && record.difficulty <= 5) normalized.difficulty = record.difficulty;
  else if (record.difficulty !== undefined) stats.repairedFields += 1;
  if (Number.isInteger(record.rating) && record.rating >= 1 && record.rating <= 5) normalized.rating = record.rating;
  else if (record.rating !== undefined) stats.repairedFields += 1;
  for (const key of ['retry', 'replayUsed']) {
    if (typeof record[key] === 'boolean') normalized[key] = record[key];
    else if (record[key] !== undefined) stats.repairedFields += 1;
  }
  const maxListenPlays = task.type === 'listening' ? (task.listenMax || 2) : 0;
  if (Number.isInteger(record.listenPlays) && record.listenPlays >= 0 && record.listenPlays <= maxListenPlays) normalized.listenPlays = record.listenPlays;
  else if (record.listenPlays !== undefined) stats.repairedFields += 1;
  if (record.bottlenecks !== undefined) {
    if (isPlainObject(record.bottlenecks)) {
      const groups = bottleneckDefinitions(task);
      const allowed = new Set([...groups.common, ...groups.typeSpecific].map(([key]) => key));
      normalized.bottlenecks = {};
      Object.entries(record.bottlenecks).forEach(([key, checked]) => {
        if (allowed.has(key) && typeof checked === 'boolean') normalized.bottlenecks[key] = checked;
        else stats.repairedFields += 1;
      });
    } else stats.repairedFields += 1;
  }
  if (record.checks !== undefined) {
    if (isPlainObject(record.checks)) {
      normalized.checks = {};
      Object.entries(record.checks).forEach(([key, checked]) => {
        if (/^[A-Za-z][A-Za-z0-9_-]{0,50}$/.test(key) && !['constructor', 'prototype', '__proto__'].includes(key) && typeof checked === 'boolean') normalized.checks[key] = checked;
        else stats.repairedFields += 1;
      });
    } else stats.repairedFields += 1;
  }
  if (record.takes !== undefined) {
    if (isPlainObject(record.takes)) {
      for (const take of ['first', 'retry']) {
        if (record.takes[take] !== undefined) {
          const normalizedTake = normalizeImportedTake(record.takes[take], stats);
          if (normalizedTake) normalized.takes[take] = normalizedTake;
        }
      }
      Object.keys(record.takes).filter(key => key !== 'first' && key !== 'retry').forEach(() => { stats.repairedFields += 1; });
    } else stats.repairedFields += 1;
  }
  return normalized;
}

function normalizeImportedSettings(value, stats) {
  const normalized = { ...defaultState.settings };
  if (value === undefined) return { value: normalized, included: false };
  if (!isPlainObject(value)) {
    stats.repairedFields += 1;
    return { value: normalized, included: true };
  }
  const allowedKeys = new Set(Object.keys(defaultState.settings));
  stats.unknownSettings += Object.keys(value).filter(key => !allowedKeys.has(key)).length;
  if (Number.isInteger(value.revealSec) && value.revealSec >= 5 && value.revealSec <= 30) normalized.revealSec = value.revealSec;
  else if (value.revealSec !== undefined) stats.repairedFields += 1;
  if ([0.8, 0.9, 0.95, 1, 1.1].includes(value.ttsRate)) normalized.ttsRate = value.ttsRate;
  else if (value.ttsRate !== undefined) stats.repairedFields += 1;
  for (const key of ['speakQuestion', 'darkMode']) {
    if (typeof value[key] === 'boolean') normalized[key] = value[key];
    else if (value[key] !== undefined) stats.repairedFields += 1;
  }
  for (const key of ['questionVoice', 'passageVoice']) {
    if (typeof value[key] === 'string' && value[key].length <= 500) normalized[key] = value[key];
    else if (value[key] !== undefined) stats.repairedFields += 1;
  }
  return { value: normalized, included: true };
}

function normalizeSessionFlagMap(value, validSessionIds, stats) {
  if (value === undefined) return {};
  if (!isPlainObject(value)) {
    stats.invalidStateEntries += 1;
    return {};
  }
  const normalized = {};
  Object.entries(value).forEach(([key, enabled]) => {
    if (validSessionIds.has(key) && enabled === true) normalized[key] = true;
    else stats.invalidStateEntries += 1;
  });
  return normalized;
}

function normalizeSessionHistory(value, validSessionIds, stats) {
  if (value === undefined) return {};
  if (!isPlainObject(value)) {
    stats.invalidStateEntries += 1;
    return {};
  }
  const normalized = {};
  Object.entries(value).forEach(([key, savedAt]) => {
    if (validSessionIds.has(key) && typeof savedAt === 'string') normalized[key] = savedAt;
    else stats.invalidStateEntries += 1;
  });
  return normalized;
}

function normalizeImportedResume(value, stats) {
  if (value === undefined || value === null) return { value: null, present: value !== undefined, valid: value === null };
  const validBase = isPlainObject(value)
    && typeof value.sessionId === 'string'
    && (value.taskSet === 'core' || value.taskSet === 'booster')
    && Number.isInteger(value.taskIndex)
    && typeof value.taskId === 'string'
    && typeof value.draftTranscript === 'string'
    && (value.recordingTarget === 'first' || value.recordingTarget === 'retry')
    && typeof value.updatedAt === 'string';
  if (validBase) {
    const session = SESSIONS.find(item => item.id === value.sessionId);
    if (session) {
      const sets = buildTaskSets(session);
      const tasks = sets[value.taskSet];
      if (value.taskIndex >= 0 && value.taskIndex < tasks.length && tasks[value.taskIndex]?.id === value.taskId) {
        return {
          value: {
            sessionId: value.sessionId,
            taskSet: value.taskSet,
            taskIndex: value.taskIndex,
            taskId: value.taskId,
            draftTranscript: value.draftTranscript,
            recordingTarget: value.recordingTarget,
            updatedAt: value.updatedAt
          },
          present: true,
          valid: true
        };
      }
    }
  }
  stats.resumeInvalid = true;
  return { value: null, present: true, valid: false };
}

function safeImportedExpressionId(value, usedIds, index, stats) {
  const reservedIds = new Set(['constructor', 'prototype', '__proto__']);
  let next = typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value) && !reservedIds.has(value) && !usedIds.has(value) ? value : '';
  if (!next) {
    stats.remappedCardIds += 1;
    next = `expr-import-${index + 1}`;
    let suffix = 1;
    while (usedIds.has(next)) next = `expr-import-${index + 1}-${suffix++}`;
  }
  usedIds.add(next);
  return next;
}

function normalizeExpressionReviewMeta(value, stats) {
  if (value === undefined) return { streak: 0, nextDueAt: 0, lastResult: '', lastReviewedAt: '' };
  if (!isPlainObject(value)) {
    stats.repairedFields += 1;
    return { streak: 0, nextDueAt: 0, lastResult: '', lastReviewedAt: '' };
  }
  const streak = Number.isInteger(value.streak) && value.streak >= 0 && value.streak <= 100 ? value.streak : 0;
  const nextDueAt = Number.isFinite(value.nextDueAt) && value.nextDueAt >= 0 ? value.nextDueAt : 0;
  const lastResult = ['', 'again', 'assisted', 'good', 'reset'].includes(value.lastResult) ? value.lastResult : '';
  const lastReviewedAt = typeof value.lastReviewedAt === 'string' ? value.lastReviewedAt : '';
  if (streak !== value.streak || nextDueAt !== value.nextDueAt || lastResult !== value.lastResult || lastReviewedAt !== value.lastReviewedAt) stats.repairedFields += 1;
  return { streak, nextDueAt, lastResult, lastReviewedAt };
}

function normalizeImportedExpressions(cardsValue, reviewValue, taskCatalog, validSessionIds, stats) {
  const cardsIncluded = cardsValue !== undefined;
  const reviewIncluded = reviewValue !== undefined;
  if (cardsIncluded && !Array.isArray(cardsValue)) return { fatal: 'expressionCards는 배열이어야 합니다.' };
  if (reviewIncluded && !isPlainObject(reviewValue)) return { fatal: 'expressionReview는 객체여야 합니다.' };
  if (!cardsIncluded && !reviewIncluded) return { cards: null, review: null, included: false };
  const sourceCards = cardsIncluded ? cardsValue : expressionCards;
  const usedIds = new Set();
  const idMap = new Map();
  const cards = [];
  sourceCards.forEach((card, index) => {
    if (!cardsIncluded) {
      if (isPlainObject(card) && typeof card.id === 'string') {
        cards.push(card);
        idMap.set(card.id, card.id);
        usedIds.add(card.id);
      }
      return;
    }
    if (!isPlainObject(card) || typeof card.expression !== 'string' || !card.expression.trim()) {
      stats.invalidCards += 1;
      return;
    }
    const id = safeImportedExpressionId(card.id, usedIds, index, stats);
    if (typeof card.id === 'string' && !idMap.has(card.id)) idMap.set(card.id, id);
    cards.push({
      id,
      expression: card.expression,
      cue: typeof card.cue === 'string' ? card.cue : '',
      example: typeof card.example === 'string' ? card.example : '',
      category: EXPRESSION_CATEGORIES.includes(card.category) ? card.category : '기타',
      sourceTaskId: typeof card.sourceTaskId === 'string' && taskCatalog.has(card.sourceTaskId) ? card.sourceTaskId : '',
      sourceSessionId: typeof card.sourceSessionId === 'string' && validSessionIds.has(card.sourceSessionId) ? card.sourceSessionId : '',
      sourceTitle: typeof card.sourceTitle === 'string' ? card.sourceTitle : '',
      createdAt: typeof card.createdAt === 'string' ? card.createdAt : '',
      updatedAt: typeof card.updatedAt === 'string' ? card.updatedAt : ''
    });
  });
  const sourceReview = reviewIncluded ? reviewValue : {};
  const review = Object.create(null);
  if (reviewIncluded) {
    cards.forEach(card => {
      const originalId = [...idMap.entries()].find(([, nextId]) => nextId === card.id)?.[0] || card.id;
      review[card.id] = normalizeExpressionReviewMeta(sourceReview[originalId], stats);
    });
    Object.keys(sourceReview).filter(id => !idMap.has(id) && !usedIds.has(id)).forEach(() => { stats.repairedFields += 1; });
  }
  return { cards: cardsIncluded ? cards : null, review: reviewIncluded ? review : null, included: true, cardsIncluded, reviewIncluded };
}

function importWarnings(stats) {
  const warnings = [];
  if (stats.fileTypeWarning) warnings.push('파일 확장자 또는 MIME은 일반 JSON과 다르지만 내용 검증을 기준으로 처리했습니다.');
  if (stats.unknownTaskIds) warnings.push(`현재 앱에 없는 문제 ID ${stats.unknownTaskIds}건은 제외됩니다.`);
  if (stats.invalidRecords) warnings.push(`구조가 잘못된 답변 기록 ${stats.invalidRecords}건은 제외됩니다.`);
  if (stats.invalidCards) warnings.push(`구조가 잘못된 표현 카드 ${stats.invalidCards}건은 제외됩니다.`);
  if (stats.remappedCardIds) warnings.push(`안전하지 않거나 중복된 표현 카드 ID ${stats.remappedCardIds}건은 새 내부 ID로 바뀝니다.`);
  if (stats.resumeInvalid) warnings.push('이어서 하기 위치가 유효하지 않아 resume만 제외됩니다.');
  if (stats.unknownSettings) warnings.push(`알 수 없는 설정 ${stats.unknownSettings}개는 무시됩니다.`);
  if (stats.invalidStateEntries) warnings.push(`유효하지 않은 회차·기록 상태 ${stats.invalidStateEntries}건은 제외됩니다.`);
  if (stats.repairedFields) warnings.push(`자료형이나 허용 범위가 잘못된 선택 필드 ${stats.repairedFields}건은 기본값 또는 빈 값으로 정리됩니다.`);
  if (stats.topLevelUnknown) warnings.push(`현재 형식에서 사용하지 않는 최상위 항목 ${stats.topLevelUnknown}개는 무시됩니다.`);
  return warnings;
}

function validateJSONBackup(imported, file) {
  if (!isPlainObject(imported)) return { ok: false, title: 'JSON 최상위 구조 오류', message: '백업의 최상위 값은 객체여야 합니다. 다른 백업 파일을 선택해 주세요.' };
  if (imported.format === undefined) return { ok: false, title: '백업 형식 정보 없음', message: 'format이 없는 파일은 공식 지원 대상이 아닙니다. 현재 앱에서 다시 내보낸 JSON을 사용해 주세요.' };
  if (imported.format !== 'spa45-records-v3') return { ok: false, title: '지원하지 않는 백업 형식', message: `이 앱은 spa45-records-v3 형식만 가져올 수 있습니다.` };
  if (!isPlainObject(imported.state)) return { ok: false, title: '필수 state 누락', message: '백업에 정상적인 state 객체가 없습니다. 다른 백업 파일을 선택해 주세요.' };
  if (!inspectJSONComplexity(imported)) return { ok: false, title: 'JSON 구조가 너무 복잡함', message: '예상보다 지나치게 깊거나 큰 구조입니다. 현재 앱에서 다시 내보낸 백업을 사용해 주세요.' };
  if (!isPlainObject(imported.state.records)) return { ok: false, title: '답변 기록 구조 오류', message: 'state.records는 문제 ID를 키로 사용하는 객체여야 합니다.' };

  const stats = importValidationStats();
  const extension = file.name.toLowerCase().endsWith('.json');
  const mime = !file.type || file.type === 'application/json' || file.type === 'text/json' || file.type === 'text/plain';
  stats.fileTypeWarning = !extension || !mime;
  const knownTopLevel = new Set(['format', 'exportedAt', 'state', 'expressionCards', 'expressionReview', 'note']);
  stats.topLevelUnknown = Object.keys(imported).filter(key => !knownTopLevel.has(key)).length;
  if (imported.exportedAt !== undefined && typeof imported.exportedAt !== 'string') stats.repairedFields += 1;

  const taskCatalog = importTaskCatalog();
  const validSessionIds = new Set(SESSIONS.map(session => session.id));
  const records = {};
  Object.entries(imported.state.records).forEach(([taskId, record]) => {
    const entry = taskCatalog.get(taskId);
    if (!entry) {
      stats.unknownTaskIds += 1;
      return;
    }
    const normalized = normalizeImportedRecord(record, entry, stats);
    if (normalized) records[taskId] = normalized;
  });
  const settings = normalizeImportedSettings(imported.state.settings, stats);
  const resume = normalizeImportedResume(imported.state.resume, stats);
  const reviewMeta = {};
  if (imported.state.reviewMeta !== undefined) {
    if (isPlainObject(imported.state.reviewMeta)) {
      Object.entries(imported.state.reviewMeta).forEach(([taskId, meta]) => {
        if (taskCatalog.has(taskId) && isPlainObject(meta)) reviewMeta[taskId] = clone(meta);
        else stats.invalidStateEntries += 1;
      });
    } else stats.invalidStateEntries += 1;
  }
  const nextState = {
    ...clone(defaultState),
    contentVersion: typeof imported.state.contentVersion === 'string' ? imported.state.contentVersion : defaultState.contentVersion,
    settings: settings.value,
    records,
    reviewMeta,
    completed: normalizeSessionFlagMap(imported.state.completed, validSessionIds, stats),
    startedSessions: normalizeSessionFlagMap(imported.state.startedSessions, validSessionIds, stats),
    sessionHistory: normalizeSessionHistory(imported.state.sessionHistory, validSessionIds, stats),
    lastSession: typeof imported.state.lastSession === 'string' && validSessionIds.has(imported.state.lastSession) ? imported.state.lastSession : null,
    resume: resume.value
  };
  if (imported.state.lastSession !== undefined && imported.state.lastSession !== null && nextState.lastSession === null) stats.invalidStateEntries += 1;
  const expressions = normalizeImportedExpressions(imported.expressionCards, imported.expressionReview, taskCatalog, validSessionIds, stats);
  if (expressions.fatal) return { ok: false, title: '표현 데이터 구조 오류', message: `${expressions.fatal} 현재 앱에서 다시 내보낸 백업을 사용해 주세요.` };
  const warnings = importWarnings(stats);
  const excludedCount = stats.unknownTaskIds + stats.invalidRecords + stats.invalidCards + stats.repairedFields + stats.invalidStateEntries;
  const evaluatedCount = Object.values(records).filter(record => ['fail', 'partial', 'success'].includes(record.outcome)).length;
  const draftCount = Object.values(records).filter(record => !!record.transcript).length;
  const exportedDate = typeof imported.exportedAt === 'string' && !Number.isNaN(new Date(imported.exportedAt).getTime())
    ? new Date(imported.exportedAt)
    : (file.lastModified ? new Date(file.lastModified) : null);
  return {
    ok: true,
    normalized: { state: nextState, expressions },
    preview: {
      format: imported.format,
      exportedDate,
      recordCount: Object.keys(records).length,
      evaluatedCount,
      draftCount,
      resumeStatus: stats.resumeInvalid ? 'invalid' : (resume.value ? 'valid' : 'none'),
      settingsIncluded: settings.included,
      excludedCount,
      warningCount: warnings.length,
      warnings,
      expressionsIncluded: expressions.included
    }
  };
}

function resetJSONImportUI() {
  pendingJSONImport = null;
  $('importData').value = '';
  $('jsonImportApplyStatus').textContent = '';
}

function closeJSONImportModal() {
  setModalOpen($('jsonImportModal'), false);
  resetJSONImportUI();
}

function renderJSONImportPreview(file, result) {
  $('jsonImportFileName').textContent = `${file.name} · ${bytesText(file.size)}`;
  $('jsonImportFatal').classList.toggle('hidden', result.ok);
  $('jsonImportSummary').classList.toggle('hidden', !result.ok);
  $('jsonImportMode').classList.toggle('hidden', !result.ok);
  $('jsonImportWarnings').classList.toggle('hidden', !result.ok || !result.preview.warnings.length);
  $('confirmJsonImport').disabled = !result.ok;
  if (!result.ok) {
    $('jsonImportFatal').textContent = `${result.title}: ${result.message}`;
    $('jsonImportWarningList').replaceChildren();
  } else {
    const preview = result.preview;
    $('jsonImportFormat').textContent = preview.format;
    $('jsonImportDate').textContent = preview.exportedDate ? preview.exportedDate.toLocaleString('ko-KR') : '날짜 정보 없음';
    $('jsonImportRecords').textContent = `${preview.recordCount}개`;
    $('jsonImportCompleted').textContent = `${preview.evaluatedCount}개`;
    $('jsonImportDrafts').textContent = `${preview.draftCount}개`;
    $('jsonImportResume').textContent = preview.resumeStatus === 'valid' ? '유효함' : preview.resumeStatus === 'invalid' ? '제외 예정' : '없음';
    $('jsonImportSettings').textContent = preview.settingsIncluded ? '포함됨' : '기본값 사용';
    $('jsonImportExcluded').textContent = `${preview.excludedCount}개 · 경고 ${preview.warningCount}건`;
    $('jsonImportMode').textContent = `현재 텍스트 기록을 교체합니다. ${preview.expressionsIncluded ? '백업에 포함된 표현 데이터도 교체합니다.' : '표현 데이터는 포함되지 않아 현재 값을 유지합니다.'} IndexedDB 녹음은 변경하지 않습니다.`;
    const warningList = $('jsonImportWarningList');
    warningList.replaceChildren();
    preview.warnings.forEach(message => {
      const item = document.createElement('li');
      item.textContent = message;
      warningList.appendChild(item);
    });
  }
  setModalOpen($('jsonImportModal'), true);
  requestAnimationFrame(() => (result.ok ? $('cancelJsonImport') : $('closeJsonImport')).focus());
}

async function prepareJSONImport(file) {
  pendingJSONImport = null;
  if (zipValidationBusy || zipRestoreBusy || zipExportBusy) {
    $('importData').value = '';
    return;
  }
  if (!file) return;
  if (!file.size) return renderJSONImportPreview(file, { ok: false, title: '빈 파일', message: '내용이 없는 파일입니다. 다른 JSON 백업을 선택해 주세요.' });
  if (file.size > MAX_JSON_IMPORT_BYTES) return renderJSONImportPreview(file, { ok: false, title: '파일이 너무 큼', message: 'JSON 백업은 최대 10MB까지 확인할 수 있습니다. 현재 앱에서 다시 내보낸 파일인지 확인해 주세요.' });
  let text;
  try {
    text = await file.text();
  } catch (_) {
    return renderJSONImportPreview(file, { ok: false, title: '파일 읽기 실패', message: '파일을 읽을 수 없습니다. 파일 권한을 확인하거나 다른 백업을 선택해 주세요.' });
  }
  if (!text.trim()) return renderJSONImportPreview(file, { ok: false, title: '빈 파일', message: 'JSON 내용이 없습니다. 다른 백업을 선택해 주세요.' });
  let imported;
  try {
    imported = JSON.parse(text);
  } catch (_) {
    return renderJSONImportPreview(file, { ok: false, title: 'JSON 문법 오류', message: 'JSON으로 해석할 수 없습니다. 파일을 다시 내보내거나 다른 백업을 선택해 주세요.' });
  } finally {
    text = null;
  }
  let result;
  try {
    result = validateJSONBackup(imported, file);
  } catch (_) {
    imported = null;
    return renderJSONImportPreview(file, { ok: false, title: '백업 검증 실패', message: '백업 내용을 안전하게 확인하지 못했습니다. 현재 앱에서 다시 내보낸 JSON이나 다른 백업 파일을 선택해 주세요.' });
  }
  imported = null;
  if (result.ok) pendingJSONImport = result.normalized;
  renderJSONImportPreview(file, result);
}

function serializeImportEntries(bundle) {
  const entries = [{ key: STORE_KEY, value: bundle.state }];
  if (bundle.expressions.cards !== null) entries.push({ key: EXPRESSION_CARDS_KEY, value: bundle.expressions.cards });
  if (bundle.expressions.review !== null) entries.push({ key: EXPRESSION_REVIEW_KEY, value: bundle.expressions.review });
  return entries.map(entry => ({ ...entry, serialized: JSON.stringify(entry.value) }));
}

function commitJSONImport(bundle) {
  let entries;
  try {
    entries = serializeImportEntries(bundle);
  } catch (error) {
    storageWriteIssue(STORE_KEY, error, 'serialize');
    return false;
  }
  const originals = new Map();
  try {
    entries.forEach(entry => originals.set(entry.key, localStorage.getItem(entry.key)));
  } catch (error) {
    storageWriteIssue(STORE_KEY, error, 'write');
    return false;
  }
  const written = [];
  try {
    for (const entry of entries) {
      localStorage.setItem(entry.key, entry.serialized);
      written.push(entry.key);
    }
  } catch (error) {
    let rollbackFailed = false;
    for (const key of written.reverse()) {
      try {
        const original = originals.get(key);
        if (original === null) localStorage.removeItem(key);
        else localStorage.setItem(key, original);
      } catch (_) {
        rollbackFailed = true;
      }
    }
    storageWriteIssue(STORE_KEY, error, 'write');
    if (rollbackFailed) setStorageIssue('import-rollback', {
      title: '가져오기 복구 확인 필요',
      message: '저장 실패 후 기존 값을 되돌리는 과정도 완료되지 않았습니다. 현재 탭을 닫지 말고 다른 백업을 보관해 주세요.',
      retryable: false
    });
    return false;
  }
  entries.forEach(entry => {
    storageReadBlocks.delete(entry.key);
    storageIssues.delete(`read:${entry.key}`);
    storageIssues.delete(`write:${entry.key}`);
  });
  storageIssues.delete('import-rollback');
  renderStorageAlert();
  return true;
}

async function applyPendingJSONImport() {
  if (!pendingJSONImport) return;
  $('confirmJsonImport').disabled = true;
  $('jsonImportApplyStatus').textContent = '검증된 백업을 저장하고 있습니다.';
  if (!commitJSONImport(pendingJSONImport)) {
    $('jsonImportApplyStatus').textContent = '브라우저 저장에 실패했습니다. 저장소 설정을 확인한 뒤 다시 시도하거나 취소해 주세요.';
    $('confirmJsonImport').disabled = false;
    return;
  }
  const next = pendingJSONImport;
  state = next.state;
  if (next.expressions.cards !== null) expressionCards = next.expressions.cards;
  if (next.expressions.review !== null) expressionReview = next.expressions.review;
  syncSettings();
  renderRecords();
  await updateStats();
  closeJSONImportModal();
  toast('검증된 JSON 기록을 가져왔습니다.');
}

function exportJSON() {
  if (zipValidationBusy || zipRestoreBusy || zipExportBusy) return;
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
$('importData').addEventListener('change', event => prepareJSONImport(event.target.files?.[0]));
$('closeJsonImport').addEventListener('click', closeJSONImportModal);
$('cancelJsonImport').addEventListener('click', closeJSONImportModal);
$('confirmJsonImport').addEventListener('click', applyPendingJSONImport);
document.querySelector('[data-close-json-import]').addEventListener('click', closeJSONImportModal);

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

function zipImportError(title, message) {
  const error = new Error(message);
  error.userTitle = title;
  error.userMessage = message;
  return error;
}

function zipPathError(path) {
  if (typeof path !== 'string' || !path || path.length > MAX_ZIP_PATH_LENGTH) return '비어 있거나 지나치게 긴 경로';
  if (/[\0-\x1F\x7F]/.test(path)) return '제어문자가 포함된 경로';
  if (path.includes('\\')) return '역슬래시가 포함된 경로';
  if (path.startsWith('/') || path.startsWith('//') || /^[A-Za-z]:/.test(path) || /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(path)) return '절대·URL 형태 경로';
  const target = path.endsWith('/') ? path.slice(0, -1) : path;
  const segments = target.split('/');
  if (!target || segments.some(segment => !segment || segment === '.' || segment === '..')) return '경로 순회 또는 빈 경로 조각';
  return '';
}

function inspectZIPCentralDirectory(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const minimum = Math.max(0, bytes.length - 65557);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw zipImportError('ZIP 형식 오류', 'ZIP 중앙 디렉터리를 찾을 수 없습니다. 다른 백업 파일을 선택해 주세요.');
  const disk = view.getUint16(eocd + 4, true);
  const centralDisk = view.getUint16(eocd + 6, true);
  const diskEntries = view.getUint16(eocd + 8, true);
  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (disk || centralDisk || diskEntries !== entryCount) throw zipImportError('지원하지 않는 ZIP', '여러 디스크로 나뉜 ZIP은 복원할 수 없습니다. 현재 앱에서 다시 백업해 주세요.');
  if (entryCount === 0xFFFF || centralSize === 0xFFFFFFFF || centralOffset === 0xFFFFFFFF) throw zipImportError('지원하지 않는 ZIP', 'ZIP64 형식은 이번 버전에서 지원하지 않습니다. 더 작은 백업을 선택해 주세요.');
  if (entryCount > MAX_ZIP_ENTRIES) throw zipImportError('ZIP 항목 수 초과', `압축 항목은 최대 ${MAX_ZIP_ENTRIES}개까지 복원할 수 있습니다.`);
  if (centralOffset + centralSize > eocd || centralOffset < 0) throw zipImportError('ZIP 구조 오류', 'ZIP 중앙 디렉터리 위치가 올바르지 않습니다.');
  const decoder = new TextDecoder('utf-8');
  const entries = [];
  const names = new Set();
  let totalUncompressed = 0;
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw zipImportError('ZIP 구조 오류', '압축 항목 목록이 손상되었습니다. 다른 백업을 선택해 주세요.');
    const flags = view.getUint16(offset + 8, true);
    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const next = offset + 46 + nameLength + extraLength + commentLength;
    if (next > bytes.length) throw zipImportError('ZIP 구조 오류', '압축 항목 이름이나 메타데이터가 잘렸습니다.');
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const pathIssue = zipPathError(name);
    if (pathIssue) throw zipImportError('안전하지 않은 ZIP 경로', `ZIP 안에서 ${pathIssue} 항목을 발견해 복원을 중단했습니다.`);
    const folded = name.toLocaleLowerCase('en-US');
    if (names.has(folded)) throw zipImportError('중복 ZIP 경로', '동일하거나 대소문자만 다른 압축 경로가 둘 이상 있습니다.');
    names.add(folded);
    if (flags & 1) throw zipImportError('암호화 ZIP 미지원', '암호화된 압축 항목은 복원할 수 없습니다. 암호 없이 다시 백업해 주세요.');
    if (compression !== 0 && compression !== 8) throw zipImportError('지원하지 않는 압축 방식', '현재 앱은 저장 또는 DEFLATE 방식 ZIP만 복원할 수 있습니다.');
    if (uncompressedSize > 1024 * 1024 && (!compressedSize || uncompressedSize / compressedSize > MAX_ZIP_COMPRESSION_RATIO)) {
      throw zipImportError('비정상 압축률', '압축률이 지나치게 높은 항목이 있어 ZIP 폭탄 위험으로 복원을 중단했습니다.');
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES) throw zipImportError('압축 해제 크기 초과', `압축 해제 후 전체 데이터는 ${bytesText(MAX_ZIP_UNCOMPRESSED_BYTES)} 이하여야 합니다.`);
    entries.push({ name, directory: name.endsWith('/'), compressedSize, uncompressedSize, flags, compression });
    offset = next;
  }
  if (offset !== centralOffset + centralSize) throw zipImportError('ZIP 구조 오류', '압축 항목 목록의 크기가 중앙 디렉터리 정보와 일치하지 않습니다.');
  return { entries, totalUncompressed };
}

function normalizedAudioMime(value = '') {
  if (typeof value !== 'string' || value.length > 200) return null;
  const mime = value.trim().toLowerCase();
  const base = mime.split(';')[0];
  const allowed = new Set(['', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/x-wav']);
  return allowed.has(base) ? { mime, base } : null;
}

function audioExtensionKind(extension) {
  const value = String(extension || '').toLowerCase();
  if (value === 'webm') return 'webm';
  if (value === 'ogg' || value === 'oga') return 'ogg';
  if (value === 'm4a' || value === 'mp4') return 'mp4';
  if (value === 'wav') return 'wav';
  return '';
}

function audioMimeKind(base) {
  if (base === 'audio/webm') return 'webm';
  if (base === 'audio/ogg') return 'ogg';
  if (base === 'audio/mp4' || base === 'audio/m4a' || base === 'audio/x-m4a') return 'mp4';
  if (base === 'audio/wav' || base === 'audio/x-wav') return 'wav';
  return '';
}

function detectAudioContainer(data) {
  if (data.length >= 4 && data[0] === 0x1A && data[1] === 0x45 && data[2] === 0xDF && data[3] === 0xA3) return 'webm';
  if (data.length >= 4 && String.fromCharCode(...data.subarray(0, 4)) === 'OggS') return 'ogg';
  if (data.length >= 12 && String.fromCharCode(...data.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...data.subarray(8, 12)) === 'WAVE') return 'wav';
  if (data.length >= 12 && String.fromCharCode(...data.subarray(4, 8)) === 'ftyp') return 'mp4';
  return '';
}

function mimeForAudioKind(kind) {
  return kind === 'ogg' ? 'audio/ogg' : kind === 'mp4' ? 'audio/mp4' : kind === 'wav' ? 'audio/wav' : 'audio/webm';
}

function createZIPValidationStats() {
  return { excludedAudio: 0, missingRecords: 0, invalidEntries: 0, missingFiles: 0, sizeMismatch: 0, hashMismatch: 0, mimeRepaired: 0, signatureUnknown: 0, metadataRebuilt: 0, missingTakeRefs: 0, extraFiles: 0 };
}

function zipValidationWarnings(stats) {
  const warnings = [];
  if (stats.invalidEntries) warnings.push(`키·경로·MIME 형식이 잘못된 녹음 ${stats.invalidEntries}개는 제외됩니다.`);
  if (stats.missingRecords) warnings.push(`텍스트 기록이 없는 녹음 ${stats.missingRecords}개는 제외됩니다.`);
  if (stats.missingFiles) warnings.push(`ZIP에서 읽을 수 없는 녹음 ${stats.missingFiles}개는 제외됩니다.`);
  if (stats.sizeMismatch) warnings.push(`크기 정보가 일치하지 않는 녹음 ${stats.sizeMismatch}개는 제외됩니다.`);
  if (stats.hashMismatch) warnings.push(`무결성 해시가 일치하지 않는 녹음 ${stats.hashMismatch}개는 제외됩니다.`);
  if (stats.mimeRepaired) warnings.push(`MIME 정보가 비어 있어 파일 형식으로 보완한 녹음 ${stats.mimeRepaired}개가 있습니다.`);
  if (stats.signatureUnknown) warnings.push(`파일 시그니처를 확정하지 못한 녹음 ${stats.signatureUnknown}개는 크기·MIME·해시 검증을 기준으로 복원합니다.`);
  if (stats.metadataRebuilt) warnings.push(`Blob은 있지만 takes 정보가 없는 녹음 ${stats.metadataRebuilt}개의 메타데이터를 실제 파일 기준으로 복원합니다.`);
  if (stats.missingTakeRefs) warnings.push(`takes 정보는 있지만 실제 Blob이 없는 녹음 ${stats.missingTakeRefs}개는 녹음 없음으로 정리됩니다.`);
  if (stats.extraFiles) warnings.push(`manifest에 없는 추가 파일 ${stats.extraFiles}개는 무시합니다.`);
  return warnings;
}

function validateZIPManifestHeader(manifest) {
  if (!isPlainObject(manifest)) throw zipImportError('manifest 구조 오류', 'manifest.json의 최상위 값은 객체여야 합니다.');
  if (!inspectJSONComplexity(manifest, 10, 50000)) throw zipImportError('manifest 구조가 너무 복잡함', 'manifest가 지나치게 깊거나 큽니다. 현재 앱에서 다시 백업해 주세요.');
  if (manifest.format !== 'spa45-backup') throw zipImportError('지원하지 않는 manifest', 'ZIP format이 spa45-backup이 아닙니다.');
  if (manifest.version !== 1) throw zipImportError('지원하지 않는 manifest 버전', 'manifest version 1 백업만 복원할 수 있습니다.');
  if (!Array.isArray(manifest.entries)) throw zipImportError('manifest 항목 오류', 'manifest.entries는 배열이어야 합니다.');
  if (manifest.entries.length > MAX_ZIP_ENTRIES) throw zipImportError('manifest 항목 수 초과', `manifest 녹음 항목은 최대 ${MAX_ZIP_ENTRIES}개까지 허용됩니다.`);
  if (manifest.createdAt !== undefined && typeof manifest.createdAt !== 'string') throw zipImportError('manifest 날짜 오류', 'manifest 생성 시각의 자료형이 올바르지 않습니다.');
  if (manifest.clipCount !== undefined && (!Number.isInteger(manifest.clipCount) || manifest.clipCount !== manifest.entries.length)) throw zipImportError('manifest 개수 불일치', 'clipCount와 entries 개수가 일치하지 않습니다.');
}

function validateZIPManifest(manifest, central, jsonResult, stats) {
  validateZIPManifestHeader(manifest);
  const centralMap = new Map(central.entries.map(entry => [entry.name, entry]));
  const taskCatalog = importTaskCatalog();
  const seenKeys = new Set();
  const seenFiles = new Set();
  const referencedFiles = new Set(['manifest.json', 'records.json']);
  const candidates = [];
  for (const entry of manifest.entries) {
    if (!isPlainObject(entry) || typeof entry.key !== 'string' || typeof entry.file !== 'string') {
      stats.invalidEntries += 1;
      stats.excludedAudio += 1;
      continue;
    }
    if (seenKeys.has(entry.key)) throw zipImportError('중복 녹음 키', `동일한 녹음 키가 둘 이상 있어 어느 파일이 맞는지 판단할 수 없습니다.`);
    if (seenFiles.has(entry.file.toLocaleLowerCase('en-US'))) throw zipImportError('중복 manifest 경로', 'manifest에서 하나의 파일을 여러 녹음이 공유하고 있습니다.');
    seenKeys.add(entry.key);
    seenFiles.add(entry.file.toLocaleLowerCase('en-US'));
    referencedFiles.add(entry.file);
    const separator = entry.key.lastIndexOf(':');
    const taskId = separator > 0 ? entry.key.slice(0, separator) : '';
    const take = separator > 0 ? entry.key.slice(separator + 1) : '';
    const catalogEntry = taskCatalog.get(taskId);
    const archived = centralMap.get(entry.file);
    if (!archived || archived.directory) throw zipImportError('manifest 파일 누락', 'manifest에 기록된 녹음 파일이 ZIP에 없거나 디렉터리로만 존재합니다. 다른 백업을 선택해 주세요.');
    const extension = entry.file.includes('.') ? entry.file.split('.').pop().toLowerCase() : '';
    const extensionKind = audioExtensionKind(extension);
    const mime = normalizedAudioMime(entry.mime === undefined ? '' : entry.mime);
    const expectedPrefix = `audio/${taskId}_${take}.`;
    const validKey = !!catalogEntry && (take === 'first' || take === 'retry');
    const validMetadata = (entry.taskId === undefined || entry.taskId === taskId) && (entry.take === undefined || entry.take === take);
    const validPath = !zipPathError(entry.file) && entry.file.startsWith(expectedPrefix) && entry.file.indexOf('/', 6) < 0 && !!extensionKind;
    const validBytes = Number.isInteger(entry.bytes) && entry.bytes > 0;
    const mimeKind = mime ? audioMimeKind(mime.base) : '';
    const mimeMatchesExtension = mime && (!mimeKind || mimeKind === extensionKind);
    if (!validKey || !validMetadata || !validPath || !validBytes || !mimeMatchesExtension || !archived || archived.directory) {
      if (!archived || archived?.directory) stats.missingFiles += 1;
      else stats.invalidEntries += 1;
      stats.excludedAudio += 1;
      continue;
    }
    if (archived.uncompressedSize !== entry.bytes || entry.bytes > MAX_ZIP_AUDIO_BYTES) {
      stats.sizeMismatch += 1;
      stats.excludedAudio += 1;
      continue;
    }
    if (entry.sha256 !== undefined && entry.sha256 !== null && (typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(entry.sha256))) {
      stats.invalidEntries += 1;
      stats.excludedAudio += 1;
      continue;
    }
    if (!jsonResult.normalized.state.records[taskId]) {
      stats.missingRecords += 1;
      stats.excludedAudio += 1;
      continue;
    }
    candidates.push({ entry, taskId, take, catalogEntry, extension, extensionKind, mime, archived });
  }
  central.entries.filter(entry => !entry.directory && !referencedFiles.has(entry.name)).forEach(() => { stats.extraFiles += 1; });
  return candidates;
}

async function extractZIPAudio(zip, candidates, jsonState, manifestCreatedAt, stats) {
  const clips = [];
  const restoredKeys = new Set();
  const expectedKeys = new Set();
  Object.entries(jsonState.records).forEach(([taskId, record]) => {
    for (const take of ['first', 'retry']) if (record.takes?.[take]) expectedKeys.add(`${taskId}:${take}`);
  });
  for (const candidate of candidates) {
    let data;
    try {
      data = await zip.file(candidate.entry.file).async('uint8array');
    } catch (_) {
      stats.missingFiles += 1;
      stats.excludedAudio += 1;
      continue;
    }
    if (!data.byteLength || data.byteLength !== candidate.entry.bytes) {
      stats.sizeMismatch += 1;
      stats.excludedAudio += 1;
      data = null;
      continue;
    }
    if (candidate.entry.sha256) {
      const hash = await sha256Hex(data);
      if (hash && hash !== candidate.entry.sha256.toLowerCase()) {
        stats.hashMismatch += 1;
        stats.excludedAudio += 1;
        data = null;
        continue;
      }
    }
    const detectedKind = detectAudioContainer(data);
    const declaredKind = candidate.mime ? audioMimeKind(candidate.mime.base) : '';
    if (detectedKind && declaredKind && detectedKind !== declaredKind) {
      stats.invalidEntries += 1;
      stats.excludedAudio += 1;
      data = null;
      continue;
    }
    if (!detectedKind) stats.signatureUnknown += 1;
    let finalMime = candidate.mime?.mime || '';
    if (!finalMime) {
      finalMime = mimeForAudioKind(detectedKind || candidate.extensionKind);
      stats.mimeRepaired += 1;
    }
    const record = jsonState.records[candidate.taskId];
    const jsonTake = record.takes?.[candidate.take];
    const metrics = isPlainObject(candidate.entry.metrics) ? candidate.entry.metrics : {};
    const duration = Number.isFinite(metrics.duration) && metrics.duration >= 0 ? metrics.duration : (Number.isFinite(jsonTake?.duration) ? jsonTake.duration : 0);
    const createdAt = typeof candidate.entry.createdAt === 'string' ? candidate.entry.createdAt : (typeof metrics.createdAt === 'string' ? metrics.createdAt : (typeof jsonTake?.createdAt === 'string' ? jsonTake.createdAt : (typeof manifestCreatedAt === 'string' ? manifestCreatedAt : '')));
    const takeData = { duration, mime: finalMime, createdAt };
    if (!jsonTake) stats.metadataRebuilt += 1;
    const task = candidate.catalogEntry.task;
    const session = candidate.catalogEntry.session;
    clips.push({
      key: candidate.entry.key,
      taskId: candidate.taskId,
      source: task.source,
      sessionId: session.id,
      take: candidate.take,
      title: task.title,
      blob: new Blob([data], { type: finalMime }),
      mime: finalMime,
      ext: candidate.extension,
      metrics: takeData,
      createdAt
    });
    restoredKeys.add(candidate.entry.key);
    data = null;
  }
  expectedKeys.forEach(key => { if (!restoredKeys.has(key)) stats.missingTakeRefs += 1; });
  Object.values(jsonState.records).forEach(record => { record.takes = {}; });
  clips.forEach(clip => { jsonState.records[clip.taskId].takes[clip.take] = clip.metrics; });
  return clips;
}

function setZIPControlState() {
  const backupBusy = zipValidationBusy || zipRestoreBusy || zipExportBusy;
  syncAudioAvailability();
  $('exportData').disabled = backupBusy;
  $('importData').disabled = backupBusy;
  $('persistStorage').disabled = zipRestoreBusy;
  $('themeQuick').disabled = zipRestoreBusy;
  document.querySelectorAll('.tab').forEach(button => { button.disabled = zipRestoreBusy; });
  document.querySelector('label[for="importData"]')?.setAttribute('aria-disabled', backupBusy ? 'true' : 'false');
}

function setZIPOperationStatus(message = '') {
  $('zipOperationStatus').textContent = message;
}

function resetZIPImportUI() {
  pendingZIPImport = null;
  $('importAudio').value = '';
  $('zipImportProgress').textContent = '';
}

function closeZIPImportModal() {
  if (zipRestoreBusy) return;
  setModalOpen($('zipImportModal'), false);
  resetZIPImportUI();
}

function renderZIPImportPreview(file, result) {
  $('zipImportFileName').textContent = `${file.name} · ${backupBytesText(file.size)}`;
  $('zipImportFatal').classList.toggle('hidden', result.ok);
  $('zipImportSummary').classList.toggle('hidden', !result.ok);
  $('zipImportMode').classList.toggle('hidden', !result.ok);
  $('zipImportWarnings').classList.toggle('hidden', !result.ok || !result.preview?.warnings.length);
  $('confirmZipImport').disabled = !result.ok;
  if (!result.ok) {
    $('zipImportFatal').textContent = `${result.title}: ${result.message}`;
    $('zipImportWarningList').replaceChildren();
  } else {
    const preview = result.preview;
    $('zipImportFormat').textContent = `${preview.format} · v${preview.version}`;
    const createdDate = preview.createdAt ? new Date(preview.createdAt) : null;
    $('zipImportDate').textContent = createdDate && !Number.isNaN(createdDate.getTime()) ? createdDate.toLocaleString('ko-KR') : '시간 정보 없음';
    $('zipImportSize').textContent = backupBytesText(file.size);
    $('zipImportEntries').textContent = `${preview.entryCount}개`;
    $('zipImportRecords').textContent = `${preview.recordCount}개 · 평가 ${preview.evaluatedCount}개`;
    $('zipImportResume').textContent = preview.resumeStatus === 'valid' ? '유효함' : preview.resumeStatus === 'invalid' ? '제외 예정' : '없음';
    $('zipImportTextExtras').textContent = `${preview.settingsIncluded ? '설정 포함' : '기본 설정'} · ${preview.expressionsIncluded ? '표현 교체' : '표현 유지'}`;
    $('zipImportTextExcluded').textContent = `${preview.textExcludedCount}개`;
    $('zipImportTakeCounts').textContent = `${preview.firstCount}개 · ${preview.retryCount}개`;
    $('zipImportAudioCount').textContent = `${preview.audioCount}개`;
    $('zipImportAudioBytes').textContent = backupBytesText(preview.audioBytes);
    $('zipImportAudioExcluded').textContent = `${preview.audioExcluded}개 · 경고 ${preview.audioWarningCount}건`;
    $('zipImportMode').textContent = `텍스트 기록은 교체됩니다. ${preview.expressionsIncluded ? '백업의 표현 카드·복습 데이터도 교체됩니다.' : '표현 데이터는 포함되지 않아 현재 값을 유지합니다.'} 기존 녹음은 ZIP의 검증된 녹음 전체로 교체되며, ZIP에 없는 기존 녹음은 삭제됩니다. 취소하거나 복원에 실패하면 기존 데이터를 유지합니다.`;
    const list = $('zipImportWarningList');
    list.replaceChildren();
    preview.warnings.forEach(message => {
      const item = document.createElement('li');
      item.textContent = message;
      list.appendChild(item);
    });
  }
  setModalOpen($('zipImportModal'), true);
  requestAnimationFrame(() => (result.ok ? $('cancelZipImport') : $('closeZipImport')).focus());
}

async function prepareZIPImport(file) {
  pendingZIPImport = null;
  if (!file || zipValidationBusy || zipRestoreBusy || zipExportBusy) return;
  if (dbStatus !== 'ready') {
    setDBUnavailable('녹음 저장소가 준비되지 않았습니다.');
    $('importAudio').value = '';
    return;
  }
  if (typeof JSZip === 'undefined') {
    $('importAudio').value = '';
    return alert('ZIP 모듈을 불러오지 못했습니다. vendor/jszip.min.js 파일을 확인해 주세요.');
  }
  if (!file.size) return renderZIPImportPreview(file, { ok: false, title: '빈 ZIP 파일', message: '파일 내용이 없습니다. 다른 백업을 선택해 주세요.' });
  if (file.size > MAX_ZIP_FILE_BYTES) return renderZIPImportPreview(file, { ok: false, title: 'ZIP 파일 크기 초과', message: `ZIP 원본은 최대 ${bytesText(MAX_ZIP_FILE_BYTES)}까지 복원할 수 있습니다.` });
  zipValidationBusy = true;
  setZIPControlState();
  setZIPOperationStatus('백업 검사 중…');
  let raw = null;
  let zip = null;
  try {
    try { raw = await file.arrayBuffer(); }
    catch (_) { throw zipImportError('ZIP 파일 읽기 실패', '파일을 읽을 수 없습니다. 파일 권한을 확인하거나 다른 백업을 선택해 주세요.'); }
    const central = inspectZIPCentralDirectory(raw);
    try { zip = await JSZip.loadAsync(raw); }
    catch (_) { throw zipImportError('ZIP 형식 오류', 'ZIP으로 해석할 수 없거나 지원하지 않는 압축 방식입니다.'); }
    const centralMap = new Map(central.entries.map(entry => [entry.name, entry]));
    const manifestEntry = centralMap.get('manifest.json');
    const recordsEntry = centralMap.get('records.json');
    if (!manifestEntry || manifestEntry.directory || !recordsEntry || recordsEntry.directory) throw zipImportError('필수 파일 누락', 'manifest.json 또는 records.json이 없습니다. 다른 백업을 선택해 주세요.');
    if (manifestEntry.uncompressedSize > MAX_ZIP_MANIFEST_BYTES) throw zipImportError('manifest 크기 초과', `manifest.json은 ${bytesText(MAX_ZIP_MANIFEST_BYTES)} 이하여야 합니다.`);
    if (recordsEntry.uncompressedSize > MAX_JSON_IMPORT_BYTES) throw zipImportError('텍스트 기록 크기 초과', `records.json은 ${bytesText(MAX_JSON_IMPORT_BYTES)} 이하여야 합니다.`);
    let manifest;
    let importedJSON;
    try { manifest = JSON.parse(await zip.file('manifest.json').async('text')); }
    catch (_) { throw zipImportError('manifest JSON 오류', 'manifest.json을 읽거나 해석할 수 없습니다.'); }
    validateZIPManifestHeader(manifest);
    try { importedJSON = JSON.parse(await zip.file('records.json').async('text')); }
    catch (_) { throw zipImportError('텍스트 JSON 오류', 'records.json을 읽거나 JSON으로 해석할 수 없습니다.'); }
    const jsonResult = validateJSONBackup(importedJSON, { name: 'records.json', size: recordsEntry.uncompressedSize, type: 'application/json', lastModified: file.lastModified });
    importedJSON = null;
    if (!jsonResult.ok) throw zipImportError('텍스트 JSON 검증 실패', `${jsonResult.title}: ${jsonResult.message}`);
    const stats = createZIPValidationStats();
    const candidates = validateZIPManifest(manifest, central, jsonResult, stats);
    $('zipOperationStatus').textContent = '녹음 복원 준비 중…';
    const clips = await extractZIPAudio(zip, candidates, jsonResult.normalized.state, manifest.createdAt, stats);
    const zipWarnings = zipValidationWarnings(stats);
    const warnings = [...jsonResult.preview.warnings, ...zipWarnings];
    const audioBytes = clips.reduce((total, clip) => total + clip.blob.size, 0);
    const result = {
      ok: true,
      normalized: { bundle: jsonResult.normalized, clips },
      preview: {
        format: manifest.format,
        version: manifest.version,
        createdAt: manifest.createdAt,
        entryCount: central.entries.length,
        recordCount: jsonResult.preview.recordCount,
        evaluatedCount: jsonResult.preview.evaluatedCount,
        resumeStatus: jsonResult.preview.resumeStatus,
        settingsIncluded: jsonResult.preview.settingsIncluded,
        expressionsIncluded: jsonResult.preview.expressionsIncluded,
        textExcludedCount: jsonResult.preview.excludedCount,
        firstCount: clips.filter(clip => clip.take === 'first').length,
        retryCount: clips.filter(clip => clip.take === 'retry').length,
        audioCount: clips.length,
        audioBytes,
        audioExcluded: stats.excludedAudio,
        audioWarningCount: zipWarnings.length,
        warnings
      }
    };
    if (file.name.toLowerCase().endsWith('.zip') === false || (file.type && !['application/zip', 'application/x-zip-compressed', 'application/octet-stream'].includes(file.type))) {
      result.preview.warnings.unshift('파일 확장자 또는 MIME은 일반 ZIP과 다르지만 내용 검증을 기준으로 처리했습니다.');
    }
    pendingZIPImport = result.normalized;
    renderZIPImportPreview(file, result);
  } catch (error) {
    renderZIPImportPreview(file, { ok: false, title: error.userTitle || 'ZIP 검증 실패', message: error.userMessage || '백업을 안전하게 확인하지 못했습니다. 다른 백업을 선택해 주세요.' });
  } finally {
    raw = null;
    zip = null;
    zipValidationBusy = false;
    setZIPOperationStatus('');
    setZIPControlState();
  }
}

function stageZIPStorage(bundle) {
  let entries;
  try { entries = serializeImportEntries(bundle); }
  catch (error) {
    storageWriteIssue(STORE_KEY, error, 'serialize');
    return { ok: false, rollbackFailed: false };
  }
  const originals = new Map();
  try { entries.forEach(entry => originals.set(entry.key, localStorage.getItem(entry.key))); }
  catch (error) {
    storageWriteIssue(STORE_KEY, error, 'write');
    return { ok: false, rollbackFailed: false };
  }
  const written = [];
  try {
    entries.forEach(entry => {
      localStorage.setItem(entry.key, entry.serialized);
      written.push(entry.key);
    });
    return { ok: true, entries, originals };
  } catch (error) {
    let rollbackFailed = false;
    written.reverse().forEach(key => {
      try {
        const original = originals.get(key);
        if (original === null) localStorage.removeItem(key);
        else localStorage.setItem(key, original);
      } catch (_) { rollbackFailed = true; }
    });
    storageWriteIssue(STORE_KEY, error, 'write');
    return { ok: false, rollbackFailed };
  }
}

function rollbackZIPStorage(stage) {
  let success = true;
  stage.entries.forEach(entry => {
    try {
      const original = stage.originals.get(entry.key);
      if (original === null) localStorage.removeItem(entry.key);
      else localStorage.setItem(entry.key, original);
    } catch (_) { success = false; }
  });
  return success;
}

function finalizeZIPStorage(stage) {
  stage.entries.forEach(entry => {
    storageReadBlocks.delete(entry.key);
    storageIssues.delete(`read:${entry.key}`);
    storageIssues.delete(`write:${entry.key}`);
  });
  storageIssues.delete('zip-rollback');
  renderStorageAlert();
}

async function applyPendingZIPImport() {
  if (!pendingZIPImport || zipRestoreBusy) return;
  zipRestoreBusy = true;
  setZIPControlState();
  $('zipImportModal').classList.add('is-busy');
  $('closeZipImport').disabled = true;
  $('cancelZipImport').disabled = true;
  $('confirmZipImport').disabled = true;
  $('zipImportProgress').textContent = '텍스트 기록 저장 중…';
  const target = pendingZIPImport;
  const storageStage = stageZIPStorage(target.bundle);
  if (!storageStage.ok) {
    $('zipImportProgress').textContent = storageStage.rollbackFailed
      ? '텍스트 저장에 실패했고 원래 값을 완전히 확인하지 못했습니다. 녹음은 변경되지 않았습니다. 현재 탭을 닫지 말고 다른 백업을 보관해 주세요.'
      : '텍스트 저장에 실패했습니다. 기존 텍스트와 녹음은 유지됩니다. 저장소 설정을 확인한 뒤 다시 시도해 주세요.';
    zipRestoreBusy = false;
    $('zipImportModal').classList.remove('is-busy');
    $('closeZipImport').disabled = false;
    $('cancelZipImport').disabled = false;
    $('confirmZipImport').disabled = false;
    setZIPControlState();
    return;
  }
  $('zipImportProgress').textContent = `녹음 복원 중 · ${target.clips.length}개를 하나의 안전한 작업으로 저장하고 있습니다.`;
  try {
    await dbReplaceAll(target.clips);
  } catch (_) {
    $('zipImportProgress').textContent = '복원 실패 · 기존 데이터 복구 중…';
    const rolledBack = rollbackZIPStorage(storageStage);
    if (!rolledBack) {
      setStorageIssue('zip-rollback', {
        title: 'ZIP 복원 롤백 확인 필요',
        message: '녹음은 기존 상태로 유지됐지만 텍스트 원문 복원에 실패했습니다. 성공 안내가 표시되지 않았으며, 현재 데이터를 더 수정하지 말고 백업을 보관해 주세요.',
        retryable: false
      });
      $('zipImportProgress').textContent = '녹음은 기존 상태로 유지됐지만 텍스트는 일부 적용됐을 수 있습니다. 다른 작업을 하지 말고 백업을 보관해 주세요.';
    } else {
      $('zipImportProgress').textContent = '복원에 실패했으며 기존 텍스트와 녹음은 그대로 유지됩니다. 다시 시도하거나 다른 백업을 선택해 주세요.';
    }
    zipRestoreBusy = false;
    $('zipImportModal').classList.remove('is-busy');
    $('closeZipImport').disabled = false;
    $('cancelZipImport').disabled = false;
    $('confirmZipImport').disabled = false;
    setZIPControlState();
    return;
  }
  $('zipImportProgress').textContent = '최종 확인 중…';
  finalizeZIPStorage(storageStage);
  state = target.bundle.state;
  if (target.bundle.expressions.cards !== null) expressionCards = target.bundle.expressions.cards;
  if (target.bundle.expressions.review !== null) expressionReview = target.bundle.expressions.review;
  revokeClipUrls();
  let refreshFailed = false;
  try {
    syncSettings();
    renderRecords();
    renderExpressionHub();
    await renderStorageStats();
    if (currentSession && currentTasks[currentTaskIndex]) await loadTakes(currentTasks[currentTaskIndex]);
  } catch (_) {
    refreshFailed = true;
    $('zipImportProgress').textContent = '복원 저장은 완료됐지만 화면을 새로 그리지 못했습니다. 페이지를 새로고침해 주세요.';
  } finally {
    zipRestoreBusy = false;
    $('zipImportModal').classList.remove('is-busy');
    $('closeZipImport').disabled = false;
    $('cancelZipImport').disabled = false;
    setZIPControlState();
  }
  if (refreshFailed) return;
  setModalOpen($('zipImportModal'), false);
  resetZIPImportUI();
  toast(`ZIP 복원 완료 · 녹음 ${target.clips.length}개`);
}

async function exportAudioZip() {
  if (dbStatus !== 'ready') {
    setDBUnavailable('녹음 저장소가 준비되지 않았습니다.');
    return;
  }
  if (typeof JSZip === 'undefined') return alert('ZIP 모듈을 불러오지 못했습니다. vendor/jszip.min.js 파일을 확인하세요.');
  if (zipValidationBusy || zipRestoreBusy || zipExportBusy) return;
  zipExportBusy = true;
  setZIPControlState();
  setZIPOperationStatus('ZIP 생성 준비 중…');
  let clips = [];
  let zip = null;
  let output = null;
  try {
    clips = await dbAll();
    if (clips.length + 3 > MAX_ZIP_ENTRIES) throw zipImportError('녹음 개수 초과', `ZIP에는 최대 ${MAX_ZIP_ENTRIES - 3}개의 녹음을 담을 수 있습니다.`);
    const taskCatalog = importTaskCatalog();
    const keys = new Set();
    const paths = new Set();
    let totalAudioBytes = 0;
    for (const clip of clips) {
      const expectedKey = `${clip.taskId}:${clip.take}`;
      if (!taskCatalog.has(clip.taskId) || (clip.take !== 'first' && clip.take !== 'retry') || clip.key !== expectedKey || keys.has(clip.key)) throw zipImportError('녹음 키 오류', '저장된 녹음 키가 현재 문제·first/retry 규칙과 일치하지 않아 불완전 ZIP을 만들지 않았습니다.');
      if (!(clip.blob instanceof Blob) || !clip.blob.size || clip.blob.size > MAX_ZIP_AUDIO_BYTES) throw zipImportError('녹음 파일 크기 오류', `비어 있거나 ${bytesText(MAX_ZIP_AUDIO_BYTES)}를 넘는 녹음이 있어 ZIP을 만들지 않았습니다.`);
      const mime = normalizedAudioMime(clip.mime || clip.blob.type || '');
      if (!mime) throw zipImportError('녹음 MIME 오류', '지원하지 않는 녹음 MIME이 있어 ZIP을 만들지 않았습니다.');
      const exportExt = extForMime(clip.mime || clip.blob.type);
      const path = safeAudioName({ ...clip, ext: exportExt });
      if (zipPathError(path) || paths.has(path.toLocaleLowerCase('en-US'))) throw zipImportError('녹음 경로 충돌', '둘 이상의 녹음이 같은 ZIP 경로를 사용해 백업을 중단했습니다.');
      keys.add(clip.key);
      paths.add(path.toLocaleLowerCase('en-US'));
      totalAudioBytes += clip.blob.size;
    }
    if (totalAudioBytes > MAX_ZIP_UNCOMPRESSED_BYTES) throw zipImportError('백업 크기 초과', `녹음 전체 크기는 ${bytesText(MAX_ZIP_UNCOMPRESSED_BYTES)} 이하여야 합니다.`);
    zip = new JSZip();
    const manifest = { format: 'spa45-backup', version: 1, createdAt: new Date().toISOString(), clipCount: clips.length, entries: [] };
    const recordsText = JSON.stringify({ format: 'spa45-records-v3', exportedAt: manifest.createdAt, state, expressionCards, expressionReview }, null, 2);
    if (new Blob([recordsText]).size > MAX_JSON_IMPORT_BYTES) throw zipImportError('텍스트 기록 크기 초과', `records.json이 ${bytesText(MAX_JSON_IMPORT_BYTES)}를 넘어 ZIP을 만들지 않았습니다.`);
    zip.file('records.json', recordsText);
    for (const clip of clips) {
      setZIPOperationStatus(`녹음 확인 중 · ${manifest.entries.length + 1} / ${clips.length}`);
      const exportExt = extForMime(clip.mime || clip.blob.type);
      const file = safeAudioName({ ...clip, ext: exportExt });
      const data = new Uint8Array(await clip.blob.arrayBuffer());
      const sha256 = await sha256Hex(data);
      zip.file(file, clip.blob);
      manifest.entries.push({ key: clip.key, taskId: clip.taskId, source: clip.source, sessionId: clip.sessionId, take: clip.take, title: clip.title, mime: clip.mime || clip.blob.type || '', ext: exportExt, metrics: clip.metrics, createdAt: clip.createdAt, file, bytes: clip.blob.size, sha256 });
    }
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    setZIPOperationStatus('ZIP 압축 중…');
    output = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    if (!output.size || output.size > MAX_ZIP_FILE_BYTES) throw zipImportError('ZIP 결과 크기 초과', `생성된 ZIP이 ${bytesText(MAX_ZIP_FILE_BYTES)}를 넘어 다운로드하지 않았습니다.`);
    downloadBlob(output, `spa45_full_backup_${new Date().toISOString().slice(0, 10)}.zip`);
    toast(`ZIP 검증 완료 · 녹음 ${clips.length}개`);
  } catch (error) {
    alert(`${error.userTitle || 'ZIP 백업 실패'}: ${error.userMessage || 'ZIP을 완성하지 못해 다운로드하지 않았습니다. 기존 데이터는 변경되지 않았습니다.'}`);
  } finally {
    clips.length = 0;
    zip = null;
    output = null;
    zipExportBusy = false;
    setZIPOperationStatus('');
    setZIPControlState();
  }
}

$('exportAudio').addEventListener('click', exportAudioZip);
$('importAudio').addEventListener('change', event => prepareZIPImport(event.target.files?.[0]));
$('closeZipImport').addEventListener('click', closeZIPImportModal);
$('cancelZipImport').addEventListener('click', closeZIPImportModal);
$('confirmZipImport').addEventListener('click', applyPendingZIPImport);
document.querySelector('[data-close-zip-import]').addEventListener('click', closeZIPImportModal);

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
  if (dbStatus !== 'ready') {
    $('storageClipCount').textContent = '-';
    $('storageBytes').textContent = '-';
    $('audioCount').textContent = '-';
    syncAudioAvailability();
    return;
  }
  try {
    const clips = await dbAll();
    const size = clips.reduce((total, clip) => total + (clip.blob?.size || 0), 0);
    $('storageClipCount').textContent = `${clips.length}개`;
    $('storageBytes').textContent = bytesText(size);
    $('audioCount').textContent = clips.length;
    await updatePersistenceStatus(false);
  } catch (_) {
    setDBUnavailable('녹음 저장소 상태를 확인할 수 없습니다.');
  }
}

function syncResetButton() {
  $('resetData').disabled = !($('resetBackupCheck').checked && $('resetPhrase').value.trim() === '전체 초기화');
}
$('resetBackupCheck').addEventListener('change', syncResetButton);
$('resetPhrase').addEventListener('input', syncResetButton);
$('resetData').addEventListener('click', async () => {
  if ($('resetData').disabled) return;
  if (dbStatus !== 'ready') return alert('녹음 저장소를 사용할 수 없어 전체 초기화를 안전하게 진행할 수 없습니다.');
  if (!confirm('정말로 모든 텍스트 기록과 녹음을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
  try {
    await dbClear();
  } catch (_) {
    setStorageIssue('recording', {
      title: '전체 초기화 실패',
      message: '녹음을 삭제하지 못해 텍스트 기록도 그대로 유지했습니다.',
      retryable: false
    });
    return;
  }
  safeRemoveStorageKey(STORE_KEY);
  safeRemoveStorageKey(EXPRESSION_CARDS_KEY);
  safeRemoveStorageKey(EXPRESSION_REVIEW_KEY);
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

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushResumeSave(true);
});

window.addEventListener('pagehide', () => flushResumeSave(true));

(async function boot() {
  updateTheme(preferredTheme());
  renderCourse();
  renderResumeCard();
  syncSettings();
  renderRecords();
  renderChecks(null);
  populateExpressionEditCategories();
  syncDifficultyUI();
  if (typeof JSZip === 'undefined') console.warn('JSZip missing');
  await initDB();
  await updateStats();
})();

function chatGPTStarterPromptText() {
  return "[SPA 5주 말하기 훈련 · ChatGPT 고정 운영 지침]\n\n나는 SPA 영어 말하기 시험을 준비하고 있으며 아래 웹앱으로 5주 말하기 훈련을 진행할 것이다.\n\nhttps://nalkongchi.github.io/Spa/\n\n이 채팅방에서는 위 앱에서 복사한 학습 패킷을 계속 붙여넣을 것이다.\n\n학습 패킷에는 현재 회차, 문제 유형, 질문, 실제로 말한 답변, 자기진단, 수행 결과, 참고자료 등이 포함될 수 있다.\n\n당신은 이 채팅방에서 SPA 말하기 훈련 코치 역할을 맡아라.\n\n\n──────────────────────────────\n[훈련의 목표]\n──────────────────────────────\n\n이 훈련의 목표는 완벽한 모범답안을 암기하는 것이 아니다.\n\n질문을 들었을 때\n\n질문 이해\n→ 즉석 답변\n→ 피드백\n→ 표현 정리\n→ 재답변\n→ 다른 문제에서 재사용\n\n과정을 반복하면서, 학습자가 자신의 생각을 영어로 더 빠르고 자연스럽게 꺼내 말할 수 있도록 돕는 것이 목표다.\n\n따라서 답변을 멋진 영어 작문으로 새로 만들어주는 것보다, 학습자가 실제 시험에서 스스로 다시 말할 수 있도록 돕는 것을 우선하라.\n\n\n──────────────────────────────\n[핵심 지도 원칙]\n──────────────────────────────\n\n학습자의 답변 수준에 따라 도움의 정도를 조절하라.\n\n핵심 원칙은 다음과 같다.\n\n- 이미 어느 정도 잘 답했다면 → 원래 답변을 중심으로 다듬는다.\n- 내용은 있으나 부족하다면 → 같은 생각을 유지하면서 적절히 확장한다.\n- 거의 답하지 못했다면 → 답변을 만들 수 있도록 문장 틀과 예시를 제공한다.\n\n즉,\n\n“잘 말했으면 다듬고,\n부족하게 말했으면 확장하고,\n못 말했으면 발판을 만들어준다.”\n\n를 기본 원칙으로 삼아라.\n\n\n──────────────────────────────\n[학습자의 생각과 사실 보존]\n──────────────────────────────\n\n학습자가 실제로 말하려던 내용, 경험, 의견과 사실을 최대한 보존하라.\n\n학습자가 말하지 않은 개인적인 경험이나 사실을 실제 경험인 것처럼 임의로 만들어내지 마라.\n\n내용을 확장할 필요가 있다면 우선 학습자가 이미 말한 생각 안에서 다음을 보충하라.\n\n- 이유\n- 구체적인 설명\n- 결과\n- 행동 순서\n- 간단한 예시\n- 문장 간 연결\n\n개인 정보나 실제 경험이 반드시 필요한 경우에는 임의로 채우지 말고,\n\n[내 업무]\n[이유]\n[경험]\n[결과]\n\n처럼 학습자가 자신의 정보로 바꿀 수 있는 형태를 사용하거나,\n일반적인 예시임을 명확히 밝혀라.\n\n\n──────────────────────────────\n[난이도와 자연스러움]\n──────────────────────────────\n\n학습자가 이미 어느 정도 답했다면 원어민 에세이처럼 완전히 새로운 답변으로 바꾸지 마라.\n\n우선 현재 답변에서 한두 단계 자연스러워지는 정도를 목표로 하라.\n\n시험 중 바로 꺼내 말하기 어려운 고급 어휘나 지나치게 복잡한 문장 구조보다,\n\n- 짧고\n- 명확하고\n- 자연스럽고\n- 다시 사용하기 쉬운\n\n구어체 영어를 우선하라.\n\n단, “과도하게 고급화하지 않는다”는 원칙 때문에 필요한 도움까지 제한해서는 안 된다.\n\n학습자가 질문에 거의 답하지 못했거나,\n단어나 짧은 구절만 말했거나,\n답변을 중간에 포기한 경우에는\n학습을 위해 충분한 예시와 문장 구조를 제공하라.\n\n\n──────────────────────────────\n[핵심 문제 진단]\n──────────────────────────────\n\n사소한 오류를 모두 나열하지 마라.\n\n실제 말하기 성과를 가장 많이 방해하는 핵심 문제를 우선하라.\n\n한 답변에서 핵심 교정은 보통 1~3개면 충분하다.\n\n특히 다음을 확인하라.\n\n- 질문을 정확히 이해했는지\n- 질문에 직접 답했는지\n- 핵심 의미가 분명하게 전달되는지\n- 문법 오류\n- 부자연스러운 단어 또는 표현\n- 문장을 끝까지 완성하지 못한 부분\n- 이유·예시·세부내용 부족\n- 같은 표현의 불필요한 반복\n- 문장 간 연결 부족\n- 필요한 단어나 표현을 회수하지 못해 막힌 부분\n\n\n──────────────────────────────\n[A / B / C 교정 기준]\n──────────────────────────────\n\n교정은 필요할 경우 다음과 같이 구분하라.\n\nA = 실제 오류\n\n문법, 의미 또는 문장 구조 문제로 반드시 고치는 것이 좋은 부분\n\nB = 부자연스러운 표현\n\n의미는 전달되지만 실제 영어 말하기에서는 어색하거나 덜 자연스러운 부분\n\nC = 선택적 개선\n\n현재 표현도 사용할 수 있지만 더 명확하거나 자연스럽게 말할 수 있는 선택지\n\n모든 답변에 억지로 A, B, C를 하나씩 만들 필요는 없다.\n\n실제로 해당되는 항목만 제시하라.\n\n\n──────────────────────────────\n[개선 답변]\n──────────────────────────────\n\n개선 답변은 기본적으로 두 단계로 제시하라.\n\n\nVersion 1 · 최소 수정본\n\n학습자가 실제로 말한 내용과 문장 구조를 가능한 한 유지하면서\n\n- 문법 오류\n- 부자연스러운 표현\n- 문장 연결 문제\n- 명백한 의미 전달 문제\n\n를 고친다.\n\n“내가 방금 한 답변을 조금만 더 잘 말하면 이렇게 된다”는 것을 보여주는 버전이다.\n\n\nVersion 2 · 자연스러운 확장본\n\nVersion 1과 같은 생각과 사실을 유지하되,\n\n- 부족한 이유\n- 필요한 세부내용\n- 자연스러운 연결\n- 간단한 결과나 설명\n\n을 적절히 보충해 한 단계 더 완성된 말하기 답변으로 만든다.\n\nVersion 2는 Version 1을 단순히 더 어려운 단어로 바꾸는 버전이 아니다.\n\nVersion 1 = 교정\nVersion 2 = 교정 + 적절한 확장\n\n이 되도록 하라.\n\nVersion 2도 지나치게 길거나 외우기 어려운 답변으로 만들지 말고\n실제 시험에서 사용할 수 있는 수준을 유지하라.\n\n\n──────────────────────────────\n[학습자가 거의 답하지 못한 경우]\n──────────────────────────────\n\n학습자의 발화가 너무 적어서 원문을 수정하는 것이 의미 없을 경우에는\nVersion 1을 억지로 만들지 않아도 된다.\n\n예:\n\n- “I don't know.”\n- 단어 몇 개만 말함\n- 한 문장을 시작하다가 중단함\n- 질문에 사실상 답하지 못함\n\n이 경우 다음 순서로 도와라.\n\n1. 답변을 시작할 수 있는 가장 간단한 문장 틀\n2. 말하기 쉬운 기본 예시 답변\n3. 필요하면 한 단계 확장한 예시 답변\n\n예시 답변은 학습 구조를 보여주기 위한 것이며,\n학습자가 말하지 않은 개인적인 경험이나 사실을 실제 경험처럼 만들어내지 마라.\n\n개인 정보가 필요한 부분은 학습자가 자신의 내용으로 바꿀 수 있게 하라.\n\n\n──────────────────────────────\n[표현 카드]\n──────────────────────────────\n\n재사용 가치가 높은 표현이 있으면 표현 카드 후보를 1~3개 제안하라.\n\n표현은 지나치게 긴 완성 문장보다\n다른 질문에서도 사용할 수 있는 짧은 표현 덩어리나 문장 틀을 우선하라.\n\n예:\n\nOne of my main responsibilities is ...\nThe main reason is that ...\nWhat I usually do is ...\nIf that happened, I would ...\nOne thing I’ve noticed is ...\n\n각 표현에는 가능하면 다음 정보를 포함하라.\n\n- 영어 표현\n- 짧은 한국어 회상 단서\n- 학습자 답변에 맞는 간단한 예문\n- 표현의 기능 또는 사용 상황\n\n앱에서 이미 표현 후보가 전달된 경우에도 모든 표현을 억지로 사용하지 마라.\n\n현재 질문과 실제 답변에 도움이 되는 표현만 선택하라.\n\n\n──────────────────────────────\n[재답변 훈련]\n──────────────────────────────\n\n단일 답변 피드백이 끝나면 같은 질문에 학습자가 한 번 다시 답하도록 요청하라.\n\n이때 개선 답변 전체를 그대로 외워서 따라 말하게 하지 마라.\n\n핵심 수정 포인트와 표현만 참고해서 자신의 말로 다시 답하도록 유도하라.\n\n학습자의 재답변이 오면 첫 답변과 비교해서 다음만 간단히 알려라.\n\n- 실제로 좋아진 부분\n- 아직 남아 있는 핵심 문제\n\n필요하면 최소한의 추가 교정을 제공하라.\n\n다음 문제는 웹앱에서 진행한다.\n\n앱 패킷에서 별도로 요구하지 않는 한\n새로운 문제나 꼬리 질문을 임의로 만들지 마라.\n\n\n──────────────────────────────\n[SPA_APP_PACKET_V1 처리 규칙]\n──────────────────────────────\n\n웹앱에서 복사한 내용이\n\n[SPA_APP_PACKET_V1]\n\n로 시작하면 해당 내용을 현재 학습 패킷으로 인식하라.\n\n패킷 안의 다음 정보를 우선해서 사용하라.\n\n- 회차 정보\n- 훈련 초점\n- 현재 문제\n- 문제 유형\n- 실제 질문\n- 참고자료\n- 학습자의 실제 답변\n- 수행 결과\n- 자기진단\n- 앱 제공 표현 후보\n- 처리 지침\n\n패킷에 적힌 질문은 이미 웹앱에서 학습자에게 출제된 문제다.\n\n질문을 다시 처음부터 출제하지 말고\n패킷의 지시에 따라 바로 분석하라.\n\n\n패킷의 전달 유형이 ‘단일 답변 피드백’인 경우:\n\n현재 답변을 분석하고 개선한 뒤\n같은 질문에 한 번 재답변하도록 요청하고 기다려라.\n\n새로운 문제는 만들지 마라.\n\n\n패킷의 전달 유형이 ‘회차 종합 분석’인 경우:\n\n새로운 문제를 만들지 말고\n해당 회차에 저장된 실제 학습 기록만 종합하라.\n\n기록되지 않은 문제를 수행한 것처럼 평가하지 마라.\n\n\n──────────────────────────────\n[자가진단과 수행 결과 해석]\n──────────────────────────────\n\n앱에서 전달되는\n\n- 성공\n- 부분 성공\n- 실패\n\n는 학습자의 수행 기록으로 참고하라.\n\n체감 난이도는 답변 품질 점수가 아니다.\n\n어렵게 느꼈다고 해서 답변이 나빴다는 뜻이 아니며,\n쉽게 느꼈다고 해서 답변이 좋았다는 뜻도 아니다.\n\n자가진단에서 선택되지 않은 병목은\n해당 문제가 객관적으로 없었다는 의미가 아니다.\n\n학습자가 이번 답변에서 직접 병목으로 선택하지 않았다는 의미로만 해석하라.\n\n가능하면 다음을 구분해서 설명하라.\n\n1. 실제 받아쓰기에서 확인되는 문제\n2. 학습자가 스스로 느낀 병목\n\n\n──────────────────────────────\n[녹음 관련 규칙]\n──────────────────────────────\n\n앱 패킷에는 1차 녹음 또는 재도전 녹음이 존재한다는 정보와 녹음 길이가 포함될 수 있다.\n\n그러나 실제 음성 파일이 이 채팅에 첨부되지 않았다면\n녹음을 직접 들은 것처럼 평가하지 마라.\n\n실제 음성을 듣지 못한 상태에서는 다음을 단정하지 마라.\n\n- 발음\n- 억양\n- 말하기 속도\n- 실제 침묵 시간\n- 음성 유창성\n\n받아쓰기 또는 학습자가 입력한 핵심 메모가 있을 경우\n해당 텍스트를 중심으로 답변 내용과 문장 구성을 평가하라.\n\n\n──────────────────────────────\n[듣기 문제]\n──────────────────────────────\n\n듣기 문제에서는 앱 패킷에 제공된 지문을 기준으로 학습자가\n\n- 핵심 내용을 파악했는지\n- 중요한 세부내용을 놓치지 않았는지\n- 지문을 그대로 복사하지 않고 자기 문장으로 재구성했는지\n\n확인하라.\n\n재답변 전에 듣기 지문 전체를 모범답안처럼 그대로 제시해 암기시키지 마라.\n\n\n──────────────────────────────\n[상황형 문제]\n──────────────────────────────\n\n상황형 문제에서는 다음을 중심으로 확인하라.\n\n- 상황을 정확히 이해했는지\n- 가장 먼저 할 행동이 명확한지\n- 그 행동의 이유가 있는지\n- 필요한 의사소통을 설명했는지\n- 후속 조치가 자연스럽게 이어지는지\n\n\n──────────────────────────────\n[시각자료 문제]\n──────────────────────────────\n\n그래프, 표, 제품 이미지 등의 문제에서는\n앱 패킷에 제공된 실제 자료를 기준으로 평가하라.\n\n학습자가\n\n- 가장 중요한 특징을 먼저 말했는지\n- 수치나 비교 관계를 정확하게 설명했는지\n- 중요하지 않은 정보를 지나치게 나열하지 않았는지\n\n확인하라.\n\n\n──────────────────────────────\n[사진 문제]\n──────────────────────────────\n\n사진 문제가 포함된 경우\n실제 이미지에 접근할 수 있을 때만 사진 내용과 학습자의 답변을 비교하라.\n\n이미지를 확인할 수 없다면 사진 내용을 추측하지 마라.\n\n이 경우 영어 표현, 문장 구조, 답변 구성만 평가하라.\n\n사진에서 확인하기 어려운 내용을 학습자가 지나치게 단정했다면 그 점을 알려라.\n\n\n──────────────────────────────\n[회차 간 누적 학습]\n──────────────────────────────\n\n이 채팅방에서는 여러 회차의 학습이 계속 누적된다.\n\n가능하면 이전 학습에서 확인된 다음 요소를 이후 답변에서도 활용하라.\n\n- 반복되는 문법 문제\n- 자주 막히는 단어나 표현\n- 반복적으로 선택되는 병목\n- 이미 익힌 표현 덩어리\n- 이전에는 어려웠지만 이후 좋아진 부분\n\n다만 매번 과거 학습을 길게 반복 설명하지 마라.\n\n현재 답변과 직접 관련될 때만 짧게 연결하라.\n\n이전에 배운 표현을 새로운 문제에서 자연스럽게 다시 사용할 수 있다면 알려라.\n\n\n──────────────────────────────\n[SPA 평가 관련 주의]\n──────────────────────────────\n\n공식 SPA 평가 기준이나 실제 채점 결과를 직접 확인하지 않은 상태에서\n정확한 SPA 점수나 등급을 알고 있는 것처럼 단정하지 마라.\n\n“이 답변은 반드시 몇 점이다”처럼 평가하지 마라.\n\n대신 다음 요소를 중심으로 실질적인 개선을 도와라.\n\n- 질문 대응\n- 의미 전달\n- 정확성\n- 자연스러움\n- 답변의 연결성\n- 말하기 용이성\n- 즉석에서 다시 사용할 수 있는 표현력\n\n\n──────────────────────────────\n[기본 단일 답변 피드백 형식]\n──────────────────────────────\n\n앱 패킷에 별도 형식이 지정되어 있지 않다면 다음 순서로 피드백하라.\n\n1. 질문에 제대로 답했는지\n\n2. 잘한 점\n실제로 확인되는 강점 1~2개\n\n3. 핵심 교정\nA / B / C 기준으로 가장 중요한 문제 1~3개\n\n4. Version 1 · 최소 수정본\n\n5. Version 2 · 자연스러운 확장본\n\n단, 원래 발화가 거의 없는 경우에는\n\n문장 틀\n→ 기본 예시 답변\n→ 필요 시 확장 예시 답변\n\n형식으로 대체할 수 있다.\n\n6. 표현 카드 후보\n재사용할 가치가 높은 표현 1~3개\n\n7. 재답변\n같은 질문에 학습자가 자신의 말로 다시 답하도록 요청하고 기다린다.\n\n\n──────────────────────────────\n[응답 언어와 진행 방식]\n──────────────────────────────\n\n설명과 피드백은 한국어로 해도 된다.\n\n교정 문장, 표현 카드, 개선된 실제 답변은 영어로 제시하라.\n\n학습자가 한국어로\n\n“이걸 영어로 어떻게 말해?”\n“이 표현 자연스러워?”\n“이 단어 말고 뭐라고 하지?”\n\n등을 물으면\nSPA 말하기에서 바로 사용할 수 있는 자연스러운 구어체 영어를 우선해서 알려라.\n\n내가 [SPA_APP_PACKET_V1]을 붙여넣으면\n이 고정 운영 지침과 패킷 안의 처리 지침을 함께 적용하고,\n별도의 긴 사전 설명 없이 바로 훈련을 시작하라.\n\n==================================================\nEND STARTER PROMPT";
}
