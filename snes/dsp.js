
function Dsp(apu) {

  this.apu = apu;

  this.ram = new Uint8Array(0x80);

  this.samplesL = new Float64Array(534);
  this.samplesR = new Float64Array(534);
  this.sampleOffset = 0;

  this.oldMult = [0, 0.9375, 1.90625, 1.796875];
  this.olderMult = [0, 0, 0.9375, 0.8125];

  this.decodeBuffer = new Int16Array(16*8);

  this.reset = function() {
    clearArray(this.ram);

    clearArray(this.decodeBuffer);

    this.pitch = [0, 0, 0, 0, 0, 0, 0, 0];
    this.counter = [0, 0, 0, 0, 0, 0, 0, 0];

    this.srcn = [0, 0, 0, 0, 0, 0, 0, 0];
    this.decodeOffset = [0, 0, 0, 0, 0, 0, 0, 0];
    this.prevFlags = [0, 0, 0, 0, 0, 0, 0, 0];
    this.old = [0, 0, 0, 0, 0, 0, 0, 0];
    this.older = [0, 0, 0, 0, 0, 0, 0, 0];

    // temporary: 0 or 1
    this.gain = [0, 0, 0, 0, 0, 0, 0, 0];

    this.channelVolumeL = [0, 0, 0, 0, 0, 0, 0, 0];
    this.channelVolumeR = [0, 0, 0, 0, 0, 0, 0, 0];

    this.sampleOutL = [0, 0, 0, 0, 0, 0, 0, 0];
    this.sampleOutR = [0, 0, 0, 0, 0, 0, 0, 0];

    this.dirPage = 0;
  }
  this.reset();

  this.cycle = function() {

    let totalL = 0;
    let totalR = 0;
    for(let i = 0; i < 8; i++) {
      this.cycleChannel(i);
      totalL += this.sampleOutL[i];
      totalR += this.sampleOutR[i];
    }
    totalL /= 8;
    totalR /= 8;

    this.samplesL[this.sampleOffset] = totalL / 0x4000;
    this.samplesR[this.sampleOffset] = totalR / 0x4000;

    this.sampleOffset++;
    if(this.sampleOffset > 533) {
      // going past the buffer
      this.sampleOffset = 533;
    }
  }

  this.decodeBrr = function(ch) {
    if(this.prevFlags[ch] === 1 || this.prevFlags[ch] === 3) {
      let sampleAdr = (this.dirPage << 8) + (this.srcn[ch] * 4);
      let loopAdr = this.apu.ram[(sampleAdr + 2) & 0xffff];
      loopAdr |= this.apu.ram[(sampleAdr + 3) & 0xffff] << 8
      this.decodeOffset[ch] = loopAdr;
      if(this.prevFlags[ch] === 1) {
        this.gain[ch] = 0;
      }
    }
    let header = this.apu.ram[this.decodeOffset[ch]++];
    this.decodeOffset[ch] &= 0xffff;
    let shift = header >> 4;
    let filter = (header & 0xc) >> 2;
    this.prevFlags[ch] = header & 0x2;
    let byte = 0;
    for(let i = 0; i < 16; i++) {
      let s = byte & 0xf;
      if((i & 1) === 0) {
        byte = this.apu.ram[this.decodeOffset[ch]++];
        this.decodeOffset[ch] &= 0xffff;
        s = byte >> 4;
      }
      s = s > 7 ? s - 16 : s;
      if(shift < 0xc) {
        s = (s << shift) >> 1;
      } else {
        s = s < 0 ? -2048 : 2048;
      }
      s += this.old[ch] * this.oldMult[filter] - this.older[ch] * this.olderMult[filter];
      s = s > 0x7fff ? 0x7fff : s;
      s = s < -0x8000 ? -0x8000 : s;
      s = s > 0x3fff ? s - 0x8000 : s;
      s = s < -0x4000 ? s + 0x8000 : s;
      this.older[ch] = this.old[ch];
      this.old[ch] = s;
      this.decodeBuffer[ch * 16 + i] = s;
    }
  }

  this.get15asSigned = function(val) {
    if((val & 0x4000) > 0) {
      return -(0x8000 - val);
    }
    return val;
  }

  this.cycleChannel = function(ch) {
    // get the next sample
    this.counter[ch] += this.pitch[ch];
    //this.counter[ch] += 0x1000;
    if(this.counter[ch] > 0xffff) {
      // decode next brr sample
      this.decodeBrr(ch);
    }
    this.counter[ch] &= 0xffff;
    let sampleNum = this.counter[ch] >> 12;
    // get the sample out the decode buffer
    let sample = this.decodeBuffer[ch * 16 + sampleNum];
    this.sampleOutL[ch] = sample * this.gain[ch] * this.channelVolumeL[ch];
    this.sampleOutR[ch] = sample * this.gain[ch] * this.channelVolumeR[ch];
  }

  this.read = function(adr) {
    return this.ram[adr & 0x7f];
  }

  this.write = function(adr, value) {
    let channel = (adr & 0x70) >> 4;
    switch(adr) {
      case 0x0:
      case 0x10:
      case 0x20:
      case 0x30:
      case 0x40:
      case 0x50:
      case 0x60:
      case 0x70: {
        this.channelVolumeL[channel] = (value > 0x7f ? value - 0x100 : value) / 0x80;
        break;
      }
      case 0x1:
      case 0x11:
      case 0x21:
      case 0x31:
      case 0x41:
      case 0x51:
      case 0x61:
      case 0x71: {
        this.channelVolumeR[channel] = (value > 0x7f ? value - 0x100 : value) / 0x80;
        break;
      }
      case 0x2:
      case 0x12:
      case 0x22:
      case 0x32:
      case 0x42:
      case 0x52:
      case 0x62:
      case 0x72: {
        this.pitch[channel] &= 0x3f00;
        this.pitch[channel] |= value;
        break;
      }
      case 0x3:
      case 0x13:
      case 0x23:
      case 0x33:
      case 0x43:
      case 0x53:
      case 0x63:
      case 0x73: {
        this.pitch[channel] &= 0xff;
        this.pitch[channel] |= (value << 8) & 0x3f00;
        break;
      }
      case 0x4:
      case 0x14:
      case 0x24:
      case 0x34:
      case 0x44:
      case 0x54:
      case 0x64:
      case 0x74: {
        this.srcn[channel] = value;
        break;
      }
      case 0x4c: {
        let test = 1;
        for(let i = 0; i < 8; i++) {
          if((value & test) > 0) {
            this.prevFlags[i] = 0;
            let sampleAdr = (this.dirPage << 8) + (this.srcn[i] * 4);
            let startAdr = this.apu.ram[sampleAdr & 0xffff];
            startAdr |= this.apu.ram[(sampleAdr + 1) & 0xffff] << 8
            this.decodeOffset[i] = startAdr;
            this.gain[i] = 1;
          }
          test <<= 1;
        }
        break;
      }
      case 0x5c: {
        let test = 1;
        for(let i = 0; i < 8; i++) {
          if((value & test) > 0) {
            this.gain[i] = 0;
          }
          test <<= 1;
        }
        break;
      }
      case 0x5d: {
        this.dirPage = value;
        break;
      }
    }
    this.ram[adr & 0x7f] = value;
  }

}
