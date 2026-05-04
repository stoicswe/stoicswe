(function () {
    if (typeof document === "undefined") return;

    var DAEMON = "/assets/images/freebsd.svg";
    var AUTO_REBOOT_MS = 8000; // hold the panic on screen this long
    var FADE_TO_BLACK_MS = 2000; // slow blue→black bg/text fade
    var FINAL_FADE_MS = 1500; // panic-opacity fade revealing boot screen
    var DISMISS_READY_MS = 800; // ignore input briefly so the joke is readable
    var overlay = null;
    var savedOverflow = "";
    var dismissReady = false;
    var rebooting = false;
    var autoTimer = null;

    function injectCSS() {
        if (document.getElementById("panic-critical")) return;
        var s = document.createElement("style");
        s.id = "panic-critical";
        s.textContent = [
            ".panic{position:fixed;inset:0;z-index:9500;background:#0000aa;color:#ffffff;font-family:'Lucida Console','Consolas','SF Mono',ui-monospace,Menlo,Monaco,monospace;font-size:14px;line-height:1.45;padding:2.4em 3em 1.5em;overflow-y:auto;opacity:0;transition:opacity 180ms ease;-webkit-font-smoothing:antialiased}",
            ".panic.is-on{opacity:1}",
            "@media(max-width:640px){.panic{padding:1.4em 1.1em;font-size:12px}}",
            ".panic__head{display:flex;align-items:center;gap:1.1em;margin-bottom:1.4em}",
            ".panic__icon{width:64px;height:64px;flex:0 0 64px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));transition:opacity 1800ms ease}",
            ".panic__title{font-size:1.05em;font-weight:400;line-height:1.4;max-width:60ch}",
            ".panic p{margin:0 0 0.9em}",
            ".panic pre{margin:0 0 0.9em;font:inherit;white-space:pre-wrap;word-break:break-word;color:inherit}",
            ".panic em{font-style:normal;background:#ffffff;color:#0000aa;padding:0 4px;transition:background-color " + FADE_TO_BLACK_MS + "ms ease,color " + FADE_TO_BLACK_MS + "ms ease}",
            ".panic__caret{display:inline-block;width:0.55em;height:1em;background:#fff;vertical-align:-2px;margin-left:0.25em;animation:panicBlink 1s step-end infinite;transition:opacity 1200ms ease}",
            "@keyframes panicBlink{50%{opacity:0}}",
            /* Phase 1 — slow fade of background + text to black */
            ".panic.is-fading-to-black{transition:background-color " + FADE_TO_BLACK_MS + "ms ease,color " + FADE_TO_BLACK_MS + "ms ease;background:#000;color:#1a1a1a}",
            ".panic.is-fading-to-black .panic__icon{opacity:0}",
            ".panic.is-fading-to-black .panic__caret{opacity:0}",
            ".panic.is-fading-to-black em{background:#000;color:#000}",
            /* Phase 2 — panic itself fades out, revealing the boot screen below */
            ".panic.is-clearing{transition:opacity " + FINAL_FADE_MS + "ms ease;opacity:0}",
        ].join("");
        document.head.appendChild(s);
    }

    function buildContent() {
        var head =
            '<div class="panic__head">' +
            '<img class="panic__icon" src="' + DAEMON + '" alt="">' +
            '<div class="panic__title">A problem has been detected and your computer has been shut down to prevent damage to it.</div>' +
            "</div>";

        var stop = "<p><em>KERNEL_DATA_ABORT</em></p>";

        var advice =
            "<p>If this is the first time you have seen this panic screen, restart your computer. " +
            "If this screen appears again, follow these steps:</p>" +
            "<p>Boot into Safe Mode by holding Shift during startup.<br>" +
            "Disable any third-party kernel extensions installed via System Settings &gt; Privacy &amp; Security &gt; Login Items &amp; Extensions.<br>" +
            "Run hardware diagnostics by holding D during startup.<br>" +
            "Reset NVRAM by holding Option-Command-P-R during startup.</p>" +
            "<p>If problems continue, contact your hardware or software manufacturer.</p>" +
            "<p>Technical information:</p>";

        var dump = "<pre>" +
            "*** STOP: 0xFFFFFE002C8C2ADC (panic_trap, daemon_thread_t, page_fault, kheap_zalloc)\n\n" +
            "panic(cpu 0 caller 0xfffffe002c8c2adc): Kernel data abort.\n" +
            "at pc 0xfffffe002c91d004, lr 0xfffffe002c91d000 (saved state 0xfffffe600a5b3700)\n" +
            "\tx0:  0xfffffe2bcc1f5400  x1:  0x0000000000000000  x2:  0x0000000000000000  x3:  0x0000000000000000\n" +
            "\tx4:  0xfffffe2bcc1f5408  x5:  0x0000000000000000  x6:  0xfffffe2bcc1f5408  x7:  0x0000000000000000\n" +
            "\tx8:  0x000000019b3a0214  x9:  0x000000019b3a0210  x10: 0x0000000000000001  x11: 0x000000019b3a0218\n" +
            "\tfp:  0xfffffe600a5b3a30  lr:  0xfffffe002c91d000  sp:  0xfffffe600a5b3a20  pc:  0xfffffe002c91d004\n\n" +
            "Debugger message: panic\n" +
            "Memory ID: 0x6\n" +
            "OS release type: User\n" +
            "OS version: 26B45\n" +
            "Kernel version: Darwin Kernel Version 25.4.0: Sun May  3 18:24:11 PDT 2026; root:xnu-11417.121.6~2/RELEASE_ARM64_T6041\n" +
            "Fileset Kernelcache UUID: ABCDEF12-3456-7890-ABCD-EF1234567890\n" +
            "Kernel UUID: 0FE1B7DA-92AE-3B11-9E7F-FB35C3DC8B0F\n" +
            "iBoot version: iBoot-12345.0.0\n" +
            "secure boot?: YES\n" +
            "Paniclog version: 14\n" +
            "Kernel slide:     0x0000000028a08000\n" +
            "Kernel text base: 0xfffffe002aa08000\n" +
            "mach_absolute_time: 0x000123456789abcd\n\n" +
            "Process name corresponding to current thread (0xfffffe2bcc1f5400): WindowServer\n" +
            "Boot args: chunklist-security-epoch=0 -chunklist-no-rev2-dev\n" +
            "Mac OS version: 26.1 (Build 26B45)\n\n" +
            "Beginning dump of system memory.\n" +
            "Physical memory dump complete.\n" +
            "</pre>";

        var foot =
            '<p>Press any key or click to restart your computer.<span class="panic__caret"></span></p>';

        return head + stop + advice + dump + foot;
    }

    function show() {
        if (overlay) return;
        injectCSS();
        overlay = document.createElement("div");
        overlay.className = "panic";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-label", "Kernel panic");
        overlay.innerHTML = buildContent();
        document.body.appendChild(overlay);

        savedOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";

        dismissReady = false;
        rebooting = false;
        // Tiny delay so accidental clicks/keys at trigger time don't instantly
        // skip the joke before the user reads it.
        setTimeout(function () { dismissReady = true; }, DISMISS_READY_MS);

        // Auto-transition into the boot sequence after a few seconds.
        autoTimer = setTimeout(reboot, AUTO_REBOOT_MS);

        requestAnimationFrame(function () {
            if (overlay) overlay.classList.add("is-on");
        });

        document.addEventListener("keydown", onKey, true);
        overlay.addEventListener("click", function () {
            if (dismissReady) reboot();
        });
    }

    function onKey(e) {
        if (!dismissReady) return;
        e.preventDefault();
        e.stopPropagation();
        reboot();
    }

    function reboot() {
        if (rebooting) return;
        rebooting = true;
        if (autoTimer) {
            clearTimeout(autoTimer);
            autoTimer = null;
        }
        document.removeEventListener("keydown", onKey, true);

        // Phase 1 — start the slow blue-to-black fade of the panic itself
        // (background + text), AND simultaneously kick off boot.js's flow
        // (its blackout fades in beneath the panic; its boot screen mounts
        // at +1s and starts streaming dmesg lines hidden under us).
        if (overlay) overlay.classList.add("is-fading-to-black");
        if (window.StoicSweBoot && typeof window.StoicSweBoot.forceBoot === "function") {
            window.StoicSweBoot.forceBoot("restart");
        }

        // Phase 2 — once the panic is visually black, start fading the panic
        // *layer* out so the boot screen (already rendering underneath)
        // becomes visible gradually instead of snapping in.
        setTimeout(function () {
            if (overlay) overlay.classList.add("is-clearing");
        }, FADE_TO_BLACK_MS);

        // Remove the panic node from the DOM after the final fade completes.
        setTimeout(teardown, FADE_TO_BLACK_MS + FINAL_FADE_MS + 100);
    }

    function teardown() {
        if (!overlay) return;
        var n = overlay;
        overlay = null;
        if (n.parentNode) n.parentNode.removeChild(n);
        // boot.js owns the scroll lock from here; only restore our snapshot
        // if it isn't running.
        if (!window.StoicSweBoot || !rebooting) {
            document.documentElement.style.overflow = savedOverflow || "";
        }
    }

    window.StoicSwePanic = { show: show };
})();
