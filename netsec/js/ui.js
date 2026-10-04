"use strict";

window._labStartTime = null;
window._labTimerId = null;
window._activePanel = "guide";
window._guideFontPt = 12;
window._terminalFontPx = 14;

function updateStatus(message) {
    const status = document.getElementById("status");
    if (status) status.textContent = message;
}

function setActivePanel(which) {
    window._activePanel = which;
    const guidePanel = document.getElementById("guide-panel");
    const linuxPanel = document.getElementById("panel_linux");
    if (guidePanel) guidePanel.classList.toggle("active-panel", which === "guide");
    if (linuxPanel) linuxPanel.classList.toggle("active-panel", which === "linux");
}

function fitTerminalsSoon() {
    setTimeout(() => {
        Object.values(window.terminals || {}).forEach((term) => {
            if (term && typeof term.fit === "function") term.fit();
        });
    }, 100);
}

function toggleTheme() {
    const isLight = document.body.classList.toggle("light-theme");
    const button = document.getElementById("btn-theme");
    if (button) button.textContent = isLight ? "Dark Theme" : "Light Theme";

    Object.values(window.terminals || {}).forEach((term) => {
        term.options.theme = isLight
            ? window.TERMINAL_THEMES.light
            : window.TERMINAL_THEMES.dark;
    });
}

function setGuideFontSize(points) {
    window._guideFontPt = Math.min(18, Math.max(8, points));
    document.documentElement.style.setProperty("--guide-font-size", `${window._guideFontPt}pt`);

    const value = document.getElementById("guide-font-value");
    if (value) value.textContent = `${window._guideFontPt}pt`;
    document.getElementById("guide-font-decrease")?.toggleAttribute("disabled", window._guideFontPt <= 8);
    document.getElementById("guide-font-increase")?.toggleAttribute("disabled", window._guideFontPt >= 18);
}

function setTerminalFontSize(pixels) {
    window._terminalFontPx = Math.min(24, Math.max(10, pixels));

    Object.values(window.terminals || {}).forEach((term) => {
        term.options.fontSize = window._terminalFontPx;
        if (typeof term.fit === "function") term.fit();
    });

    const value = document.getElementById("terminal-font-value");
    if (value) value.textContent = `${window._terminalFontPx}px`;
    document.getElementById("terminal-font-decrease")?.toggleAttribute("disabled", window._terminalFontPx <= 10);
    document.getElementById("terminal-font-increase")?.toggleAttribute("disabled", window._terminalFontPx >= 24);
}

function setupPanelInteraction() {
    const guidePanel = document.getElementById("guide-panel");
    const guide = document.getElementById("guide-scroll");
    const linuxPanel = document.getElementById("panel_linux");
    const linuxContainer = document.getElementById("linux_container");

    guidePanel?.addEventListener("mousedown", () => setActivePanel("guide"));
    guide?.addEventListener("wheel", (event) => {
        setActivePanel("guide");
        event.preventDefault();
        event.stopPropagation();

        let delta = event.deltaY;
        if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 32;
        if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= Math.max(guide.clientHeight - 48, 120);
        guide.scrollTop += delta;
    }, { passive: false, capture: true });

    linuxPanel?.addEventListener("mousedown", () => setActivePanel("linux"));
    linuxContainer?.addEventListener("wheel", () => setActivePanel("linux"), { passive: true, capture: true });
    setActivePanel("guide");
}

function resetBothVMs() {
    if (!window.confirm("Restart both virtual machines from their original images?")) return;
    window.location.reload();
}

