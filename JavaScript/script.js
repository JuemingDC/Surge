let body = $response.body || "";

const inject = `
<script>
(function () {
  function decodeMaybe(s) {
    try { return decodeURIComponent(s); } catch (e) { return s; }
  }

  function toSurgeViaScriptHub(rawUrl) {
    if (!rawUrl) return null;
    rawUrl = decodeMaybe(rawUrl);

    const scriptHubUrl =
      "https://script.hub/file/_start_/" +
      encodeURIComponent(rawUrl) +
      "?type=surge-module";

    return "surge:///install-config?url=" + encodeURIComponent(scriptHubUrl);
  }

  function extractPluginUrl(href) {
    if (!href) return null;

    if (href.startsWith("loon://")) {
      const m = href.match(/[?&]plugin=([^&]+)/);
      return m ? m[1] : null;
    }

    if (href.includes(".plugin")) {
      const m = href.match(/https?[^"'& ]+?\\.plugin/);
      return m ? m[0] : null;
    }

    return null;
  }

  function patchLinks() {
    document.querySelectorAll("a[href]").forEach(a => {
      const pluginUrl = extractPluginUrl(a.getAttribute("href"));
      const surgeUrl = toSurgeViaScriptHub(pluginUrl);
      if (!surgeUrl) return;

      a.setAttribute("href", surgeUrl);
      a.dataset.surgeScripthub = "1";

      const text = (a.textContent || "").trim();
      if (/Loon|插件|导入/.test(text)) {
        a.textContent = text.replace(/Loon/g, "Surge") + " · ScriptHub转换";
      }
    });
  }

  patchLinks();
  new MutationObserver(patchLinks).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener("click", function (e) {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;

    const pluginUrl = extractPluginUrl(a.getAttribute("href"));
    const surgeUrl = toSurgeViaScriptHub(pluginUrl);
    if (!surgeUrl) return;

    e.preventDefault();
    location.href = surgeUrl;
  }, true);
})();
</script>
`;

body = body.replace("</body>", inject + "</body>");
$done({ body });
