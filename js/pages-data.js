/**
 * 绘本页面与点读配置。
 *
 * 每一册只需维护下面的「文件名列表」（11 行），不必复制十一段完整对象。
 * 需要点读的页：在 readSpotsByFile 里用「文件名」做 key 挂上 readSpots 数组即可。
 * readSpots: left/top/width/height 为相对整页的百分比；text 朗读；可选 audio 优先播放。
 */

/** 书名：改这里会同步到浏览器标题、图片无障碍说明等 */
export const bookTitles = {
  en: "Secret Voyage of Paper Boats",
  zh: "纸船的神秘航线",
};

/** 阅读页顶栏左侧主标题（可与书名不同） */
export const siteNavBrandZh = "四大发明主题绘本设计";

/** 上册四大发明互动页：握拳进入对应科普（文件名须与 UP_PAGE_FILES 一致） */
export const PAPERMAKING_GATE_SRC = "绘本上册/1-2.jpg";

/** 下册：握拳进入角色对话（路径须与 DOWN_PAGE_FILES 一致） */
export const CAILUN_INTERACTION_SRC = "绘本下册/2-2.jpg";
export const ZHENG_HE_INTERACTION_SRC = "绘本下册/2-6.jpg";
export const ASTRONAUT_INTERACTION_SRC = "绘本下册/2-8.jpg";
export const RED_HOOD_INTERACTION_SRC = "绘本下册/2-10.jpg";

/** 下册：此页书图下方显示「跳页展示」，点击打开 jump.png */
export const JUMP_SHOW_PAGE_SRC = "绘本下册/2-7.jpg";
export const JUMP_SHOW_IMAGE_HREF = "jump.png";

/** 造纸术科普三个板块配图（科普页面文件夹，与左侧 01/02/03 一一对应） */
export const PAPERMAKING_PANEL_IMAGES = [
  {
    src: "科普页面/1-1.png",
    alt: "蔡伦像 · 造纸术改良者",
    figcaption:
      "后世尊蔡伦为「纸神」：他总结树皮、麻头、破布、旧渔网等原料制浆抄纸之法，推动纸张走向实用与普及。",
  },
  {
    src: "科普页面/1-2.png",
    alt: "造纸术流程与原料图解",
    figcaption:
      "从切麻、洗涤、浸灰、蒸煮到打浆、抄纸、晒纸、揭纸：传统造纸的核心工序，与右侧文字步骤可对照阅读。",
  },
  {
    src: "科普页面/1-3.png",
    alt: "古代线装典籍书页",
    figcaption:
      "纸叶裁切、折叠与穿线装订后，形成便于阅读与保存的典籍形态——纸的普及深刻改变了「书」的样子。",
  },
];
export const PRINTING_GATE_SRC = "绘本上册/1-4.jpg";

/** 活字印刷科普三个板块配图（01 毕昇与地位 / 02 制字与刷印 / 03 传播与演变） */
export const PRINTING_PANEL_IMAGES = [
  {
    src: "科普页面/2-1.png",
    alt: "活字印刷 · 毕昇与历史地位配图",
    figcaption: "毕昇与泥活字：把书写拆成可重组的单字，为后世字架、检字与排版思维埋下伏笔。",
  },
  {
    src: "科普页面/2-2.png",
    alt: "活字印刷 · 制字与刷印配图",
    figcaption: "制字、拣字、刷印与拆版归字：工坊里多道工序协作，同一套字丁可反复参与不同版面。",
  },
  {
    src: "科普页面/2-3.png",
    alt: "活字印刷 · 传播与演变配图",
    figcaption: "技术沿商路与书籍外传，与各地书写体系、材料工艺结合，形成木活字、铜活字、铅活字等多样路径。",
  },
];

export const COMPASS_GATE_SRC = "绘本上册/1-7.jpg";

/** 指南针科普三个板块配图（01 司南与原理 / 02 形制与应用 / 03 航海与世界） */
export const COMPASS_PANEL_IMAGES = [
  {
    src: "科普页面/3-1.png",
    alt: "指南针 · 司南与地磁场配图",
    figcaption: "磁针与地磁场：自由转动的磁针会沿南北方向稳定排列，是远洋与阴天里可靠的定向参照。",
  },
  {
    src: "科普页面/3-2.png",
    alt: "指南针 · 形制与应用配图",
    figcaption: "水浮针、旱针与罗盘：不同支承与刻度体系，对应陆行、舆图测绘与船舶摇摆等场景。",
  },
  {
    src: "科普页面/3-3.png",
    alt: "指南针 · 航海与世界配图",
    figcaption: "针路、更路与海图：指南针与季风、地标、天文观测共同构成传统航海的经验知识网络。",
  },
];

export const GUNPOWDER_GATE_SRC = "绘本上册/1-9.jpg";

/** 火药科普三个板块配图（01 发现与成分 / 02 军事与工程 / 03 影响与反思） */
export const GUNPOWDER_PANEL_IMAGES = [
  {
    src: "科普页面/4-1.png",
    alt: "火药 · 发现与成分配图",
    figcaption: "硝、硫、炭的配比与颗粒形态，决定点燃后的燃速、火焰与声响，也关系到安全储存与使用。",
  },
  {
    src: "科普页面/4-2.png",
    alt: "火药 · 军事与工程配图",
    figcaption: "从突火枪到火炮与爆破：密闭空间内气体骤增可转化为机械破坏力，亦用于开矿与工程。",
  },
  {
    src: "科普页面/4-3.png",
    alt: "火药 · 影响与反思配图",
    figcaption: "庆典烟花与武器装药是同一化学原理的不同应用；理解火药，也包括对安全、伦理与治理的思考。",
  },
];

function pagesIn(folder, fileNames, readSpotsByFile = {}) {
  return fileNames.map((name) => ({
    src: `${folder}/${name}`,
    readSpots: readSpotsByFile[name] ?? [],
  }));
}

// —— 上册：把 11 个文件名改成你「绘本上册」文件夹里真实的名字（顺序 = 翻页顺序）——
const UP_PAGE_FILES = [
  "1.jpg",
  "1-0.jpg",
  "1-1.jpg",
  "1-2.jpg",
  "1-3.jpg",
  "1-4.jpg",
  "1-5.jpg",
  "1-6.jpg",
  "1-7.jpg",
  "1-8.jpg",
  "1-9.jpg",
  "1-10.jpg",
];

// —— 下册：同上 —— //
const DOWN_PAGE_FILES = [
  "2.jpg",
  "2-0.jpg",
  "2-1.jpg",
  "2-2.jpg",
  "2-3.jpg",
  "2-4.jpg",
  "2-5.jpg",
  "2-6.jpg",
  "2-7.jpg",
  "2-8.jpg",
  "2-9.jpg",
  "2-10.jpg",
];

export const volumes = [
  {
    id: "up",
    label: "绘本上册",
    pages: pagesIn("绘本上册", UP_PAGE_FILES),
  },
  {
    id: "down",
    label: "绘本下册",
    pages: pagesIn("绘本下册", DOWN_PAGE_FILES),
  },
];
