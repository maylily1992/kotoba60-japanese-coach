const STORAGE_KEY = "kotoba60-daily-v3";
const LEGACY_KEY = "kotoba60-state-v2";

const PHASES = [
  { title: "旧句热身", minutes: 5, en: "RECALL", guide: "先不看答案，把之前学过的表达重新说出来。" },
  { title: "今日对话", minutes: 10, en: "LISTEN", guide: "先听完整对话，再逐句确认人物、地点和目的。" },
  { title: "词语与跟读", minutes: 10, en: "WORDS", guide: "所有词语都带平假名读音；先听再跟，录音回听一次。" },
  { title: "三轮角色扮演", minutes: 20, en: "SPEAK", guide: "一次只听一轮，用今天的表达完成真实回应。" },
  { title: "语法与注意点", minutes: 7, en: "NOTES", guide: "今天只吃透一个核心语法，并避开两个常见不自然点。" },
  { title: "地道表达与变式", minutes: 5, en: "NATURAL", guide: "把教科书句换成日本年轻人日常会说的回应。" },
  { title: "今日总结", minutes: 3, en: "REVIEW", guide: "词语、语法、注意点和地道用法都会保存在讲义里。" },
];

const SKILL_LABELS = {
  listening: "听力抓取",
  speaking: "开口流畅",
  vocabulary: "词语调用",
  grammar: "句型准确",
  pronunciation: "节奏发音",
  repair: "交流修复",
};

const BLOCKERS = [
  { id: "listening", label: "没听懂" },
  { id: "vocabulary", label: "想不起词" },
  { id: "grammar", label: "句型不确定" },
  { id: "pronunciation", label: "说不顺" },
  { id: "repair", label: "卡住不会救场" },
];

const DEFAULT_STATE = {
  week: 1,
  day: 1,
  completed: [],
  sessions: 0,
  totalMinutes: 0,
  streak: 0,
  lastPracticeDate: null,
  notes: {},
  performance: [],
  skills: {
    listening: 38,
    speaking: 34,
    vocabulary: 36,
    grammar: 35,
    pronunciation: 38,
    repair: 31,
  },
  reviewQueue: [],
  dailyReadiness: {},
  savedSentences: [],
  notebookMode: "lesson",
  chatMessages: [],
  ai: {
    endpoint: "",
    model: "",
    key: "",
  },
};

