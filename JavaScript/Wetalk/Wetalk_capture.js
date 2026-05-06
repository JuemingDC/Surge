// WeTalk_Capture.js
// 2026/04/27
/*
@Name：WeTalk 自动化签到+视频奖励
@Author：TG@ZenMoFiShi

[Script]
WeTalk获取账号 = type=http-request,pattern=^https:\/\/api\.wetalkapp\.com\/app\/queryBalanceAndBonus,script-path=WeTalk_Capture.js,requires-body=false,timeout=30

[MITM]
hostname = %APPEND% api.wetalkapp.com
*/

const scriptName = 'WeTalk';
const storeKey = 'wetalk_accounts_v1';

function normalizeHeaderNameMap(headers) {
  const out = {};
  Object.keys(headers || {}).forEach(k => {
    out[k] = headers[k];
  });
  return out;
}

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

function migrateStore(store) {
  if (!store || !store.accounts) return store;

  const newAccounts = {};
  const newOrder = [];
  let migrated = false;

  (store.order || Object.keys(store.accounts)).forEach(oldId => {
    const acc = store.accounts[oldId];
    if (!acc) return;

    const email = emailKeyOf(acc.capture && acc.capture.paramsRaw);
    const newId = email || oldId;

    if (newId !== oldId) migrated = true;

    const prev = newAccounts[newId];
    if (!prev || (acc.updatedAt || 0) >= (prev.updatedAt || 0)) {
      newAccounts[newId] = Object.assign({}, acc, {
        id: newId,
        alias: acc.alias || email || newId
      });

      if (newOrder.indexOf(newId) < 0) {
        newOrder.push(newId);
      }
    }
  });

  if (migrated) {
    store.accounts = newAccounts;
    store.order = newOrder;
  }

  return store;
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

    return migrateStore(obj);
  } catch (e) {
    return {
      version: 2,
      accounts: {},
      order: []
    };
  }
}

function saveStore(store) {
  $persistentStore.write(JSON.stringify(store), storeKey);
}

function notify(title, body) {
  $notification.post(scriptName, title, body);
}

if (typeof $request !== 'undefined' && $request) {
  const paramsRaw = parseRawQuery($request.url);
  const headersMap = normalizeHeaderNameMap($request.headers || {});

  let baseUA = '';
  Object.keys(headersMap).forEach(k => {
    if (k.toLowerCase() === 'user-agent') {
      baseUA = headersMap[k];
    }
  });

  const email = emailKeyOf(paramsRaw);

  if (!email) {
    notify('⚠️ 抓取失败', '请求里未取到 email 参数，无法识别账号。请确认已登录后再触发抓包。');
    $done({});
  } else {
    const store = loadStore();
    const accId = email;
    const now = Date.now();
    const existed = !!store.accounts[accId];
    const uaSeed = existed ? store.accounts[accId].uaSeed : store.order.length;
    const alias = existed ? (store.accounts[accId].alias || email) : email;

    store.accounts[accId] = {
      id: accId,
      email: email,
      alias: alias,
      uaSeed: uaSeed,
      baseUA: baseUA,
      capture: {
        url: $request.url,
        paramsRaw: paramsRaw,
        headers: headersMap
      },
      createdAt: existed ? store.accounts[accId].createdAt : now,
      updatedAt: now
    };

    if (!existed) {
      store.order.push(accId);
    }

    saveStore(store);

    const total = store.order.length;
    notify(existed ? '账号参数已更新' : '✅ 新账号已入库', `${email}\n当前账号总数：${total}`);
    console.log(`〖${scriptName}〗${existed ? 'update' : 'add'} account ${email}\n${JSON.stringify(store.accounts[accId], null, 2)}`);

    $done({});
  }
} else {
  notify('⚠️ 运行环境错误', '该脚本仅用于 http-request 捕获账号参数。');
  $done({});
}
