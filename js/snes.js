
function Snes() {

  this.cpu = new Cpu(this);

  this.ram = new Uint8Array(0x20000);

  this.rom = undefined;

  this.reset = function(hard) {
    if(hard) {
      clearArray(this.ram);
    }

    this.cpu.reset();

    this.cycles = 0;
  }
  this.reset();

  this.loadRom = function(rom) {
    if(rom.length % 0x8000 === 0) {
      // no copier header
      this.rom = rom;
      this.parseHeader();
      return true;
    } else {
      log("Failed to load rom: incorrect size - " + rom.length);
      return false;
    }
  }

  this.parseHeader = function() {
    // read internal name
    let str = "";
    for(let i = 0; i < 21; i++) {
      str += String.fromCharCode(this.rom[0x7fc0 + i]);
    }
    log("Loaded rom \"" + str + "\"");
  }

  this.cycle = function() {
    this.cpu.cycle();
    this.cycles++;
  }

  this.read = function(adr) {
    adr &= 0xffffff;
    let bank = adr >> 16;
    if(bank === 0x7e || bank === 0x7f) {
      // banks 7e and 7f
      return this.ram[adr & 0x1ffff];
    }
    if(bank < 0x40) {
      // banks 00-3f
      if((adr & 0xffff) < 0x2000) {
        return this.ram[adr & 0x1fff];
      }
      if(adr >= 0x8000) {
        return this.rom[(bank >> 1) | (adr & 0x7fff)];
      }
    }
    if(bank < 0x80) {
      // banks 40-7d
      if(adr >= 0x8000) {
        return this.rom[(bank >> 1) | (adr & 0x7fff)];
      }
    }
    if(bank < 0xc0) {
      // banks 80-bf
      if((adr & 0xffff) < 0x2000) {
        return this.ram[adr & 0x1fff];
      }
      if(adr >= 0x8000) {
        return this.rom[((bank & 0x7f) >> 1) | (adr & 0x7fff)];
      }
    }
    // banks c0-ff
    if(adr >= 0x8000) {
      return this.rom[((bank & 0x7f) >> 1) | (adr & 0x7fff)];
    }
    // not implemented yet
    return 0;
  }

  this.write = function(adr, value) {
    adr &= 0xffffff;
    log("Written $" + getByteRep(value) + " to $" + getLongRep(adr));
    let bank = adr >> 16;
    if(bank === 0x7e || bank === 0x7f) {
      // banks 7e and 7f
      this.ram[adr & 0x1ffff] = value;
    }
    if(bank < 0x40) {
      // banks 00-3f
      if((adr & 0xffff) < 0x2000) {
        this.ram[adr & 0x1fff] = value;
      }
    }
    if(bank >= 0x80 && bank < 0xc0) {
      // banks 80-bf
      if((adr & 0xffff) < 0x2000) {
        this.ram[adr & 0x1fff] = value;
      }
    }
  }

}
