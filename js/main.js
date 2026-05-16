import {
  volumes,
  bookTitles,
  siteNavBrandZh,
  PAPERMAKING_GATE_SRC,
  PAPERMAKING_PANEL_IMAGES,
  PRINTING_PANEL_IMAGES,
  COMPASS_PANEL_IMAGES,
  GUNPOWDER_PANEL_IMAGES,
  PRINTING_GATE_SRC,
  COMPASS_GATE_SRC,
  GUNPOWDER_GATE_SRC,
  CAILUN_INTERACTION_SRC,
  ZHENG_HE_INTERACTION_SRC,
  ASTRONAUT_INTERACTION_SRC,
  RED_HOOD_INTERACTION_SRC,
  JUMP_SHOW_PAGE_SRC,
  JUMP_SHOW_IMAGE_HREF,
} from "./pages-data.js";
import { startHandTracking, startCamera } from "./hand-track.js";
import {
  getCailunChatEndpoint,
  requestCharacterReply,
  getCharacterModalTitle,
  getCharacterAssistantLabel,
  getCharacterIntroHtml,
  getCharacterPlaceholder,
  getCharacterWelcomeMessage,
} from "./cailun-chat.js";

const els = {
  coverScreen: document.getElementById("cover-screen"),
  coverStart: document.getElementById("cover-start"),
  appExperience: document.getElementById("app-experience"),
  navTabs: document.getElementById("nav-tabs"),
  pageInfo: document.getElementById("page-info"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  stage: document.getElementById("book-stage"),
  frame: document.getElementById("book-frame"),
  img: document.getElementById("book-img"),
  readLayer: document.getElementById("read-layer"),
  toast: document.getElementById("toast"),
  facePanel: document.getElementById("face-panel"),
  video: document.getElementById("cam-video"),
  camOverlay: document.getElementById("cam-overlay"),
  skeletonCanvas: document.getElementById("hand-skeleton-canvas"),
  paperScanOverlay: document.getElementById("paper-scan-overlay"),
  paperScanClose: document.getElementById("paper-scan-close"),
  paperScanSheet: document.getElementById("paper-scan-sheet"),
  paperScanSheetPhoto: document.getElementById("paper-scan-sheet-photo"),
  paperScanSheetPass: document.getElementById("paper-scan-sheet-pass"),
  characterChatModal: document.getElementById("character-chat-modal"),
  characterMessages: document.getElementById("character-messages"),
  characterIntro: document.getElementById("character-intro"),
  characterModalTitle: document.getElementById("character-modal-title"),
  characterInput: document.getElementById("character-input"),
  characterSend: document.getElementById("character-send"),
  characterApiStatus: document.getElementById("character-api-status"),
  jumpShowSlot: document.getElementById("jump-show-slot"),
  jumpShowModal: document.getElementById("jump-show-modal"),
  jumpShowBackdrop: document.getElementById("jump-show-backdrop"),
  jumpShowClose: document.getElementById("jump-show-close"),
  jumpShowImg: document.getElementById("jump-show-img"),
  bgMusic: document.getElementById("bg-music"),
  coverMusicBtn: document.getElementById("cover-music-btn"),
};

const BG_MUSIC_SRC = "music/music.mp3";
const BG_MUSIC_VOLUME = 0.65;

let inBookExperience = false;
let gestureBooted = false;
let bgMusicLoadErrorShown = false;
let bgMusicAwaitingUnmute = false;

/** 上册绘本页 src → 科普模态与握拳提示文案 */
const SCIENCE_GATES = [
  {
    src: PAPERMAKING_GATE_SRC,
    modalId: "papermaking-modal",
    label: "造纸术",
    hintHtml:
      '想进入<strong>「造纸术」</strong>科普拓览？请先<strong>开启右下角摄像头</strong>，再对着画面将手<strong>握拳并保持约一秒</strong>（像握住一支笔），系统会扫描当前书页并打开大图科普。',
  },
  {
    src: PRINTING_GATE_SRC,
    modalId: "printing-modal",
    label: "活字印刷术",
    hintHtml:
      '想进入<strong>「活字印刷术」</strong>科普拓览？请先<strong>开启右下角摄像头</strong>，再对着画面将手<strong>握拳并保持约一秒</strong>，系统会扫描当前书页并打开大图科普。',
  },
  {
    src: COMPASS_GATE_SRC,
    modalId: "compass-modal",
    label: "指南针",
    hintHtml:
      '想进入<strong>「指南针」</strong>科普拓览？请先<strong>开启右下角摄像头</strong>，再对着画面将手<strong>握拳并保持约一秒</strong>，系统会扫描当前书页并打开大图科普。',
  },
  {
    src: GUNPOWDER_GATE_SRC,
    modalId: "gunpowder-modal",
    label: "火药",
    hintHtml:
      '想进入<strong>「火药」</strong>历史文化科普？请先<strong>开启右下角摄像头</strong>，再对着画面将手<strong>握拳并保持约一秒</strong>，系统会扫描当前书页并打开大图科普。',
  },
];

/** 下册绘本页 → 角色对话（共用 #character-chat-modal） */
const CHARACTER_CHAT_GATES = [
  {
    src: CAILUN_INTERACTION_SRC,
    agentKey: "cailun",
    modalId: "character-chat-modal",
    label: "蔡侯对话",
    hintHtml:
      '在本页可开启<strong>与蔡伦的对话</strong>：开启摄像头后<strong>握拳约一秒</strong>（拇指收起），扫描后会打开对话窗。',
  },
  {
    src: ZHENG_HE_INTERACTION_SRC,
    agentKey: "zhenghe",
    modalId: "character-chat-modal",
    label: "远洋针路",
    hintHtml:
      '在本页可开启<strong>与郑和的对话</strong>（侧重指南针与航海）：开启摄像头后<strong>握拳约一秒</strong>（拇指收起）。',
  },
  {
    src: ASTRONAUT_INTERACTION_SRC,
    agentKey: "astronaut",
    modalId: "character-chat-modal",
    label: "航天员对话",
    hintHtml:
      '在本页可开启<strong>与中国航天员的对话</strong>（儿童向科普）：开启摄像头后<strong>握拳约一秒</strong>（拇指收起）。',
  },
  {
    src: RED_HOOD_INTERACTION_SRC,
    agentKey: "redhood",
    modalId: "character-chat-modal",
    label: "小红帽道别",
    hintHtml:
      '在本页可<strong>与小红帽道别</strong>，为绘本收尾与升华：开启摄像头后<strong>握拳约一秒</strong>（拇指收起）。',
  },
];

const PM_TAB_COUNT = 3;

const SCROLL_HINTS_BY_SCIENCE = {
  paper: [
    "当前：发明家与地位 · 在右侧慢慢读；滚到最底后再向下滚 → 进入「造纸流程」",
    "当前：造纸流程 · 滚到顶再向上滚 → 返回上一板块；滚到底再向下滚 → 进入「纸与书的演变」",
    "当前：纸与书的演变 · 滚到顶再向上滚 → 返回「造纸流程」",
  ],
  printing: [
    "当前：毕昇与历史地位 · 滚到最底后再向下滚 → 进入「制字与刷印」",
    "当前：制字与刷印 · 边界处继续滚轮可切换上一/下一板块",
    "当前：传播与演变 · 滚到顶再向上滚 → 返回上一板块",
  ],
  compass: [
    "当前：司南与原理 · 滚到最底后再向下滚 → 进入「形制与应用」",
    "当前：形制与应用 · 边界处继续滚轮可切换上一/下一板块",
    "当前：航海与世界 · 滚到顶再向上滚 → 返回上一板块",
  ],
  gunpowder: [
    "当前：发现与成分 · 滚到最底后再向下滚 → 进入「军事与工程」",
    "当前：军事与工程 · 边界处继续滚轮可切换上一/下一板块",
    "当前：影响与反思 · 滚到顶再向上滚 → 返回上一板块",
  ],
};

const firstVolumeWithPages = () => {
  const i = volumes.findIndex((v) => v.pages && v.pages.length > 0);
  return i >= 0 ? i : 0;
};

let volIndex = firstVolumeWithPages();
let pageIndex = 0;
let scale = 1;
let handStop = null;
let camStream = null;
let currentAudio = null;

let paperJourneyBusy = false;
/** 每次关闭科普或取消扫描时自增；进行中的握拳流程若发现已变化则不再打开科普 */
let paperScanDismissGen = 0;

/** 当前打开模态内的板块索引（同时只会有一个模态打开） */
let pmActiveIndex = 0;
let pmWheelAccum = 0;

/** 角色对话线程（当前弹层） */
let characterThread = [];
let characterReqGen = 0;
/** @type {import("./cailun-chat.js").CharacterAgentKey | null} */
let activeCharacterAgentKey = null;

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getScienceKey(modal) {
  return modal?.dataset?.science || "paper";
}

function getScrollHints(modal) {
  const k = getScienceKey(modal);
  return SCROLL_HINTS_BY_SCIENCE[k] || SCROLL_HINTS_BY_SCIENCE.paper;
}

function updatePmScrollHint(modal) {
  const hints = getScrollHints(modal);
  const hint = modal?.querySelector(".pm-scroll-hint");
  if (hint && hints[pmActiveIndex]) hint.textContent = hints[pmActiveIndex];
}

function setScienceTab(modal, next) {
  if (!modal) return;
  const n = Math.max(0, Math.min(PM_TAB_COUNT - 1, next));
  pmActiveIndex = n;
  pmWheelAccum = 0;
  modal.querySelectorAll(".pm-nav-btn").forEach((btn, i) => {
    const on = i === n;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  modal.querySelectorAll(".pm-panel").forEach((panel, i) => {
    const on = i === n;
    panel.classList.toggle("is-active", on);
    panel.toggleAttribute("hidden", !on);
    panel.setAttribute("aria-hidden", on ? "false" : "true");
  });
  const region = modal.querySelector(".pm-detail-region");
  if (region) region.scrollTop = 0;
  updatePmScrollHint(modal);
}

function onPmDetailWheel(e) {
  const modal = e.currentTarget?.closest?.(".papermaking-modal");
  if (!modal?.classList.contains("is-open")) return;

  const region = e.currentTarget;
  const delta = e.deltaY;
  const { scrollTop, scrollHeight, clientHeight } = region;
  const tol = 4;
  const atTop = scrollTop <= tol;
  const atBottom = scrollTop + clientHeight >= scrollHeight - tol;
  const scrollable = scrollHeight > clientHeight + 8;

  if (scrollable) {
    if (delta > 0 && atBottom && pmActiveIndex < PM_TAB_COUNT - 1) {
      e.preventDefault();
      setScienceTab(modal, pmActiveIndex + 1);
    } else if (delta < 0 && atTop && pmActiveIndex > 0) {
      e.preventDefault();
      setScienceTab(modal, pmActiveIndex - 1);
    }
  } else {
    pmWheelAccum += delta;
    if (pmWheelAccum > 100) {
      e.preventDefault();
      pmWheelAccum = 0;
      if (pmActiveIndex < PM_TAB_COUNT - 1) setScienceTab(modal, pmActiveIndex + 1);
    } else if (pmWheelAccum < -100) {
      e.preventDefault();
      pmWheelAccum = 0;
      if (pmActiveIndex > 0) setScienceTab(modal, pmActiveIndex - 1);
    }
  }
}

function bindScienceModals() {
  document.querySelectorAll(".papermaking-modal").forEach((modal) => {
    if (modal.dataset.scienceNavBound) return;
    modal.dataset.scienceNavBound = "1";
    modal.querySelector(".papermaking-modal__backdrop")?.addEventListener("click", closeScienceModal);
    modal.querySelector(".papermaking-modal__close")?.addEventListener("click", closeScienceModal);
    if (modal.dataset.characterChat) return;
    modal.querySelectorAll(".pm-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.pmIndex, 10);
        if (!Number.isNaN(i)) setScienceTab(modal, i);
      });
    });
    modal.querySelector(".pm-detail-region")?.addEventListener("wheel", onPmDetailWheel, { passive: false });
  });
}

