(function () {
    if (typeof document === "undefined") return;

    var widget, hourHand, minuteHand, tzLabel;
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
            /* Anchored to the page's upper-right margin, scrolls with the
               page. Hidden when there's no margin to spare. */
            ".xclock{position:absolute;top:96px;right:24px;width:206px;z-index:90;background:#bdbdbd;border:1px solid #1d1d1f;box-shadow:1px 1px 0 #fff inset,-1px -1px 0 #6f6f6f inset,2px 3px 6px rgba(0,0,0,0.18);font-family:'Lucida Console','Consolas','SF Mono',ui-monospace,Menlo,Monaco,monospace;color:#1d1d1f;opacity:0;transition:opacity 200ms ease}",
            ".xclock.is-on{opacity:1}",
            "@media(max-width:1279px){.xclock{display:none}}",
            "@media(prefers-color-scheme:dark){.xclock{background:#3a3a3c;color:#f0f0f0;border-color:#0a0a0a;box-shadow:1px 1px 0 #5a5a5c inset,-1px -1px 0 #1a1a1c inset,2px 4px 10px rgba(0,0,0,0.45)}}",

            /* Motif-style title bar: gray with subtle bevel, simple controls */
            ".xclock__bar{display:flex;align-items:center;height:20px;padding:0 4px;background:linear-gradient(to bottom,#d4d4d4 0%,#b0b0b0 100%);border-bottom:1px solid #5f5f5f;font-size:11px;font-weight:700;letter-spacing:0.02em;user-select:none}",
            "@media(prefers-color-scheme:dark){.xclock__bar{background:linear-gradient(to bottom,#4a4a4c 0%,#2c2c2e 100%);border-bottom-color:#0a0a0a;color:#f0f0f0}}",
            ".xclock__title{flex:1;text-align:center;color:#1d1d1f}",
            "@media(prefers-color-scheme:dark){.xclock__title{color:#f0f0f0}}",
            ".xclock__controls{display:flex;gap:3px}",
            ".xclock__btn{width:14px;height:14px;border:1px solid #1d1d1f;background:#bdbdbd;padding:0;font:inherit;font-size:9px;font-weight:700;line-height:0;color:#1d1d1f;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:1px 1px 0 #fff inset,-1px -1px 0 #707070 inset}",
            ".xclock__btn:active{box-shadow:1px 1px 0 #707070 inset,-1px -1px 0 #fff inset}",
            "@media(prefers-color-scheme:dark){.xclock__btn{background:#3a3a3c;color:#f0f0f0;border-color:#0a0a0a;box-shadow:1px 1px 0 #5a5a5c inset,-1px -1px 0 #1a1a1c inset}}",

            /* Body — white face on padded gray frame */
            ".xclock__body{padding:8px;background:#bdbdbd}",
            "@media(prefers-color-scheme:dark){.xclock__body{background:#3a3a3c}}",
            ".xclock__face-frame{background:#ffffff;border:1px solid #1d1d1f;box-shadow:-1px -1px 0 #fff,1px 1px 0 #707070;padding:0}",
            "@media(prefers-color-scheme:dark){.xclock__face-frame{background:#0e0e10;border-color:#0a0a0a;box-shadow:-1px -1px 0 #5a5a5c,1px 1px 0 #1a1a1c}}",
            ".xclock__face{display:block;width:100%;height:auto}",
            ".xclock__ring{fill:#ffffff;stroke:#1d1d1f;stroke-width:1.5}",
            "@media(prefers-color-scheme:dark){.xclock__ring{fill:#0e0e10;stroke:#dcdcdc}}",
            ".xclock__tick{stroke:#1d1d1f;stroke-linecap:butt}",
            "@media(prefers-color-scheme:dark){.xclock__tick{stroke:#dcdcdc}}",
            ".xclock__hand{fill:#1d1d1f;stroke:none}",
            "@media(prefers-color-scheme:dark){.xclock__hand{fill:#dcdcdc}}",
            ".xclock__pivot{fill:#1d1d1f}",
            "@media(prefers-color-scheme:dark){.xclock__pivot{fill:#dcdcdc}}",

            /* Timezone footer — looks like part of the same Motif window */
            ".xclock__tz{padding:6px 8px 8px;background:#bdbdbd;text-align:center;font-size:10px;line-height:1.45;color:#1d1d1f;border-top:1px solid #6f6f6f;box-shadow:0 1px 0 #fff inset}",
            "@media(prefers-color-scheme:dark){.xclock__tz{background:#3a3a3c;color:#f0f0f0;border-top-color:#0a0a0a;box-shadow:0 1px 0 #5a5a5c inset}}",
            ".xclock__tz strong{display:block;font-weight:700;letter-spacing:0.01em;margin-bottom:1px}",
            ".xclock__tz span{opacity:0.78}",
        ].join("");
        document.head.appendChild(s);
    }

    function buildTicks() {
        // 60 uniform ticks; the cardinal four (12/3/6/9) are slightly thicker.
        var out = "";
        for (var i = 0; i < 60; i++) {
            var isCardinal = i % 15 === 0;
            var isHour = i % 5 === 0;
            var len = isHour ? 8 : 4;
            var width = isCardinal ? 2.4 : isHour ? 1.6 : 1;
            out +=
                '<line class="xclock__tick" x1="100" y1="6" x2="100" y2="' +
                (6 + len) +
                '" stroke-width="' +
                width +
                '" transform="rotate(' +
                i * 6 +
                ' 100 100)"/>';
        }
        return out;
    }

    function buildWidget() {
        widget = document.createElement("div");
        widget.className = "xclock";
        widget.setAttribute("role", "complementary");
        widget.setAttribute("aria-label", "xclock");
        widget.innerHTML =
            '<div class="xclock__bar">' +
            '<span class="xclock__title">xclock</span>' +
            '<div class="xclock__controls">' +
            '<button class="xclock__btn" type="button" aria-label="Minimize">_</button>' +
            '<button class="xclock__btn xclock__btn--close" type="button" aria-label="Close">×</button>' +
            "</div>" +
            "</div>" +
            '<div class="xclock__body">' +
            '<div class="xclock__face-frame">' +
            '<svg class="xclock__face" viewBox="0 0 200 200" aria-hidden="true">' +
            '<circle class="xclock__ring" cx="100" cy="100" r="94"/>' +
            buildTicks() +
            // Hour hand: short kite/diamond
            '<polygon class="xclock__hand xclock__hand--hour" points="100,55 105,100 100,108 95,100"/>' +
            // Minute hand: long, narrow kite
            '<polygon class="xclock__hand xclock__hand--minute" points="100,22 103,100 100,108 97,100"/>' +
            '<circle class="xclock__pivot" cx="100" cy="100" r="2.5"/>' +
            "</svg>" +
            "</div>" +
            "</div>" +
            '<div class="xclock__tz"><strong></strong><span></span></div>';

        document.body.appendChild(widget);
        hourHand = widget.querySelector(".xclock__hand--hour");
        minuteHand = widget.querySelector(".xclock__hand--minute");
        tzLabel = widget.querySelector(".xclock__tz");

        // Close button (red X) tears the widget down for the session
        widget.querySelector(".xclock__btn--close").addEventListener("click", function () {
            if (tickTimer) clearInterval(tickTimer);
            tickTimer = null;
            widget.classList.remove("is-on");
            var w = widget;
            widget = null;
            setTimeout(function () {
                if (w && w.parentNode) w.parentNode.removeChild(w);
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

        // Fractional rotations so the hour hand drifts smoothly over the hour
        // and the minute hand sweeps with seconds — feels closer to a real
        // analog mechanism than discrete ticks.
        var hourDeg = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
        var minuteDeg = (minutes + seconds / 60) * 6;

        // SVG attribute transform — rotation around explicit pivot (100,100).
        // No CSS transform-box / transform-origin involved (those break SVG
        // attribute rotations on bbox-zero elements like vertical lines).
        hourHand.setAttribute("transform", "rotate(" + hourDeg + " 100 100)");
        minuteHand.setAttribute("transform", "rotate(" + minuteDeg + " 100 100)");

        // Timezone label
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
        if (window.innerWidth < 1280) return;
        injectCSS();
        buildWidget();
        tick();
        tickTimer = setInterval(tick, 1000);
    });
})();
