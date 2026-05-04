// WeTalk_Manage.js
// Surge only
// type=generic

const SCRIPT_NAME = "WeTalk";
const STORE_KEY = "wetalk_accounts_v1";

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function finish() {
  $done();
}

function decodeSafe(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (e) {
    return String(value || "");
  }
}

function parseArgument(text) {
  const result = {};
  const raw = String(text || "").trim();

  if (!raw) return result;

  raw.split("&").forEach(part => {
    if (!part) return;

    const index = part.indexOf("=");
    if (index < 0) {
      result[decodeSafe(part)] = "true";
      return;
    }

    const key = decodeSafe(part.slice(0, index));
    const value = decodeSafe(part.slice(index + 1));
    result[key] = value;
  });

  return result;
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

function formatTime(ts) {
  if (!ts) return "未知";
  return new Date(ts).toLocaleString();
}

function cleanInvalid(store) {
  Object.keys(store.accounts || {}).forEach(id => {
    const acc = store.accounts[id];

    if (/^fp_[a-f0-9]+$/i.test(id)) {
      delete store.accounts[id];
      return;
    }

    if (!acc || !acc.email || !acc.capture || !acc.capture.paramsRaw || !acc.capture.headers) {
      delete store.accounts[id];
    }
  });

  store.order = (store.order || []).filter(id => store.accounts[id]);
  return store;
}

function listAccounts(store) {
  store = cleanInvalid(store);
  writeStore(store);

  const ids = store.order.filter(id => store.accounts[id]);

  if (!ids.length) {
    notify("账号列表", "当前没有有效 WeTalk 账号。请重新触发 queryBalanceAndBonus 抓取。");
    return;
  }

  const lines = ids.map((id, index) => {
    const acc = store.accounts[id];
    return [
      `${index + 1}. ${acc.alias || acc.email || id}`,
      `email: ${acc.email || id}`,
      `updated: ${formatTime(acc.updatedAt)}`
    ].join("\n");
  });

  notify(`账号列表：${ids.length} 个`, lines.join("\n\n"));
}

function clearAccounts() {
  const ok = writeStore({ version: 2, accounts: {}, order: [] });
  notify("清空账号", ok ? "已清空所有 WeTalk 账号。" : "清空失败。");
}

function deleteAccount(store, email) {
  const key = String(email || "").trim().toLowerCase();

  if (!key) {
    notify("删除失败", "缺少 email 参数。示例：action=delete&email=xxx@example.com");
    return;
  }

  if (!store.accounts[key]) {
    notify("删除失败", `未找到账号：${key}`);
    return;
  }

  delete store.accounts[key];
  store.order = store.order.filter(id => id !== key);

  const ok = writeStore(store);
  notify("删除账号", ok ? `已删除：${key}` : "保存失败。");
}

function main() {
  const args = parseArgument(typeof $argument !== "undefined" ? $argument : "");
  const action = String(args.action || "list").toLowerCase();
  const store = readStore();

  if (action === "list") {
    listAccounts(store);
  } else if (action === "clear") {
    clearAccounts();
  } else if (action === "delete") {
    deleteAccount(store, args.email);
  } else {
    notify("未知操作", "支持 action=list、action=clear、action=delete&email=xxx@example.com");
  }

  finish();
}

try {
  main();
} catch (e) {
  notify("账号管理异常", String(e && e.stack ? e.stack : e));
  finish();
}
