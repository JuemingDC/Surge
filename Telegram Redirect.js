/**
 * Surge: t.me → 第三方 Telegram 客户端重定向
 *
 * 模块参数：
 * argument=CLIENT=Telegram
 */

const SCHEME = {
  Telegram: "tg",
  Swiftgram: "sg",
  Turrit: "turrit",
  iMe: "ime",
  Nicegram: "ng",
  Lingogram: "lingo",
};

function parseArgument(arg) {
  const obj = {};
  if (!arg) return obj;

  arg.split("&").forEach((pair) => {
    const i = pair.indexOf("=");
    if (i < 0) return;

    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();

    if (k) {
      obj[k] = decodeURIComponent(v);
    }
  });

  return obj;
}

function qval(qs, key) {
  if (!qs) return "";

  const re = new RegExp(
    "(?:^|&)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^&]*)"
  );

  const m = qs.match(re);
  return m ? decodeURIComponent(m[1].replace(/\+/g, "%20")) : "";
}

function deeplink(scheme, path, qs) {
  const p = path.split("/").filter(Boolean);
  if (!p[0]) return "";

  // https://t.me/+xxxx
  if (p[0][0] === "+") {
    return `${scheme}://join?invite=${encodeURIComponent(p[0].slice(1))}`;
  }

  // https://t.me/joinchat/xxxx
  if (p[0] === "joinchat" && p[1]) {
    return `${scheme}://join?invite=${encodeURIComponent(p[1])}`;
  }

  // https://t.me/addstickers/xxxx
  if (p[0] === "addstickers" && p[1]) {
    return `${scheme}://addstickers?set=${encodeURIComponent(p[1])}`;
  }

  // https://t.me/share/url?url=xxx&text=xxx
  if (p[0] === "share" && p[1] === "url") {
    return `${scheme}://msg_url?url=${encodeURIComponent(qval(qs, "url"))}&text=${encodeURIComponent(qval(qs, "text"))}`;
  }

  // https://t.me/channel/123
  if (p[1] && /^\d+$/.test(p[1])) {
    return `${scheme}://resolve?domain=${encodeURIComponent(p[0])}&post=${encodeURIComponent(p[1])}`;
  }

  // https://t.me/channel
  return `${scheme}://resolve?domain=${encodeURIComponent(p[0])}`;
}

try {
  const url = $request.url;
  const m = url.match(/^https?:\/\/t\.me\/(.+)$/i);

  if (!m) {
    $done({});
  } else {
    let tail = m[1];

    // https://t.me/s/channel/123 → tg://resolve?domain=channel&post=123
    if (tail.startsWith("s/")) {
      tail = tail.slice(2);
    }

    const qi = tail.indexOf("?");
    const path = qi < 0 ? tail : tail.slice(0, qi);
    const qs = qi < 0 ? "" : tail.slice(qi + 1);

    const args = parseArgument(typeof $argument === "string" ? $argument : "");
    const client = (args.CLIENT || "Telegram").trim();
    const scheme = SCHEME[client] || "tg";

    const loc = deeplink(scheme, path, qs);

    if (!loc) {
      $done({});
    } else {
      $done({
        response: {
          status: 302,
          headers: {
            Location: loc,
            "Cache-Control": "no-store, no-cache",
          },
          body: "",
        },
      });
    }
  }
} catch (e) {
  console.log(`Telegram redirect error: ${e}`);
  $done({});
}
