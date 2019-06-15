# SnesJs
A SNES emulator, in javascript

Try it online [here](https://elzo-d.github.io/SnesJs/).

## About

This is my attempt at making a SNES emulator in Javascript. It is currently able to run some of the earlier games in the library, but without sound, and (at least on a 5th gen Core i5) not at full speed.

The 65816 CPU is fully functional, but emulation mode is not supported. It is also not cycle-accurate.

The PPU is able to render most things fine. There are some issues with color math, mosaic and offset-per-tile, and other small things that are not quite right yet. It renders per scanline, so mid-scanline effects are not supported.

DMA, HDMA and the other misc. features are supported, but not cycle-accurate.

The SPC700 audio CPU is emulated, but is not cycle accurate, and does not run at the right speed yet. It seems to have some issues with certain games (they freeze on boot or during gameplay, waiting on a response from it). This might be because of the speed being wrong, though.

The DSP (audio generation unit) is not emulated yet (this might also be the cause for some of the games freezing).

Some games seem to have other problems as well, which are probably caused by bugs in the CPU emulation or in the other features.

It can currently only load LOROM games.

Roms can be loaded from zip-files as well, which will load the first file with a .sfc or .smc extension it can find.

## Controls

Controller 1 and 2 are emulated as plugged in, but only controller 1 has controls set up.

| Button      | Keyboard        |
| ----------- | --------------- |
| D-pad up    | Up arrow key    |
| D-pad down  | Down arrow key  |
| D-pad left  | Left arrow key  |
| D-pad right | Right arrow key |
| Start       | Enter           |
| Select      | Shift           |
| A           | X               |
| B           | Z               |
| X           | S               |
| Y           | A               |
| L           | D               |
| R           | C               |

Pressing L will toggle 'log-mode', where it runs a single instruction each frame and logs it in trace-log format.

## Usage

Can be used online [here](https://elzo-d.github.io/SnesJs/).

To run offline:
- Clone this repository.
- Open `index.js` in a browser. Messing around with the browser's autoplay policy might be required.

## Resources

Resources that I used for implementing this:

- The WDC datasheet for the W65C816S cpu.
- The [65C816 opcodes tutorial](http://6502.org/tutorials/65c816opcodes.html) from 6502.org.
- The [65816 opcode matrix](http://www.oxyron.de/html/opcodes816.html) from oxyron.de (the cycle timing and notes there aren't fully accurate).
- The [SuperFamicon wiki](https://wiki.superfamicom.org).
- The in-progress [SnesDev Wiki](https://snesdev.mesen.ca/wiki/index.php?title=Main_Page) by [Sour](https://github.com/SourMesen).
- Some quick peeks at Sour's [Mesen-S source](https://github.com/SourMesen/Mesen-S).
- The [nocach fullsnes document](https://problemkaputt.de/fullsnes.txt).
- Some posts in the [SnesDev section](https://forums.nesdev.com/viewforum.php?f=12) of the NesDev forums.
- The [Super NES Programming pages](https://en.wikibooks.org/wiki/Super_NES_Programming) in Wikibooks.
- Various roms (especially the CPU tests) by PeterLemon found [here](https://github.com/PeterLemon/SNES).
- Some of the wrapper code is based on my [NES emulator](https://github.com/elzo-d/NesJs).
- The [zip.js](https://gildas-lormeau.github.io/zip.js/) library is used for zipped rom loading support.
