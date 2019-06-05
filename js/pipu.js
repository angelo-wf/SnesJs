
function Ppu(snes) {

  this.snes = snes;

  this.vram = new Uint16Array(0x8000);

  this.cgram = new Uint16Array(0x100);

  this.oam = new Uint16Array(0x100);
  this.highOam = new Uint16Array(0x10);

  this.spriteLineBuffer = new Uint8Array(256);
  this.spritePrioBuffer = new Uint8Array(256);

  this.pixelOutput = new Uint16Array(512*3*240);

  this.layersPerMode = [
    4, 0, 1, 4, 0, 1, 4, 2, 3, 4, 2, 3,
    4, 0, 1, 4, 0, 1, 4, 2, 4, 2, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5,
    4, 0, 4, 4, 0, 4, 5, 5, 5, 5, 5, 5,
    4, 4, 4, 0, 4, 5, 5, 5, 5, 5, 5, 5,
    2, 4, 0, 1, 4, 0, 1, 4, 2, 4, 5, 5
  ];

  this.prioPerMode = [
    3, 1, 1, 2, 0, 0, 1, 1, 1, 0, 0, 0,
    3, 1, 1, 2, 0, 0, 1, 1, 0, 0, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5,
    3, 1, 2, 1, 0, 0, 5, 5, 5, 5, 5, 5,
    3, 2, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5,
    1, 3, 1, 1, 2, 0, 0, 1, 0, 0, 5, 5
  ];

  this.bitPerMode = [
    2, 2, 2, 2,
    4, 4, 2, 5,
    4, 4, 5, 5,
    8, 4, 5, 5,
    8, 2, 5, 5,
    4, 2, 5, 5,
    4, 5, 5, 5,
    8, 5, 5, 5,
    4, 4, 2, 5
  ];

  this.layercountPerMode = [12, 10, 8, 8, 8, 8, 6, 5, 10];

  this.brightnessMults = [
    0.1, 0.5, 1.1, 1.6, 2.2, 2.7, 3.3, 3.8, 4.4, 4.9, 5.5, 6, 6.6, 7.1, 7.6, 8.2
  ];

  this.spriteTileOffsets = [
    0, 1, 2, 3, 4, 5, 6, 7,
    16, 17, 18, 19, 20, 21, 22, 23,
    32, 33, 34, 35, 36, 37, 38, 39,
    48, 49, 50, 51, 52, 53, 54, 55,
    64, 65, 66, 67, 68, 69, 70, 71,
    80, 81, 82, 83, 84, 85, 86, 87,
    96, 97, 98, 99, 100, 101, 102, 103,
    112, 113, 114, 115, 116, 117, 118, 119
  ];

  this.spriteSizes = [
    1, 1, 1, 2, 2, 4, 2, 2,
    2, 4, 8, 4, 8, 8, 4, 4
  ];

  this.reset = function() {

    clearArray(this.vram);
    clearArray(this.cgram);
    clearArray(this.oam);
    clearArray(this.highOam);

    clearArray(this.spriteLineBuffer);
    clearArray(this.spritePrioBuffer);

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

    this.bgHoff = [0, 0, 0, 0, 0];
    this.bgVoff = [0, 0, 0, 0, 0];
    this.offPrev1 = 0;
    this.offPrev2 = 0;

    this.mode = 0;
    this.layer3Prio = false;
    this.bigTiles = [false, false, false, false];

    this.mosaicEnabled = [false, false, false, false, false];
    this.mosaicSize = 0;
    this.mosaicStartLine = 1;

    this.mainScreenEnabled = [false, false, false, false, false];
    this.subScreenEnabled = [false, false, false, false, false];

    this.forcedBlank = true;
    this.brightness = 0;

    this.oamAdr = 0;
    this.oamRegAdr = 0;
    this.oamInHigh = false;
    this.oamRegInHigh = false;
    this.objPriority = false;
    this.oamSecond = false;
    this.oamBuffer = false;

    this.sprAdr1 = 0;
    this.sprAdr2 = 0;
    this.objSize = 0;

    this.rangeOver = false;
    this.timeOver = false;

    this.tilemapBuffer = [0, 0, 0, 0];
    this.tileBufferP1 = [0, 0, 0, 0];
    this.tileBufferP2 = [0, 0, 0, 0];
    this.tileBufferP3 = [0, 0, 0, 0];
    this.tileBufferP4 = [0, 0, 0, 0];
    this.lastTileFetchedX = [-1, -1, -1, -1];
    this.lastTileFetchedY = [-1, -1, -1, -1];
  }
  this.reset();

  this.renderLine = function(line) {
    if(line === 0 && !this.forcedBlank) {
      this.rangeOver = false;
      this.timeOver = false;
      this.evaluateSprites(0);
    } else if(line === 225 && !this.forcedBlank) {
      this.oamAdr = this.oamRegAdr;
      this.oamInHigh = this.oamRegInHigh;
    } else if(line > 0 && line < 225) {
      // visible line
      if(line === 1) {
        this.mosaicStartLine = 1;
      }
      this.lastTileFetchedX = [-1, -1, -1, -1];
      this.lastTileFetchedY = [-1, -1, -1, -1];
      let modeIndex = this.layer3Prio && this.mode === 1 ? 96 : 12 * this.mode;
      let count = this.layercountPerMode[this.mode];
      let bMult = this.brightnessMults[this.brightness];
      let i = 0;
      while(i < 256) {
        // for each pixel

        let r1 = 0;
        let g1 = 0;
        let b1 = 0;
        let r2 = 0;
        let g2 = 0;
        let b2 = 0;

        if(!this.forcedBlank) {

          let pixel = 0;
          for(let j = 0; j < count; j++) {
            let x = i
            let y = line;
            let layer = this.layersPerMode[modeIndex + j];
            if(this.mainScreenEnabled[layer] || this.subScreenEnabled[layer]) {
              if(this.mosaicEnabled[layer] && this.mosaicSize > 0) {
                x -= x % this.mosaicSize;
                y -= (y - this.mosaicStartLine) % this.mosaicSize;
              }
              x += this.bgHoff[layer];
              y += this.bgVoff[layer];
              pixel = this.getPixelForLayer(
                x, y,
                layer,
                this.prioPerMode[modeIndex + j]
              );
            }
            if(pixel > 0) {
              break;
            }
          }
          r1 = ((this.cgram[pixel] & 0x1f) * bMult) & 0xff;
          g1 = (((this.cgram[pixel] & 0x3e0) >> 5) * bMult) & 0xff;
          b1 = (((this.cgram[pixel] & 0x7c00) >> 10) * bMult) & 0xff;
          r2 = r1;
          g2 = g1;
          b2 = b1;
        }
        this.pixelOutput[line * 1536 + 6 * i] = r1;
        this.pixelOutput[line * 1536 + 6 * i + 1] = g1;
        this.pixelOutput[line * 1536 + 6 * i + 2] = b1;
        this.pixelOutput[line * 1536 + 6 * i + 3] = r2;
        this.pixelOutput[line * 1536 + 6 * i + 4] = g2;
        this.pixelOutput[line * 1536 + 6 * i + 5] = b2;

        i++;

      }
      if(!this.forcedBlank) {
        this.evaluateSprites(line);
      }
    }
  }

  this.getPixelForLayer = function(x, y, l, p) {
    if(l > 3) {
      if(this.spritePrioBuffer[x] !== p) {
        return 0;
      }
      return this.spriteLineBuffer[x];
    }

    if(
      x >> 3 !== this.lastTileFetchedX[l] ||
      y >> 3 !== this.lastTileFetchedY[l]
    ) {
      this.fetchTileInBuffer(x, y, l);
      this.lastTileFetchedX[l] = x >> 3;
      this.lastTileFetchedY[l] = y >> 3;
    }

    let mapWord = this.tilemapBuffer[l];
    if(((mapWord & 0x2000) >> 13) !== p) {
      // not the right priority
      return 0;
    }
    let paletteNum = (mapWord & 0x1c00) >> 10;
    let xShift = (mapWord & 0x4000) > 0 ? (x & 0x7) : 7 - (x & 0x7);

    let bits = this.bitPerMode[this.mode * 4 + l];
    let mul = 4;
    let tileData = (this.tileBufferP1[l] >> xShift) & 0x1;
    tileData |= ((this.tileBufferP1[l] >> (8 + xShift)) & 0x1) << 1;

    if(bits > 2) {
      mul = 16;
      tileData |= ((this.tileBufferP2[l] >> xShift) & 0x1) << 2;
      tileData |= ((this.tileBufferP2[l] >> (8 + xShift)) & 0x1) << 3;
    }

    if(bits > 4) {
      mul = 256;
      tileData |= ((this.tileBufferP3[l] >> xShift) & 0x1) << 4;
      tileData |= ((this.tileBufferP3[l] >> (8 + xShift)) & 0x1) << 5;
      tileData |= ((this.tileBufferP4[l] >> xShift) & 0x1) << 6;
      tileData |= ((this.tileBufferP4[l] >> (8 + xShift)) & 0x1) << 7;
    }

    return tileData > 0 ? (
      paletteNum * mul + tileData
    ) & 0xff : 0;
  }

  this.fetchTileInBuffer = function(x, y, l) {
    let adr = this.tilemapAdr[l] + (
      ((y & 0xff) >> 3) << 5 | ((x & 0xff) >> 3)
    );
    adr += ((x & 0x100) > 0 && this.tilemapWider[l]) ? 1024 : 0;
    adr += ((y & 0x100) > 0 && this.tilemapHigher[l]) ? (
      this.tilemapWider[l] ? 2048 : 1024
    ) : 0;
    this.tilemapBuffer[l] = this.vram[adr & 0x7fff];
    let yRow = (this.tilemapBuffer[l] & 0x8000) > 0 ? 7 - (y & 0x7) : (y & 0x7);
    let tileNum = this.tilemapBuffer[l] & 0x3ff;
    let bits = this.bitPerMode[this.mode * 4 + l];

    this.tileBufferP1[l] = this.vram[
      (this.tileAdr[l] + tileNum * 4 * bits + yRow) & 0x7fff
    ];
    if(bits > 2) {
      this.tileBufferP2[l] = this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 8) & 0x7fff
      ];
    }
    if(bits > 4) {
      this.tileBufferP3[l] = this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 16) & 0x7fff
      ];
      this.tileBufferP4[l] = this.vram[
        (this.tileAdr[l] + tileNum * 4 * bits + yRow + 24) & 0x7fff
      ];
    }
  }

  this.evaluateSprites = function(line) {
    clearArray(this.spriteLineBuffer);
    let spriteCount = 0;
    let sliverCount = 0;
    // search through oam, backwards
    let index = this.objPriority ? ((this.oamAdr & 0xfe) - 2) & 0xff : 254;
    for(let i = 0; i < 128; i++) {
      let x = this.oam[index] & 0xff;
      let y = (this.oam[index] & 0xff00) >> 8;
      let tile = this.oam[index + 1] & 0xff;
      let ex = (this.oam[index + 1] & 0xff00) >> 8;
      x |= (this.highOam[index >> 4] >> (index & 0xf) & 0x1) << 8;
      let big = (this.highOam[index >> 4] >> (index & 0xf) & 0x2) > 0;
      x = x > 255 ? -(512 - x) : x;

      // check for being on this line
      let size = this.spriteSizes[this.objSize + (big ? 8 : 0)];
      let sprRow = line - y;
      if(sprRow < 0 || sprRow >= size * 8) {
        // check if it is a sprite from the top of the screen
        sprRow = line + (256 - y);
      }
      if(sprRow >= 0 && sprRow < size * 8 && x > -(size * 8)) {
        // in range, show it
        if(spriteCount === 32) {
          // this would be the 33th sprite, exit the loop
          this.rangeOver = true;
          break;
        }
        // fetch the tile(s)
        let adr = this.sprAdr1 + ((ex & 0x1) > 0 ? this.sprAdr2 : 0);
        sprRow = ((ex & 0x80) > 0) ? (size * 8) - 1 - sprRow : sprRow;
        let tileRow = sprRow >> 3;
        sprRow &= 0x7;
        for(let k = 0; k < size; k++) {
          if((x + k * 8) > -7 && (x + k * 8) < 256) {
            if(sliverCount === 34) {
              sliverCount = 35;
              break; // exit tile fetch loop, maximum slivers
            }
            let tileColumn = ((ex & 0x40) > 0) ? size - 1 - k : k;
            let tileNum = tile + this.spriteTileOffsets[tileRow * 8 + tileColumn];
            tileNum &= 0xff;
            let tileP1 = this.vram[
              (adr + tileNum * 16 + sprRow) & 0x7fff
            ];
            let tileP2 = this.vram[
              (adr + tileNum * 16 + sprRow + 8) & 0x7fff
            ];
            // and draw it in the line buffer
            for(let j = 0; j < 8; j++) {
              let shift = ((ex & 0x40) > 0) ? j : 7 - j;
              let tileData = (tileP1 >> shift) & 0x1;
              tileData |= ((tileP1 >> (8 + shift)) & 0x1) << 1;
              tileData |= ((tileP2 >> shift) & 0x1) << 2;
              tileData |= ((tileP2 >> (8 + shift)) & 0x1) << 3;
              let color = tileData + 16 * ((ex & 0xe) >> 1);
              let xInd = x + k * 8 + j;
              if(tileData > 0 && xInd < 256 && xInd >= 0) {
                this.spriteLineBuffer[xInd] = 0x80 + color;
                this.spritePrioBuffer[xInd] = (ex & 0x30) >> 4;
              }
            }
            sliverCount++;
          }
        }
        if(sliverCount === 35) {
          // we exited the tile fetch loop because we reached max slivers
          // se we can stop evaluating sprites
          this.timeOver = true;
          break;
        }

        spriteCount++;
      }

      index = (index - 2) & 0xff;
    }
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
      case 0x38: {
        let val;
        if(!this.oamSecond) {
          if(this.oamInHigh) {
            val = this.highOam[this.oamAdr & 0xf] & 0xff;
          } else {
            val = this.oam[this.oamAdr] & 0xff;
          }
          this.oamSecond = true;
        } else {
          if(this.oamInHigh) {
            val = this.highOam[this.oamAdr & 0xf] >> 8;
          } else {
            val = this.oam[this.oamAdr] >> 8;
          }
          this.oamAdr++;
          this.oamAdr &= 0xff;
          this.oamInHigh = (
            this.oamAdr === 0
          ) ? !this.oamInHigh : this.oamInHigh;
          this.oamSecond = false;
        }
        return val;
      }
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
      case 0x00: {
        this.forcedBlank = (value & 0x80) > 0;
        this.brightness = value & 0xf;
        return;
      }
      case 0x01: {
        this.sprAdr1 = (value & 0x7) << 13;
        this.sprAdr2 = ((value & 0x18) + 8) << 9;
        this.objSize = (value & 0xe0) >> 5;
        return;
      }
      case 0x02: {
        this.oamAdr = value;
        this.oamRegAdr = this.oamAdr;
        this.oamInHigh = this.oamRegInHigh;
        return;
      }
      case 0x03: {
        this.oamInHigh = (value & 0x1) > 0;
        this.objPriority = (value & 0x80) > 0;
        this.oamAdr = this.oamRegAdr;
        this.oamRegInHigh = this.oamInHigh
        return;
      }
      case 0x04: {
        if(!this.oamSecond) {
          if(this.oamInHigh) {
            this.highOam[
              this.oamAdr & 0xf
            ] = (this.highOam[this.oamAdr & 0xf] & 0xff00) | value;
          } else {
            this.oamBuffer = (this.oamBuffer & 0xff00) | value;
          }
          this.oamSecond = true;
        } else {
          if(this.oamInHigh) {
            this.highOam[
              this.oamAdr & 0xf
            ] = (this.highOam[this.oamAdr & 0xf] & 0xff) | (value << 8);
          } else {
            this.oamBuffer = (this.oamBuffer & 0xff) | (value << 8);
            this.oam[this.oamAdr] = this.oamBuffer;
          }
          this.oamAdr++;
          this.oamAdr &= 0xff;
          this.oamInHigh = (
            this.oamAdr === 0
          ) ? !this.oamInHigh : this.oamInHigh;
          this.oamSecond = false;
        }
        return;
      }
      case 0x05: {
        this.mode = value & 0x7;
        this.layer3Prio = (value & 0x08) > 0;
        this.bigTiles[0] = (value & 0x10) > 0;
        this.bigTiles[1] = (value & 0x20) > 0;
        this.bigTiles[2] = (value & 0x40) > 0;
        this.bigTiles[3] = (value & 0x80) > 0;
        return;
      }
      case 0x06: {
        this.mosaicEnabled[0] = (value & 0x1) > 0;
        this.mosaicEnabled[1] = (value & 0x2) > 0;
        this.mosaicEnabled[2] = (value & 0x4) > 0;
        this.mosaicEnabled[3] = (value & 0x8) > 0;
        this.mosaicSize = (value & 0xf0) >> 4;
        this.mosaicStartLine = this.snes.yPos;
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
      case 0x2d: {
        this.subScreenEnabled[0] = (value & 0x1) > 0;
        this.subScreenEnabled[1] = (value & 0x2) > 0;
        this.subScreenEnabled[2] = (value & 0x4) > 0;
        this.subScreenEnabled[3] = (value & 0x8) > 0;
        this.subScreenEnabled[4] = (value & 0x10) > 0;
        return;
      }
    }
  }

  this.setPixels = function(arr) {

    for(let i = 0; i < 512*240; i++) {
      let x = i % 512;
      let y = (i >> 9) * 2;
      let ind = (y * 512 + x) * 4;
      let r = this.pixelOutput[i * 3];
      let g = this.pixelOutput[i * 3 + 1];
      let b = this.pixelOutput[i * 3 + 2];
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
