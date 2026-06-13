let body = $response.body || "";

const js = `
<script>
(function () {
  function safeDecode(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }

  function getParam(url, key) {
    try {
      const u = new URL(url);
      return u.searchParams.get(key);
    } catch (e) {
      const reg = new RegExp("[?&]" + key + "=([^&]+)");
      const m = String(url).match(reg);
      return m ? m[1] : null;
    }
  }

  function extractSourceUrl(href) {
    if (!href) return null;

    href = String(href).trim();

    if (href.startsWith("loon://")) {
      return getParam(href, "plugin");
    }

    if (href.startsWith("surge://")) {
      return getParam(href, "url");
    }

    if (/^https?:\\/\\//i.test(href) && /\\.(plugin|sgmodule)(\\?|#|$)/i.test(href)) {
      return href;
    }

    const m = href.match(/https?:\\/\\/[^"'<>\\s]+?\\.(?:plugin|sgmodule)(?:\\?[^"'<>\\s]*)?/i);
    return m ? m[0] : null;
  }

  function toScriptHubSurgeModule(sourceUrl) {
    if (!sourceUrl) return null;

    sourceUrl = safeDecode(sourceUrl);

    return "https://script.hub/file/_start_/" +
      encodeURIComponent(sourceUrl) +
      "?type=surge-module";
  }

  function patchLink(a) {
    if (!a || !a.getAttribute) return;

    const href = a.getAttribute("href");
    const sourceUrl = extractSourceUrl(href);
    const surgeModuleUrl = toScriptHubSurgeModule(sourceUrl);

    if (!surgeModuleUrl) return;

    a.setAttribute("href", surgeModuleUrl);
    a.setAttribute("target", "_self");
    a.dataset.surgeScripthub = "1";

    const text = (a.textContent || "").trim();
    if (text && /Loon|插件|导入|安装|配置/.test(text)) {
      a.textContent = text
        .replace(/Loon/gi, "Surge")
        .replace(/插件/g, "模块")
        .replace(/配置/g, "模块") + " · ScriptHub";
    }
  }

  function patchAll() {
    document.querySelectorAll("a[href]").forEach(patchLink);
  }

  patchAll();

  new MutationObserver(patchAll).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener("click", function (e) {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;

    const sourceUrl = extractSourceUrl(a.getAttribute("href"));
    const surgeModuleUrl = toScriptHubSurgeModule(sourceUrl);

    if (!surgeModuleUrl) return;

    e.preventDefault();
    e.stopPropagation();
    location.href = surgeModuleUrl;
  }, true);
})();
</script>
`;

if (body.includes("</body>")) {
  body = body.replace("</body>", js + "</body>");
} else {
  body += js;
}

$done({ body });
