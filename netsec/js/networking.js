"use strict";

function wireNetworking(emulators = window.emulators || []) {
    const active = emulators.filter(Boolean);

    active.forEach((sender) => {
        sender.add_listener("net0-send", (frame) => {
            active.forEach((receiver) => {
                if (receiver !== sender) receiver.bus.send("net0-receive", frame);
            });
        });
    });
}
