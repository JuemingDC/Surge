/*
 * WeTalk_task.js - Surge 定时任务脚本
 * 类型：cron
 */

const SCRIPT_NAME = "WeTalk";
const STORE_KEY = "wetalk_accounts_v1";
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";
const API_HOST = "api.wetalkapp.com";

const IOS_VER = ["17.5.1", "17.6.1", "17.4.1", "18.0.1"];
const MODELS = ["iPhone14,3", "iPhone15,3", "iPhone16,1", "iPhone14,7"];

function MD5(s) {
  function RL(v, n) { return (v << n) | (v >>> (32 - n)); }

  function AU(x, y) {
    var x4 = x & 0x40000000;
    var y4 = y & 0x40000000;
    var x8 = x & 0x80000000;
    var y8 = y & 0x80000000;
    var r = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);

    if (x4 & y4) return r ^ 0x80000000 ^ x8 ^ y8;

    if (x4 | y4) {
      return (r & 0x40000000)
        ? (r ^ 0xC0000000 ^ x8 ^ y8)
        : (r ^ 0x40000000 ^ x8 ^ y8);
    }

    return r ^ x8 ^ y8;
  }

  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | (~z)); }

  function FF(a, b, c, d, x, s, ac) {
    a = AU(a, AU(AU(F(b, c, d), x), ac));
    return AU(RL(a, s), b);
  }

  function GG(a, b, c, d, x, s, ac) {
    a = AU(a, AU(AU(G(b, c, d), x), ac));
    return AU(RL(a, s), b);
  }

  function HH(a, b, c, d, x, s, ac) {
    a = AU(a, AU(AU(H(b, c, d), x), ac));
    return AU(RL(a, s), b);
  }

  function II(a, b, c, d, x, s, ac) {
    a = AU(a, AU(AU(I(b, c, d), x), ac));
    return AU(RL(a, s), b);
  }

  function CWA(str) {
    var ml = str.length;
    var t1 = ml + 8;
    var t2 = (t1 - (t1 % 64)) / 64;
    var nw = (t2 + 1) * 16;
    var wa = Array(nw).fill(0);
    var bp = 0;
    var bc = 0;

    while (bc < ml) {
      var wc = (bc - (bc % 4)) / 4;
      bp = (bc % 4) * 8;
      wa[wc] |= str.charCodeAt(bc) << bp;
      bc++;
    }

    var wc2 = (bc - (bc % 4)) / 4;
    bp = (bc % 4) * 8;
    wa[wc2] |= 0x80 << bp;
    wa[nw - 2] = ml << 3;
    wa[nw - 1] = ml >>> 29;

    return wa;
  }

  function W2H(v) {
    var r = "";

    for (var i = 0; i <= 3; i++) {
      var b = (v >>> (i * 8)) & 255;
      var t = "0" + b.toString(16);
      r += t.substr(t.length - 2, 2);
    }

    return r;
  }

  var x = CWA(String(s));
  var a = 0x67452301;
  var b = 0xEFCDAB89;
  var c = 0x98BADCFE;
  var d = 0x10325476;

  var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (var k = 0; k < x.length; k += 16) {
    var AA = a;
    var BB = b;
    var CC = c;
    var DD = d;

    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);

    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);

    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x04881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);

    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);

    a = AU(a, AA);
    b = AU(b, BB);
    c = AU(c, CC);
    d = AU(d, DD);
  }

  return (W2H(a) + W2H(b) + W2H(c) + W2H(d)).toLowerCase();
}

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

function intArg(args, key, fallback, min, max) {
  const n = parseInt(String(args[key] ?? ""), 10);

  if (!Number.isFinite(n)) return fallback;
  if (typeof min === "number" && n < min) return min;
  if (typeof max === "number" && n > max) return max;

  return n;
}

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  $persistentStore.write(JSON.stringify(store), STORE_KEY);
}

function pick(arr, seed) {
  return arr[Math.abs(seed || 0) % arr.length];
}

