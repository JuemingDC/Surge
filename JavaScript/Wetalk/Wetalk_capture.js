// WeTalk_Capture.js
// Surge only
// type=http-request

const SCRIPT_NAME = "WeTalk";
const STORE_KEY = "wetalk_accounts_v1";

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function finish(value) {
  $done(typeof value === "undefined" ? {} : value);
}

function readStore() {
  const raw = $persistentStore.read(STORE_KEY);
  if (!raw) return { version: 2, accounts: {}, order: [] };

  try {
    const data = JSON.parse(raw);
    if (!data.accounts) data.accounts = {};
    if (!Array.isArray(data.order)) data.order = Object.keys(data.accounts);
    return data;
  } catch (e) {
    return { version: 2, accounts: {}, order: [] };
  }
}

function writeStore(data) {
  return $persistentStore.write(JSON.stringify(data), STORE_KEY);
}

function decodeSafe(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (e) {
    return String(value || "");
  }
}

function parseRawQuery(url) {
  const query = String(url || "").split("?")[1] || "";
  const clean = query.split("#")[0];
  const result = {};

  clean.split("&").forEach(pair => {
    if (!pair) return;
    const idx = pair.indexOf("=");
    if (idx < 0) return;

    const key = pair.slice(0, idx);
    const value = pair.slice(idx + 1);
    result[key] = value;
  });

  return result;
}

function normalizeHeaders(headers) {
  const output = {};
  Object.keys(headers || {}).forEach(key => {
    output[key] = headers[key];
  });
  return output;
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();
  const keys = Object.keys(headers || {});
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === target) return headers[keys[i]];
  }
  return "";
}

function emailKeyOf(paramsRaw) {
  const raw = paramsRaw && paramsRaw.email;
  if (!raw) return "";
  return decodeSafe(raw).trim().toLowerCase();
}

function capture() {
  if (typeof $request === "undefined" || !$request || !$request.url) {
    notify("抓取失败", "未检测到 $request。该脚本必须由 http-request 触发。");
    finish();
    return;
  }

  const paramsRaw = parseRawQuery($request.url);
  const email = emailKeyOf(paramsRaw);

  if (!email) {
    notify(
      "抓取失败",
      [
        "当前 queryBalanceAndBonus 请求中没有 email 参数。",
        "未保存账号，避免生成无效 fp_ 账号。",
        "请确认 WeTalk 已登录后重新进入余额/签到相关页面。"
      ].join("\n")
    );
    finish();
    return;
  }

  const headersMap = normalizeHeaders($request.headers || {});
  const baseUA = getHeader(headersMap, "User-Agent");

  const store = readStore();

  // 清理历史错误保存的 fp_ 账号
  Object.keys(store.accounts).forEach(id => {
    if (/^fp_[a-f0-9]+$/i.test(id)) {
      delete store.accounts[id];
    }
  });
  store.order = store.order.filter(id => store.accounts[id] && !/^fp_[a-f0-9]+$/i.test(id));

  const now = Date.now();
  const existed = !!store.accounts[email];
  const uaSeed = existed ? (store.accounts[email].uaSeed || 0) : store.order.length;
  const alias = existed ? (store.accounts[email].alias || email) : email;

  store.accounts[email] = {
    id: email,
    email: email,
    alias: alias,
    uaSeed: uaSeed,
    baseUA: baseUA,
    capture: {
      url: $request.url,
      paramsRaw: paramsRaw,
      headers: headersMap
    },
    createdAt: existed ? store.accounts[email].createdAt : now,
    updatedAt: now
  };

  if (!existed) store.order.push(email);

  const ok = writeStore(store);

  notify(
    existed ? "账号参数已更新" : "新账号已保存",
    `${email}\n账号数量：${store.order.length}\n保存状态：${ok ? "成功" : "失败"}`
  );

  console.log(`[WeTalk Capture] ${existed ? "update" : "add"} account: ${email}`);
  finish();
}

try {
  capture();
} catch (e) {
  notify("抓取脚本异常", String(e && e.stack ? e.stack : e));
  finish();
}
