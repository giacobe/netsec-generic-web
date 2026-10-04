"use strict";

window.terminals = {};

window.TERMINAL_THEMES = {
    dark: {
        background: "#000000",
        foreground: "#f2f2f2",
        cursor: "#ffffff",
        cursorAccent: "#000000",
        selectionBackground: "#3a5fcd99",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#ffffff"
    },
    light: {
        background: "#ffffff",
        foreground: "#111111",
        cursor: "#000000",
        cursorAccent: "#ffffff",
        selectionBackground: "#99c2ff",
        black: "#000000",
        red: "#a80000",
        green: "#006b35",
        yellow: "#755b00",
        blue: "#004fc4",
        magenta: "#7a1f7a",
        cyan: "#006a78",
        white: "#d9d9d9",
        brightBlack: "#555555",
        brightRed: "#c40000",
        brightGreen: "#007a3d",
        brightYellow: "#806300",
        brightBlue: "#005bd8",
        brightMagenta: "#8a278a",
        brightCyan: "#00798a",
        brightWhite: "#ffffff"
    }
};

function initXterm(containerDiv, getEmulator) {
    if (!containerDiv) return;

    const term = new Terminal({
        cursorBlink: true,
        fontFamily: "'Fira Code', monospace",
        fontSize: 14,
        fontWeight: "400",
        fontWeightBold: "700",
        lineHeight: 1.15,
        letterSpacing: 0,
        scrollback: 5000,
        scrollOnUserInput: true,
        theme: window.TERMINAL_THEMES.dark
    });

    const fitAddon = new window.FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerDiv);
    
    requestAnimationFrame(() => {
        fitAddon.fit();
        setTimeout(() => fitAddon.fit(), 100);
    });
    window.addEventListener('resize', () => fitAddon.fit());

    containerDiv._fitAddon = fitAddon;

    term.onData(data => {
        const emu = getEmulator();
        if (emu) {
            if (typeof emu.serial0_send === 'function') {
                emu.serial0_send(data);
            } else if (emu.bus && typeof emu.bus.send === 'function') {
                emu.bus.send('serial0-input', data);
            }
        }
    });

    const waitId = setInterval(function () {
        const emu = getEmulator();
        if (emu && emu.bus) {
            clearInterval(waitId);
            const decoder = new TextDecoder("utf-8");
            emu.bus.register('serial0-output-byte', (char) => {
                const text = decoder.decode(Uint8Array.of(char), { stream: true });
                if (text) term.write(text);
            });
            emu.bus.register('serial0-output-string', (str) => term.write(str));
        }
    }, 100);

    window.terminals[containerDiv.id] = term;
    term.fit = () => fitAddon.fit();
    containerDiv.focus = () => term.focus();
}

window.startAnsiStripper = function(serialDiv, getEmulator) {
    if (serialDiv && serialDiv.tagName === 'DIV') initXterm(serialDiv, getEmulator);
};

window.enableSerialInput = function(serialDiv, getEmulator) {};
