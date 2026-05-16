/**
 * 下册角色对话（蔡伦 / 郑和 / 航天员 / 小红帽）：可选接入后端代理（豆包 Ark 等）。
 *
 * 配置：index.html 的 <meta name="cailun-chat-endpoint" content="http://127.0.0.1:8787/chat" />
 * 或 window.__CAILUN_CHAT_ENDPOINT__
 */

/** @typedef {"cailun"|"zhenghe"|"astronaut"|"redhood"} CharacterAgentKey */

export const CHARACTER_AGENT_KEYS = /** @type {const} */ ([
  "cailun",
  "zhenghe",
  "astronaut",
  "redhood",
]);

/** @param {string} key */
export function isCharacterAgentKey(key) {
  return CHARACTER_AGENT_KEYS.includes(/** @type {CharacterAgentKey} */ (key));
}

export function getCailunChatEndpoint() {
  const meta = document.querySelector('meta[name="cailun-chat-endpoint"]');
  const fromMeta = meta?.getAttribute("content")?.trim();
  if (fromMeta) return fromMeta;
  const g = typeof globalThis !== "undefined" ? globalThis : window;
  const w = g && g.__CAILUN_CHAT_ENDPOINT__;
  if (typeof w === "string" && w.trim()) return w.trim();
  return "";
}