function getScienceGateForPageSrc(pageSrc) {
  return SCIENCE_GATES.find((g) => g.src === pageSrc) ?? null;
}

function getCharacterChatGateForPageSrc(pageSrc) {
  return CHARACTER_CHAT_GATES.find((g) => g.src === pageSrc) ?? null;
}

function resetScienceUi({ bumpDismiss = true } = {}) {
  if (bumpDismiss) paperScanDismissGen += 1;
  document.body.classList.remove("paper-scanning", "papermaking-open", "paper-scan-handoff");
  els.paperScanSheet?.classList.remove("paper-scan-sheet--animate");
  els.paperScanSheetPass?.classList.remove("paper-scan-sheet__pass--go");
  els.paperScanOverlay?.classList.remove("paper-scan-overlay--exiting");
  if (els.paperScanOverlay) {
    els.paperScanOverlay.classList.remove("is-active");
    els.paperScanOverlay.setAttribute("aria-hidden", "true");
  }
  document.querySelectorAll(".papermaking-modal").forEach((m) => {
    m.classList.remove("is-open", "papermaking-modal--from-scan");
    m.setAttribute("aria-hidden", "true");
    if (!m.dataset.characterChat) setScienceTab(m, 0);
  });
}

function bindModalPanelImages(modalId, images) {
  const modal = document.getElementById(modalId);
  if (!modal || !images?.length) return;
  const panels = modal.querySelectorAll(".pm-detail-region > article.pm-panel");
  images.forEach((item, i) => {
    const panel = panels[i];
    const img = panel?.querySelector(".pm-figure img");
    const cap = panel?.querySelector(".pm-figure figcaption");
    if (img) {
      img.src = item.src;
      img.alt = item.alt;
      img.removeAttribute("width");
      img.removeAttribute("height");
      img.removeAttribute("referrerpolicy");
    }
    if (cap) cap.textContent = item.figcaption;
  });
}

