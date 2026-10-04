const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function setup() {
  const elements = Object.fromEntries(['boot-overlay','boot-stage','boot-detail','boot-progress','boot-elapsed'].map(id => [id, {hidden:true,removeAttribute(name){delete this[name]}}]));
  const context = {window:{},document:{getElementById:id=>elements[id]},setInterval:()=>1,clearInterval(){},Date,Map,Set};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../js/boot-status.js'),'utf8'),context);
  const config = {bootStatus:true,visibleVm:{display:'graphical'},hiddenVms:[{}]};
  const status = context.window.createBootStatus(config);
  function guest(id, visible) {
    const handlers = {};
    status.attach({add_listener:(event,fn)=>handlers[event]=fn},id,visible);
    return {emit:(name,event)=>handlers[name]?.(event), marker(name){for(const byte of Buffer.from('POLYLAB_BOOT:'+name+'\n')) handlers['serial0-output-byte']?.(byte)}};
  }
  return {elements,status,client:guest('client',true),server:guest('server',false),context};
}
{
  const {elements:e,client,server,context} = setup();
  assert.equal(context.window.createBootStatus({}),null);
  client.emit('download-progress',{file_name:'client',loaded:10,total:20,lengthComputable:true});
  assert.equal(e['boot-progress'].value,10);
  client.emit('download-progress',{file_name:'unknown',loaded:5});
  assert.equal(e['boot-progress'].value,undefined);
  client.emit('emulator-started');
  assert.equal(e['boot-stage'].textContent,undefined);
  server.emit('emulator-started');
  assert.equal(e['boot-stage'].textContent,'Starting virtual machines');
  client.marker('desktop'); client.marker('browser');
  server.emit('emulator-started');
  assert.equal(e['boot-stage'].textContent,'Opening the web application');
  assert.equal(e['boot-overlay'].hidden,false);
  client.marker('ready');
  assert.equal(e['boot-overlay'].hidden,true);
  client.marker('failed');
  assert.equal(e['boot-overlay'].hidden,true);
}
{
  const {elements:e,client} = setup();
  client.emit('download-error',{file_name:'missing-rootfs'});
  assert.match(e['boot-detail'].textContent,/missing-rootfs/);
  client.marker('ready');
  assert.equal(e['boot-overlay'].hidden,false);
}
console.log('Measured downloads, staged readiness, serial-lab opt-out, and failure states passed.');
