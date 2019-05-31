
function Ppu(snes) {

  this.snes = snes;

  this.vram = new Uint16Array(0x8000);

  this.cgram = new Uint16Array(0x100);

  this.pixelOutput = new Uint16Array(512*240);

  this.reset = function() {

    clearArray(this.vram);
    clearArray(this.cgram);

    clearArray(this.pixelOutput);

    this.cgramAdr = 0;
    this.cgramSecond = false;
    this.cgramBuffer = 0;

  }
  this.reset();


  this.read = function(adr) {
    return 0;
  }

  this.write = function(adr, value) {
    switch(adr) {
      case 0x21: {
        this.cgramAdr = value;
        return;
      }
      case 0x22: {
        if(!this.cgramSecond) {
          this.cgramBuffer = (this.cgramBuffer & 0xff00) | value;
          this.cgramSecond = true;
        } else {
          this.cgramBuffer = (this.cgramBuffer & 0xff) | (value << 8);
          this.cgram[this.cgramAdr++] = this.cgramBuffer;
          this.cgramAdr &= 0xff;
          this.cgramSecond = false;
        }
        return;
      }
    }
  }

  this.setPixels = function(arr) {
    // TEMP: show palette
    for(let i = 0; i < 256; i++) {
      let x = i % 16;
      let y = i >> 4;

      let ind = (y * 512 + x) * 4;
      arr[ind] = ((this.cgram[i] & 0x1f) * 255 / 31) & 0xff;
      arr[ind + 1] = (((this.cgram[i] & 0x3e0) >> 5) * 255 / 31) & 0xff;
      arr[ind + 2] = (((this.cgram[i] & 0x7c00) >> 10) * 255 / 31) & 0xff;
      arr[ind + 3] = 255;
    }
  }

}
