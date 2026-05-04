/*
 * WeTalk_capture.js - Surge 参数抓取脚本
 * 类型：http-request
 */

const SCRIPT_NAME = "WeTalk";
const STORE_KEY = "wetalk_accounts_v1";

function parseArgument() {
  const raw = typeof $argument === "string" ? $argument : "";
  const out = {};

  raw.split("&").forEach(pair => {
    if (!pair) return;

    const idx = pair.indexOf("=");
    const key = idx >= 0 ? pair.slice(0, idx) : pair;
    const val = idx >= 0 ? pair.slice(idx + 1) : "";

    try {
      out[decodeURIComponent(key)] = decodeURIComponent(val.replace(/\+/g, "%20"));
    } catch {
      out[key] = val;
    }
  });

  return out;
}

function boolArg(args, key, fallback) {
  const value = args[key];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const s = String(value).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function safeDecode(value) {
  if (value == null) return "";

  try {
    return decodeURIComponent(String(value));
  } catch {
    return String(value);
  }
}

function parseRawQuery(url) {
  const query = String(url || "").split("?")[1]?.split("#")[0] || "";
  const out = {};

  query.split("&").forEach(pair => {
    if (!pair) return;

    const idx = pair.indexOf("=");

    if (idx < 0) {
      out[pair] = "";
    } else {
      out[pair.slice(0, idx)] = pair.slice(idx + 1);
    }
  });

  return out;
}

function emailKeyOf(paramsRaw) {
  const raw = paramsRaw && paramsRaw.email;
  return raw ? safeDecode(raw).trim().toLowerCase() : "";
}

function simpleHash(input) {
  let h = 2166136261;
  const s = String(input || "");

  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }

  return (h >>> 0).toString(16).padStart(8, "0");
}

function fingerprintOf(paramsRaw) {
  const email = emailKeyOf(paramsRaw);
  if (email) return email;

  const volatileKeys = new Set([
    "sign",
    "signDate",
    "timestamp",
    "ts",
    "nonce",
    "random",
    "reqTime",
    "reqId",
    "requestId"
  ]);

  const base = Object.keys(paramsRaw || {})
    .filter(key => !volatileKeys.has(key))
    .sort()
    .map(key => `${key}=${paramsRaw[key]}`)
    .join("&");

  return "fp_" + simpleHash(base);
}

function loadStore() {
  const raw = $persistentStore.read(STORE_KEY);

  if (!raw) {
    return {
      version: 3,
      accounts: {},
      order: []
    };
  }

  try {
    const store = JSON.parse(raw);

    if (!store || typeof store !== "object") {
      throw new Error("invalid store");
    }

    if (!store.accounts || typeof store.accounts !== "object") {
      store.accounts = {};
    }

    if (!Array.isArray(store.order)) {
      store.order = Object.keys(store.accounts);
    }

    store.order = store.order.filter(id => store.accounts[id]);
    store.version = 3;

    return store;
  } catch {
    return {
      version: 3,
      accounts: {},
      order: []
    };
  }
}

function saveStore(store) {
  if (!store.accounts || typeof store.accounts !== "object") {
    store.accounts = {};
  }

  if (!Array.isArray(store.order)) {
    store.order = Object.keys(store.accounts);
  }

  store.order = store.order.filter(id => store.accounts[id]);
  store.version = 3;

  $persistentStore.write(JSON.stringify(store), STORE_KEY);
}

function maskAccount(text, showSensitive) {
  const s = String(text || "");

  if (showSensitive) return s;

  if (!s.includes("@")) {
    return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
  }

  const parts = s.split("@");
  const name = parts[0] || "";
  const domain = parts[1] || "";

  const maskedName =
    name.length <= 2
      ? `${name[0] || "*"}*`
      : `${name.slice(0, 2)}***${name.slice(-1)}`;

  return `${maskedName}@${domain}`;
}

function formatAccountList(store, showSensitive) {
  const ids = (store.order || []).filter(id => store.accounts[id]);

  if (!ids.length) {
    return "当前未保存账号。";
  }

  return ids
    .map((id, index) => {
      const acc = store.accounts[id];
      const label = acc.alias || acc.email || acc.id || id;
      const display = maskAccount(label, showSensitive);
      const updated = acc.updatedAt
        ? new Date(acc.updatedAt).toLocaleString()
        : "未知时间";

      return [
        `${index + 1}. ${display}`,
        `ID: ${maskAccount(id, showSensitive)}`,
        `更新时间: ${updated}`
      ].join("\n");
    })
    .join("\n\n");
}

function main() {
  const args = parseArgument();

  if (!boolArg(args, "CAPTURE_ENABLED", true)) {
    $done({});
    return;
  }

  if (typeof $request === "undefined" || !$request || !$request.url) {
    notify("抓取失败", "未检测到 $request，请确认脚本类型为 http-request。");
    $done({});
    return;
  }

  const paramsRaw = parseRawQuery($request.url);

  if (!Object.keys(paramsRaw).length) {
    notify("抓取失败", "当前请求未解析到 URL 参数。");
    $done({});
    return;
  }

  const headers = $request.headers || {};
  const email = emailKeyOf(paramsRaw);
  const accountId = email || fingerprintOf(paramsRaw);
  const now = Date.now();

  const store = loadStore();
  const existed = Boolean(store.accounts[accountId]);
  const previous = store.accounts[accountId] || {};

  store.accounts[accountId] = {
    id: accountId,
    email,
    alias: previous.alias || email || accountId,
    uaSeed: Number.isInteger(previous.uaSeed) ? previous.uaSeed : store.order.length,
    baseUA: headers["User-Agent"] || headers["user-agent"] || "",
    capture: {
      url: $request.url,
      paramsRaw,
      headers
    },
    createdAt: previous.createdAt || now,
    updatedAt: now
  };

  if (!existed && !store.order.includes(accountId)) {
    store.order.push(accountId);
  }

  saveStore(store);

  const showSensitive = boolArg(args, "SHOW_SENSITIVE", false);
  const list = formatAccountList(store, showSensitive);

  notify(
    existed ? "账号参数已更新" : "新账号已入库",
    `当前账号总数：${store.order.length}\n\n${list}`
  );

  $done({});
}

try {
  main();
} catch (e) {
  notify("抓取异常", e.message || String(e));
  $done({});
}