function bindAllSciencePanelImages() {
  bindModalPanelImages("papermaking-modal", PAPERMAKING_PANEL_IMAGES);
  bindModalPanelImages("printing-modal", PRINTING_PANEL_IMAGES);
  bindModalPanelImages("compass-modal", COMPASS_PANEL_IMAGES);
  bindModalPanelImages("gunpowder-modal", GUNPOWDER_PANEL_IMAGES);
}

function closeScienceModal() {
  resetScienceUi();
  if (inBookExperience) renderPage();
}

function openJumpShowModal() {
  if (!els.jumpShowModal || !els.jumpShowImg) return;
  els.jumpShowImg.src = JUMP_SHOW_IMAGE_HREF;
  els.jumpShowModal.classList.add("is-open");
  els.jumpShowModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("jump-show-open");
  requestAnimationFrame(() => els.jumpShowClose?.focus());
}

function closeJumpShowModal() {
  if (!els.jumpShowModal?.classList.contains("is-open")) return;
  els.jumpShowModal.classList.remove("is-open");
  els.jumpShowModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("jump-show-open");
}

function updateCharacterApiLine() {
  if (!els.characterApiStatus) return;
  const ep = getCailunChatEndpoint();
  els.characterApiStatus.textContent = ep
    ? `已连接对话代理：${ep}`
    : "未配置对话代理：使用本地简易回复。取消 index.html 里 cailun-chat-endpoint 的注释并启动 server/cailun-proxy.mjs 可接入豆包。";
}