let state = loadState();
let route = "home";
let expandedWeek = state.week;
let journalWeek = state.week;
let journalDay = state.day;
let deferredInstallPrompt = null;
let toastTimer = null;
let currentAudio = null;
let sequenceToken = 0;
let mediaRecorder = null;
let recordingChunks = [];
let recordingStream = null;
let recordingStart = 0;
let session = createEmptySession();
let chatBusy = false;
let speechRecognition = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    const saved = current || legacy;
    if (!saved) return clone(DEFAULT_STATE);
    return {
      ...clone(DEFAULT_STATE),
      ...saved,
      skills: { ...DEFAULT_STATE.skills, ...(saved.skills || {}) },
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      notes: saved.notes || {},
      performance: Array.isArray(saved.performance) ? saved.performance : [],
      reviewQueue: Array.isArray(saved.reviewQueue) ? saved.reviewQueue : [],
      dailyReadiness: saved.dailyReadiness || {},
      savedSentences: Array.isArray(saved.savedSentences) ? saved.savedSentences : [],
      notebookMode: saved.notebookMode || "lesson",
      chatMessages: Array.isArray(saved.chatMessages) ? saved.chatMessages : [],
      ai: { ...DEFAULT_STATE.ai, ...(saved.ai || {}) },
    };
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createEmptySession() {
  return {
    sceneId: null,
    phase: 0,
    seconds: 0,
    timerId: null,
    roleRound: 0,
    roleRevealed: false,
    hintShown: false,
    roleFeedback: {},
    listenRating: null,
    shadowRating: null,
    drafts: {},
    inProgressId: null,
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function currentScene() {
  return DAILY_SCENES.find((scene) => scene.week === state.week && scene.day === state.day) || DAILY_SCENES[0];
}

function sceneById(id) {
  return DAILY_SCENES.find((scene) => scene.id === Number(id)) || DAILY_SCENES[0];
}

function dayKey(week = state.week, day = state.day) {
  return `${week}-${day}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function icon(name) {
  const paths = {
    arrow: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>',
    spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6a7 7 0 0 0 12.5 2.5L20 15"/>',
    mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-3 0h6"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    sound: '<path d="M5 9v6h4l5 4V5L9 9zm12 1a3 3 0 0 1 0 4m2-7a7 7 0 0 1 0 10"/>',
    light: '<path d="M9 18h6m-5 3h4M8.5 15.5A7 7 0 1 1 15.5 15.5c-.9.7-1.5 1.2-1.5 2.5h-4c0-1.3-.6-1.8-1.5-2.5z"/>',
    star: '<path d="m12 3 2.8 5.7L21 9.6l-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zm16 0A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M7.5 16.5 16.5 7.5M8 5h4M18 13v4"/>',
    brain: '<path d="M9 4a3 3 0 0 0-5 2.2A3 3 0 0 0 5 12a3 3 0 0 0 4 3.5V4Zm6 0a3 3 0 0 1 5 2.2A3 3 0 0 1 19 12a3 3 0 0 1-4 3.5V4Z"/><path d="M9 8H7m8 2h2m-8 5H7"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

function audioPath(sceneId, kind, index = 1) {
  return `./audio/s${pad(sceneId)}-${kind}${index}.mp3`;
}

function audioButton(path, label = "播放", className = "speak-button", slow = false) {
  return `<button class="${className}" type="button" data-audio="${escapeHtml(path)}" ${slow ? 'data-slow="true"' : ""} aria-label="${escapeHtml(label)}">
    ${icon("sound")}
  </button>`;
}

function dialogueAudio(scene, index) {
  return audioPath(scene.id, "l", index + 1);
}

function wordAudio(scene, index) {
  return audioPath(scene.id, "w", index + 1);
}

function grammarAudio(scene) {
  return audioPath(scene.id, "g", 1);
}

function naturalAudio(scene, index) {
  return audioPath(scene.id, "n", index + 1);
}

function grammarModuleForScene(scene) {
  return GRAMMAR_MODULES[(scene.id - 1) % GRAMMAR_MODULES.length];
}

function grammarModuleAudio(module, index) {
  return `./audio/grammar-${module.id}-${index + 1}.mp3`;
}

function verbsForScene(scene) {
  return (SCENE_VERB_IDS[scene.id - 1] || []).map((id) => VERB_BANK.find((verb) => verb.id === id)).filter(Boolean);
}

function verbAudio(verb) {
  return `./audio/verb-${verb.id}.mp3`;
}

function verbForms(verb) {
  return { ...verb.forms, ...(EXTRA_VERB_FORMS[verb.id] || {}) };
}

function readingLine(jp, kana, zh = "", audio = "", options = {}) {
  return `<div class="reading-line ${options.compact ? "compact" : ""}">
    <div class="reading-main">
      <p class="jp-text">${escapeHtml(jp)}</p>
      <p class="kana-text">${escapeHtml(kana)}</p>
      ${zh ? `<p class="zh-text">${escapeHtml(zh)}</p>` : ""}
    </div>
    ${audio ? audioButton(audio, `播放：${jp}`) : ""}
  </div>`;
}

function sentenceKey(sceneId, type, index, extra = "") {
  return `${sceneId}:${type}:${extra}:${index}`;
}

function isSentenceSaved(sceneId, type, index, extra = "") {
  return state.savedSentences.some((item) => item.key === sentenceKey(sceneId, type, index, extra));
}

function bookmarkButton(scene, type, index, extra = "", label = "加入重点句") {
  const saved = isSentenceSaved(scene.id, type, index, extra);
  return `<button class="bookmark-button ${saved ? "is-saved" : ""}" type="button" data-action="toggle-save-sentence" data-scene-id="${scene.id}" data-type="${type}" data-index="${index}" data-extra="${escapeHtml(extra)}" aria-label="${escapeHtml(saved ? "从重点句移除" : label)}">
    ${icon(saved ? "star" : "plus")}
  </button>`;
}

function sentencePack(scene) {
  const module = grammarModuleForScene(scene);
  const verbs = verbsForScene(scene);
  return [
    ...scene.dialogue.map((line, index) => ({
      type: "dialogue",
      index,
      extra: "",
      jp: line.jp,
      kana: line.kana,
      zh: line.zh,
      label: `场景对话 ${index + 1} · ${line.speaker}`,
      audio: dialogueAudio(scene, index),
    })),
    ...scene.natural.map((item, index) => ({
      type: "natural",
      index,
      extra: "",
      jp: item.jp,
      kana: item.kana,
      zh: item.zh,
      label: `地道反应 ${index + 1}`,
      audio: naturalAudio(scene, index),
    })),
    ...scene.grammar.examples.map((example, index) => ({
      type: "scene-grammar",
      index,
      extra: "",
      jp: example.jp,
      kana: example.kana,
      zh: example.zh,
      label: `今日语法 · ${scene.grammar.title}`,
      audio: grammarAudio(scene),
    })),
    ...module.examples.map((example, index) => ({
      type: "grammar-module",
      index,
      extra: module.id,
      jp: example.jp,
      kana: example.kana,
      zh: example.zh,
      label: `系统语法 · ${module.title}`,
      audio: grammarModuleAudio(module, index),
    })),
    ...verbs.map((verb, index) => ({
      type: "verb",
      index,
      extra: verb.id,
      jp: verb.example.jp,
      kana: verb.example.kana,
      zh: verb.example.zh,
      label: `动词实验室 · ${verb.word}`,
      audio: verbAudio(verb),
    })),
  ];
}

function registerSentence(scene, type, index, extra = "") {
  const key = sentenceKey(scene.id, type, index, extra);
  const existingIndex = state.savedSentences.findIndex((item) => item.key === key);
  if (existingIndex >= 0) {
    state.savedSentences.splice(existingIndex, 1);
    saveState();
    showToast("已从重点句手册移除。");
    return;
  }
  const sentence = sentencePack(scene).find(
    (item) => item.type === type && item.index === Number(index) && item.extra === extra,
  );
  if (!sentence) return;
  state.savedSentences.push({
    ...sentence,
    key,
    sceneId: scene.id,
    week: scene.week,
    day: scene.day,
    sceneTitle: scene.title,
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    lastReviewed: null,
  });
  saveState();
  showToast("已加入重点句手册，可在“手册”里复习。");
}

function todayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getRatingAverage(feedback) {
  const values = Object.values(feedback || {})
    .map((item) => Number(item.difficulty))
    .filter(Boolean);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function getBlockers(feedback) {
  return [...new Set(Object.values(feedback || {}).flatMap((item) => item.blockers || []))];
}

function weakestSkill() {
  return Object.entries(state.skills).sort((a, b) => a[1] - b[1])[0][0];
}

function getStrategy() {
  const liveAverage = getRatingAverage(session.roleFeedback);
  const liveBlockers = getBlockers(session.roleFeedback);
  const last = state.performance[state.performance.length - 1];
  const readiness = state.dailyReadiness[localDateKey()];
  const weak = liveBlockers[0] || last?.blockers?.[0] || weakestSkill();

  if (liveAverage !== null) {
    if (liveAverage <= 1.5) {
      return {
        mode: "回练",
        title: "先保留提示，不急着加新内容",
        body: `当前角色练习负荷偏高。后续重点回到「${SKILL_LABELS[weak]}」，先说完整短句，再撤提示。`,
        tags: ["提示保留", "同任务重说", "先求完成"],
      };
    }
    if (liveAverage >= 2.7 && liveBlocksEmpty(liveBlockers)) {
      return {
        mode: "进阶",
        title: "表达稳定，开始加一个自然追问",
        body: "你的三轮自评较轻松。复习时撤掉中文任务提示，并要求回答后追问一次。",
        tags: ["撤提示", "主动追问", "换条件"],
      };
    }
  }

  if (readiness === "low") {
    return {
      mode: "轻量",
      title: "今天少加负担，只保住完整开口",
      body: `精力偏低时，优先复习「${SKILL_LABELS[weakestSkill()]}」，允许看提示，把长回答拆成两句。`,
      tags: ["减少新词", "短句完成", "保留提示"],
    };
  }

  if (readiness === "high") {
    return {
      mode: "进阶",
      title: "状态不错，增加脱稿输出",
      body: "先完整听一遍对话，角色扮演时尽量不看文字；回答后再自己加一个问题。",
      tags: ["先听后看", "脱稿", "三秒开口"],
    };
  }

  if (last?.avgRating <= 1.5) {
    return {
      mode: "巩固",
      title: "上次负担偏高，今天先补薄弱连接",
      body: `今天的重点先放在「${SKILL_LABELS[weak]}」。固定句型熟练后，再增加同场景变化。`,
      tags: ["卡点前置", "表达块", "当日复测"],
    };
  }

  return {
    mode: "基线",
    title: "标准一小时：先听自然对话，再开口",
    body: "今天的路线是听完整对话、跟读词语、做三轮角色扮演，最后整理语法、注意点和地道用法。",
    tags: ["5+10+10+20+7+5+3", "全句假名", "自然男声"],
  };
}

function liveBlocksEmpty(blockers) {
  return blockers.length === 0;
}

function strategyCard(strategy = getStrategy()) {
  return `<section class="adaptive-card" aria-label="今日学习策略">
    <div class="adaptive-top">
      <span class="adaptive-badge">${icon("spark")}今日策略 · ${escapeHtml(strategy.mode)}</span>
      <small>根据当天状态与练习反馈调整</small>
    </div>
    <h3>${escapeHtml(strategy.title)}</h3>
    <p>${escapeHtml(strategy.body)}</p>
    <div class="strategy-tags">${strategy.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
  </section>`;
}

function renderHome() {
  const scene = currentScene();
  const week = weekInfo(scene.week);
  const done = state.completed.includes(dayKey(scene.week, scene.day));
  const readiness = state.dailyReadiness[localDateKey()] || "normal";
  const resume = session.inProgressId === scene.id && session.phase > 0;
  const weekDone = DAILY_SCENES.filter(
    (item) => item.week === scene.week && state.completed.includes(dayKey(item.week, item.day)),
  ).length;
  const dueReview = getDueReview();
  return `<div class="page">
    <p class="eyebrow">TODAY · ${escapeHtml(todayLabel())}</p>
    <h1 class="page-title">每天一场，<br />真的用得上的对话。</h1>
    <p class="page-lead">第 ${scene.week} 周 · 第 ${scene.day} 天 · ${escapeHtml(week.title)}</p>

    <section class="hero-card">
      <div class="hero-topline">
        <p class="hero-kicker">DAY ${pad(scene.id)} · ${escapeHtml(scene.category)}</p>
        <span class="time-badge">${icon("clock")} 60 分钟 · 18+ 句</span>
      </div>
      <h2 class="hero-title">${escapeHtml(scene.title)}</h2>
      <p class="hero-subtitle">${escapeHtml(scene.place)}<br />${escapeHtml(scene.goal)}</p>
      <div class="hero-footer">
        <div class="day-dots" aria-label="本周完成 ${weekDone} 天">
          ${[1, 2, 3, 4, 5, 6, 7].map((day) => `<span class="day-dot ${state.completed.includes(dayKey(scene.week, day)) ? "done" : ""} ${scene.day === day ? "active" : ""}"></span>`).join("")}
        </div>
        <button class="hero-button" type="button" data-action="start-session">
          ${resume ? "继续课堂" : done ? "再练一遍" : "开始今天的对话"} ${icon("arrow")}
        </button>
      </div>
    </section>

    <div class="sound-credit">
      <span class="sound-avatar">ハ</span>
      <div><b>ハルト · 元气热血少年声线</b><small>高音、快节奏的日漫少年气质；不复制具体声优本人的声音</small></div>
      ${audioButton(dialogueAudio(scene, 0), "试听今日对话")}
    </div>
    <button class="button indigo chat-launch" type="button" data-route="chat">
      ${icon("mic")} 和ハルト实时对谈
      <small>练完可以立刻反馈和追问</small>
    </button>

    <div class="readiness-strip">
      <small>今天的状态</small>
      <div class="readiness-options" aria-label="选择今天的状态">
        <button class="${readiness === "low" ? "is-selected" : ""}" type="button" data-action="set-readiness" data-readiness="low">有点累</button>
        <button class="${readiness === "normal" ? "is-selected" : ""}" type="button" data-action="set-readiness" data-readiness="normal">正常</button>
        <button class="${readiness === "high" ? "is-selected" : ""}" type="button" data-action="set-readiness" data-readiness="high">精力好</button>
      </div>
    </div>
    ${strategyCard()}

    ${
      dueReview
        ? `<div class="review-banner">${icon("refresh")}<span><b>到期复习：</b>上次标记了「${escapeHtml(SKILL_LABELS[dueReview.skill])}」，今天的热身会优先重新调动。</span></div>`
        : ""
    }

    <div class="plan-ribbon" aria-label="今日一小时安排">
      ${PHASES.map((phase) => `<span><b>${phase.minutes}</b><small>${escapeHtml(phase.title)}</small></span>`).join("")}
    </div>

    <div class="section-heading">
      <h2>先听这段对话</h2>
      <button type="button" data-action="play-scene" data-scene-id="${scene.id}">连续播放</button>
    </div>
    <div class="dialogue-preview">
      ${scene.dialogue
        .slice(0, 2)
        .map(
          (line, index) => `<div class="dialogue-preview-row ${line.side === "learner" ? "learner" : ""}">
            <span class="preview-speaker">${escapeHtml(line.speaker)}</span>
            <div>
              <p>${escapeHtml(line.jp)}</p>
              <small>${escapeHtml(line.kana)}</small>
              <span>${escapeHtml(line.zh)}</span>
            </div>
            ${audioButton(dialogueAudio(scene, index), "播放这句")}
          </div>`,
        )
        .join("")}
    </div>

    <div class="section-heading">
      <h2>今日讲义</h2>
      <button type="button" data-action="open-journal">查看完整总结</button>
    </div>
    <section class="lesson-preview">
      <div class="lesson-preview-head">
        <span>${icon("book")}</span>
        <div><b>${sentencePack(scene).length} 句 · ${scene.words.length} 词 · 3 个动词全变形</b><small>加入系统语法轨道、语体选择、注意点与地道用法</small></div>
      </div>
      <div class="word-chips">
        ${scene.words
          .slice(0, 4)
          .map((word) => `<span><b>${escapeHtml(word.jp)}</b><small>${escapeHtml(word.kana)}</small></span>`)
          .join("")}
      </div>
      <button class="button secondary" type="button" data-action="open-journal">打开今日完整讲义 ${icon("arrow")}</button>
    </section>
    <p class="bottom-note">这是面向旅行与日常生活的一小时口语课。练习反馈用于调整顺序与提示量，不替代真人教师或正式等级考试。</p>
  </div>`;
}

function weekInfo(number) {
  const titles = [
    ["开局与求助", "能把简单问题问清，听不懂时主动修复"],
    ["吃、买与请求", "点单、购物、调整要求与付款"],
    ["交通与住宿", "问路、换乘、入住与处理房间问题"],
    ["日程与短聊", "说日常、聊兴趣、邀约与改变计划"],
    ["突发与求助", "身体不适、遗失、网络和支付故障"],
    ["观光与交换信息", "问推荐、拍照、礼仪与一日行程"],
    ["自然口语与换说", "普通体、口语缩略、描述忘记的词"],
    ["整趟旅行验收", "把多个场景连成完整、自然的交流"],
  ];
  return { number, title: titles[number - 1][0], canDo: titles[number - 1][1] };
}

function renderSession() {
  const scene = sceneById(session.sceneId);
  const phase = PHASES[session.phase];
  return `<div class="page session-page">
    <div class="session-header">
      <div class="session-header-left">
        <button class="back-button" type="button" data-action="exit-session" aria-label="退出课堂">${icon("back")}</button>
        <div class="session-clock">
          <small>今日目标 60 分钟</small>
          <strong id="session-clock">${formatTime(session.seconds)}</strong>
        </div>
      </div>
      <span class="phase-count">${session.phase + 1} / ${PHASES.length}</span>
    </div>
    <div class="phase-progress">
      ${PHASES.map((_, index) => `<span class="${index < session.phase ? "done" : index === session.phase ? "active" : ""}"></span>`).join("")}
    </div>
    <p class="lesson-kicker">DAY ${pad(scene.id)} · ${escapeHtml(phase.en)} · 建议 ${phase.minutes} 分钟</p>
    <h1 class="lesson-title">${escapeHtml(phase.title)}</h1>
    <p class="lesson-subtitle">${escapeHtml(scene.title)} · ${escapeHtml(phase.guide)}</p>
    ${renderPhase(scene)}
  </div>`;
}

function renderPhase(scene) {
  if (session.phase === 0) return renderRecall(scene);
  if (session.phase === 1) return renderDialoguePhase(scene);
  if (session.phase === 2) return renderWordsPhase(scene);
  if (session.phase === 3) return renderRoleplay(scene);
  if (session.phase === 4) return renderGrammarPhase(scene);
  if (session.phase === 5) return renderNaturalPhase(scene);
  return renderSummaryPhase(scene);
}

function renderRecall(scene) {
  const previous = scene.id > 1 ? sceneById(scene.id - 1) : scene;
  const prompts = [
    { prompt: `“${previous.words[0].zh}”怎么说？`, jp: previous.words[0].jp, kana: previous.words[0].kana, audio: wordAudio(previous, 0) },
    { prompt: `“${previous.words[2].zh}”怎么说？`, jp: previous.words[2].jp, kana: previous.words[2].kana, audio: wordAudio(previous, 2) },
    { prompt: `自然回应：${previous.natural[0].zh}`, jp: previous.natural[0].jp, kana: previous.natural[0].kana, audio: naturalAudio(previous, 0) },
    { prompt: `复述昨天的关键句：${previous.dialogue[1].zh}`, jp: previous.dialogue[1].jp, kana: previous.dialogue[1].kana, audio: dialogueAudio(previous, 1) },
    { prompt: `昨天最后一句：${previous.dialogue[5].zh}`, jp: previous.dialogue[5].jp, kana: previous.dialogue[5].kana, audio: dialogueAudio(previous, 5) },
  ];
  return `
    <div class="coach-note">${icon("light")}<p>先大声说，再展开答案。说不完整也没关系，重点是把昨天的表达从记忆里调出来。</p></div>
    ${prompts
      .map(
        (item, index) => `<article class="practice-card recall-card">
          <div class="practice-question"><span class="practice-index">${index + 1}</span><p>${escapeHtml(item.prompt)}</p></div>
          <button class="text-button" type="button" data-action="reveal-answer">我试着说完了</button>
          <div class="reveal-answer" hidden>
            ${readingLine(item.jp, item.kana, "", item.audio)}
          </div>
        </article>`,
      )
      .join("")}
    ${nextButton("进入今日自然对话")}
  `;
}

function renderDialoguePhase(scene) {
  return `
    <div class="dialogue-toolbar">
      <div><b>ハルト配音 · ${scene.dialogue.length} 句</b><small>第一遍先只播声音，第二遍再看假名与中文</small></div>
      <div>
        <button type="button" data-action="play-scene" data-scene-id="${scene.id}">正常播放</button>
        <button type="button" data-action="play-scene" data-scene-id="${scene.id}" data-slow="true">慢速</button>
      </div>
    </div>
    <div class="dialogue-stage revised">
      <div class="dialogue-scene-label">${escapeHtml(scene.place)} · 今天的目标：${escapeHtml(scene.goal)}</div>
      ${scene.dialogue
        .map(
          (line, index) => `<div class="chat-row ${line.side === "learner" ? "learner" : ""}">
            <span class="avatar">${line.side === "learner" ? "你" : escapeHtml(line.speaker.slice(0, 1))}</span>
            <div class="bubble revised-bubble">
              <div class="bubble-head">
                <span class="bubble-speaker">${escapeHtml(line.speaker)}</span>
                <span class="bubble-tools">
                  ${bookmarkButton(scene, "dialogue", index)}
                  ${audioButton(dialogueAudio(scene, index), "播放这句", "bubble-speak")}
                </span>
              </div>
              <p>${escapeHtml(line.jp)}</p>
              <p class="kana-inline">${escapeHtml(line.kana)}</p>
              <small>${escapeHtml(line.zh)}</small>
            </div>
          </div>`,
        )
        .join("")}
    </div>
    <div class="role-feedback">
      <span class="feedback-label">这遍对话你听懂了多少？</span>
      ${ratingButtons("listen", session.listenRating, ["没抓住", "大概懂", "很清楚"])}
    </div>
    <button class="button" type="button" data-action="next-phase" ${session.listenRating ? "" : "disabled"}>进入词语与跟读</button>
  `;
}

function renderWordsPhase(scene) {
  return `
    <div class="coach-note">${icon("light")}<p>每个词先点发音，再自己读两遍。平假名不是装饰，请把长音、促音和拨音读完整。</p></div>
    <div class="word-study-list">
      ${scene.words
        .map(
          (word, index) => `<article class="word-study-card">
            <div class="word-study-number">${pad(index + 1)}</div>
            <div class="word-study-copy">
              <b>${escapeHtml(word.jp)}</b>
              <span class="word-kana">${escapeHtml(word.kana)}</span>
              <small>${escapeHtml(word.zh)} · ${escapeHtml(word.note)}</small>
            </div>
            ${audioButton(wordAudio(scene, index), `播放 ${word.jp}`)}
          </article>`,
        )
        .join("")}
    </div>
    <div class="record-card">
      <button class="record-button" id="record-button" type="button" data-action="record" aria-label="开始录音">${icon("mic")}</button>
      <div class="record-copy">
        <b id="record-title">录 20–30 秒跟读</b>
        <span id="record-status">从今天对话里选 2–3 句，录完回听节奏。</span>
        <audio class="recording-playback" id="recording-playback" controls hidden></audio>
      </div>
    </div>
    <div class="role-feedback">
      <span class="feedback-label">跟读后的真实感受</span>
      ${ratingButtons("shadow", session.shadowRating, ["跟不顺", "还凑合", "节奏稳"])}
    </div>
    <button class="button" type="button" data-action="next-phase" ${session.shadowRating ? "" : "disabled"}>进入三轮角色扮演</button>
  `;
}

function getRoleplays(scene) {
  const result = [];
  for (let index = 0; index < scene.dialogue.length; index += 1) {
    const line = scene.dialogue[index];
    if (line.side !== "learner") continue;
    let prompt = scene.dialogue[index - 1] || scene.dialogue[0];
    result.push({
      index,
      prompt,
      task: line.zh,
      hint: line.hint || "先抓住关键词，再用完整短句。",
      model: line.jp,
      kana: line.kana,
      modelAudio: dialogueAudio(scene, index),
      promptAudio: dialogueAudio(scene, index - 1 < 0 ? 0 : index - 1),
    });
  }
  return result;
}

function renderRoleplay(scene) {
  const rounds = getRoleplays(scene);
  const round = rounds[session.roleRound];
  const feedback = session.roleFeedback[session.roleRound] || { difficulty: null, blockers: [] };
  const strategy = getStrategy();
  const final = session.roleRound === rounds.length - 1;
  return `
    <div class="adaptive-card">
      <div class="adaptive-top"><span class="adaptive-badge">${icon("spark")}实时策略 · ${escapeHtml(strategy.mode)}</span><small>每轮自评后会调整重点</small></div>
      <h3>${escapeHtml(strategy.title)}</h3>
      <p>${escapeHtml(strategy.body)}</p>
    </div>
    <div class="roleplay-shell revised-roleplay">
      <div class="roleplay-top">
        <span class="roleplay-person">ハ</span>
        <div><b>${escapeHtml(round.prompt.speaker || "ハルト")}</b><small>ハルト的年轻日本男生声线 · 第 ${session.roleRound + 1} / ${rounds.length} 轮</small></div>
      </div>
      <div class="roleplay-body">
        <div class="roleplay-said">
          <small>对方说</small>
          <p>${escapeHtml(round.prompt.jp)}</p>
          <p class="kana-inline">${escapeHtml(round.prompt.kana)}</p>
          <p class="zh-text">${escapeHtml(round.prompt.zh)}</p>
          ${audioButton(round.promptAudio, "播放对方的话", "button soft")}
        </div>
        <div class="your-task"><small>YOUR TURN · 请直接开口</small><p>${escapeHtml(round.task)}</p></div>
        ${
          session.hintShown
            ? `<div class="hint-box"><p><b>关键词：${escapeHtml(round.hint)}</b><br />先按关键词说一遍，再不用提示说完整版。</p></div>`
            : `<button class="text-button" type="button" data-action="show-hint">卡住了，给关键词</button>`
        }
        <textarea class="response-note" data-draft="role-${session.roleRound}" placeholder="说完后，可记录你实际说出的内容（可选）">${escapeHtml(session.drafts[`role-${session.roleRound}`] || "")}</textarea>
        ${
          session.roleRevealed
            ? `<div class="hint-box model-box">
                <p><b>自然示范</b></p>
                ${readingLine(round.model, round.kana, "", round.modelAudio, { compact: true })}
                <small>不用逐字复刻；保留你的信息，再完整说一遍。</small>
              </div>
              <div class="role-feedback">
                <span class="feedback-label">这一轮有多难？</span>
                ${ratingButtons("role", feedback.difficulty, ["很吃力", "刚刚好", "很轻松"])}
                <span class="feedback-label" style="margin-top:13px">主要卡在哪里？可多选</span>
                <div class="blocker-chips">
                  ${BLOCKERS.map((item) => `<button class="blocker-chip ${feedback.blockers.includes(item.id) ? "is-selected" : ""}" type="button" data-action="toggle-blocker" data-blocker="${item.id}">${escapeHtml(item.label)}</button>`).join("")}
                </div>
              </div>`
            : `<button class="button indigo" type="button" data-action="reveal-role">我说完了，对照示范</button>`
        }
      </div>
    </div>
    <div class="roleplay-progress">${rounds.map((_, index) => `<span class="${index <= session.roleRound ? "active" : ""}"></span>`).join("")}</div>
    ${
      session.roleRevealed
        ? `<button class="button" type="button" data-action="next-role" ${feedback.difficulty ? "" : "disabled"}>${final ? "完成三轮，进入语法总结" : "下一轮对话"}</button>`
        : ""
    }
  `;
}

function renderGrammarPhase(scene) {
  const grammar = scene.grammar;
  return `
    <article class="grammar-card">
      <p class="lesson-kicker">TODAY'S GRAMMAR</p>
      <h2>${escapeHtml(grammar.title)}</h2>
      <p class="grammar-explanation">${escapeHtml(grammar.explain)}</p>
      ${grammar.examples
        .map((example, index) => `<div class="grammar-example">
          ${readingLine(example.jp, example.kana, example.zh, grammarAudio(scene))}
          ${index === 0 ? "" : ""}
        </div>`)
        .join("")}
      <div class="caution-note"><b>别这样说 / 注意</b><p>${escapeHtml(grammar.caution)}</p></div>
    </article>
    <div class="section-heading"><h2>今天特别注意</h2></div>
    <div class="attention-list">
      ${scene.attention.map((item, index) => `<article><span>${index + 1}</span><p>${escapeHtml(item)}</p></article>`).join("")}
    </div>
    ${nextButton("进入地道用法")}
  `;
}

function renderNaturalPhase(scene) {
  const roleplays = getRoleplays(scene);
  const round = roleplays[roleplays.length - 1];
  return `
    <div class="coach-note">${icon("light")}<p>下面两句是日本人日常更自然的反应。先听语气，再把它放回今天的场景里说一遍。</p></div>
    <div class="natural-list">
      ${scene.natural
        .map(
          (item, index) => `<article class="natural-card">
            <div class="natural-head">${icon("spark")}<span>地道反应 ${index + 1}</span>${bookmarkButton(scene, "natural", index)}</div>
            ${readingLine(item.jp, item.kana, item.zh, naturalAudio(scene, index))}
            <p>${escapeHtml(item.note)}</p>
          </article>`,
        )
        .join("")}
    </div>
    <article class="practice-card variation-card">
      <p class="lesson-kicker">真实变式</p>
      <h2>${escapeHtml(scene.variations[0].setup)}</h2>
      <p>${escapeHtml(scene.variations[0].task)}</p>
      <button class="text-button" type="button" data-action="reveal-variation">说完了，看一个参考方向</button>
      <div class="reveal-answer" id="variation-answer" hidden>
        ${readingLine(round.model, round.kana, "这是今天对话里的参考句；真实回答可按你的情况替换信息。", round.modelAudio)}
      </div>
    </article>
    ${nextButton("查看今日完整总结")}
  `;
}

function summarySheet(scene) {
  return `<div class="summary-sheet">
    <section class="summary-section">
      <div class="summary-heading"><span>01</span><div><h3>今日词语</h3><small>${scene.words.length} 个 · 全部带平假名</small></div></div>
      <div class="summary-word-grid">
        ${scene.words
          .map(
            (word, index) => `<div class="summary-word">
              <div><b>${escapeHtml(word.jp)}</b><span>${escapeHtml(word.kana)}</span></div>
              <p>${escapeHtml(word.zh)}</p><small>${escapeHtml(word.note)}</small>
              ${audioButton(wordAudio(scene, index), "播放这个词", "mini-audio")}
            </div>`,
          )
          .join("")}
      </div>
    </section>
    <section class="summary-section">
      <div class="summary-heading"><span>02</span><div><h3>核心语法</h3><small>${escapeHtml(scene.grammar.title)}</small></div></div>
      <div class="summary-grammar">
        <p>${escapeHtml(scene.grammar.explain)}</p>
        ${scene.grammar.examples
          .map(
            (example, index) => `<div class="sentence-row">
              ${readingLine(example.jp, example.kana, example.zh, grammarAudio(scene), { compact: true })}
              ${bookmarkButton(scene, "scene-grammar", index)}
            </div>`,
          )
          .join("")}
        <div class="caution-note"><b>注意</b><p>${escapeHtml(scene.grammar.caution)}</p></div>
      </div>
    </section>
    <section class="summary-section">
      <div class="summary-heading"><span>03</span><div><h3>今日注意点</h3><small>避免中文直译和语体误用</small></div></div>
      <div class="attention-list">${scene.attention.map((item, index) => `<article><span>${index + 1}</span><p>${escapeHtml(item)}</p></article>`).join("")}</div>
    </section>
    <section class="summary-section">
      <div class="summary-heading"><span>04</span><div><h3>地道用法</h3><small>日本人日常更自然的反应</small></div></div>
      <div class="natural-list">
        ${scene.natural
          .map(
            (item, index) => `<article class="natural-card compact-natural">
              <div class="natural-head"><span class="natural-label">NATURAL</span>${bookmarkButton(scene, "natural", index)}</div>
              ${readingLine(item.jp, item.kana, item.zh, naturalAudio(scene, index), { compact: true })}
              <p>${escapeHtml(item.note)}</p>
            </article>`,
          )
          .join("")}
      </div>
    </section>
  </div>`;
}

function renderGrammarTrack(scene) {
  const module = grammarModuleForScene(scene);
  return `<article class="grammar-track-card">
    <div class="grammar-track-head">
      <span>系统语法轨道 ${GRAMMAR_MODULES.findIndex((item) => item.id === module.id) + 1}/16</span>
      <b>${escapeHtml(module.title)}</b>
    </div>
    <p class="grammar-premise">${escapeHtml(module.premise)}</p>
    <div class="grammar-example-list">
      ${module.examples
        .map(
          (example, index) => `<div class="sentence-row">
            ${readingLine(example.jp, example.kana, example.zh, grammarModuleAudio(module, index), { compact: true })}
            ${bookmarkButton(scene, "grammar-module", index, module.id)}
          </div>`,
        )
        .join("")}
    </div>
    <details class="form-guide">
      <summary>什么时候用哪种形态？打开完整判断表</summary>
      ${Object.entries(FORM_GUIDE)
        .map(
          ([key, item]) => `<div class="form-guide-row">
            <b>${escapeHtml(item.label)}</b>
            <p>${escapeHtml(item.use)}</p>
            <small>注意：${escapeHtml(item.caution)}</small>
          </div>`,
        )
        .join("")}
    </details>
    <details class="form-guide grammar-map">
      <summary>查看 16 模块系统语法全景</summary>
      ${GRAMMAR_MODULES.map(
        (item, index) => `<div class="grammar-map-row ${item.id === module.id ? "is-current" : ""}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.premise)}</p></div>
        </div>`,
      ).join("")}
    </details>
  </article>`;
}

function renderVerbLab(scene) {
  const verbs = verbsForScene(scene);
  return `<section class="verb-lab">
    <div class="section-heading"><h2>动词全形态实验室</h2><span class="pill indigo">每天 3 个</span></div>
    ${verbs
      .map(
        (verb, index) => `<article class="verb-card">
          <div class="verb-head">
            <div><b>${escapeHtml(verb.word)}</b><span>${escapeHtml(verb.kana)} · ${escapeHtml(verb.group)} · ${escapeHtml(verb.meaning)}</span></div>
            ${bookmarkButton(scene, "verb", index, verb.id)}
          </div>
          <div class="verb-example">
            ${readingLine(verb.example.jp, verb.example.kana, verb.example.zh, verbAudio(verb), { compact: true })}
          </div>
          <div class="conjugation-grid">
            ${Object.entries(verbForms(verb))
              .map(
                ([key, [jp, kana]]) => `<div>
                  <small>${escapeHtml(FORM_GUIDE[key].label)}</small>
                  <b>${escapeHtml(jp)}</b>
                  <span>${escapeHtml(kana)}</span>
                </div>`,
              )
              .join("")}
          </div>
        </article>`,
      )
      .join("")}
  </section>`;
}

function renderSummaryPhase(scene) {
  return `
    <div class="complete-card compact-complete">
      <div class="complete-mark">${icon("check")}</div>
      <h2>今天，带走一整包语言材料</h2>
      <p>${sentencePack(scene).length} 句、6 个核心词、3 个动词全形态、系统语法与地道反应。重点句可以逐条加入手册。</p>
      <div class="complete-stats">
        <div><strong>${sentencePack(scene).length}</strong><span>完整句</span></div>
        <div><strong>${verbsForScene(scene).length}</strong><span>动词实验室</span></div>
        <div><strong>${GRAMMAR_MODULES.length}</strong><span>语法轨道模块</span></div>
      </div>
    </div>
    ${summarySheet(scene)}
    <div class="section-heading"><h2>系统语法 · 今日轨道</h2><span class="pill red">每天加练 6 句</span></div>
    ${renderGrammarTrack(scene)}
    ${renderVerbLab(scene)}
    <div class="reflection-block">
      <h3>今天最能直接用的一句</h3>
      <p>不看上方，先说出口，再记录你实际说出的内容。</p>
      <textarea class="note-field" data-draft="takeaway" placeholder="例如：${escapeHtml(scene.natural[0].jp)}">${escapeHtml(session.drafts.takeaway || "")}</textarea>
    </div>
    <div class="reflection-block">
      <h3>下次最需要复习的地方</h3>
      <div class="blocker-chips">
        ${BLOCKERS.map((item) => `<button class="blocker-chip ${session.drafts.nextBlocker === item.id ? "is-selected" : ""}" type="button" data-action="set-next-blocker" data-blocker="${item.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
    </div>
    <button class="button" type="button" data-action="finish-session">保存表现，更新下一课策略</button>
  `;
}

function ratingButtons(kind, selected, labels) {
  return `<div class="rating-row">${labels
    .map(
      (label, index) => `<button class="rating-button ${Number(selected) === index + 1 ? "is-selected" : ""}" type="button" data-action="set-rating" data-kind="${kind}" data-value="${index + 1}">${escapeHtml(label)}</button>`,
    )
    .join("")}</div>`;
}

function nextButton(label) {
  return `<div class="step-actions"><button class="button" type="button" data-action="next-phase">${escapeHtml(label)} ${icon("arrow")}</button></div>`;
}

function renderCourse() {
  return `<div class="page">
    <p class="eyebrow">56 DAILY CONVERSATIONS</p>
    <h1 class="page-title">每天一场景，<br />练到能自然回应。</h1>
    <p class="page-lead">周一到周日各有独立主题。每天约 60 分钟，不会用同一段模板对话重复七天。</p>
    <div class="course-intro">当前完成 ${state.completed.length} / 56 天。点击任意一天，可以直接进入当天的对话讲义和练习。</div>
    ${Array.from({ length: 8 }, (_, index) => index + 1)
      .map((number) => {
        const info = weekInfo(number);
        const scenes = DAILY_SCENES.filter((scene) => scene.week === number);
        const done = scenes.filter((scene) => state.completed.includes(dayKey(number, scene.day))).length;
        const open = expandedWeek === number;
        return `<section class="week-accordion ${open ? "is-open" : ""}">
          <button class="week-toggle" type="button" data-action="toggle-week" data-week="${number}" aria-expanded="${open}">
            <span class="week-number">W${number}</span>
            <span class="week-toggle-copy"><b>${escapeHtml(info.title)}</b><small>${done} / 7 天 · ${escapeHtml(info.canDo)}</small></span>
            <svg class="chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="week-content">
            <div class="week-cando"><b>本阶段目标：</b>${escapeHtml(info.canDo)}</div>
            ${scenes
              .map((scene) => {
                const active = state.week === scene.week && state.day === scene.day;
                return `<button class="day-row ${state.completed.includes(dayKey(number, scene.day)) ? "done" : ""} ${active ? "active" : ""}" type="button" data-action="select-day" data-week="${number}" data-day="${scene.day}">
                  <span class="day-row-index">${state.completed.includes(dayKey(number, scene.day)) ? "✓" : scene.day}</span>
                  <span class="day-row-copy"><b>DAY ${pad(scene.id)} · ${escapeHtml(scene.title)}</b><small>${escapeHtml(scene.category)} · ${escapeHtml(scene.goal)}</small></span>
                  ${icon("arrow")}
                </button>`;
              })
              .join("")}
          </div>
        </section>`;
      })
      .join("")}
  </div>`;
}

function renderNotebook() {
  const scene = DAILY_SCENES.find((item) => item.week === journalWeek && item.day === journalDay) || currentScene();
  return `<div class="page">
    <p class="eyebrow">DAILY NOTES & SENTENCE BOOK</p>
    <h1 class="page-title">讲义与重点句，<br />整理成自己的册。</h1>
    <p class="page-lead">每天 ${sentencePack(scene).length} 句学习材料。标记不熟的句子，之后集中复习，不让重点散落。</p>
    <div class="notebook-mode-tabs">
      <button class="${state.notebookMode === "lesson" ? "is-selected" : ""}" type="button" data-action="set-notebook-mode" data-mode="lesson">完整讲义</button>
      <button class="${state.notebookMode === "saved" ? "is-selected" : ""}" type="button" data-action="set-notebook-mode" data-mode="saved">重点句 ${state.savedSentences.length}</button>
    </div>
    ${state.notebookMode === "saved" ? renderSavedNotebook() : `
    <div class="journal-week-tabs">
      ${Array.from({ length: 8 }, (_, index) => index + 1)
        .map((number) => `<button class="${journalWeek === number ? "is-selected" : ""}" type="button" data-action="select-journal-week" data-week="${number}">W${number}</button>`)
        .join("")}
    </div>
    <div class="journal-day-tabs">
      ${DAILY_SCENES.filter((item) => item.week === journalWeek)
        .map((item) => `<button class="${journalDay === item.day ? "is-selected" : ""}" type="button" data-action="select-journal-day" data-day="${item.day}"><b>${item.day}</b><span>${escapeHtml(item.category)}</span></button>`)
        .join("")}
    </div>
    <article class="journal-hero">
      <div class="journal-hero-top"><span>DAY ${pad(scene.id)}</span><span>${escapeHtml(scene.category)}</span></div>
      <h2>${escapeHtml(scene.title)}</h2>
      <p>${escapeHtml(scene.place)} · ${escapeHtml(scene.goal)}</p>
      <div class="journal-dialogue-lines">
        ${scene.dialogue
          .slice(0, 2)
          .map(
            (line, index) => `<div>
              <span>${escapeHtml(line.speaker)}</span>
              <p>${escapeHtml(line.jp)}</p>
              <small>${escapeHtml(line.kana)}</small>
              ${bookmarkButton(scene, "dialogue", index)}
              ${audioButton(dialogueAudio(scene, index), "播放这句", "mini-audio")}
            </div>`,
          )
          .join("")}
      </div>
      <button class="button secondary" type="button" data-action="start-journal-scene" data-scene-id="${scene.id}">按一小时流程练这一天 ${icon("arrow")}</button>
    </article>
    ${summarySheet(scene)}
    <div class="section-heading"><h2>系统语法 · 今日轨道</h2><span class="pill red">6 句加练</span></div>
    ${renderGrammarTrack(scene)}
    ${renderVerbLab(scene)}
    `}
  </div>`;
}

function renderSavedNotebook() {
  if (!state.savedSentences.length) {
    return `<div class="empty-notebook">
      <div class="empty-mark">${icon("star")}</div>
      <h2>还没有重点句</h2>
      <p>在对话、系统语法、地道表达或动词实验室里点“＋”，句子就会汇总到这里。</p>
      <button class="button secondary" type="button" data-action="set-notebook-mode" data-mode="lesson">去挑几句</button>
    </div>`;
  }
  const sorted = state.savedSentences
    .slice()
    .sort((a, b) => (a.reviewCount || 0) - (b.reviewCount || 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
  return `<div class="saved-toolbar">
    <span>按“复习次数少 → 多”排列，最不熟的先出现</span>
    <button type="button" data-action="copy-saved">复制全部</button>
  </div>
  <div class="saved-sentence-list">
    ${sorted
      .map(
        (item) => `<article class="saved-sentence-card">
          <div class="saved-meta"><span>DAY ${pad(item.sceneId)} · ${escapeHtml(item.label)}</span><b>${item.reviewCount || 0} 次复习</b></div>
          ${readingLine(item.jp, item.kana, item.zh, item.audio)}
          <div class="saved-actions">
            ${!item.audio ? `<button type="button" data-action="speak-saved" data-key="${escapeHtml(item.key)}">播放</button>` : ""}
            <button type="button" data-action="review-saved" data-key="${escapeHtml(item.key)}">${icon("check")} 复习一次</button>
            <button type="button" data-action="remove-saved" data-key="${escapeHtml(item.key)}">移除</button>
          </div>
        </article>`,
      )
      .join("")}
  </div>`;
}

function renderChat() {
  const scene = currentScene();
  const connected = Boolean(state.ai.endpoint && state.ai.model);
  const partnerTurns = scene.dialogue.filter((line) => line.side === "partner");
  return `<div class="page chat-page">
    <p class="eyebrow">LIVE WITH HARUTO · ${escapeHtml(scene.title)}</p>
    <h1 class="page-title">说完以后，<br />马上和ハルト对一轮。</h1>
    <p class="page-lead">他会用自然日语接话；回答中的日语、假名和中文提示会同时保留。模型接口未配置时，会使用今天的预写场景继续，不会伪装成实时 AI。</p>
    <div class="sound-credit chat-credit">
      <span class="sound-avatar">ハ</span>
      <div><b>ハルト · 元气热血少年声线</b><small>更接近日漫少年角色的高音与活力，不复制具体声优本人</small></div>
      <span class="online-dot ${connected ? "is-online" : ""}">${connected ? "AI 在线" : "预写模式"}</span>
    </div>
    <div class="chat-scene-card">
      <small>今日场景</small><p>${escapeHtml(scene.place)} · ${escapeHtml(scene.goal)}</p>
      <button type="button" data-action="quick-chat" data-text="まず、今日の場面を一緒に練習しましょう。">跟我练这一场</button>
      <button type="button" data-action="quick-chat" data-text="私の日本語で、不自然なところはありますか。">让我反馈</button>
      <button type="button" data-action="quick-chat" data-text="もう少し難しい質問をしてください。">提高难度</button>
    </div>
    <div class="chat-message-list" id="chat-message-list">
      ${
        state.chatMessages.length
          ? state.chatMessages.map((message, index) => renderChatMessage(message, index)).join("")
          : `<div class="chat-bubble partner">
              <div class="chat-bubble-head"><span>ハルト</span><small>まずは今日の場面から</small></div>
              ${readingLine(partnerTurns[0].jp, partnerTurns[0].kana, partnerTurns[0].zh, dialogueAudio(scene, 0))}
            </div>`
      }
      ${chatBusy ? `<div class="chat-typing">ハルトが返事を考えています…</div>` : ""}
    </div>
    <div class="chat-composer">
      <button type="button" class="chat-mic" data-action="chat-mic" aria-label="语音输入">${icon("mic")}</button>
      <textarea id="chat-input" placeholder="用日语回答；不会时先说「すみません、もう一度お願いします」"></textarea>
      <button type="button" class="chat-send" data-action="send-chat" ${chatBusy ? "disabled" : ""}>${icon("arrow")}</button>
    </div>
    <div class="chat-actions">
      <button type="button" data-action="clear-chat">清空本轮</button>
      <button type="button" data-action="save-chat-tip">收藏最后一条提示</button>
    </div>
    <details class="ai-settings">
      <summary>${connected ? "模型接口已连接" : "连接实时 AI 对谈"}</summary>
      <label>接口地址（Chat Completions）<input id="ai-endpoint" value="${escapeHtml(state.ai.endpoint)}" placeholder="https://…/v1/chat/completions"></label>
      <div class="ai-settings-grid">
        <label>模型<input id="ai-model" value="${escapeHtml(state.ai.model)}" placeholder="模型名称"></label>
        <label>API Key<input id="ai-key" type="password" value="${escapeHtml(state.ai.key)}" placeholder="可留空"></label>
      </div>
      <button class="button secondary" type="button" data-action="save-ai">保存接口</button>
      <p>配置仅保存在本机浏览器。实时声音使用设备日语语音合成；课程例句使用预生成的统一少年声线。</p>
    </details>
  </div>`;
}

function renderChatMessage(message, index) {
  if (message.role === "user") {
    return `<div class="chat-bubble user">
      <div class="chat-bubble-head"><span>你</span><small>${message.time ? new Date(message.time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : ""}</small></div>
      <p>${escapeHtml(message.content)}</p>
    </div>`;
  }
  if (message.jp) {
    return `<div class="chat-bubble partner">
      <div class="chat-bubble-head"><span>ハルト</span><span class="chat-bubble-tools"><button class="bubble-speak" type="button" data-action="speak-chat" data-index="${index}" aria-label="播放回复">${icon("sound")}</button>${bookmarkChatButton(index)}</span></div>
      ${readingLine(message.jp, message.kana || "", message.zh || "", "", { compact: true })}
      ${message.note ? `<div class="chat-note"><b>提示</b><p>${escapeHtml(message.note)}</p></div>` : ""}
    </div>`;
  }
  return `<div class="chat-bubble partner"><div class="chat-bubble-head"><span>ハルト</span></div><p>${escapeHtml(message.content)}</p></div>`;
}

function bookmarkChatButton(index) {
  const saved = state.savedSentences.some((item) => item.key === `chat:${index}`);
  return `<button class="bookmark-button ${saved ? "is-saved" : ""}" type="button" data-action="save-chat-sentence" data-index="${index}">${icon(saved ? "star" : "plus")}</button>`;
}

function buildChatPrompt() {
  const scene = currentScene();
  const module = grammarModuleForScene(scene);
  const verbs = verbsForScene(scene);
  return `你是「ハルト」：20岁的日本男生，性格阳光、反应快，像热血日漫里的可靠朋友。你在陪中文母语者练日语，当前场景是「${scene.title}」（${scene.place}），目标是：${scene.goal}。

必须使用自然、适合 N4–N3 学习者的日语，不说教科书腔。每次只回 1–2 个短句，并提出一个问题让对话继续。不要替用户完成整段对话。
今天的系统语法是「${module.title}」；今天练习动词：${verbs.map((verb) => `${verb.word}（${verb.group}）`).join("、")}。

严格遵守以下输出格式，不要增加其他标题：
JP: 日语回复
KANA: 整句平假名读音
ZH: 中文意思
NOTE: 如果用户上一句有明显错误，用中文只指出一处最影响自然度的修正；没有错误就写“自然，继续。”`;
}

function parseChatReply(raw) {
  const text = String(raw || "").replace(/\r/g, "").trim();
  const field = (name) => {
    const match = text.match(new RegExp(`(?:^|\\n)${name}[:：]\\s*(.+)`, "i"));
    return match ? match[1].trim() : "";
  };
  const jp = field("JP");
  const kana = field("KANA");
  const zh = field("ZH");
  const note = field("NOTE");
  return jp
    ? { role: "assistant", jp, kana, zh, note, content: `${jp}\n${kana}\n${zh}\n${note}`, time: new Date().toISOString() }
    : { role: "assistant", content: text, time: new Date().toISOString() };
}

function localChatTurn() {
  const scene = currentScene();
  const partnerLines = scene.dialogue.filter((line) => line.side === "partner");
  const partnerCount = state.chatMessages.filter((message) => message.role === "assistant").length;
  const line = partnerLines[partnerCount % partnerLines.length];
  return {
    role: "assistant",
    jp: line.jp,
    kana: line.kana,
    zh: line.zh,
    note: "当前是预写对谈。配置模型接口后，ハルト会根据你的实际回答继续追问。",
    content: line.jp,
    time: new Date().toISOString(),
  };
}

async function sendChat(quickText = "") {
  if (chatBusy) return;
  const input = document.getElementById("chat-input");
  const text = (quickText || input?.value || "").trim();
  if (!text) return;
  state.chatMessages.push({ role: "user", content: text, time: new Date().toISOString() });
  chatBusy = true;
  saveState();
  render();
  const list = document.getElementById("chat-message-list");
  if (list) list.scrollTop = list.scrollHeight;

  let reply;
  if (state.ai.endpoint && state.ai.model) {
    try {
      const messages = [
        { role: "system", content: buildChatPrompt() },
        ...state.chatMessages.slice(-10).map((message) => ({
          role: message.role,
          content: message.jp
            ? `JP: ${message.jp}\nKANA: ${message.kana || ""}\nZH: ${message.zh || ""}\nNOTE: ${message.note || ""}`
            : message.content,
        })),
      ];
      const response = await fetch(state.ai.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(state.ai.key ? { Authorization: `Bearer ${state.ai.key}` } : {}),
        },
        body: JSON.stringify({ model: state.ai.model, messages, temperature: 0.8 }),
      });
      if (!response.ok) throw new Error(`接口返回 ${response.status}`);
      const data = await response.json();
      const raw =
        data?.choices?.[0]?.message?.content ||
        data?.output_text ||
        data?.message?.content ||
        "";
      if (!raw) throw new Error("模型没有返回内容");
      reply = parseChatReply(raw);
    } catch (error) {
      reply = localChatTurn();
      reply.note = `实时接口失败（${error.message}）。这条先用预写场景继续。`;
    }
  } else {
    reply = localChatTurn();
  }
  state.chatMessages.push(reply);
  chatBusy = false;
  state.chatMessages = state.chatMessages.slice(-100);
  saveState();
  render();
  const newList = document.getElementById("chat-message-list");
  if (newList) newList.scrollTop = newList.scrollHeight;
}

function speakBoy(text) {
  if (!("speechSynthesis" in window) || !text) {
    showToast("当前浏览器没有实时日语语音合成。");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text).replace(/【中文提示】[\s\S]*/, ""));
  utterance.lang = "ja-JP";
  utterance.rate = 1.04;
  utterance.pitch = 1.32;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function saveChatSentence(index) {
  const message = state.chatMessages[Number(index)];
  if (!message?.jp) return;
  const key = `chat:${index}`;
  const existing = state.savedSentences.findIndex((item) => item.key === key);
  if (existing >= 0) {
    state.savedSentences.splice(existing, 1);
    showToast("已从重点句手册移除。");
  } else {
    state.savedSentences.push({
      key,
      type: "chat",
      jp: message.jp,
      kana: message.kana || "",
      zh: message.zh || "",
      label: "实时对谈 · ハルト",
      audio: "",
      sceneId: currentScene().id,
      week: currentScene().week,
      day: currentScene().day,
      sceneTitle: currentScene().title,
      createdAt: new Date().toISOString(),
      reviewCount: 0,
      lastReviewed: null,
    });
    showToast("这句已加入重点句手册。");
  }
  saveState();
  render();
}

function saveChatTip() {
  const message = state.chatMessages.slice().reverse().find((item) => item.role === "assistant" && (item.jp || item.content));
  if (!message) {
    showToast("还没有可以收藏的提示。");
    return;
  }
  if (message.jp) saveChatSentence(state.chatMessages.indexOf(message));
  else showToast("这条回复没有配套假名，暂不收入重点句。");
}

function saveAiSettings() {
  state.ai.endpoint = document.getElementById("ai-endpoint")?.value.trim() || "";
  state.ai.model = document.getElementById("ai-model")?.value.trim() || "";
  state.ai.key = document.getElementById("ai-key")?.value.trim() || "";
  saveState();
  render();
  showToast(state.ai.endpoint && state.ai.model ? "实时对谈已配置。" : "已清除接口配置。");
}

function startSpeechInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showToast("当前浏览器不支持日语语音输入，请直接输入。");
    return;
  }
  if (speechRecognition) {
    speechRecognition.stop();
    speechRecognition = null;
    return;
  }
  speechRecognition = new Recognition();
  speechRecognition.lang = "ja-JP";
  speechRecognition.interimResults = false;
  speechRecognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const input = document.getElementById("chat-input");
    if (input) input.value = text;
    showToast(`听到：${text}`);
  };
  speechRecognition.onerror = () => showToast("语音输入没有成功，请再说一次或改用文字。");
  speechRecognition.onend = () => {
    speechRecognition = null;
  };
  speechRecognition.start();
}

function renderProgress() {
  const percent = Math.round((state.completed.length / 56) * 100);
  const strategy = getStrategy();
  const notes = Object.entries(state.notes).sort();
  const lastNote = notes[notes.length - 1];
  return `<div class="page">
    <p class="eyebrow">YOUR PROGRESS</p>
    <h1 class="page-title">让每天都有迹可循。</h1>
    <p class="page-lead">这里显示练习掌握度，不是正式日语等级。分数会随任务、卡点和复习表现变化。</p>
    <section class="progress-hero">
      <div class="progress-ring" style="--value: ${percent}"><div class="progress-ring-copy"><strong>${percent}%</strong><small>56 天</small></div></div>
      <div class="progress-summary"><h2>${state.completed.length} 天已完成</h2><p>${escapeHtml(strategy.title)}<br />下一步重点：${escapeHtml(SKILL_LABELS[weakestSkill()])}</p></div>
    </section>
    <div class="stat-strip">
      <div><strong>${state.sessions}</strong><span>训练次数</span></div>
      <div><strong>${state.totalMinutes}</strong><span>累计分钟</span></div>
      <div><strong>${state.streak}</strong><span>连续天数</span></div>
    </div>
    <div class="section-heading"><h2>能力信号</h2><button type="button" data-route="course">看完整课程</button></div>
    <section class="practice-card">
      <div class="skill-grid">
        ${Object.entries(state.skills)
          .map(
            ([skill, value]) => `<div class="skill-row"><b>${escapeHtml(SKILL_LABELS[skill])}</b><div class="skill-track"><i style="width:${Math.max(4, Math.min(100, value))}%"></i></div><span>${Math.round(value)}</span></div>`,
          )
          .join("")}
      </div>
    </section>
    <div class="insight-card"><small>NEXT SESSION</small><p>${escapeHtml(strategy.body)}</p></div>
    ${
      lastNote
        ? `<div class="history-note"><b>最近带走的一句</b>${escapeHtml(lastNote[1].takeaway || "还没有记录。")}</div>`
        : ""
    }
    <div class="section-heading"><h2>56 天路径</h2><span class="pill">${state.completed.length} / 56</span></div>
    <section class="practice-card">
      ${Array.from({ length: 8 }, (_, index) => index + 1)
        .map((week) => {
          const done = DAILY_SCENES.filter((scene) => scene.week === week && state.completed.includes(dayKey(week, scene.day))).length;
          return `<div class="week-progress-row"><b>第 ${week} 周</b><div class="week-progress-track"><i style="width:${(done / 7) * 100}%"></i></div><span>${done}/7</span></div>`;
        })
        .join("")}
      <div class="course-map" style="margin-top:17px">
        ${DAILY_SCENES.map((scene) => `<span class="${state.completed.includes(dayKey(scene.week, scene.day)) ? "done" : state.week === scene.week && state.day === scene.day ? "active" : ""}">${scene.day}</span>`).join("")}
      </div>
    </section>
    <div class="settings-zone"><button class="text-danger" type="button" data-action="reset-progress">清除本机练习记录</button></div>
  </div>`;
}

function render() {
  const header = document.getElementById("app-header");
  const nav = document.getElementById("bottom-nav");
  const main = document.getElementById("main-content");
  const isSession = route === "session";
  header.hidden = isSession;
  nav.hidden = isSession;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });
  const notebookLabel = document.querySelector('[data-route="notebook"] span');
  if (notebookLabel) notebookLabel.textContent = state.savedSentences.length ? `手册 ${state.savedSentences.length}` : "手册";
  if (route === "course") main.innerHTML = renderCourse();
  else if (route === "notebook") main.innerHTML = renderNotebook();
  else if (route === "chat") main.innerHTML = renderChat();
  else if (route === "progress") main.innerHTML = renderProgress();
  else if (route === "session") main.innerHTML = renderSession();
  else main.innerHTML = renderHome();
  if (isSession) ensureTimer();
}

