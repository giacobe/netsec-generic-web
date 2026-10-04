const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {window: {NETSEC_LAB_CONFIG: {}, addEventListener() {}}, V86: function(config) { this.config = config; }};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/vm-init.js'), 'utf8'), context);
const defaults = vm.runInContext('createVM({bzimage:"kernel",initrd:"rootfs"}).config', context);
assert.equal(defaults.memory_size, 256 * 1024 * 1024);
assert.equal(defaults.network_relay, null);
assert.equal(defaults.disable_keyboard, true);
assert.equal(defaults.disable_mouse, true);
assert.equal(defaults.bzimage.url, 'kernel');
context.screen = {};
const graphical = vm.runInContext('createVM({bzimage:"kernel",screenContainer:screen, memoryMiB:384,cmdline:"custom"}).config', context);
assert.equal(graphical.screen_container, context.screen);
assert.equal(graphical.disable_keyboard, false);
assert.equal(graphical.disable_mouse, false);
assert.equal(graphical.memory_size, 384 * 1024 * 1024);
assert.equal(graphical.cmdline, 'custom');
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/networking.js'), 'utf8'), context);
function guest() { return { listeners: {}, received: [], add_listener(name, fn) {this.listeners[name] = fn;}, bus: {send: (name, frame) => {}} }; }
const guests = Array.from({length:5}, guest);
guests.forEach(g => g.bus.send = (name, frame) => g.received.push({name, frame}));
context.guests = guests;
vm.runInContext('wireNetworking(guests)', context);
const frame = new Uint8Array([1,2,3]);
guests[0].listeners['net0-send'](frame);
assert.equal(guests[0].received.length, 0);
for (const g of guests.slice(1)) {assert.equal(g.received[0].name, 'net0-receive'); assert.equal(g.received[0].frame, frame);}
console.log('VM defaults, graphical overrides, and isolated Ethernet forwarding passed.');

const disk = vm.runInContext('createVM({v86Options:{hda:{url:"disk.img"}}}).config', context);
assert.equal(disk.hda.url, "disk.img");
assert.equal(disk.bzimage, undefined);
