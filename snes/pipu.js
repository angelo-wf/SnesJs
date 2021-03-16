
function Ppu(snes) {

  this.snes = snes;

  this.vram = new Uint16Array(0x8000);

  this.cgram = new Uint16Array(0x100);

  this.oam = new Uint16Array(0x100);
  this.highOam = new Uint16Array(0x10);

  this.spriteLineBuffer = new Uint8Array(256);
  this.spritePrioBuffer = new Uint8Array(256);

  this.mode7Xcoords = new Int32Array(256);
  this.mode7Ycoords = new Int32Array(256);

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
    2, 4, 0, 1, 4, 0, 1, 4, 2, 4, 5, 5,
    4, 4, 1, 4, 0, 4, 1, 5, 5, 5, 5, 5
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
    1, 3, 1, 1, 2, 0, 0, 1, 0, 0, 5, 5,
    3, 2, 1, 1, 0, 0, 0, 5, 5, 5, 5, 5
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
    4, 4, 2, 5,
    8, 7, 5, 5
  ];

  this.layercountPerMode = [12, 10, 8, 8, 8, 8, 6, 5, 10, 7];

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

    clearArray(this.mode7Xcoords);
    clearArray(this.mode7Ycoords);

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
    this.mosaicSize = 1;
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

    this.mode7ExBg = false;
    this.pseudoHires = false;
    this.overscan = false;
    this.objInterlace = false;
    this.interlace = false;

    this.frameOverscan = false;
    this.frameInterlace = false;
    this.evenFrame = false;

    this.latchedHpos = 0;
    this.latchedVpos = 0;
    this.latchHsecond = false;
    this.latchVsecond = false;
    this.countersLatched = false;

    this.mode7Hoff = 0;
    this.mode7Voff = 0;
    this.mode7A = 0;
    this.mode7B = 0;
    this.mode7C = 0;
    this.mode7D = 0;
    this.mode7X = 0;
    this.mode7Y = 0;
    this.mode7Prev = 0;
    this.multResult = 0;

    this.mode7LargeField = false;
    this.mode7Char0fill = false;
    this.mode7FlipX = false;
    this.mode7FlipY = false;

    this.window1Inversed = [false, false, false, false, false, false];
    this.window1Enabled = [false, false, false, false, false, false];
    this.window2Inversed = [false, false, false, false, false, false];
    this.window2Enabled = [false, false, false, false, false, false];
    this.windowMaskLogic = [0, 0, 0, 0, 0, 0];
    this.window1Left = 0;
    this.window1Right = 0;
    this.window2Left = 0;
    this.window2Right = 0;
    this.mainScreenWindow = [false, false, false, false, false];
    this.subScreenWindow = [false, false, false, false, false];

    this.colorClip = 0;
    this.preventMath = 0;
    this.addSub = false;
    this.directColor = false;

    this.subtractColors = false;
    this.halfColors = false;
    this.mathEnabled = [false, false, false, false, false, false];
    this.fixedColorB = 0;
    this.fixedColorG = 0;
    this.fixedColorR = 0;

    this.tilemapBuffer = [0, 0, 0, 0];
    this.tileBufferP1 = [0, 0, 0, 0];
    this.tileBufferP2 = [0, 0, 0, 0];
    this.tileBufferP3 = [0, 0, 0, 0];
    this.tileBufferP4 = [0, 0, 0, 0];
    this.lastTileFetchedX = [-1, -1, -1, -1];
    this.lastTileFetchedY = [-1, -1, -1, -1];
    this.optHorBuffer = [0, 0];
    this.optVerBuffer = [0, 0];
    this.lastOrigTileX = [-1, -1];
  }
  this.reset();

  // TODO: better mode 2/4/6 offset-per-tile (especially mode 6), color math
  // when subscreen is visible (especially how to handle the subscreen pixels),
  // mosaic with hires/interlace, mosaic on mode 7, rectangular sprites,
  // oddities with sprite X-position being -256, mosaic with offset-per-tile,
  // offset-per-tile with interlace, reading/writing ram while rendering

  this.checkOverscan = function(line) {
    if(line === 225 && this.overscan) {
      this.frameOverscan = true;
    }
  }

  this.renderLine = function(line) {
    if(line === 0) {
      // pre-render line
      this.rangeOver = false;
      this.timeOver = false;
      this.frameOverscan = false;
      this.frameInterlace = false;
      clearArray(this.spriteLineBuffer);
      if(!this.forcedBlank) {
        this.evaluateSprites(0);
      }
    } else if(line === (this.frameOverscan ? 240 : 225)) {
      // beginning of Vblank
      if(!this.forcedBlank) {
        this.oamAdr = this.oamRegAdr;
        this.oamInHigh = this.oamRegInHigh;
        this.oamSecond = false;
      }
      this.frameInterlace = this.interlace;
      this.evenFrame = !this.evenFrame;
    } else if(line > 0 && line < (this.frameOverscan ? 240 : 225)) {
      // visible line
      if(line === 1) {
        this.mosaicStartLine = 1;
      }
      if(this.mode === 7) {
        this.generateMode7Coords(line);
      }
      this.lastTileFetchedX = [-1, -1, -1, -1];
      this.lastTileFetchedY = [-1, -1, -1, -1];
      this.optHorBuffer = [0, 0];
      this.optVerBuffer = [0, 0];
      this.lastOrigTileX = [-1, -1];
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

          let colLay = this.getColor(false, i, line);
          let color = colLay[0];

          r2 = color & 0x1f;
          g2 = (color & 0x3e0) >> 5;
          b2 = (color & 0x7c00) >> 10;

          if(
            this.colorClip === 3 ||
            (this.colorClip === 2 && this.getWindowState(i, 5)) ||
            (this.colorClip === 1 && !this.getWindowState(i, 5))
          ) {
            r2 = 0;
            g2 = 0;
            b2 = 0;
          }

          let secondLay = [0, 5, 0];
          if(
            this.mode === 5 || this.mode === 6 || this.pseudoHires ||
            (this.getMathEnabled(i, colLay[1], colLay[2]) && this.addSub)
          ) {
            secondLay = this.getColor(true, i, line);
            r1 = secondLay[0] & 0x1f;
            g1 = (secondLay[0] & 0x3e0) >> 5;
            b1 = (secondLay[0] & 0x7c00) >> 10;
          }

          if(this.getMathEnabled(i, colLay[1], colLay[2])) {
            if(this.subtractColors) {
              r2 -= (this.addSub && secondLay[1] < 5) ? r1 : this.fixedColorR;
              g2 -= (this.addSub && secondLay[1] < 5) ? g1 : this.fixedColorG;
              b2 -= (this.addSub && secondLay[1] < 5) ? b1 : this.fixedColorB;
            } else {
              r2 += (this.addSub && secondLay[1] < 5) ? r1 : this.fixedColorR;
              g2 += (this.addSub && secondLay[1] < 5) ? g1 : this.fixedColorG;
              b2 += (this.addSub && secondLay[1] < 5) ? b1 : this.fixedColorB;
            }

            if(this.halfColors && (secondLay[1] < 5 || !this.addSub)) {
              r2 >>= 1;
              g2 >>= 1;
              b2 >>= 1;
            }
            r2 = r2 > 31 ? 31 : r2;
            r2 = r2 < 0 ? 0 : r2;
            g2 = g2 > 31 ? 31 : g2;
            g2 = g2 < 0 ? 0 : g2;
            b2 = b2 > 31 ? 31 : b2;
            b2 = b2 < 0 ? 0 : b2;
          }

          if(!(this.mode === 5 || this.mode === 6 || this.pseudoHires)) {
            r1 = r2;
            g1 = g2;
            b1 = b2;
          }

        }
        this.pixelOutput[line * 1536 + 6 * i] = (r1 * bMult) & 0xff;
        this.pixelOutput[line * 1536 + 6 * i + 1] = (g1 * bMult) & 0xff;
        this.pixelOutput[line * 1536 + 6 * i + 2] = (b1 * bMult) & 0xff;
        this.pixelOutput[line * 1536 + 6 * i + 3] = (r2 * bMult) & 0xff;
        this.pixelOutput[line * 1536 + 6 * i + 4] = (g2 * bMult) & 0xff;
        this.pixelOutput[line * 1536 + 6 * i + 5] = (b2 * bMult) & 0xff;

        i++;

      }
      clearArray(this.spriteLineBuffer);
      if(!this.forcedBlank) {
        this.evaluateSprites(line);
      }
    }
  }

  this.getColor = function(sub, x, y) {

    let modeIndex = this.layer3Prio && this.mode === 1 ? 96 : 12 * this.mode;
    modeIndex = this.mode7ExBg && this.mode === 7 ? 108 : modeIndex;
    let count = this.layercountPerMode[this.mode];

    let j;
    let pixel = 0;
    let layer = 5;
    if(this.interlace && (this.mode === 5 || this.mode === 6)) {
      y = y * 2 + (this.evenFrame ? 1 : 0);
    }
    for(j = 0; j < count; j++) {
      let lx = x;
      let ly = y;
      layer = this.layersPerMode[modeIndex + j];
      if(
        (
          !sub && this.mainScreenEnabled[layer] &&
          (!this.mainScreenWindow[layer] || !this.getWindowState(lx, layer))
        ) || (
          sub && this.subScreenEnabled[layer] &&
          (!this.subScreenWindow[layer] || !this.getWindowState(lx, layer))
        )
      ) {
        if(this.mosaicEnabled[layer]) {
          lx -= lx % this.mosaicSize;
          ly -= (ly - this.mosaicStartLine) % this.mosaicSize;
        }
        lx += this.mode === 7 ? 0 : this.bgHoff[layer];
        ly += this.mode === 7 ? 0 : this.bgVoff[layer];
        let optX = lx - this.bgHoff[layer];
        if((this.mode === 5 || this.mode === 6) && layer < 4) {
          lx = lx * 2 + (sub ? 0 : 1);
          optX = optX * 2 + (sub ? 0 : 1);
        }

        //let origLx = lx;

        if((this.mode === 2 || this.mode === 4 || this.mode === 6) && layer < 2) {
          let andVal = layer === 0 ? 0x2000 : 0x4000;
          if(x === 0) {
            this.lastOrigTileX[layer] = lx >> 3;
          }
          // where the relevant tile started
          // TODO: lx can be above 0xffff (e.g. if scroll is 0xffff, and x > 0)
          let tileStartX = optX - (lx - (lx & 0xfff8));
          if((lx >> 3) !== this.lastOrigTileX[layer] && x > 0) {
            // we are fetching a new tile for the layer, get a new OPT-tile
            // if(logging && y === 32 && (this.mode === 2 || this.mode === 4 || this.mode === 6) && layer === 0) {
            //   log("at X = " + x + ", lx: " + getWordRep(lx) + ", fetched new tile for OPT");
            // }
            this.fetchTileInBuffer(
              this.bgHoff[2] + ((tileStartX - 1) & 0x1f8),
              this.bgVoff[2], 2, true
            );
            this.optHorBuffer[layer] = this.tilemapBuffer[2];
            if(this.mode === 4) {
              if((this.optHorBuffer[layer] & 0x8000) > 0) {
                this.optVerBuffer[layer] = this.optHorBuffer[layer];
                this.optHorBuffer[layer] = 0;
              } else {
                this.optVerBuffer[layer] = 0;
              }
            } else {
              this.fetchTileInBuffer(
                this.bgHoff[2] + ((tileStartX - 1) & 0x1f8),
                this.bgVoff[2] + 8, 2, true
              );
              this.optVerBuffer[layer] = this.tilemapBuffer[2];
            }
            this.lastOrigTileX[layer] = lx >> 3;
          }
          if((this.optHorBuffer[layer] & andVal) > 0) {
            //origLx = lx;
            let add = ((tileStartX + 7) & 0x1f8);
            lx = (lx & 0x7) + ((this.optHorBuffer[layer] + add) & 0x1ff8);
          }
          if((this.optVerBuffer[layer] & andVal) > 0) {
            ly = (this.optVerBuffer[layer] & 0x1fff) + (ly - this.bgVoff[layer]);
          }
        }
        // if(logging && y === 32 && (this.mode === 2 || this.mode === 4 || this.mode === 6) && layer === 0) {
        //   log("at X = " + x + ", lx: " + getWordRep(lx) + ", ly: " + getWordRep(ly) + ", optHB: " + getWordRep(this.optHorBuffer[layer]) + ", orig lx: " + getWordRep(origLx));
        // }

        pixel = this.getPixelForLayer(
          lx, ly,
          layer,
          this.prioPerMode[modeIndex + j]
        );
      }
      if((pixel & 0xff) > 0) {
        break;
      }
    }
    layer = j === count ? 5 : layer;
    let color = this.cgram[pixel & 0xff];
    if(
      this.directColor && layer < 4 &&
      this.bitPerMode[this.mode * 4 + layer] === 8
    ) {
      let r = ((pixel & 0x7) << 2) | ((pixel & 0x100) >> 7);
      let g = ((pixel & 0x38) >> 1) | ((pixel & 0x200) >> 8);
      let b = ((pixel & 0xc0) >> 3) | ((pixel & 0x400) >> 8);
      color = (b << 10) | (g << 5) | r;
    }

    return [color, layer, pixel];
  }

  this.getMathEnabled = function(x, l, pal) {
    if(
      this.preventMath === 3 ||
      (this.preventMath === 2 && this.getWindowState(x, 5)) ||
      (this.preventMath === 1 && !this.getWindowState(x, 5))
    ) {
      return false;
    }
    if(this.mathEnabled[l] && (l !== 4 || pal >= 0xc0)) {
      return true;
    }
    return false;
  }

  this.getWindowState = function(x, l) {
    if(!this.window1Enabled[l] && !this.window2Enabled[l]) {
      return false;
    }
    if(this.window1Enabled[l] && !this.window2Enabled[l]) {
      let test = x >= this.window1Left && x <= this.window1Right;
      return this.window1Inversed[l] ? !test : test;
    }
    if(!this.window1Enabled[l] && this.window2Enabled[l]) {
      let test = x >= this.window2Left && x <= this.window2Right;
      return this.window2Inversed[l] ? !test : test;
    }
    // both window enabled
    let w1test = x >= this.window1Left && x <= this.window1Right;
    w1test = this.window1Inversed[l] ? !w1test : w1test;
    let w2test = x >= this.window2Left && x <= this.window2Right;
    w2test = this.window2Inversed[l] ? !w2test : w2test;
    switch(this.windowMaskLogic[l]) {
      case 0: {
        return w1test || w2test;
      }
      case 1: {
        return w1test && w2test;
      }
      case 2: {
        return w1test !== w2test;
      }
      case 3: {
        return w1test === w2test;
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

    if(this.mode === 7) {
      return this.getMode7Pixel(x, y, l, p);
    }

    if(
      (x >> 3) !== this.lastTileFetchedX[l] ||
      y !== this.lastTileFetchedY[l]
    ) {
      this.fetchTileInBuffer(x, y, l, false);
      this.lastTileFetchedX[l] = (x >> 3);
      this.lastTileFetchedY[l] = y;
    }

    let mapWord = this.tilemapBuffer[l];
    if(((mapWord & 0x2000) >> 13) !== p) {
      // not the right priority
      return 0;
    }
    let paletteNum = (mapWord & 0x1c00) >> 10;
    let xShift = (mapWord & 0x4000) > 0 ? (x & 0x7) : 7 - (x & 0x7);

    paletteNum += this.mode === 0 ? l * 8 : 0;

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

    return tileData > 0 ? (paletteNum * mul + tileData) : 0;
  }

  this.fetchTileInBuffer = function(x, y, l, offset) {
    let rx = x;
    let ry = y;
    let useXbig = this.bigTiles[l] | this.mode === 5 | this.mode === 6;
    x >>= useXbig ? 1 : 0;
    y >>= this.bigTiles[l] ? 1 : 0;

    let adr = this.tilemapAdr[l] + (
      ((y & 0xff) >> 3) << 5 | ((x & 0xff) >> 3)
    );
    adr += ((x & 0x100) > 0 && this.tilemapWider[l]) ? 1024 : 0;
    adr += ((y & 0x100) > 0 && this.tilemapHigher[l]) ? (
      this.tilemapWider[l] ? 2048 : 1024
    ) : 0;
    this.tilemapBuffer[l] = this.vram[adr & 0x7fff];
    if(offset) {
      // for offset-per-tile, we only nees the tilemap byte,
      // don't fetch the tiles themselves
      return;
    }
    let yFlip = (this.tilemapBuffer[l] & 0x8000) > 0;
    let xFlip = (this.tilemapBuffer[l] & 0x4000) > 0;
    let yRow = yFlip ? 7 - (ry & 0x7) : (ry & 0x7);
    let tileNum = this.tilemapBuffer[l] & 0x3ff;

    tileNum += useXbig && (rx & 0x8) === (xFlip ? 0 : 8) ? 1 : 0;
    tileNum += this.bigTiles[l] && (ry & 0x8) === (yFlip ? 0 : 8) ? 0x10 : 0;

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
    let spriteCount = 0;
    let sliverCount = 0;
    // search through oam, backwards
    // TODO: wrong (?): OAM is searched forwards for sprites in range,
    // and it's these in-range sprites that are handled backwards for tile fetching
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
      if(sprRow < 0 || sprRow >= size * (this.objInterlace ? 4 : 8)) {
        // check if it is a sprite from the top of the screen
        sprRow = line + (256 - y);
      }
      if(
        sprRow >= 0 && sprRow < size * (this.objInterlace ? 4 : 8) &&
        x > -(size * 8)
      ) {
        // in range, show it
        if(spriteCount === 32) {
          // this would be the 33th sprite, exit the loop
          this.rangeOver = true;
          break;
        }
        sprRow = this.objInterlace ? sprRow * 2 + (
          this.evenFrame ? 1 : 0
        ) : sprRow;
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
            let tileNum = tile + this.spriteTileOffsets[
              tileRow * 8 + tileColumn
            ];
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

  this.generateMode7Coords = function(y) {
    let rY = this.mode7FlipY ? 255 - y : y;

    let clippedH = this.mode7Hoff - this.mode7X;
    clippedH = (clippedH & 0x2000) > 0 ? (clippedH | ~0x3ff) : (clippedH & 0x3ff);
    let clippedV = this.mode7Voff - this.mode7Y;
    clippedV = (clippedV & 0x2000) > 0 ? (clippedV | ~0x3ff) : (clippedV & 0x3ff);

    let lineStartX = (
      ((this.mode7A * clippedH) & ~63) +
      ((this.mode7B * rY) & ~63) + ((this.mode7B * clippedV) & ~63) +
      (this.mode7X << 8)
    );
    let lineStartY = (
      ((this.mode7C * clippedH) & ~63) +
      ((this.mode7D * rY) & ~63) + ((this.mode7D * clippedV) & ~63) +
      (this.mode7Y << 8)
    );

    this.mode7Xcoords[0] = lineStartX;
    this.mode7Ycoords[0] = lineStartY;

    for(let i = 1; i < 256; i++) {
      this.mode7Xcoords[i] = this.mode7Xcoords[i - 1] + this.mode7A;
      this.mode7Ycoords[i] = this.mode7Ycoords[i - 1] + this.mode7C;
    }
  }

  this.getMode7Pixel = function(x, y, l, p) {
    let pixelData = this.tilemapBuffer[0];
    if(x !== this.lastTileFetchedX[0] || y !== this.lastTileFetchedY[0]) {
      let rX = this.mode7FlipX ? 255 - x : x;

      let px = this.mode7Xcoords[rX] >> 8;
      let py = this.mode7Ycoords[rX] >> 8;

      let pixelIsTransparent = false;

      if(this.mode7LargeField && (px < 0 || px >= 1024 || py < 0 || py >= 1024)) {
        if(this.mode7Char0fill) {
          // always use tile 0
          px &= 0x7;
          py &= 0x7;
        } else {
          // act as transparent
          pixelIsTransparent = true;
        }
      }
      // fetch the right tilemap byte
      let tileX = (px & 0x3f8) >> 3;
      let tileY = (py & 0x3f8) >> 3;

      let tileByte = this.vram[(tileY * 128 + tileX)] & 0xff;
      // fetch the tile
      pixelData = this.vram[tileByte * 64 + (py & 0x7) * 8 + (px & 0x7)];
      pixelData >>= 8;
      pixelData = pixelIsTransparent ? 0 : pixelData;
      this.tilemapBuffer[0] = pixelData;
      this.lastTileFetchedX[0] = x;
      this.lastTileFetchedY[0] = y;
    }

    if(l === 1 && (pixelData >> 7) !== p) {
      // wrong priority
      return 0;
    } else if(l === 1) {
      return pixelData & 0x7f;
    }

    return pixelData;
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

  this.get13Signed = function(val) {
    if((val & 0x1000) > 0) {
      return -(8192 - (val & 0xfff));
    }
    return (val & 0xfff);
  }

  this.get16Signed = function(val) {
    if((val & 0x8000) > 0) {
      return -(65536 - val);
    }
    return val;
  }

  this.getMultResult = function(a, b) {
    b = b < 0 ? 65536 + b : b;
    b >>= 8;
    b = ((b & 0x80) > 0) ? -(256 - b) : b;
    let ans = a * b;
    if(ans < 0) {
      return 16777216 + ans;
    }
    return ans;
  }

  this.read = function(adr) {
    switch(adr) {
      case 0x34: {
        return this.multResult & 0xff;
      }
      case 0x35: {
        return (this.multResult & 0xff00) >> 8;
      }
      case 0x36: {
        return (this.multResult & 0xff0000) >> 16;
      }
      case 0x37: {
        if(this.snes.ppuLatch) {
          this.latchedHpos = this.snes.xPos >> 2;
          this.latchedVpos = this.snes.yPos;
          this.countersLatched = true;
        }
        return this.snes.openBus;
      }
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
        if(!this.vramIncOnHigh) {
          this.vramReadBuffer = this.vram[this.getVramRemap()];
          this.vramAdr += this.vramInc;
          this.vramAdr &= 0xffff;
        }
        return val & 0xff;
      }
      case 0x3a: {
        let val = this.vramReadBuffer;
        if(this.vramIncOnHigh) {
          this.vramReadBuffer = this.vram[this.getVramRemap()];
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
      case 0x3c: {
        let val;
        if(!this.latchHsecond) {
          val = this.latchedHpos & 0xff;
          this.latchHsecond = true;
        } else {
          val = (this.latchedHpos & 0xff00) >> 8;
          this.latchHsecond = false;
        }
        return val;
      }
      case 0x3d: {
        let val;
        if(!this.latchVsecond) {
          val = this.latchedVpos & 0xff;
          this.latchVsecond = true;
        } else {
          val = (this.latchedVpos & 0xff00) >> 8;
          this.latchVsecond = false;
        }
        return val;
      }
      case 0x3e: {
        let val = this.timeOver ? 0x80 : 0;
        val |= this.rangeOver ? 0x40 : 0;
        return val | 0x1;
      }
      case 0x3f: {
        let val = this.evenFrame ? 0x80 : 0;
        val |= this.countersLatched ? 0x40 : 0;
        if(this.snes.ppuLatch) {
          this.countersLatched = false;
        }
        this.latchHsecond = false;
        this.latchVsecond = false;
        return val | 0x3;
      }
    }
    return this.snes.openBus;
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
        this.oamSecond = false;
        return;
      }
      case 0x03: {
        this.oamInHigh = (value & 0x1) > 0;
        this.objPriority = (value & 0x80) > 0;
        this.oamAdr = this.oamRegAdr;
        this.oamRegInHigh = this.oamInHigh
        this.oamSecond = false;
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
        this.mosaicSize = ((value & 0xf0) >> 4) + 1;
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
      case 0x0d: {
        this.mode7Hoff = this.get13Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        // fall through to also set normal layer bgHoff
      }
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
      case 0x0e: {
        this.mode7Voff = this.get13Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        // fall through to also set normal layer bgVoff
      }
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
        this.vramRemap = (value & 0x0c) >> 2;
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
        // TODO: VRAM access during non-vblank and non-forced blank should be blocked,
        // but that makes Super Metroid unable to properly update tiles on screen
        // if(this.forcedBlank || this.snes.ypos > (this.frameOverscan ? 239 : 224)) {
          this.vram[adr] = (this.vram[adr] & 0xff00) | value;
        // }
        if(!this.vramIncOnHigh) {
          this.vramAdr += this.vramInc;
          this.vramAdr &= 0xffff;
        }
        return;
      }
      case 0x19: {
        let adr = this.getVramRemap();
        // if(this.forcedBlank || this.snes.ypos > (this.frameOverscan ? 239 : 224)) {
          this.vram[adr] = (this.vram[adr] & 0xff) | (value << 8);
        // }
        if(this.vramIncOnHigh) {
          this.vramAdr += this.vramInc;
          this.vramAdr &= 0xffff;
        }
        return;
      }
      case 0x1a: {
        this.mode7LargeField = (value & 0x80) > 0;
        this.mode7Char0fill = (value & 0x40) > 0;
        this.mode7FlipY = (value & 0x2) > 0;
        this.mode7FlipX = (value & 0x1) > 0;
        return;
      }
      case 0x1b: {
        this.mode7A = this.get16Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        this.multResult = this.getMultResult(this.mode7A, this.mode7B);
        return;
      }
      case 0x1c: {
        this.mode7B = this.get16Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        this.multResult = this.getMultResult(this.mode7A, this.mode7B);
        return;
      }
      case 0x1d: {
        this.mode7C = this.get16Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        return;
      }
      case 0x1e: {
        this.mode7D = this.get16Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        return;
      }
      case 0x1f: {
        this.mode7X = this.get13Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        return;
      }
      case 0x20: {
        this.mode7Y = this.get13Signed((value << 8) | this.mode7Prev);
        this.mode7Prev = value;
        return;
      }
      case 0x21: {
        this.cgramAdr = value;
        this.cgramSecond = false;
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
      case 0x23: {
        this.window1Inversed[0] = (value & 0x01) > 0;
        this.window1Enabled[0] = (value & 0x02) > 0;
        this.window2Inversed[0] = (value & 0x04) > 0;
        this.window2Enabled[0] = (value & 0x08) > 0;
        this.window1Inversed[1] = (value & 0x10) > 0;
        this.window1Enabled[1] = (value & 0x20) > 0;
        this.window2Inversed[1] = (value & 0x40) > 0;
        this.window2Enabled[1] = (value & 0x80) > 0;
        return;
      }
      case 0x24: {
        this.window1Inversed[2] = (value & 0x01) > 0;
        this.window1Enabled[2] = (value & 0x02) > 0;
        this.window2Inversed[2] = (value & 0x04) > 0;
        this.window2Enabled[2] = (value & 0x08) > 0;
        this.window1Inversed[3] = (value & 0x10) > 0;
        this.window1Enabled[3] = (value & 0x20) > 0;
        this.window2Inversed[3] = (value & 0x40) > 0;
        this.window2Enabled[3] = (value & 0x80) > 0;
        return;
      }
      case 0x25: {
        this.window1Inversed[4] = (value & 0x01) > 0;
        this.window1Enabled[4] = (value & 0x02) > 0;
        this.window2Inversed[4] = (value & 0x04) > 0;
        this.window2Enabled[4] = (value & 0x08) > 0;
        this.window1Inversed[5] = (value & 0x10) > 0;
        this.window1Enabled[5] = (value & 0x20) > 0;
        this.window2Inversed[5] = (value & 0x40) > 0;
        this.window2Enabled[5] = (value & 0x80) > 0;
        return;
      }
      case 0x26: {
        this.window1Left = value;
        return;
      }
      case 0x27: {
        this.window1Right = value;
        return;
      }
      case 0x28: {
        this.window2Left = value;
        return;
      }
      case 0x29: {
        this.window2Right = value;
        return;
      }
      case 0x2a: {
        this.windowMaskLogic[0] = value & 0x3;
        this.windowMaskLogic[1] = (value & 0xc) >> 2;
        this.windowMaskLogic[2] = (value & 0x30) >> 4;
        this.windowMaskLogic[3] = (value & 0xc0) >> 6;
        return;
      }
      case 0x2b: {
        this.windowMaskLogic[4] = value & 0x3;
        this.windowMaskLogic[5] = (value & 0xc) >> 2;
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
      case 0x2e: {
        this.mainScreenWindow[0] = (value & 0x1) > 0;
        this.mainScreenWindow[1] = (value & 0x2) > 0;
        this.mainScreenWindow[2] = (value & 0x4) > 0;
        this.mainScreenWindow[3] = (value & 0x8) > 0;
        this.mainScreenWindow[4] = (value & 0x10) > 0;
        return;
      }
      case 0x2f: {
        this.subScreenWindow[0] = (value & 0x1) > 0;
        this.subScreenWindow[1] = (value & 0x2) > 0;
        this.subScreenWindow[2] = (value & 0x4) > 0;
        this.subScreenWindow[3] = (value & 0x8) > 0;
        this.subScreenWindow[4] = (value & 0x10) > 0;
        return;
      }
      case 0x30: {
        this.colorClip = (value & 0xc0) >> 6;
        this.preventMath = (value & 0x30) >> 4;
        this.addSub = (value & 0x2) > 0;
        this.directColor = (value & 0x1) > 0;
        return;
      }
      case 0x31: {
        this.subtractColors = (value & 0x80) > 0;
        this.halfColors = (value & 0x40) > 0;
        this.mathEnabled[0] = (value & 0x1) > 0;
        this.mathEnabled[1] = (value & 0x2) > 0;
        this.mathEnabled[2] = (value & 0x4) > 0;
        this.mathEnabled[3] = (value & 0x8) > 0;
        this.mathEnabled[4] = (value & 0x10) > 0;
        this.mathEnabled[5] = (value & 0x20) > 0;
        return;
      }
      case 0x32: {
        if((value & 0x80) > 0) {
          this.fixedColorB = value & 0x1f;
        }
        if((value & 0x40) > 0) {
          this.fixedColorG = value & 0x1f;
        }
        if((value & 0x20) > 0) {
          this.fixedColorR = value & 0x1f;
        }
        return;
      }
      case 0x33: {
        this.mode7ExBg = (value & 0x40) > 0;
        this.pseudoHires = (value & 0x08) > 0;
        this.overscan = (value & 0x04) > 0;
        this.objInterlace = (value & 0x02) > 0;
        this.interlace = (value & 0x01) > 0;
        return;
      }
    }
  }

  this.setPixels = function(arr) {

    if(!this.frameOverscan) {
      // clear the top 8 and bottom 8 lines to transarent
      for(let i = 0; i < 512*16; i++) {
        let x = i % 512;
        let y = (i >> 9);
        let ind = (y * 512 + x) * 4;
        arr[ind + 3] = 0;
      }
      for(let i = 0; i < 512*16; i++) {
        let x = i % 512;
        let y = (i >> 9);
        let ind = ((y + 464) * 512 + x) * 4;
        arr[ind + 3] = 0;
      }
    }

    let addY = this.frameOverscan ? 0 : 14;

    for(let i = 512; i < 512 * (this.frameOverscan ? 240 : 225); i++) {
      let x = i % 512;
      let y = (i >> 9) * 2;
      let ind = ((y + addY) * 512 + x) * 4;
      let r = this.pixelOutput[i * 3];
      let g = this.pixelOutput[i * 3 + 1];
      let b = this.pixelOutput[i * 3 + 2];
      if(!this.frameInterlace || this.evenFrame) {
        arr[ind] = r;
        arr[ind + 1] = g;
        arr[ind + 2] = b;
        arr[ind + 3] = 255;
      }
      ind += 512 * 4;
      if(!this.frameInterlace || !this.evenFrame) {
        arr[ind] = r;
        arr[ind + 1] = g;
        arr[ind + 2] = b;
        arr[ind + 3] = 255;
      }
    }
  }

}
