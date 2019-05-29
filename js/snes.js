
function Snes() {

  this.cpu = new Cpu(this);

  this.apu = new Apu(this);

  this.ram = new Uint8Array(0x20000);

  this.cart = undefined;

  this.reset = function(hard) {
    if(hard) {
      clearArray(this.ram);
    }

    this.cpu.reset();
    this.apu.reset();

    this.xPos = 0;
    this.yPos = 0;
    this.frames = 0;

    this.cpuCyclesLeft = 0;
    this.cpuMemOps = 0;
  }
  this.reset();

  // cycle functions

  this.cycle = function() {
    if(this.xPos < 536 || this.xPos >= 576) {
      // the cpu is paused for 40 cycles starting around dot 536
      this.cpuCycle();
    }

    if(this.xPos === 0) {
      // this.ppu.renderLine(this.yPos);
    }

    // TODO: get better approximation for spc speed
    // this makes it run at 1068960 Hz
    if(this.xPos % 20 === 0) {
      this.apu.cycle();
    }

    // TODO: in non-intelace mode, line 240 on every odd frame is 1360 cycles
    // and in interlace mode, every even frame is 263 lines
    this.xPos += 2;
    if(this.xPos === 1364) {
      this.xPos = 0;
      this.yPos++;
      if(this.yPos === 262) {
        this.yPos = 0;
        this.frames++;
      }
    }
  }

  this.cpuCycle = function() {
    if(this.cpuCyclesLeft === 0) {
      this.cpu.cyclesLeft = 0;
      this.cpuMemOps = 0;
      this.cpu.cycle();
      // TODO: IntOp cycles take 6 master cycles, do as 8 now, to approximate
      // correct timing for mem ops
      this.cpuCyclesLeft += (this.cpu.cyclesLeft - this.cpuMemOps) * 8;
    }
    this.cpuCyclesLeft--;
  }

  this.runFrame = function() {
    do {
      this.cycle();
    } while(!(this.xPos === 0 && this.yPos === 0));
  }

  // read and write handlers

  this.read = function(adr) {
    adr &= 0xffffff;
    let bank = adr >> 16;
    adr &= 0xffff;
    if(bank === 0x7e || bank === 0x7f) {
      // banks 7e and 7f
      return this.ram[(bank & 0x1) | 0xffff];
    }
    if(adr < 0x8000 && (bank < 0x40 || (bank >= 0x80 && bank < 0xc0))) {
      // banks 00-3f, 80-bf, $0000-$7fff
      if(adr < 0x2000) {
        return this.ram[adr & 0x1fff];
      }
      return 0; // not implemented yet
    }
    return this.cart.read(bank, adr);
  }

  this.write = function(adr, value) {
    adr &= 0xffffff;
    //log("Written $" + getByteRep(value) + " to $" + getLongRep(adr));
    let bank = adr >> 16;
    adr &= 0xffff;
    if(bank === 0x7e || bank === 0x7f) {
      // banks 7e and 7f
      this.ram[(bank & 0x1) | 0xffff] = value;
    }
    if(adr < 0x8000 && (bank < 0x40 || (bank >= 0x80 && bank < 0xc0))) {
      // banks 00-3f, 80-bf, $0000-$7fff
      if(adr < 0x2000) {
        this.ram[adr & 0x1fff] = value;
      }
    }
    this.cart.write(bank, adr, value);
  }

  // rom loading and header parsing

  this.loadRom = function(rom) {
    if(rom.length % 0x8000 === 0) {
      // no copier header
      header = this.parseHeader(rom);
    } else if((rom.length - 512) % 0x8000 === 0) {
      // 512-byte copier header
      rom = Array.prototype.slice.call(rom, 512);
      header = this.parseHeader(rom);
    } else {
      log("Failed to load rom: Incorrect size - " + rom.length);
      return false;
    }
    if(header.type !== 0) {
      log("Failed to load rom: not LoRom, type = " + getByteRep(
        (header.speed << 4) | header.type
      ));
      return false;
    }
    this.cart = new Lorom(rom, header);
    log("Loaded rom: " + header.name);
    return true;
  }

  this.parseHeader = function(rom) {
    let str = "";
    for(let i = 0; i < 21; i++) {
      str += String.fromCharCode(rom[0x7fc0 + i]);
    }
    let header = {
      name: str,
      type: rom[0x7fd5] & 0xf,
      speed: rom[0x7fd5] >> 4,
      chips: rom[0x7fd6],
      romSize: 0x400 << rom[0x7fd7],
      ramSize: 0x400 << rom[0x7fd8]
    };
    return header;
  }

}