function appendCharacterBubble(role, text) {
  const box = els.characterMessages;
  if (!box) return;
  const wrap = document.createElement("div");
  wrap.className =
    "cailun-bubble " +
    (role === "user" ? "cailun-bubble--user" : "cailun-bubble--assistant");
  const who = document.createElement("span");
  who.className = "cailun-bubble__who";
  who.textContent =
    role === "user"
      ? "你"
      : activeCharacterAgentKey
        ? getCharacterAssistantLabel(activeCharacterAgentKey)
        : "角色";
  const p = document.createElement("p");
  p.className = "cailun-bubble__text";
  p.style.margin = "0";
  p.textContent = text;
  wrap.appendChild(who);
  wrap.appendChild(p);
  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
}

/** @param {import("./cailun-chat.js").CharacterAgentKey} agentKey */
function initCharacterSession(agentKey) {
  activeCharacterAgentKey = agentKey;
  characterThread = [];
  characterReqGen += 1;
  if (els.characterMessages) els.characterMessages.innerHTML = "";
  if (els.characterInput) els.characterInput.value = "";
  if (els.characterChatModal) {
    els.characterChatModal.dataset.character = agentKey;
  }
  if (els.characterModalTitle) {
    els.characterModalTitle.textContent = getCharacterModalTitle(agentKey);
  }
  if (els.characterIntro) {
    els.characterIntro.innerHTML = getCharacterIntroHtml(agentKey);
  }
  if (els.characterInput) {
    els.characterInput.placeholder = getCharacterPlaceholder(agentKey);
  }
  updateCharacterApiLine();
  const welcome = getCharacterWelcomeMessage(agentKey);
  appendCharacterBubble("assistant", welcome);
  characterThread.push({ role: "assistant", content: welcome });
}

async function submitCharacterMessage() {
  const input = els.characterInput;
  const sendBtn = els.characterSend;
  if (!input || !sendBtn || !activeCharacterAgentKey) return;
  const text = input.value.trim();
  if (!text) return;

  const ticket = ++characterReqGen;
  const agentKey = activeCharacterAgentKey;
  appendCharacterBubble("user", text);
  input.value = "";
  sendBtn.disabled = true;

  try {
    const history = characterThread.slice();
    const reply = await requestCharacterReply(history, text, agentKey);
    if (ticket !== characterReqGen) return;
    characterThread.push({ role: "user", content: text });
    characterThread.push({ role: "assistant", content: reply });
    appendCharacterBubble("assistant", reply);
  } catch (err) {
    if (ticket !== characterReqGen) return;
    const msg =
      err && err.message
        ? `对话接口出错：${err.message}`
        : "对话接口出错，请稍后再试。";
    showToast(msg);
    appendCharacterBubble("assistant", msg);
  } finally {
    if (ticket === characterReqGen) sendBtn.disabled = false;
  }
}

function bindCharacterComposer() {
  els.characterSend?.addEventListener("click", () => void submitCharacterMessage());
  els.characterInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitCharacterMessage();
    }
  });
}

async function beginScienceJourney(gate) {
  if (paperJourneyBusy) return;
  if (!gate?.modalId) return;
  const modal = document.getElementById(gate.modalId);
  if (!modal) return;

  const scanAnimMs = 3300;
  const handoffMs = 720;

  paperJourneyBusy = true;
  const scanTicket = paperScanDismissGen;
  try {
    showToast(`握拳识别：进入${gate.label}`);
    /** 与各科普互动页一致：扫描固定书页图 */
    const scanSrc = gate.src
      ? new URL(gate.src, document.baseURI).href
      : els.img.currentSrc || els.img.src;
    if (scanSrc && els.paperScanSheetPhoto) els.paperScanSheetPhoto.src = scanSrc;
    document.body.classList.add("paper-scanning");
    if (els.paperScanOverlay) {
      els.paperScanOverlay.classList.remove("paper-scan-overlay--exiting");
      els.paperScanOverlay.classList.add("is-active");
      els.paperScanOverlay.setAttribute("aria-hidden", "false");
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (els.paperScanSheetPass) {
          els.paperScanSheetPass.classList.remove("paper-scan-sheet__pass--go");
          void els.paperScanSheetPass.offsetWidth;
          els.paperScanSheetPass.classList.add("paper-scan-sheet__pass--go");
        }
        if (els.paperScanSheet) {
          els.paperScanSheet.classList.remove("paper-scan-sheet--animate");
          void els.paperScanSheet.offsetWidth;
          els.paperScanSheet.classList.add("paper-scan-sheet--animate");
        }
      });
    });
    await wait(scanAnimMs);
    if (scanTicket !== paperScanDismissGen) return;

    modal.classList.add("is-open", "papermaking-modal--from-scan");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("papermaking-open", "paper-scan-handoff");
    if (!modal.dataset.characterChat) setScienceTab(modal, 0);
    modal.querySelector(".papermaking-modal__close")?.focus();

    els.paperScanOverlay?.classList.add("paper-scan-overlay--exiting");
    await wait(handoffMs);
    if (scanTicket !== paperScanDismissGen) {
      resetScienceUi();
      if (inBookExperience) renderPage();
      return;
    }

    document.body.classList.remove("paper-scanning", "paper-scan-handoff");
    if (els.paperScanOverlay) {
      els.paperScanOverlay.classList.remove("is-active", "paper-scan-overlay--exiting");
      els.paperScanOverlay.setAttribute("aria-hidden", "true");
    }
    els.paperScanSheet?.classList.remove("paper-scan-sheet--animate");
    els.paperScanSheetPass?.classList.remove("paper-scan-sheet__pass--go");
    modal.classList.remove("papermaking-modal--from-scan");
    if (gate.agentKey) initCharacterSession(gate.agentKey);
  } catch (err) {
    console.error(err);
    resetScienceUi();
    if (inBookExperience) renderPage();
  } finally {
    paperJourneyBusy = false;
  }
}

