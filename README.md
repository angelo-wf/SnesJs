# SnesJs
A SNES emulator, in javascript

Try it online [here](https://angelo-wf.github.io/SnesJs/).

## Note

I don't think I will continue working on this Javascript emulator, and I have archived this repository.

Although it is a nice proof of concept, not being able to run at full speed (on my hardware) makes working on it quite annoying. I originally started it because my Javascript NES emulator ([here](https://github.com/angelo-wf/NesJs)) ran full speed (on my hardware) quite easily, even though it it not really optimised at all. This made me think emulating the SNES full speed might be possible as well. This however does not seem to be the case.

I did once decide to work on a SNES emulator in C, LakeSnes, over [here](https://github.com/angelo-wf/LakeSnes). It has better performance (although still not all that good, but at least it runs full speed) and some of the bugs and shortcomings this emulator has are not present in the C version. I was planning on looking into using Emscripten to have that core run in the browser and use it in this emulator, instead of using the current all-Javascript core. However, some personal/mental issues mean that I don't really have the motivation to work on it any further (or really, on emulation in general). There are some forks of it (LakeSnes) that might be of interest though.

## About

This was my attempt at making a SNES emulator in Javascript. It is currently able to run some of the earlier games in the library with mostly correct audio. It is however extremely slow, on a 5th gen Core i5 it is not able to run at full speed. Even on systems where it is able to run at full speed it would still use way more CPU than a SNES emulator should really take.

The 65816 CPU is fully functional, but emulation mode is not supported. It is also not cycle-accurate.

The PPU is able to render most things fine. There are some issues with color math, mosaic and offset-per-tile, and other small things that are not quite right yet. It renders per scanline, so mid-scanline effects are not supported.

DMA, HDMA and the other misc. features are supported, but not cycle-accurate.

The SPC700 audio CPU is emulated, but is not cycle accurate.

The DSP (audio generation unit) is mostly emulated, but is missing the echo. Most games sound mostly right, but there are still some issues.

Although some games seem to run fine, quite a few games are not emulated properly. The file `bugs.md` contains a list of games that have been tested and the problems they have. Most of these bugs are probably caused by some known problems with the PPU and missing edge cases for (H)DMA and timing.

It can currently only load LOROM games.

Roms can be loaded from zip-files as well, which will load the first file with a .sfc or .smc extension it can find.

The `spcplayer.html` file, linked from the main emulator as well, contains SpcJs, an SPC player using just the APU portion of the emulator. Not all SPC files play correctly, but most seem to work.

Note that it currently assumes the AudioContext uses a sample rate of 44100, audio will sound somewhat incorrect if it's not.

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

- Pressing L will toggle 'log-mode', where it runs a single CPU-instruction each frame and logs it in trace-log format.
- Pressing P will toggle 'no-PPU mode', where it will not emulate the PPU rendering. This allows it to run at full speed, and makes working on / listening to the DSP easier.

## Usage

The emulator can be used online [here](https://angelo-wf.github.io/SnesJs/).

To run the emulator offline:
- Clone this repository.
- Open `index.js` in a browser. Messing around with the browser's autoplay policy might be required.

The [SpcJs](https://angelo-wf.github.io/SnesJs/spcplayer.html) link goes to a SPC player, which simply plays SPC files (most files seem to load correctly, but a few don't sound quite right). It shows the name, game, artist, dumper and comment from the SPC file, and a visualisation of the volume L & R (red & green), gain (yellow) and pitch (blue) for each channel (1 to 8, from left to right). Pressing L toggles 'log-mode', where it runs a single SPC-instruction each frame and logs it in trace-log format.

## Resources

Resources that I used for implementing this:

- The WDC datasheet for the W65C816S cpu.
- The [65C816 opcodes tutorial](http://6502.org/tutorials/65c816opcodes.html) from 6502.org.
- The [65816 opcode matrix](http://www.oxyron.de/html/opcodes816.html) from oxyron.de (the cycle timing and notes there aren't fully accurate, and the addressing modes IAL and IAX are swapped for JMP (opcodes $7C and $EC)).
- The [SuperFamicon wiki](https://wiki.superfamicom.org).
- The in-progress(?) [SnesDev Wiki](https://snesdev.mesen.ca/wiki/index.php?title=Main_Page) by Sour.
- Some quick peeks at Sour's [Mesen-S source](https://github.com/SourMesen/Mesen-S).
- Some quick peeks at Byuu's [Higan source](https://github.com/byuu/higan).
- The [nocach fullsnes document](https://problemkaputt.de/fullsnes.txt).
- Some posts and resources in the [SnesDev section](https://forums.nesdev.com/viewforum.php?f=12) of the NesDev forums.
- The [Super NES Programming pages](https://en.wikibooks.org/wiki/Super_NES_Programming) in Wikibooks.
- Various roms (especially the CPU tests) by PeterLemon/krom found [here](https://github.com/PeterLemon/SNES).
- Various SPC and DSP test by Blargg (from [here](https://forums.nesdev.com/viewtopic.php?f=12&t=10697&p=121027#p121027) and [here](https://forums.nesdev.com/viewtopic.php?f=12&t=18005))
- The source for the BRR-tools from [SMW central](https://www.smwcentral.net), found [here](https://github.com/jimbo1qaz/BRRtools/tree/32-bit-samples).
- Some of the wrapper code is based on my [NES emulator](https://github.com/elzo-d/NesJs).
- The [zip.js](https://gildas-lormeau.github.io/zip.js/) library is used for zipped rom loading support.

## License

Licensed under the MIT License. See `LICENSE.txt` for details.
