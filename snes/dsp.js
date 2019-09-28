
function Dsp(apu) {

  this.apu = apu;

  this.ram = new Uint8Array(0x80);

  this.samplesL = new Float64Array(534);
  this.samplesR = new Float64Array(534);
  this.sampleOffset = 0;

  this.testSample = [0.6, 0.8, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1, 0, 0, 0.1, 0.2, 0.4];

  this.reset = function() {
    clearArray(this.ram);

    this.pitch = [0, 0, 0, 0, 0, 0, 0, 0];
    this.counter = [0, 0, 0, 0, 0, 0, 0, 0];
  }
  this.reset();

  this.cycle = function() {

    // temporary
    for(let i = 0; i < 8; i++) {
      this.counter[i] += this.pitch[i];
      // this.counter[i] += 0x1000;
      this.counter[i] &= 0xffff;
    }
    let total = (
      this.testSample[this.counter[0] >> 12] +
      this.testSample[this.counter[1] >> 12] +
      this.testSample[this.counter[2] >> 12] +
      this.testSample[this.counter[3] >> 12] +
      this.testSample[this.counter[4] >> 12] +
      this.testSample[this.counter[5] >> 12] +
      this.testSample[this.counter[6] >> 12] +
      this.testSample[this.counter[7] >> 12]
    ) / 8;
    this.samplesL[this.sampleOffset] = total;
    this.samplesR[this.sampleOffset] = total;

    this.sampleOffset++;
    if(this.sampleOffset > 533) {
      // going past the buffer
      this.sampleOffset = 533;
    }
  }

  this.read = function(adr) {
    return this.ram[adr & 0x7f];
  }

  this.write = function(adr, value) {
    let channel = (adr & 0x70) >> 4;
    switch(adr) {
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
        this.pitch[channel] |= (value << 8) & 0x3f;
        break;
      }
    }
    this.ram[adr & 0x7f] = value;
  }

}