function setRoute(nextRoute) {
  if (route === "session" && nextRoute !== "session") pauseTimer();
  route = nextRoute;
  if (nextRoute === "course") expandedWeek = state.week;
  if (nextRoute === "notebook") {
    journalWeek = state.week;
    journalDay = state.day;
  }
  render();
  document.getElementById("main-content").scrollTop = 0;
}

function openSession(week, day, reset = false) {
  const scene = DAILY_SCENES.find((item) => item.week === week && item.day === day);
  if (!scene) return;
  if (reset || session.inProgressId !== scene.id) {
    session = createEmptySession();
    session.sceneId = scene.id;
    session.inProgressId = scene.id;
  }
  state.week = week;
  state.day = day;
  saveState();
  route = "session";
  render();
  document.getElementById("main-content").scrollTop = 0;
  ensureTimer();
}

function ensureTimer() {
  if (session.timerId || route !== "session") return;
  session.timerId = window.setInterval(() => {
    if (route !== "session") return;
    session.seconds += 1;
    const clock = document.getElementById("session-clock");
    if (clock) clock.textContent = formatTime(session.seconds);
  }, 1000);
}

function pauseTimer() {
  if (session.timerId) window.clearInterval(session.timerId);
  session.timerId = null;
}

function formatTime(seconds) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function setRating(kind, value) {
  if (kind === "listen") session.listenRating = value;
  if (kind === "shadow") session.shadowRating = value;
  if (kind === "role") {
    const feedback = session.roleFeedback[session.roleRound] || { difficulty: null, blockers: [] };
    feedback.difficulty = value;
    session.roleFeedback[session.roleRound] = feedback;
  }
  render();
  const main = document.getElementById("main-content");
  main.scrollTop = main.scrollHeight;
}