function renderBookBrand() {
  const el = document.getElementById("book-brand");
  if (el) {
    el.innerHTML =
      `<span class="site-nav__title-cn" lang="zh-CN">${siteNavBrandZh}</span>` +
      `<span class="site-nav__title-en" lang="en">${bookTitles.en}</span>`;
  }
  document.title = `${bookTitles.en} · ${bookTitles.zh}`;
}

function updateCoverMusicButton() {
  const btn = els.coverMusicBtn;
  const audio = els.bgMusic;
  if (!btn || !audio) return;
  const audible = !audio.paused && !audio.muted;
  btn.classList.toggle("is-on", audible);
  btn.classList.toggle("is-pending", !audible);
  btn.setAttribute("aria-pressed", audible ? "true" : "false");
  btn.setAttribute("aria-label", audible ? "关闭背景音乐" : "开启背景音乐");
}

function tryMutedCoverAutoplay() {
  const audio = els.bgMusic;
  if (!audio || !audio.paused) return;
  audio.muted = true;
  audio.loop = true;
  audio.volume = BG_MUSIC_VOLUME;
  audio
    .play()
    .then(() => {
      bgMusicAwaitingUnmute = true;
      updateCoverMusicButton();
    })
    .catch(() => {
      bgMusicAwaitingUnmute = false;
      updateCoverMusicButton();
    });
}

function initBackgroundMusic() {
  const audio = els.bgMusic;
  if (!audio) return;

  const url = new URL(BG_MUSIC_SRC, document.baseURI).href;
  if (audio.getAttribute("src") !== BG_MUSIC_SRC) {
    audio.setAttribute("src", BG_MUSIC_SRC);
  }
  audio.loop = true;
  audio.volume = BG_MUSIC_VOLUME;
  audio.preload = "auto";

  audio.addEventListener("error", () => {
    if (bgMusicLoadErrorShown) return;
    bgMusicLoadErrorShown = true;
    console.warn("[bg-music] 加载失败:", url, audio.error);
    showToast("无法加载背景音乐，请确认 music/music.mp3 存在");
    updateCoverMusicButton();
  });

  audio.addEventListener("canplaythrough", () => kickCoverMusicPlayback(), { once: true });
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    kickCoverMusicPlayback();
  } else {
    audio.load();
  }

  audio.addEventListener("play", updateCoverMusicButton);
  audio.addEventListener("pause", updateCoverMusicButton);
}

/** 封面页：优先有声播放，失败则静音循环，等用户轻触后出声 */
function kickCoverMusicPlayback() {
  const audio = els.bgMusic;
  if (!audio) return;

  audio.loop = true;
  audio.volume = BG_MUSIC_VOLUME;
  audio.muted = false;

  audio
    .play()
    .then(() => {
      bgMusicAwaitingUnmute = false;
      updateCoverMusicButton();
    })
    .catch(() => {
      tryMutedCoverAutoplay();
    });
}

function startBackgroundMusic() {
  const audio = els.bgMusic;
  if (!audio) return Promise.resolve();

  audio.loop = true;
  audio.volume = BG_MUSIC_VOLUME;
  audio.muted = false;

  if (!audio.paused) {
    bgMusicAwaitingUnmute = false;
    updateCoverMusicButton();
    return Promise.resolve();
  }

  return audio
    .play()
    .then(() => {
      bgMusicAwaitingUnmute = false;
      updateCoverMusicButton();
    })
    .catch((err) => {
      console.warn("[bg-music] 播放失败:", err);
      updateCoverMusicButton();
      throw err;
    });
}

function bindCoverMusicControls() {
  const unlockFromCover = () => {
    if (!document.body.classList.contains("is-on-cover")) return;
    void startBackgroundMusic();
  };

  els.coverScreen?.addEventListener("pointerdown", unlockFromCover, {
    capture: true,
    passive: true,
  });

  els.coverMusicBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const audio = els.bgMusic;
    if (!audio) return;
    if (!audio.paused && !audio.muted) {
      audio.pause();
      updateCoverMusicButton();
      return;
    }
    void startBackgroundMusic();
  });

  els.coverStart?.addEventListener("pointerdown", () => {
    void startBackgroundMusic();
  }, { capture: true, passive: true });
}

