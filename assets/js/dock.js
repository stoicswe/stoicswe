(function () {
    if (typeof document === "undefined") return;

    function ready(fn) {
        if (document.readyState !== "loading") fn();
        else document.addEventListener("DOMContentLoaded", fn);
    }

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

    /* App icons — same artwork as Apple-menu Recent Items, plus a Trash bin. */
    var APP_ICONS = {
        finder:
            '<svg viewBox="0 0 24 24"><defs><clipPath id="dock-finder-clip"><rect x="2" y="3" width="20" height="18" rx="4.5"/></clipPath></defs><g clip-path="url(#dock-finder-clip)"><rect x="2" y="3" width="10" height="18" fill="#7d899c"/><rect x="12" y="3" width="10" height="18" fill="#3a83d4"/></g><circle cx="9" cy="10" r="1.2" fill="#1d1d1f"/><circle cx="15" cy="10" r="1.2" fill="#fff"/><path d="M8.5 14.5c1 1.4 5 1.4 6 0" stroke="#1d1d1f" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
        calculator:
            '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="4.5" fill="#2b2b2b"/><rect x="4.6" y="5.2" width="14.8" height="3.4" rx="0.8" fill="#1a1a1a"/><circle cx="6.6" cy="12" r="1.15" fill="#5d5d5d"/><circle cx="10" cy="12" r="1.15" fill="#5d5d5d"/><circle cx="13.4" cy="12" r="1.15" fill="#5d5d5d"/><circle cx="17.5" cy="12" r="1.15" fill="#ff9500"/><circle cx="6.6" cy="15" r="1.15" fill="#5d5d5d"/><circle cx="10" cy="15" r="1.15" fill="#5d5d5d"/><circle cx="13.4" cy="15" r="1.15" fill="#5d5d5d"/><circle cx="17.5" cy="15" r="1.15" fill="#ff9500"/><circle cx="6.6" cy="18" r="1.15" fill="#5d5d5d"/><circle cx="10" cy="18" r="1.15" fill="#5d5d5d"/><circle cx="13.4" cy="18" r="1.15" fill="#5d5d5d"/><circle cx="17.5" cy="18" r="1.15" fill="#ff9500"/></svg>',
        textedit:
            '<svg viewBox="0 0 24 24"><rect x="4" y="2.5" width="14" height="19" rx="2" fill="#fff" stroke="#bbb" stroke-width="0.6"/><path d="M7 7h8M7 10h8M7 13h8M7 16h6" stroke="#a0a0a0" stroke-width="0.9" stroke-linecap="round"/><path d="M14.5 17l5-5 2 2-5 5-2.5.5z" fill="#f5b800" stroke="#1d1d1f" stroke-width="0.5" stroke-linejoin="round"/></svg>',
        terminal:
            '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="4.5" fill="#222"/><path d="M6 9.5l2.6 2.5L6 14.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 15.5h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
        trash:
            '<svg viewBox="0 0 24 24">' +
            '<defs>' +
            '<linearGradient id="dock-trash-body" x1="0" x2="0" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#dfe2e7"/><stop offset="1" stop-color="#a8acb3"/>' +
            "</linearGradient>" +
            '<linearGradient id="dock-trash-lid" x1="0" x2="0" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#eef0f3"/><stop offset="1" stop-color="#bcc0c6"/>' +
            "</linearGradient>" +
            "</defs>" +
            '<path d="M5.6 7.5h12.8l-1.1 12a1.7 1.7 0 0 1-1.7 1.5H8.4a1.7 1.7 0 0 1-1.7-1.5z" fill="url(#dock-trash-body)" stroke="rgba(0,0,0,0.25)" stroke-width="0.5"/>' +
            '<path d="M9 11v7M12 11v7M15 11v7" stroke="rgba(0,0,0,0.28)" stroke-width="0.9" stroke-linecap="round" fill="none"/>' +
            '<rect x="4" y="5.4" width="16" height="2.4" rx="1.2" fill="url(#dock-trash-lid)" stroke="rgba(0,0,0,0.25)" stroke-width="0.5"/>' +
            '<path d="M10 5.4V4.3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.1" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="0.9"/>' +
            "</svg>",
    };

    /* Dock items in left-to-right order. Trash is offset by a separator. */
    var ITEMS = [
        { id: "finder",     label: "Finder",      action: "openFinder",     icon: "finder" },
        { id: "textedit",   label: "TextEdit",    action: "openTextEdit",   icon: "textedit" },
        { id: "calculator", label: "Calculator",  action: "openCalculator", icon: "calculator" },
        { id: "terminal",   label: "Terminal",    action: "openTerminal",   icon: "terminal" },
        { separator: true },
        { id: "trash",      label: "Trash",       action: "openTrash",      icon: "trash" },
    ];

    var dock = null;
    var hideTimer = null;
    var SHOW_THRESHOLD = 90; // px from the bottom of the viewport

    function injectCSS() {
        if (document.getElementById("dock-critical")) return;
        var s = document.createElement("style");
        s.id = "dock-critical";
        s.textContent = [
            ".dock{position:fixed;left:50%;bottom:10px;z-index:2400;display:flex;align-items:flex-end;gap:6px;padding:7px 9px;",
            "background:rgba(246,246,248,0.55);-webkit-backdrop-filter:saturate(180%) blur(30px);backdrop-filter:saturate(180%) blur(30px);",
            "border:1px solid rgba(255,255,255,0.5);border-radius:18px;",
            "box-shadow:0 1px 0 rgba(255,255,255,0.6) inset,0 12px 32px rgba(0,0,0,0.22),0 4px 10px rgba(0,0,0,0.14);",
            "transform:translate(-50%,140%);opacity:0;pointer-events:none;",
            "transition:transform 260ms cubic-bezier(0.2,0.7,0.2,1),opacity 200ms ease;",
            "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',sans-serif}",
            "@media(prefers-color-scheme:dark){.dock{background:rgba(36,36,40,0.55);border-color:rgba(255,255,255,0.10);box-shadow:0 1px 0 rgba(255,255,255,0.06) inset,0 12px 32px rgba(0,0,0,0.55),0 4px 10px rgba(0,0,0,0.35)}}",
            ".dock.is-visible{transform:translate(-50%,0);opacity:1;pointer-events:auto}",
            ".dock__item{position:relative;width:48px;height:48px;padding:0;border:0;background:transparent;cursor:pointer;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:transform 180ms cubic-bezier(0.2,0.7,0.2,1)}",
            ".dock__item:focus-visible{outline:none;box-shadow:0 0 0 3px var(--sonoma-accent-tint,rgba(0,113,227,0.18))}",
            ".dock__item:hover{transform:translateY(-9px) scale(1.18)}",
            ".dock__item:active{transform:translateY(-4px) scale(1.08)}",
            ".dock__item svg{width:42px;height:42px;display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.22))}",
            ".dock__sep{width:1px;align-self:stretch;margin:6px 4px;background:rgba(0,0,0,0.18)}",
            "@media(prefers-color-scheme:dark){.dock__sep{background:rgba(255,255,255,0.18)}}",
            ".dock__tooltip{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translate(-50%,4px);padding:3px 9px;",
            "font-size:12px;font-weight:500;color:#1d1d1f;background:rgba(246,246,248,0.96);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);",
            "border:1px solid rgba(0,0,0,0.08);border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 120ms ease,transform 120ms ease;box-shadow:0 4px 10px rgba(0,0,0,0.12)}",
            "@media(prefers-color-scheme:dark){.dock__tooltip{color:#f5f5f7;background:rgba(36,36,40,0.96);border-color:rgba(255,255,255,0.1)}}",
            ".dock__item:hover .dock__tooltip,.dock__item:focus-visible .dock__tooltip{opacity:1;transform:translate(-50%,0)}",
            "@media(max-width:768px){.dock{display:none}}",
        ].join("");
        document.head.appendChild(s);
    }

    function build() {
        injectCSS();
        dock = el("div", {
            class: "dock",
            role: "toolbar",
            "aria-label": "Dock",
            on: {
                mouseenter: show,
                mouseleave: scheduleHide,
            },
        });

        ITEMS.forEach(function (item) {
            if (item.separator) {
                dock.appendChild(el("span", { class: "dock__sep", "aria-hidden": "true" }));
                return;
            }
            var btn = el("button", {
                class: "dock__item",
                type: "button",
                "aria-label": item.label,
                title: item.label,
                on: {
                    click: function () {
                        var apps = window.StoicSweApps;
                        if (apps && typeof apps[item.action] === "function") apps[item.action]();
                    },
                },
            });
            btn.innerHTML =
                APP_ICONS[item.icon] +
                '<span class="dock__tooltip"></span>';
            btn.querySelector(".dock__tooltip").textContent = item.label;
            dock.appendChild(btn);
        });

        document.body.appendChild(dock);
    }

    function show() {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        if (dock) dock.classList.add("is-visible");
    }
    function scheduleHide() {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
            if (dock) dock.classList.remove("is-visible");
            hideTimer = null;
        }, 350);
    }

    function onMouseMove(e) {
        if (!dock) return;
        if (e.clientY >= window.innerHeight - SHOW_THRESHOLD) show();
        else if (!dock.matches(":hover")) scheduleHide();
    }

    ready(function () {
        build();
        document.addEventListener("mousemove", onMouseMove);
        // If the cursor leaves the window entirely, hide.
        document.addEventListener("mouseleave", scheduleHide);
    });
})();
