// WeTalk_account_manager.js for Surge
// 用途：查看、删除、清空 WeTalk 已保存账号
// 参数：DELETE_ACCOUNTS、DELETE_ALL

const scriptName = "WeTalk账号管理";
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

function parseArgs(str) {
  const out = {};

  String(str || "").split("&").forEach(function (pair) {
    if (!pair) return;

    const idx = pair.indexOf("=");
    const key = idx >= 0 ? pair.slice(0, idx) : pair;
    const val = idx >= 0 ? pair.slice(idx + 1) : "";

    try {
      out[key] = decodeURIComponent(val);
    } catch (e) {
      out[key] = val;
    }
  });

  return out;
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

function splitList(value) {
  return String(value || "")
    .split(/[\n,，;；]+/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

function formatTime(timestamp) {
  if (!timestamp) return "未知时间";

  try {
    return new Date(timestamp).toLocaleString();
  } catch (e) {
    return "未知时间";
  }
}

function formatAccountList(store) {
  const ids = (store.order || []).filter(function (id) {
    return store.accounts[id];
  });

  if (!ids.length) return "当前未保存账号。";

  return ids.map(function (id, index) {
    const acc = store.accounts[id] || {};
    const label = acc.alias || acc.email || acc.id || id;

    return [
      (index + 1) + ". " + label,
      "id: " + id,
      "email: " + (acc.email || ""),
      "alias: " + (acc.alias || ""),
      "hasCapture: " + (acc.capture && acc.capture.paramsRaw ? "yes" : "no"),
      "updatedAt: " + formatTime(acc.updatedAt)
    ].join("\n");
  }).join("\n\n");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function matchAccountIds(store, tokens) {
  const ids = (store.order || []).filter(function (id) {
    return store.accounts[id];
  });

  const result = [];

  tokens.forEach(function (tokenRaw) {
    const token = normalizeText(tokenRaw);

    if (!token) return;

    if (/^\d+$/.test(token)) {
      const idx = Number(token);
      if (idx >= 1 && idx <= ids.length && result.indexOf(ids[idx - 1]) < 0) {
        result.push(ids[idx - 1]);
      }
      return;
    }

    ids.forEach(function (id) {
      const acc = store.accounts[id] || {};

      const candidates = [id, acc.id, acc.email, acc.alias]
        .filter(Boolean)
        .map(normalizeText);

      if (candidates.indexOf(token) >= 0 && result.indexOf(id) < 0) {
        result.push(id);
      }
    });
  });

  return result;
}

function boolFromValue(value, fallback) {
  if (value === undefined || value === null || value === "") return !!fallback;

  const s = String(value).trim().toLowerCase();

  return s === "true" || s === "1" || s === "yes" || s === "y";
}

(function main() {
  const store = loadStore();
  const args = parseArgs(typeof $argument !== "undefined" ? $argument : "");
  const accountList = formatAccountList(store);

  if (typeof $input !== "undefined" && $input && $input.purpose === "panel") {
    $done({
      title: "WeTalk 账号：" + ((store.order || []).length) + " 个",
      content: accountList + "\n\n删除：修改模块参数后手动运行「WeTalk 账号管理」。Panel 刷新不会执行删除。",
      style: (store.order || []).length ? "good" : "info"
    });
    return;
  }

  const deleteAll = boolFromValue(args.DELETE_ALL, false);
  const deleteInput = args.DELETE_ACCOUNTS || "";
  const deleteTokens = splitList(deleteInput);

  if (deleteAll) {
    const count = Object.keys(store.accounts || {}).length;

    store.accounts = {};
    store.order = [];

    saveStore(store);

    notify(
      "已清空全部账号",
      "删除前账号数：" + count + "\n已执行清空。\n请把模块参数 DELETE_ALL 改回 false，避免下次误删。"
    );

    $done();
    return;
  }

  if (!deleteTokens.length) {
    notify(
      "当前账号：" + (store.order || []).length + " 个",
      "DELETE_ACCOUNTS: " + (deleteInput || "(空)") +
      "\nDELETE_ALL: " + String(args.DELETE_ALL || "(空)") +
      "\n\n当前账号列表：\n" + accountList +
      "\n\n删除方法：\n1. 在模块参数 DELETE_ACCOUNTS 填编号，例如 2\n2. 保存模块设置\n3. 手动运行「WeTalk 账号管理」\n4. 删除后清空 DELETE_ACCOUNTS"
    );

    $done();
    return;
  }

  const matchedIds = matchAccountIds(store, deleteTokens);

  if (!matchedIds.length) {
    notify(
      "未匹配到要删除的账号",
      "删除输入：" + deleteInput +
      "\n\n当前账号列表：\n" + accountList +
      "\n\n建议优先使用编号，例如 1 或 2。"
    );

    $done();
    return;
  }

  const deleted = [];

  matchedIds.forEach(function (id) {
    const acc = store.accounts[id] || {};
    deleted.push(acc.alias || acc.email || acc.id || id);
    delete store.accounts[id];
  });

  saveStore(store);

  const afterStore = loadStore();

  notify(
    "账号已删除",
    "删除输入：" + deleteInput +
    "\n\n已删除：\n- " + deleted.join("\n- ") +
    "\n\n删除后账号数：" + afterStore.order.length +
    "\n\n剩余账号列表：\n" + formatAccountList(afterStore) +
    "\n\n请把模块参数 DELETE_ACCOUNTS 清空，避免下次误删。"
  );

  $done();
})();