function bindBackgroundMusicUnlock() {
  const unlock = () => {
    void startBackgroundMusic();
  };
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchend", unlock, { capture: true, passive: true });
}

function enterBookExperience() {
  void startBackgroundMusic();
  if (inBookExperience) return;
  inBookExperience = true;

  els.coverScreen?.classList.add("is-leaving");
  document.body.classList.remove("is-on-cover");

  window.setTimeout(() => {
    els.coverScreen?.setAttribute("hidden", "");
    els.appExperience?.removeAttribute("hidden");
    if (!gestureBooted) {
      gestureBooted = true;
      void bootGesture();
    }
    showToast("欢迎进入绘本 · 可开启摄像头体验手势");
  }, 520);
}

function initCoverZoomLens() {
  const cover = els.coverScreen;
  const lens = cover?.querySelector(".cover__zoom-lens");
  const frame = cover?.querySelector(".cover__bg");
  if (!cover || !lens || !frame) return;

  const updateLens = (clientX, clientY) => {
    const r = frame.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    let mx = clientX - r.left;
    let my = clientY - r.top;
    mx = Math.max(0, Math.min(r.width, mx));
    my = Math.max(0, Math.min(r.height, my));
    const xPct = (mx / r.width) * 100;
    const yPct = (my / r.height) * 100;
    cover.style.setProperty("--cover-lx", `${xPct}%`);
    cover.style.setProperty("--cover-ly", `${yPct}%`);

    const z = parseFloat(getComputedStyle(lens).getPropertyValue("--cover-mag-zoom"));
    const mag = Number.isFinite(z) && z > 1 ? z : 1.38;
    const lensD = lens.offsetWidth || 240;
    cover.style.setProperty("--cover-mag-w", `${r.width * mag}px`);
    cover.style.setProperty("--cover-mag-h", `${r.height * mag}px`);
    cover.style.setProperty("--cover-mag-tx", `${-mx * mag + lensD / 2}px`);
    cover.style.setProperty("--cover-mag-ty", `${-my * mag + lensD / 2}px`);
  };

  cover.addEventListener("mousemove", (e) => {
    cover._coverLastPointer = { x: e.clientX, y: e.clientY };
    updateLens(e.clientX, e.clientY);
  });
  cover.addEventListener("mouseenter", (e) => {
    cover._coverLastPointer = { x: e.clientX, y: e.clientY };
    updateLens(e.clientX, e.clientY);
  });
  cover.addEventListener("mouseleave", () => {
    const r = frame.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    updateLens(r.left + r.width * 0.5, r.top + r.height * 0.5);
    delete cover._coverLastPointer;
  });

  window.addEventListener("resize", () => {
    if (!document.body.classList.contains("is-on-cover")) return;
    const last = cover._coverLastPointer;
    if (last) updateLens(last.x, last.y);
  });
}

function initCover() {
  document.body.classList.add("is-on-cover");
  kickCoverMusicPlayback();
  initCoverZoomLens();
  els.coverStart?.addEventListener("click", enterBookExperience);
  els.coverStart?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enterBookExperience();
    }
  });
}

function currentVolume() {
  return volumes[volIndex];
}

function currentPages() {
  const v = currentVolume();
  return v && v.pages ? v.pages : [];
}

function hideCamOverlay() {
  if (!els.camOverlay) return;
  els.camOverlay.hidden = true;
  els.camOverlay.replaceChildren();
}

/** 纯文字说明（无按钮），用于 file:// 等 */
function showCamOverlaySimple(...lines) {
  if (!els.camOverlay) return;
  els.camOverlay.replaceChildren();
  for (let i = 0; i < lines.length; i++) {
    const p = document.createElement("p");
    p.className =
      i === 0 ? "cam-overlay__text" : "cam-overlay__text cam-overlay__text--small";
    p.textContent = lines[i];
    els.camOverlay.appendChild(p);
  }
  els.camOverlay.hidden = false;
}

function showCamPermissionGate() {
  if (!els.camOverlay) return;
  els.camOverlay.replaceChildren();
  const stack = document.createElement("div");
  stack.className = "cam-overlay__stack";

  const p1 = document.createElement("p");
  p1.className = "cam-overlay__text";
  p1.textContent = "手势需要摄像头。请先点下方按钮，在浏览器弹出框中选择「允许」。";

  const p2 = document.createElement("p");
  p2.className = "cam-overlay__text cam-overlay__text--small";
  p2.textContent =
    "若地址栏左侧有「锁」或摄像头显示为关闭：点开 →「网站设置」或「此网站的权限」→ 将「摄像头」改为「允许」，再回到本页点按钮。";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cam-start-btn";
  btn.textContent = "开启摄像头";
  btn.addEventListener("click", () => void startCameraFromUserAction());

  stack.appendChild(p1);
  stack.appendChild(p2);
  stack.appendChild(btn);
  els.camOverlay.appendChild(stack);
  els.camOverlay.hidden = false;
}

