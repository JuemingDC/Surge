// WeTalk_Task.js
// Surge only
// type=cron

const SCRIPT_NAME = "WeTalk";
const STORE_KEY = "wetalk_accounts_v1";
const API_HOST = "api.wetalkapp.com";
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";

const MAX_VIDEO_COUNT = 5;
const VIDEO_INTERVAL_MS = 8000;
const ACCOUNT_INTERVAL_MS = 3500;

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function done() {
  $done();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function httpGet(options) {
  return new Promise((resolve, reject) => {
    $httpClient.get(options, function (error, response, data) {
      if (error) {
        reject(error);
      } else {
        resolve({
          response: response,
          body: data
        });
      }
    });
  });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getUTCSignDate() {
  const now = new Date();
  return (
    now.getUTCFullYear() + "-" +
    pad2(now.getUTCMonth() + 1) + "-" +
    pad2(now.getUTCDate()) + " " +
    pad2(now.getUTCHours()) + ":" +
    pad2(now.getUTCMinutes()) + ":" +
    pad2(now.getUTCSeconds())
  );
}

function md5(input) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);

    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;

    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      }
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }

    return lResult ^ lX8 ^ lY8;
  }

  function f(x, y, z) { return (x & y) | ((~x) & z); }
  function g(x, y, z) { return (x & z) | (y & (~z)); }
  function h(x, y, z) { return x ^ y ^ z; }
  function i(x, y, z) { return y ^ (x | (~z)); }

  function ff(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function gg(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function hh(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ii(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str) {
    const messageLength = str.length;
    const numberOfWordsTemp1 = messageLength + 8;
    const numberOfWordsTemp2 = (numberOfWordsTemp1 - (numberOfWordsTemp1 % 64)) / 64;
    const numberOfWords = (numberOfWordsTemp2 + 1) * 16;
    const wordArray = Array(numberOfWords - 1).fill(0);

    let byteCount = 0;
    while (byteCount < messageLength) {
      const wordCount = (byteCount - (byteCount % 4)) / 4;
      const bytePosition = (byteCount % 4) * 8;
      wordArray[wordCount] |= str.charCodeAt(byteCount) << bytePosition;
      byteCount++;
    }

    const wordCount = (byteCount - (byteCount % 4)) / 4;
    const bytePosition = (byteCount % 4) * 8;
    wordArray[wordCount] |= 0x80 << bytePosition;
    wordArray[numberOfWords - 2] = messageLength << 3;
    wordArray[numberOfWords - 1] = messageLength >>> 29;

    return wordArray;
  }

  function wordToHex(value) {
    let output = "";
    for (let count = 0; count <= 3; count++) {
      const byte = (value >>> (count * 8)) & 255;
      const temp = "0" + byte.toString(16);
      output += temp.substr(temp.length - 2, 2);
    }
    return output;
  }

  const x = convertToWordArray(String(input));
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a;
    const BB = b;
    const CC = c;
    const DD = d;

    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

function buildSignedParams(paramsRaw) {
  const params = {};

  Object.keys(paramsRaw || {}).forEach(key => {
    if (key !== "sign" && key !== "signDate") {
      params[key] = paramsRaw[key];
    }
  });

  params.signDate = getUTCSignDate();

  const signBase = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join("&");

  params.sign = md5(signBase + SECRET);

  return params;
}

function buildQuery(params) {
  return Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
}

function buildHeaders(account) {
  const headers = {};

  Object.keys(account.headers || {}).forEach(key => {
    const lower = key.toLowerCase();

    if (lower === "content-length") return;
    if (lower === "host") return;
    if (lower === "user-agent") return;
    if (key.indexOf(":") === 0) return;

    headers[key] = account.headers[key];
  });

  headers["Host"] = API_HOST;
  headers["User-Agent"] = account.userAgent || "WeTalk/30.6.0";
  headers["Accept"] = headers["Accept"] || "application/json";

  return headers;
}

function buildUrl(path, account) {
  const params = buildSignedParams(account.paramsRaw || {});
  return `https://${API_HOST}/app/${path}?${buildQuery(params)}`;
}

function parseJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch (e) {
    return {};
  }
}

function getBalance(data) {
  return data && data.result && data.result.balance != null ? data.result.balance : "?";
}

function getBonus(data) {
  return data && data.result && data.result.bonus != null ? data.result.bonus : "?";
}

function getMessage(data) {
  if (data && data.result && data.result.bonusHint) return String(data.result.bonusHint).replace(/\n/g, " ");
  if (data && data.retmsg) return data.retmsg;
  return "";
}

async function requestApi(path, account) {
  const options = {
    url: buildUrl(path, account),
    headers: buildHeaders(account),
    timeout: 30,
    "auto-cookie": false
  };

  const result = await httpGet(options);
  return parseJson(result.body);
}

async function runAccount(account, index, total) {
  const name = account.alias || account.email || account.id || `账号${index + 1}`;
  const logs = [`[${index + 1}/${total}] ${name}`];

  try {
    const before = await requestApi("queryBalanceAndBonus", account);
    if (before.retcode === 0) {
      logs.push(`当前余额：${getBalance(before)} Coins`);
    } else {
      logs.push(`余额查询：${before.retmsg || "失败"}`);
    }

    const checkIn = await requestApi("checkIn", account);
    if (checkIn.retcode === 0) {
      logs.push(`签到：${getMessage(checkIn) || "成功"}`);
    } else {
      logs.push(`签到：${checkIn.retmsg || "失败"}`);
    }

    for (let i = 1; i <= MAX_VIDEO_COUNT; i++) {
      if (i > 1) await sleep(VIDEO_INTERVAL_MS);

      const video = await requestApi("videoBonus", account);

      if (video.retcode === 0) {
        logs.push(`视频${i}：+${getBonus(video)} Coins`);
      } else {
        logs.push(`视频${i}：${video.retmsg || "停止"}`);
        break;
      }
    }

    const after = await requestApi("queryBalanceAndBonus", account);
    if (after.retcode === 0) {
      logs.push(`最新余额：${getBalance(after)} Coins`);
    }
  } catch (e) {
    logs.push(`异常：${String(e && e.message ? e.message : e)}`);
  }

  return logs.join("\n");
}

async function main() {
  const store = readStore();
  const ids = store.order.filter(id => store.accounts[id]);

  if (!ids.length) {
    notify("未找到账号", "请先启用 MITM 后打开 WeTalk，触发 queryBalanceAndBonus 完成抓取。");
    done();
    return;
  }

  const results = [];

  for (let i = 0; i < ids.length; i++) {
    const account = store.accounts[ids[i]];
    const text = await runAccount(account, i, ids.length);
    results.push(text);

    if (i < ids.length - 1) {
      await sleep(ACCOUNT_INTERVAL_MS);
    }
  }

  notify(`任务完成：${ids.length} 个账号`, results.join("\n———\n"));
  done();
}

main().catch(e => {
  notify("定时脚本异常", String(e && e.stack ? e.stack : e));
  done();
});
