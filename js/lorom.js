
function Lorom(data, header) {
  this.header = header;
  this.data = data;

  this.sram = new Uint8Array(header.ramSize);
  this.hasSram = header.chips > 0;

  this.banks = header.romSize / 0x8000;
  this.sramSize = header.ramSize;
  log(
    "Loaded LOROM rom: \"" + header.name + "\"; " +
    "Banks: " + this.banks +
    "; Sram size: $" + getWordRep(this.hasSram ? this.sramSize : 0)
  );

  this.reset = function(hard) {
    if(hard) {
      clearArray(this.sram);
    }
  }
  this.reset();

  this.read = function(bank, adr) {
    if(adr < 0x8000) {
      if(bank >= 0x70 && bank < 0x7e && this.hasSram) {
        // sram
        return this.sram[
          (((bank - 0x70) << 15) | (adr & 0x7fff)) & (this.sramSize - 1)
        ];
      }
    }
    return this.data[((bank & (this.banks - 1)) << 15) | (adr & 0x7fff)];
  }

  this.write = function(bank, adr, value) {
    if(adr < 0x8000 && bank >= 0x70 && bank < 0x7e && this.hasSram) {
      this.sram[
        (((bank - 0x70) << 15) | (adr & 0x7fff)) & (this.sramSize - 1)
      ] = value;
    }
  }
}
