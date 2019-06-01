
function Lorom(data, header) {
  this.header = header;
  this.data = data;

  this.sram = new Uint8Array(header.ramSize);

  this.banks = header.romSize / 0x8000;
  this.sramSize = header.ramSize;
  log(
    "$8000 byte banks: " + this.banks +
    "; sram size: " + getWordRep(this.sramSize)
  );

  this.reset = function(hard) {
    if(hard) {
      clearArray(this.sram);
    }
  }
  this.reset();

  this.read = function(bank, adr) {
    if(adr < 0x8000) {
      if(bank >= 0x70 && bank < 0x7e) {
        // sram
        return this.sram[
          (((bank - 0x70) << 15) | (adr & 0x7fff)) & (this.sramSize - 1)
        ];
      }
      return 0; // expansion area
    }
    return this.data[((bank & (this.banks - 1)) << 15) | (adr & 0x7fff)];
  }

  this.write = function(bank, adr, value) {
    if(adr < 0x8000 && bank >= 0x70 && bank < 0x7e) {
      this.sram[
        (((bank - 0x70) << 15) | (adr & 0x7fff)) & (this.sramSize - 1)
      ] = value;
    }
  }
}
