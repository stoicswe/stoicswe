(function () {
    if (typeof document === "undefined" || typeof history === "undefined") return;
    if (!("pushState" in history)) return;

    var ASSET_RE = /\.(jpg|jpeg|png|gif|webp|svg|ico|pdf|zip|gz|mp3|mp4|mov|css|js|xml|json|txt)(\?|#|$)/i;

    function shouldIntercept(a, e) {
        if (!a) return false;
        if (e.defaultPrevented) return false;
        if (e.button !== 0) return false;
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return false;
        if (a.target && a.target !== "" && a.target !== "_self") return false;
        if (a.hasAttribute("download")) return false;
        if (a.hasAttribute("data-no-spa")) return false;
        var rel = (a.getAttribute("rel") || "").toLowerCase();
        if (rel.indexOf("external") !== -1) return false;
        var href = a.getAttribute("href");
        if (!href) return false;
        if (href.charAt(0) === "#") return false;
        if (/^(mailto|tel|sms|javascript|file|data):/i.test(href)) return false;
        var url;
        try { url = new URL(a.href, location.href); } catch (_) { return false; }
        if (url.origin !== location.origin) return false;
        if (ASSET_RE.test(url.pathname)) return false;
        if (url.pathname === location.pathname && url.search === location.search) {
            // Same page, just a hash — let browser handle anchor scroll.
            return false;
        }
        return true;
    }

    function findMain(doc) {
        return doc.getElementById("main") || doc.querySelector("main");
    }

    function navigate(url, isPop) {
        // Show a thin top progress hint via document.title — keeps UI minimal
        // since we don't have a global progress bar component.
        fetch(url, { credentials: "same-origin", headers: { "X-Soft-Nav": "1" } })
            .then(function (r) {
                var ct = r.headers.get("content-type") || "";
                if (!r.ok || ct.indexOf("text/html") === -1) {
                    throw new Error("non-html response");
                }
                return r.text();
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, "text/html");
                var newMain = findMain(doc);
                var oldMain = findMain(document);
                if (!newMain || !oldMain) throw new Error("no #main element");

                // Replace main content. The Music window, dock, masthead, and
                // clock all live outside #main, so they stay mounted — and
                // the YouTube iframe keeps playing.
                oldMain.parentNode.replaceChild(newMain, oldMain);

                var newTitle = doc.querySelector("title");
                if (newTitle) document.title = newTitle.textContent;

                if (!isPop) history.pushState({ stoicSpa: 1 }, "", url);
                window.scrollTo(0, 0);

                document.dispatchEvent(new CustomEvent("spa:navigated", { detail: { url: url } }));
            })
            .catch(function () {
                // Anything went wrong — fall back to a hard navigation.
                location.href = url;
            });
    }

    document.addEventListener("click", function (e) {
        var t = e.target;
        var a = t && t.closest ? t.closest("a") : null;
        if (!shouldIntercept(a, e)) return;
        e.preventDefault();
        navigate(a.href, false);
    });

    window.addEventListener("popstate", function () {
        navigate(location.href, true);
    });

    // Replace initial state so popstate has somewhere to land if the user
    // navigates SPA-style and then hits Back.
    if (!history.state || !history.state.stoicSpa) {
        try { history.replaceState({ stoicSpa: 1 }, "", location.href); } catch (_) {}
    }
})();
