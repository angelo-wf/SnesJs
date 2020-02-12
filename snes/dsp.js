
function Dsp(apu) {

  this.apu = apu;

  this.ram = new Uint8Array(0x80);

  this.samplesL = new Float64Array(534);
  this.samplesR = new Float64Array(534);
  this.sampleOffset = 0;

  this.oldMult = [0, 0.9375, 1.90625, 1.796875];
  this.olderMult = [0, 0, 0.9375, 0.8125];
  this.rates = [
    0, 2048, 1536, 1280, 1024, 768, 640, 512,
    384, 320, 256, 192, 160, 128, 96, 80,
    64, 48, 40, 32, 24, 20, 16, 12,
    10, 8, 6, 5, 4, 3, 2, 1
  ];

  // decode buffer for BRR decoding
  this.decodeBuffer = new Int16Array(16*8);
  // attack rate, decay rate, sustain rate, release rate, gain rate
  this.rateNums = new Int16Array(5*8);

  this.reset = function() {
    clearArray(this.ram);

    clearArray(this.decodeBuffer);
    clearArray(this.rateNums);
    for(let i = 0; i < 8; i++) {
      this.rateNums[i * 5 + 3] = 1;
    }

    this.pitch = [0, 0, 0, 0, 0, 0, 0, 0];
    this.counter = [0, 0, 0, 0, 0, 0, 0, 0];

    this.srcn = [0, 0, 0, 0, 0, 0, 0, 0];
    this.decodeOffset = [0, 0, 0, 0, 0, 0, 0, 0];
    this.prevFlags = [0, 0, 0, 0, 0, 0, 0, 0];
    this.old = [0, 0, 0, 0, 0, 0, 0, 0];
    this.older = [0, 0, 0, 0, 0, 0, 0, 0];

    this.rateCounter = [0, 0, 0, 0, 0, 0, 0, 0];
    // 0: attack, 1: decay, 2: sustain, 3: release, 4: gain
    this.adsrState = [3, 3, 3, 3, 3, 3, 3, 3];
    this.sustainLevel = [0, 0, 0, 0, 0, 0, 0, 0];
    this.useGain = [false, false, false, false, false, false, false, false];
    this.gainMode = [0, 0, 0, 0, 0, 0, 0, 0];
    this.directGain = [false, false, false, false, false, false, false, false];
    this.gainValue = [0, 0, 0, 0, 0, 0, 0, 0];

    this.gain = [0, 0, 0, 0, 0, 0, 0, 0];

    this.channelVolumeL = [0, 0, 0, 0, 0, 0, 0, 0];
    this.channelVolumeR = [0, 0, 0, 0, 0, 0, 0, 0];
    this.volumeL = 0;
    this.volumeR = 0;
    this.mute = true;

    this.sampleOut = [0, 0, 0, 0, 0, 0, 0, 0];

    this.dirPage = 0;
  }
  this.reset();

  this.cycle = function() {

    let totalL = 0;
    let totalR = 0;
    for(let i = 0; i < 8; i++) {
      this.cycleChannel(i);
      totalL += (this.sampleOut[i] * this.channelVolumeL[i]) >> 6;
      totalR += (this.sampleOut[i] * this.channelVolumeR[i]) >> 6;
      totalL = totalL < -0x8000 ? -0x8000 : (totalL > 0x7fff ? 0x7fff : totalL);
      totalR = totalR < -0x8000 ? -0x8000 : (totalR > 0x7fff ? 0x7fff : totalR);
    }
    totalL = (totalL * this.volumeL) >> 7;
    totalR = (totalR * this.volumeR) >> 7;
    totalL = totalL < -0x8000 ? -0x8000 : (totalL > 0x7fff ? 0x7fff : totalL);
    totalR = totalR < -0x8000 ? -0x8000 : (totalR > 0x7fff ? 0x7fff : totalR);
    if(this.mute) {
      totalL = 0;
      totalR = 0;
    }

    this.samplesL[this.sampleOffset] = totalL / 0x8000;
    this.samplesR[this.sampleOffset] = totalR / 0x8000;

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
        this.adsrState[ch] = 3;
      }
      this.ram[0x7c] |= (1 << ch); // set ENDx
    }
    let header = this.apu.ram[this.decodeOffset[ch]++];
    this.decodeOffset[ch] &= 0xffff;
    let shift = header >> 4;
    let filter = (header & 0xc) >> 2;
    this.prevFlags[ch] = header & 0x3;
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
    // now update the adsr/gain, if we reach the correct amount of cycles
    let rate = this.rateNums[ch * 5 + this.adsrState[ch]];
    if(rate !== 0) {
      // only increment if rate is not 0
      this.rateCounter[ch]++;
    }
    // if rate is 0, gain is never updated
    if(rate !== 0 && this.rateCounter[ch] >= rate) {
      this.rateCounter[ch] = 0;
      if(!this.directGain[ch] || !this.useGain[ch] || this.adsrState[ch] === 3) {
        // if not using direct gain, or not using gain at all (using ADSR),
        // or we are in release (which always works), clock it
        switch(this.adsrState[ch]) {
          case 0: {
            // attack
            this.gain[ch] += rate === 1 ? 1024 : 32;
            if(this.gain[ch] >= 0x7e0) {
              this.adsrState[ch] = 1;
            }
            if(this.gain[ch] > 0x7ff) {
              this.gain[ch] = 0x7ff;
            }
            break;
          }
          case 1: {
            // decay
            this.gain[ch] -= ((this.gain[ch] - 1) >> 8) + 1;
            if(this.gain[ch] < this.sustainLevel[ch]) {
              this.adsrState[ch] = 2;
            }
            break;
          }
          case 2: {
            // sustain
            this.gain[ch] -= ((this.gain[ch] - 1) >> 8) + 1;
            break;
          }
          case 3: {
            // release
            this.gain[ch] -= 8;
            if(this.gain[ch] < 0) {
              this.gain[ch] = 0;
            }
            break;
          }
          case 4: {
            // direct gain
            switch(this.gainMode[ch]) {
              case 0: {
                this.gain[ch] -= 32;
                if(this.gain[ch] < 0) {
                  this.gain[ch] = 0;
                }
                break;
              }
              case 1: {
                this.gain[ch] -= ((this.gain[ch] - 1) >> 8) + 1;
                break;
              }
              case 2: {
                this.gain[ch] += 32;
                if(this.gain[ch] > 0x7ff) {
                  this.gain[ch] = 0x7ff;
                }
                break;
              }
              case 3: {
                this.gain[ch] += this.gain[ch] < 0x600 ? 32 : 8;
                if(this.gain[ch] > 0x7ff) {
                  this.gain[ch] = 0x7ff;
                }
                break;
              }
            }
            break;
          }
        }
      }
    }
    if(this.directGain[ch] && this.useGain[ch] && this.adsrState[ch] !== 3) {
      // if using gain, specifcally direct gain and not in release, set the value directly
      this.gain[ch] = this.gainValue[ch];
    }
    let gainedVal = (sample * this.gain[ch]) >> 11;
    // write gain to ENVx and this value to OUTx
    this.ram[(ch << 4) | 8] = this.gain[ch] >> 4;
    this.ram[(ch << 4) | 9] = gainedVal >> 7;
    this.sampleOut[ch] = gainedVal;

  }

  this.read = function(adr) {
    return this.ram[adr & 0x7f];
  }

  this.write = function(adr, value) {
    let channel = (adr & 0x70) >> 4;
    switch(adr) {
      case 0x0: case 0x10: case 0x20: case 0x30: case 0x40: case 0x50: case 0x60: case 0x70: {
        this.channelVolumeL[channel] = (value > 0x7f ? value - 0x100 : value);
        break;
      }
      case 0x1: case 0x11: case 0x21: case 0x31: case 0x41: case 0x51: case 0x61: case 0x71: {
        this.channelVolumeR[channel] = (value > 0x7f ? value - 0x100 : value);
        break;
      }
      case 0x2: case 0x12: case 0x22: case 0x32: case 0x42: case 0x52: case 0x62: case 0x72: {
        this.pitch[channel] &= 0x3f00;
        this.pitch[channel] |= value;
        break;
      }
      case 0x3: case 0x13: case 0x23: case 0x33: case 0x43: case 0x53: case 0x63: case 0x73: {
        this.pitch[channel] &= 0xff;
        this.pitch[channel] |= (value << 8) & 0x3f00;
        break;
      }
      case 0x4: case 0x14: case 0x24: case 0x34: case 0x44: case 0x54: case 0x64: case 0x74: {
        this.srcn[channel] = value;
        break;
      }
      case 0x5: case 0x15: case 0x25: case 0x35: case 0x45: case 0x55: case 0x65: case 0x75: {
        this.rateNums[channel * 5 + 0] = this.rates[(value & 0xf) * 2 + 1];
        this.rateNums[channel * 5 + 1] = this.rates[((value & 0x70) >> 4) * 2 + 16];
        this.useGain[channel] = (value & 0x80) === 0;
        break;
      }
      case 0x6: case 0x16: case 0x26: case 0x36: case 0x46: case 0x56: case 0x66: case 0x76: {
        this.rateNums[channel * 5 + 2] = this.rates[value & 0x1f];
        this.sustainLevel[channel] = (((value & 0xe0) >> 5) + 1) * 0x100;
        break;
      }
      case 0x7: case 0x17: case 0x27: case 0x37: case 0x47: case 0x57: case 0x67: case 0x77: {
        if((value & 0x80) > 0) {
          this.directGain[channel] = false;
          this.gainMode[channel] = (value & 0x60) >> 5;
          this.rateNums[channel * 5 + 4] = this.rates[value & 0x1f];
        } else {
          this.directGain[channel] = true;
          this.gainValue[channel] = (value & 0x7f) * 16;
        }
        break;
      }
      case 0x0c: {
        this.volumeL = (value > 0x7f ? value - 0x100 : value);
        break;
      }
      case 0x1c: {
        this.volumeR = (value > 0x7f ? value - 0x100 : value);
        break;
      }
      case 0x2c: {
        break; // TODO (echo volume L)
      }
      case 0x3c: {
        break; // TODO (echo volume R)
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
            this.gain[i] = 0;
            if(this.useGain[i]) {
              this.adsrState[i] = 4;
            } else {
              this.adsrState[i] = 0;
            }
          }
          test <<= 1;
        }
        break;
      }
      case 0x5c: {
        let test = 1;
        for(let i = 0; i < 8; i++) {
          if((value & test) > 0) {
            this.adsrState[i] = 3;
          }
          test <<= 1;
        }
        break;
      }
      case 0x6c: {
        if((value & 0x80) > 0) {
          for(let i = 0; i < 8; i++) {
            this.adsrState[i] = 3;
            this.gain[i] = 0;
          }
        }
        this.mute = (value & 0x40) > 0;
        // TODO: set echo writes and noise frequency
        break;
      }
      case 0x7c: {
        // somewhat of a hack, to correctly get the 'writing any value clears all bits' behaviour
        this.ram[0x7c] = 0;
        value = 0;
        break;
      }
      case 0x0d: {
        break; // TODO (echo feedback volume)
      }
      case 0x2d: {
        break; // TODO (PWM enable)
      }
      case 0x3d: {
        break; // TODO (noise enable)
      }
      case 0x4d: {
        break; // TODO (echo enable)
      }
      case 0x5d: {
        this.dirPage = value;
        break;
      }
      case 0x6d: {
        break; // TODO (echo address)
      }
      case 0x7d: {
        break; // TODO (echo delay)
      }
      case 0xf: case 0x1f: case 0x2f: case 0x3f: case 0x4f: case 0x5f: case 0x6f: case 0x7f: {
        break; // TODO (echo fir filter)
      }
    }
    this.ram[adr & 0x7f] = value;
  }

}
