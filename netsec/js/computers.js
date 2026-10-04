"use strict";
window.startComputerLab = function (config) {
    if (!config.computers.length || config.computers.length > 5) throw new Error("Configure one to five computers.");
    const original = document.getElementById("linux_container");
    const section = document.getElementById("panel_linux");
    const tabs = document.createElement("div");
    tabs.className = "computer-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Exercise computers");
    section.prepend(tabs);
    const host = document.createElement("div");
    host.className = "computer-host";
    original.replaceWith(host);
    const machines = [];
    let active = -1;
    function syncInput() {
        machines.forEach((m, i) => {
            const enabled = i === active && m.desktop && document.activeElement?.getAttribute("role") !== "tab";
            m.emulator?.keyboard_set_status(enabled);
            m.emulator?.mouse_set_status(enabled);
        });
    }
    function select(index, focus = true) {
        if (document.pointerLockElement) document.exitPointerLock();
        active = index;
        machines.forEach((m, i) => {
            m.panel.hidden = i !== index;
            m.tab.setAttribute("aria-selected", String(i === index));
            m.tab.tabIndex = i === index ? 0 : -1;
        });
        const m = machines[index];
        window.visibleEmulator = m.emulator;
        document.getElementById("vm-label").textContent = m.config.label;
        document.getElementById("vm-badge").textContent = m.config.badge || "";
        section.setAttribute("aria-label", m.config.label);
        syncInput();
        fitTerminalsSoon();
        if (focus) (m.desktop ? m.screen : m.serial).focus();
    }
    config.computers.forEach((computer, index) => {
        const panel = original.cloneNode(true);
        panel.id = `computer-panel-${index}`;
        panel.classList.add("computer-panel");
        panel.hidden = true;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", `computer-tab-${index}`);
        panel.querySelectorAll("[id]").forEach(element => {
            element.dataset.role = element.id;
            element.id = `${element.id}-${index}`;
        });
        host.appendChild(panel);
        const get = id => panel.querySelector(`[data-role="${id}"]`);
        const tab = document.createElement("button");
        tab.id = `computer-tab-${index}`;
        tab.type = "button";
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", panel.id);
        tab.textContent = computer.label || `Computer ${index + 1}`;
        tabs.appendChild(tab);
        const m = {config: {...computer, label: tab.textContent}, panel, tab, screen: get("linux_screen"), serial: get("linux_serial"), desktop: computer.display === "graphical"};
        machines.push(m);
        const graphical = computer.display === "graphical";
        panel.classList.toggle("graphical-vm", graphical);
        get("vm-view-controls").hidden = !graphical;
        function view(desktop) {
            if (document.pointerLockElement === m.screen) document.exitPointerLock();
            m.desktop = graphical && desktop;
            m.screen.hidden = !m.desktop;
            m.serial.hidden = m.desktop;
            panel.classList.toggle("terminal-view", !m.desktop);
            get("btn-desktop").setAttribute("aria-pressed", String(m.desktop));
            get("btn-terminal").setAttribute("aria-pressed", String(!m.desktop));
            syncInput();
            if (active === index) { (m.desktop ? m.screen : m.serial).focus(); fitTerminalsSoon(); }
        }
        view(graphical);
        tab.addEventListener("focus", syncInput);
        m.screen.addEventListener("focus", syncInput);
        tab.addEventListener("click", () => select(index));
        tab.addEventListener("keydown", event => {
            let target;
            if (event.key === "ArrowRight") target = (index + 1) % machines.length;
            if (event.key === "ArrowLeft") target = (index + machines.length - 1) % machines.length;
            if (event.key === "Home") target = 0;
            if (event.key === "End") target = machines.length - 1;
            if (target !== undefined) { event.preventDefault(); select(target, false); machines[target].tab.focus(); }
        });
        get("btn-desktop").addEventListener("click", () => view(true));
        get("btn-terminal").addEventListener("click", () => view(false));
        const hint = get("mouse-capture-status");
        async function capture() {
            if (active !== index || document.pointerLockElement === m.screen) return;
            view(true);
            try {
                if (!m.screen.requestPointerLock) throw new Error();
                await m.screen.requestPointerLock();
            } catch { hint.textContent = "Mouse capture was blocked. Try Capture mouse."; }
        }
        m.screen.addEventListener("click", capture);
        get("btn-capture-mouse").addEventListener("click", capture);
        document.addEventListener("pointerlockchange", () => {
            const captured = document.pointerLockElement === m.screen;
            get("btn-capture-mouse").setAttribute("aria-pressed", String(captured));
            hint.textContent = captured ? "Mouse captured. Press Escape to release." : "Click the desktop to capture the mouse. Escape releases it.";
            if (captured) m.screen.focus();
        });
        document.addEventListener("pointerlockerror", () => { if (active === index) hint.textContent = "Mouse capture was blocked. Try Capture mouse."; });
        panel.addEventListener("mousedown", () => { if (!m.desktop) m.serial.focus(); });
        const boot = window.createBootStatus?.({bootStatus: computer.bootStatus ?? config.bootStatus, visibleVm: computer}, panel);
        try {
            m.emulator = createVM({...computer, screenContainer: graphical ? m.screen : null, serialContainer: hiddenSerialElement(`computer-${index}`)});
            boot?.attach(m.emulator, `computer-${index}`, true);
            m.emulator.add_listener("download-error", event => {
                const error = get("vm-load-error");
                error.hidden = false;
                error.textContent = `Could not load ${event.file_name}. Check the server path and permissions.`;
            });
            startAnsiStripper(m.serial, () => m.emulator);
        } catch (error) {
            boot?.fail(error.message);
            get("vm-load-error").hidden = false;
            get("vm-load-error").textContent = error.message;
        }
    });
    window.computers = machines;
    window.emulators = machines.map(m => m.emulator).filter(Boolean);
    wireNetworking(window.emulators);
    select(0, false);
    setTerminalFontSize(window._terminalFontPx);
};
