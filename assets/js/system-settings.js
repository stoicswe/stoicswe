(function () {
    if (typeof document === "undefined") return;

    var THEME_KEY = "stoicswe-theme";
    var EFF_URL = "https://ssd.eff.org";
    var win = null;
    var backdrop = null;
    var currentSection = "appearance";
    var dragging = false;
    var dragOffset = { x: 0, y: 0 };
    var customPos = false;
    var ipAbort = null;

    function el(tag, props, kids) {
        var n = document.createElement(tag);
        if (props)
            for (var k in props) {
                if (k === "class") n.className = props[k];
                else if (k === "text") n.textContent = props[k];
                else if (k === "html") n.innerHTML = props[k];
                else if (k === "on") {
                    for (var ev in props.on) n.addEventListener(ev, props.on[ev]);
                } else if (k.indexOf("aria-") === 0 || k === "role" || k === "tabindex" || k === "type") {
                    n.setAttribute(k, props[k]);
                } else n[k] = props[k];
            }
        if (kids) for (var i = 0; i < kids.length; i++) if (kids[i]) n.appendChild(kids[i]);
        return n;
    }

    var ICONS = {
        appearance:
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="currentColor" d="M12 3a9 9 0 0 0 0 18V3z"/></svg>',
        wifi:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none"/></svg>',
        globe:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></svg>',
        gear:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
        shield:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 2L4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    };

    var SECTIONS = [
        { id: "appearance", label: "Appearance", icon: "appearance" },
        { id: "wifi", label: "Wi-Fi", icon: "wifi" },
        { id: "network", label: "Network", icon: "globe" },
        { id: "general", label: "General", icon: "gear" },
        { id: "privacy", label: "Privacy & Security", icon: "shield" },
    ];

    /* ---------- Theme ---------- */
    function getTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || "auto";
        } catch (e) {
            return "auto";
        }
    }
    function setTheme(t) {
        try {
            localStorage.setItem(THEME_KEY, t);
        } catch (e) {}
        applyTheme(t);
    }
    function applyTheme(t) {
        var link =
            document.getElementById("stoicswe-dark-css") ||
            document.querySelector('link[href*="dark.css"]');
        if (!link) return;
        if (t === "dark") link.media = "all";
        else if (t === "light") link.media = "not all";
        else link.media = "(prefers-color-scheme: dark)";
    }

    /* ---------- Critical inline CSS ---------- */
    function injectCSS() {
        if (document.getElementById("settings-critical")) return;
        var s = document.createElement("style");
        s.id = "settings-critical";
        s.textContent = [
            ".settings-backdrop{position:fixed;inset:0;z-index:2500;background:rgba(0,0,0,0.18);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity 160ms ease}",
            ".settings-backdrop.is-open{opacity:1;pointer-events:auto}",
            ".settings-window{position:fixed;top:80px;left:50%;transform:translateX(-50%);width:760px;max-width:calc(100vw - 24px);height:520px;max-height:calc(100vh - 100px);z-index:2600;display:flex;flex-direction:column;background:rgba(246,246,248,0.92);-webkit-backdrop-filter:saturate(180%) blur(40px);backdrop-filter:saturate(180%) blur(40px);border:1px solid rgba(0,0,0,0.08);border-radius:12px;box-shadow:0 1px 0 rgba(255,255,255,0.6) inset,0 30px 70px rgba(0,0,0,0.32),0 8px 18px rgba(0,0,0,0.18);color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',sans-serif;opacity:0;pointer-events:none;transition:opacity 160ms ease,transform 200ms cubic-bezier(0.2,0.7,0.2,1);overflow:hidden}",
            ".settings-window.is-open{opacity:1;pointer-events:auto}",
            ".settings-window.is-positioned{transform:none}",
            "@media(prefers-color-scheme:dark){.settings-window{background:rgba(28,28,32,0.88);color:#f5f5f7;border-color:rgba(255,255,255,0.08);box-shadow:0 1px 0 rgba(255,255,255,0.06) inset,0 30px 70px rgba(0,0,0,0.6),0 8px 18px rgba(0,0,0,0.4)}}",
            ".settings-titlebar{display:flex;align-items:center;height:40px;flex:0 0 40px;padding:0 12px;border-bottom:1px solid rgba(0,0,0,0.08);user-select:none;cursor:grab;position:relative}",
            "@media(prefers-color-scheme:dark){.settings-titlebar{border-bottom-color:rgba(255,255,255,0.08)}}",
            ".settings-titlebar.is-dragging{cursor:grabbing}",
            ".settings-lights{display:flex;gap:8px}",
            ".settings-light{width:12px;height:12px;border-radius:50%;border:0;padding:0;box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.18);cursor:default}",
            ".settings-light--close{background:#ff5f57;cursor:pointer}",
            ".settings-light--min{background:#febc2e}",
            ".settings-light--max{background:#28c840}",
            ".settings-titletext{position:absolute;left:50%;transform:translateX(-50%);font-size:13px;font-weight:600;color:inherit;letter-spacing:-0.005em;pointer-events:none}",
            ".settings-body{display:flex;flex:1;min-height:0}",
            ".settings-sidebar{width:212px;flex:0 0 212px;padding:10px 8px;background:rgba(255,255,255,0.18);border-right:1px solid rgba(0,0,0,0.06);overflow-y:auto}",
            "@media(prefers-color-scheme:dark){.settings-sidebar{background:rgba(0,0,0,0.18);border-right-color:rgba(255,255,255,0.06)}}",
            ".settings-side-item{display:flex;align-items:center;gap:9px;width:100%;padding:6px 9px;margin-bottom:1px;background:transparent;border:0;border-radius:6px;color:inherit;font:inherit;font-size:13px;text-align:left;cursor:pointer}",
            ".settings-side-item:hover{background:rgba(0,0,0,0.05)}",
            "@media(prefers-color-scheme:dark){.settings-side-item:hover{background:rgba(255,255,255,0.06)}}",
            ".settings-side-item.is-active{background:#0071e3;color:#fff}",
            "@media(prefers-color-scheme:dark){.settings-side-item.is-active{background:#0a84ff}}",
            ".settings-side-item__icon{display:inline-flex;width:18px;height:18px;flex:0 0 18px;align-items:center;justify-content:center;color:currentColor}",
            ".settings-side-item__icon svg{width:18px;height:18px}",
            ".settings-content{flex:1;min-width:0;overflow-y:auto;padding:1.6em 1.8em}",
            ".settings-h1{margin:0 0 0.6em;font-size:22px;font-weight:600;letter-spacing:-0.022em}",
            ".settings-h2{margin:1.2em 0 0.5em;font-size:14px;font-weight:600;color:rgba(60,60,67,0.7)}",
            "@media(prefers-color-scheme:dark){.settings-h2{color:rgba(235,235,245,0.6)}}",
            ".settings-card{background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:1em 1.1em;margin-bottom:0.8em}",
            "@media(prefers-color-scheme:dark){.settings-card{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.08)}}",
            ".settings-row{display:flex;align-items:center;justify-content:space-between;padding:0.5em 0;gap:1em;border-bottom:1px solid rgba(0,0,0,0.06)}",
            ".settings-row:last-child{border-bottom:0}",
            "@media(prefers-color-scheme:dark){.settings-row{border-bottom-color:rgba(255,255,255,0.06)}}",
            ".settings-row__label{font-size:13px;color:rgba(60,60,67,0.85)}",
            "@media(prefers-color-scheme:dark){.settings-row__label{color:rgba(235,235,245,0.85)}}",
            ".settings-row__value{font-size:13px;font-family:'SF Mono',ui-monospace,Menlo,Monaco,Consolas,monospace;color:inherit;text-align:right;word-break:break-all}",
            ".settings-segmented{display:inline-flex;gap:14px;flex-wrap:wrap}",
            ".settings-swatch{display:flex;flex-direction:column;align-items:center;gap:6px;background:transparent;border:0;padding:0;cursor:pointer;font:inherit;color:inherit}",
            ".settings-swatch__preview{width:108px;height:64px;border-radius:8px;border:2px solid transparent;box-shadow:0 1px 2px rgba(0,0,0,0.18);overflow:hidden;background:#f5f5f7;display:flex;flex-direction:column}",
            ".settings-swatch__preview span{display:block}",
            ".settings-swatch__preview .bar{height:14px;background:rgba(0,0,0,0.12)}",
            ".settings-swatch__preview .body{flex:1;background:linear-gradient(180deg,#fff,#ebe9ed)}",
            ".settings-swatch--dark .settings-swatch__preview{background:#1c1c1f}",
            ".settings-swatch--dark .settings-swatch__preview .bar{background:rgba(255,255,255,0.16)}",
            ".settings-swatch--dark .settings-swatch__preview .body{background:linear-gradient(180deg,#2a2a2f,#0e0e12)}",
            ".settings-swatch--auto .settings-swatch__preview{background:linear-gradient(135deg,#fff 0%,#fff 50%,#1c1c1f 50%,#1c1c1f 100%)}",
            ".settings-swatch--auto .settings-swatch__preview .bar{background:transparent}",
            ".settings-swatch--auto .settings-swatch__preview .body{background:transparent}",
            ".settings-swatch.is-selected .settings-swatch__preview{border-color:#0071e3}",
            "@media(prefers-color-scheme:dark){.settings-swatch.is-selected .settings-swatch__preview{border-color:#0a84ff}}",
            ".settings-swatch__label{font-size:12px;color:rgba(60,60,67,0.85)}",
            "@media(prefers-color-scheme:dark){.settings-swatch__label{color:rgba(235,235,245,0.85)}}",
            ".settings-status{display:inline-flex;align-items:center;gap:6px;font-size:13px}",
            ".settings-status::before{content:'';width:8px;height:8px;border-radius:50%;background:#34c759;box-shadow:0 0 8px rgba(52,199,89,0.6)}",
            ".settings-disclaimer{font-size:12px;color:rgba(60,60,67,0.7);line-height:1.5;margin:0 0 1em}",
            "@media(prefers-color-scheme:dark){.settings-disclaimer{color:rgba(235,235,245,0.6)}}",
            ".settings-btn{display:inline-flex;align-items:center;gap:7px;padding:0.42em 0.95em;font-size:13px;font-weight:500;font-family:inherit;color:#fff!important;background:#0071e3;border:0;border-radius:7px;cursor:pointer;text-decoration:none!important;line-height:1.3;white-space:nowrap}",
            "@media(prefers-color-scheme:dark){.settings-btn{background:#0a84ff}}",
            ".settings-btn:hover{background:#0077ed;color:#fff!important}",
            ".settings-btn:visited{color:#fff!important}",
            ".settings-btn__label{color:inherit}",
            ".settings-btn__arrow{width:13px;height:13px;display:block;flex-shrink:0;opacity:0.9}",
            ".settings-empty{font-size:13px;color:rgba(60,60,67,0.65);font-style:italic}",
            "@media(prefers-color-scheme:dark){.settings-empty{color:rgba(235,235,245,0.55)}}",
            "@media(max-width:680px){.settings-window{width:100%;max-width:100%;height:100%;max-height:100%;top:0;left:0;transform:none;border-radius:0}.settings-sidebar{width:160px;flex:0 0 160px}}",
        ].join("");
        document.head.appendChild(s);
    }

    /* ---------- Build window ---------- */
    function open() {
        injectCSS();
        applyTheme(getTheme()); // ensure consistent on open
        if (win) {
            win.classList.add("is-open");
            backdrop.classList.add("is-open");
            return;
        }

        // Backdrop catches outside-click but doesn't dim heavily — Sonoma
        // System Settings doesn't darken the desktop.
        backdrop = el("div", {
            class: "settings-backdrop",
            on: {
                mousedown: function (e) {
                    if (e.target === backdrop) close();
                },
            },
        });
        document.body.appendChild(backdrop);

        var lights = el("div", { class: "settings-lights" }, [
            el("button", {
                class: "settings-light settings-light--close",
                type: "button",
                "aria-label": "Close",
                on: { click: close },
            }),
            el("span", { class: "settings-light settings-light--min", "aria-hidden": "true" }),
            el("span", { class: "settings-light settings-light--max", "aria-hidden": "true" }),
        ]);
        var titletext = el("span", { class: "settings-titletext", text: "System Settings" });
        var titlebar = el(
            "div",
            { class: "settings-titlebar", on: { mousedown: startDrag } },
            [lights, titletext]
        );

        var sidebar = el("nav", { class: "settings-sidebar", "aria-label": "Sections" });
        SECTIONS.forEach(function (sec) {
            var btn = el("button", {
                class: "settings-side-item" + (sec.id === currentSection ? " is-active" : ""),
                type: "button",
                "data-section": sec.id,
                on: {
                    click: function () {
                        select(sec.id);
                    },
                },
            });
            btn.innerHTML =
                '<span class="settings-side-item__icon">' + (ICONS[sec.icon] || "") + "</span>" +
                '<span class="settings-side-item__label"></span>';
            btn.querySelector(".settings-side-item__label").textContent = sec.label;
            sidebar.appendChild(btn);
        });

        var content = el("div", { class: "settings-content", id: "settings-content" });

        var body = el("div", { class: "settings-body" }, [sidebar, content]);

        win = el(
            "div",
            { class: "settings-window", role: "dialog", "aria-label": "System Settings" },
            [titlebar, body]
        );
        document.body.appendChild(win);

        requestAnimationFrame(function () {
            win.classList.add("is-open");
            backdrop.classList.add("is-open");
        });

        renderSection();

        document.addEventListener("keydown", onKey);
    }

    function close() {
        if (!win) return;
        if (ipAbort) {
            try {
                ipAbort.abort();
            } catch (e) {}
            ipAbort = null;
        }
        win.classList.remove("is-open");
        backdrop.classList.remove("is-open");
        setTimeout(function () {
            if (win && win.parentNode) win.parentNode.removeChild(win);
            if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            win = null;
            backdrop = null;
            customPos = false;
        }, 200);
        document.removeEventListener("keydown", onKey);
    }

    function onKey(e) {
        if (e.key === "Escape") close();
    }

    function select(id) {
        currentSection = id;
        var items = win.querySelectorAll(".settings-side-item");
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle("is-active", items[i].getAttribute("data-section") === id);
        }
        renderSection();
    }

    /* ---------- Sections ---------- */
    function renderSection() {
        var content = win.querySelector("#settings-content");
        content.innerHTML = "";
        if (currentSection === "appearance") renderAppearance(content);
        else if (currentSection === "wifi") renderNetwork(content, "Wi-Fi");
        else if (currentSection === "network") renderNetwork(content, "Network");
        else if (currentSection === "general") renderGeneral(content);
        else if (currentSection === "privacy") renderPrivacy(content);
    }

    function renderAppearance(c) {
        c.appendChild(el("h1", { class: "settings-h1", text: "Appearance" }));
        c.appendChild(
            el("p", {
                class: "settings-disclaimer",
                text:
                    "Choose how the site looks. Auto follows your operating system's appearance setting.",
            })
        );

        var current = getTheme();
        var modes = [
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
            { id: "auto", label: "Auto" },
        ];

        var row = el("div", { class: "settings-card" }, [
            el(
                "div",
                { class: "settings-segmented" },
                modes.map(function (m) {
                    var btn = el("button", {
                        class:
                            "settings-swatch settings-swatch--" +
                            m.id +
                            (m.id === current ? " is-selected" : ""),
                        type: "button",
                        on: {
                            click: function () {
                                setTheme(m.id);
                                renderSection();
                            },
                        },
                    });
                    btn.innerHTML =
                        '<span class="settings-swatch__preview">' +
                        '<span class="bar"></span><span class="body"></span></span>' +
                        '<span class="settings-swatch__label"></span>';
                    btn.querySelector(".settings-swatch__label").textContent = m.label;
                    return btn;
                })
            ),
        ]);
        c.appendChild(row);
    }

    function buildEFFButton() {
        var a = document.createElement("a");
        a.className = "settings-btn";
        a.href = EFF_URL;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML =
            '<span class="settings-btn__label">EFF Surveillance Self-Defense Guide</span>' +
            '<svg class="settings-btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M14 5h5v5"/><path d="M19 5l-9 9"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>' +
            "</svg>";
        return a;
    }

    function renderNetwork(c, title) {
        c.appendChild(el("h1", { class: "settings-h1", text: title }));

        var statusCard = el("div", { class: "settings-card" }, [
            el("div", { class: "settings-row" }, [
                el("span", { class: "settings-row__label", text: "Status" }),
                el("span", { class: "settings-status", text: "Connected" }),
            ]),
        ]);
        c.appendChild(statusCard);

        c.appendChild(el("h2", { class: "settings-h2", text: "Public IP Addresses" }));

        var v4 = el("span", { class: "settings-row__value", text: "Loading…" });
        var v6 = el("span", { class: "settings-row__value", text: "Loading…" });
        var ipCard = el("div", { class: "settings-card" }, [
            el("div", { class: "settings-row" }, [
                el("span", { class: "settings-row__label", text: "IPv4" }),
                v4,
            ]),
            el("div", { class: "settings-row" }, [
                el("span", { class: "settings-row__label", text: "IPv6" }),
                v6,
            ]),
        ]);
        c.appendChild(ipCard);

        c.appendChild(el("h2", { class: "settings-h2", text: "About this information" }));
        var dis = el("p", {
            class: "settings-disclaimer",
            text:
                "These addresses are publicly visible to every server you connect to and to the network providers between you and them. They can be used to approximate your location, link your activity across sites, and identify your network. None of this is collected by stoicswe.com — the lookups are direct browser requests to api.ipify.org.",
        });
        c.appendChild(dis);

        c.appendChild(
            el("p", {
                class: "settings-disclaimer",
                text:
                    "For more information about how you can protect your privacy, visit EFF's self-defense guide.",
            })
        );

        c.appendChild(buildEFFButton());

        // Fetch IPs
        loadIPs(v4, v6);
    }

    function renderGeneral(c) {
        c.appendChild(el("h1", { class: "settings-h1", text: "General" }));
        c.appendChild(
            el("p", {
                class: "settings-disclaimer",
                text:
                    "Settings panes here are decorative. The website doesn't have anything else worth toggling.",
            })
        );
        c.appendChild(
            el(
                "div",
                { class: "settings-card" },
                [
                    el("div", { class: "settings-row" }, [
                        el("span", { class: "settings-row__label", text: "Site" }),
                        el("span", { class: "settings-row__value", text: "stoicswe.com" }),
                    ]),
                    el("div", { class: "settings-row" }, [
                        el("span", { class: "settings-row__label", text: "Theme engine" }),
                        el("span", { class: "settings-row__value", text: "Sonoma overlay" }),
                    ]),
                ]
            )
        );
    }

    function renderPrivacy(c) {
        c.appendChild(el("h1", { class: "settings-h1", text: "Privacy & Security" }));
        c.appendChild(
            el("p", {
                class: "settings-disclaimer",
                text:
                    "stoicswe.com sets no cookies and runs no analytics. The Wi-Fi / Network panes call api.ipify.org directly from your browser when opened — that's the only third-party request initiated from this site.",
            })
        );
        c.appendChild(buildEFFButton());
    }

    /* ---------- IP fetch ---------- */
    function loadIPs(v4, v6) {
        if (ipAbort) {
            try {
                ipAbort.abort();
            } catch (e) {}
        }
        ipAbort = ("AbortController" in window) ? new AbortController() : null;
        var signal = ipAbort ? ipAbort.signal : undefined;

        fetch("https://api.ipify.org?format=json", { signal: signal })
            .then(function (r) {
                if (!r.ok) throw new Error("http " + r.status);
                return r.json();
            })
            .then(function (d) {
                v4.textContent = d && d.ip ? d.ip : "Not available";
            })
            .catch(function () {
                v4.textContent = "Not available";
            });

        fetch("https://api6.ipify.org?format=json", { signal: signal })
            .then(function (r) {
                if (!r.ok) throw new Error("http " + r.status);
                return r.json();
            })
            .then(function (d) {
                v6.textContent = d && d.ip ? d.ip : "Not available";
            })
            .catch(function () {
                v6.textContent = "Not available (no IPv6 connectivity)";
            });
    }

    /* ---------- Drag ---------- */
    function startDrag(e) {
        // Don't start drag from the close button
        if (e.target.closest(".settings-light--close")) return;
        if (e.button !== 0) return;
        dragging = true;
        var rect = win.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        // On first drag, lock current position so transform can clear cleanly
        if (!customPos) {
            win.style.left = rect.left + "px";
            win.style.top = rect.top + "px";
            win.classList.add("is-positioned");
            customPos = true;
        }
        e.currentTarget.classList.add("is-dragging");
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("mouseup", endDrag);
        e.preventDefault();
    }
    function onDrag(e) {
        if (!dragging || !win) return;
        var x = e.clientX - dragOffset.x;
        var y = e.clientY - dragOffset.y;
        var maxX = window.innerWidth - 60;
        var maxY = window.innerHeight - 40;
        var minX = -(win.offsetWidth - 80);
        var minY = 0;
        if (x < minX) x = minX;
        if (x > maxX) x = maxX;
        if (y < minY) y = minY;
        if (y > maxY) y = maxY;
        win.style.left = x + "px";
        win.style.top = y + "px";
    }
    function endDrag() {
        dragging = false;
        if (win) {
            var bar = win.querySelector(".settings-titlebar");
            if (bar) bar.classList.remove("is-dragging");
        }
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", endDrag);
    }

    /* ---------- Init ---------- */
    // Apply saved theme as early as possible (in case the inline pre-paint
    // script wasn't reached for some reason).
    applyTheme(getTheme());

    window.StoicSweSettings = {
        open: open,
        close: close,
        applyTheme: applyTheme,
        getTheme: getTheme,
    };
})();
