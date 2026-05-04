(function () {
    if (typeof document === "undefined") return;

    var widget, hourHand, minuteHand, secondHand, tzLabel;
    var tickTimer = null;

    function ready(fn) {
        if (document.readyState !== "loading") fn();
        else document.addEventListener("DOMContentLoaded", fn);
    }

    function injectCSS() {
        if (document.getElementById("clock-critical")) return;
        var s = document.createElement("style");
        s.id = "clock-critical";
        s.textContent = [
            /* Anchored to the page's upper-right margin, scrolls with content
               (position: absolute, not fixed). On viewports without a right
               margin to spare, hidden via media query below. */
            ".clock-widget{position:absolute;top:96px;right:24px;width:220px;z-index:90;background:rgba(246,246,248,0.92);-webkit-backdrop-filter:saturate(180%) blur(40px);backdrop-filter:saturate(180%) blur(40px);border:1px solid rgba(0,0,0,0.08);border-radius:12px;box-shadow:0 1px 0 rgba(255,255,255,0.6) inset,0 14px 36px rgba(0,0,0,0.18),0 4px 10px rgba(0,0,0,0.10);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',sans-serif;color:#1d1d1f;opacity:0;transition:opacity 200ms ease,transform 220ms cubic-bezier(0.2,0.7,0.2,1);transform:translateY(-6px) scale(0.985)}",
            ".clock-widget.is-on{opacity:1;transform:none}",
            "@media(prefers-color-scheme:dark){.clock-widget{background:rgba(28,28,32,0.85);color:#f5f5f7;border-color:rgba(255,255,255,0.08);box-shadow:0 1px 0 rgba(255,255,255,0.06) inset,0 14px 36px rgba(0,0,0,0.5),0 4px 10px rgba(0,0,0,0.3)}}",
            /* Hide on viewports without a right margin to spare */
            "@media(max-width:1279px){.clock-widget{display:none}}",
            ".clock-widget__titlebar{display:flex;align-items:center;height:32px;padding:0 10px;border-bottom:1px solid rgba(0,0,0,0.08);user-select:none;position:relative}",
            "@media(prefers-color-scheme:dark){.clock-widget__titlebar{border-bottom-color:rgba(255,255,255,0.08)}}",
            ".clock-widget__lights{display:flex;gap:6px;z-index:2}",
            ".clock-widget__light{width:11px;height:11px;border-radius:50%;border:0;padding:0;box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.18);cursor:default}",
            ".clock-widget__light--close{background:#ff5f57;cursor:pointer}",
            ".clock-widget__light--min{background:#febc2e}",
            ".clock-widget__light--max{background:#28c840}",
            ".clock-widget__title{position:absolute;left:50%;transform:translateX(-50%);font-size:12px;font-weight:600;letter-spacing:-0.005em;pointer-events:none}",
            ".clock-widget__body{padding:14px 12px 14px;text-align:center}",
            ".clock-widget__face{width:172px;height:172px;display:block;margin:0 auto 6px}",
            ".clock-widget__face-bg{fill:#fdfdf6;stroke:#1d1d1f;stroke-width:2}",
            "@media(prefers-color-scheme:dark){.clock-widget__face-bg{fill:#1a1a1e;stroke:#dcdcdc}}",
            ".clock-widget__tick--hour{stroke:#1d1d1f;stroke-width:2.4;stroke-linecap:round}",
            "@media(prefers-color-scheme:dark){.clock-widget__tick--hour{stroke:#dcdcdc}}",
            ".clock-widget__tick--min{stroke:#1d1d1f;stroke-width:1.1;stroke-linecap:round;opacity:0.55}",
            "@media(prefers-color-scheme:dark){.clock-widget__tick--min{stroke:#dcdcdc;opacity:0.45}}",
            ".clock-widget__hand{stroke-linecap:round;transform-origin:100px 100px;transform-box:fill-box}",
            ".clock-widget__hand--hour{stroke:#1d1d1f;stroke-width:5}",
            "@media(prefers-color-scheme:dark){.clock-widget__hand--hour{stroke:#dcdcdc}}",
            ".clock-widget__hand--minute{stroke:#1d1d1f;stroke-width:3}",
            "@media(prefers-color-scheme:dark){.clock-widget__hand--minute{stroke:#dcdcdc}}",
            ".clock-widget__hand--second{stroke:#cf2e2e;stroke-width:1.5}",
            ".clock-widget__pivot{fill:#cf2e2e;stroke:#1d1d1f;stroke-width:0.8}",
            "@media(prefers-color-scheme:dark){.clock-widget__pivot{stroke:#dcdcdc}}",
            ".clock-widget__tz{font-family:'SF Mono',ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:10.5px;color:rgba(60,60,67,0.72);letter-spacing:0.02em;line-height:1.4}",
            "@media(prefers-color-scheme:dark){.clock-widget__tz{color:rgba(235,235,245,0.65)}}",
            ".clock-widget__tz strong{display:block;color:inherit;font-weight:600;margin-bottom:1px}",
        ].join("");
        document.head.appendChild(s);
    }

    function buildTicks() {
        var out = "";
        for (var i = 0; i < 60; i++) {
            var isHour = i % 5 === 0;
            var cls = isHour ? "clock-widget__tick--hour" : "clock-widget__tick--min";
            var y2 = isHour ? 22 : 18;
            out +=
                '<line class="' +
                cls +
                '" x1="100" y1="14" x2="100" y2="' +
                y2 +
                '" transform="rotate(' +
                i * 6 +
                ' 100 100)"/>';
        }
        return out;
    }

    function buildWidget() {
        widget = document.createElement("div");
        widget.className = "clock-widget";
        widget.setAttribute("role", "complementary");
        widget.setAttribute("aria-label", "Analog clock");
        widget.innerHTML =
            '<div class="clock-widget__titlebar">' +
            '<div class="clock-widget__lights">' +
            '<button class="clock-widget__light clock-widget__light--close" type="button" aria-label="Close"></button>' +
            '<span class="clock-widget__light clock-widget__light--min" aria-hidden="true"></span>' +
            '<span class="clock-widget__light clock-widget__light--max" aria-hidden="true"></span>' +
            "</div>" +
            '<span class="clock-widget__title">Clock</span>' +
            "</div>" +
            '<div class="clock-widget__body">' +
            '<svg class="clock-widget__face" viewBox="0 0 200 200" aria-hidden="true">' +
            '<circle class="clock-widget__face-bg" cx="100" cy="100" r="92"/>' +
            buildTicks() +
            '<line class="clock-widget__hand clock-widget__hand--hour" x1="100" y1="100" x2="100" y2="50"/>' +
            '<line class="clock-widget__hand clock-widget__hand--minute" x1="100" y1="100" x2="100" y2="32"/>' +
            '<line class="clock-widget__hand clock-widget__hand--second" x1="100" y1="112" x2="100" y2="26"/>' +
            '<circle class="clock-widget__pivot" cx="100" cy="100" r="3.5"/>' +
            "</svg>" +
            '<div class="clock-widget__tz"><strong></strong><span></span></div>' +
            "</div>";

        document.body.appendChild(widget);
        hourHand = widget.querySelector(".clock-widget__hand--hour");
        minuteHand = widget.querySelector(".clock-widget__hand--minute");
        secondHand = widget.querySelector(".clock-widget__hand--second");
        tzLabel = widget.querySelector(".clock-widget__tz");

        // Close
        widget
            .querySelector(".clock-widget__light--close")
            .addEventListener("click", function () {
                if (tickTimer) clearInterval(tickTimer);
                tickTimer = null;
                widget.classList.remove("is-on");
                setTimeout(function () {
                    if (widget && widget.parentNode) widget.parentNode.removeChild(widget);
                    widget = null;
                }, 220);
            });

        requestAnimationFrame(function () {
            if (widget) widget.classList.add("is-on");
        });
    }

    function tick() {
        if (!widget) return;
        var d = new Date();
        var hours = d.getHours();
        var minutes = d.getMinutes();
        var seconds = d.getSeconds() + d.getMilliseconds() / 1000;

        var hourDeg = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
        var minuteDeg = (minutes + seconds / 60) * 6;
        var secondDeg = seconds * 6;

        hourHand.setAttribute("transform", "rotate(" + hourDeg + " 100 100)");
        minuteHand.setAttribute("transform", "rotate(" + minuteDeg + " 100 100)");
        secondHand.setAttribute("transform", "rotate(" + secondDeg + " 100 100)");

        // Refresh tz label (handles DST transitions over a long-running session)
        var tz = "UTC";
        try {
            tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch (e) {}
        var off = -d.getTimezoneOffset();
        var sign = off >= 0 ? "+" : "-";
        var abs = Math.abs(off);
        var hh = String(Math.floor(abs / 60));
        if (hh.length < 2) hh = "0" + hh;
        var mm = String(abs % 60);
        if (mm.length < 2) mm = "0" + mm;

        var strong = tzLabel.querySelector("strong");
        var span = tzLabel.querySelector("span");
        if (strong.textContent !== tz) strong.textContent = tz;
        var offText = "UTC" + sign + hh + ":" + mm;
        if (span.textContent !== offText) span.textContent = offText;
    }

    ready(function () {
        // Don't show if the viewport is too narrow — CSS hides it anyway,
        // but we can also avoid building the DOM at all on small screens.
        if (window.innerWidth < 1280) return;
        injectCSS();
        buildWidget();
        tick();
        tickTimer = setInterval(tick, 1000);
    });
})();
