
Cpu = (function() {
  // indexes in register arrays
  const DBR = 0; // data bank register
  const K = 1; // program bank

  const A = 0;
  const X = 1;
  const Y = 2;
  const SP = 3;
  const PC = 4;
  const DPR = 5; // direct page register

  // addressing modes
  const IMP = 0; // or ACC
  const IMM = 1; // always 8 bit
  const IMMm = 2; // size depends on m flag
  const IMMx = 3; // size depends on x flag
  const IMMl = 4; // always 16 bit
  const DP = 5;
  const DPX = 6;
  const DPY = 7;
  const IDP = 8
  const IDX = 9;
  const IDY = 10; // for RMW and writes
  const IDYr = 11; // for reads
  const IDL = 12;
  const ILY = 13;
  const SR = 14;
  const ISY = 15;
  const ABS = 16;
  const ABX = 17; // for RMW and writes
  const ABXr = 18; // for reads
  const ABY = 19; // for RMW and writes
  const ABYr = 20; // for reads
  const ABL = 21;
  const ALX = 22;
  const IND = 23;
  const IAX = 24;
  const IAL = 25;
  const REL = 26;
  const RLL = 27;
  const BM = 28; // block move

  return function(mem) {

    // memory handler
    this.mem = mem;

    // registers
    this.r = new Uint8Array(2);
    this.br = new Uint16Array(6);

    // modes for each instruction
    this.modes = [
      IMP, IDX, IMM, SR , DP , DP , DP , IDL, IMP, IMMm,IMP, IMP, ABS, ABS, ABS, ABL,
      REL, IDYr,IDP, ISY, DP , DPX, DPX, ILY, IMP, ABYr,IMP, IMP, ABS, ABXr,ABX, ALX,
      ABS, IDX, ABL, SR , DP , DP , DP , IDL, IMP, IMMm,IMP, IMP, ABS, ABS, ABS, ABL,
      REL, IDYr,IDP, ISY, DPX, DPX, DPX, ILY, IMP, ABYr,IMP, IMP, ABXr,ABXr,ABX, ALX,
      IMP, IDX, IMM, SR , BM , DP , DP , IDL, IMP, IMMm,IMP, IMP, ABS, ABS, ABS, ABL,
      REL, IDYr,IDP, ISY, BM , DPX, DPX, ILY, IMP, ABYr,IMP, IMP, ABL, ABXr,ABX, ALX,
      IMP, IDX, RLL, SR , DP , DP , DP , IDL, IMP, IMMm,IMP, IMP, IND, ABS, ABS, ABL,
      REL, IDYr,IDP, ISY, DPX, DPX, DPX, ILY, IMP, ABYr,IMP, IMP, IAX, ABXr,ABX, ALX,
      REL, IDX, RLL, SR , DP , DP , DP , IDL, IMP, IMMm,IMP, IMP, ABS, ABS, ABS, ABL,
      REL, IDY, IDP, ISY, DPX, DPX, DPY, ILY, IMP, ABY, IMP, IMP, ABS, ABX, ABX, ALX,
      IMMx,IDX, IMMx,SR , DP , DP , DP , IDL, IMP, IMMm,IMP, IMP, ABS, ABS, ABS, ABL,
      REL, IDYr,IDP, ISY, DPX, DPX, DPY, ILY, IMP, ABYr,IMP, IMP, ABXr,ABXr,ABYr,ALX,
      IMMx,IDX, IMM, SR , DP , DP , DP , IDL, IMP, IMMm,IMP, IMP, ABS, ABS, ABS, ABL,
      REL, IDYr,IDP, ISY, DP , DPX, DPX, ILY, IMP, ABYr,IMP, IMP, IAL, ABXr,ABX, ALX,
      IMMx,IDX, IMM, SR , DP , DP , DP , IDL, IMP, IMMm,IMP, IMP, ABS, ABS, ABS, ABL,
      REL, IDYr,IDP, ISY, IMMl,DPX, DPX, ILY, IMP, ABYr,IMP, IMP, IAX, ABXr,ABX, ALX,
      IMP, IMP, IMP // abo, nmi, irq
    ];

    // cycles for each instruction
    this.cycles = [
      7, 6, 7, 4, 5, 3, 5, 6, 3, 2, 2, 4, 6, 4, 6, 5,
      2, 5, 5, 7, 5, 4, 6, 6, 2, 4, 2, 2, 6, 4, 7, 5,
      6, 6, 8, 4, 3, 3, 5, 6, 4, 2, 2, 5, 4, 4, 6, 5,
      2, 5, 5, 7, 4, 4, 6, 6, 2, 4, 2, 2, 4, 4, 7, 5,
      6, 6, 2, 4, 7, 3, 5, 6, 3, 2, 2, 3, 3, 4, 6, 5,
      2, 5, 5, 7, 7, 4, 6, 6, 2, 4, 3, 2, 4, 4, 7, 5,
      6, 6, 6, 4, 3, 3, 5, 6, 4, 2, 2, 6, 5, 4, 6, 5,
      2, 5, 5, 7, 4, 4, 6, 6, 2, 4, 4, 2, 6, 4, 7, 5,
      3, 6, 4, 4, 3, 3, 3, 6, 2, 2, 2, 3, 4, 4, 4, 5,
      2, 6, 5, 7, 4, 4, 4, 6, 2, 5, 2, 2, 4, 5, 5, 5,
      2, 6, 2, 4, 3, 3, 3, 6, 2, 2, 2, 4, 4, 4, 4, 5,
      2, 5, 5, 7, 4, 4, 4, 6, 2, 4, 2, 2, 4, 4, 4, 5,
      2, 6, 3, 4, 3, 3, 5, 6, 2, 2, 2, 3, 4, 4, 6, 5,
      2, 5, 5, 7, 6, 4, 6, 6, 2, 4, 3, 3, 6, 4, 7, 5,
      2, 6, 3, 4, 3, 3, 5, 6, 2, 2, 2, 3, 4, 4, 6, 5,
      2, 5, 5, 7, 5, 4, 6, 6, 2, 4, 4, 2, 8, 4, 7, 5,
      7, 7, 7 // abo, nmi, irq
    ];

    // function table is at bottom

    this.reset = function() {

      this.r[DBR] = 0;
      this.r[K] = 0;

      this.br[A] = 0;
      this.br[X] = 0;
      this.br[Y] = 0;
      this.br[SP] = 0;
      this.br[DPR] = 0;

      if(this.mem.read) {
        // read emulation mode reset vector
        this.br[PC] = this.mem.read(0xfffc) | (this.mem.read(0xfffd) << 8);
      } else {
        // if read function is not defined yet
        this.br[PC] = 0;
      }

      // flags
      this.n = false;
      this.v = false;
      this.m = true;
      this.x = true;
      this.d = false;
      this.i = false;
      this.z = false;
      this.c = false;
      this.e = true;

      // interrupts wanted
      this.irqWanted = false;
      this.nmiWanted = false;
      this.aboWanted = false;

      // power state
      this.stopped = false;
      this.waiting = false;

      // cycles left
      this.cyclesLeft = 7;

    }
    this.reset();

    this.cycle = function() {
      if(this.cyclesLeft === 0) {
        if(this.stopped) {
          // stopped
          this.cyclesLeft = 1;
        } else if(!this.waiting) {
          // read opcode byte
          let instr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          this.cyclesLeft = this.cycles[instr];
          let mode = this.modes[instr];
          // test for interrupt
          if((this.irqWanted && !this.i) || this.nmiWanted || this.aboWanted) {
            this.br[PC]--;
            if(this.aboWanted) {
              this.aboWanted = false;
              instr = 0x100;
            } else if(this.nmiWanted) {
              this.nmiWanted = false;
              instr = 0x101;
            } else {
              // irq (level sensitive instead of edge sensitive)
              instr = 0x102;
            }
            this.cyclesLeft = this.cycles[instr];
            mode = this.modes[instr];
          }
          // execute the instruction
          let adrs = this.getAdr(instr, mode);
          // TEMP: log unknown instruction
          if(this.functions[instr] === undefined) {
            this.uni(adrs[0], adrs[1], instr);
          } else {
            this.functions[instr].call(this, adrs[0], adrs[1]);
          }
        } else {
          // waiting on interrupt
          if(this.abortWanted || this.irqWanted || this.nmiWanted) {
            this.waiting = false;
            // on next cycle, find the nmi or abort and start executing it,
            // or continue on as a fast irq if i is 1
          }
          this.cyclesLeft = 1;
        }
      }
      this.cyclesLeft--;
    }

    this.getP = function() {
      let val = 0;
      val |= this.n ? 0x80 : 0;
      val |= this.v ? 0x40 : 0;
      val |= this.m ? 0x20 : 0;
      val |= this.x ? 0x10 : 0;
      val |= this.d ? 0x08 : 0;
      val |= this.i ? 0x04 : 0;
      val |= this.z ? 0x02 : 0;
      val |= this.c ? 0x01 : 0;
      return val;
    }

    this.setP = function(value) {
      this.n = (value & 0x80) > 0;
      this.v = (value & 0x40) > 0;
      this.m = (value & 0x20) > 0;
      this.x = (value & 0x10) > 0;
      this.d = (value & 0x08) > 0;
      this.i = (value & 0x04) > 0;
      this.z = (value & 0x02) > 0;
      this.c = (value & 0x01) > 0;
      if(this.x) {
        this.br[X] &= 0xff;
        this.br[Y] &= 0xff;
      }
    }

    this.setZandN = function(value, byte) {
      // sets Zero and Negative depending on 8-bit or 16-bit value
      if(byte) {
        this.z = (value & 0xff) === 0;
        this.n = (value & 0x80) > 0;
        return;
      }
      this.z = (value & 0xffff) === 0;
      this.n = (value & 0x8000) > 0;
    }

    this.getSigned = function(value, byte) {
      // turns unsinged value 0 - 255 or 0 - 65536
      // to signed -128 - 127 or -32768 - 32767
      if(byte) {
        return (value & 0xff) > 127 ? -(256 - (value & 0xff)) : (value & 0xff);
      }
      return value > 32767 ? -(65536 - value) : value;
    }

    this.doBranch = function(check, rel) {
      if(check) {
        // taken branch: 1 extra cycle
        this.cyclesLeft++;
        this.br[PC] += rel;
      }
    }

    this.pushByte = function(value) {
      if(this.e) {
        this.mem.write((this.br[SP] & 0xff) | 0x100, value);
      } else {
        this.mem.write(this.br[SP], value);
      }
      this.br[SP]--;
    }

    this.pullByte = function() {
      this.br[SP]++;
      if(this.e) {
        return this.mem.read((this.br[SP] & 0xff) | 0x100);
      }
      return this.mem.read(this.br[SP]);
    }

    this.pushWord = function(value) {
      this.pushByte((value & 0xff00) >> 8);
      this.pushByte(value & 0xff);
    }

    this.pullWord = function() {
      let value = this.pullByte();
      value |= this.pullByte() << 8;
      return value;
    }

    this.readWord = function(adr, adrh) {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      return value;
    }

    this.writeWord = function(adr, adrh, result, reversed = false) {
      if(reversed) {
        // RMW opcodes write the high byte first
        this.mem.write(adrh, (result & 0xff00) >> 8);
        this.mem.write(adr, result & 0xff);
      } else {
        this.mem.write(adr, result & 0xff);
        this.mem.write(adrh, (result & 0xff00) >> 8);
      }
    }

    this.getAdr = function(opcode, mode) {
      // gets the effective address (low and high), for the given adressing mode
      switch(mode) {
        case IMP: {
          // implied
          return [0, 0];
        }

        case IMM: {
          // immediate, always 8 bit
          return [(this.r[K] << 16) | this.br[PC]++, 0];
        }

        case IMMm: {
          // immediate, depending on m
          if(this.m) {
            return [(this.r[K] << 16) | this.br[PC]++, 0];
          } else {
            let low = (this.r[K] << 16) | this.br[PC]++;
            return [low, (this.r[K] << 16) | this.br[PC]++];
          }
        }

        case IMMx: {
          // immediate, depending on x
          if(this.x) {
            return [(this.r[K] << 16) | this.br[PC]++, 0];
          } else {
            let low = (this.r[K] << 16) | this.br[PC]++;
            return [low, (this.r[K] << 16) | this.br[PC]++];
          }
        }

        case IMMl: {
          // immediate, always 16 bit
          let low = (this.r[K] << 16) | this.br[PC]++;
          return [low, (this.r[K] << 16) | this.br[PC]++];
        }

        case DP: {
          // direct page
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          return [
            (this.br[DPR] + adr) & 0xffff,
            (this.br[DPR] + adr + 1) & 0xffff
          ];
        }

        case DPX: {
          // direct page indexed on X
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          return [
            (this.br[DPR] + adr + this.br[X]) & 0xffff,
            (this.br[DPR] + adr + this.br[X] + 1) & 0xffff
          ];
        }

        case DPY: {
          // direct page indexed on Y
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          return [
            (this.br[DPR] + adr + this.br[Y]) & 0xffff,
            (this.br[DPR] + adr + this.br[Y] + 1) & 0xffff
          ];
        }

        case IDP: {
          // direct indirect
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          let pointer = this.mem.read((this.br[DPR] + adr) & 0xffff);
          pointer |= (
            this.mem.read((this.br[DPR] + adr + 1) & 0xffff)
          ) << 8;
          return [
            (this.r[DBR] << 16) + pointer,
            (this.r[DBR] << 16) + pointer + 1
          ];
        }

        case IDX: {
          // direct indirect indexed
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          let pointer = this.mem.read(
            (this.br[DPR] + adr + this.br[X]) & 0xffff
          );
          pointer |= (
            this.mem.read((this.br[DPR] + adr + this.br[X] + 1) & 0xffff)
          ) << 8;
          return [
            (this.r[DBR] << 16) + pointer,
            (this.r[DBR] << 16) + pointer + 1
          ];
        }

        case IDY: {
          // indirect direct indexed, for RMW and writes
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          let pointer = this.mem.read((this.br[DPR] + adr) & 0xffff);
          pointer |= (
            this.mem.read((this.br[DPR] + adr + 1) & 0xffff)
          ) << 8;
          return [
            (this.r[DBR] << 16) + pointer + this.br[Y],
            (this.r[DBR] << 16) + pointer + this.br[Y] + 1
          ];
        }

        case IDYr: {
          // indirect direct indexed, for reads (possible extra cycle)
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          let pointer = this.mem.read((this.br[DPR] + adr) & 0xffff);
          pointer |= (
            this.mem.read((this.br[DPR] + adr + 1) & 0xffff)
          ) << 8;
          if(((pointer >> 8) !== ((pointer + this.br[Y]) >> 8)) || !this.x) {
            // if page is crossed, or x is 0: 1 extra cycle
            this.cyclesLeft++;
          }
          return [
            (this.r[DBR] << 16) + pointer + this.br[Y],
            (this.r[DBR] << 16) + pointer + this.br[Y] + 1
          ];
        }

        case IDL: {
          // indirect direct long
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          let pointer = this.mem.read((this.br[DPR] + adr) & 0xffff);
          pointer |= (
            this.mem.read((this.br[DPR] + adr + 1) & 0xffff)
          ) << 8;
          pointer |= (
            this.mem.read((this.br[DPR] + adr + 2) & 0xffff)
          ) << 16;
          return [pointer, pointer + 1];
        }

        case ILY: {
          // indirect direct long indexed
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          if((this.br[DPR] & 0xff) !== 0) {
            // DPRl not 0: 1 extra cycle
            this.cyclesLeft++;
          }
          let pointer = this.mem.read((this.br[DPR] + adr) & 0xffff);
          pointer |= (
            this.mem.read((this.br[DPR] + adr + 1) & 0xffff)
          ) << 8;
          pointer |= (
            this.mem.read((this.br[DPR] + adr + 2) & 0xffff)
          ) << 16;
          return [pointer + this.br[Y], pointer + this.br[Y] + 1];
        }

        case SR: {
          // stack relative
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          return [
            (this.br[SP] + adr) & 0xffff,
            (this.br[SP] + adr + 1) & 0xffff,
          ];
        }

        case ISY: {
          // stack relative indexed
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          let pointer = this.mem.read((this.br[SP] + adr) & 0xffff);
          pointer |= (
            this.mem.read((this.br[SP] + adr + 1) & 0xffff)
          ) << 8;
          return [
            (this.r[DBR] << 16) + pointer + this.br[Y],
            (this.r[DBR] << 16) + pointer + this.br[Y] + 1,
          ];
        }

        case ABS: {
          // absolute
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          return [(this.r[DBR] << 16) + adr, (this.r[DBR] << 16) + adr + 1];
        }

        case ABX: {
          // absolute, indexed by X for RMW and writes
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          return [
            (this.r[DBR] << 16) + adr + this.br[X],
            (this.r[DBR] << 16) + adr + this.br[X] + 1
          ];
        }

        case ABXr: {
          // absolute, indexed by X for reads (possible extra cycle)
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          if(((adr >> 8) !== ((adr + this.br[X]) >> 8)) || !this.x) {
            // if page crossed or x is 0: 1 extra cycle
            this.cyclesLeft++;
          }
          return [
            (this.r[DBR] << 16) + adr + this.br[X],
            (this.r[DBR] << 16) + adr + this.br[X] + 1
          ];
        }

        case ABY: {
          // absolute, indexed by Y for RMW and writes
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          return [
            (this.r[DBR] << 16) + adr + this.br[Y],
            (this.r[DBR] << 16) + adr + this.br[Y] + 1
          ];
        }

        case ABYr: {
          // absolute, indexed by Y for reads (possible extra cycle)
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          if(((adr >> 8) !== ((adr + this.br[Y]) >> 8)) || !this.x) {
            // if page crossed or x is 0: 1 extra cycle
            this.cyclesLeft++;
          }
          return [
            (this.r[DBR] << 16) + adr + this.br[Y],
            (this.r[DBR] << 16) + adr + this.br[Y] + 1
          ];
        }

        case ABL: {
          // absoulte long
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 16;
          return [adr, adr + 1];
        }

        case ALX: {
          // absoulte long indexed
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 16;
          return [adr + this.br[X], adr + this.br[X] + 1];
        }

        case IND: {
          // indirect
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          let pointer = this.mem.read(adr);
          pointer |= this.mem.read((adr + 1) & 0xffff) << 8;
          return [(this.r[K] << 16) + pointer, 0];
        }

        case IAX: {
          // indirect indexed
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          let pointer = this.mem.read(
            (this.r[K] << 16) | ((adr + this.br[X]) & 0xffff)
          );
          pointer |= this.mem.read(
            (this.r[K] << 16) | ((adr + this.br[X] + 1) & 0xffff)
          ) << 8;
          return [(this.r[K] << 16) + pointer, 0];
        }

        case IAL: {
          // indirect long
          let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          let pointer = this.mem.read(adr);
          pointer |= this.mem.read((adr + 1) & 0xffff) << 8;
          pointer |= this.mem.read((adr + 2) & 0xffff) << 16;
          return [pointer, 0];
        }

        case REL: {
          // relative
          let rel = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          return [this.getSigned(rel, true), 0];
        }

        case RLL: {
          // relative long
          let rel = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          rel |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
          return [this.getSigned(rel, false), 0];
        }

        case BM: {
          // block move
          let dest = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          let src = this.mem.read((this.r[K] << 16) | this.br[PC]++);
          return [dest, src];
        }
      }
    }

    // instruction functions

    this.uni = function(adr, adrh, instr) {
      // unimplemented
      console.log(
        "Uninplemented instruction: " + instr.toString(16) +
        " reading at adrl " + adr.toString(16) +
        " and adrh " + adrh.toString(16)
      );
    }

    this.adc = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        let result;
        if(this.d) {
          result = (this.br[A] & 0xf) + (value & 0xf) + (this.c ? 1 : 0);
          result += result > 9 ? 6 : 0;
          result = (
            (this.br[A] & 0xf0) + (value & 0xf0) +
            (result > 0xf ? 0x10 : 0) + (result & 0xf)
          );
        } else {
          result = (this.br[A] & 0xff) + value + (this.c ? 1 : 0);
        }
        this.v = (
          (this.br[A] & 0x80) === (value & 0x80) &&
          (value & 0x80) !== (result & 0x80)
        )
        result += (this.d && result > 0x9f) ? 0x60 : 0;
        this.c = result > 0xff;
        this.setZandN(result, this.m);
        this.br[A] = (this.br[A] & 0xff00) | (result & 0xff);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft++; // 1 extra cycle if m = 0
        let result;
        if(this.d) {
          result = (this.br[A] & 0xf) + (value & 0xf) + (this.c ? 1 : 0);
          result += result > 9 ? 6 : 0;
          result = (
            (this.br[A] & 0xf0) + (value & 0xf0) +
            (result > 0xf ? 0x10 : 0) + (result & 0xf)
          );
          result += result > 0x9f ? 0x60 : 0;
          result = (
            (this.br[A] & 0xf00) + (value & 0xf00) +
            (result > 0xff ? 0x100 : 0) + (result & 0xff)
          );
          result += result > 0x9ff ? 0x600 : 0;
          result = (
            (this.br[A] & 0xf000) + (value & 0xf000) +
            (result > 0xfff ? 0x1000 : 0) + (result & 0xfff)
          );
        } else {
          result = this.br[A] + value + (this.c ? 1 : 0);
        }
        this.v = (
          (this.br[A] & 0x8000) === (value & 0x8000) &&
          (value & 0x8000) !== (result & 0x8000)
        )
        result += (this.d && result > 0x9fff) ? 0x6000 : 0;
        this.c = result > 0xffff;
        this.setZandN(result, this.m);
        this.br[A] = result;
      }
    }

    this.sbc = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr) ^ 0xff;
        let result;
        if(this.d) {
          result = (this.br[A] & 0xf) + (value & 0xf) + (this.c ? 1 : 0);
          result -= result <= 0xf ? 6 : 0;
          result = (
            (this.br[A] & 0xf0) + (value & 0xf0) +
            (result > 0xf ? 0x10 : 0) + (result & 0xf)
          );
        } else {
          result = (this.br[A] & 0xff) + value + (this.c ? 1 : 0);
        }
        this.v = (
          (this.br[A] & 0x80) === (value & 0x80) &&
          (value & 0x80) !== (result & 0x80)
        )
        result -= (this.d && result <= 0xff) ? 0x60 : 0;
        this.c = result > 0xff;
        this.setZandN(result, this.m);
        this.br[A] = (this.br[A] & 0xff00) | (result & 0xff);
      } else {
        let value = this.readWord(adr, adrh) ^ 0xffff;
        this.cyclesLeft++; // 1 extra cycle if m = 0
        let result;
        if(this.d) {
          result = (this.br[A] & 0xf) + (value & 0xf) + (this.c ? 1 : 0);
          result -= result <= 0x0f ? 6 : 0;
          result = (
            (this.br[A] & 0xf0) + (value & 0xf0) +
            (result > 0xf ? 0x10 : 0) + (result & 0xf)
          );
          result -= result <= 0xff ? 0x60 : 0;
          result = (
            (this.br[A] & 0xf00) + (value & 0xf00) +
            (result > 0xff ? 0x100 : 0) + (result & 0xff)
          );
          result -= result <= 0xfff ? 0x600 : 0;
          result = (
            (this.br[A] & 0xf000) + (value & 0xf000) +
            (result > 0xfff ? 0x1000 : 0) + (result & 0xfff)
          );
        } else {
          result = this.br[A] + value + (this.c ? 1 : 0);
        }
        this.v = (
          (this.br[A] & 0x8000) === (value & 0x8000) &&
          (value & 0x8000) !== (result & 0x8000)
        )
        result -= (this.d && result <= 0xffff) ? 0x6000 : 0;
        this.c = result > 0xffff;
        this.setZandN(result, this.m);
        this.br[A] = result;
      }
    }

    this.cmp = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr) ^ 0xff;
        let result = (this.br[A] & 0xff) + value + 1;
        this.c = result > 0xff;
        this.setZandN(result, this.m);
      } else {
        let value = this.readWord(adr, adrh) ^ 0xffff;
        this.cyclesLeft++; // 1 extra cycle if m = 0
        let result = this.br[A] + value + 1;
        this.c = result > 0xffff;
        this.setZandN(result, this.m);
      }
    }

    this.cpx = function(adr, adrh) {
      if(this.x) {
        let value = this.mem.read(adr) ^ 0xff;
        let result = (this.br[X] & 0xff) + value + 1;
        this.c = result > 0xff;
        this.setZandN(result, this.x);
      } else {
        let value = this.readWord(adr, adrh) ^ 0xffff;
        this.cyclesLeft++; // 1 extra cycle if x = 0
        let result = this.br[X] + value + 1;
        this.c = result > 0xffff;
        this.setZandN(result, this.x);
      }
    }

    this.cpy = function(adr, adrh) {
      if(this.x) {
        let value = this.mem.read(adr) ^ 0xff;
        let result = (this.br[Y] & 0xff) + value + 1;
        this.c = result > 0xff;
        this.setZandN(result, this.x);
      } else {
        let value = this.readWord(adr, adrh) ^ 0xffff;
        this.cyclesLeft++; // 1 extra cycle if x = 0
        let result = this.br[Y] + value + 1;
        this.c = result > 0xffff;
        this.setZandN(result, this.x);
      }
    }

    this.dec = function(adr, adrh) {
      if(this.m) {
        let result = (this.mem.read(adr) - 1) & 0xff;
        this.setZandN(result, this.m);
        this.mem.write(adr, result);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2; // 2 extra cycles if m = 0
        let result = (value - 1) & 0xffff;
        this.setZandN(result, this.m);
        this.writeWord(adr, adrh, result, true);
      }
    }

    this.deca = function(adr, adrh) {
      if(this.m) {
        let result = ((this.br[A] & 0xff) - 1) & 0xff;
        this.setZandN(result, this.m);
        this.br[A] = this.br[A] & 0xff00 | result;
      } else {
        this.br[A]--;
        this.setZandN(this.br[A], this.m);
      }
    }

    this.dex = function(adr, adrh) {
      if(this.x) {
        let result = ((this.br[X] & 0xff) - 1) & 0xff;
        this.setZandN(result, this.x);
        this.br[X] = result;
      } else {
        this.br[X]--;
        this.setZandN(this.br[X], this.x);
      }
    }

    this.dey = function(adr, adrh) {
      if(this.x) {
        let result = ((this.br[Y] & 0xff) - 1) & 0xff;
        this.setZandN(result, this.x);
        this.br[Y] = result;
      } else {
        this.br[Y]--;
        this.setZandN(this.br[Y], this.x);
      }
    }

    this.inc = function(adr, adrh) {
      if(this.m) {
        let result = (this.mem.read(adr) + 1) & 0xff;
        this.setZandN(result, this.m);
        this.mem.write(adr, result);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2; // 2 extra cycles if m = 0
        let result = (value + 1) & 0xffff;
        this.setZandN(result, this.m);
        this.writeWord(adr, adrh, result, true);
      }
    }

    this.inca = function(adr, adrh) {
      if(this.m) {
        let result = ((this.br[A] & 0xff) + 1) & 0xff;
        this.setZandN(result, this.m);
        this.br[A] = this.br[A] & 0xff00 | result;
      } else {
        this.br[A]++;
        this.setZandN(this.br[A], this.m);
      }
    }

    this.inx = function(adr, adrh) {
      if(this.x) {
        let result = ((this.br[X] & 0xff) + 1) & 0xff;
        this.setZandN(result, this.x);
        this.br[X] = result;
      } else {
        this.br[X]++;
        this.setZandN(this.br[X], this.x);
      }
    }

    this.iny = function(adr, adrh) {
      if(this.x) {
        let result = ((this.br[Y] & 0xff) + 1) & 0xff;
        this.setZandN(result, this.x);
        this.br[Y] = result;
      } else {
        this.br[Y]++;
        this.setZandN(this.br[Y], this.x);
      }
    }

    this.and = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        this.br[A] = (this.br[A] & 0xff00) | ((this.br[A] & value) & 0xff);
        this.setZandN(this.br[A], this.m);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft++; // 1 extra cycle if m = 0
        this.br[A] &= value;
        this.setZandN(this.br[A], this.m);
      }
    }

    this.eor = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        this.br[A] = (this.br[A] & 0xff00) | ((this.br[A] ^ value) & 0xff);
        this.setZandN(this.br[A], this.m);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft++; // 1 extra cycle if m = 0
        this.br[A] ^= value;
        this.setZandN(this.br[A], this.m);
      }
    }

    this.ora = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        this.br[A] = (this.br[A] & 0xff00) | ((this.br[A] | value) & 0xff);
        this.setZandN(this.br[A], this.m);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft++; // 1 extra cycle if m = 0
        this.br[A] |= value;
        this.setZandN(this.br[A], this.m);
      }
    }

    this.bit = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        let result = (this.br[A] & 0xff) & value;
        this.z = result === 0;
        this.n = (value & 0x80) > 0;
        this.v = (value & 0x40) > 0;
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft++; // 1 extra cycle if m = 0
        let result = this.br[A] & value;
        this.z = result === 0;
        this.n = (value & 0x8000) > 0;
        this.v = (value & 0x4000) > 0;
      }
    }

    this.biti = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        let result = (this.br[A] & 0xff) & value;
        this.z = result === 0;
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft++; // 1 extra cycle if m = 0
        let result = this.br[A] & value;
        this.z = result === 0;
      }
    }

    this.trb = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        let result = (this.br[A] & 0xff) & value;
        value = (value & ~(this.br[A] & 0xff)) & 0xff;
        this.z = result === 0;
        this.mem.write(adr, value);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        let result = this.br[A] & value;
        value = (value & ~this.br[A]) & 0xffff;
        this.z = result === 0;
        this.writeWord(adr, adrh, value, true);
      }
    }

    this.tsb = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        let result = (this.br[A] & 0xff) & value;
        value = (value | (this.br[A] & 0xff)) & 0xff;
        this.z = result === 0;
        this.mem.write(adr, value);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        let result = this.br[A] & value;
        value = (value | this.br[A]) & 0xffff;
        this.z = result === 0;
        this.writeWord(adr, adrh, value, true);
      }
    }

    this.asl = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        this.c = (value & 0x80) > 0;
        value <<= 1;
        this.setZandN(value, this.m);
        this.mem.write(adr, value);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        this.c = (value & 0x8000) > 0;
        value <<= 1;
        this.setZandN(value, this.m);
        this.writeWord(adr, adrh, value, true);
      }
    }

    this.asla = function(adr, adrh) {
      if(this.m) {
        let value = this.br[A] & 0xff;
        this.c = (value & 0x80) > 0;
        value <<= 1;
        this.setZandN(value, this.m);
        this.br[A] = (this.br[A] & 0xff00) | (value & 0xff);
      } else {
        this.c = (this.br[A] & 0x8000) > 0;
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        this.br[A] <<= 1;
        this.setZandN(this.br[A], this.m);
      }
    }

    this.lsr = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        this.c = (value & 0x1) > 0;
        value >>= 1;
        this.setZandN(value, this.m);
        this.mem.write(adr, value);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        this.c = (value & 0x1) > 0;
        value >>= 1;
        this.setZandN(value, this.m);
        this.writeWord(adr, adrh, value, true);
      }
    }

    this.lsra = function(adr, adrh) {
      if(this.m) {
        let value = this.br[A] & 0xff;
        this.c = (value & 0x1) > 0;
        value >>= 1;
        this.setZandN(value, this.m);
        this.br[A] = (this.br[A] & 0xff00) | (value & 0xff);
      } else {
        this.c = (this.br[A] & 0x1) > 0;
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        this.br[A] >>= 1;
        this.setZandN(this.br[A], this.m);
      }
    }

    this.rol = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        value = (value << 1) | (this.c ? 1 : 0);
        this.c = (value & 0x100) > 0;
        this.setZandN(value, this.m);
        this.mem.write(adr, value);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        value = (value << 1) | (this.c ? 1 : 0);
        this.c = (value & 0x10000) > 0;
        this.setZandN(value, this.m);
        this.writeWord(adr, adrh, value, true);
      }
    }

    this.rola = function(adr, adrh) {
      if(this.m) {
        let value = this.br[A] & 0xff;
        value = (value << 1) | (this.c ? 1 : 0);
        this.c = (value & 0x100) > 0;
        this.setZandN(value, this.m);
        this.br[A] = (this.br[A] & 0xff00) | (value & 0xff);
      } else {
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        value = (this.br[A] << 1) | (this.c ? 1 : 0);
        this.c = (value & 0x10000) > 0;
        this.setZandN(value, this.m);
        this.br[A] = value;
      }
    }

    this.ror = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        let carry = value & 0x1;
        value = (value >> 1) | (this.c ? 0x80 : 0);
        this.c = carry > 0;
        this.setZandN(value, this.m);
        this.mem.write(adr, value);
      } else {
        let value = this.readWord(adr, adrh);
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        let carry = value & 0x1;
        value = (value >> 1) | (this.c ? 0x8000 : 0);
        this.c = carry > 0;
        this.setZandN(value, this.m);
        this.writeWord(adr, adrh, value, true);
      }
    }

    this.rora = function(adr, adrh) {
      if(this.m) {
        let value = this.br[A] & 0xff;
        let carry = value & 0x1;
        value = (value >> 1) | (this.c ? 0x80 : 0);
        this.c = carry > 0;
        this.setZandN(value, this.m);
        this.br[A] = (this.br[A] & 0xff00) | (value & 0xff);
      } else {
        this.cyclesLeft += 2 // 2 extra cycles if m = 0
        let carry = this.br[A] & 0x1;
        value = (this.br[A] >> 1) | (this.c ? 0x8000 : 0);
        this.c = carry > 0;
        this.setZandN(value, this.m);
        this.br[A] = value;
      }
    }

    this.bcc = function(adr, adrh) {
      this.doBranch(!this.c, adr);
    }

    this.bcs = function(adr, adrh) {
      this.doBranch(this.c, adr);
    }

    this.beq = function(adr, adrh) {
      this.doBranch(this.z, adr);
    }

    this.bmi = function(adr, adrh) {
      this.doBranch(this.n, adr);
    }

    this.bne = function(adr, adrh) {
      this.doBranch(!this.z, adr);
    }

    this.bpl = function(adr, adrh) {
      this.doBranch(!this.n, adr);
    }

    this.bra = function(adr, adrh) {
      this.br[PC] += adr;
    }

    this.bvc = function(adr, adrh) {
      this.doBranch(!this.v, adr);
    }

    this.bvs = function(adr, adrh) {
      this.doBranch(this.v, adr);
    }

    this.brl = function(adr, adrh) {
      this.br[PC] += adr;
    }

    this.jmp = function(adr, adrh) {
      this.br[PC] = adr & 0xffff;
    }

    this.jml = function(adr, adrh) {
      this.r[K] = (adr & 0xff0000) >> 16;
      this.br[PC] = adr & 0xffff;
    }

    this.jsl = function(adr, adrh) {
      let pushPc = (this.br[PC] - 1) & 0xffff;
      this.pushByte(this.r[K]);
      this.pushWord(pushPc);
      this.r[K] = (adr & 0xff0000) >> 16;
      this.br[PC] = adr & 0xffff;
    }

    this.jsr = function(adr, adrh) {
      let pushPc = (this.br[PC] - 1) & 0xffff;
      this.pushWord(pushPc);
      this.br[PC] = adr & 0xffff;
    }

    this.rtl = function(adr, adrh) {
      let pullPc = this.pullWord();
      this.r[K] = this.pullByte();
      this.br[PC] = pullPc + 1;
    }

    this.rts = function(adr, adrh) {
      let pullPc = this.pullWord();
      this.br[PC] = pullPc + 1;
    }

    this.brk = function(adr, adrh) {
      let pushPc = (this.br[PC] + 1) & 0xffff;
      this.pushByte(this.r[K]);
      this.pushWord(pushPc);
      this.pushByte(this.getP());
      this.cyclesLeft++; // native mode: 1 extra cycle
      this.i = true;
      this.d = false;
      this.r[K] = 0;
      this.br[PC] = this.mem.read(0xffe6) | (this.mem.read(0xffe7) << 8);
    }

    this.cop = function(adr, adrh) {
      this.pushByte(this.r[K]);
      this.pushWord(this.br[PC]);
      this.pushByte(this.getP());
      this.cyclesLeft++; // native mode: 1 extra cycle
      this.i = true;
      this.d = false;
      this.r[K] = 0;
      this.br[PC] = this.mem.read(0xffe4) | (this.mem.read(0xffe5) << 8);
    }

    this.abo = function(adr, adrh) {
      this.pushByte(this.r[K]);
      this.pushWord(this.br[PC]);
      this.pushByte(this.getP());
      this.cyclesLeft++; // native mode: 1 extra cycle
      this.i = true;
      this.d = false;
      this.r[K] = 0;
      this.br[PC] = this.mem.read(0xffe8) | (this.mem.read(0xffe9) << 8);
    }

    this.nmi = function(adr, adrh) {
      this.pushByte(this.r[K]);
      this.pushWord(this.br[PC]);
      this.pushByte(this.getP());
      this.cyclesLeft++; // native mode: 1 extra cycle
      this.i = true;
      this.d = false;
      this.r[K] = 0;
      this.br[PC] = this.mem.read(0xffea) | (this.mem.read(0xffeb) << 8);
    }

    this.irq = function(adr, adrh) {
      this.pushByte(this.r[K]);
      this.pushWord(this.br[PC]);
      this.pushByte(this.getP());
      this.cyclesLeft++; // native mode: 1 extra cycle
      this.i = true;
      this.d = false;
      this.r[K] = 0;
      this.br[PC] = this.mem.read(0xffee) | (this.mem.read(0xffef) << 8);
    }

    this.rti = function(adr, adrh) {
      this.setP(this.pullByte());
      this.cyclesLeft++; // native mode: 1 extra cycle
      let pullPc = this.pullWord();
      this.r[K] = this.pullByte();
      this.br[PC] = pullPc;
    }

    this.clc = function(adr, adrh) {
      this.c = false;
    }

    this.cld = function(adr, adrh) {
      this.d = false;
    }

    this.cli = function(adr, adrh) {
      this.i = false;
    }

    this.clv = function(adr, adrh) {
      this.v = false;
    }

    this.sec = function(adr, adrh) {
      this.c = true;
    }

    this.sed = function(adr, adrh) {
      this.d = true;
    }

    this.sei = function(adr, adrh) {
      this.i = true;
    }

    this.rep = function(adr, adrh) {
      let value = this.mem.read(adr);
      this.setP(this.getP() & ~value);
    }

    this.sep = function(adr, adrh) {
      let value = this.mem.read(adr);
      this.setP(this.getP() | value);
    }

    this.lda = function(adr, adrh) {
      if(this.m) {
        let value = this.mem.read(adr);
        this.br[A] = (this.br[A] & 0xff00) | (value & 0xff);
        this.setZandN(value, this.m);
      } else {
        this.cyclesLeft++; // m = 0: 1 extra cycle
        this.br[A] = this.readWord(adr, adrh);
        this.setZandN(this.br[A], this.m);
      }
    }

    this.ldx = function(adr, adrh) {
      if(this.x) {
        this.br[X] = this.mem.read(adr);
        this.setZandN(this.br[X], this.x);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.br[X] = this.readWord(adr, adrh);
        this.setZandN(this.br[X], this.x);
      }
    }

    this.ldy = function(adr, adrh) {
      if(this.x) {
        this.br[Y] = this.mem.read(adr);
        this.setZandN(this.br[Y], this.x);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.br[Y] = this.readWord(adr, adrh);
        this.setZandN(this.br[Y], this.x);
      }
    }

    this.sta = function(adr, adrh) {
      if(this.m) {
        this.mem.write(adr, this.br[A] & 0xff);
      } else {
        this.cyclesLeft++; // m = 0: 1 extra cycle
        this.writeWord(adr, adrh, this.br[A]);
      }
    }

    this.stx = function(adr, adrh) {
      if(this.x) {
        this.mem.write(adr, this.br[X] & 0xff);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.writeWord(adr, adrh, this.br[X]);
      }
    }

    this.sty = function(adr, adrh) {
      if(this.x) {
        this.mem.write(adr, this.br[Y] & 0xff);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.writeWord(adr, adrh, this.br[Y]);
      }
    }

    this.stz = function(adr, adrh) {
      if(this.m) {
        this.mem.write(adr, 0);
      } else {
        this.cyclesLeft++; // m = 0: 1 extra cycle
        this.writeWord(adr, adrh, 0);
      }
    }

    this.mvn = function(adr, adrh) {
      this.r[DBR] = adr;
      this.mem.write(
        (adr << 16) | this.br[Y],
        this.mem.read((adrh << 16) | this.br[X])
      );
      this.br[A]--;
      this.br[X]++;
      this.br[Y]++;
      if(this.br[A] !== 0xffff) {
        this.br[PC] -= 3;
      }
      if(this.x) {
        this.br[X] &= 0xff;
        this.br[Y] &= 0xff;
      }
    }

    this.mvp = function(adr, adrh) {
      this.r[DBR] = adr;
      this.mem.write(
        (adr << 16) | this.br[Y],
        this.mem.read((adrh << 16) | this.br[X])
      );
      this.br[A]--;
      this.br[X]--;
      this.br[Y]--;
      if(this.br[A] !== 0xffff) {
        this.br[PC] -= 3;
      }
      if(this.x) {
        this.br[X] &= 0xff;
        this.br[Y] &= 0xff;
      }
    }

    this.nop = function(adr, adrh) {
      // no operation
    }

    this.wdm = function(adr, adrh) {
      // no operation
    }

    this.pea = function(adr, adrh) {
      this.pushWord(this.readWord(adr, adrh));
    }

    this.pei = function(adr, adrh) {
      this.pushWord(this.readWord(adr, adrh));
    }

    this.per = function(adr, adrh) {
      this.pushWord((this.br[PC] + adr) & 0xffff);
    }

    this.pha = function(adr, adrh) {
      if(this.m) {
        this.pushByte(this.br[A] & 0xff);
      } else {
        this.cyclesLeft++; // m = 0: 1 extra cycle
        this.pushWord(this.br[A]);
      }
    }

    this.phx = function(adr, adrh) {
      if(this.x) {
        this.pushByte(this.br[X] & 0xff);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.pushWord(this.br[X]);
      }
    }

    this.phy = function(adr, adrh) {
      if(this.x) {
        this.pushByte(this.br[Y] & 0xff);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.pushWord(this.br[Y]);
      }
    }

    this.pla = function(adr, adrh) {
      if(this.m) {
        this.br[A] = (this.br[A] & 0xff00) | (this.pullByte() & 0xff);
        this.setZandN(this.br[A], this.m);
      } else {
        this.cyclesLeft++; // m = 0: 1 extra cycle
        this.br[A] = this.pullWord();
        this.setZandN(this.br[A], this.m);
      }
    }

    this.plx = function(adr, adrh) {
      if(this.x) {
        this.br[X] = this.pullByte();
        this.setZandN(this.br[X], this.x);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.br[X] = this.pullWord();
        this.setZandN(this.br[X], this.x);
      }
    }

    this.ply = function(adr, adrh) {
      if(this.x) {
        this.br[Y] = this.pullByte();
        this.setZandN(this.br[Y], this.x);
      } else {
        this.cyclesLeft++; // x = 0: 1 extra cycle
        this.br[Y] = this.pullWord();
        this.setZandN(this.br[Y], this.x);
      }
    }

    this.phb = function(adr, adrh) {
      this.pushByte(this.r[DBR]);
    }

    this.phd = function(adr, adrh) {
      this.pushWord(this.br[DPR]);
    }

    this.phk = function(adr, adrh) {
      this.pushByte(this.r[K]);
    }

    this.php = function(adr, adrh) {
      this.pushByte(this.getP());
    }

    this.plb = function(adr, adrh) {
      this.r[DBR] = this.pullByte();
      this.setZandN(this.r[DBR], true);
    }

    this.pld = function(adr, adrh) {
      this.br[DPR] = this.pullWord();
      this.setZandN(this.br[DPR], false);
    }

    this.plp = function(adr, adrh) {
      this.setP(this.pullByte());
    }

    this.stp = function(adr, adrh) {
      this.stopped = true;
    }

    this.wai = function(adr, adrh) {
      this.waiting = true;
    }

    this.tax = function(adr, adrh) {
      if(this.x) {
        this.br[X] = this.br[A] & 0xff;
        this.setZandN(this.br[X], this.x);
      } else {
        this.br[X] = this.br[A];
        this.setZandN(this.br[X], this.x);
      }
    }

    this.tay = function(adr, adrh) {
      if(this.x) {
        this.br[Y] = this.br[A] & 0xff;
        this.setZandN(this.br[Y], this.x);
      } else {
        this.br[Y] = this.br[A];
        this.setZandN(this.br[Y], this.x);
      }
    }

    this.tsx = function(adr, adrh) {
      if(this.x) {
        this.br[X] = this.br[SP] & 0xff;
        this.setZandN(this.br[X], this.x);
      } else {
        this.br[X] = this.br[SP];
        this.setZandN(this.br[X], this.x);
      }
    }

    this.txa = function(adr, adrh) {
      if(this.m) {
        this.br[A] = (this.br[A] & 0xff00) | (this.br[X] & 0xff);
        this.setZandN(this.br[A], this.m);
      } else {
        this.br[A] = this.br[X];
        this.setZandN(this.br[A], this.m);
      }
    }

    this.txs = function(adr, adrh) {
      this.br[SP] = this.br[X];
    }

    this.txy = function(adr, adrh) {
      if(this.x) {
        this.br[Y] = this.br[X] & 0xff;
        this.setZandN(this.br[Y], this.x);
      } else {
        this.br[Y] = this.br[X];
        this.setZandN(this.br[Y], this.x);
      }
    }

    this.tya = function(adr, adrh) {
      if(this.m) {
        this.br[A] = (this.br[A] & 0xff00) | (this.br[Y] & 0xff);
        this.setZandN(this.br[A], this.m);
      } else {
        this.br[A] = this.br[Y];
        this.setZandN(this.br[A], this.m);
      }
    }

    this.tyx = function(adr, adrh) {
      if(this.x) {
        this.br[X] = this.br[Y] & 0xff;
        this.setZandN(this.br[X], this.x);
      } else {
        this.br[X] = this.br[Y];
        this.setZandN(this.br[X], this.x);
      }
    }

    this.tcd = function(adr, adrh) {
      this.br[DPR] = this.br[A];
      this.setZandN(this.br[DPR], false);
    }

    this.tcs = function(adr, adrh) {
      this.br[SP] = this.br[A];
    }

    this.tdc = function(adr, adrh) {
      this.br[A] = this.br[DPR];
      this.setZandN(this.br[A], false);
    }

    this.tsc = function(adr, adrh) {
      this.br[A] = this.br[SP];
      this.setZandN(this.br[A], false);
    }

    this.xba = function(adr, adrh) {
      let low = this.br[A] & 0xff;
      let high = (this.br[A] & 0xff00) >> 8;
      this.br[A] = (low << 8) | high;
      this.setZandN(this.br[A], true);
    }

    this.xce = function(adr, adrh) {
      let temp = this.c;
      this.c = this.e;
      this.e = temp;
      if(this.e) {
        this.m = true;
        this.x = true;
      }
      if(this.x) {
        this.br[X] &= 0xff;
        this.br[Y] &= 0xff;
      }
    }

    // function table
    this.functions = [
      this.brk, this.ora, this.cop, this.ora, this.tsb, this.ora, this.asl, this.ora, this.php, this.ora, this.asla,this.phd, this.tsb, this.ora, this.asl, this.ora,
      this.bpl, this.ora, this.ora, this.ora, this.trb, this.ora, this.asl, this.ora, this.clc, this.ora, this.inca,this.tcs, this.trb, this.ora, this.asl, this.ora,
      this.jsr, this.and, this.jsl, this.and, this.bit, this.and, this.rol, this.and, this.plp, this.and, this.rola,this.pld, this.bit, this.and, this.rol, this.and,
      this.bmi, this.and, this.and, this.and, this.bit, this.and, this.rol, this.and, this.sec, this.and, this.deca,this.tsc, this.bit, this.and, this.rol, this.and,
      this.rti, this.eor, this.wdm, this.eor, this.mvp, this.eor, this.lsr, this.eor, this.pha, this.eor, this.lsra,this.phk, this.jmp, this.eor, this.lsr, this.eor,
      this.bvc, this.eor, this.eor, this.eor, this.mvn, this.eor, this.lsr, this.eor, this.cli, this.eor, this.phy, this.tcd, this.jml, this.eor, this.lsr, this.eor,
      this.rts, this.adc, this.per, this.adc, this.stz, this.adc, this.ror, this.adc, this.pla, this.adc, this.rora,this.rtl, this.jmp, this.adc, this.ror, this.adc,
      this.bvs, this.adc, this.adc, this.adc, this.stz, this.adc, this.ror, this.adc, this.sei, this.adc, this.ply, this.tdc, this.jmp, this.adc, this.ror, this.adc,
      this.bra, this.sta, this.brl, this.sta, this.sty, this.sta, this.stx, this.sta, this.dey, this.biti,this.txa, this.phb, this.sty, this.sta, this.stx, this.sta,
      this.bcc, this.sta, this.sta, this.sta, this.sty, this.sta, this.stx, this.sta, this.tya, this.sta, this.txs, this.txy, this.stz, this.sta, this.stz, this.sta,
      this.ldy, this.lda, this.ldx, this.lda, this.ldy, this.lda, this.ldx, this.lda, this.tay, this.lda, this.tax, this.plb, this.ldy, this.lda, this.ldx, this.lda,
      this.bcs, this.lda, this.lda, this.lda, this.ldy, this.lda, this.ldx, this.lda, this.clv, this.lda, this.tsx, this.tyx, this.ldy, this.lda, this.ldx, this.lda,
      this.cpy, this.cmp, this.rep, this.cmp, this.cpy, this.cmp, this.dec, this.cmp, this.iny, this.cmp, this.dex, this.wai, this.cpy, this.cmp, this.dec, this.cmp,
      this.bne, this.cmp, this.cmp, this.cmp, this.pei, this.cmp, this.dec, this.cmp, this.cld, this.cmp, this.phx, this.stp, this.jml, this.cmp, this.dec, this.cmp,
      this.cpx, this.sbc, this.sep, this.sbc, this.cpx, this.sbc, this.inc, this.sbc, this.inx, this.sbc, this.nop, this.xba, this.cpx, this.sbc, this.inc, this.sbc,
      this.beq, this.sbc, this.sbc, this.sbc, this.pea, this.sbc, this.inc, this.sbc, this.sed, this.sbc, this.plx, this.xce, this.jsr, this.sbc, this.inc, this.sbc,
      this.abo, this.nmi, this.irq // abo, nmi, irq
    ];

  }
})();
