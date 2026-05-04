// WeTalk_Capture.js
// Surge only
// 用途：抓取 WeTalk queryBalanceAndBonus 请求参数并保存

const scriptName = 'WeTalk';
const storeKey = 'wetalk_accounts_v1';

function parseRawQuery(url) {
  const query = (url.split('?')[1] || '').split('#')[0];
  const rawMap = {};

  query.split('&').forEach(pair => {
    if (!pair) return;

    const idx = pair.indexOf('=');
    if (idx < 0) return;

    const k = pair.slice(0, idx);
    const v = pair.slice(idx + 1);
    rawMap[k] = v;
  });

  return rawMap;
}

function safeDecode(v) {
  if (v == null) return '';

  try {
    return decodeURIComponent(String(v));
  } catch (e) {
    return String(v);
  }
}

function emailKeyOf(paramsRaw) {
  const raw = (paramsRaw || {}).email;
  if (!raw) return '';

  return safeDecode(raw).trim().toLowerCase();
}

function loadStore() {
  const raw = $persistentStore.read(storeKey);

  if (!raw) {
    return {
      version: 2,
      accounts: {},
      order: []
    };
  }

  try {
    const obj = JSON.parse(raw);

    if (!obj.accounts) obj.accounts = {};
    if (!Array.isArray(obj.order)) obj.order = Object.keys(obj.accounts);

    return obj;
  } catch (e) {
    return {
      version: 2,
      accounts: {},
      order: []
    };
  }
}

function saveStore(store) {
  return $persistentStore.write(JSON.stringify(store), storeKey);
}

function notify(subtitle, body) {
  $notification.post(scriptName, subtitle || '', body || '');
}

function normalizeHeaders(headers) {
  const out = {};

  Object.keys(headers || {}).forEach(k => {
    out[k] = headers[k];
  });

  return out;
}

function getBaseUA(headers) {
  let ua = '';

  Object.keys(headers || {}).forEach(k => {
    if (k.toLowerCase() === 'user-agent') {
      ua = headers[k];
    }
  });

  return ua;
}

function captureAccount() {
  if (typeof $request === 'undefined' || !$request || !$request.url) {
    notify('抓取失败', '未检测到请求对象。');
    $done({});
    return;
  }

  const paramsRaw = parseRawQuery($request.url);
  const headers = normalizeHeaders($request.headers || {});
  const baseUA = getBaseUA(headers);
  const email = emailKeyOf(paramsRaw);

  if (!email) {
    notify('抓取失败', '请求中未取到 email 参数，请确认已登录 WeTalk 后重新触发。');
    $done({});
    return;
  }

  const store = loadStore();
  const now = Date.now();
  const existed = !!store.accounts[email];

  store.accounts[email] = {
    id: email,
    email,
    alias: existed ? (store.accounts[email].alias || email) : email,
    uaSeed: existed ? (store.accounts[email].uaSeed || 0) : store.order.length,
    baseUA,
    capture: {
      url: $request.url,
      paramsRaw,
      headers
    },
    createdAt: existed ? store.accounts[email].createdAt : now,
    updatedAt: now
  };

  if (!existed) {
    store.order.push(email);
  }

  saveStore(store);

  notify(
    existed ? '账号参数已更新' : '新账号已入库',
    `${email}\n当前账号总数：${store.order.length}`
  );

  console.log(`〖${scriptName}〗${existed ? 'update' : 'add'} account: ${email}`);
  $done({});
}

try {
  captureAccount();
} catch (e) {
  notify('抓取脚本异常', String(e && e.stack ? e.stack : e));
  $done({});
}
