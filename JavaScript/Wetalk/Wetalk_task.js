// WeTalk_task.js for Surge
// 用途：定时执行签到与视频奖励任务
// 参数：RUN_ACCOUNTS 留空运行全部；可填编号、邮箱、账号ID或别名，多个用逗号/分号/换行分隔。

const scriptName = "WeTalk";
const storeKey = "wetalk_accounts_v1";

const SECRET = "0fOiukQq7jXZV2GRi9LGlO";
const API_HOST = "api.wetalkapp.com";

const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;
const ACCOUNT_GAP = 3500;

const IOS_VERSIONS = [
  "17.5.1",
  "17.6.1",
  "17.4.1",
  "17.2.1",
  "16.7.8",
  "17.6",
  "17.3.1",
  "18.0.1",
  "17.1.2",
  "16.6.1"
];

const IOS_SCALES = ["2.00", "3.00", "3.00", "2.00", "3.00"];

const IPHONE_MODELS = [
  "iPhone14,3",
  "iPhone13,3",
  "iPhone15,3",
  "iPhone16,1",
  "iPhone14,7",
  "iPhone13,2",
  "iPhone15,2",
  "iPhone12,1"
];

const CFN_VERS = [
  "1410.0.3",
  "1494.0.7",
  "1568.100.1",
  "1209.1",
  "1474.0.4",
  "1568.200.2"
];

const DARWIN_VERS = [
  "22.6.0",
  "23.5.0",
  "23.6.0",
  "24.0.0",
  "22.4.0"
];

function md5(input) {
  function cmn(q, a, b, x, s, t) {
    return add32(rotl(add32(add32(a, q), add32(x, t)), s), b);
  }

  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function rotl(x, c) {
    return (x << c) | (x >>> (32 - c));
  }

  function add32(a, b) {
    return (a + b) & 0xffffffff;
  }

  function md5blk(s) {
    const md5blks = [];

    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }

    return md5blks;
  }

  function md51(s) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];

    let i;

    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }

    s = s.substring(i - 64);

    let tail = new Array(16).fill(0);

    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }

    tail[i >> 2] |= 0x80 << ((i % 4) << 3);

    if (i > 55) {
      md5cycle(state, tail);
      tail = new Array(16).fill(0);
    }

    const tmp = n * 8;
    tail[14] = tmp & 0xffffffff;
    tail[15] = (tmp / 0x100000000) | 0;

    md5cycle(state, tail);

    return state;
  }

  function md5cycle(x, k) {
    let a = x[0];
    let b = x[1];
    let c = x[2];
    let d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);

    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);

    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);

    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);

    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);

    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);

    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);

    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);

    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);

    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);

    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);

    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);

    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function rhex(n) {
    let s = "";

    for (let j = 0; j < 4; j++) {
      s += ("0" + ((n >> (j * 8)) & 255).toString(16)).slice(-2);
    }

    return s;
  }

  return md51(String(input)).map(rhex).join("");
}

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

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

function getUTCSignDate() {
  const now = new Date();

  return now.getUTCFullYear() + "-" +
    pad2(now.getUTCMonth() + 1) + "-" +
    pad2(now.getUTCDate()) + " " +
    pad2(now.getUTCHours()) + ":" +
    pad2(now.getUTCMinutes()) + ":" +
    pad2(now.getUTCSeconds());
}

function safeDecode(value) {
  if (value == null) return "";

  try {
    return decodeURIComponent(String(value));
  } catch (e) {
    return String(value);
  }
}