function toggleBlocker(blocker) {
  const feedback = session.roleFeedback[session.roleRound] || { difficulty: null, blockers: [] };
  feedback.blockers = feedback.blockers.includes(blocker)
    ? feedback.blockers.filter((item) => item !== blocker)
    : [...feedback.blockers, blocker];
  session.roleFeedback[session.roleRound] = feedback;
  render();
  const main = document.getElementById("main-content");
  main.scrollTop = main.scrollHeight;
}

function nextPhase() {
  if (session.phase < PHASES.length - 1) {
    session.phase += 1;
    session.hintShown = false;
    render();
    document.getElementById("main-content").scrollTop = 0;
  }
}

function nextRole() {
  const rounds = getRoleplays(sceneById(session.sceneId));
  if (session.roleRound < rounds.length - 1) {
    session.roleRound += 1;
    session.roleRevealed = false;
    session.hintShown = false;
    render();
    document.getElementById("main-content").scrollTop = 0;
  } else {
    session.phase = 4;
    session.roleRevealed = false;
    session.hintShown = false;
    render();
    document.getElementById("main-content").scrollTop = 0;
  }
}

function getDueReview() {
  return state.reviewQueue.find((item) => item.dueAt <= state.sessions);
}

function calculateResult() {
  const values = Object.values(session.roleFeedback)
    .map((item) => Number(item.difficulty))
    .filter(Boolean);
  const avgRating = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 2;
  const blockers = getBlockers(session.roleFeedback);
  const completion = values.length / 3;
  const score = Math.round(
    50 + (avgRating - 2) * 18 - blockers.length * 5 + completion * 12 + ((session.listenRating || 2) - 2) * 5 + ((session.shadowRating || 2) - 2) * 5,
  );
  return { score: Math.max(20, Math.min(96, score)), avgRating, blockers, completion };
}