function buildUA(base, seed) {
  const iv = pick(IOS_VER, seed || 0);
  const mo = pick(MODELS, (seed || 0) + 2);

  if (base && typeof base === "string") {
    let ua = base;
    ua = ua.replace(/iOS \d+(\.\d+){0,2}/, "iOS " + iv);
    ua = ua.replace(/iPhone\d+,\d+/, mo);
    return ua;
  }

  return "WeTalk/30.6.0 (com.innovationworks.wetalk; build:28; iOS " + iv + ") Alamofire/5.4.3";
}

function getUTCSignDate() {
  const n = new Date();
  const pad = x => String(x).padStart(2, "0");

  return (
    n.getUTCFullYear() +
    "-" +
    pad(n.getUTCMonth() + 1) +
    "-" +
    pad(n.getUTCDate()) +
    " " +
    pad(n.getUTCHours()) +
    ":" +
    pad(n.getUTCMinutes()) +
    ":" +
    pad(n.getUTCSeconds())
  );
}

function signedParams(capture) {
  const p = {};

  Object.keys(capture.paramsRaw || {}).forEach(k => {
    if (k !== "sign" && k !== "signDate") {
      p[k] = capture.paramsRaw[k];
    }
  });

  p.signDate = getUTCSignDate();

  const base = Object.keys(p)
    .sort()
    .map(k => k + "=" + p[k])
    .join("&");

  p.sign = MD5(base + SECRET);

  return p;
}

function buildHeaders(acc) {
  const headers = Object.assign({}, acc.capture.headers || {});
  const ua = buildUA(acc.baseUA, acc.uaSeed || 0);

  Object.keys(headers).forEach(key => {
    const lower = key.toLowerCase();

    if (
      lower === "content-length" ||
      lower === "host" ||
      lower === "user-agent" ||
      key.startsWith(":")
    ) {
      delete headers[key];
    }
  });

  headers["Host"] = API_HOST;
  headers["User-Agent"] = ua;
  headers["Accept"] = headers["Accept"] || headers["accept"] || "application/json";

  return headers;
}

function buildUrl(path, capture) {
  const p = signedParams(capture);
  const original = capture.paramsRaw || {};

  const qs = Object.keys(p)
    .map(k => {
      if (
        Object.prototype.hasOwnProperty.call(original, k) &&
        k !== "sign" &&
        k !== "signDate"
      ) {
        return encodeURIComponent(k) + "=" + p[k];
      }

      return encodeURIComponent(k) + "=" + encodeURIComponent(p[k]);
    })
    .join("&");

  return "https://" + API_HOST + "/app/" + path + "?" + qs;
}

function httpGetJSON(options) {
  return new Promise((resolve, reject) => {
    $httpClient.get(options, (error, response, data) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({
          retcode: -1,
          retmsg: "响应不是 JSON：" + String(data || "").slice(0, 120)
        });
      }
    });
  });
}

async function api(acc, path) {
  const url = buildUrl(path, acc.capture);
  const headers = buildHeaders(acc);

  return await httpGetJSON({
    url,
    headers,
    timeout: 15
  });
}

