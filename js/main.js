

let mem = new MemHandler();
mem.memory[0] = 0x18; // CLC
mem.memory[1] = 0xfb; // XCE
mem.memory[2] = 0x78; // SEI
mem.memory[3] = 0xc2; // REP #38
mem.memory[4] = 0x38;
mem.memory[5] = 0xA2; // LDX #$1fff
mem.memory[6] = 0xff;
mem.memory[7] = 0x1f;
mem.memory[8] = 0x9a; // TXS

let cpu = new Cpu(mem);

let cycles = 0;

for(let i = 0; i < 100; i++) {
  do {
    cpu.cycle();
    cycles++;
  } while(cpu.cyclesLeft > 0);
  log(getTrace(cpu, cycles));
}

function MemHandler() {
  this.memory = new Uint8Array(0x10000);

  this.read = function(adr) {
    adr &= 0xffffff;
    return this.memory[adr & 0xffff];
  }

  this.write = function(adr, value) {
    adr &= 0xffffff;
    this.memory[adr & 0xffff] = value;
  }
}

function log(text) {
  el("log").innerHTML += text + "<br>";
  el("log").scrollTop = el("log").scrollHeight;
}

function getByteRep(val) {
  return ("0" + val.toString(16)).slice(-2).toUpperCase();
}

function getWordRep(val) {
  console.log(val);
  return ("000" + val.toString(16)).slice(-4).toUpperCase();
}

function getLongRep(val) {
  return ("00000" + val.toString(16)).slice(-6).toUpperCase();
}

function el(id) {
  return document.getElementById(id);
}
