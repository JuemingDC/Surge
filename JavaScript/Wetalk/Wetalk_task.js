// WeTalk_Task.js
// Surge only
// type=cron

const SCRIPT_NAME = "WeTalk";
const STORE_KEY = "wetalk_accounts_v1";
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";
const API_HOST = "api.wetalkapp.com";

const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;
const ACCOUNT_GAP = 3500;

const IOS_VERSIONS = ["17.5.1", "17.6.1", "17.4.1", "17.2.1", "16.7.8", "17.6", "17.3.1", "18.0.1", "17.1.2", "16.6.1"];
const IOS_SCALES = ["2.00", "3.00", "3.00", "2.00", "3.00"];
const IPHONE_MODELS = ["iPhone14,3", "iPhone13,3", "iPhone15,3", "iPhone16,1", "iPhone14,7", "iPhone13,2", "iPhone15,2", "iPhone12,1"];
const CFN_VERS = ["1410.0.3", "1494.0.7", "1568.100.1", "1209.1", "1474.0.4", "1568.200.2"];
const DARWIN_VERS = ["22.6.0", "23.5.0", "23.6.0", "24.0.0", "22.4.0"];

function notify(subtitle, body) {
  $notification.post(SCRIPT_NAME, subtitle || "", body || "");
}

function finish() {
  $done();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function httpGet(options) {
  return new Promise((resolve, reject) => {
    $httpClient.get(options, function (error, response, data) {
      if (error) reject(error);
      else resolve({ response: response, body: data });
    });
  });
}

function MD5(string) {
  function RotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function AddUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);

    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;

    if (lX4 | lY4) {
      return (lResult & 0x40000000)
        ? (lResult ^ 0xc0000000 ^ lX8 ^ lY8)
        : (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    }

    return lResult ^ lX8 ^ lY8;
  }

  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | (~z)); }

  function FF(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function GG(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function HH(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function II(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function ConvertToWordArray(str) {
    const lMessageLength = str.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1).fill(0);

    let lBytePosition = 0;
    let lByteCount = 0;

    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] |= str.charCodeAt(lByteCount) << lBytePosition;
      lByteCount++;
    }

    const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] |= 0x80 << lBytePosition;
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;

    return lWordArray;
  }

  function WordToHex(lValue) {
    let WordToHexValue = "";
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const WordToHexValueTemp = "0" + lByte.toString(16);
      WordToHexValue += WordToHexValueTemp.substr(WordToHexValueTemp.length - 2, 2);
    }
    return WordToHexValue;
  }

  const x = ConvertToWordArray(String(string));
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;

    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = AddUnsigned(a, AA);
    b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC);
    d = AddUnsigned(d, DD);
  }

  return (WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d)).toLowerCase();
}

function getUTCSignDate() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function pickItem(arr, seed) {
  return arr[Math.abs(seed || 0) % arr.length];
}

function buildUA(baseUA, seed) {
  const iosVer = pickItem(IOS_VERSIONS, seed);
  const scale = pickItem(IOS_SCALES, seed + 1);
  const model = pickItem(IPHONE_MODELS, seed + 2);
  const cfn = pickItem(CFN_VERS, seed + 3);
  const darwin = pickItem(DARWIN_VERS, seed + 4);

  if (baseUA && typeof baseUA === "string") {
    let ua = baseUA;
    let changed = false;

    if (/iOS \d+(\.\d+){0,2}/.test(ua)) {
      ua = ua.replace(/iOS \d+(\.\d+){0,2}/, `iOS ${iosVer}`);
      changed = true;
    }

    if (/Scale\/\d+(\.\d+)?/.test(ua)) {
      ua = ua.replace(/Scale\/\d+(\.\d+)?/, `Scale/${scale}`);
      changed = true;
    }

    if (/iPhone\d+,\d+/.test(ua)) {
      ua = ua.replace(/iPhone\d+,\d+/, model);
      changed = true;
    }

    if (/CFNetwork\/[\d.]+/.test(ua)) {
      ua = ua.replace(/CFNetwork\/[\d.]+/, `CFNetwork/${cfn}`);
      changed = true;
    }

    if (/Darwin\/[\d.]+/.test(ua)) {
      ua = ua.replace(/Darwin\/[\d.]+/, `Darwin/${darwin}`);
      changed = true;
    }

    if (changed) return ua;
  }

  return `WeTalk/30.6.0 (com.innovationworks.wetalk; build:28; iOS ${iosVer}) Alamofire/5.4.3`;
}

