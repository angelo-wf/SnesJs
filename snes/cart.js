
function Cart(data, header, isHirom) {
  this.header = header;
  this.data = data;

  this.isHirom = isHirom;

  this.sram = new Uint8Array(header.ramSize);
  this.hasSram = header.chips > 0;

  this.banks = header.romSize / 0x8000;
  this.sramSize = header.ramSize;
  log(
    "Loaded " + (this.isHirom ? "HiROM" : "LoROM") + " rom: \"" + header.name + "\"; " +
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
    if(!this.isHirom) {
      if(adr < 0x8000) {
        if(bank >= 0x70 && bank < 0x7e && this.hasSram) {
          // sram
          return this.sram[
            (((bank - 0x70) << 15) | (adr & 0x7fff)) & (this.sramSize - 1)
          ];
        }
      }
      return this.data[((bank & (this.banks - 1)) << 15) | (adr & 0x7fff)];
    } else {
      if(adr >= 0x6000 && adr < 0x8000 && this.hasSram) {
        if((bank < 0x40 || (bank >= 0x80 && bank < 0xc0))) {
          // sram
          return this.sram[
            (((bank & 0x3f) << 13) | (adr & 0x1fff)) & (this.sramSize - 1)
          ]
        }
      }
      return this.data[(((bank & 0x3f) & (this.banks - 1)) << 16) | adr];
    }
  }

  this.write = function(bank, adr, value) {
    if(!this.isHirom) {
      if(adr < 0x8000 && bank >= 0x70 && bank < 0x7e && this.hasSram) {
        this.sram[
          (((bank - 0x70) << 15) | (adr & 0x7fff)) & (this.sramSize - 1)
        ] = value;
      }
    } else {
      if(adr >= 0x6000 && adr < 0x8000 && this.hasSram) {
        if((bank < 0x40 || (bank >= 0x80 && bank < 0xc0))) {
          // sram
          this.sram[
            (((bank & 0x3f) << 13) | (adr & 0x1fff)) & (this.sramSize - 1)
          ] = value;
        }
      }
    }
  }
}
