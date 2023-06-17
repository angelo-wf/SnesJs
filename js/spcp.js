
function SpcPlayer() {

  this.apu = new Apu(this);

  this.loadedFile = undefined;

  // TODO: having reset return if the file is valid is not optimal

  this.reset = function() {
    this.apu.reset();
    this.tags = {
      title: "",
      game: "",
      dumper: "",
      comment: "",
      artist: ""
    }
    if(this.loadedFile) {
      return this.parseSpc(this.loadedFile);
    } else {
      return false;
    }
  }
  this.reset();

  this.cycle = function() {
    this.apu.cycle();
  }

  this.runFrame = function() {
    // 17088 cycles per frame (32040 * 32 / 60)
    for(let i = 0; i < 17088; i++) {
      this.apu.cycle();
    }
  }

  this.setSamples = function(left, right, samples) {
    this.apu.setSamples(left, right, samples);
  }

  this.loadSpc = function(file) {
    this.loadedFile = file;
    return this.reset();
  }

  this.parseSpc = function(file) {
    this.apu.reset();
    if(file.length < 0x10200) {
      log("Invalid length");
      return false;
    }
    // identifier
    let identifier = "";
    for(let i = 0; i < 33; i++) {
      identifier += String.fromCharCode(file[i]);
    }
    if(identifier !== "SNES-SPC700 Sound File Data v0.30") {
      log("Unknown SPC header: " + identifier);
      return false;
    }

    // first 0x24 bytes: header and stuff
    this.apu.spc.br[0] = file[0x25] | (file[0x26] << 8);
    this.apu.spc.r[0] = file[0x27];
    this.apu.spc.r[1] = file[0x28];
    this.apu.spc.r[2] = file[0x29];
    this.apu.spc.r[3] = file[0x2b];
    this.apu.spc.setP(file[0x2a]);
    // title
    this.tags.title = "";
    for(let i = 0; i < 32; i++) {
      if(file[0x2e + i] === 0) {
        break;
      }
      this.tags.title += String.fromCharCode(file[0x2e + i]);
    }
    // game title
    this.tags.game = "";
    for(let i = 0; i < 32; i++) {
      if(file[0x4e + i] === 0) {
        break;
      }
      this.tags.game += String.fromCharCode(file[0x4e + i]);
    }
    // dumper
    this.tags.dumper = "";
    for(let i = 0; i < 16; i++) {
      if(file[0x6e + i] === 0) {
        break;
      }
      this.tags.dumper += String.fromCharCode(file[0x6e + i]);
    }
    // comment
    this.tags.comment = "";
    for(let i = 0; i < 32; i++) {
      if(file[0x7e + i] === 0) {
        break;
      }
      this.tags.comment += String.fromCharCode(file[0x7e + i]);
    }
    // artist (using byte at 0xd2 to sifferentiate text from binary)
    this.tags.artist = "";
    let artistOff = file[0xd2] === 0 ? 0xb0 : 0xb1;
    for(let i = 0; i < 32; i++) {
      if(file[artistOff + i] === 0) {
        break;
      }
      this.tags.artist += String.fromCharCode(file[artistOff + i]);
    }
    // set up ram
    for(let i = 0; i < 0x10000; i++) {
      this.apu.ram[i] = file[0x100 + i];
    }
    // set up SPC-side registers
    for(let i = 0; i < 16; i++) {
      if(i !== 3) {
        // don't write to the dsp-data register
        this.apu.write(0xf0 + i, file[0x1f0 + i]);
      }
    }
    // set up DSP registers
    for(let i = 0; i < 0x80; i++) {
      if(i !== 0x4c) {
        this.apu.dsp.write(i, file[0x10100 + i]);
      }
    }
    // write key-on last
    this.apu.dsp.write(0x4c, file[0x1014c]);
    // shadow ram
    for(let i = 0; i < 0x40; i++) {
      this.apu.ram[0xffc0 + i] = file[0x101c0 + i];
    }
    // set the read-registers equal to the write-registers
    this.apu.spcReadPorts[0] = this.apu.spcWritePorts[0];
    this.apu.spcReadPorts[1] = this.apu.spcWritePorts[1];
    this.apu.spcReadPorts[2] = this.apu.spcWritePorts[2];
    this.apu.spcReadPorts[3] = this.apu.spcWritePorts[3];

    return true;
  }
}