function updateSkills(result) {
  state.skills.speaking += (result.avgRating - 2) * 4;
  state.skills.listening += ((session.listenRating || 2) - 2) * 6;
  state.skills.pronunciation += ((session.shadowRating || 2) - 2) * 6;
  result.blockers.forEach((blocker) => {
    if (Object.prototype.hasOwnProperty.call(state.skills, blocker)) state.skills[blocker] -= 4;
  });
  if (!result.blockers.length) state.skills.repair += 2;
  Object.keys(state.skills).forEach((skill) => {
    state.skills[skill] = Math.max(12, Math.min(92, state.skills[skill]));
  });
}

function updateStreak() {
  const now = new Date();
  const today = localDateKey(now);
  if (state.lastPracticeDate === today) return;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  state.streak = state.lastPracticeDate === localDateKey(yesterday) ? state.streak + 1 : 1;
  state.lastPracticeDate = today;
}

function finishSession() {
  pauseTimer();
  const scene = sceneById(session.sceneId);
  const result = calculateResult();
  const key = dayKey(scene.week, scene.day);
  const minutes = Math.max(1, Math.round(session.seconds / 60));
  state.sessions += 1;
  state.totalMinutes += minutes;
  updateStreak();
  updateSkills(result);
  const nextBlocker = session.drafts.nextBlocker || result.blockers[0] || weakestSkill();
  if (result.score < 60 || result.blockers.length) {
    if (!state.reviewQueue.some((item) => item.key === key && item.skill === nextBlocker)) {
      state.reviewQueue.push({ key, skill: nextBlocker, dueAt: state.sessions });
    }
  }
  state.reviewQueue = state.reviewQueue.filter((item) => item.dueAt <= state.sessions + 8);
  const passed = result.score >= 60;
  if (passed && !state.completed.includes(key)) state.completed.push(key);
  state.notes[`${key}-${Date.now()}`] = {
    date: localDateKey(),
    title: scene.title,
    takeaway: (session.drafts.takeaway || "").trim(),
    nextBlocker,
    score: result.score,
  };
  state.performance.push({
    key,
    score: result.score,
    avgRating: result.avgRating,
    blockers: result.blockers,
    listenRating: session.listenRating,
    shadowRating: session.shadowRating,
    minutes,
    date: localDateKey(),
  });
  state.performance = state.performance.slice(-30);
  if (passed) {
    if (scene.day < 7) {
      state.week = scene.week;
      state.day = scene.day + 1;
    } else if (scene.week < 8) {
      state.week = scene.week + 1;
      state.day = 1;
    }
  }
  session = createEmptySession();
  saveState();
  route = "home";
  render();
  document.getElementById("main-content").scrollTop = 0;
  showToast(
    passed
      ? `DAY ${pad(scene.id)} 已保存。${result.score >= 85 ? "下一次会减少提示并增加追问。" : "下一课会先复习今天的薄弱项。"}`
      : "今天先巩固，不机械推进；下次仍会回到同一场景。",
    5400,
  );
}

