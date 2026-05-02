// WeTalk_account_manager.js for Surge
// 单参数版：通过 WETALK_ACTION 控制账号管理
// 支持：list / delete=1 / delete=1,2 / delete=email / clear=true

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

function parseUnifiedAction(str) {
  const raw = String(str || "").trim();

  if (!raw || raw === "list") {
    return {
      action: "list"
    };
  }

  const obj = parseArgs(raw);

  if (obj.clear || obj.CLEAR) {
    return {
      action: "clear",
      value: obj.clear || obj.CLEAR
    };
  }

  if (obj.delete || obj.DELETE) {
    return {
      action: "delete",
      value: obj.delete || obj.DELETE
    };
  }

  if (obj.del || obj.DEL) {
    return {
      action: "delete",
      value: obj.del || obj.DEL
    };
  }

  return {
    action: "list"
  };
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

function boolFromValue(value) {
  const s = String(value || "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

(function main() {
  const store = loadStore();
  const accountList = formatAccountList(store);

  const parsed = parseUnifiedAction(typeof $argument !== "undefined" ? $argument : "");

  if (parsed.action === "list") {
    notify(
      "当前账号：" + (store.order || []).length + " 个",
      accountList +
      "\n\n参数示例：" +
      "\nlist：查看账号" +
      "\ndelete=1：删除第 1 个账号" +
      "\ndelete=1,2：删除多个账号" +
      "\ndelete=邮箱：按邮箱删除" +
      "\nclear=true：清空全部账号"
    );

    $done();
    return;
  }

  if (parsed.action === "clear") {
    if (!boolFromValue(parsed.value)) {
      notify(
        "清空参数无效",
        "如需清空全部账号，请填写：clear=true"
      );

      $done();
      return;
    }

    const count = Object.keys(store.accounts || {}).length;

    store.accounts = {};
    store.order = [];

    saveStore(store);

    notify(
      "已清空全部账号",
      "删除前账号数：" + count +
      "\n已执行清空。" +
      "\n\n请将模块参数 WETALK_ACTION 改回空值或 list，避免误操作。"
    );

    $done();
    return;
  }

  if (parsed.action === "delete") {
    const deleteInput = parsed.value || "";
    const deleteTokens = splitList(deleteInput);

    if (!deleteTokens.length) {
      notify(
        "未输入删除账号",
        "示例：" +
        "\ndelete=1" +
        "\ndelete=1,2" +
        "\ndelete=example@email.com" +
        "\n\n当前账号列表：\n" + accountList
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
        "\n\n建议优先使用编号，例如 delete=1。"
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
      "\n\n请将模块参数 WETALK_ACTION 改回空值或 list，避免下次误删。"
    );

    $done();
    return;
  }

  notify(
    "未知操作",
    "当前参数：" + String($argument || "") +
    "\n支持：list / delete=1 / clear=true"
  );

  $done();
})();
