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
        { label: "System Settings…", icon: "gear", action: "settings" },
        { label: "App Store…", icon: "apple", disabled: true },
        { separator: true },
        {
            label: "Recent Items",
            icon: "clock",
            arrow: true,
            submenu: [
                { label: "Terminal.app", icon: "app-terminal", action: "openTerminal" },
                { label: "Finder.app", icon: "app-finder", action: "openFinder" },
                { label: "Calculator.app", icon: "app-calculator", action: "openCalculator" },
                { label: "TextEdit.app", icon: "app-textedit", action: "openTextEdit" },
            ],
        },
        { separator: true },
        { label: "Force Quit…", icon: "x-circle", shortcut: "⌥⇧⌘⎋", disabled: true },
        { separator: true },
        { label: "Sleep", icon: "moon", disabled: true },
        { label: "Restart…", icon: "restart", action: "restart" },
        { label: "Shut Down…", icon: "power", action: "shutdown" },
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
        /* App icons — keep their own colors regardless of menu hover state. */
        "app-terminal":
            '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="4.5" fill="#222"/><path d="M6 9.5l2.6 2.5L6 14.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 15.5h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
        "app-finder":
            '<svg viewBox="0 0 24 24"><defs><clipPath id="apl-finder-clip"><rect x="2" y="3" width="20" height="18" rx="4.5"/></clipPath></defs><g clip-path="url(#apl-finder-clip)"><rect x="2" y="3" width="10" height="18" fill="#7d899c"/><rect x="12" y="3" width="10" height="18" fill="#3a83d4"/></g><circle cx="9" cy="10" r="1.2" fill="#1d1d1f"/><circle cx="15" cy="10" r="1.2" fill="#fff"/><path d="M8.5 14.5c1 1.4 5 1.4 6 0" stroke="#1d1d1f" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
        "app-calculator":
            '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="4.5" fill="#2b2b2b"/><rect x="4.6" y="5.2" width="14.8" height="3.4" rx="0.8" fill="#1a1a1a"/><circle cx="6.6" cy="12" r="1.15" fill="#5d5d5d"/><circle cx="10" cy="12" r="1.15" fill="#5d5d5d"/><circle cx="13.4" cy="12" r="1.15" fill="#5d5d5d"/><circle cx="17.5" cy="12" r="1.15" fill="#ff9500"/><circle cx="6.6" cy="15" r="1.15" fill="#5d5d5d"/><circle cx="10" cy="15" r="1.15" fill="#5d5d5d"/><circle cx="13.4" cy="15" r="1.15" fill="#5d5d5d"/><circle cx="17.5" cy="15" r="1.15" fill="#ff9500"/><circle cx="6.6" cy="18" r="1.15" fill="#5d5d5d"/><circle cx="10" cy="18" r="1.15" fill="#5d5d5d"/><circle cx="13.4" cy="18" r="1.15" fill="#5d5d5d"/><circle cx="17.5" cy="18" r="1.15" fill="#ff9500"/></svg>',
        "app-textedit":
            '<svg viewBox="0 0 24 24"><rect x="4" y="2.5" width="14" height="19" rx="2" fill="#fff" stroke="#bbb" stroke-width="0.6"/><path d="M7 7h8M7 10h8M7 13h8M7 16h6" stroke="#a0a0a0" stroke-width="0.9" stroke-linecap="round"/><path d="M14.5 17l5-5 2 2-5 5-2.5.5z" fill="#f5b800" stroke="#1d1d1f" stroke-width="0.5" stroke-linejoin="round"/></svg>',
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
            ".apple-menu-trigger{position:absolute!important;top:50%;left:6px;" +
            "transform:translateY(-50%);width:48px;height:44px;padding:0;" +
            "border:0;border-radius:10px;background:transparent;cursor:pointer;" +
            "z-index:1000;display:inline-flex;align-items:center;justify-content:center;" +
            "pointer-events:auto;-webkit-appearance:none;appearance:none;}" +
            ".apple-menu-trigger:hover{background:rgba(127,127,127,0.18)}" +
            ".apple-menu-trigger:active{transform:translateY(-50%) scale(0.94)}" +
            ".apple-menu-trigger>img{width:24px;height:24px;pointer-events:none;" +
            "display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.18))}" +
            "@media(max-width:768px){.apple-menu-trigger{display:none}}" +
            /* App-icon modifier — keeps colored icons at full opacity even when
               the menu row is selected (highlight wraps around the icon). */
            ".apple-menu__icon--app{opacity:1!important}" +
            ".apple-menu__icon--app svg{border-radius:4px;display:block}";
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
            var hasSubmenu = !!(item.submenu && item.submenu.length);
            var btn = el("button", {
                class: "apple-menu__item" + (item.disabled ? " is-disabled" : ""),
                role: "menuitem",
                type: "button",
                "aria-disabled": item.disabled ? "true" : "false",
                "aria-haspopup": hasSubmenu ? "menu" : "false",
            });
            btn.innerHTML =
                '<span class="apple-menu__icon">' + iconHtml + "</span>" +
                '<span class="apple-menu__label"></span>' +
                (item.shortcut ? '<span class="apple-menu__shortcut"></span>' : "") +
                (item.arrow || hasSubmenu ? '<span class="apple-menu__arrow">›</span>' : "");
            btn.querySelector(".apple-menu__label").textContent = item.label;
            if (item.shortcut) btn.querySelector(".apple-menu__shortcut").textContent = item.shortcut;

            if (hasSubmenu) {
                btn.addEventListener("mouseenter", function () {
                    showSubmenu(btn, item.submenu);
                });
                btn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    showSubmenu(btn, item.submenu);
                });
            } else {
                btn.addEventListener("mouseenter", function () {
                    if (submenuCloseTimer) {
                        clearTimeout(submenuCloseTimer);
                        submenuCloseTimer = null;
                    }
                    submenuCloseTimer = setTimeout(hideSubmenu, 150);
                });
                btn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    if (item.disabled) return;
                    if (item.action === "about") {
                        closeMenu();
                        openAbout();
                    } else if (item.action === "settings") {
                        closeMenu();
                        if (window.StoicSweSettings) window.StoicSweSettings.open();
                    } else if (item.action === "restart" || item.action === "shutdown") {
                        closeMenu();
                        if (window.StoicSweBoot) window.StoicSweBoot.show(item.action);
                    }
                });
            }
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
    }

    /* ---------- Submenu ---------- */
    var submenuEl = null;
    var submenuParent = null;
    var submenuCloseTimer = null;

    function showSubmenu(parentBtn, items) {
        if (submenuCloseTimer) {
            clearTimeout(submenuCloseTimer);
            submenuCloseTimer = null;
        }
        if (submenuParent === parentBtn && submenuEl) return;
        hideSubmenu();

        submenuEl = el("div", {
            class: "apple-menu apple-submenu",
            role: "menu",
            "aria-label": "Recent items",
        });
        submenuParent = parentBtn;

        items.forEach(function (sub) {
            var iconHtml = ICONS[sub.icon] || "";
            var subBtn = el("button", {
                class: "apple-menu__item",
                role: "menuitem",
                type: "button",
            });
            subBtn.innerHTML =
                '<span class="apple-menu__icon apple-menu__icon--app">' +
                iconHtml +
                "</span>" +
                '<span class="apple-menu__label"></span>';
            subBtn.querySelector(".apple-menu__label").textContent = sub.label;
            subBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                closeMenu();
                if (sub.action && window.StoicSweApps && typeof window.StoicSweApps[sub.action] === "function") {
                    window.StoicSweApps[sub.action]();
                }
            });
            submenuEl.appendChild(subBtn);
        });

        document.body.appendChild(submenuEl);

        // Position to the right of the parent item
        var prect = parentBtn.getBoundingClientRect();
        submenuEl.style.top = prect.top - 6 + "px";
        // If the submenu would go off-screen on the right, flip to the left
        var preferredLeft = prect.right - 2;
        var subWidth = submenuEl.offsetWidth || 220;
        if (preferredLeft + subWidth > window.innerWidth - 8) {
            preferredLeft = Math.max(8, prect.left - subWidth + 2);
        }
        submenuEl.style.left = preferredLeft + "px";

        requestAnimationFrame(function () {
            if (submenuEl) submenuEl.classList.add("is-open");
        });

        submenuEl.addEventListener("mouseenter", function () {
            if (submenuCloseTimer) {
                clearTimeout(submenuCloseTimer);
                submenuCloseTimer = null;
            }
        });
        submenuEl.addEventListener("mouseleave", function () {
            if (submenuCloseTimer) clearTimeout(submenuCloseTimer);
            submenuCloseTimer = setTimeout(hideSubmenu, 200);
        });
    }

    function hideSubmenu() {
        if (submenuCloseTimer) {
            clearTimeout(submenuCloseTimer);
            submenuCloseTimer = null;
        }
        if (submenuEl && submenuEl.parentNode) submenuEl.parentNode.removeChild(submenuEl);
        submenuEl = null;
        submenuParent = null;
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
        hideSubmenu();
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
            if (
                menuOpen &&
                !menu.contains(e.target) &&
                !(submenuEl && submenuEl.contains(e.target)) &&
                e.target !== trigger
            )
                closeMenu();
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