function resetProgress() {
  if (!window.confirm("确定清除全部练习记录吗？此操作无法撤销。")) return;
  state = clone(DEFAULT_STATE);
  session = createEmptySession();
  pauseTimer();
  saveState();
  route = "home";
  render();
  showToast("练习记录已清除。");
}

function playAudio(path, slow = false) {
  sequenceToken += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const audio = new Audio(path);
  audio.playbackRate = slow ? 0.82 : 1;
  currentAudio = audio;
  audio.play().catch(() => showToast("音频暂时无法播放，请检查网络后重试。"));
}

async function playSequence(paths, slow = false) {
  sequenceToken += 1;
  const token = sequenceToken;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  showToast(slow ? "正在慢速播放整段对话…" : "正在播放整段对话…");
  const audio = new Audio();
  currentAudio = audio;
  for (const path of paths) {
    if (token !== sequenceToken) return;
    await new Promise((resolve) => {
      audio.src = path;
      audio.playbackRate = slow ? 0.82 : 1;
      const finish = () => {
        audio.removeEventListener("ended", finish);
        audio.removeEventListener("error", finish);
        resolve();
      };
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      audio.play().catch(resolve);
    });
    if (token !== sequenceToken) return;
    await new Promise((resolve) => setTimeout(resolve, 220));
  }
}