function splitList(value) {
  return String(value || "")
    .split(/[\n,，;；\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function matchAccountIds(store, tokens) {
  const allIds = (store.order || []).filter(
    id => store.accounts && store.accounts[id] && store.accounts[id].capture
  );

  if (!tokens.length) {
    return allIds;
  }

  const result = new Set();

  tokens.forEach(tokenRaw => {
    const token = String(tokenRaw || "").trim().toLowerCase();

    if (!token) return;

    if (/^\d+$/.test(token)) {
      const index = Number(token);

      if (index >= 1 && index <= allIds.length) {
        result.add(allIds[index - 1]);
        return;
      }
    }

    allIds.forEach(id => {
      const acc = store.accounts[id];

      const candidates = [id, acc.id, acc.email, acc.alias]
        .filter(Boolean)
        .map(v => String(v).trim().toLowerCase());

      if (candidates.includes(token)) {
        result.add(id);
      }
    });
  });

  return Array.from(result);
}

async function runAccount(acc, idx, total, opts) {
  const label = "[" + (idx + 1) + "/" + total + " " + (acc.alias || acc.email || acc.id) + "]";
  const logArr = [label];

  console.log(label + " 开始处理...");

  try {
    const balance = await api(acc, "queryBalanceAndBonus");

    if (balance.retcode === 0) {
      logArr.push("[余额] " + (balance.result && balance.result.balance !== undefined ? balance.result.balance : "?") + " Coins");
    } else {
      logArr.push("[查询] " + (balance.retmsg || "失败"));
    }
  } catch (e) {
    logArr.push("[查询异常] " + (e.message || String(e)));
  }

  if (opts.enableCheckin) {
    try {
      const d = await api(acc, "checkIn");
      const msg = d.retcode === 0
        ? (d.result && d.result.bonusHint ? d.result.bonusHint : "成功")
        : (d.retmsg || "失败");

      logArr.push("[签到] " + msg);
      console.log(label + " [签到] " + msg);
    } catch (e) {
      logArr.push("[签到异常] " + (e.message || String(e)));
    }
  } else {
    logArr.push("[签到] 已关闭");
  }

  if (opts.enableVideo) {
    for (let i = 1; i <= opts.maxVideo; i++) {
      await sleep(i === 1 ? 1000 : opts.videoDelay);

      try {
        const d = await api(acc, "videoBonus");

        if (d.retcode === 0) {
          const bonus = d.result && d.result.bonus !== undefined ? d.result.bonus : "?";
          logArr.push("[视频" + i + "] +" + bonus);
          console.log(label + " [视频" + i + "] +" + bonus);
        } else {
          logArr.push("[视频" + i + "] " + (d.retmsg || "停止"));
          break;
        }
      } catch (e) {
        logArr.push("[视频" + i + "异常] " + (e.message || String(e)));
        break;
      }
    }
  } else {
    logArr.push("[视频奖励] 已关闭");
  }

  try {
    const latest = await api(acc, "queryBalanceAndBonus");

    if (latest.retcode === 0) {
      logArr.push("[最新余额] " + (latest.result && latest.result.balance !== undefined ? latest.result.balance : "?") + " Coins");
    }
  } catch {}

  return logArr.join("\n");
}

async function main() {
  console.log("[WeTalk Task] 任务启动...");

  const args = parseArgument();

  if (!boolArg(args, "TASK_ENABLED", true)) {
    notify("任务已关闭", "TASK_ENABLED=false，定时任务未执行。");
    return;
  }

  const store = loadStore();

  if (!store || !store.order || !store.order.length) {
    console.log("[WeTalk Task] 未发现已存储的账号");
    notify("无可用账号", "请先启用 MitM，然后打开 WeTalk 触发 queryBalanceAndBonus 请求。");
    return;
  }

  const opts = {
    enableCheckin: boolArg(args, "ENABLE_CHECKIN", true),
    enableVideo: boolArg(args, "ENABLE_VIDEO", true),
    maxVideo: intArg(args, "MAX_VIDEO", 5, 1, 10),
    videoDelay: intArg(args, "VIDEO_DELAY_MS", 8000, 1000, 60000),
    accountGap: intArg(args, "ACCOUNT_GAP_MS", 3500, 0, 120000)
  };

  const runTokens = splitList(args.RUN_ACCOUNTS || "");
  const ids = matchAccountIds(store, runTokens);

  if (!ids.length) {
    notify("未匹配到账号", "RUN_ACCOUNTS 未匹配到已保存账号。留空可运行全部账号。");
    return;
  }

  const results = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const acc = store.accounts[id];

    results.push(await runAccount(acc, i, ids.length, opts));

    if (i < ids.length - 1) {
      await sleep(opts.accountGap);
    }
  }

  saveStore(store);

  console.log("[WeTalk Task] 任务完成。");

  notify(
    "任务完成（" + ids.length + "个账号）",
    results.join("\n---\n").slice(0, 4000)
  );
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.log("[WeTalk Task] 异常：" + (e.message || String(e)));
    notify("任务异常", e.message || String(e));
  } finally {
    $done();
  }
})();
