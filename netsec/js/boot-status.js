"use strict";
window.createBootStatus = function (config, root) {
    if (!config.bootStatus || config.visibleVm?.display !== "graphical") return null;
    const get = id => root ? root.querySelector(`[data-role="${id}"]`) : document.getElementById(id);
    const overlay = get("boot-overlay");
    const title = get("boot-stage");
    const detail = get("boot-detail");
    const progress = get("boot-progress");
    const elapsed = get("boot-elapsed");
    const assets = new Map(), started = new Set();
    const count = 1 + (config.hiddenVms?.length || 0), start = Date.now();
    let stage = 0, failed = false, ready = false, serial = "";
    const stages = ["Downloading lab images", "Starting virtual machines", "Starting the graphical desktop", "Opening the web application"];
    overlay.hidden = false;
    function advance(next) {
        if (failed || ready || next <= stage) return;
        stage = next;
        title.textContent = stages[stage];
        progress.hidden = true;
        detail.textContent = "Startup may take about two minutes. No login is required.";
    }
    function fail(message) {
        if (failed || ready) return;
        failed = true;
        title.textContent = "Lab startup needs attention";
        detail.textContent = message + " Open Terminal for diagnostics, or use Reset Lab to retry.";
        progress.hidden = true;
        clearInterval(timer);
    }
    const timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - start) / 1000);
        elapsed.textContent = `Elapsed: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
        if (seconds >= 180) detail.textContent = "Still starting. Slower computers can take longer. Open Terminal to check progress.";
    }, 1000);
    return {
        attach(emulator, id, visible) {
            emulator.add_listener("download-progress", event => {
                if (stage || failed || ready) return;
                assets.set(id + ":" + event.file_name, event.loaded || 0);
                const loaded = [...assets.values()].reduce((sum, n) => sum + n, 0);
                detail.textContent = `${(loaded / 1048576).toFixed(1)} MiB received. Startup may take about two minutes; no login is required.`;
                if (event.lengthComputable && event.total > 0) {
                    progress.max = event.total;
                    progress.value = event.loaded;
                } else progress.removeAttribute("value");
            });
            emulator.add_listener("emulator-started", () => {
                started.add(id);
                if (started.size === count) advance(1);
            });
            emulator.add_listener("download-error", event => fail(`Could not download ${event.file_name}. Check the server path and permissions.`));
            if (visible) emulator.add_listener("serial0-output-byte", byte => {
                serial = (serial + String.fromCharCode(byte)).slice(-512);
                for (const [marker, next] of [["desktop", 2], ["browser", 3]]) {
                    if (serial.includes("POLYLAB_BOOT:" + marker)) { advance(next); serial = ""; }
                }
                if (serial.includes("POLYLAB_BOOT:failed")) { fail("The guest could not open the application."); serial = ""; }
                if (!failed && serial.includes("POLYLAB_BOOT:ready")) {
                    ready = true;
                    clearInterval(timer);
                    overlay.hidden = true;
                    serial = "";
                }
            });
        }, fail
    };
};
