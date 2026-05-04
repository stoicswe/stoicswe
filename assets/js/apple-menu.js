(function () {
    if (typeof document === "undefined") return;

    var DAEMON = "/assets/images/freebsd.svg";

    function ready(fn) {
        if (document.readyState !== "loading") fn();
        else document.addEventListener("DOMContentLoaded", fn);
    }

    function el(tag, props, children) {
        var node = document.createElement(tag);
        if (props) {
            for (var k in props) {
                if (k === "class") node.className = props[k];
                else if (k === "html") node.innerHTML = props[k];
                else if (k === "text") node.textContent = props[k];
                else if (k === "on") {
                    for (var ev in props.on) node.addEventListener(ev, props.on[ev]);
                } else if (k.indexOf("aria-") === 0 || k === "role" || k === "tabindex") {
                    node.setAttribute(k, props[k]);
                } else {
                    node[k] = props[k];
                }
            }
        }
        if (children) {
            for (var i = 0; i < children.length; i++) {
                if (children[i]) node.appendChild(children[i]);
            }
        }
        return node;
    }

    /* Menu definition. Most items are decorative — only "about" wires up. */
    var MENU = [
        { label: "About This Mac", icon: "monitor", action: "about" },
        { separator: true },
        { label: "System Settings…", icon: "gear", disabled: true },
        { label: "App Store…", icon: "apple", disabled: true },
        { separator: true },
        { label: "Recent Items", icon: "clock", arrow: true, disabled: true },
        { separator: true },
        { label: "Force Quit…", icon: "x-circle", shortcut: "⌥⇧⌘⎋", disabled: true },
        { separator: true },
        { label: "Sleep", icon: "moon", disabled: true },
        { label: "Restart…", icon: "restart", disabled: true },
        { label: "Shut Down…", icon: "power", disabled: true },
        { separator: true },
        { label: "Lock Screen", icon: "lock", shortcut: "⌃⌘Q", disabled: true },
        { label: "Log Out…", icon: "logout", shortcut: "⇧⌘Q", disabled: true },
    ];

    /* Tiny inline SVG icon set (stroke uses currentColor). */
    var ICONS = {
        monitor:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/></svg>',
        gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
        apple: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 13c0-2 1.6-3 1.6-3a3.7 3.7 0 0 0-2.9-1.6c-1.2-.1-2.4.7-3 .7s-1.6-.7-2.7-.7a4 4 0 0 0-3.4 2.1c-1.5 2.5-.4 6.2 1 8.2.7 1 1.6 2.1 2.7 2.1s1.5-.7 2.8-.7 1.7.7 2.8.7 1.9-1 2.6-2a8.7 8.7 0 0 0 1.2-2.4 3.6 3.6 0 0 1-1.7-3.4z"/><path d="M13 5a3 3 0 0 0 .7-2.2A3.1 3.1 0 0 0 11.6 4 3 3 0 0 0 11 6.1 2.6 2.6 0 0 0 13 5z"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
        "x-circle":
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
        moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/></svg>',
        restart:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12a7 7 0 0 1 12-5l2 2"/><path d="M19 4v5h-5"/><path d="M19 12a7 7 0 0 1-12 5l-2-2"/><path d="M5 20v-5h5"/></svg>',
        power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v9"/><path d="M5.5 7.5a8 8 0 1 0 13 0"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>',
    };

    function detectInfo() {
        var ua = navigator.userAgent || "";
        var browser = "Browser";
        var version = "";
        var m;
        if ((m = ua.match(/Firefox\/(\S+)/))) {
            browser = "Firefox";
            version = m[1];
        } else if ((m = ua.match(/Edg\/(\S+)/))) {
            browser = "Edge";
            version = m[1];
        } else if ((m = ua.match(/OPR\/(\S+)/))) {
            browser = "Opera";
            version = m[1];
        } else if ((m = ua.match(/Chrome\/(\S+)/))) {
            browser = "Chrome";
            version = m[1].split(".")[0];
        } else if (ua.indexOf("Safari/") !== -1 && (m = ua.match(/Version\/(\S+)/))) {
            browser = "Safari";
            version = m[1];
        }

        var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "—";
        var os = platform;
        if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
        else if (/Android/.test(ua)) os = "Android";
        else if (/Mac/i.test(platform)) os = "macOS";
        else if (/Win/i.test(platform)) os = "Windows";
        else if (/Linux/i.test(platform)) os = "Linux";
        else if (/FreeBSD/i.test(ua)) os = "FreeBSD";

        var dpr = window.devicePixelRatio || 1;
        var scr = window.screen
            ? window.screen.width + " × " + window.screen.height + " @ " + dpr + "×"
            : "—";
        var vp = window.innerWidth + " × " + window.innerHeight;
        var colorDepth = (window.screen && window.screen.colorDepth) ? window.screen.colorDepth + "-bit" : "—";
        var tz = "—";
        try {
            tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {}
        var lang = navigator.language || "—";
        var cores = navigator.hardwareConcurrency || "—";
        var mem = navigator.deviceMemory ? navigator.deviceMemory + " GB" : "—";
        var touch = navigator.maxTouchPoints || 0;
        var online = navigator.onLine ? "Online" : "Offline";
        var cookies = navigator.cookieEnabled ? "Enabled" : "Disabled";

        return {
            os: os,
            browser: browser + (version ? " " + version : ""),
            display: scr,
            viewport: vp,
            colorDepth: colorDepth,
            cores: cores,
            memory: mem,
            language: lang,
            timezone: tz,
            touch: touch + " touch points",
            network: online,
            cookies: cookies,
            ua: ua,
        };
    }

    /* ---------- Menu ---------- */
    var trigger, menu, modal;
    var menuOpen = false;

    function injectCriticalCSS() {
        // Inline critical styles so the button & menu work even if the
        // external stylesheet is stale-cached without the new rules.
        var s = document.createElement("style");
        s.id = "apple-menu-critical";
        s.textContent =
            ".masthead::before{display:none!important}" +
            ".apple-menu-trigger{position:absolute;top:50%;left:12px;" +
            "transform:translateY(-50%);width:34px;height:34px;padding:0;" +
            "border:0;border-radius:8px;background:transparent;cursor:pointer;" +
            "z-index:2;display:inline-flex;align-items:center;justify-content:center;}" +
            ".apple-menu-trigger:hover{background:rgba(127,127,127,0.18)}" +
            ".apple-menu-trigger>img{width:22px;height:22px;pointer-events:none;" +
            "filter:drop-shadow(0 1px 1px rgba(0,0,0,0.18))}" +
            "@media(max-width:768px){.apple-menu-trigger{display:none}}";
        document.head.appendChild(s);
    }

    function buildTrigger(masthead) {
        trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "apple-menu-trigger";
        trigger.setAttribute("aria-label", "System menu");
        trigger.setAttribute("aria-haspopup", "menu");
        trigger.setAttribute("aria-expanded", "false");

        var img = document.createElement("img");
        img.src = DAEMON;
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
        trigger.appendChild(img);

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            menuOpen ? closeMenu() : openMenu();
        });

        masthead.appendChild(trigger);
        masthead.classList.add("has-apple-menu");
    }

    function buildMenu() {
        menu = el("div", { class: "apple-menu", role: "menu", "aria-label": "Apple menu" });
        menu.hidden = true;

        MENU.forEach(function (item) {
            if (item.separator) {
                menu.appendChild(el("div", { class: "apple-menu__sep", role: "separator" }));
                return;
            }
            var iconHtml = ICONS[item.icon] || "";
            var btn = el("button", {
                class: "apple-menu__item" + (item.disabled ? " is-disabled" : ""),
                role: "menuitem",
                type: "button",
                "aria-disabled": item.disabled ? "true" : "false",
            });
            btn.innerHTML =
                '<span class="apple-menu__icon">' + iconHtml + "</span>" +
                '<span class="apple-menu__label"></span>' +
                (item.shortcut ? '<span class="apple-menu__shortcut"></span>' : "") +
                (item.arrow ? '<span class="apple-menu__arrow">›</span>' : "");
            btn.querySelector(".apple-menu__label").textContent = item.label;
            if (item.shortcut) btn.querySelector(".apple-menu__shortcut").textContent = item.shortcut;
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                if (item.disabled) return;
                if (item.action === "about") {
                    closeMenu();
                    openAbout();
                }
            });
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
    }

    function openMenu() {
        if (!menu) return;
        menu.hidden = false;
        var rect = trigger.getBoundingClientRect();
        menu.style.top = (rect.bottom + 6) + "px";
        menu.style.left = Math.max(8, rect.left - 4) + "px";
        trigger.setAttribute("aria-expanded", "true");
        menuOpen = true;
        // animate in next frame
        requestAnimationFrame(function () {
            menu.classList.add("is-open");
        });
    }

    function closeMenu() {
        if (!menu) return;
        menu.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menuOpen = false;
        // delay hidden to allow fade out
        setTimeout(function () {
            if (!menuOpen) menu.hidden = true;
        }, 140);
    }

    /* ---------- About modal ---------- */
    function buildAbout() {
        var info = detectInfo();
        var rows = [
            ["Operating System", info.os],
            ["Browser", info.browser],
            ["Display", info.display],
            ["Viewport", info.viewport],
            ["Color Depth", info.colorDepth],
            ["CPU Cores", info.cores],
            ["Memory", info.memory],
            ["Language", info.language],
            ["Time Zone", info.timezone],
            ["Network", info.network],
            ["Cookies", info.cookies],
            ["Touch", info.touch],
        ];

        var dl = el("dl", { class: "apple-about__dl" });
        rows.forEach(function (r) {
            dl.appendChild(el("dt", { text: r[0] }));
            dl.appendChild(el("dd", { text: String(r[1]) }));
        });

        var ua = el("details", { class: "apple-about__ua" });
        ua.appendChild(el("summary", { text: "User agent" }));
        ua.appendChild(el("code", { text: info.ua }));

        var content = el("div", { class: "apple-about__content" }, [
            el("img", { class: "apple-about__hero", src: DAEMON, alt: "" }),
            el("h2", { class: "apple-about__title", text: info.os }),
            el("p", { class: "apple-about__sub", text: info.browser }),
            dl,
            ua,
        ]);

        var trafficLights = el("div", { class: "apple-about__lights" }, [
            el("button", {
                class: "apple-about__light apple-about__light--close",
                "aria-label": "Close",
                type: "button",
                on: { click: closeAbout },
            }),
            el("span", { class: "apple-about__light apple-about__light--min" }),
            el("span", { class: "apple-about__light apple-about__light--max" }),
        ]);

        var win = el("div", { class: "apple-about__window", role: "dialog", "aria-label": "About this Mac" }, [
            trafficLights,
            content,
        ]);

        var backdrop = el(
            "div",
            {
                class: "apple-about",
                on: {
                    click: function (e) {
                        if (e.target === backdrop) closeAbout();
                    },
                },
            },
            [win]
        );

        modal = backdrop;
        document.body.appendChild(modal);
    }

    function openAbout() {
        if (!modal) buildAbout();
        modal.classList.add("is-open");
        document.documentElement.style.overflow = "hidden";
    }

    function closeAbout() {
        if (!modal) return;
        modal.classList.remove("is-open");
        document.documentElement.style.overflow = "";
    }

    /* ---------- Wiring ---------- */
    ready(function () {
        var masthead = document.querySelector(".masthead");
        if (!masthead) return;
        injectCriticalCSS();
        buildTrigger(masthead);
        buildMenu();

        document.addEventListener("click", function (e) {
            if (menuOpen && !menu.contains(e.target) && e.target !== trigger) closeMenu();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                if (menuOpen) closeMenu();
                if (modal && modal.classList.contains("is-open")) closeAbout();
            }
        });
        window.addEventListener("resize", function () {
            if (menuOpen) {
                var rect = trigger.getBoundingClientRect();
                menu.style.top = rect.bottom + 6 + "px";
                menu.style.left = Math.max(8, rect.left - 4) + "px";
            }
        });
    });
})();
