# List of tested games and bugs
This is a list of all the games that I have tested and it notes the bugs for each one.

The following games seem to run without any obvious CPU/PPU bugs within the first few minutes of gameplay (and audio also seems to properly work (except for the echo), but is not really checked).

- Super Mario World
- Super Mario All-stars
- Super Mario All-stars + Super Mario World
- F-Zero
- The Legend of Zelda: A Link to the Past
- Mega Man X
- Super Castlevania IV
- Super Ghouls'n Ghosts
- R.P.M. Racing
- Tetris & Dr. Mario
- Lufia II
- Mohawk & Headphone Jack
- Most of PeterLemon's roms from [here](https://github.com/PeterLemon/SNES)
  - Except the ones marked below and the ones that use expansion chips or are sound-based.

The following games, however, have bugs.

- Super Metroid
  - Shows corrupted graphics when they load due to a full screen transition (like intro -> space colony, map -> game or title -> demo). The same graphics load fine when they load due to a (scrolling) room transition, though.
- A.S.P. - Air Strike Patrol
  - Has graphical problems, like the pre-stage briefing having shaking characters and the shadow during gameplay missing / glitching, among other things (mostly due to it using mid-scanline effects).
- Jurassic Park
  - Doesn't blank the left and right sides of the screen properly for the visible sub-screen pixels.
- Jurassic Park Part 2: The Chaos Continues
  - Palettes on the title screen get corrupted.
- Sparkster
  - Sometimes seems to render incorrect tiles to the screen and has the camera behaving oddly.
  - [bug #2](https://github.com/elzo-d/SnesJs/issues/2): This might lead to wall-clipping as well.
- Snes Burn-in Test (Rev. D)
  - Controller test doesn't color the background blue properly when it passes.
  - Sound module test gives error 76 (expected because DSP emulation is not fully complete yet).
  - Burn-in test gives FAIL for DMA, parts of the tilemap get corrupted, and it hangs on the HV-timer test.
- Snes Test Program
  - Controller test doesn't color the background blue properly when it passes.
  - Electronics test freezes on a black screen (hanging at the same spot as the burn-in test).
- PeterLemon's roms (from [here](https://github.com/PeterLemon/SNES)):
  - CPUTest/CPU/MSC: Freezes on a black screen when resetting for the STP-test (the PPU should not be reset when resetting the SNES).
  - Games/MonsterFarmHunter: Doesn't work properly when going in-game. A small row of white pixels near the top of the screen moves when pressing left or right (in the opposite direction), but nothing else works.
  - PPU/HDMA/HiColor128PerTileRow: Shows 7 horizontal black bars over the images.
  - PPU/Mosaic/Mode5: Mosaic doesn't show up properly.
- PPUBusActivity (rev. 2) (from [here](https://forums.nesdev.com/viewtopic.php?t=14467)):
  - Mosaic when booting doesn't show up properly for the mode 5 and 6-areas.
  - Offset-per-tile is wrong for the mode 6-area (is static, should be waving like the mode 2-area).
- Op Timing Test (v2) by Sour (from [here](https://forums.nesdev.com/viewtopic.php?f=12&t=18658&start=105)):
  - Header seems to specify wrong amount of banks, needed to set banks according to ROM size instead of trusting the header.
  - Timings are all somewhat off.
- Blargg's SPC tests (from [here](https://forums.nesdev.com/viewtopic.php?f=12&t=18005)):
  - These seem to be oddly sized, but resizing them to a multiple of 0x8000 bytes makes them boot.
  - spc_smp: fails on 'CPU Timing/mem access times': "B7969B23 Failed 02" (expected because the SPC is not cycle accurate).
  - spc_timer: fails on 'timer read vs write': "1111111222 033A4611 Failed 02".
  - spc_dsp6: faild on 'Echo/basic': "Failed 03" (expected because echo is not implemented yet).

## Broken SPC's

The following SPC's are known to not load or sound noticeably incorrect.

- Kirby Super Star: Peanut Plain
  - Some instruments are too loud / sound wrong.
