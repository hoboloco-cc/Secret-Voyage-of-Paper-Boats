/**
 * 摄像头 + MediaPipe Hand Landmarker
 *
 * 手势（互斥、易区分）：
 * 1 翻页：四指握拳，拇指水平伸出——拇指尖相对拇指根（MCP）的朝向决定翻页方向（左/右）
 * 2 放大：五指张开
 * 3 缩小：五指指尖聚拢捏合（保持约半秒）
 * 4 握拳（拇指收起）：发出 fist-chapter，由页面决定是否进入造纸术等互动
 *
 * 骨骼画在 canvas 上，与 video 同处于镜像层内，使用 landmark 原始 x/y，
 * 由外层 CSS scaleX(-1) 与画面一起镜像，避免「再乘一次 (1-x)」导致像另一只手。
 */

const GESTURE_COOLDOWN_MS = 700;
const ZOOM_COOLDOWN_MS = 500;
const OPEN_PALM_FRAMES = 5;
const FIVE_PINCH_HOLD_FRAMES = 14;
const FIST_CHAPTER_FRAMES = 15;
/** 四指收拢 + 拇指伸出判定翻页：拇指尖与食指尖不可处于捏合距离（避免误判） */
const THUMB_STEER_PINCH_CLEAR = 0.085;
/** 拇指水平分量超过此阈值才认为「明确指向左/右」 */
const THUMB_DIR_MIN = 0.038;
/** 连续满足姿势与方向的帧数后再触发翻页 */
const THUMB_STEER_HOLD_FRAMES = 14;
/**
 * 与摄像头预览镜像一致：若实际体验「拇指指向与翻页方向相反」，改为 true
 */
const THUMB_STEER_MIRROR_X = true;

/** MediaPipe 手部骨架连线（索引对） */
const HAND_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function isFingerExtended(lm, tipIdx, pipIdx) {
  const wrist = lm[0];
  const tip = lm[tipIdx];
  const pip = lm[pipIdx];
  return dist2(wrist, tip) > dist2(wrist, pip) * 1.15;
}

function isThumbExtended(lm) {
  const wrist = lm[0];
  const tip = lm[4];
  const ip = lm[3];
  return dist2(wrist, tip) > dist2(wrist, ip) * 1.08;
}

function isOpenPalm(lm) {
  return (
    isThumbExtended(lm) &&
    isFingerExtended(lm, 8, 6) &&
    isFingerExtended(lm, 12, 10) &&
    isFingerExtended(lm, 16, 14) &&
    isFingerExtended(lm, 20, 18)
  );
}

/** 握拳：四指弯曲收拢 + 拇指内收不伸出（与五指聚拢、拇指外翻页区分） */
function isClosedFist(lm) {
  const wrist = lm[0];
  const curled = (tip, pip) => dist2(wrist, tip) <= dist2(wrist, pip) * 0.98;
  return (
    curled(lm[8], lm[6]) &&
    curled(lm[12], lm[10]) &&
    curled(lm[16], lm[14]) &&
    curled(lm[20], lm[18]) &&
    !isThumbExtended(lm)
  );
}

/** 五指指尖聚拢：五指尖两两距离均较小（与拇指外翻页、张手区分） */
function maxPairwiseDist5(lm) {
  const idx = [4, 8, 12, 16, 20];
  let m = 0;
  for (let i = 0; i < idx.length; i++) {
    for (let j = i + 1; j < idx.length; j++) {
      m = Math.max(m, dist2(lm[idx[i]], lm[idx[j]]));
    }
  }
  return m;
}

function isFiveTipsCluster(lm) {
  return maxPairwiseDist5(lm) < 0.11;
}

