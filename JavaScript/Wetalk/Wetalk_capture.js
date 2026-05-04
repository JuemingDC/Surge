// WeTalk_Capture.js
// Surge only
// type=http-request

const SCRIPT_NAME = "WeTalk";
const STORE_KEY = "wetalk_accounts_v1";

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function done(value) {
  if (typeof value === "undefined") {
    $done({});
  } else {
    $done(value);
  }
}

function readStore() {
  const raw = $persistentStore.read(STORE_KEY);
  if (!raw) return { version: 1, accounts: {}, order: [] };

  try {
    const data = JSON.parse(raw);
    if (!data.accounts) data.accounts = {};
    if (!Array.isArray(data.order)) data.order = Object.keys(data.accounts);
    return data;
  } catch (e) {
    return { version: 1, accounts: {}, order: [] };
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

function parseQueryRaw(url) {
  const query = String(url || "").split("?")[1] || "";
  const clean = query.split("#")[0];
  const result = {};

  clean.split("&").forEach(item => {
    if (!item) return;
    const index = item.indexOf("=");
    if (index < 0) return;

    const key = item.slice(0, index);
    const value = item.slice(index + 1);
    result[key] = value;
  });

  return result;
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();
  const keys = Object.keys(headers || {});
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === target) {
      return headers[keys[i]];
    }
  }
  return "";
}

function normalizeHeaders(headers) {
  const output = {};
  Object.keys(headers || {}).forEach(key => {
    output[key] = headers[key];
  });
  return output;
}

function getEmail(params) {
  const email = decodeSafe(params.email || "").trim().toLowerCase();
  return email;
}

function capture() {
  if (typeof $request === "undefined" || !$request || !$request.url) {
    notify("抓取失败", "当前脚本不是 http-request 触发，未检测到 $request。");
    done();
    return;
  }

  const paramsRaw = parseQueryRaw($request.url);
  const email = getEmail(paramsRaw);

  if (!email) {
    notify("抓取失败", "queryBalanceAndBonus 请求中没有 email 参数。请确认 WeTalk 已登录后重新打开相关页面。");
    done();
    return;
  }

  const headers = normalizeHeaders($request.headers || {});
  const userAgent = getHeader(headers, "User-Agent");

  const store = readStore();
  const now = Date.now();
  const existed = !!store.accounts[email];

  store.accounts[email] = {
    id: email,
    email: email,
    alias: existed ? (store.accounts[email].alias || email) : email,
    userAgent: userAgent,
    paramsRaw: paramsRaw,
    headers: headers,
    createdAt: existed ? store.accounts[email].createdAt : now,
    updatedAt: now
  };

  if (!existed) {
    store.order.push(email);
  }

  const ok = writeStore(store);

  notify(
    existed ? "账号参数已更新" : "新账号已保存",
    `${email}\n账号数量：${store.order.length}\n保存状态：${ok ? "成功" : "失败"}`
  );

  console.log(`[WeTalk] capture ${existed ? "update" : "add"}: ${email}`);
  done();
}

try {
  capture();
} catch (e) {
  notify("抓取脚本异常", String(e && e.stack ? e.stack : e));
  done();
}
