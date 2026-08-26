(function () {
    if (typeof document === "undefined") return;

    var EMAIL = "contact@stoicswe.com";
    var BLUESKY = "https://bsky.app/profile/stoicswe.com";

    var modal = null;
    var lastFocus = null;

    function el(tag, props, children) {
        var node = document.createElement(tag);
        if (props) {
            for (var k in props) {
                if (k === "class") node.className = props[k];
                else if (k === "html") node.innerHTML = props[k];
                else if (k === "text") node.textContent = props[k];
                else if (k === "on") {
                    for (var ev in props.on) node.addEventListener(ev, props.on[ev]);
                } else if (k.indexOf("aria-") === 0 || k === "role" || k === "tabindex" || k === "rel") {
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

    /* Inline SVG so the dialog doesn't depend on the icon font loading. */
    var ICONS = {
        bluesky:
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.8 3.8C8.3 5.7 11 9.5 12 11.6c1-2.1 3.7-5.9 6.2-7.8 1.8-1.4 4.8-2.4 4.8 1 0 .7-.4 5.7-.6 6.5-.8 2.8-3.7 3.5-6.2 3.1 4.4.7 5.5 3.2 3.1 5.7-4.6 4.7-6.6-1.2-7.1-2.7-.1-.3-.2-.4-.2-.3s-.1.1-.2.3c-.5 1.5-2.5 7.4-7.1 2.7-2.4-2.5-1.3-5 3.1-5.7-2.5.4-5.4-.3-6.2-3.1-.2-.8-.6-5.8-.6-6.5 0-3.4 3-2.4 4.8-1z"/></svg>',
        mail:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7.5l7.4 5.2a2 2 0 0 0 2.2 0l7.4-5.2"/></svg>',
        chevron:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
    };

    function row(opts) {
        return el(
            "a",
            {
                class: "contact-modal__row",
                href: opts.href,
                target: opts.external ? "_blank" : null,
                rel: opts.external ? "noopener noreferrer external" : null
            },
            [
                el("span", { class: "contact-modal__icon contact-modal__icon--" + opts.kind, html: ICONS[opts.kind] }),
                el("span", { class: "contact-modal__row-text" }, [
                    el("span", { class: "contact-modal__row-label", text: opts.label }),
                    el("span", { class: "contact-modal__row-value", text: opts.value })
                ]),
                el("span", { class: "contact-modal__chevron", html: ICONS.chevron })
            ]
        );
    }

    function build() {
        var lights = el("div", { class: "contact-modal__lights" }, [
            el("button", {
                class: "contact-modal__light contact-modal__light--close",
                type: "button",
                "aria-label": "Close",
                on: { click: close }
            }),
            el("span", { class: "contact-modal__light contact-modal__light--min" }),
            el("span", { class: "contact-modal__light contact-modal__light--max" })
        ]);

        var content = el("div", { class: "contact-modal__content" }, [
            el("h2", { class: "contact-modal__title", id: "contact-modal-title", text: "Contact" }),
            el("p", {
                class: "contact-modal__sub",
                text: "Say hello — I read everything, and reply to most of it."
            }),
            el("div", { class: "contact-modal__rows" }, [
                row({
                    kind: "bluesky",
                    label: "Bluesky",
                    value: "@stoicswe.com",
                    href: BLUESKY,
                    external: true
                }),
                row({
                    kind: "mail",
                    label: "Email",
                    value: EMAIL,
                    href: "mailto:" + EMAIL
                })
            ]),
            el("button", {
                class: "contact-modal__done",
                type: "button",
                text: "Done",
                on: { click: close }
            })
        ]);

        var win = el(
            "div",
            {
                class: "contact-modal__window",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "contact-modal-title"
            },
            [lights, content]
        );

        modal = el(
            "div",
            {
                class: "contact-modal",
                on: {
                    click: function (e) {
                        if (e.target === modal) close();
                    }
                }
            },
            [win]
        );

        document.body.appendChild(modal);
    }

    function focusables() {
        if (!modal) return [];
        return Array.prototype.slice.call(
            modal.querySelectorAll('a[href], button:not([disabled])')
        );
    }

    function open() {
        lastFocus = document.activeElement;
        if (!modal) build();
        modal.classList.add("is-open");
        document.documentElement.style.overflow = "hidden";
        var f = focusables();
        // Skip the traffic-light close button — land on the first real link.
        var first = f.length > 1 ? f[1] : f[0];
        if (first) first.focus();
    }

    function close() {
        if (!modal || !modal.classList.contains("is-open")) return;
        modal.classList.remove("is-open");
        document.documentElement.style.overflow = "";
        if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
        lastFocus = null;
    }

    function isOpen() {
        return !!(modal && modal.classList.contains("is-open"));
    }

    /* Delegated so the trigger survives SPA soft-navigation, which swaps #main. */
    document.addEventListener("click", function (e) {
        var t = e.target;
        var trigger = t && t.closest ? t.closest("[data-contact-open]") : null;
        if (!trigger) return;
        e.preventDefault();
        open();
    });

    document.addEventListener("keydown", function (e) {
        if (!isOpen()) return;
        if (e.key === "Escape") {
            e.preventDefault();
            close();
            return;
        }
        if (e.key !== "Tab") return;
        // Keep focus inside the dialog while it's up.
        var f = focusables();
        if (!f.length) return;
        var firstEl = f[0];
        var lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
        }
    });

    // Navigating away shouldn't leave the dialog (or the scroll lock) behind.
    document.addEventListener("spa:navigated", close);
})();
