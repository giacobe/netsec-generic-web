"use strict";

function createVM({ screenContainer, serialContainer, bzimage, initrd, memoryMiB = 256, cmdline, v86Options = {} }) {
    const config = window.NETSEC_LAB_CONFIG || {};
    const assetBase = config.assetBase || "../";

    const emulator = new V86({
        ...v86Options,
        wasm_path: `${assetBase}lib/v86.wasm`,
        memory_size: memoryMiB * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        screen_container: screenContainer,
        disable_keyboard: !screenContainer,
        disable_mouse: !screenContainer,
        serial_container: serialContainer,
        use_worker: true,
        use_shared_memory: false,
        disable_speaker: true,
        network_relay: null,
        bios: v86Options.bios || { url: `${assetBase}bios/seabios.bin` },
        vga_bios: v86Options.vga_bios || { url: `${assetBase}bios/vgabios.bin` },
        ...(bzimage ? { bzimage: { url: bzimage }, cmdline: cmdline || "console=tty0 console=ttyS0,115200 loglevel=3 acpi=off noapic nolapic panic=-1 root=/dev/ram0 rw quiet net.ifnames=0 biosdevname=0" } : {}),
        ...(initrd ? { initrd: { url: initrd } } : {}),
        autostart: true
    });
    emulator.add_listener?.("download-error", (event) => {
        const error = document.getElementById("vm-load-error");
        if (error) {
            error.hidden = false;
            error.textContent = `A VM asset could not be loaded: ${event.file_name}. Verify the published images, then reset the lab.`;
        }
    });
    return emulator;
}

function hiddenSerialElement(name) {
    const serial = document.createElement("textarea");
    serial.setAttribute("aria-hidden", "true");
    serial.dataset.vm = name || "hidden";
    Object.assign(serial.style, {
        position: "absolute",
        width: "1px",
        height: "1px",
        opacity: "0",
        pointerEvents: "none",
        zIndex: "-1"
    });
    document.body.appendChild(serial);
    return serial;
}

window.addEventListener("load", () => {
    const config = window.NETSEC_LAB_CONFIG || {};
    if (Array.isArray(config.computers)) {
        window.startComputerLab(config);
        return;
    }
    const hiddenConfigs = Array.isArray(config.hiddenVms) ? config.hiddenVms : [];
    const visibleConfig = config.visibleVm || {};
    const linuxSerial = document.getElementById("linux_serial");
    const linuxContainer = document.getElementById("linux_container");
    const boot = window.createBootStatus?.(config);

    window.emulators = [];

    hiddenConfigs.forEach((vm, index) => {
        try {
            const emulator = createVM({
                ...vm,
                screenContainer: null,
                serialContainer: hiddenSerialElement(vm.name || `hidden-${index + 1}`),
                bzimage: vm.bzimage,
                initrd: vm.initrd
            });
            window.emulators.push(emulator);
            boot?.attach(emulator, `hidden-${index}`, false);
        } catch (error) {
            console.error(`Hidden VM ${vm.name || index + 1} error:`, error);
            boot?.fail(`Could not initialize ${vm.name || "the server"}: ${error.message}`);
        }
    });

    try {
        const emulator = createVM({
            ...visibleConfig,
            screenContainer: visibleConfig.display === "graphical" ? document.getElementById("linux_screen") : null,
            serialContainer: hiddenSerialElement("visible-serial-bridge"),
            bzimage: visibleConfig.bzimage,
            initrd: visibleConfig.initrd
        });
        window.emulators.push(emulator);
        window.visibleEmulator = emulator;
        boot?.attach(emulator, "client", true);
        enableSerialInput(linuxSerial, () => window.visibleEmulator);
        startAnsiStripper(linuxSerial, () => window.visibleEmulator);
    } catch (error) {
        console.error("Visible VM error:", error);
        boot?.fail(`Could not initialize the client: ${error.message}`);
    }

    window.emulator1 = window.emulators[0] || null;
    window.emulator2 = window.visibleEmulator || null;
    wireNetworking(window.emulators);
    setActivePanel("linux");
    if (linuxContainer) linuxContainer.addEventListener("mousedown", () => {
        if (!linuxSerial.hidden) linuxSerial.focus();
    });
    updateStatus("Booting VMs...");
});
