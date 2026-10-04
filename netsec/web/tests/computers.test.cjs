const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element {
 constructor(id=''){this.id=id;this.dataset={};this.children=[];this.attrs={};this.events={};this.hidden=false;this.classList={add(){},toggle(){}};}
 setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k];}
 appendChild(e){this.children.push(e);return e;} prepend(e){this.children.unshift(e);} replaceWith(e){document.host=e;}
 querySelectorAll(){return this.children;} querySelector(s){return this.children.find(e=>s.includes('"'+e.dataset.role+'"'));}
 cloneNode(){let e=new Element(this.id);e.children=this.children.map(c=>new Element(c.id));return e;}
 addEventListener(k,fn){this.events[k]=fn;} focus(){document.activeElement=this;this.events.focus?.();}
}
const original=new Element('linux_container');
for(const id of ['linux_screen','linux_serial','vm-view-controls','btn-desktop','btn-terminal','btn-capture-mouse','mouse-capture-status','vm-load-error'])original.appendChild(new Element(id));
const elements={linux_container:original,panel_linux:new Element(), 'vm-label':new Element(),'vm-badge':new Element()};
const document={getElementById:id=>elements[id],createElement:()=>new Element(),addEventListener(){},exitPointerLock(){this.pointerLockElement=null;}};
const window={_terminalFontPx:14};let creations=0;
const context={window,document,createVM:()=>{creations++;return {keyboard_set_status(v){this.keyboard=v},mouse_set_status(v){this.mouse=v},add_listener(){}}},hiddenSerialElement(){},startAnsiStripper(e){e.history='preserved'},fitTerminalsSoon(){},setTerminalFontSize(){},wireNetworking(e){assert.equal(e.length,5)}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../../js/computers.js'),'utf8'),context);
window.startComputerLab({computers:Array.from({length:5},(_,i)=>({label:['Web Client','Web Server','CA','Windows','Router'][i],display:i%2?'serial':'graphical'}))});
const machines=window.computers;
assert.equal(creations,5);assert.equal(machines[0].panel.hidden,false);
assert.equal(machines[0].emulator.keyboard,true);assert.equal(machines[2].emulator.keyboard,false);
machines[1].tab.events.click();assert.equal(machines[0].panel.hidden,true);assert.equal(machines[1].panel.hidden,false);assert.equal(machines[0].emulator.keyboard,false);assert.equal(window.visibleEmulator,machines[1].emulator);
machines[0].tab.events.click();assert.equal(creations,5);assert.equal(machines[0].serial.history,'preserved');assert.equal(machines[0].emulator.keyboard,true);
machines[0].tab.focus();assert.equal(machines[0].emulator.keyboard,false);
machines[0].tab.events.keydown({key:'End',preventDefault(){}});assert.equal(machines[4].panel.hidden,false);assert.equal(machines[4].tab.attrs['aria-selected'],'true');
machines[4].screen.focus();assert.equal(machines[4].emulator.keyboard,true);
assert.throws(()=>window.startComputerLab({computers:Array(6).fill({})}),/one to five/);
console.log('Five mixed-interface tabs, retained state, keyboard navigation, and input isolation passed.');
