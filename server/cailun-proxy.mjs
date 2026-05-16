/**
 * 极简 CORS 代理：把浏览器发来的 { messages } 转发到火山引擎「豆包」方舟 Chat Completions。
 *
 * 用法（PowerShell 示例）：
 *   $env:ARK_API_KEY="你的API_Key"
 *   $env:ARK_MODEL_ENDPOINT="ep-xxxx 或你在控制台看到的推理接入点 ID"
 *   node server/cailun-proxy.mjs
 *
 * 然后在 index.html 取消注释：
 *   <meta name="cailun-chat-endpoint" content="http://127.0.0.1:8787/chat" />
 *
 * 密钥说明：ARK_API_KEY 绝不能写进前端 HTML/JS；只能放在服务器环境变量或私密配置里。
 * 控制台：火山引擎 → 机器学习平台 / 方舟 → API 接入（以控制台实际菜单为准）。
 */

import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.CAILUN_PROXY_PORT || 8787);
const ARK_API_KEY = process.env.ARK_API_KEY || "";
const ARK_MODEL = process.env.ARK_MODEL_ENDPOINT || "";
const ARK_URL =
  process.env.ARK_CHAT_URL ||
  "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

function send(res, status, body, headers = {}) {
  const h = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers,
  };
  res.writeHead(status, h);
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method !== "POST" || u.pathname !== "/chat") {
    send(res, 404, { error: { message: "not found" } });
    return;
  }

  if (!ARK_API_KEY || !ARK_MODEL) {
    send(res, 500, {
      error: {
        message:
          "服务器未配置 ARK_API_KEY 或 ARK_MODEL_ENDPOINT，请设置环境变量后重启本脚本。",
      },
    });
    return;
  }

  const body = await readJson(req);
  const messages = body && Array.isArray(body.messages) ? body.messages : null;
  if (!messages || !messages.length) {
    send(res, 400, { error: { message: "invalid body: need { messages: [...] }" } });
    return;
  }

  try {
    const r = await fetch(ARK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: ARK_MODEL,
        messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      send(res, r.status, {
        error: {
          message: data?.error?.message || data?.message || r.statusText || "ark error",
        },
      });
      return;
    }
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
      "";
    if (!String(text).trim()) {
      send(res, 502, { error: { message: "empty model output" } });
      return;
    }
    send(res, 200, { reply: String(text).trim() });
  } catch (e) {
    send(res, 502, {
      error: { message: e && e.message ? e.message : "proxy fetch failed" },
    });
  }
});

server.listen(PORT, () => {
  console.log(
    `[cailun-proxy] http://127.0.0.1:${PORT}/chat  (ARK_MODEL_ENDPOINT=${ARK_MODEL ? "set" : "MISSING"})`
  );
});
