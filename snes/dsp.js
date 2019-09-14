
function Dsp(apu) {

  this.apu = apu;

  this.ram = new Uint8Array(0x80);

  this.reset = function() {
    clearArray(this.ram);
  }
  this.reset();

  this.read = function(adr) {
    return this.ram[adr & 0x7f];
  }

  this.write = function(adr, value) {
    this.ram[adr & 0x7f] = value;
  }
}
