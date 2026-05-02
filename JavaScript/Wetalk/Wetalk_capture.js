// WeTalk_capture.js for Surge
// 用途：抓取 queryBalanceAndBonus 请求参数并保存为多账号数据

const scriptName = "WeTalk";
const storeKey = "wetalk_accounts_v1";

function readStore(key) {
  return $persistentStore.read(key);
}

function writeStore(value, key) {
  return $persistentStore.write(value, key);
}

function notify(subtitle, body) {
  $notification.post(scriptName, subtitle, body || "");
}

function safeDecode(value) {
  if (value == null) return "";
  try {
    return decodeURIComponent(String(value));
  } catch (e) {
    return String(value);
  }
}

function parseRawQuery(url) {
  const query = (String(url || "").split("?")[1] || "").split("#")[0];
  const out = {};

  query.split("&").forEach(function (pair) {
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

function cloneHeaders(headers) {
  const out = {};
  Object.keys(headers || {}).forEach(function (key) {
    out[key] = headers[key];
  });
  return out;
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();
  for (const key in headers || {}) {
    if (String(key).toLowerCase() === target) return headers[key];
  }
  return "";
}

function simpleHash(text) {
  let hash = 5381;
  const str = String(text || "");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return Math.abs(hash).toString(16);
}

function emailKeyOf(paramsRaw) {
  const raw = paramsRaw && paramsRaw.email;
  return raw ? safeDecode(raw).trim().toLowerCase() : "";
}

function fingerprintOf(paramsRaw) {
  const email = emailKeyOf(paramsRaw);
  if (email) return email;

  const drop = {
    sign: 1,
    signDate: 1,
    timestamp: 1,
    ts: 1,
    nonce: 1,
    random: 1,
    reqTime: 1,
    reqId: 1,
    requestId: 1
  };

  const base = Object.keys(paramsRaw || {})
    .filter(function (k) {
      return !drop[k];
    })
    .sort()
    .map(function (k) {
      return k + "=" + paramsRaw[k];
    })
    .join("&");

  return "fp_" + simpleHash(base);
}

function loadStore() {
  const raw = readStore(storeKey);

  if (!raw) {
    return {
      version: 3,
      accounts: {},
      order: []
    };
  }

  try {
    const obj = JSON.parse(raw);

    if (!obj.accounts || typeof obj.accounts !== "object") {
      obj.accounts = {};
    }

    if (!Array.isArray(obj.order)) {
      obj.order = Object.keys(obj.accounts);
    }

    obj.order = obj.order.filter(function (id) {
      return obj.accounts[id];
    });

    obj.version = 3;
    return obj;
  } catch (e) {
    return {
      version: 3,
      accounts: {},
      order: []
    };
  }
}

function saveStore(store) {
  store.version = 3;

  store.order = (store.order || Object.keys(store.accounts || {})).filter(function (id) {
    return store.accounts[id];
  });

  return writeStore(JSON.stringify(store), storeKey);
}

(function main() {
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

  const headers = cloneHeaders($request.headers || {});
  const email = emailKeyOf(paramsRaw);
  const accountId = email || fingerprintOf(paramsRaw);

  const store = loadStore();
  const existed = !!store.accounts[accountId];
  const now = Date.now();

  const uaSeed = existed ? (store.accounts[accountId].uaSeed || 0) : store.order.length;
  const alias = existed ? (store.accounts[accountId].alias || email || accountId) : (email || accountId);

  store.accounts[accountId] = {
    id: accountId,
    email: email,
    alias: alias,
    uaSeed: uaSeed,
    baseUA: getHeader(headers, "User-Agent"),
    capture: {
      url: $request.url,
      paramsRaw: paramsRaw,
      headers: headers
    },
    createdAt: existed ? store.accounts[accountId].createdAt : now,
    updatedAt: now
  };

  if (!existed && store.order.indexOf(accountId) < 0) {
    store.order.push(accountId);
  }

  const ok = saveStore(store);

  notify(
    ok ? (existed ? "账号参数已更新" : "新账号已入库") : "存储失败",
    ok ? (alias + "\n当前账号总数：" + store.order.length) : "Surge 持久化存储写入失败。"
  );

  $done({});
})();
