
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

function Cpu(mem) {

  // memory handler
  this.mem = mem;

  // registers
  this.r = new Uint8Array(2);
  this.br = new Uint16Array(6);

  // modes for each instruction
  this.modes = [
    //x0 x1   x2   x3   x4   x5   x6   x7   x8   x9   xa   xb   xc   xd   xe   xf
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //0x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //1x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //2x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //3x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //4x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //5x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //6x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //7x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //8x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //9x
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //ax
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //bx
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //cx
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //dx
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //ex
    IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, IMP, //fx
    IMP, IMP, IMP // abo, nmi, irq
  ];

  // cycles for each instruction
  this.cycles = [
    //0x1 x2 x3 x4 x5 x6 x7 x8 x9 xa xb xc xd xe xf
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //0x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //1x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //2x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //3x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //4x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //5x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //6x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //7x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //8x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //9x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //ax
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //bx
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //cx
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //dx
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //ex
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1  //fx
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
          this.cyclesLeft = 8;
          mode = IMP;
        }
        // execute the instruction
        let adrs = this.getAdr(instr, mode);
        this.functions[instr].call(this, adrs[0], adrs[1], instr);
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

  this.getP = function(bFlag) {
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
    this.mem.write(this.br[SP], value);
    this.br[SP]--;
  }

  this.pullByte = function() {
    this.br[SP]++;
    return this.mem.read(this.br[SP]);
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
        let pointer = this.mem.read((this.br[DPR] + adr + this.br[X]) & 0xffff);
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
        if(opcode === 0x4c || opcode === 0x22) {
          // JMP and JSR use K instead of DBR
          return [(this.r[K] << 16) + adr, 0];
        }
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
        // only used by JMP, which uses K
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
        // only used by JMP and JSR, which use K
        return [(this.r[K] << 16) + pointer, 0];
      }

      case IAL: {
        // indirect long
        let adr = this.mem.read((this.r[K] << 16) | this.br[PC]++);
        adr |= this.mem.read((this.r[K] << 16) | this.br[PC]++) << 8;
        let pointer = this.mem.read(adr);
        pointer |= this.mem.read((adr + 1) & 0xffff) << 8;
        pointer |= this.mem.read((adr + 2) & 0xffff) << 16;
        // only used by JMP
        return [pointer, 0];
      }

      case REL: {
        // relative
        let rel = this.mem.read((this.r[K] << 16) | this.br[PC]++);
        return [this.getSigned(rel, true), 0];
      }

      case RELL: {
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
      " reading at adrl " + adr + " and adrh " + adrh
    );
  }

  this.adc = function(adr, adrh) {
    // TODO: decimal mode
    if(this.m) {
      let value = this.mem.read(adr);
      let result = (this.br[A] & 0xff) + value + (this.c ? 1 : 0);
      this.v = (
        (this.br[A] & 0x80) === (value & 0x80) &&
        (value & 0x80) !== (result & 0x80)
      )
      this.c = result > 0xff;
      this.setZandN(result, this.m);
      this.br[A] = (this.br[A] & 0xff00) | (result & 0xff);
    } else {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      this.cyclesLeft++; // 1 extra cycle if m = 0
      let result = this.br[A] + value + (this.c ? 1 : 0);
      this.v = (
        (this.br[A] & 0x8000) === (value & 0x8000) &&
        (value & 0x8000) !== (result & 0x8000)
      )
      this.c = result > 0xffff;
      this.setZandN(result, this.m);
      this.br[A] = result;
    }
  }

  this.sbc = function(adr, adrh) {
    // TODO: decimal mode
    if(this.m) {
      let value = this.mem.read(adr) ^ 0xff;
      let result = (this.br[A] & 0xff) + value + (this.c ? 1 : 0);
      this.v = (
        (this.br[A] & 0x80) === (value & 0x80) &&
        (value & 0x80) !== (result & 0x80)
      )
      this.c = result > 0xff;
      this.setZandN(result, this.m);
      this.br[A] = (this.br[A] & 0xff00) | (result & 0xff);
    } else {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      value ^= 0xffff;
      this.cyclesLeft++; // 1 extra cycle if m = 0
      let result = this.br[A] + value + (this.c ? 1 : 0);
      this.v = (
        (this.br[A] & 0x8000) === (value & 0x8000) &&
        (value & 0x8000) !== (result & 0x8000)
      )
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
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      value ^= 0xffff;
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
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      value ^= 0xffff;
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
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      value ^= 0xffff;
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
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      this.cyclesLeft += 2; // 2 extra cycles if m = 0
      let result = (value - 1) & 0xffff;
      this.setZandN(result, this.m);
      this.mem.write(adr, result & 0xff);
      this.mem.write(adrh, (result & 0xff00) >> 8);
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
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      this.cyclesLeft += 2; // 2 extra cycles if m = 0
      let result = (value + 1) & 0xffff;
      this.setZandN(result, this.m);
      this.mem.write(adr, result & 0xff);
      this.mem.write(adrh, (result & 0xff00) >> 8);
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

  // function table
  this.functions = [
    //x0      x1        x2        x3        x4        x5        x6        x7        x8        x9        xa        xb        xc        xd        xe        xf
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //0x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //1x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //2x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //3x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //4x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //5x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //6x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //7x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //8x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //9x
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //ax
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //bx
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //cx
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //dx
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //ex
    this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni, this.uni,  //fx
    this.uni, this.uni, this.uni // abo, nmi, irq
  ];

}