/** 四指收拢握拳状，但拇指伸出（用于拇指朝向翻页；与全握拳、捏合、张手区分） */
function isThumbSteerFist(lm) {
  if (isFiveTipsCluster(lm)) return false;
  if (!isThumbExtended(lm)) return false;
  const wrist = lm[0];
  const curled = (tip, pip) => dist2(wrist, tip) <= dist2(wrist, pip) * 0.98;
  if (
    !curled(lm[8], lm[6]) ||
    !curled(lm[12], lm[10]) ||
    !curled(lm[16], lm[14]) ||
    !curled(lm[20], lm[18])
  ) {
    return false;
  }
  /** 拇指与食指不能过近，否则易与旧「捏合」手势混淆 */
  if (dist2(lm[4], lm[8]) < THUMB_STEER_PINCH_CLEAR) return false;
  return true;
}

/** 拇指指向：-1 左、+1 右、0 未达阈值 */
function thumbSteerDir(lm) {
  let vx = lm[4].x - lm[2].x;
  if (THUMB_STEER_MIRROR_X) vx = -vx;
  if (vx < -THUMB_DIR_MIN) return -1;
  if (vx > THUMB_DIR_MIN) return 1;
  return 0;
}

function drawSkeleton(canvas, lm) {
  if (!canvas || !lm) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 2 || h < 2) return;
  const bw = Math.floor(w * dpr);
  const bh = Math.floor(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const X = (x) => x * w;
  const Y = (y) => y * h;

  ctx.strokeStyle = "rgba(110, 210, 255, 0.92)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [i, j] of HAND_EDGES) {
    const a = lm[i];
    const b = lm[j];
    ctx.beginPath();
    ctx.moveTo(X(a.x), Y(a.y));
    ctx.lineTo(X(b.x), Y(b.y));
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  for (let i = 0; i < lm.length; i++) {
    const p = lm[i];
    const r = i === 4 || i === 8 ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255, 220, 120, 0.95)";
  for (const i of [4, 8]) {
    const p = lm[i];
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function clearSkeleton(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
}

/**
 * @param {{ video: HTMLVideoElement; skeletonCanvas?: HTMLCanvasElement | null; onGesture: (name: string) => void; onStatus?: (s: string) => void }} opts
 */
export async function startHandTracking(opts) {
  const { video, skeletonCanvas, onGesture, onStatus } = opts;
  let lastEmit = 0;
  let lastZoomEmit = 0;
  let openFrames = 0;
  let fivePinchFrames = 0;
  let chapterFistFrames = 0;
  let thumbSteerHold = 0;
  let thumbSteerDirLocked = 0;
  let lastChapterGesture = 0;
  let running = true;
  let raf = 0;

  const say = (s) => onStatus?.(s);

  let HandLandmarker;
  let FilesetResolver;
  try {
    const mod = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm"
    );
    HandLandmarker = mod.HandLandmarker;
    FilesetResolver = mod.FilesetResolver;
  } catch (e) {
    try {
      const mod = await import("https://esm.sh/@mediapipe/tasks-vision@0.10.14");
      HandLandmarker = mod.HandLandmarker;
      FilesetResolver = mod.FilesetResolver;
    } catch (e2) {
      say("手势库加载失败，请检查网络");
      return { stop: () => {} };
    }
  }

  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  const modelPath =
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

  let handLandmarker;
  try {
    handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { modelAssetPath: modelPath, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 1,
    });
  } catch (e) {
    try {
      handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: modelPath },
        runningMode: "VIDEO",
        numHands: 1,
      });
    } catch (e2) {
      say("手势模型加载失败");
      return { stop: () => {} };
    }
  }

  say("手势：握拳伸拇指朝左/右翻页 · 张手放大 · 五指聚拢缩小 · 握拳收拇指可触发专题页");

  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (video.readyState < 2) return;

    const result = handLandmarker.detectForVideo(video, now);
    if (!result.landmarks || !result.landmarks.length) {
      openFrames = 0;
      fivePinchFrames = 0;
      chapterFistFrames = 0;
      thumbSteerHold = 0;
      thumbSteerDirLocked = 0;
      clearSkeleton(skeletonCanvas);
      return;
    }

    const lm = result.landmarks[0];
    drawSkeleton(skeletonCanvas, lm);

    if (isFiveTipsCluster(lm)) {
      openFrames = 0;
      chapterFistFrames = 0;
      thumbSteerHold = 0;
      thumbSteerDirLocked = 0;
      fivePinchFrames++;
      if (
        fivePinchFrames >= FIVE_PINCH_HOLD_FRAMES &&
        now - lastZoomEmit > ZOOM_COOLDOWN_MS
      ) {
        fivePinchFrames = 0;
        lastZoomEmit = now;
        onGesture("zoom-out");
      }
    } else if (isThumbSteerFist(lm)) {
      openFrames = 0;
      chapterFistFrames = 0;
      fivePinchFrames = 0;
      const dir = thumbSteerDir(lm);
      if (dir === 0) {
        thumbSteerHold = 0;
        thumbSteerDirLocked = 0;
      } else if (dir === thumbSteerDirLocked) {
        thumbSteerHold++;
      } else {
        thumbSteerDirLocked = dir;
        thumbSteerHold = 1;
      }
      if (
        thumbSteerHold >= THUMB_STEER_HOLD_FRAMES &&
        now - lastEmit > GESTURE_COOLDOWN_MS
      ) {
        thumbSteerHold = 0;
        thumbSteerDirLocked = 0;
        lastEmit = now;
        /** 拇指朝左 → 上一页；朝右 → 下一页（与 THUMB_STEER_MIRROR_X 共同决定最终方向） */
        onGesture(dir < 0 ? "wave-prev" : "wave-next");
      }
    } else {
      thumbSteerHold = 0;
      thumbSteerDirLocked = 0;
      fivePinchFrames = 0;
      if (isOpenPalm(lm)) {
        chapterFistFrames = 0;
        openFrames++;
        if (openFrames >= OPEN_PALM_FRAMES && now - lastZoomEmit > ZOOM_COOLDOWN_MS) {
          openFrames = 0;
          lastZoomEmit = now;
          onGesture("zoom-in");
        }
      } else if (isClosedFist(lm) && !isFiveTipsCluster(lm)) {
        openFrames = 0;
        chapterFistFrames++;
        if (
          chapterFistFrames >= FIST_CHAPTER_FRAMES &&
          now - lastChapterGesture > 2600
        ) {
          chapterFistFrames = 0;
          lastChapterGesture = now;
          onGesture("fist-chapter");
        }
      } else {
        openFrames = 0;
        chapterFistFrames = 0;
      }
    }
  }

  raf = requestAnimationFrame(tick);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      try {
        handLandmarker.close();
      } catch (_) {}
      clearSkeleton(skeletonCanvas);
    },
  };
}

export async function startCamera(video) {
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.muted = true;

  const prefer = {
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  };
  const fallback = { video: true, audio: false };
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(prefer);
  } catch (e) {
    stream = await navigator.mediaDevices.getUserMedia(fallback);
  }

  video.srcObject = stream;

  await new Promise((resolve, reject) => {
    const ms = 12000;
    const t = setTimeout(() => reject(new Error("摄像头画面长时间未就绪")), ms);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(t);
      video.removeEventListener("loadedmetadata", finish);
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("canplay", finish);
      video.removeEventListener("error", onErr);
      resolve();
    };
    const onErr = () => {
      if (settled) return;
      settled = true;
      clearTimeout(t);
      video.removeEventListener("loadedmetadata", finish);
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("canplay", finish);
      reject(new Error("视频流无法显示"));
    };
    if (video.readyState >= 2) finish();
    else {
      video.addEventListener("loadedmetadata", finish, { once: true });
      video.addEventListener("loadeddata", finish, { once: true });
      video.addEventListener("canplay", finish, { once: true });
      video.addEventListener("error", onErr, { once: true });
    }
  });

  try {
    await video.play();
  } catch (e) {
    await new Promise((r) => requestAnimationFrame(r));
    await video.play();
  }

  return stream;
}