function showCamErrorWithRetry(err) {
  if (!els.camOverlay) return;
  els.camOverlay.replaceChildren();
  const stack = document.createElement("div");
  stack.className = "cam-overlay__stack";

  const lines = [];
  const name = err && err.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    lines.push("摄像头权限被拒绝，或没有弹出授权框。");
    lines.push(
      "请点地址栏左侧的锁 / 相机图标 →「网站设置」或「权限」→ 把「摄像头」改为「允许」。若开关为灰色关闭，先打开再点下面「重试」。"
    );
  } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    lines.push("未检测到摄像头。请确认设备已连接，并关闭其它占用摄像头的程序后重试。");
  } else {
    lines.push("无法打开摄像头：" + (err && err.message ? err.message : String(err)));
  }

  lines.forEach((text, i) => {
    const p = document.createElement("p");
    p.className =
      i === 0 ? "cam-overlay__text" : "cam-overlay__text cam-overlay__text--small";
    p.textContent = text;
    stack.appendChild(p);
  });

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cam-start-btn";
  btn.textContent = "重试开启摄像头";
  btn.addEventListener("click", () => void startCameraFromUserAction());
  stack.appendChild(btn);

  els.camOverlay.appendChild(stack);
  els.camOverlay.hidden = false;
}

function stopCameraStream() {
  if (camStream) {
    camStream.getTracks().forEach((t) => t.stop());
    camStream = null;
  }
  if (els.video) els.video.srcObject = null;
}

function stopHandTracker() {
  handStop?.();
  handStop = null;
}

async function startCameraFromUserAction() {
  stopHandTracker();
  stopCameraStream();
  try {
    camStream = await startCamera(els.video);
    els.facePanel.classList.remove("is-off");
    hideCamOverlay();
  } catch (e) {
    showCamErrorWithRetry(e);
    showToast("摄像头未能打开");
    return;
  }
  try {
    const tracker = await startHandTracking({
      video: els.video,
      skeletonCanvas: els.skeletonCanvas,
      onGesture: onHandGesture,
      onStatus: (s) => showToast(s),
    });
    handStop = tracker.stop;
  } catch (e) {
    showToast("手势模型加载失败，请联网后刷新；翻页仍可用按钮与键盘。");
  }
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove("is-visible"), 1600);
}

function clampScale(s) {
  return Math.min(1.65, Math.max(0.72, s));
}

function applyScale() {
  els.stage.style.transform = `scale(${scale})`;
}

function stopSpeechAndAudio() {
  window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

function speak(text) {
  stopSpeechAndAudio();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

function playRead(spot) {
  stopSpeechAndAudio();
  if (spot.audio) {
    const a = new Audio(spot.audio);
    currentAudio = a;
    a.play().catch(() => speak(spot.text || ""));
    return;
  }
  if (spot.text) speak(spot.text);
}

function renderHotspots(page) {
  els.readLayer.innerHTML = "";
  const spots = page.readSpots || [];
  for (const s of spots) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "read-hotspot";
    b.style.left = `${s.left}%`;
    b.style.top = `${s.top}%`;
    b.style.width = `${s.width}%`;
    b.style.height = `${s.height}%`;
    b.setAttribute("aria-label", "点读");
    b.title = "点读";
    b.addEventListener("click", () => playRead(s));
    els.readLayer.appendChild(b);
  }
}

function renderPage() {
  const pages = currentPages();
  const gateHint = document.getElementById("science-gate-hint");
  const hintTextEl = gateHint?.querySelector(".papermaking-gate-hint__text");

  if (!pages.length) {
    els.img.removeAttribute("src");
    els.readLayer.innerHTML = "";
    if (els.jumpShowSlot) {
      els.jumpShowSlot.hidden = true;
      els.jumpShowSlot.innerHTML = "";
    }
    if (gateHint) gateHint.hidden = true;
    els.pageInfo.textContent = "请先在 js/pages-data.js 中添加上册页面";
    els.btnPrev.disabled = true;
    els.btnNext.disabled = true;
    return;
  }
  pageIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));
  const page = pages[pageIndex];
  els.img.src = page.src;
  els.img.alt = `${bookTitles.zh} · ${currentVolume().label} · 第 ${pageIndex + 1} 页`;
  renderHotspots(page);
  els.pageInfo.textContent = `${pageIndex + 1} / ${pages.length}`;
  els.btnPrev.disabled = pageIndex <= 0;
  els.btnNext.disabled = pageIndex >= pages.length - 1;

  if (gateHint && hintTextEl) {
    const v = currentVolume();
    const upGate = v?.id === "up" ? getScienceGateForPageSrc(page.src) : null;
    const charGate = v?.id === "down" ? getCharacterChatGateForPageSrc(page.src) : null;
    if (upGate) {
      gateHint.hidden = false;
      hintTextEl.innerHTML = upGate.hintHtml;
    } else if (charGate) {
      gateHint.hidden = false;
      hintTextEl.innerHTML =
        charGate.hintHtml +
        ' 请先<strong>开启右下角摄像头</strong>。未配置云端接口时仍可用<strong>本地简易回复</strong>体验。';
    } else {
      gateHint.hidden = true;
    }
  }

  if (els.jumpShowSlot) {
    const showJump =
      inBookExperience &&
      currentVolume()?.id === "down" &&
      page.src === JUMP_SHOW_PAGE_SRC;
    if (!showJump) {
      els.jumpShowSlot.hidden = true;
      els.jumpShowSlot.innerHTML = "";
    } else {
      els.jumpShowSlot.hidden = false;
      els.jumpShowSlot.innerHTML = "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jump-show-btn";
      btn.textContent = "跳页展示";
      btn.setAttribute("aria-label", "跳页展示，在中央打开全图");
      btn.addEventListener("click", () => openJumpShowModal());
      els.jumpShowSlot.appendChild(btn);
    }
  }

  if (els.jumpShowModal?.classList.contains("is-open")) {
    const stayOnJumpPage =
      inBookExperience &&
      currentVolume()?.id === "down" &&
      page.src === JUMP_SHOW_PAGE_SRC;
    if (!stayOnJumpPage) closeJumpShowModal();
  }
}

