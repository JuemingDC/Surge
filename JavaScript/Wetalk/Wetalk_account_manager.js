/*
 * WeTalk_account_manager.js - Surge 账号管理脚本
 * 类型：generic
 */

const SCRIPT_NAME = "WeTalk账号管理";
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

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function boolValue(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const s = String(value).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
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

function splitList(value) {
  return String(value || "")
    .split(/[\n,，;；\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function formatTime(timestamp) {
  if (!timestamp) return "未知时间";

  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return "未知时间";
  }
}

function formatAccountList(store) {
  const ids = (store.order || []).filter(id => store.accounts[id]);

  if (!ids.length) {
    return "当前未保存账号。";
  }

  return ids
    .map((id, index) => {
      const acc = store.accounts[id] || {};
      const label = acc.alias || acc.email || acc.id || id;

      return [
        `${index + 1}. ${label}`,
        `id: ${id}`,
        `email: ${acc.email || ""}`,
        `alias: ${acc.alias || ""}`,
        `hasCapture: ${acc.capture && acc.capture.paramsRaw ? "yes" : "no"}`,
        `updatedAt: ${formatTime(acc.updatedAt)}`
      ].join("\n");
    })
    .join("\n\n");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function matchAccountIds(store, tokens) {
  const ids = (store.order || []).filter(id => store.accounts[id]);
  const result = new Set();

  tokens.forEach(tokenRaw => {
    const token = normalizeText(tokenRaw);

    if (!token) return;

    if (/^\d+$/.test(token)) {
      const index = Number(token);

      if (index >= 1 && index <= ids.length) {
        result.add(ids[index - 1]);
        return;
      }
    }

    ids.forEach(id => {
      const acc = store.accounts[id] || {};

      const candidates = [id, acc.id, acc.email, acc.alias]
        .filter(Boolean)
        .map(v => normalizeText(v));

      if (candidates.includes(token)) {
        result.add(id);
      }
    });
  });

  return Array.from(result);
}

function main() {
  const args = parseArgument();
  const store = loadStore();

  const deleteInput = args.DELETE_ACCOUNTS || "";
  const deleteAll = boolValue(args.DELETE_ALL, false);
  const deleteTokens = splitList(deleteInput);
  const beforeList = formatAccountList(store);

  if (deleteAll) {
    const count = Object.keys(store.accounts || {}).length;

    store.accounts = {};
    store.order = [];

    saveStore(store);

    notify(
      "已清空全部账号",
      [
        `删除前账号数：${count}`,
        "",
        "已执行清空。",
        "",
        "请立刻回到模块参数，把 DELETE_ALL 改回 false，避免下次误删。"
      ].join("\n")
    );

    return;
  }

  if (!deleteTokens.length) {
    notify(
      `当前账号：${store.order.length} 个`,
      [
        `DELETE_ACCOUNTS: ${deleteInput || "(空)"}`,
        `DELETE_ALL: ${String(args.DELETE_ALL ?? "(空)")}`,
        "",
        "当前账号列表：",
        beforeList,
        "",
        "删除方法：",
        "1. 回到 Surge 模块参数",
        "2. 在 DELETE_ACCOUNTS 填写编号，例如 2",
        "3. 保存模块参数",
        "4. 手动运行“WeTalk 账号管理”",
        "5. 删除完成后清空 DELETE_ACCOUNTS"
      ].join("\n")
    );

    return;
  }

  const matchedIds = matchAccountIds(store, deleteTokens);

  if (!matchedIds.length) {
    notify(
      "未匹配到要删除的账号",
      [
        `删除输入：${deleteInput}`,
        "",
        "当前账号列表：",
        beforeList,
        "",
        "建议：优先使用账号编号删除，例如 1 或 2。"
      ].join("\n")
    );

    return;
  }

  const deleted = [];

  matchedIds.forEach(id => {
    const acc = store.accounts[id] || {};
    deleted.push(acc.alias || acc.email || acc.id || id);
    delete store.accounts[id];
  });

  saveStore(store);

  const afterStore = loadStore();

  notify(
    "账号已删除",
    [
      `删除输入：${deleteInput}`,
      "",
      "已删除：",
      ...deleted.map(x => `- ${x}`),
      "",
      `删除后账号数：${afterStore.order.length}`,
      "",
      "剩余账号列表：",
      formatAccountList(afterStore),
      "",
      "请回到模块参数，把 DELETE_ACCOUNTS 清空，避免下次误删。"
    ].join("\n")
  );
}

try {
  main();
} catch (e) {
  notify("账号管理异常", e.message || String(e));
} finally {
  $done();
}