function playScene(sceneId, slow = false) {
  const scene = sceneById(sceneId);
  return playSequence(scene.dialogue.map((_, index) => dialogueAudio(scene, index)), slow);
}

function showToast(message, duration = 2800) {
  const toast = document.getElementById("toast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), duration);
}

async function toggleRecording() {
  const button = document.getElementById("record-button");
  if (!button) return;
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showToast("当前浏览器不能录音，请直接跟读并自己计数 20–30 秒。");
    return;
  }
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingChunks = [];
    mediaRecorder = new MediaRecorder(recordingStream);
    recordingStart = Date.now();
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) recordingChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      const blob = new Blob(recordingChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const playback = document.getElementById("recording-playback");
      if (playback) {
        playback.src = URL.createObjectURL(blob);
        playback.hidden = false;
      }
      button.classList.remove("is-recording");
      button.innerHTML = icon("mic");
      const title = document.getElementById("record-title");
      const status = document.getElementById("record-status");
      if (title) title.textContent = `已录 ${Math.round((Date.now() - recordingStart) / 1000)} 秒`;
      if (status) status.textContent = "回听一次：长音、停顿和句尾是否自然？";
      recordingStream?.getTracks().forEach((track) => track.stop());
      mediaRecorder = null;
      recordingStream = null;
    });
    mediaRecorder.start();
    button.classList.add("is-recording");
    button.innerHTML = icon("stop");
    document.getElementById("record-title").textContent = "正在录音…";
    document.getElementById("record-status").textContent = "说完后点一下停止。";
  } catch {
    showToast("无法使用麦克风。请允许录音权限，或直接大声跟读。");
  }
}

