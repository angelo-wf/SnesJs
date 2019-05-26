
function Lorom(data, header) {
  this.header = header;
  this.data = data;

  this.read = function(bank, adr) {
    if(adr < 0x8000) {
      return 0; // expansion area
    }
    return data[((bank & 0x3f) << 15) | (adr & 0x7fff)];
  }

  this.write = function(bank, adr, value) {
    if(adr < 0x8000) {
      return; // expansion area
    }
    return;
  }
}
