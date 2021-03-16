# List of tested games and bugs
This is a list of all the games that I have tested and it notes the bugs for each one.

The following games seem to run without any obvious CPU/PPU bugs within the first few minutes of gameplay (and audio also seems to work properly, except for the echo, but is not really checked).

- Super Mario World
- Super Mario All-stars
- Super Mario All-stars + Super Mario World
- F-Zero
- Super Metroid
- The Legend of Zelda: A Link to the Past
- Mega Man X
- Super Castlevania IV
- Super Ghouls'n Ghosts
- R.P.M. Racing
- Tetris & Dr. Mario
- Lufia II
- Mohawk & Headphone Jack
- Aladdin
- Most of PeterLemon's roms from [here](https://github.com/PeterLemon/SNES)
  - Except those marked below and those that use expansion chips.

The following games, however, have bugs.

- A.S.P. - Air Strike Patrol
  - Has graphical problems, like the pre-stage briefing having shaking characters and the shadow during gameplay missing / glitching, among other things (mostly due to it using mid-scanline effects).
- Jurassic Park
  - Doesn't blank the left and right sides of the screen properly for the visible sub-screen pixels.
- Jurassic Park Part 2: The Chaos Continues
  - Palettes on the title screen get corrupted.
- Sparkster
  - Seems to render incorrect tiles to the screen and has the camera behaving oddly at the end of the first stage
  - [bug #2](https://github.com/elzo-d/SnesJs/issues/2): This might lead to wall-clipping as well.
- Snes Burn-in Test (Rev. D)
  - Controller test doesn't color the background blue properly when it passes.
  - Sound module test gives error 76 (expected because DSP emulation is not fully complete yet).
  - Burn-in test gives FAIL for APU (with code 12).
- Snes Test Program
  - Controller test doesn't color the background blue properly when it passes.
- PeterLemon's roms (from [here](https://github.com/PeterLemon/SNES)):
  - CPUTest/CPU/MSC: Freezes on a black screen when resetting for the STP-test (the PPU should not be reset when resetting the SNES).
  - Games/MonsterFarmHunter: Doesn't work properly when going in-game. A small row of white pixels near the top of the screen moves when pressing left or right (in the opposite direction), but nothing else works.
  - PPU/HDMA/HiColor128PerTileRow: Shows 7 horizontal black bars over the images.
  - PPU/Mosaic/Mode5: Mosaic doesn't show up properly.
  - SPC700/PitchMod: Doesn't seem to produce any sound.
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
- Multiple Super Mario World hacks:
  - Some (older?) hacks freeze at boot, with overscan enabled (A Super Mario Thing, Classic Mario World 2, Something).
  - Most other (newer?) hacks work fine, though.
- Sonic for SNES demo (from [here](https://forums.nesdev.com/viewtopic.php?f=12&t=20638)):
  - Shows extreme amount of flashing black bars during play
  - Music does not play correctly, notes are missing
- 2.68 MHz Demo:
  - Seems to be oddly sized, but resizing it to a multiple of 0x8000 bytes makes it boot.
  - Freezes with audio playing.

Additionally, most of the tricky to emulate games [here](https://snesdev.mesen.ca/wiki/index.php?title=Tricky-to-emulate_games) do indeed not run correctly (although some do), with some possibly showing other issues as well (like Aerobiz).

## Broken SPC's

The following SPC's are known to not load or sound noticeably incorrect.

- Kirby Super Star: Peanut Plain
  - Some instruments are too loud / sound wrong.