document.addEventListener("click", (event) => {
  const audioTarget = event.target.closest("[data-audio]");
  if (audioTarget) {
    playAudio(audioTarget.dataset.audio, audioTarget.dataset.slow === "true");
    return;
  }
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    setRoute(routeTarget.dataset.route);
    return;
  }
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "start-session") openSession(state.week, state.day, false);
  if (action === "exit-session") setRoute("home");
  if (action === "set-readiness") {
    state.dailyReadiness[localDateKey()] = target.dataset.readiness;
    saveState();
    render();
  }
  if (action === "play-scene") playScene(Number(target.dataset.sceneId), target.dataset.slow === "true");
  if (action === "reveal-answer") {
    actionTargetClosest(target, ".practice-card", ".reveal-answer").hidden = false;
    target.hidden = true;
  }
  if (action === "next-phase") nextPhase();
  if (action === "set-rating") setRating(target.dataset.kind, Number(target.dataset.value));
  if (action === "show-hint") {
    session.hintShown = true;
    render();
    scrollChatBottom();
  }
  if (action === "reveal-role") {
    session.roleRevealed = true;
    render();
    scrollChatBottom();
  }
  if (action === "toggle-blocker") toggleBlocker(target.dataset.blocker);
  if (action === "next-role") nextRole();
  if (action === "reveal-variation") {
    document.getElementById("variation-answer").hidden = false;
    target.hidden = true;
  }
  if (action === "set-next-blocker") {
    session.drafts.nextBlocker = target.dataset.blocker;
    render();
  }
  if (action === "finish-session") finishSession();
  if (action === "toggle-week") {
    const number = Number(target.dataset.week);
    expandedWeek = expandedWeek === number ? null : number;
    render();
  }
  if (action === "select-day") openSession(Number(target.dataset.week), Number(target.dataset.day), true);
  if (action === "open-journal") {
    state.notebookMode = "lesson";
    saveState();
    setRoute("notebook");
  }
  if (action === "select-journal-week") {
    journalWeek = Number(target.dataset.week);
    journalDay = 1;
    render();
  }
  if (action === "select-journal-day") {
    journalDay = Number(target.dataset.day);
    render();
  }
  if (action === "start-journal-scene") {
    const scene = sceneById(target.dataset.sceneId);
    openSession(scene.week, scene.day, true);
  }
  if (action === "toggle-save-sentence") {
    registerSentence(
      sceneById(target.dataset.sceneId),
      target.dataset.type,
      Number(target.dataset.index),
      target.dataset.extra || "",
    );
    render();
  }
  if (action === "set-notebook-mode") {
    state.notebookMode = target.dataset.mode;
    saveState();
    render();
  }
  if (action === "review-saved") {
    const item = state.savedSentences.find((sentence) => sentence.key === target.dataset.key);
    if (item) {
      item.reviewCount = (item.reviewCount || 0) + 1;
      item.lastReviewed = new Date().toISOString();
      saveState();
      render();
      showToast(`已复习 ${item.reviewCount} 次。`);
    }
  }
  if (action === "remove-saved") {
    state.savedSentences = state.savedSentences.filter((sentence) => sentence.key !== target.dataset.key);
    saveState();
    render();
  }
  if (action === "speak-saved") {
    const item = state.savedSentences.find((sentence) => sentence.key === target.dataset.key);
    if (item) speakBoy(item.jp);
  }
  if (action === "copy-saved") {
    const text = state.savedSentences
      .map((item) => `${item.jp}\n${item.kana}\n${item.zh}`)
      .join("\n\n");
    if (!navigator.clipboard?.writeText) {
      showToast("当前浏览器不支持剪贴板复制。");
    } else {
      navigator.clipboard.writeText(text).then(
        () => showToast("重点句已复制。"),
        () => showToast("复制失败，请检查浏览器剪贴板权限。"),
      );
    }
  }
  if (action === "send-chat") sendChat();
  if (action === "quick-chat") {
    const text = target.dataset.text;
    if (text) sendChat(text);
  }
  if (action === "speak-chat") {
    const message = state.chatMessages[Number(target.dataset.index)];
    if (message?.jp || message?.content) speakBoy(message.jp || message.content);
  }
  if (action === "save-chat-sentence") saveChatSentence(Number(target.dataset.index));
  if (action === "save-chat-tip") saveChatTip();
  if (action === "save-ai") saveAiSettings();
  if (action === "chat-mic") startSpeechInput();
  if (action === "clear-chat") {
    state.chatMessages = [];
    saveState();
    render();
  }
  if (action === "record") toggleRecording();
  if (action === "reset-progress") resetProgress();
});

function actionTargetClosest(target, parentSelector, childSelector) {
  return target.closest(parentSelector).querySelector(childSelector);
}

function scrollChatBottom() {
  const main = document.getElementById("main-content");
  main.scrollTop = main.scrollHeight;
}

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-draft]")) {
    session.drafts[event.target.dataset.draft] = event.target.value;
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.getElementById("install-button").hidden = false;
});

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone =
  window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
if (isIOS && !isStandalone) document.getElementById("install-button").hidden = false;

document.getElementById("install-button").addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showToast("iPhone 请在 Safari 点“分享”，再选“添加到主屏幕”。");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById("install-button").hidden = true;
});

window.addEventListener("appinstalled", () => {
  document.getElementById("install-button").hidden = true;
  showToast("已添加到主屏幕。");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && route === "session") pauseTimer();
  if (!document.hidden && route === "session") ensureTimer();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}

render();
