(function () {
    if (typeof document === "undefined") return;

    var topZ = 4000;

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

    /* =================================================================
       Critical inline CSS — windows + per-app
       ================================================================= */
    function injectCSS() {
        if (document.getElementById("apps-critical")) return;
        var s = document.createElement("style");
        s.id = "apps-critical";
        s.textContent = [
            /* Window shell */
            ".app-window{position:fixed;z-index:4000;display:flex;flex-direction:column;background:rgba(246,246,248,0.92);-webkit-backdrop-filter:saturate(180%) blur(40px);backdrop-filter:saturate(180%) blur(40px);color:#1d1d1f;border:1px solid rgba(0,0,0,0.08);border-radius:12px;box-shadow:0 1px 0 rgba(255,255,255,0.6) inset,0 30px 70px rgba(0,0,0,0.32),0 8px 18px rgba(0,0,0,0.18);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',sans-serif;opacity:0;transition:opacity 160ms ease,transform 200ms cubic-bezier(0.2,0.7,0.2,1);transform:scale(0.98)}",
            ".app-window.is-open{opacity:1;transform:none}",
            "@media(prefers-color-scheme:dark){.app-window{background:rgba(28,28,32,0.88);color:#f5f5f7;border-color:rgba(255,255,255,0.08);box-shadow:0 1px 0 rgba(255,255,255,0.06) inset,0 30px 70px rgba(0,0,0,0.6),0 8px 18px rgba(0,0,0,0.4)}}",
            ".app-window__titlebar{display:flex;align-items:center;height:38px;flex:0 0 38px;padding:0 12px;border-bottom:1px solid rgba(0,0,0,0.08);user-select:none;cursor:grab;position:relative}",
            "@media(prefers-color-scheme:dark){.app-window__titlebar{border-bottom-color:rgba(255,255,255,0.08)}}",
            ".app-window__titlebar.is-dragging{cursor:grabbing}",
            ".app-window__lights{display:flex;gap:8px;z-index:2}",
            ".app-window__light{width:12px;height:12px;border-radius:50%;border:0;padding:0;box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.18);cursor:default}",
            ".app-window__light--close{background:#ff5f57;cursor:pointer}",
            ".app-window__light--min{background:#febc2e}",
            ".app-window__light--max{background:#28c840}",
            ".app-window__title{position:absolute;left:50%;transform:translateX(-50%);font-size:13px;font-weight:600;letter-spacing:-0.005em;pointer-events:none}",
            ".app-window__body{flex:1;min-height:0;display:flex;overflow:hidden}",
            /* Terminal */
            ".term-app{flex:1;min-height:0;display:flex;flex-direction:column;background:#101013;color:#dcdcdc;font-family:'SF Mono',ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:12.5px;line-height:1.5}",
            ".term-output{flex:1;overflow-y:auto;padding:0.6em 0.9em;white-space:pre-wrap;word-break:break-word}",
            ".term-output::-webkit-scrollbar{width:8px}",
            ".term-output::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:4px}",
            ".term-line{display:block}",
            ".term-line--cmd{color:#fff}",
            ".term-line--res{color:#9be3a8}",
            ".term-line--err{color:#ff7676}",
            ".term-line--note{color:#7d8a99;font-style:italic}",
            ".term-input-line{display:flex;align-items:center;padding:0 0.9em 0.7em;flex:0 0 auto}",
            ".term-prompt{color:#7fdb7f;flex:0 0 auto;white-space:pre}",
            ".term-input{flex:1;min-width:0;background:transparent;border:0;color:#fff;font:inherit;outline:none;padding:0 0 0 4px;caret-color:#fff}",
            /* Finder */
            ".finder-app{flex:1;min-height:0;display:flex}",
            ".finder-sidebar{width:172px;flex:0 0 172px;background:rgba(255,255,255,0.18);border-right:1px solid rgba(0,0,0,0.06);overflow-y:auto;padding:8px 6px}",
            "@media(prefers-color-scheme:dark){.finder-sidebar{background:rgba(0,0,0,0.18);border-right-color:rgba(255,255,255,0.06)}}",
            ".finder-section{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:rgba(60,60,67,0.5);padding:8px 8px 4px}",
            "@media(prefers-color-scheme:dark){.finder-section{color:rgba(235,235,245,0.5)}}",
            ".finder-side-item{display:flex;align-items:center;gap:8px;width:100%;padding:5px 8px;margin-bottom:1px;background:transparent;border:0;border-radius:5px;color:inherit;font:inherit;font-size:13px;text-align:left;cursor:pointer}",
            ".finder-side-item:hover{background:rgba(0,0,0,0.05)}",
            "@media(prefers-color-scheme:dark){.finder-side-item:hover{background:rgba(255,255,255,0.06)}}",
            ".finder-side-item.is-active{background:#0071e3;color:#fff}",
            "@media(prefers-color-scheme:dark){.finder-side-item.is-active{background:#0a84ff}}",
            ".finder-side-item__icon{width:16px;height:16px;flex:0 0 16px;display:inline-flex;align-items:center;justify-content:center}",
            ".finder-side-item__icon svg{width:100%;height:100%}",
            ".finder-main{flex:1;min-width:0;display:flex;flex-direction:column}",
            ".finder-toolbar{display:flex;align-items:center;gap:0.4em;height:34px;flex:0 0 34px;padding:0 0.9em;border-bottom:1px solid rgba(0,0,0,0.06);font-size:12.5px;color:rgba(60,60,67,0.7)}",
            "@media(prefers-color-scheme:dark){.finder-toolbar{border-bottom-color:rgba(255,255,255,0.06);color:rgba(235,235,245,0.6)}}",
            ".finder-nav{display:flex;gap:2px}",
            ".finder-nav button{width:24px;height:24px;border:0;background:transparent;border-radius:4px;color:inherit;font:inherit;cursor:pointer;font-size:14px;line-height:1}",
            ".finder-nav button:hover:not(:disabled){background:rgba(0,0,0,0.06)}",
            "@media(prefers-color-scheme:dark){.finder-nav button:hover:not(:disabled){background:rgba(255,255,255,0.08)}}",
            ".finder-nav button:disabled{opacity:0.35;cursor:default}",
            ".finder-path{font-family:'SF Mono',ui-monospace,Menlo,monospace;font-size:11.5px;margin-left:0.5em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".finder-grid{flex:1;overflow-y:auto;padding:0.9em;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:0.5em;align-content:start}",
            ".finder-empty{padding:2em;color:rgba(60,60,67,0.55);font-style:italic;font-size:13px}",
            "@media(prefers-color-scheme:dark){.finder-empty{color:rgba(235,235,245,0.5)}}",
            ".finder-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;background:transparent;border:0;border-radius:6px;cursor:pointer;color:inherit;font:inherit}",
            ".finder-item:hover{background:rgba(0,113,227,0.08)}",
            "@media(prefers-color-scheme:dark){.finder-item:hover{background:rgba(10,132,255,0.14)}}",
            ".finder-item__icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}",
            ".finder-item__icon svg{width:48px;height:48px;display:block}",
            ".finder-item__icon--photo{width:54px;height:54px;border-radius:5px;overflow:hidden;background:rgba(0,0,0,0.1);box-shadow:0 1px 3px rgba(0,0,0,0.18),inset 0 0 0 0.5px rgba(0,0,0,0.12)}",
            ".finder-item__icon--photo img{width:100%;height:100%;object-fit:cover;display:block}",
            ".finder-item__name{font-size:11.5px;text-align:center;line-height:1.25;word-break:break-word;max-width:100%}",
            /* File viewer modal */
            ".finder-viewer{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);padding:2em;opacity:0;pointer-events:none;transition:opacity 160ms ease}",
            ".finder-viewer.is-open{opacity:1;pointer-events:auto}",
            ".finder-viewer__win{display:flex;flex-direction:column;width:min(820px,100%);max-height:100%;background:rgba(246,246,248,0.95);color:#1d1d1f;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,0.45);overflow:hidden}",
            "@media(prefers-color-scheme:dark){.finder-viewer__win{background:rgba(28,28,32,0.95);color:#f5f5f7}}",
            ".finder-viewer__bar{display:flex;align-items:center;height:36px;flex:0 0 36px;padding:0 12px;border-bottom:1px solid rgba(0,0,0,0.08);font-size:12.5px;font-weight:500;position:relative}",
            "@media(prefers-color-scheme:dark){.finder-viewer__bar{border-bottom-color:rgba(255,255,255,0.08)}}",
            ".finder-viewer__path{margin-left:auto;font-family:'SF Mono',ui-monospace,Menlo,monospace;font-size:11px;color:rgba(60,60,67,0.65)}",
            "@media(prefers-color-scheme:dark){.finder-viewer__path{color:rgba(235,235,245,0.55)}}",
            ".finder-viewer__body{flex:1;min-height:0;overflow:auto;background:rgba(255,255,255,0.5)}",
            "@media(prefers-color-scheme:dark){.finder-viewer__body{background:rgba(0,0,0,0.25)}}",
            ".finder-viewer__pre{margin:0;padding:1em 1.2em;font-family:'SF Mono',ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.55;white-space:pre;color:inherit;background:transparent;tab-size:2}",
            ".finder-viewer__img{display:block;max-width:100%;margin:1em auto}",
            /* Calculator */
            ".calc-app{flex:1;min-height:0;display:flex;flex-direction:column;background:#1d1d1f;color:#fff}",
            ".calc-display{flex:0 0 auto;padding:1em 0.8em 0.4em;text-align:right;font-family:'SF Pro Display','SF Pro Text',-apple-system,sans-serif;font-size:42px;font-weight:200;letter-spacing:-0.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".calc-grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}",
            ".calc-btn{border:0;border-radius:50%;font:inherit;font-size:18px;font-weight:500;cursor:pointer;color:#fff;background:#5a5a5a;display:flex;align-items:center;justify-content:center;aspect-ratio:1/1;transition:filter 100ms ease}",
            ".calc-btn:hover{filter:brightness(1.15)}",
            ".calc-btn:active{filter:brightness(1.3)}",
            ".calc-btn--util{background:#a5a5a5;color:#1d1d1f}",
            ".calc-btn--op{background:#ff9500;color:#fff}",
            ".calc-btn--zero{aspect-ratio:auto;grid-column:span 2;border-radius:9999px;justify-content:flex-start;padding-left:1.4em}",
            /* TextEdit */
            ".te-app{flex:1;min-height:0;display:flex;flex-direction:column;background:#fff;color:#1d1d1f}",
            "@media(prefers-color-scheme:dark){.te-app{background:#1d1d1f;color:#f5f5f7}}",
            ".te-app textarea{flex:1;min-height:0;background:transparent;border:0;color:inherit;font:inherit;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;line-height:1.5;padding:1.4em 2em;outline:none;resize:none}",
            /* Music */
            ".music-app{flex:1;min-height:0;display:flex;background:#1c1c1f;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',sans-serif}",
            ".music-side{width:210px;flex:0 0 210px;background:linear-gradient(180deg,rgba(252,92,125,0.12),rgba(28,28,32,0) 280px),#161618;border-right:1px solid rgba(255,255,255,0.06);overflow-y:auto;padding:14px 10px}",
            ".music-side__brand{display:flex;align-items:center;gap:8px;padding:2px 6px 14px;font-size:14px;font-weight:600;letter-spacing:-0.01em;color:#fc5c7d}",
            ".music-side__brand svg{width:20px;height:20px;display:block}",
            ".music-side__section{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(235,235,245,0.45);padding:14px 8px 4px}",
            ".music-side__item{display:flex;align-items:center;gap:9px;width:100%;padding:5px 8px;margin-bottom:1px;background:transparent;border:0;border-radius:6px;color:#f5f5f7;font:inherit;font-size:13px;text-align:left;cursor:pointer}",
            ".music-side__item:hover{background:rgba(255,255,255,0.06)}",
            ".music-side__item.is-active{background:#fc5c7d;color:#fff}",
            ".music-side__icon{display:inline-flex;width:16px;height:16px;flex:0 0 16px;align-items:center;justify-content:center;color:currentColor;opacity:0.85}",
            ".music-side__icon svg{width:100%;height:100%}",
            ".music-side__art{width:28px;height:28px;flex:0 0 28px;border-radius:4px;overflow:hidden;box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.18),0 1px 2px rgba(0,0,0,0.4)}",
            ".music-side__art svg,.music-side__art img{display:block;width:100%;height:100%;object-fit:cover}",
            ".music-side__sub{display:flex;flex-direction:column;min-width:0;line-height:1.2}",
            ".music-side__sub strong{font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
            ".music-side__sub span{font-size:11px;opacity:0.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
            ".music-side__item.is-active .music-side__sub span{opacity:0.85}",
            ".music-main{flex:1;min-width:0;display:flex;flex-direction:column;background:#0e0e10;overflow:hidden}",
            ".music-toolbar{display:flex;align-items:center;gap:10px;height:38px;flex:0 0 38px;padding:0 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12.5px;color:rgba(235,235,245,0.7)}",
            ".music-toolbar__nav{display:flex;gap:2px}",
            ".music-toolbar__nav button{width:24px;height:24px;border:0;background:transparent;border-radius:4px;color:inherit;font:inherit;cursor:default;font-size:14px;line-height:1;opacity:0.45}",
            ".music-toolbar__title{font-weight:600;color:#f5f5f7}",
            ".music-hero{display:flex;align-items:flex-end;gap:18px;padding:22px 22px 16px;flex:0 0 auto;position:relative;overflow:hidden}",
            ".music-hero::before{content:'';position:absolute;inset:0;background:var(--music-hero-bg,linear-gradient(160deg,#3a2410,#0e0e10));opacity:0.85;z-index:0}",
            ".music-hero::after{content:'';position:absolute;inset:0;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);background:rgba(14,14,16,0.45);z-index:0}",
            ".music-hero > *{position:relative;z-index:1}",
            ".music-hero__art{width:140px;height:140px;flex:0 0 140px;border-radius:8px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.55),inset 0 0 0 0.5px rgba(255,255,255,0.12)}",
            ".music-hero__art svg,.music-hero__art img{display:block;width:100%;height:100%;object-fit:cover}",
            ".music-hero__meta{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}",
            ".music-hero__kicker{font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(235,235,245,0.7)}",
            ".music-hero__title{margin:0;font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.05;color:#fff}",
            ".music-hero__sub{font-size:13px;color:rgba(235,235,245,0.75)}",
            ".music-hero__row{display:flex;gap:8px;margin-top:10px}",
            ".music-hero__btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;font-size:13px;font-weight:500;color:#1d1d1f;background:#fff;border:0;border-radius:999px;cursor:pointer}",
            ".music-hero__btn--ghost{background:rgba(255,255,255,0.16);color:#fff}",
            ".music-hero__btn svg{width:13px;height:13px}",
            ".music-stage{flex:1;min-height:0;display:flex;flex-direction:column;background:#000}",
            ".music-stage iframe{flex:1;min-height:0;width:100%;border:0;display:block}",
            /* Trash */
            ".trash-app{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2em;color:rgba(60,60,67,0.65)}",
            "@media(prefers-color-scheme:dark){.trash-app{color:rgba(235,235,245,0.55)}}",
            ".trash-app__icon{width:84px;height:84px;margin-bottom:0.7em;opacity:0.55}",
            ".trash-app__title{font-size:18px;font-weight:600;letter-spacing:-0.015em;color:inherit;margin:0 0 0.3em}",
            ".trash-app__sub{font-size:13px;margin:0;color:inherit;opacity:0.85}",
            ".trash-app__count{margin-top:1.2em;font-size:11.5px;font-family:'SF Mono',ui-monospace,Menlo,monospace;letter-spacing:0.02em;opacity:0.7}",
        ].join("");
        document.head.appendChild(s);
    }

    /* =================================================================
       Window framework
       ================================================================= */
    function createWindow(opts) {
        injectCSS();
        opts = opts || {};

        var win = el("div", {
            class: "app-window",
            role: "dialog",
            "aria-label": opts.title || "Window",
        });
        win.style.width = (opts.width || 720) + "px";
        win.style.height = (opts.height || 480) + "px";
        win.style.maxWidth = "calc(100vw - 24px)";
        win.style.maxHeight = "calc(100vh - 60px)";

        // Cascade position so multiple windows don't perfectly overlap
        var cascade = openWindows.length * 24;
        win.style.top = 80 + cascade + "px";
        win.style.left = "calc(50% - " + (opts.width || 720) / 2 + "px + " + cascade + "px)";

        var body = el("div", { class: "app-window__body" });
        if (opts.body) body.appendChild(opts.body);

        var lights = el("div", { class: "app-window__lights" }, [
            el("button", {
                class: "app-window__light app-window__light--close",
                type: "button",
                "aria-label": "Close",
                on: { click: function () { destroyWindow(win); } },
            }),
            el("span", { class: "app-window__light app-window__light--min", "aria-hidden": "true" }),
            el("span", { class: "app-window__light app-window__light--max", "aria-hidden": "true" }),
        ]);
        var titletext = el("span", { class: "app-window__title", text: opts.title || "" });
        var titlebar = el("div", { class: "app-window__titlebar" }, [lights, titletext]);

        win.appendChild(titlebar);
        win.appendChild(body);

        document.body.appendChild(win);
        openWindows.push(win);
        bringToFront(win);
        makeDraggable(win, titlebar);

        win.addEventListener("mousedown", function () { bringToFront(win); }, true);

        requestAnimationFrame(function () { win.classList.add("is-open"); });
        return { win: win, body: body };
    }

    function destroyWindow(win) {
        win.classList.remove("is-open");
        setTimeout(function () {
            if (win.parentNode) win.parentNode.removeChild(win);
            var i = openWindows.indexOf(win);
            if (i >= 0) openWindows.splice(i, 1);
        }, 180);
    }

    function bringToFront(win) {
        topZ++;
        win.style.zIndex = topZ;
    }

    function makeDraggable(win, titlebar) {
        var dragging = false;
        var ox = 0, oy = 0;
        var customPos = false;

        titlebar.addEventListener("mousedown", function (e) {
            if (e.target.closest(".app-window__light--close")) return;
            if (e.button !== 0) return;
            dragging = true;
            var rect = win.getBoundingClientRect();
            ox = e.clientX - rect.left;
            oy = e.clientY - rect.top;
            if (!customPos) {
                win.style.left = rect.left + "px";
                win.style.top = rect.top + "px";
                customPos = true;
            }
            titlebar.classList.add("is-dragging");
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
            e.preventDefault();
        });

        function onMove(e) {
            if (!dragging) return;
            var x = e.clientX - ox;
            var y = e.clientY - oy;
            var maxX = window.innerWidth - 60;
            var maxY = window.innerHeight - 38;
            var minX = -(win.offsetWidth - 80);
            var minY = 0;
            if (x < minX) x = minX;
            if (x > maxX) x = maxX;
            if (y < minY) y = minY;
            if (y > maxY) y = maxY;
            win.style.left = x + "px";
            win.style.top = y + "px";
        }
        function onUp() {
            dragging = false;
            titlebar.classList.remove("is-dragging");
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        }
    }

    var openWindows = [];

    /* =================================================================
       1. Terminal — JavaScript REPL
       ================================================================= */
    function openTerminal() {
        var output = el("div", { class: "term-output" });
        var prompt = el("span", { class: "term-prompt", text: "stoicswe@web ~ $ " });
        var input = el("input", {
            class: "term-input",
            type: "text",
            autocomplete: "off",
            autocapitalize: "off",
            spellcheck: false,
        });
        var inputLine = el("div", { class: "term-input-line" }, [prompt, input]);
        var app = el("div", { class: "term-app" }, [output, inputLine]);

        var w = createWindow({ title: "Terminal — JavaScript REPL", width: 680, height: 420, body: app });

        function line(text, cls) {
            var ln = document.createElement("span");
            ln.className = "term-line" + (cls ? " term-line--" + cls : "");
            ln.textContent = text + "\n";
            output.appendChild(ln);
            output.scrollTop = output.scrollHeight;
        }

        line("stoicswe — JavaScript REPL", "note");
        line("Type any JavaScript expression and press Enter. ↑ / ↓ for history.", "note");
        line("");

        var history = [];
        var histIdx = 0;
        var draft = "";

        function format(v) {
            if (v === undefined) return "undefined";
            if (v === null) return "null";
            if (typeof v === "string") return JSON.stringify(v);
            if (typeof v === "function") {
                var src = v.toString();
                return src.length > 200 ? src.slice(0, 200) + "…" : src;
            }
            if (typeof v === "object") {
                try {
                    var seen = new WeakSet();
                    return JSON.stringify(
                        v,
                        function (k, val) {
                            if (typeof val === "object" && val !== null) {
                                if (seen.has(val)) return "[Circular]";
                                seen.add(val);
                            }
                            if (val instanceof Element) return "<" + val.tagName.toLowerCase() + ">";
                            return val;
                        },
                        2
                    );
                } catch (e) {
                    return String(v);
                }
            }
            return String(v);
        }

        // Indirect eval — runs in global scope so `window`, `document`, etc. work naturally.
        var globalEval = (0, eval);

        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                var cmd = input.value;
                input.value = "";
                if (!cmd.trim()) {
                    line("stoicswe@web ~ $ ");
                    return;
                }
                history.push(cmd);
                histIdx = history.length;
                line("stoicswe@web ~ $ " + cmd, "cmd");
                try {
                    var r = globalEval(cmd);
                    if (r !== undefined) line(format(r), "res");
                } catch (err) {
                    line(String(err), "err");
                }
            } else if (e.key === "ArrowUp") {
                if (histIdx === history.length) draft = input.value;
                if (histIdx > 0) {
                    histIdx--;
                    input.value = history[histIdx];
                    setTimeout(function () {
                        input.setSelectionRange(input.value.length, input.value.length);
                    }, 0);
                }
                e.preventDefault();
            } else if (e.key === "ArrowDown") {
                if (histIdx < history.length) histIdx++;
                input.value = histIdx >= history.length ? draft : history[histIdx];
                e.preventDefault();
            } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
                output.innerHTML = "";
                e.preventDefault();
            }
        });

        // Auto-focus when window or output is clicked
        w.win.addEventListener("click", function (e) {
            if (e.target.closest(".app-window__light--close")) return;
            input.focus();
        });
        setTimeout(function () { input.focus(); }, 100);
    }

    /* =================================================================
       2. Finder — virtual filesystem mirroring the deployed site
       ================================================================= */
    var YT_RICK =
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1";

    var FS = {
        type: "dir",
        children: {
            home: {
                type: "dir",
                children: {
                    stoicswe: {
                        type: "dir",
                        children: {
                            Documents: { type: "dir", children: {} },
                            Photos: {
                                type: "dir",
                                children: {
                                    "IDG_20250629_081407_862.jpg": { type: "image", url: "/assets/images/salem/IDG_20250629_081407_862.jpg" },
                                    "IMG_0193.jpeg": { type: "image", url: "/assets/images/salem/IMG_0193.jpeg" },
                                    "IMG_0266.jpeg": { type: "image", url: "/assets/images/salem/IMG_0266.jpeg" },
                                    "IMG_1585.jpeg": { type: "image", url: "/assets/images/salem/IMG_1585.jpeg" },
                                    "IMG_1689.jpeg": { type: "image", url: "/assets/images/salem/IMG_1689.jpeg" },
                                    "IMG_2050.jpeg": { type: "image", url: "/assets/images/salem/IMG_2050.jpeg" },
                                    "IMG_2386.jpeg": { type: "image", url: "/assets/images/salem/IMG_2386.jpeg" },
                                    "IMG_2492.jpeg": { type: "image", url: "/assets/images/salem/IMG_2492.jpeg" },
                                    "IMG_2516.jpeg": { type: "image", url: "/assets/images/salem/IMG_2516.jpeg" },
                                    "IMG_2667.jpeg": { type: "image", url: "/assets/images/salem/IMG_2667.jpeg" },
                                },
                            },
                            Music: { type: "dir", children: {} },
                            Videos: {
                                type: "dir",
                                children: {
                                    "private — DO NOT SHARE.mp4": {
                                        type: "video",
                                        url: YT_RICK,
                                    },
                                },
                            },
                            "index.html": { type: "file", url: "/" },
                            "sitemap.xml": { type: "file", url: "/sitemap.xml" },
                            "feed.xml": { type: "file", url: "/feed.xml" },
                            "robots.txt": { type: "file", url: "/robots.txt" },
                            assets: {
                                type: "dir",
                                children: {
                                    css: {
                                        type: "dir",
                                        children: {
                                            "main.css": { type: "file", url: "/assets/css/main.css" },
                                            "dark.css": { type: "file", url: "/assets/css/dark.css" },
                                        },
                                    },
                                    js: {
                                        type: "dir",
                                        children: {
                                            "apple-menu.js": { type: "file", url: "/assets/js/apple-menu.js" },
                                            "boot.js": { type: "file", url: "/assets/js/boot.js" },
                                            "system-settings.js": { type: "file", url: "/assets/js/system-settings.js" },
                                            "apps.js": { type: "file", url: "/assets/js/apps.js" },
                                        },
                                    },
                                    images: {
                                        type: "dir",
                                        children: {
                                            "freebsd.svg": { type: "image", url: "/assets/images/freebsd.svg" },
                                        },
                                    },
                                },
                            },
                            posts: {
                                type: "dir",
                                children: {
                                    "the-switch.html": { type: "file", url: "/2022/the-switch/" },
                                    "hello-world.html": { type: "file", url: "/2026/hello-world/" },
                                    "invisible-hand.html": { type: "file", url: "/2026/invisible-hand-cond/" },
                                },
                            },
                        },
                    },
                },
            },
            etc: {
                type: "dir",
                children: {
                    hostname: { type: "file", text: "stoicswe\n" },
                    passwd: {
                        type: "file",
                        text:
                            "root:x:0:0:root:/root:/bin/sh\n" +
                            "stoicswe:x:1000:1000:Nathaniel Knudsen:/home/stoicswe:/bin/sh\n" +
                            "tux:x:1001:1001:Tux:/home/tux:/bin/sh\n",
                    },
                    motd: {
                        type: "file",
                        text:
                            "FreeBSD 14.1-RELEASE-p3 (GENERIC)\n\nWelcome to stoicswe.com.\n",
                    },
                },
            },
        },
    };

    function getNode(path) {
        var parts = path.split("/").filter(Boolean);
        var node = FS;
        for (var i = 0; i < parts.length; i++) {
            if (!node.children || !node.children[parts[i]]) return null;
            node = node.children[parts[i]];
        }
        return node;
    }

    var ICONS_FS = {
        folder:
            '<svg viewBox="0 0 56 56"><path d="M5 14h14l3 3h28a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" fill="#5dadec"/><path d="M5 19h22l3 3h21a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V23a4 4 0 0 1 4-4z" fill="#7dc4f7" opacity="0.95"/></svg>',
        file:
            '<svg viewBox="0 0 56 56"><path d="M14 4h22l10 10v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="#fff" stroke="#bbb" stroke-width="1"/><path d="M36 4v8a2 2 0 0 0 2 2h8" fill="none" stroke="#bbb" stroke-width="1"/><path d="M16 24h24M16 28h24M16 32h24M16 36h18M16 40h22" stroke="#c4c4c4" stroke-width="1"/></svg>',
        video:
            '<svg viewBox="0 0 56 56"><path d="M14 4h22l10 10v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="#fff" stroke="#bbb" stroke-width="1"/><path d="M36 4v8a2 2 0 0 0 2 2h8" fill="none" stroke="#bbb" stroke-width="1"/><circle cx="28" cy="36" r="10" fill="#ff3b30"/><path d="M25 31l8 5-8 5z" fill="#fff"/></svg>',
        image:
            '<svg viewBox="0 0 56 56"><path d="M14 4h22l10 10v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="#fff" stroke="#bbb" stroke-width="1"/><path d="M36 4v8a2 2 0 0 0 2 2h8" fill="none" stroke="#bbb" stroke-width="1"/><circle cx="20" cy="28" r="2.5" fill="#ffb74d"/><path d="M14 44l8-10 6 6 8-12 10 16z" fill="#a8d8a8"/></svg>',
        sideHome:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1z"/></svg>',
        sideHd:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="17.5" cy="12" r="0.8" fill="currentColor"/></svg>',
        sideFolder:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 6h6l2 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/></svg>',
    };

    var FAVORITES = [
        { label: "Home", path: "/home/stoicswe", icon: "sideHome" },
        { label: "Documents", path: "/home/stoicswe/Documents", icon: "sideFolder" },
        { label: "Photos", path: "/home/stoicswe/Photos", icon: "sideFolder" },
        { label: "Music", path: "/home/stoicswe/Music", icon: "sideFolder" },
        { label: "Videos", path: "/home/stoicswe/Videos", icon: "sideFolder" },
    ];
    var LOCATIONS = [
        { label: "Macintosh HD", path: "/", icon: "sideHd" },
        { label: "etc", path: "/etc", icon: "sideFolder" },
    ];

    function openFinder() {
        var sidebar = el("nav", { class: "finder-sidebar", "aria-label": "Sidebar" });
        var grid = el("div", { class: "finder-grid" });
        var pathEl = el("span", { class: "finder-path", text: "/home/stoicswe" });
        var backBtn = el("button", { type: "button", "aria-label": "Back", text: "‹" });
        var fwdBtn = el("button", { type: "button", "aria-label": "Forward", text: "›" });
        var nav = el("div", { class: "finder-nav" }, [backBtn, fwdBtn]);
        var toolbar = el("div", { class: "finder-toolbar" }, [nav, pathEl]);
        var main = el("div", { class: "finder-main" }, [toolbar, grid]);
        var app = el("div", { class: "finder-app" }, [sidebar, main]);

        var w = createWindow({ title: "Finder", width: 760, height: 480, body: app });

        var historyStack = [];
        var futureStack = [];
        var current = "/home/stoicswe";

        function buildSidebar() {
            sidebar.innerHTML = "";
            sidebar.appendChild(el("div", { class: "finder-section", text: "Favorites" }));
            FAVORITES.forEach(function (f) { sidebar.appendChild(makeSideBtn(f)); });
            sidebar.appendChild(el("div", { class: "finder-section", text: "Locations" }));
            LOCATIONS.forEach(function (f) { sidebar.appendChild(makeSideBtn(f)); });
            updateActive();
        }
        function makeSideBtn(f) {
            var b = el("button", {
                class: "finder-side-item",
                type: "button",
                "data-path": f.path,
                on: { click: function () { go(f.path); } },
            });
            b.innerHTML =
                '<span class="finder-side-item__icon">' + ICONS_FS[f.icon] + "</span>" +
                '<span class="finder-side-item__label"></span>';
            b.querySelector(".finder-side-item__label").textContent = f.label;
            return b;
        }
        function updateActive() {
            var items = sidebar.querySelectorAll(".finder-side-item");
            items.forEach(function (i) {
                i.classList.toggle("is-active", i.getAttribute("data-path") === current);
            });
        }

        function render() {
            grid.innerHTML = "";
            pathEl.textContent = current;
            updateActive();
            backBtn.disabled = historyStack.length === 0;
            fwdBtn.disabled = futureStack.length === 0;

            var node = getNode(current);
            if (!node || node.type !== "dir") {
                grid.appendChild(el("div", { class: "finder-empty", text: "(Not a directory)" }));
                return;
            }
            var keys = Object.keys(node.children);
            if (keys.length === 0) {
                grid.appendChild(el("div", { class: "finder-empty", text: "This folder is empty." }));
                return;
            }
            // Folders first, alpha within each group
            keys.sort(function (a, b) {
                var na = node.children[a].type === "dir";
                var nb = node.children[b].type === "dir";
                if (na !== nb) return na ? -1 : 1;
                return a.localeCompare(b);
            });
            keys.forEach(function (name) {
                var child = node.children[name];
                var iconKey =
                    child.type === "dir"
                        ? "folder"
                        : child.type === "video"
                        ? "video"
                        : child.type === "image"
                        ? "image"
                        : "file";
                var btn = el("button", {
                    class: "finder-item",
                    type: "button",
                    on: {
                        click: function () { activate(child, name); },
                        dblclick: function () { activate(child, name); },
                    },
                });
                // Real photo thumbnail when we have a usable URL
                var iconHtml;
                if (child.type === "image" && child.url) {
                    iconHtml =
                        '<span class="finder-item__icon finder-item__icon--photo">' +
                        '<img loading="lazy" decoding="async" alt="" src="' +
                        child.url +
                        '"></span>';
                } else {
                    iconHtml = '<span class="finder-item__icon">' + ICONS_FS[iconKey] + "</span>";
                }
                btn.innerHTML = iconHtml + '<span class="finder-item__name"></span>';
                btn.querySelector(".finder-item__name").textContent = name;
                grid.appendChild(btn);
            });
        }

        function activate(child, name) {
            if (child.type === "dir") {
                var newPath = current === "/" ? "/" + name : current + "/" + name;
                go(newPath);
            } else if (child.type === "video") {
                window.open(child.url, "_blank", "noopener");
            } else if (child.type === "image") {
                openViewer(name, child);
            } else {
                openViewer(name, child);
            }
        }

        function go(path) {
            if (path === current) return;
            historyStack.push(current);
            futureStack.length = 0;
            current = path;
            render();
        }

        backBtn.addEventListener("click", function () {
            if (!historyStack.length) return;
            futureStack.push(current);
            current = historyStack.pop();
            render();
        });
        fwdBtn.addEventListener("click", function () {
            if (!futureStack.length) return;
            historyStack.push(current);
            current = futureStack.pop();
            render();
        });

        buildSidebar();
        render();
        return w;
    }

    /* File preview modal */
    function openViewer(name, node) {
        var bar = el("div", { class: "finder-viewer__bar" });
        var lights = el("div", { class: "app-window__lights" }, [
            el("button", {
                class: "app-window__light app-window__light--close",
                type: "button",
                "aria-label": "Close",
                on: { click: closeViewer },
            }),
            el("span", { class: "app-window__light app-window__light--min", "aria-hidden": "true" }),
            el("span", { class: "app-window__light app-window__light--max", "aria-hidden": "true" }),
        ]);
        var label = el("span", { class: "app-window__title", text: name });
        var path = el("span", { class: "finder-viewer__path", text: node.url || "" });
        bar.appendChild(lights);
        bar.appendChild(label);
        bar.appendChild(path);

        var body = el("div", { class: "finder-viewer__body" });
        var winEl = el("div", { class: "finder-viewer__win" }, [bar, body]);
        var modal = el(
            "div",
            {
                class: "finder-viewer",
                on: {
                    mousedown: function (e) { if (e.target === modal) closeViewer(); },
                },
            },
            [winEl]
        );
        document.body.appendChild(modal);
        requestAnimationFrame(function () { modal.classList.add("is-open"); });

        function closeViewer() {
            modal.classList.remove("is-open");
            setTimeout(function () { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 180);
            document.removeEventListener("keydown", onKey);
        }
        function onKey(e) { if (e.key === "Escape") closeViewer(); }
        document.addEventListener("keydown", onKey);

        if (node.type === "image" && node.url) {
            var img = el("img", { class: "finder-viewer__img", src: node.url, alt: name });
            body.appendChild(img);
            return;
        }

        // Text content: either inline or fetch
        if (node.text != null) {
            var pre = el("pre", { class: "finder-viewer__pre", text: node.text });
            body.appendChild(pre);
            return;
        }
        if (!node.url) {
            body.appendChild(el("div", { class: "finder-empty", text: "No preview available." }));
            return;
        }
        var loading = el("div", { class: "finder-empty", text: "Loading…" });
        body.appendChild(loading);
        fetch(node.url)
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.text();
            })
            .then(function (txt) {
                body.innerHTML = "";
                var pre = el("pre", { class: "finder-viewer__pre", text: txt });
                body.appendChild(pre);
            })
            .catch(function (err) {
                body.innerHTML = "";
                body.appendChild(el("div", { class: "finder-empty", text: "Could not load: " + err.message }));
            });
    }

    /* =================================================================
       3. Calculator — basic four-function
       ================================================================= */
    function openCalculator() {
        var display = el("div", { class: "calc-display", text: "0" });
        var grid = el("div", { class: "calc-grid" });

        var current = "0";
        var stored = null;
        var operator = null;
        var justEvaluated = false;

        function refresh() {
            display.textContent = current.length > 12 ? Number(current).toExponential(6) : current;
        }
        function clear() {
            current = "0";
            stored = null;
            operator = null;
            justEvaluated = false;
            refresh();
        }
        function inputDigit(d) {
            if (justEvaluated) {
                current = d;
                justEvaluated = false;
            } else if (current === "0") current = d;
            else current += d;
            refresh();
        }
        function inputDot() {
            if (justEvaluated) {
                current = "0.";
                justEvaluated = false;
                refresh();
                return;
            }
            if (current.indexOf(".") === -1) current += ".";
            refresh();
        }
        function setOp(op) {
            if (operator && stored !== null && !justEvaluated) compute();
            stored = parseFloat(current);
            operator = op;
            justEvaluated = true;
        }
        function compute() {
            if (operator == null || stored == null) return;
            var a = stored;
            var b = parseFloat(current);
            var r = 0;
            switch (operator) {
                case "+": r = a + b; break;
                case "-": r = a - b; break;
                case "*": r = a * b; break;
                case "/": r = b === 0 ? NaN : a / b; break;
            }
            current = isNaN(r) ? "Error" : String(parseFloat(r.toPrecision(12)));
            stored = null;
            operator = null;
            justEvaluated = true;
            refresh();
        }
        function negate() {
            if (current === "0") return;
            current = current.charAt(0) === "-" ? current.slice(1) : "-" + current;
            refresh();
        }
        function percent() {
            current = String(parseFloat(current) / 100);
            refresh();
        }

        var BUTTONS = [
            { l: "AC", c: "util", a: clear },
            { l: "+/−", c: "util", a: negate },
            { l: "%", c: "util", a: percent },
            { l: "÷", c: "op", a: function () { setOp("/"); } },
            { l: "7", a: function () { inputDigit("7"); } },
            { l: "8", a: function () { inputDigit("8"); } },
            { l: "9", a: function () { inputDigit("9"); } },
            { l: "×", c: "op", a: function () { setOp("*"); } },
            { l: "4", a: function () { inputDigit("4"); } },
            { l: "5", a: function () { inputDigit("5"); } },
            { l: "6", a: function () { inputDigit("6"); } },
            { l: "−", c: "op", a: function () { setOp("-"); } },
            { l: "1", a: function () { inputDigit("1"); } },
            { l: "2", a: function () { inputDigit("2"); } },
            { l: "3", a: function () { inputDigit("3"); } },
            { l: "+", c: "op", a: function () { setOp("+"); } },
            { l: "0", c: "zero", a: function () { inputDigit("0"); } },
            { l: ".", a: inputDot },
            { l: "=", c: "op", a: compute },
        ];

        BUTTONS.forEach(function (b) {
            var btn = el("button", {
                class: "calc-btn" + (b.c ? " calc-btn--" + b.c : ""),
                type: "button",
                text: b.l,
                on: { click: b.a },
            });
            grid.appendChild(btn);
        });

        var app = el("div", { class: "calc-app" }, [display, grid]);
        createWindow({ title: "Calculator", width: 240, height: 360, body: app });
    }

    /* =================================================================
       4. TextEdit — minimal editor (persists to localStorage)
       ================================================================= */
    function openTextEdit() {
        var KEY = "stoicswe-textedit";
        var ta = document.createElement("textarea");
        try {
            ta.value = localStorage.getItem(KEY) || "";
        } catch (e) {}
        ta.placeholder = "Untitled — start typing.";
        ta.addEventListener("input", function () {
            try { localStorage.setItem(KEY, ta.value); } catch (e) {}
        });
        var app = el("div", { class: "te-app" }, [ta]);
        createWindow({ title: "TextEdit", width: 560, height: 420, body: app });
        setTimeout(function () { ta.focus(); }, 100);
    }

    /* =================================================================
       5. Music — embedded YouTube player
       ================================================================= */
    /* Album cover artwork — JPGs the user dropped in /assets/images/albums/. */
    var ALBUM_ART = {
        "even-in-arcadia":
            '<img src="/assets/images/albums/even-in-arcadia.jpg" alt="Even in Arcadia" loading="lazy" decoding="async">',
        "take-me-back-to-eden":
            '<img src="/assets/images/albums/take-me-back-to-eden.jpg" alt="Take Me Back to Eden" loading="lazy" decoding="async">',
    };

    var ALBUMS = [
        {
            id: "even-in-arcadia",
            title: "Even in Arcadia",
            artist: "Sleep Token",
            year: "2025",
            heroBg: "linear-gradient(160deg,#5a2f12 0%,#1a0a04 70%)",
            embed:
                "https://www.youtube-nocookie.com/embed/videoseries?si=S_ef2ZsNJtrwIjQ4&list=OLAK5uy_l_AB0hNbkYRvgxt0i7wRwIyzEQ25KftGM",
        },
        {
            id: "take-me-back-to-eden",
            title: "Take Me Back to Eden",
            artist: "Sleep Token",
            year: "2023",
            heroBg: "linear-gradient(160deg,#bdb89f 0%,#2a2820 80%)",
            embed:
                "https://www.youtube-nocookie.com/embed/videoseries?si=OmT1gfPJj7V15l9S&list=OLAK5uy_kR2XaVymdtE2e0WXdnqYIViBNemh6_wT4",
        },
    ];

    function openMusic() {
        var SIDE_ICONS = {
            recent:
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
            note:
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="17.5" cy="16" r="2.5" fill="currentColor"/></svg>',
            album:
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/></svg>',
            artist:
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>',
            radio:
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9"/></svg>',
            heart:
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.4-9.3-9.3A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5.7C19 16.6 12 21 12 21z"/></svg>',
        };

        var brand = el("div", { class: "music-side__brand" });
        brand.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<defs><linearGradient id="music-app-bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fc5c7d"/><stop offset="1" stop-color="#e02060"/></linearGradient></defs>' +
            '<rect x="2" y="3" width="20" height="18" rx="4.5" fill="url(#music-app-bg)"/>' +
            '<path d="M11 8.4l6.4-1.4v6.7" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<circle cx="9.6" cy="14.4" r="1.7" fill="#fff"/><circle cx="16" cy="13.7" r="1.7" fill="#fff"/></svg>' +
            "<span>Music</span>";

        var sidebar = el("nav", { class: "music-side", "aria-label": "Sidebar" }, [brand]);

        function decorativeRow(label, iconKey) {
            var b = el("button", { class: "music-side__item", type: "button" });
            b.innerHTML =
                '<span class="music-side__icon">' + SIDE_ICONS[iconKey] + "</span>" +
                '<span class="music-side__label"></span>';
            b.querySelector(".music-side__label").textContent = label;
            b.addEventListener("click", function () {
                /* Decorative — just shifts the active highlight so the row
                   reacts to clicks. The main view doesn't change because
                   we only have albums to show. */
                sidebar.querySelectorAll(".music-side__item").forEach(function (n) {
                    n.classList.remove("is-active");
                });
                b.classList.add("is-active");
            });
            return b;
        }

        sidebar.appendChild(el("div", { class: "music-side__section", text: "Library" }));
        sidebar.appendChild(decorativeRow("Recently Added", "recent"));
        sidebar.appendChild(decorativeRow("Songs",          "note"));
        sidebar.appendChild(decorativeRow("Albums",         "album"));
        sidebar.appendChild(decorativeRow("Artists",        "artist"));
        sidebar.appendChild(el("div", { class: "music-side__section", text: "Listen Now" }));
        sidebar.appendChild(decorativeRow("Listen Now", "heart"));
        sidebar.appendChild(decorativeRow("Radio",      "radio"));
        sidebar.appendChild(el("div", { class: "music-side__section", text: "Recently Played" }));

        var albumButtons = {};
        ALBUMS.forEach(function (album) {
            var btn = el("button", { class: "music-side__item", type: "button" });
            btn.innerHTML =
                '<span class="music-side__art">' + ALBUM_ART[album.id] + "</span>" +
                '<span class="music-side__sub"><strong></strong><span></span></span>';
            btn.querySelector(".music-side__sub strong").textContent = album.title;
            btn.querySelector(".music-side__sub span").textContent = album.artist;
            btn.addEventListener("click", function () { selectAlbum(album.id); });
            sidebar.appendChild(btn);
            albumButtons[album.id] = btn;
        });

        var nav = el("div", { class: "music-toolbar__nav" }, [
            el("button", { type: "button", "aria-label": "Back", text: "‹" }),
            el("button", { type: "button", "aria-label": "Forward", text: "›" }),
        ]);
        var toolbarTitle = el("span", { class: "music-toolbar__title", text: "" });
        var toolbar = el("div", { class: "music-toolbar" }, [nav, toolbarTitle]);

        var heroArt = el("div", { class: "music-hero__art" });
        var heroKicker = el("div", { class: "music-hero__kicker", text: "ALBUM" });
        var heroTitle = el("h2", { class: "music-hero__title", text: "" });
        var heroSub = el("div", { class: "music-hero__sub", text: "" });
        var playBtn = el("button", { class: "music-hero__btn", type: "button" });
        playBtn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>' +
            "<span>Play</span>";
        var shuffleBtn = el("button", { class: "music-hero__btn music-hero__btn--ghost", type: "button" });
        shuffleBtn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20l17-17"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>' +
            "<span>Shuffle</span>";
        var heroRow = el("div", { class: "music-hero__row" }, [playBtn, shuffleBtn]);
        var heroMeta = el("div", { class: "music-hero__meta" }, [heroKicker, heroTitle, heroSub, heroRow]);
        var hero = el("div", { class: "music-hero" }, [heroArt, heroMeta]);

        var iframe = document.createElement("iframe");
        iframe.title = "YouTube video player";
        iframe.frameBorder = "0";
        iframe.setAttribute(
            "allow",
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        iframe.allowFullscreen = true;

        var stage = el("div", { class: "music-stage" }, [iframe]);
        var main = el("div", { class: "music-main" }, [toolbar, hero, stage]);
        var app = el("div", { class: "music-app" }, [sidebar, main]);

        function selectAlbum(id) {
            var album = null;
            for (var i = 0; i < ALBUMS.length; i++) if (ALBUMS[i].id === id) { album = ALBUMS[i]; break; }
            if (!album) return;
            heroArt.innerHTML = ALBUM_ART[album.id];
            heroTitle.textContent = album.title;
            heroSub.textContent = album.artist + " · " + album.year + " · Album";
            toolbarTitle.textContent = album.title;
            hero.style.setProperty("--music-hero-bg", album.heroBg);
            iframe.src = album.embed;
            Object.keys(albumButtons).forEach(function (k) {
                albumButtons[k].classList.toggle("is-active", k === id);
            });
        }

        playBtn.addEventListener("click", function () {
            // Refocus the player area to encourage user gesture for autoplay.
            iframe.focus();
        });

        createWindow({ title: "Music", width: 940, height: 600, body: app });
        selectAlbum(ALBUMS[0].id);
    }

    /* =================================================================
       6. Trash — empty bin, Finder-style
       ================================================================= */
    function openTrash() {
        var icon = el("div", {
            class: "trash-app__icon",
            html:
                '<svg viewBox="0 0 56 56" aria-hidden="true">' +
                '<path d="M14 18h28l-2 30a4 4 0 0 1-4 3.7H20a4 4 0 0 1-4-3.7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
                '<path d="M10 14h36" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
                '<path d="M22 14V9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
                '<path d="M24 26v18M32 26v18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
                "</svg>",
        });
        var app = el("div", { class: "trash-app" }, [
            icon,
            el("h2", { class: "trash-app__title", text: "Trash is Empty" }),
            el("p", { class: "trash-app__sub", text: "There are no items in the Trash." }),
            el("div", { class: "trash-app__count", text: "0 items" }),
        ]);
        createWindow({ title: "Trash", width: 520, height: 340, body: app });
    }

    /* =================================================================
       Public API
       ================================================================= */
    window.StoicSweApps = {
        openTerminal: openTerminal,
        openFinder: openFinder,
        openCalculator: openCalculator,
        openTextEdit: openTextEdit,
        openMusic: openMusic,
        openTrash: openTrash,
    };
})();