export function nowContextZh() {
  try {
    return new Date().toLocaleString("zh-CN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return new Date().toISOString();
  }
}

/** @param {CharacterAgentKey} key */
export function getCharacterModalTitle(key) {
  switch (key) {
    case "cailun":
      return "蔡侯纸巷 · 与蔡伦对话";
    case "zhenghe":
      return "远洋针路 · 与郑和对话";
    case "astronaut":
      return "星河归来 · 与中国航天员对话";
    case "redhood":
      return "纸船与小帽 · 与小红帽道别";
    default:
      return "角色对话";
  }
}

/** @param {CharacterAgentKey} key */
export function getCharacterAssistantLabel(key) {
  switch (key) {
    case "cailun":
      return "蔡伦（模拟）";
    case "zhenghe":
      return "郑和（模拟）";
    case "astronaut":
      return "航天员（模拟）";
    case "redhood":
      return "小红帽";
    default:
      return "角色";
  }
}

/** 弹层顶部说明（纯文案，主体会被 main 包一层 <p>） */
export function getCharacterIntroHtml(key) {
  switch (key) {
    case "cailun":
      return '模拟东汉<strong>蔡伦</strong>（造纸术改良者）与你在今日世界相遇：可问纸、问书。未配置接口时为<strong>本地简易回复</strong>；接豆包见 <code>server/cailun-proxy.mjs</code>。';
    case "zhenghe":
      return '模拟明代<strong>郑和</strong>率领船队远航的角色：侧重<strong>指南针与航海定向</strong>、季风与针路（虚构对话，非史实陈述）。未配置接口时为本地简易回复。';
    case "astronaut":
      return '模拟<strong>中国航天员</strong>与读者聊天：可谈太空生活、训练与探索精神，用孩子能懂的语言；虚构角色，非真人航天员发言。未配置接口时为本地简易回复。';
    case "redhood":
      return '绘本主人公<strong>小红帽</strong>在此与读者道别、收束故事：可谈纸船旅程、勇气与好奇，温柔收尾、适当升华主题。未配置接口时为本地简易回复。';
    default:
      return "";
  }
}

export function getCharacterPlaceholder(key) {
  switch (key) {
    case "cailun":
      return "用一句话向蔡伦提问或打招呼…";
    case "zhenghe":
      return "问问针路、指南针或远航见闻…";
    case "astronaut":
      return "问问太空、星星或你想知道的航天小事…";
    case "redhood":
      return "和小红帽说说这趟绘本里你印象最深的事…";
    default:
      return "输入消息…";
  }
}

/** @param {CharacterAgentKey} key */
export function buildCharacterSystemPrompt(key) {
  const t = nowContextZh();
  const baseTime = `此刻在读者所处的世界里，日期与时刻大约是：${t}。`;
  switch (key) {
    case "cailun":
      return [
        "你是互动绘本中的角色扮演助手：扮演东汉时期主持改进造纸工艺的「蔡伦」的文学虚构形象（非真实历史人物发言，勿声称自己拥有真实记忆）。",
        "用简练、文雅的现代汉语白话作答，可略带古风。",
        `${baseTime} 你会对「千年之后」的景象感到好奇，以谦逊态度与读者对话，可联系造纸、书写、典籍传播。`,
        "若问题离题太远，可礼貌表示所知有限。回答宜短，一般三五句以内。",
      ].join("\n");
    case "zhenghe":
      return [
        "你是互动绘本中的角色扮演助手：扮演明代率领船队远航的「郑和」的文学虚构形象（非史学家口吻，勿编造具体年月与地名年表当作史实）。",
        "语言简练、略带豪气与礼数，现代白话为主。",
        `${baseTime} 重点谈论远洋航行中如何依靠指南针（罗盘、针路、与地标/星象配合）、季风与海况对航行的意义；可对「后世」的轮船、卫星导航表示惊叹并作朴素类比。`,
        "不涉及敏感政治话题；不进行路线或领土争论。回答宜短。",
      ].join("\n");
    case "astronaut":
      return [
        "你是互动绘本中的角色扮演助手：扮演「中国航天员」的温和虚构形象，用于儿童科普（勿冒充任何真实航天员姓名或用第一人称声称真实任务细节）。",
        "用语亲切、准确、鼓励好奇；涉及专业处可适度简化。",
        `${baseTime} 可谈失重趣事、训练、从太空看地球的感受，并把绘本主题（纸船、探索、四大发明等）与「人类用笔与纸记录梦，再用科学去实现梦」稍作升华。`,
        "不做危险操作指引；不确定的内容请引导读者查阅权威科普。回答宜短。",
      ].join("\n");
    case "redhood":
      return [
        "你是互动绘本《纸船的神秘航线》中的主人公「小红帽」的对话角色（童话风格，非恐怖、非成人向）。",
        "语气温暖、略活泼，像在和小朋友道别、总结这趟阅读旅程。",
        `${baseTime} 可与读者聊聊纸船、书页、四大发明故事带给 TA 的感受；鼓励继续阅读和提问，把「好奇」「勇气」「把故事讲给别人听」作轻轻升华。`,
        "不要长篇说教；不要打破童话感去进行元叙事批评。回答宜短。",
      ].join("\n");
    default:
      return "你是友好的对话助手。\n" + baseTime;
  }
}

/** @param {CharacterAgentKey} key */
function pickCharacterFallback(key, userText) {
  const s = (userText || "").trim();
  if (!s) return "请先写下你想说的话，我再回复你。";
  const t = nowContextZh();

  if (key === "cailun") {
    if (/你好|您好|在吗|嗨|哈喽/i.test(s)) {
      return `${t}，竟能隔屏与君语——若问纸与墨，蔡某愿尽其所知。`;
    }
    if (/纸|造纸|抄纸|树皮|麻|渔网|蔡侯/i.test(s)) {
      return "纸之为用，贵在纤维匀细、成形坚实。浸沤、舂捣、调浆、抄帘、晾晒，步步不可草率；打浆与抄帘最见功夫。";
    }
    if (/时间|今天|手机|电脑|网络|飞机/i.test(s)) {
      return "后世奇物，蔡某只能遥想一二。你若用孩童能懂的说法说来，我愿慢慢听。";
    }
    return `蔡某粗通纸墨事。「${s.slice(0, 36)}${s.length > 36 ? "…" : ""}」不妨再说细些。`;
  }

  if (key === "zhenghe") {
    if (/你好|您好|在吗|嗨/i.test(s)) {
      return `${t}，郑某在此。你若问针路与指南针，我愿以舟师所知，尽量说清。`;
    }
    if (/指南针|罗盘|司南|定向|针路|航海|更次|季风/i.test(s)) {
      return "茫茫大洋，望星望山未必日日可得；指南针犹舟师之『定盘星』。然针所指多是方向，须与针路簿、水深、季风、地标互证，不敢单凭一桩。";
    }
    if (/船|宝船|西洋|远航/i.test(s)) {
      return "风信与洋流就像无形的河道；帆索、碇泊与粮水，也都是远航的命脉。你若好奇船上日夜如何过，也可以再问。";
    }
    return `「${s.slice(0, 38)}${s.length > 38 ? "…" : ""}」——郑某试答：可先告诉我是问针路、季风，还是后世航海之器？`;
  }

  if (key === "astronaut") {
    if (/你好|您好|在吗|嗨/i.test(s)) {
      return `${t}，你好呀。我在「角色对话」里陪你聊太空与星星——说说你最想问的一件小事吧。`;
    }
    if (/失重|飘|空间站|神舟|火箭|宇航服|月亮|星星/i.test(s)) {
      return "在太空里，水会变成圆鼓鼓的小球，人也会轻轻飘起来——要系好安全带、按规程行动，既有趣也要守规矩。火箭把我们送上轨道，就像纸船顺着河道去远方，只是河道变成了天空。";
    }
    if (/害怕|难|能做到吗/i.test(s)) {
      return "许多事一开始看起来难，拆成小步、天天练习，就会变熟悉。你也可以把大梦想写在小本子上，一格一格完成。";
    }
    return `你提到「${s.slice(0, 34)}${s.length > 34 ? "…" : ""}」——要不要换个说法？比如「太空里怎么喝水」之类，我好讲给你听。`;
  }

  // redhood
  if (/再见|拜拜|结束|谢谢/i.test(s)) {
    return "谢谢你读完这趟纸船故事呀。把喜欢的那一页记在心里，下次翻开书，好奇心还会在同一条河道上等你的。";
  }
  if (/喜欢|最爱|印象|哪一页|有趣/i.test(s)) {
    return "我也很在意你喜欢哪一页呢！不管是纸、是火药的小知识，还是小船滑过书山的那一格，把故事讲给朋友听，就等于让纸船又开了一程。";
  }
  if (/四大发明|纸船|绘本|故事/i.test(s)) {
    return "从一片纸到星辰大海，人类的爱和好奇常常就是这样连成线的。你愿意的话，合上书本也去试一试：画一艘自己的纸船，写下一个小问题。";
  }
  return `我听见了：「${s.slice(0, 40)}${s.length > 40 ? "…" : ""}」。这是结尾前最后一次悄悄话啦——你还想把哪份心情带下船？`;
}

function parseProxyReply(data) {
  if (data && typeof data.reply === "string" && data.reply.trim()) return data.reply.trim();
  const c = data?.choices?.[0]?.message?.content;
  if (typeof c === "string" && c.trim()) return c.trim();
  return "";
}

/**
 * @param {{ role: string; content: string }[]} thread
 * @param {string} userText
 * @param {CharacterAgentKey} agentKey
 */
export async function requestCharacterReply(thread, userText, agentKey) {
  const endpoint = getCailunChatEndpoint();
  const system = { role: "system", content: buildCharacterSystemPrompt(agentKey) };
  const history = Array.isArray(thread) ? thread : [];
  const messages = [system, ...history, { role: "user", content: userText }];

  if (!endpoint) {
    await new Promise((r) => setTimeout(r, 260));
    return pickCharacterFallback(agentKey, userText);
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const errMsg = data?.error?.message || data?.message || res.statusText || "请求失败";
    throw new Error(errMsg);
  }
  const text = parseProxyReply(data);
  if (text) return text;
  throw new Error("接口未返回有效正文");
}

/** @param {CharacterAgentKey} key */
export function getCharacterWelcomeMessage(key) {
  const t = nowContextZh();
  switch (key) {
    case "cailun":
      return `君安好。蔡某眼前忽见光亮文字与奇巧画屏——闻说此刻竟是${t}。君若愿，可先问纸、问书，或说说你这一世日常里离不开的一件「小物」。`;
    case "zhenghe":
      return `郑和在此。舟师行船，指南针是暗夜与浓雾里的依傍，却也需与针路、星象、水色并观。今日大约是${t}；你若问定向或远航之事，郑某愿慢慢讲。`;
    case "astronaut":
      return `你好呀，我是这段故事里的「航天员」伙伴。此刻大约是${t}。你可以问太空里的日常，也可以说说：若有一艘纸船能飞出窗外，你想让它去哪里？`;
    case "redhood":
      return `嗨，纸船划到最后一页啦。我是小红帽——大约是${t}。愿意和我聊聊这趟书里你印象最深的一幕吗？也可以说声再见，把勇气和好奇带下船。`;
    default:
      return "你好。";
  }
}

/** @deprecated 使用 requestCharacterReply(..., 'cailun') */
export async function requestCailunReply(thread, userText) {
  return requestCharacterReply(thread, userText, "cailun");
}

/** @deprecated 使用 buildCharacterSystemPrompt('cailun') */
export function buildCailunSystemPrompt() {
  return buildCharacterSystemPrompt("cailun");
}