function emailKeyOf(paramsRaw) {
  const raw = paramsRaw && paramsRaw.email;
  return raw ? safeDecode(raw).trim().toLowerCase() : "";
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

function pick(arr, seed) {
  return arr[Math.abs(seed || 0) % arr.length];
}

function buildUA(baseUA, seed) {
  const iosVer = pick(IOS_VERSIONS, seed);
  const scale = pick(IOS_SCALES, seed + 1);
  const model = pick(IPHONE_MODELS, seed + 2);
  const cfn = pick(CFN_VERS, seed + 3);
  const darwin = pick(DARWIN_VERS, seed + 4);

  if (baseUA && typeof baseUA === "string") {
    let ua = baseUA;
    let changed = false;

    const replacements = [
      [/iOS \d+(\.\d+){0,2}/, "iOS " + iosVer],
      [/Scale\/\d+(\.\d+)?/, "Scale/" + scale],
      [/iPhone\d+,\d+/, model],
      [/CFNetwork\/[\d.]+/, "CFNetwork/" + cfn],
      [/Darwin\/[\d.]+/, "Darwin/" + darwin]
    ];

    replacements.forEach(function (r) {
      if (r[0].test(ua)) {
        ua = ua.replace(r[0], r[1]);
        changed = true;
      }
    });

    if (changed) return ua;
  }

  return "WeTalk/30.6.0 (com.innovationworks.wetalk; build:28; iOS " + iosVer + ") Alamofire/5.4.3";
}

function buildSignedParamsRaw(capture) {
  const params = {};

  Object.keys((capture && capture.paramsRaw) || {}).forEach(function (key) {
    if (key !== "sign" && key !== "signDate") {
      params[key] = capture.paramsRaw[key];
    }
  });

  params.signDate = getUTCSignDate();

  const signBase = Object.keys(params)
    .sort()
    .map(function (key) {
      return key + "=" + params[key];
    })
    .join("&");

  params.sign = md5(signBase + SECRET);

  return params;
}

function buildUrl(path, capture) {
  const params = buildSignedParamsRaw(capture);

  const query = Object.keys(params)
    .map(function (key) {
      return key + "=" + encodeURIComponent(params[key]);
    })
    .join("&");

  return "https://" + API_HOST + "/app/" + path + "?" + query;
}

function buildHeaders(capture, ua) {
  const headers = {};

  Object.keys((capture && capture.headers) || {}).forEach(function (k) {
    const lower = String(k).toLowerCase();

    if (lower !== "content-length" && lower !== "user-agent" && k.charAt(0) !== ":") {
      headers[k] = capture.headers[k];
    }
  });

  headers.Host = API_HOST;
  headers.Accept = headers.Accept || headers.accept || "application/json";
  headers["User-Agent"] = ua;

  return headers;
}

function fetchRequest(options) {
  return new Promise(function (resolve, reject) {
    $httpClient.get(options, function (error, response, data) {
      if (error) {
        reject(error);
      } else {
        resolve({
          statusCode: response && response.status,
          headers: response && response.headers,
          body: data
        });
      }
    });
  });
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function splitList(value) {
  return String(value || "")
    .split(/[\n,，;；]+/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

function matchAccountIds(store, tokens) {
  const allIds = (store.order || []).filter(function (id) {
    const acc = store.accounts[id];
    return acc && acc.capture && acc.capture.paramsRaw;
  });

  if (!tokens.length) return allIds;

  const result = [];

  tokens.forEach(function (tokenRaw) {
    const token = String(tokenRaw || "").trim().toLowerCase();

    if (!token) return;

    if (/^\d+$/.test(token)) {
      const idx = Number(token);
      if (idx >= 1 && idx <= allIds.length && result.indexOf(allIds[idx - 1]) < 0) {
        result.push(allIds[idx - 1]);
      }
      return;
    }

    allIds.forEach(function (id) {
      const acc = store.accounts[id] || {};

      const candidates = [id, acc.id, acc.email, acc.alias]
        .filter(Boolean)
        .map(function (v) {
          return String(v).trim().toLowerCase();
        });

      if (candidates.indexOf(token) >= 0 && result.indexOf(id) < 0) {
        result.push(id);
      }
    });
  });

  return result;
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text || "{}");
  } catch (e) {
    return {
      retcode: -1,
      retmsg: "响应不是 JSON：" + String(text || "").slice(0, 120)
    };
  }
}

function runAccount(acc, index, total) {
  const tag = "[账号" + (index + 1) + "/" + total + " " + (acc.alias || acc.email || acc.id) + "]";
  const ua = buildUA(acc.baseUA, acc.uaSeed || 0);
  const headers = buildHeaders(acc.capture, ua);
  const msgs = [tag];

  function fetchApi(path) {
    return fetchRequest({
      url: buildUrl(path, acc.capture),
      headers: headers,
      timeout: 10
    }).then(function (res) {
      return parseJsonSafe(res.body);
    });
  }

  return fetchApi("queryBalanceAndBonus")
    .then(function (d) {
      if (d.retcode === 0) {
        msgs.push("余额：" + ((d.result && d.result.balance) || "?") + " Coins");
      } else {
        msgs.push("⚠️ 查询：" + (d.retmsg || "失败"));
      }

      return fetchApi("checkIn");
    }, function (err) {
      msgs.push("❌ 查询：" + (err.message || err.error || String(err)));
      return fetchApi("checkIn");
    })
    .then(function (d) {
      if (d.retcode === 0) {
        const hint = String((d.result && d.result.bonusHint) || d.retmsg || "成功").replace(/\n/g, " ");
        msgs.push("✅ 签到：" + hint);
      } else {
        msgs.push("⚠️ 签到：" + (d.retmsg || "失败"));
      }
    }, function (err) {
      msgs.push("❌ 签到：" + (err.message || err.error || String(err)));
    })
    .then(function () {
      let chain = Promise.resolve();

      for (let i = 1; i <= MAX_VIDEO; i++) {
        chain = chain.then(function () {
          return sleep(i === 1 ? 1500 : VIDEO_DELAY).then(function () {
            return fetchApi("videoBonus").then(function (d) {
              if (d.retcode === 0) {
                msgs.push("视频" + i + "：+" + ((d.result && d.result.bonus) || "?") + " Coins");
              } else {
                msgs.push("⏸ 视频" + i + "：" + (d.retmsg || "停止"));
                throw new Error("__STOP_VIDEO__");
              }
            });
          });
        });
      }

      return chain.catch(function (err) {
        if (String(err.message || err) !== "__STOP_VIDEO__") {
          msgs.push("❌ 视频：" + (err.message || err.error || String(err)));
        }
      });
    })
    .then(function () {
      return fetchApi("queryBalanceAndBonus").then(function (d) {
        if (d.retcode === 0) {
          msgs.push("最新余额：" + ((d.result && d.result.balance) || "?") + " Coins");
        }
      }, function () {});
    })
    .then(function () {
      return msgs.join("\n");
    })
    .catch(function (err) {
      msgs.push("❌ 异常：" + (err.message || err.error || String(err)));
      return msgs.join("\n");
    });
}

(function main() {
  const args = parseArgs(typeof $argument !== "undefined" ? $argument : "");
  const store = loadStore();

  const ids = matchAccountIds(store, splitList(args.RUN_ACCOUNTS || ""));

  if (!ids.length) {
    notify("未抓到任何账号", "请先启用 MitM，打开 WeTalk 并触发 queryBalanceAndBonus 请求。");
    $done();
    return;
  }

  const results = [];

  let chain = Promise.resolve();

  ids.forEach(function (id, idx) {
    chain = chain
      .then(function () {
        return runAccount(store.accounts[id], idx, ids.length);
      })
      .then(function (text) {
        results.push(text);
      })
      .then(function () {
        return idx < ids.length - 1 ? sleep(ACCOUNT_GAP) : null;
      });
  });

  chain.then(function () {
    saveStore(store);
    notify("全部完成（" + ids.length + "个账号）", results.join("\n———\n").slice(0, 4000));
    $done();
  }).catch(function (err) {
    notify("任务异常", results.join("\n———\n") + "\n" + (err.message || err.error || String(err)));
    $done();
  });
})();
