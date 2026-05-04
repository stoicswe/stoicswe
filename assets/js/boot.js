(function () {
    if (typeof document === "undefined") return;

    var DAEMON = "/assets/images/freebsd.svg";
    var CORRECT_USER = "tux";
    var CORRECT_PASS = "tux";
    var COUNTDOWN_SECONDS = 5;

    var state = "idle";
    var dialog = null;
    var blackout = null;
    var bootScreen = null;
    var bootLines = null;
    var countdownTimer = null;
    var bootTimer = null;
    var savedOverflow = "";

    function el(tag, props, kids) {
        var n = document.createElement(tag);
        if (props)
            for (var k in props) {
                if (k === "class") n.className = props[k];
                else if (k === "text") n.textContent = props[k];
                else if (k === "html") n.innerHTML = props[k];
                else if (k === "on") {
                    for (var ev in props.on) n.addEventListener(ev, props.on[ev]);
                } else if (k.indexOf("aria-") === 0 || k === "role" || k === "tabindex") {
                    n.setAttribute(k, props[k]);
                } else n[k] = props[k];
            }
        if (kids)
            for (var i = 0; i < kids.length; i++) if (kids[i]) n.appendChild(kids[i]);
        return n;
    }

    function injectCSS() {
        if (document.getElementById("boot-critical")) return;
        var s = document.createElement("style");
        s.id = "boot-critical";
        s.textContent = [
            /* Shutdown dialog */
            ".boot-dialog{position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;pointer-events:none;transition:opacity 200ms ease;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',sans-serif}",
            ".boot-dialog.is-open{opacity:1;pointer-events:auto}",
            ".boot-dialog__win{width:400px;max-width:92vw;padding:1.6em 1.5em 1.1em;background:rgba(246,246,248,0.95);color:#1d1d1f;border:1px solid rgba(0,0,0,0.08);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.45),0 6px 14px rgba(0,0,0,0.25);text-align:center;transform:translateY(8px) scale(0.985);transition:transform 200ms cubic-bezier(0.2,0.7,0.2,1)}",
            ".boot-dialog.is-open .boot-dialog__win{transform:none}",
            "@media(prefers-color-scheme:dark){.boot-dialog__win{background:rgba(28,28,32,0.95);color:#f5f5f7;border-color:rgba(255,255,255,0.08)}}",
            ".boot-dialog__hero{width:62px;height:62px;margin:0 auto 0.8em;filter:drop-shadow(0 4px 14px rgba(0,0,0,0.18))}",
            ".boot-dialog__msg{font-size:1.02em;font-weight:600;margin:0 0 0.45em;letter-spacing:-0.01em}",
            ".boot-dialog__sub{font-size:0.88em;color:rgba(60,60,67,0.72);margin:0 0 1.3em}",
            "@media(prefers-color-scheme:dark){.boot-dialog__sub{color:rgba(235,235,245,0.65)}}",
            ".boot-dialog__actions{display:flex;gap:0.55em;justify-content:flex-end}",
            ".boot-dialog__btn{flex:1;padding:0.55em 1em;font-size:0.95em;font-weight:500;font-family:inherit;border:1px solid rgba(0,0,0,0.14);border-radius:8px;background:rgba(255,255,255,0.7);color:inherit;cursor:pointer}",
            "@media(prefers-color-scheme:dark){.boot-dialog__btn{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.16)}}",
            ".boot-dialog__btn:hover{filter:brightness(1.04)}",
            ".boot-dialog__btn--primary{background:#0071e3;color:#fff;border-color:transparent}",
            "@media(prefers-color-scheme:dark){.boot-dialog__btn--primary{background:#0a84ff}}",
            ".boot-dialog__btn--primary:hover{background:#0077ed}",
            /* Blackout */
            ".boot-blackout{position:fixed;inset:0;background:#000;z-index:9000;opacity:0;pointer-events:none;transition:opacity 800ms ease}",
            ".boot-blackout.is-on{opacity:1;pointer-events:auto}",
            ".boot-blackout.is-fading-out{opacity:0}",
            /* Boot screen */
            ".boot-screen{position:fixed;inset:0;z-index:9100;background:#000;color:#c8c8c8;font-family:'SF Mono',ui-monospace,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;line-height:1.45;padding:1.5em 1.4em 1em;display:flex;flex-direction:column;opacity:0;transition:opacity 400ms ease}",
            "@media(max-width:600px){.boot-screen{font-size:11px;padding:1em 0.8em}}",
            ".boot-screen.is-on{opacity:1}",
            ".boot-screen.is-fading-out{opacity:0}",
            ".boot-screen__logo{width:96px;height:96px;align-self:center;margin:0.5em auto 0.8em;filter:drop-shadow(0 0 14px rgba(255,80,60,0.45))}",
            ".boot-screen__lines{flex:1;margin:0;white-space:pre-wrap;word-break:break-word;color:#c8c8c8;font:inherit;background:transparent;border:0;padding:0;overflow-y:auto;overflow-x:hidden}",
            ".boot-screen__lines::-webkit-scrollbar{width:0;height:0}",
            ".boot-prompt{display:inline;color:#dcdcdc}",
            ".boot-prompt--err{color:#ff6b6b}",
            ".boot-prompt--ok{color:#7fdb7f}",
            ".boot-input{display:inline-block;background:transparent;border:0;color:#ffffff;font:inherit;outline:none;padding:0;margin:0;caret-color:#ffffff;min-width:1ch;width:40ch;max-width:60vw}",
            ".boot-input:focus{outline:none}",
            ".boot-cursor{display:inline-block;width:0.6ch;height:1em;background:#c8c8c8;vertical-align:-2px;margin-left:1px;animation:bootBlink 1s step-end infinite}",
            "@keyframes bootBlink{50%{opacity:0}}",
        ].join("");
        document.head.appendChild(s);
    }

    function lockScroll() {
        savedOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";
    }
    function unlockScroll() {
        document.documentElement.style.overflow = savedOverflow || "";
    }

    /* ---------------- 1. Shutdown / Restart dialog ---------------- */
    function showDialog(action) {
        if (state !== "idle") return;
        injectCSS();
        state = "dialog";

        var verb = action === "restart" ? "restart" : "shut down";
        var Verb = action === "restart" ? "Restart" : "Shut Down";
        var seconds = COUNTDOWN_SECONDS;

        var hero = el("img", { class: "boot-dialog__hero", src: DAEMON, alt: "" });
        var msg = el("p", {
            class: "boot-dialog__msg",
            text: "Are you sure you want to " + verb + " your computer now?",
        });
        var sub = el("p", {
            class: "boot-dialog__sub",
            text:
                "The computer will " +
                verb +
                " automatically in " +
                seconds +
                " seconds.",
        });

        function cancel() {
            if (countdownTimer) clearInterval(countdownTimer);
            countdownTimer = null;
            if (!dialog) return;
            dialog.classList.remove("is-open");
            setTimeout(function () {
                if (dialog && dialog.parentNode) dialog.parentNode.removeChild(dialog);
                dialog = null;
                state = "idle";
            }, 220);
        }

        function go() {
            if (countdownTimer) clearInterval(countdownTimer);
            countdownTimer = null;
            if (dialog && dialog.parentNode) dialog.parentNode.removeChild(dialog);
            dialog = null;
            startBlackout(action);
        }

        var cancelBtn = el("button", {
            class: "boot-dialog__btn",
            type: "button",
            text: "Cancel",
            on: { click: cancel },
        });
        var actionBtn = el("button", {
            class: "boot-dialog__btn boot-dialog__btn--primary",
            type: "button",
            text: Verb,
            on: { click: go },
        });

        var actions = el("div", { class: "boot-dialog__actions" }, [cancelBtn, actionBtn]);
        var win = el("div", { class: "boot-dialog__win", role: "dialog", "aria-label": Verb }, [
            hero,
            msg,
            sub,
            actions,
        ]);
        dialog = el("div", { class: "boot-dialog" }, [win]);
        document.body.appendChild(dialog);
        requestAnimationFrame(function () {
            dialog.classList.add("is-open");
            actionBtn.focus();
        });

        countdownTimer = setInterval(function () {
            seconds--;
            if (seconds <= 0) go();
            else
                sub.textContent =
                    "The computer will " +
                    verb +
                    " automatically in " +
                    seconds +
                    " second" +
                    (seconds === 1 ? "" : "s") +
                    ".";
        }, 1000);
    }

    /* ---------------- 2. Fade to black ---------------- */
    function startBlackout(action) {
        state = "fading";
        lockScroll();
        blackout = el("div", { class: "boot-blackout" });
        document.body.appendChild(blackout);
        requestAnimationFrame(function () {
            blackout.classList.add("is-on");
        });
        setTimeout(function () {
            startBoot(action);
        }, 1000);
    }

    /* ---------------- 3. Boot sequence ---------------- */
    var BOOT_LINES = [
        { t: 60, s: "" },
        { t: 40, s: "Consoles: internal video/keyboard" },
        { t: 40, s: "BIOS drive C: is disk0" },
        { t: 40, s: "BIOS 638kB/33554432kB available memory" },
        { t: 50, s: "" },
        { t: 50, s: "FreeBSD/amd64 bootstrap loader, Revision 1.1" },
        { t: 50, s: "(Mon May  4 06:18:42 UTC 2026 root@releng1.nyi.freebsd.org)" },
        { t: 60, s: "Loading /boot/defaults/loader.conf" },
        {
            t: 80,
            s: "/boot/kernel/kernel text=0x1c5b298 data=0x1ec040+0x4a3000 syms=[0x8+0x1d4290+0x8+0x1eb6a8]",
        },
        { t: 600, s: "" },
        { t: 30, s: "Hit [Enter] to boot immediately, or any other key for command prompt." },
        { t: 30, s: "Booting [/boot/kernel/kernel]..." },
        { t: 50, s: "" },
        { t: 50, s: "Copyright (c) 1992-2026 The FreeBSD Project." },
        {
            t: 50,
            s:
                "Copyright (c) 1979, 1980, 1983, 1986, 1988, 1989, 1991, 1992, 1993, 1994",
        },
        {
            t: 50,
            s: "    The Regents of the University of California. All rights reserved.",
        },
        { t: 50, s: "FreeBSD is a registered trademark of The FreeBSD Foundation." },
        { t: 60, s: "FreeBSD 14.1-RELEASE-p3 #0: Sun May  3 18:24:11 UTC 2026" },
        {
            t: 50,
            s: "    root@releng1.nyi.freebsd.org:/usr/obj/usr/src/amd64.amd64/sys/GENERIC amd64",
        },
        {
            t: 50,
            s:
                "FreeBSD clang version 18.1.5 (https://github.com/llvm/llvm-project.git)",
        },
        { t: 40, s: "VT(efifb): resolution 1920x1080" },
        {
            t: 50,
            s: "CPU: Intel(R) Core(TM) i9-13900K @ 5.80GHz (5800.00-MHz K8-class CPU)",
        },
        { t: 30, s: '  Origin="GenuineIntel"  Id=0xb0671  Family=0x6  Model=0xb7  Stepping=1' },
        { t: 40, s: "real memory  = 34359738368 (32768 MB)" },
        { t: 40, s: "avail memory = 32985083904 (31456 MB)" },
        { t: 50, s: "acpi0: <FREEBSD HW> on motherboard" },
        { t: 30, s: "ioapic0: <Version 2.0> irqs 0-119" },
        { t: 30, s: "pcib0: <ACPI Host-PCI bridge> on acpi0" },
        { t: 30, s: "pci0: <ACPI PCI bus> on pcib0" },
        { t: 30, s: "ahci0: <Intel SATA controller> at memory 0xfeb40000-0xfeb47fff irq 16" },
        { t: 30, s: "ada0 at ahci0 bus 0 scbus0 target 0 lun 0" },
        { t: 30, s: "ada0: <Samsung SSD 990 PRO 2TB> ATA-11 SATA 3.x device" },
        { t: 50, s: "em0: <Intel(R) PRO/1000 Network Connection 7.7.8> port 0xc000-0xc01f" },
        { t: 30, s: "em0: Ethernet address: 02:00:5e:00:53:01" },
        { t: 30, s: "ugen0.1: <Intel xHCI root hub> at usbus0" },
        { t: 60, s: "Trying to mount root from ufs:/dev/ada0p2 [rw,noatime]..." },
        { t: 200, s: "" },
        { t: 80, s: "Mounting local filesystems:." },
        { t: 80, s: "Setting hostname: stoicswe." },
        { t: 80, s: "Starting Network: lo0 em0." },
        { t: 50, s: "lo0: link state changed to UP" },
        { t: 50, s: "em0: link state changed to UP" },
        { t: 50, s: "random: harvesting attach, 8 bytes (4 bits) from em0" },
        { t: 60, s: "ELF ldconfig path: /lib /usr/lib /usr/lib/compat" },
        { t: 60, s: "Clearing /tmp." },
        { t: 80, s: "Starting devd." },
        { t: 80, s: "Starting routed." },
        { t: 80, s: "Updating motd:." },
        { t: 80, s: "Starting cron." },
        { t: 100, s: "Starting sshd." },
        { t: 100, s: "Performing sanity check on nginx configuration:" },
        {
            t: 60,
            s:
                "nginx: configuration file /usr/local/etc/nginx/nginx.conf test is successful",
        },
        { t: 100, s: "Starting nginx." },
        { t: 200, s: "[ OK ] Reached target Multi-User System." },
        { t: 200, s: "" },
        { t: 50, s: "FreeBSD/amd64 (stoicswe.com) (ttyv0)" },
        { t: 250, s: "" },
    ];

    function startBoot(action) {
        state = "booting";
        bootScreen = el("div", { class: "boot-screen" });
        var logo = el("img", { class: "boot-screen__logo", src: DAEMON, alt: "" });
        bootLines = el("div", { class: "boot-screen__lines" });
        bootScreen.appendChild(logo);
        bootScreen.appendChild(bootLines);
        document.body.appendChild(bootScreen);
        requestAnimationFrame(function () {
            bootScreen.classList.add("is-on");
        });

        var i = 0;
        function next() {
            if (i >= BOOT_LINES.length) {
                showLogin();
                return;
            }
            var line = BOOT_LINES[i++];
            bootLines.appendChild(document.createTextNode(line.s + "\n"));
            bootLines.scrollTop = bootLines.scrollHeight;
            bootTimer = setTimeout(next, line.t);
        }
        setTimeout(next, 600);
    }

    /* ---------------- 4. Login ---------------- */
    function appendText(text, cls) {
        var span = el("span", { class: cls || "boot-prompt" });
        span.textContent = text;
        bootLines.appendChild(span);
        bootLines.scrollTop = bootLines.scrollHeight;
        return span;
    }

    function promptLogin() {
        state = "loginUser";
        appendText("stoicswe login: ");
        var input = el("input", {
            class: "boot-input",
            type: "text",
            autocomplete: "off",
            autocapitalize: "off",
            spellcheck: false,
        });
        bootLines.appendChild(input);
        bootLines.scrollTop = bootLines.scrollHeight;
        setTimeout(function () {
            input.focus();
        }, 30);

        function onKey(e) {
            if (e.key !== "Enter") return;
            e.preventDefault();
            var typed = input.value;
            input.removeEventListener("keydown", onKey);
            if (input.parentNode) input.parentNode.removeChild(input);
            // Echo username
            appendText(typed + "\n");
            promptPassword(typed);
        }
        input.addEventListener("keydown", onKey);
    }

    function promptPassword(username) {
        state = "loginPass";
        appendText("Password: ");
        var input = el("input", {
            class: "boot-input",
            type: "password",
            autocomplete: "off",
        });
        bootLines.appendChild(input);
        bootLines.scrollTop = bootLines.scrollHeight;
        setTimeout(function () {
            input.focus();
        }, 30);

        function onKey(e) {
            if (e.key !== "Enter") return;
            e.preventDefault();
            var pw = input.value;
            input.removeEventListener("keydown", onKey);
            if (input.parentNode) input.parentNode.removeChild(input);
            // Don't echo password
            appendText("\n");

            if (username === CORRECT_USER && pw === CORRECT_PASS) {
                onLoginSuccess();
            } else {
                onLoginFail();
            }
        }
        input.addEventListener("keydown", onKey);
    }

    function onLoginFail() {
        appendText("Login incorrect\n\n", "boot-prompt boot-prompt--err");
        setTimeout(promptLogin, 600);
    }

    function onLoginSuccess() {
        var now = new Date();
        var stamp = now.toString().slice(0, 24);
        appendText("Last login: " + stamp + " on ttyv0\n");
        appendText(
            "FreeBSD 14.1-RELEASE-p3 (GENERIC) #0: Sun May  3 18:24:11 UTC 2026\n\n",
            "boot-prompt"
        );
        appendText("Welcome to FreeBSD!\n", "boot-prompt boot-prompt--ok");
        appendText("Restoring session", "boot-prompt");
        // Animated dots
        var dots = 0;
        var dotTimer = setInterval(function () {
            appendText(".");
            dots++;
            if (dots >= 3) {
                clearInterval(dotTimer);
                appendText("\n");
                setTimeout(fadeBack, 600);
            }
        }, 280);
    }

    function fadeBack() {
        state = "fadingBack";
        if (bootScreen) bootScreen.classList.add("is-fading-out");
        if (blackout) blackout.classList.add("is-fading-out");
        setTimeout(function () {
            if (bootScreen && bootScreen.parentNode)
                bootScreen.parentNode.removeChild(bootScreen);
            if (blackout && blackout.parentNode) blackout.parentNode.removeChild(blackout);
            bootScreen = null;
            blackout = null;
            bootLines = null;
            unlockScroll();
            state = "idle";
        }, 900);
    }

    function showLogin() {
        // Pause briefly so the last boot line settles
        setTimeout(promptLogin, 400);
    }

    /* ---------------- Public API ---------------- */
    function forceBoot(action) {
        // Skip the confirmation dialog and countdown — used when something
        // upstream (e.g. a kernel panic) has already decided we're rebooting.
        if (state !== "idle") return;
        injectCSS(); // critical: showDialog normally does this; skipping it
                     // would leave .boot-blackout / .boot-screen unstyled and
                     // the boot text would render as plain DOM over the page.
        startBlackout(action || "restart");
    }

    window.StoicSweBoot = {
        show: showDialog,
        forceBoot: forceBoot,
    };
})();