function buildSignedParamsRaw(capture) {
  const params = {};

  Object.keys(capture.paramsRaw || {}).forEach(k => {
    if (k !== "sign" && k !== "signDate") {
      params[k] = capture.paramsRaw[k];
    }
  });

  params.signDate = getUTCSignDate();

  const signBase = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join("&");

  params.sign = MD5(signBase + SECRET);

  return params;
}

function buildUrl(path, capture) {
  const params = buildSignedParamsRaw(capture);

  const qs = Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join("&");

  return `https://${API_HOST}/app/${path}?${qs}`;
}

function buildHeaders(capture, ua) {
  const headers = {};

  Object.keys(capture.headers || {}).forEach(k => {
    const lower = k.toLowerCase();

    if (lower === "content-length") return;
    if (lower === "host") return;
    if (lower === "user-agent") return;
    if (k.indexOf(":") === 0) return;

    headers[k] = capture.headers[k];
  });

  headers["Host"] = API_HOST;
  headers["Accept"] = headers["Accept"] || "application/json";
  headers["User-Agent"] = ua;

  return headers;
}

function parseJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch (e) {
    return {};
  }
}

function getBalance(d) {
  return d && d.result && d.result.balance != null ? d.result.balance : "?";
}

function getBonus(d) {
  return d && d.result && d.result.bonus != null ? d.result.bonus : "?";
}

function getBonusHint(d) {
  if (d && d.result && d.result.bonusHint) return String(d.result.bonusHint).replace(/\n/g, " ");
  if (d && d.retmsg) return d.retmsg;
  return "";
}

async function fetchApi(path, acc) {
  const ua = buildUA(acc.baseUA, acc.uaSeed || 0);
  const options = {
    url: buildUrl(path, acc.capture),
    headers: buildHeaders(acc.capture, ua),
    timeout: 30,
    "auto-cookie": false
  };

  const res = await httpGet(options);
  return parseJson(res.body);
}

async function runAccount(acc, index, total) {
  const tag = `[${index + 1}/${total}] ${acc.alias || acc.email || acc.id}`;
  const msgs = [tag];

  try {
    const before = await fetchApi("queryBalanceAndBonus", acc);
    if (before.retcode === 0) {
      msgs.push(`余额：${getBalance(before)} Coins`);
    } else {
      msgs.push(`查询：${before.retmsg || "失败"}`);
    }

    const checkIn = await fetchApi("checkIn", acc);
    if (checkIn.retcode === 0) {
      msgs.push(`签到：${getBonusHint(checkIn) || "成功"}`);
    } else {
      msgs.push(`签到：${checkIn.retmsg || "失败"}`);
    }

    for (let i = 1; i <= MAX_VIDEO; i++) {
      if (i > 1) await sleep(VIDEO_DELAY);

      const video = await fetchApi("videoBonus", acc);
      if (video.retcode === 0) {
        msgs.push(`视频${i}：+${getBonus(video)} Coins`);
      } else {
        msgs.push(`视频${i}：${video.retmsg || "停止"}`);
        break;
      }
    }

    const after = await fetchApi("queryBalanceAndBonus", acc);
    if (after.retcode === 0) {
      msgs.push(`最新余额：${getBalance(after)} Coins`);
    }
  } catch (e) {
    msgs.push(`异常：${String(e && e.message ? e.message : e)}`);
  }

  return msgs.join("\n");
}

async function main() {
  const store = readStore();

  // 清理旧版错误 fp_ 账号
  Object.keys(store.accounts || {}).forEach(id => {
    if (/^fp_[a-f0-9]+$/i.test(id)) {
      delete store.accounts[id];
    }
  });

  store.order = (store.order || []).filter(id => {
    const acc = store.accounts[id];
    if (!acc) return false;
    if (/^fp_[a-f0-9]+$/i.test(id)) return false;
    if (!acc.email) return false;
    if (!acc.capture || !acc.capture.paramsRaw || !acc.capture.headers) return false;
    return true;
  });

  writeStore(store);

  if (!store.order.length) {
    notify("未找到有效账号", "旧 fp_ 账号已清理。请重新打开 WeTalk，触发 queryBalanceAndBonus 完成抓取。");
    finish();
    return;
  }

  const results = [];

  for (let i = 0; i < store.order.length; i++) {
    const id = store.order[i];
    const text = await runAccount(store.accounts[id], i, store.order.length);
    results.push(text);

    if (i < store.order.length - 1) {
      await sleep(ACCOUNT_GAP);
    }
  }

  notify(`全部完成：${store.order.length} 个账号`, results.join("\n———\n"));
  finish();
}

main().catch(e => {
  notify("任务异常", String(e && e.stack ? e.stack : e));
  finish();
});
