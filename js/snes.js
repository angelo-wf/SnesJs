
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

    // for cpu-ports
    this.ramAdr = 0;

    this.hIrqEnabled = false;
    this.vIrqEnabled = false;
    this.nmiEnabled = false;
    this.hTimer = 0x1ff;
    this.vTimer = 0x1ff;
    this.inNmi = false;
    this.inIrq = false;
    this.inHblank = false;
    this.inVblank = false;

    this.autoJoyRead = false;
    this.autoJoyBusy = false;
    this.autoJoyTimer = 0;

    this.joypad1Val = 0;
    this.joypad2Val = 0;
    this.joypad1AutoRead = 0;
    this.joypad2AutoRead = 0;
    this.joypadStrobe = false;
    this.joypad1State = 0; // current button state
    this.joypad2State = 0; // current button state

    this.multiplyA = 0xff;
    this.divA = 0xffff;
    this.divResult = 0x101;
    this.mulResult = 0xfe01;

    this.fastMem = false;

  }
  this.reset();

  // cycle functions

  this.cycle = function() {

    if(this.joypadStrobe) {
      this.joypad1Val = this.joypad1State;
      this.joypad2Val = this.joypad2State;
    }

    if(this.xPos < 536 || this.xPos >= 576) {
      // the cpu is paused for 40 cycles starting around dot 536
      this.cpuCycle();
    }

    if(this.xPos === 0) {
      // this.ppu.renderLine(this.yPos);
    }

    if(this.yPos === this.vTimer && this.vIrqEnabled) {
      if(!this.hIrqEnabled) {
        // only v irq enabed
        if(this.xPos === 0) {
          this.inIrq = true;
          this.cpu.irqWanted = true;
        }
      } else {
        // v and h irq enabled
        if(this.xPos === (this.hTimer * 4)) {
          this.inIrq = true;
          this.cpu.irqWanted = true;
        }
      }
    } else if (
      this.xPos === (this.hTimer * 4)
      && this.hIrqEnabled && !this.vIrqEnabled
    ) {
      // only h irq enabled
      this.inIrq = true;
      this.cpu.irqWanted = true;
    }

    if(this.xPos === 1024) {
      // start of hblank
      this.inHblank = true;
    }
    if(this.xPos === 0) {
      // end of hblank
      this.inHblank = false;
    }
    // TODO: handle 239-line mode
    if(this.yPos === 225 && this.xPos === 0) {
      // start of vblank
      this.inNmi = true;
      this.inVblank = true;
      if(this.autoJoyRead) {
        this.autoJoyBusy = true;
        this.autoJoyTimer = 4224;
        this.doAutoJoyRead();
      }
      if(this.nmiEnabled) {
        this.cpu.nmiWanted = true;
      }
    }
    if(this.yPos === 0 && this.xPos === 0) {
      // end of vblank
      this.inNmi = false;
      this.inVblank = false;
    }

    if(this.autoJoyBusy) {
      this.autoJoyTimer -= 2; // loop only runs every second master cycle
      if(this.autoJoyTimer === 0) {
        this.autoJoyBusy = false;
      }
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
      // TODO: proper memory cycle timings, do all as 6 now,
      // to somewhat approximate correct timing for mem ops
      this.cpuCyclesLeft += (this.cpu.cyclesLeft - this.cpuMemOps) * 6;
    }
    this.cpuCyclesLeft--;
  }

  this.runFrame = function() {
    do {
      this.cycle();
    } while(!(this.xPos === 0 && this.yPos === 0));
  }

  this.doAutoJoyRead = function() {
    this.joypad1AutoRead = this.joypad1State;
    this.joypad2AutoRead = this.joypad2State;
  }

  // read and write handlers

  // TODO: open bus

  this.readReg = function(adr) {
    switch(adr) {
      case 0x4210: {
        let val = 0x1;
        val |= this.inNmi ? 0x80 : 0;
        this.inVNmi = false;
        return val;
      }
      case 0x4211: {
        let val = this.inIrq ? 0x80 : 0;
        this.inIrq = false;
        this.cpu.irqWanted = false;
        return val;
      }
      case 0x4212: {
        let val = this.autoJoyBusy ? 0x1 : 0;
        val |= this.inHblank ? 0x40 : 0;
        val |= this.inVblank ? 0x80 : 0;
        return val;
      }
      case 0x4213: {
        // IO read register
        return 0;
      }
      case 0x4214: {
        return this.divResult & 0xff;
      }
      case 0x4215: {
        return (this.divResult & 0xff00) >> 8;
      }
      case 0x4216: {
        return this.mulResult & 0xff;
      }
      case 0x4217: {
        return (this.mulResult & 0xff00) >> 8;
      }
      case 0x4218: {
        return this.joypad1AutoRead & 0xff;
      }
      case 0x4219: {
        return (this.joypad1AutoRead & 0xff00) >> 8;
      }
      case 0x421a: {
        return this.joypad2AutoRead & 0xff;
      }
      case 0x421b: {
        return (this.joypad2AutoRead & 0xff00) >> 8;
      }
      case 0x421c:
      case 0x421d:
      case 0x421e:
      case 0x421f: {
        // joypads 3 and 4 not emulated
        return 0;
      }
      // ..421f
    }

    if(adr >= 0x4300 && adr < 0x4380) {
      let channel = (adr & 0xf0) >> 4;
      switch(adr & 0xff0f) {
        case 0x4300: {
          // dma regs
          return 0;
        }
        // ..0x430c
      }
    }

    return 0;
  }

  this.writeReg = function(adr, value) {
    switch(adr) {
      case 0x4200: {
        this.autoJoyRead = (value & 0x1) > 0;
        this.vIrqEnabled = (value & 0x10) > 0;
        this.hIrqEnabled = (value & 0x20) > 0;
        this.nmiEnabled = (value & 0x80) > 0;
        return;
      }
      case 0x4201: {
        // IO port
        return;
      }
      case 0x4202: {
        this.multiplyA = value;
        return;
      }
      case 0x4203: {
        this.mulResult = this.multiplyA * value;
        return;
      }
      case 0x4204: {
        this.divA = (this.divA & 0xff00) | value;
        return;
      }
      case 0x4205: {
        this.divA = (this.divA & 0xff) | (value << 8);
        return;
      }
      case 0x4206: {
        this.divResult = (this.divA / value) & 0xffff;
        this.mulResult = this.divA % value;
        return;
      }
      case 0x4207: {
        this.hTimer = (this.hTimer & 0x100) | value;
        return;
      }
      case 0x4208: {
        this.hTimer = (this.hTimer & 0xff) | ((value & 0x1) << 8);
        return;
      }
      case 0x4209: {
        this.vTimer = (this.vTimer & 0x100) | value;
        return;
      }
      case 0x420a: {
        this.vTimer = (this.vTimer & 0xff) | ((value & 0x1) << 8);
        return;
      }
      case 0x420b: {
        // enable dma
        return;
      }
      case 0x420c: {
        // enable hdma
        return;
      }
      case 0x420d: {
        this.fastMem = (value & 0x1) > 0;
        return;
      }
    }

    if(adr >= 0x4300 && adr < 0x4380) {
      let channel = (adr & 0xf0) >> 4;
      switch(adr & 0xff0f) {
        case 0x4300: {
          // dma regs
          return;
        }
        // ..0x430c
      }
    }
  }

  this.readBBus = function(adr) {
    if(adr > 0x33 && adr < 0x40) {
      // return this.ppu.read(adr);
    }
    switch(adr) {
      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: {
        return this.apu.spcWritePorts[adr - 0x40];
      }
      case 0x80: {
        return this.ram[this.ramAdr];
      }
    }
    return 0; // rest not readable
  }

  this.writeBBus = function(adr, value) {
    if(adr < 0x34) {
      //this.ppu.write(adr, value);
      return;
    }
    switch(adr) {
      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: {
        this.apu.spcReadPorts[adr - 0x40] = value;
        return;
      }
      case 0x80: {
        this.ram[this.ramAdr] = value;
        return;
      }
      case 0x81: {
        this.ramAdr = (this.ramAdr & 0x1ff00) | value;
        return;
      }
      case 0x82: {
        this.ramAdr = (this.ramAdr & 0x100ff) | (value << 8);
        return;
      }
      case 0x83: {
        this.ramAdr = (this.ramAdr & 0x0ffff) | ((value & 1) << 16);
        return;
      }
    }
    return;
  }

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
      if(adr >= 0x2100 && adr < 0x2200) {
        return this.readBBus(adr & 0xff);
      }
      // old-style controller reads
      if(adr === 0x4016) {
        let val = this.joypad1Val & 0x1;
        this.joypad1Val >>= 1;
        return val;
      }
      if(adr === 0x4017) {
        let val = this.joypad2Val & 0x1;
        this.joypad2Val >>= 1;
        return val;
      }
      if(adr >= 0x4200 && adr < 0x4400) {
        return this.readReg(adr);
      }

      return 0; // not readable
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
      if(adr >= 0x2100 && adr < 0x2200) {
        this.writeBBus(adr & 0xff, value);
      }
      if(adr === 0x4016) {
        this.joypadStrobe = (value & 0x1) > 0;
      }
      if(adr >= 0x4200 && adr < 0x4400) {
        this.writeReg(adr, value);
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
