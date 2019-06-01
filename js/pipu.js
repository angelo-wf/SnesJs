
function Ppu(snes) {

  this.snes = snes;

  this.vram = new Uint16Array(0x8000);

  this.cgram = new Uint16Array(0x100);

  this.oam = new Uint16Array(0x100);
  this.highOam = new Uint16Array(0x10);

  this.pixelOutput = new Uint16Array(512*240);

  this.layersPerMode = new Uint8Array([
    4, 0, 1, 4, 0, 1, 4, 2, 3, 4, 2, 3,
    4, 0, 1, 4, 0, 1, 4, 2, 4, 2, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 4, 0, 4, 5, 5, 5, 5, 5, 5,
    4, 4, 4, 0, 4, 5, 5, 5, 5, 5, 5, 5
  ]);

  this.prioPerMode = new Uint8Array([
    3, 1, 1, 2, 0, 0, 1, 1, 1, 0, 0, 0,
    3, 1, 1, 2, 0, 0, 1, 1, 0, 0, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 0, 0, 5, 5, 5, 5, 5, 5,
    3, 2, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5
  ]);

  this.bitPerMode = new Uint8Array([
    2, 2, 2, 2,
    4, 4, 2, 5,
    4, 4, 5, 5,
    8, 4, 5, 5,
    8, 2, 5, 5,
    4, 2, 5, 5,
    4, 5, 5, 5,
    8, 5, 5, 5
  ]);

  this.layercountPerMode = new Uint8Array([12, 10, 8, 8, 8, 8, 6, 5]);

  this.reset = function() {

    clearArray(this.vram);
    clearArray(this.cgram);
    clearArray(this.oam);
    clearArray(this.highOam);

    clearArray(this.pixelOutput);

    this.cgramAdr = 0;
    this.cgramSecond = false;
    this.cgramBuffer = 0;

    this.vramInc = 0;
    this.vramRemap = 0;
    this.vramIncOnHigh = false;
    this.vramAdr = 0;
    this.vramReadBuffer = 0;

    this.tilemapWider = [false, false, false, false];
    this.tilemapHigher = [false, false, false, false];
    this.tilemapAdr = [0, 0, 0, 0];
    this.tileAdr = [0, 0, 0, 0];

    this.bgHoff = [0, 0, 0, 0];
    this.bgVoff = [0, 0, 0, 0];
    this.offPrev1 = 0;
    this.offPrev2 = 0;

    this.mode = 0;
    this.layer3Prio = false;

    this.mainScreenEnabled = [false, false, false, false, false];

  }
  this.reset();

  this.renderLine = function(line) {
    if(line > 0 && line < 225) {
      // visible line
      for(let i = 0; i < 256; i++) {
        // for each pixel

        let pixel = 0;
        for(let j = 0; j < this.layercountPerMode[this.mode]; j++) {
          let x = i
          let y = line;
          let layer = this.layersPerMode[this.mode * 12 + j];
          if(layer < 4 && this.mainScreenEnabled[layer]) {
            x += this.bgHoff[layer];
            y += this.bgVoff[layer];
            pixel = this.getPixelForLayer(
              x, y,
              layer,
              this.prioPerMode[this.mode * 12 + j]
            );
          }
          if(pixel > 0) {
            break;
          }
        }

        this.pixelOutput[line * 512 + 2 * i] = this.cgram[pixel];
        this.pixelOutput[line * 512 + 2 * i + 1] = this.cgram[pixel];
      }
    }
  }

  this.getPixelForLayer = function(x, y, l, p) {
    if(l > 3) {
      return 0;
    }
    let adr = this.tilemapAdr[l] + (
      ((y & 0xff) >> 3) << 5 | ((x & 0xff) >> 3)
    );
    adr += ((x & 0x100) > 0 && this.tilemapWider[l]) ? 1024 : 0;
    adr += ((y & 0x100) > 0 && this.tilemapHigher[l]) ? (
      this.tilemapWider[l] ? 2048 : 1024
    ) : 0;
    let mapWord = this.vram[adr & 0x7fff];
    if(((mapWord & 0x2000) >> 13) !== p) {
      // not the right priority
      return 0;
    }
    let tileNum = mapWord & 0x1ff;
    let paletteNum = (mapWord & 0x1c00) >> 10;
    let xShift = (mapWord & 0x4000) > 0 ? (x & 0x7) : 7 - (x & 0x7);
    let yRow = (mapWord & 0x8000) > 0 ? 7 - (y & 0x7) : (y & 0x7);
    // fetch the tile-row that belongs to this tile
    let bits = this.bitPerMode[this.mode * 4 + l];
    let mul = 4;
    let tileData = ((this.vram[
      (this.tileAdr[l] + tileNum * 4 * bits + yRow) & 0x7fff
    ]) >> xShift) & 0x1;
    tileData |= (((this.vram[
      (this.tileAdr[l] + tileNum * 4 * bits + yRow) & 0x7fff
    ]) >> (8 + xShift)) & 0x1) << 1;

    if(bits > 2) {
      mul = 16;
      tileData |= (((this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 8) & 0x7fff
      ]) >> xShift) & 0x1) << 2;
      tileData |= (((this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 8) & 0x7fff
      ]) >> (8 + xShift)) & 0x1) << 3;
    }

    if(bits > 4) {
      mul = 256;
      tileData |= (((this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 16) & 0x7fff
      ]) >> xShift) & 0x1) << 4;
      tileData |= (((this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 16) & 0x7fff
      ]) >> (8 + xShift)) & 0x1) << 5;
      tileData |= (((this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 24) & 0x7fff
      ]) >> xShift) & 0x1) << 6;
      tileData |= (((this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 24) & 0x7fff
      ]) >> (8 + xShift)) & 0x1) << 7;
    }

    return tileData > 0 ? (
      paletteNum * mul + tileData
    ) & 0xff : 0;
  }

  this.getVramRemap = function() {
    let adr = this.vramAdr & 0x7fff;
    if(this.vramRemap === 1) {
      adr = (adr & 0xff00) | ((adr & 0xe0) >> 5) | ((adr & 0x1f) << 3);
    } else if(this.vramRemap === 2) {
      adr = (adr & 0xfe00) | ((adr & 0x1c0) >> 6) | ((adr & 0x3f) << 3);
    } else if(this.vramRemap === 3) {
      adr = (adr & 0xfc00) | ((adr & 0x380) >> 7) | ((adr & 0x7f) << 3);
    }
    return adr;
  }

  this.read = function(adr) {
    switch(adr) {
      case 0x39: {
        let val = this.vramReadBuffer;
        this.vramReadBuffer = this.vram[this.getVramRemap()];
        if(!this.vramIncOnHigh) {
          this.vramAdr += this.vramInc;
          this.vramAdr &= 0xffff;
        }
        return val & 0xff;
      }
      case 0x3a: {
        let val = this.vramReadBuffer;
        this.vramReadBuffer = this.vram[this.getVramRemap()];
        if(this.vramIncOnHigh) {
          this.vramAdr += this.vramInc;
          this.vramAdr &= 0xffff;
        }
        return (val & 0xff00) >> 8;
      }
      case 0x3b: {
        let val;
        if(!this.cgramSecond) {
          val = this.cgram[this.cgramAdr] & 0xff;
          this.cgramSecond = true;
        } else {
          val = this.cgram[this.cgramAdr++] >> 8;
          this.cgramAdr &= 0xff;
          this.cgramSecond = false;
        }
        return val;
      }
    }
    return 0;
  }

  this.write = function(adr, value) {
    switch(adr) {
      case 0x05: {
        this.mode = value & 0x7;
        this.layer3Prio = (value & 0x08) > 0;
        return;
      }
      case 0x07:
      case 0x08:
      case 0x09:
      case 0x0a: {
        this.tilemapWider[adr - 7] = (value & 0x1) > 0;
        this.tilemapHigher[adr - 7] = (value & 0x2) > 0;
        this.tilemapAdr[adr - 7] = (value & 0xfc) << 8;
        return;
      }
      case 0x0b: {
        this.tileAdr[0] = (value & 0xf) << 12;
        this.tileAdr[1] = (value & 0xf0) << 8;
        return;
      }
      case 0x0c: {
        this.tileAdr[2] = (value & 0xf) << 12;
        this.tileAdr[3] = (value & 0xf0) << 8;
        return;
      }
      case 0x0d:
      case 0x0f:
      case 0x11:
      case 0x13: {
        this.bgHoff[
          (adr - 0xd) >> 1
        ] = (value << 8) | (this.offPrev1 & 0xf8) | (this.offPrev2 & 0x7);
        this.offPrev1 = value;
        this.offPrev2 = value;
        return;
      }
      case 0x0e:
      case 0x10:
      case 0x12:
      case 0x14: {
        this.bgVoff[
          (adr - 0xe) >> 1
        ] = (value << 8) | (this.offPrev1 & 0xff);
        this.offPrev1 = value;
        return;
      }
      case 0x15: {
        let incVal = value & 0x3;
        if(incVal === 0) {
          this.vramInc = 1;
        } else if(incVal === 1) {
          this.vramInc = 32;
        } else {
          this.vramInc = 128;
        }
        this.vramRemap = (value & 0xc0) >> 2;
        this.vramIncOnHigh = (value & 0x80) > 0;
        return;
      }
      case 0x16: {
        this.vramAdr = (this.vramAdr & 0xff00) | value;
        this.vramReadBuffer = this.vram[this.getVramRemap()];
        return;
      }
      case 0x17: {
        this.vramAdr = (this.vramAdr & 0xff) | (value << 8);
        this.vramReadBuffer = this.vram[this.getVramRemap()];
        return;
      }
      case 0x18: {
        let adr = this.getVramRemap();
        this.vram[adr] = (this.vram[adr] & 0xff00) | value;
        if(!this.vramIncOnHigh) {
          this.vramAdr += this.vramInc;
          this.vramAdr &= 0xffff;
        }
        return;
      }
      case 0x19: {
        let adr = this.getVramRemap();
        this.vram[adr] = (this.vram[adr] & 0xff) | (value << 8);
        if(this.vramIncOnHigh) {
          this.vramAdr += this.vramInc;
          this.vramAdr &= 0xffff;
        }
        return;
      }
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
      case 0x2c: {
        this.mainScreenEnabled[0] = (value & 0x1) > 0;
        this.mainScreenEnabled[1] = (value & 0x2) > 0;
        this.mainScreenEnabled[2] = (value & 0x4) > 0;
        this.mainScreenEnabled[3] = (value & 0x8) > 0;
        this.mainScreenEnabled[4] = (value & 0x10) > 0;
        return;
      }
    }
  }

  this.setPixels = function(arr) {

    for(let i = 0; i < 512*240; i++) {
      let x = i % 512;
      let y = (i >> 9) * 2;
      let ind = (y * 512 + x) * 4;
      let p = this.pixelOutput[i];
      let r = ((p & 0x1f) * 255 / 31) & 0xff;
      let g = (((p & 0x3e0) >> 5) * 255 / 31) & 0xff;
      let b = (((p & 0x7c00) >> 10) * 255 / 31) & 0xff;
      arr[ind] = r;
      arr[ind + 1] = g;
      arr[ind + 2] = b;
      ind += 512 * 4;
      arr[ind] = r;
      arr[ind + 1] = g;
      arr[ind + 2] = b;
    }
  }

}