function renderNavTabs() {
  els.navTabs.innerHTML = "";
  volumes.forEach((v, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "nav-tab" + (i === volIndex ? " is-active" : "");
    b.textContent = v.label;
    b.addEventListener("click", () => {
      volIndex = i;
      pageIndex = 0;
      renderNavTabs();
      renderPage();
    });
    els.navTabs.appendChild(b);
  });
}

function goPrev() {
  if (pageIndex > 0) {
    pageIndex--;
    renderPage();
  }
}

function goNext() {
  const pages = currentPages();
  if (pageIndex < pages.length - 1) {
    pageIndex++;
    renderPage();
  }
}

function onHandGesture(name) {
  if (name === "fist-chapter") {
    if (document.querySelector(".papermaking-modal.is-open")) return;
    const v = currentVolume();
    const page = currentPages()[pageIndex];
    if (v?.id === "up") {
      const gate = page ? getScienceGateForPageSrc(page.src) : null;
      if (gate) void beginScienceJourney(gate);
      else
        showToast(
          "请翻到上册 1-2（造纸）、1-4（活字印刷）、1-7（指南针）或 1-9（火药）再握拳"
        );
      return;
    }
    if (v?.id === "down") {
      const cg = page ? getCharacterChatGateForPageSrc(page.src) : null;
      if (cg) void beginScienceJourney(cg);
      else
        showToast("请翻到下册 2-2、2-6、2-8、2-10 页，握拳可开启角色对话");
      return;
    }
    showToast("当前分册暂无握拳互动，请切换到上册或下册指定页");
    return;
  }
  if (name === "wave-next") {
    showToast("拇指朝右：下一页");
    goNext();
  } else if (name === "wave-prev") {
    showToast("拇指朝左：上一页");
    goPrev();
  } else if (name === "zoom-in") {
    scale = clampScale(scale + 0.1);
    applyScale();
    showToast("放大");
  } else if (name === "zoom-out") {
    scale = clampScale(scale - 0.1);
    applyScale();
    showToast("五指聚拢：缩小");
  }
}

async function bootGesture() {
  if (location.protocol === "file:") {
    showCamOverlaySimple(
      "当前为 file:// 打开方式，无法使用摄像头。",
      "请用 http://localhost 访问（见页面顶部说明）。"
    );
    showToast("请用本地服务器打开页面");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    showCamOverlaySimple("当前浏览器不支持摄像头，无法使用手势。");
    return;
  }

  showCamPermissionGate();
}

els.btnPrev.addEventListener("click", goPrev);
els.btnNext.addEventListener("click", goNext);

window.addEventListener("keydown", (e) => {
  if (!inBookExperience) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enterBookExperience();
    }
    return;
  }
  if (e.key === "Escape") {
    if (els.jumpShowModal?.classList.contains("is-open")) {
      closeJumpShowModal();
      return;
    }
    closeScienceModal();
    return;
  }
  if (e.key === "ArrowLeft") goPrev();
  if (e.key === "ArrowRight") goNext();
});

bindScienceModals();
bindCharacterComposer();
bindAllSciencePanelImages();
resetScienceUi({ bumpDismiss: false });
els.paperScanClose?.addEventListener("click", closeScienceModal);
els.paperScanOverlay?.addEventListener("click", (e) => {
  if (e.target === els.paperScanOverlay) closeScienceModal();
});

els.jumpShowBackdrop?.addEventListener("click", closeJumpShowModal);
els.jumpShowClose?.addEventListener("click", closeJumpShowModal);

const papermakingModal = document.getElementById("papermaking-modal");
if (papermakingModal) setScienceTab(papermakingModal, 0);

initBackgroundMusic();
initCover();
bindBackgroundMusicUnlock();
bindCoverMusicControls();
updateCoverMusicButton();
renderBookBrand();
renderNavTabs();
renderPage();
applyScale();

window.addEventListener("beforeunload", () => {
  handStop?.();
  camStream?.getTracks().forEach((t) => t.stop());
});