function elapsedString() {
    if (!window._labStartTime) return "00:00";
    const elapsed = Date.now() - window._labStartTime;
    const minutes = String(Math.floor(elapsed / 60000)).padStart(2, "0");
    const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function startLabTimer() {
    if (!window._labStartTime) window._labStartTime = Date.now();
    if (window._labTimerId) return;

    window._labTimerId = window.setInterval(() => {
        updateStatus(`LAB UPTIME: ${elapsedString()}`);
    }, 1000);
}

function openEndLab() {
    const overlay = document.getElementById("endlab-overlay");
    const display = document.getElementById("endlab-time-display");
    if (display) display.textContent = elapsedString();
    if (overlay) {
        overlay.classList.add("show");
        overlay.setAttribute("aria-hidden", "false");
    }
}

function closeEndLab() {
    const overlay = document.getElementById("endlab-overlay");
    if (overlay) {
        overlay.classList.remove("show");
        overlay.setAttribute("aria-hidden", "true");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-theme")?.addEventListener("click", toggleTheme);
    document.getElementById("btn-reset")?.addEventListener("click", resetBothVMs);
    document.getElementById("btn-endlab")?.addEventListener("click", openEndLab);
    document.getElementById("btn-back-to-lab")?.addEventListener("click", closeEndLab);
    document.getElementById("guide-font-decrease")?.addEventListener("click", () => setGuideFontSize(window._guideFontPt - 1));
    document.getElementById("guide-font-increase")?.addEventListener("click", () => setGuideFontSize(window._guideFontPt + 1));
    document.getElementById("terminal-font-decrease")?.addEventListener("click", () => setTerminalFontSize(window._terminalFontPx - 1));
    document.getElementById("terminal-font-increase")?.addEventListener("click", () => setTerminalFontSize(window._terminalFontPx + 1));

    document.getElementById("endlab-overlay")?.addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeEndLab();
    });

    const graphical = !window.NETSEC_LAB_CONFIG?.computers && window.NETSEC_LAB_CONFIG?.visibleVm?.display === "graphical";
    const screen = document.getElementById("linux_screen");
    const serial = document.getElementById("linux_serial");
    function selectView(desktop) {
        document.getElementById("linux_container").classList.toggle("terminal-view", !desktop);
        if (!desktop && document.pointerLockElement === screen) document.exitPointerLock();
        screen.hidden = !desktop;
        serial.hidden = desktop;
        window.visibleEmulator?.keyboard_set_status?.(desktop);
        window.visibleEmulator?.mouse_set_status?.(desktop);
        document.getElementById("btn-desktop")?.setAttribute("aria-pressed", String(desktop));
        document.getElementById("btn-terminal")?.setAttribute("aria-pressed", String(!desktop));
        if (desktop) screen.focus();
        else { serial.focus(); fitTerminalsSoon(); }
    }
    if (graphical) {
        document.getElementById("vm-view-controls").hidden = false;
        document.getElementById("linux_container").classList.add("graphical-vm");
        selectView(true);
        document.getElementById("btn-desktop").addEventListener("click", () => selectView(true));
        document.getElementById("btn-terminal").addEventListener("click", () => selectView(false));
        const capture = document.getElementById("btn-capture-mouse");
        const captureStatus = document.getElementById("mouse-capture-status");
        async function captureMouse() {
            if (document.pointerLockElement === screen) return;
            selectView(true);
            if (!screen.requestPointerLock) {
                captureStatus.textContent = "Mouse capture is unavailable in this browser.";
                return;
            }
            try { await screen.requestPointerLock(); }
            catch { captureStatus.textContent = "Mouse capture was blocked. Click Capture mouse to retry."; }
        }
        capture.addEventListener("click", captureMouse);
        screen.addEventListener("click", captureMouse);
        document.addEventListener("pointerlockchange", () => {
            const captured = document.pointerLockElement === screen;
            capture.setAttribute("aria-pressed", String(captured));
            captureStatus.textContent = captured ? "Mouse captured. Press Escape to release." : "Click the desktop to capture the mouse. Escape releases it.";
            if (captured) screen.focus();
        });
        document.addEventListener("pointerlockerror", () => {
            captureStatus.textContent = "Mouse capture was blocked. Click Capture mouse to retry.";
        });
    }
    document.getElementById("linux_container")?.addEventListener("mousedown", () => {
        if (!serial.hidden) serial.focus();
    });

    window.addEventListener("resize", fitTerminalsSoon);
    setupPanelInteraction();
    setGuideFontSize(12);
    setTerminalFontSize(14);
    startLabTimer();
});
