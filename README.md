# SnesJs
A SNES emulator, in javascript

My attempt at making a SNES emulator in Javascript. Currently working on the CPU emulation.

This will probably never end up being an accurate emulator, but I hope to have some games running at least. There is also a pretty big chance that it won't be able to run at full speed.

Note that the CPU will not support emulation mode (at least for now), because it makes the code a lot more complicated (and probably slower), and no games seem to actually make use of it.

## Resources

Resources that I used for implementing this:

- The WDC datasheet for the W65C816S cpu.
- The [65C816 opcodes tutorial](http://6502.org/tutorials/65c816opcodes.html) from 6502.org.
- The [65816 opcode matrix](http://www.oxyron.de/html/opcodes816.html) from oxyron.de (the cycle timing and notes there aren't fully accurate)
