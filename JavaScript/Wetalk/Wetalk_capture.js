/*
 * WeTalk_capture.js
 * Surge http-request script
 */

var SCRIPT_NAME = "WeTalk";
var STORE_KEY = "wetalk_accounts_v1";

function parseArgument() {
  var raw = typeof $argument === "string" ? $argument : "";
  var out = {};

  raw.split("&").forEach(function(pair) {
    if (!pair) return;

    var idx = pair.indexOf("=");
    var key = idx >= 0 ? pair.slice(0, idx) : pair;
    var val = idx >= 0 ? pair.slice(idx + 1) : "";

    try {
      out[decodeURIComponent(key)] = decodeURIComponent(val.replace(/\+/g, "%20"));
    } catch (e) {
      out[key] = val;
    }
  });

  return out;
}

function boolArg(args, key, fallback) {
  var value = args[key];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  var s = String(value).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function safeDecode(value) {
  if (value === undefined || value === null) return "";

  try {
    return decodeURIComponent(String(value));
  } catch (e) {
    return String(value);
  }
}

function parseRawQuery(url) {
  var query = String(url || "").split("?")[1];

  if (!query) return {};

  query = query.split("#")[0];

  var out = {};

  query.split("&").forEach(function(pair) {
    if (!pair) return;

    var idx = pair.indexOf("=");

    if (idx < 0) {
      out[pair] = "";
    } else {
      out[pair.slice(0, idx)] = pair.slice(idx + 1);
    }
  });

  return out;
}

function getHeader(headers, name) {
  var target = String(name || "").toLowerCase();

  for (var key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key)) {
      if (String(key).toLowerCase() === target) {
        return String(headers[key] || "");
      }
    }
  }

  return "";
}

function emailKeyOf(paramsRaw) {
  var raw = paramsRaw && paramsRaw.email;
  return raw ? safeDecode(raw).trim().toLowerCase() : "";
}

function simpleHash(input) {
  var h = 2166136261;
  var s = String(input || "");

  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }

  return (h >>> 0).toString(16);
}

function fingerprintOf(paramsRaw) {
  var email = emailKeyOf(paramsRaw);
  if (email) return email;

  var volatileKeys = {
    sign: true,
    signDate: true,
    timestamp: true,
    ts: true,
    nonce: true,
    random: true,
    reqTime: true,
    reqId: true,
    requestId: true
  };

  var base = Object.keys(paramsRaw || {})
    .filter(function(key) {
      return !volatileKeys[key];
    })
    .sort()
    .map(function(key) {
      return key + "=" + paramsRaw[key];
    })
    .join("&");

  return "fp_" + simpleHash(base);
}

function loadStore() {
  var raw = $persistentStore.read(STORE_KEY);

  if (!raw) {
    return {
      version: 3,
      accounts: {},
      order: []
    };
  }

  try {
    var store = JSON.parse(raw);

    if (!store || typeof store !== "object") {
      throw new Error("Invalid store");
    }

    if (!store.accounts || typeof store.accounts !== "object") {
      store.accounts = {};
    }

    if (!Array.isArray(store.order)) {
      store.order = Object.keys(store.accounts);
    }

    store.order = store.order.filter(function(id) {
      return store.accounts[id];
    });

    store.version = 3;

    return store;
  } catch (e) {
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

  store.order = store.order.filter(function(id) {
    return store.accounts[id];
  });

  store.version = 3;

  return $persistentStore.write(JSON.stringify(store), STORE_KEY);
}

function maskAccount(text, showSensitive) {
  var s = String(text || "");

  if (showSensitive) return s;

  if (s.indexOf("@") < 0) {
    return s.length > 12 ? s.slice(0, 6) + "..." + s.slice(-4) : s;
  }

  var parts = s.split("@");
  var name = parts[0] || "";
  var domain = parts[1] || "";

  var maskedName =
    name.length <= 2
      ? (name[0] || "*") + "*"
      : name.slice(0, 2) + "***" + name.slice(-1);

  return maskedName + "@" + domain;
}

function formatAccountList(store, showSensitive) {
  var ids = (store.order || []).filter(function(id) {
    return store.accounts[id];
  });

  if (!ids.length) {
    return "No saved account.";
  }

  return ids
    .map(function(id, index) {
      var acc = store.accounts[id];
      var label = acc.alias || acc.email || acc.id || id;
      var display = maskAccount(label, showSensitive);
      var updated = acc.updatedAt ? new Date(acc.updatedAt).toLocaleString() : "unknown";

      return [
        String(index + 1) + ". " + display,
        "ID: " + maskAccount(id, showSensitive),
        "Updated: " + updated
      ].join("\n");
    })
    .join("\n\n");
}

function main() {
  var args = parseArgument();

  if (!boolArg(args, "CAPTURE_ENABLED", true)) {
    console.log("[WeTalk Capture] disabled");
    $done({});
    return;
  }

  if (typeof $request === "undefined" || !$request || !$request.url) {
    console.log("[WeTalk Capture] no request object");
    notify("Capture Failed", "No request object. Please check script type.");
    $done({});
    return;
  }

  console.log("[WeTalk Capture] matched url: " + $request.url);

  var paramsRaw = parseRawQuery($request.url);

  if (!Object.keys(paramsRaw).length) {
    console.log("[WeTalk Capture] no query parameters");
    notify("Capture Failed", "No query parameters found.");
    $done({});
    return;
  }

  var headers = $request.headers || {};
  var email = emailKeyOf(paramsRaw);
  var accountId = email || fingerprintOf(paramsRaw);
  var now = Date.now();

  var store = loadStore();
  var existed = !!store.accounts[accountId];
  var previous = store.accounts[accountId] || {};

  store.accounts[accountId] = {
    id: accountId,
    email: email,
    alias: previous.alias || email || accountId,
    uaSeed: Number.isInteger(previous.uaSeed) ? previous.uaSeed : store.order.length,
    baseUA: getHeader(headers, "User-Agent"),
    capture: {
      url: $request.url,
      paramsRaw: paramsRaw,
      headers: headers
    },
    createdAt: previous.createdAt || now,
    updatedAt: now
  };

  if (!existed && store.order.indexOf(accountId) < 0) {
    store.order.push(accountId);
  }

  var ok = saveStore(store);
  var showSensitive = boolArg(args, "SHOW_SENSITIVE", false);
  var list = formatAccountList(store, showSensitive);

  console.log("[WeTalk Capture] saved: " + String(ok));
  console.log("[WeTalk Capture] account count: " + store.order.length);

  notify(
    existed ? "Account Updated" : "Account Captured",
    "Saved: " + String(ok) + "\nCount: " + store.order.length + "\n\n" + list
  );

  $done({});
}

try {
  main();
} catch (e) {
  console.log("[WeTalk Capture] error: " + (e.message || String(e)));
  notify("Capture Error", e.message || String(e));
  $done({});
}
