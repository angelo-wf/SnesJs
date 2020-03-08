
Spc = (function() {

  // indexes in register arrays
  const A = 0;
  const X = 1;
  const Y = 2;
  const SP = 3;
  const PC = 0;

  const IMP = 0;
  const REL = 1;
  const DP = 2;
  const DPR = 3;
  const ABS = 4;
  const IND = 5;
  const IDX = 6;
  const IMM = 7;
  const DPX = 8;
  const ABX = 9;
  const ABY = 10;
  const IDY = 11;
  const DD = 12;
  const II = 13;
  const DI = 14;
  const DPY = 15;
  const ABB = 16;
  const DXR = 17;
  const IAX = 18;
  const IPI = 19;

  return function(mem) {

    this.mem = mem;

    this.r = new Uint8Array(4);
    this.br = new Uint16Array(1);

    this.modes = [
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD , ABB, DP , ABS, IMP, ABS, IMP,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II , DP , DPX, IMP, IMP, ABS, IAX,
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD , ABB, DP , ABS, IMP, DPR, REL,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II , DP , DPX, IMP, IMP, DP , ABS,
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD , ABB, DP , ABS, IMP, ABS, DP ,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II , DP , DPX, IMP, IMP, ABS, ABS,
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD , ABB, DP , ABS, IMP, DPR, IMP,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II , DP , DPX, IMP, IMP, DP , IMP,
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD , ABB, DP , ABS, IMM, IMP, DI ,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II , DP , DPX, IMP, IMP, IMP, IMP,
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD , ABB, DP , ABS, IMM, IMP, IPI,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II , DP , DPX, IMP, IMP, IMP, IPI,
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, ABS, ABB, DP , ABS, IMM, IMP, IMP,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DP , DPY, DP , DPX, IMP, IMP, DXR, IMP,
      IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, ABS, ABB, DP , ABS, IMP, IMP, IMP,
      REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DP , DPY, DD , DPX, IMP, IMP, REL, IMP
    ];

    this.cycles = [
      2, 8, 4, 5, 3, 4, 3, 6, 2, 6, 5, 4, 5, 4, 6, 8,
      2, 8, 4, 5, 4, 5, 5, 6, 5, 5, 6, 5, 2, 2, 4, 6,
      2, 8, 4, 5, 3, 4, 3, 6, 2, 6, 5, 4, 5, 4, 5, 4,
      2, 8, 4, 5, 4, 5, 5, 6, 5, 5, 6, 5, 2, 2, 3, 8,
      2, 8, 4, 5, 3, 4, 3, 6, 2, 6, 4, 4, 5, 4, 6, 6,
      2, 8, 4, 5, 4, 5, 5, 6, 5, 5, 4, 5, 2, 2, 4, 3,
      2, 8, 4, 5, 3, 4, 3, 6, 2, 6, 4, 4, 5, 4, 5, 5,
      2, 8, 4, 5, 4, 5, 5, 6, 5, 5, 5, 5, 2, 2, 3, 6,
      2, 8, 4, 5, 3, 4, 3, 6, 2, 6, 5, 4, 5, 2, 4, 5,
      2, 8, 4, 5, 4, 5, 5, 6, 5, 5, 5, 5, 2, 2, 12,5,
      2, 8, 4, 5, 3, 4, 3, 6, 2, 6, 4, 4, 5, 2, 4, 4,
      2, 8, 4, 5, 4, 5, 5, 6, 5, 5, 5, 5, 2, 2, 3, 4,
      2, 8, 4, 5, 4, 5, 4, 7, 2, 5, 6, 4, 5, 2, 4, 9,
      2, 8, 4, 5, 5, 6, 6, 7, 4, 5, 5, 5, 2, 2, 6, 3,
      2, 8, 4, 5, 3, 4, 3, 6, 2, 4, 5, 3, 4, 3, 4, 3,
      2, 8, 4, 5, 4, 5, 5, 6, 3, 4, 5, 4, 2, 2, 4, 3
    ];

    // function map is at bottom

    this.reset = function() {

      this.r[A] = 0;
      this.r[X] = 0;
      this.r[Y] = 0;
      this.r[SP] = 0;

      if(this.mem.read) {
        this.br[PC] = this.mem.read(0xfffe) | (this.mem.read(0xffff) << 8);
      } else {
        // if read not defined yet
        this.br[PC] = 0;
      }

      // flags
      this.n = false;
      this.v = false;
      this.p = false;
      this.b = false;
      this.h = false;
      this.i = false;
      this.z = false;
      this.c = false;

      this.cyclesLeft = 7; // a guess
    }
    this.reset();

    this.cycle = function() {
      if(this.cyclesLeft === 0) {
        // the spc in the snes does not have interrupts,
        // so no checking is needed
        let instr = this.mem.read(this.br[PC]++);
        let mode = this.modes[instr];
        this.cyclesLeft = this.cycles[instr];

        try {
          let eff = this.getAdr(mode);
          this.functions[instr].call(this, eff[0], eff[1], instr);
        } catch(e) {
          log("Error with opcode " + getByteRep(instr) + ": " + e);
        }
      }
      this.cyclesLeft--;
    }

    this.getP = function() {
      let value = 0;
      value |= this.n ? 0x80 : 0;
      value |= this.v ? 0x40 : 0;
      value |= this.p ? 0x20 : 0;
      value |= this.b ? 0x10 : 0;
      value |= this.h ? 0x08 : 0;
      value |= this.i ? 0x04 : 0;
      value |= this.z ? 0x02 : 0;
      value |= this.c ? 0x01 : 0;
      return value;
    }

    this.setP = function(value) {
      this.n = (value & 0x80) > 0;
      this.v = (value & 0x40) > 0;
      this.p = (value & 0x20) > 0;
      this.b = (value & 0x10) > 0;
      this.h = (value & 0x08) > 0;
      this.i = (value & 0x04) > 0;
      this.z = (value & 0x02) > 0;
      this.c = (value & 0x01) > 0;
    }

    this.setZandN = function(val) {
      val &= 0xff;
      this.n = val > 0x7f;
      this.z = val === 0;
    }

    this.getSigned = function(val) {
      if(val > 127) {
        return -(256 - val);
      }
      return val;
    }

    this.doBranch = function(check, rel) {
      if(check) {
        this.br[PC] += rel;
        // taken branch: 2 extra cycles
        this.cyclesLeft += 2;
      }
    }

    this.push = function(value) {
      this.mem.write(this.r[SP] | 0x100, value);
      this.r[SP]--;
    }

    this.pop = function() {
      this.r[SP]++;
      return this.mem.read(this.r[SP] | 0x100);
    }

    this.getAdr = function(mode) {
      switch(mode) {
        case IMP: {
          // implied
          return [0, 0];
        }
        case REL: {
          // relative
          let rel = this.mem.read(this.br[PC]++);
          return [this.getSigned(rel), 0];
        }
        case DP: {
          // direct page (with next byte for 16-bit ops)
          let adr = this.mem.read(this.br[PC]++);
          return [
            adr | (this.p ? 0x100 : 0),
            ((adr + 1) & 0xff) | (this.p ? 0x100 : 0)
          ];
        }
        case DPR: {
          // direct page, relative
          let adr = this.mem.read(this.br[PC]++);
          let rel = this.mem.read(this.br[PC]++);
          return [adr | (this.p ? 0x100 : 0), this.getSigned(rel)];
        }
        case ABS: {
          // absolute
          let adr = this.mem.read(this.br[PC]++);
          adr |= this.mem.read(this.br[PC]++) << 8;
          return [adr, 0];
        }
        case IND: {
          // indirect
          return [this.r[X] | (this.p ? 0x100 : 0), 0];
        }
        case IDX: {
          // indexed indirect direct
          let pointer = this.mem.read(this.br[PC]++);
          let adr = this.mem.read(
            ((pointer + this.r[X]) & 0xff) | (this.p ? 0x100 : 0)
          );
          adr |= this.mem.read(
            ((pointer + 1 + this.r[X]) & 0xff) | (this.p ? 0x100 : 0)
          ) << 8;
          return [adr, 0];
        }
        case IMM: {
          // immediate
          return [this.br[PC]++, 0];
        }
        case DPX: {
          // direct page indexed on x
          let adr = this.mem.read(this.br[PC]++);
          return [((adr + this.r[X]) & 0xff) | (this.p ? 0x100 : 0), 0];
        }
        case ABX: {
          // absolute indexed on x
          let adr = this.mem.read(this.br[PC]++);
          adr |= this.mem.read(this.br[PC]++) << 8;
          return [(adr + this.r[X]) & 0xffff, 0];
        }
        case ABY: {
          // absolute indexed on y
          let adr = this.mem.read(this.br[PC]++);
          adr |= this.mem.read(this.br[PC]++) << 8;
          return [(adr + this.r[Y]) & 0xffff, 0];
        }
        case IDY: {
          // indirect indexed direct
          let pointer = this.mem.read(this.br[PC]++);
          let adr = this.mem.read(pointer | (this.p ? 0x100 : 0));
          adr |= this.mem.read(
            ((pointer + 1) & 0xff) | (this.p ? 0x100 : 0)
          ) << 8;
          return [(adr + this.r[Y]) & 0xffff, 0];
        }
        case DD: {
          // direct page to direct page
          let adr = this.mem.read(this.br[PC]++);
          let adr2 = this.mem.read(this.br[PC]++);
          return [adr | (this.p ? 0x100 : 0), adr2 | (this.p ? 0x100 : 0)];
        }
        case II: {
          // indirect to indirect
          return [
            this.r[Y] | (this.p ? 0x100 : 0),
            this.r[X] | (this.p ? 0x100 : 0)
          ];
        }
        case DI: {
          // immediate to direct page
          let imm = this.br[PC]++;
          let adr = this.mem.read(this.br[PC]++);
          return [imm, adr | (this.p ? 0x100 : 0)];
        }
        case DPY: {
          // direct page indexed on y
          let adr = this.mem.read(this.br[PC]++);
          return [((adr + this.r[Y]) & 0xff) | (this.p ? 0x100 : 0), 0];
        }
        case ABB: {
          // absolute, with bit index
          let adr = this.mem.read(this.br[PC]++);
          adr |= this.mem.read(this.br[PC]++) << 8;
          return [adr & 0x1fff, adr >> 13];
        }
        case DXR: {
          // direct page indexed on x, relative
          let adr = this.mem.read(this.br[PC]++);
          let rel = this.getSigned(this.mem.read(this.br[PC]++));
          return [((adr + this.r[X]) & 0xff) | (this.p ? 0x100 : 0), rel];
        }
        case IAX: {
          // indirect absolute indexed
          let adr = this.mem.read(this.br[PC]++);
          adr |= this.mem.read(this.br[PC]++) << 8;
          let radr = this.mem.read((adr + this.r[X]) & 0xffff);
          radr |= this.mem.read((adr + this.r[X] + 1) & 0xffff) << 8;
          return [radr, 0];
        }
        case IPI: {
          // indirect post increment
          return [this.r[X]++ | (this.p ? 0x100 : 0), 0];
        }
      }
    }

    // instructions

    this.nop = function(adr, adrh, instr) {
      // do nothing
    }

    this.clrp = function(adr, adrh, instr) {
      this.p = false;
    }

    this.setp = function(adr, adrh, instr) {
      this.p = true;
    }

    this.clrc = function(adr, adrh, instr) {
      this.c = false;
    }

    this.setc = function(adr, adrh, instr) {
      this.c = true;
    }

    this.ei = function(adr, adrh, instr) {
      this.i = true;
    }

    this.di = function(adr, adrh, instr) {
      this.i = false;
    }

    this.clrv = function(adr, adrh, instr) {
      this.v = false;
      this.h = false;
    }

    this.bpl = function(adr, adrh, instr) {
      this.doBranch(!this.n, adr);
    }

    this.bmi = function(adr, adrh, instr) {
      this.doBranch(this.n, adr);
    }

    this.bvc = function(adr, adrh, instr) {
      this.doBranch(!this.v, adr);
    }

    this.bvs = function(adr, adrh, instr) {
      this.doBranch(this.v, adr);
    }

    this.bcc = function(adr, adrh, instr) {
      this.doBranch(!this.c, adr);
    }

    this.bcs = function(adr, adrh, instr) {
      this.doBranch(this.c, adr);
    }

    this.bne = function(adr, adrh, instr) {
      this.doBranch(!this.z, adr);
    }

    this.beq = function(adr, adrh, instr) {
      this.doBranch(this.z, adr);
    }

    this.tcall = function(adr, adrh, instr) {
      this.push(this.br[PC] >> 8);
      this.push(this.br[PC] & 0xff);
      let padr = 0xffc0 + ((15 - (instr >> 4)) << 1);
      this.br[PC] = this.mem.read(padr) | (this.mem.read(padr + 1) << 8);
    }

    this.set1 = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      value |= (1 << (instr >> 5));
      this.mem.write(adr, value);
    }

    this.clr1 = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      value &= ~(1 << (instr >> 5));
      this.mem.write(adr, value);
    }

    this.bbs = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      this.doBranch((value & (1 << (instr >> 5))) > 0, adrh);
    }

    this.bbc = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      this.doBranch((value & (1 << (instr >> 5))) === 0, adrh);
    }

    this.or = function(adr, adrh, instr) {
      this.r[A] |= this.mem.read(adr);
      this.setZandN(this.r[A]);
    }

    this.orm = function(adr, adrh, instr) {
      let value = this.mem.read(adrh);
      value |= this.mem.read(adr);
      this.mem.write(adrh, value);
      this.setZandN(value);
    }

    this.and = function(adr, adrh, instr) {
      this.r[A] &= this.mem.read(adr);
      this.setZandN(this.r[A]);
    }

    this.andm = function(adr, adrh, instr) {
      let value = this.mem.read(adrh);
      value &= this.mem.read(adr);
      this.mem.write(adrh, value);
      this.setZandN(value);
    }

    this.eor = function(adr, adrh, instr) {
      this.r[A] ^= this.mem.read(adr);
      this.setZandN(this.r[A]);
    }

    this.eorm = function(adr, adrh, instr) {
      let value = this.mem.read(adrh);
      value ^= this.mem.read(adr);
      this.mem.write(adrh, value);
      this.setZandN(value);
    }

    this.cmp = function(adr, adrh, instr) {
      let value = this.mem.read(adr) ^ 0xff;
      let result = this.r[A] + value + 1;
      this.c = result > 0xff;
      this.setZandN(result);
    }

    this.cmpm = function(adr, adrh, instr) {
      let value = this.mem.read(adrh);
      let result = value + (this.mem.read(adr) ^ 0xff) + 1;
      this.c = result > 0xff;
      this.setZandN(result);
    }

    this.cmpx = function(adr, adrh, instr) {
      let value = this.mem.read(adr) ^ 0xff;
      let result = this.r[X] + value + 1;
      this.c = result > 0xff;
      this.setZandN(result);
    }

    this.cmpy = function(adr, adrh, instr) {
      let value = this.mem.read(adr) ^ 0xff;
      let result = this.r[Y] + value + 1;
      this.c = result > 0xff;
      this.setZandN(result);
    }

    this.adc = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      let result = this.r[A] + value + (this.c ? 1 : 0);
      this.v = (
        (this.r[A] & 0x80) === (value & 0x80) &&
        (value & 0x80) !== (result & 0x80)
      );
      this.h = ((this.r[A] & 0xf) + (value & 0xf) + (this.c ? 1 : 0)) > 0xf;
      this.c = result > 0xff;
      this.setZandN(result);
      this.r[A] = result;
    }

    this.adcm = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      let addedTo = this.mem.read(adrh);
      let result = addedTo + value + (this.c ? 1 : 0);
      this.v = (
        (addedTo & 0x80) === (value & 0x80) &&
        (value & 0x80) !== (result & 0x80)
      );
      this.h = ((addedTo & 0xf) + (value & 0xf) + (this.c ? 1 : 0)) > 0xf;
      this.c = result > 0xff;
      this.setZandN(result);
      this.mem.write(adrh, result & 0xff);
    }

    this.sbc = function(adr, adrh, instr) {
      let value = this.mem.read(adr) ^ 0xff;
      let result = this.r[A] + value + (this.c ? 1 : 0);
      this.v = (
        (this.r[A] & 0x80) === (value & 0x80) &&
        (value & 0x80) !== (result & 0x80)
      );
      this.h = ((this.r[A] & 0xf) + (value & 0xf) + (this.c ? 1 : 0)) > 0xf;
      this.c = result > 0xff;
      this.setZandN(result);
      this.r[A] = result;
    }

    this.sbcm = function(adr, adrh, instr) {
      let value = this.mem.read(adr) ^ 0xff;
      let addedTo = this.mem.read(adrh);
      let result = addedTo + value + (this.c ? 1 : 0);
      this.v = (
        (addedTo & 0x80) === (value & 0x80) &&
        (value & 0x80) !== (result & 0x80)
      );
      this.h = ((addedTo & 0xf) + (value & 0xf) + (this.c ? 1 : 0)) > 0xf;
      this.c = result > 0xff;
      this.setZandN(result);
      this.mem.write(adrh, result & 0xff);
    }

    this.movs = function(adr, adrh, instr) {
      if(instr !== 0xaf) {
        // MOV (X+), A does not do a dummy read
        this.mem.read(adr);
      }
      this.mem.write(adr, this.r[A]);
    }

    this.movsx = function(adr, adrh, instr) {
      this.mem.read(adr);
      this.mem.write(adr, this.r[X]);
    }

    this.movsy = function(adr, adrh, instr) {
      this.mem.read(adr);
      this.mem.write(adr, this.r[Y]);
    }

    this.mov = function(adr, adrh, instr) {
      this.r[A] = this.mem.read(adr);
      this.setZandN(this.r[A]);
    }

    this.movx = function(adr, adrh, instr) {
      this.r[X] = this.mem.read(adr);
      this.setZandN(this.r[X]);
    }

    this.movy = function(adr, adrh, instr) {
      this.r[Y] = this.mem.read(adr);
      this.setZandN(this.r[Y]);
    }

    this.or1 = function(adr, adrh, instr) {
      let bit = (this.mem.read(adr) >> adrh) & 0x1;
      let result = (this.c ? 1 : 0) | bit;
      this.c = result > 0;
    }

    this.or1n = function(adr, adrh, instr) {
      let bit = (this.mem.read(adr) >> adrh) & 0x1;
      let result = (this.c ? 1 : 0) | (bit > 0 ? 0 : 1);
      this.c = result > 0;
    }

    this.and1 = function(adr, adrh, instr) {
      let bit = (this.mem.read(adr) >> adrh) & 0x1;
      let result = (this.c ? 1 : 0) & bit;
      this.c = result > 0;
    }

    this.and1n = function(adr, adrh, instr) {
      let bit = (this.mem.read(adr) >> adrh) & 0x1;
      let result = (this.c ? 1 : 0) & (bit > 0 ? 0 : 1);
      this.c = result > 0;
    }

    this.eor1 = function(adr, adrh, instr) {
      let bit = (this.mem.read(adr) >> adrh) & 0x1;
      let result = (this.c ? 1 : 0) ^ bit;
      this.c = result > 0;
    }

    this.mov1 = function(adr, adrh, instr) {
      let bit = (this.mem.read(adr) >> adrh) & 0x1;
      this.c = bit > 0;
    }

    this.mov1s = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      let bit = 1 << adrh;
      value = this.c ? (value | bit) : (value & ~bit);
      this.mem.write(adr, value);
    }

    this.not1 = function(adr, adrh, instr) {
      let bit = 1 << adrh;
      let value = this.mem.read(adr) ^ bit;
      this.mem.write(adr, value);
    }

    this.decw = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      value = (value - 1) & 0xffff;
      this.z = value === 0;
      this.n = (value & 0x8000) > 0;
      this.mem.write(adr, value & 0xff);
      this.mem.write(adrh, value >> 8);
    }

    this.incw = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      value = (value + 1) & 0xffff;
      this.z = value === 0;
      this.n = (value & 0x8000) > 0;
      this.mem.write(adr, value & 0xff);
      this.mem.write(adrh, value >> 8);
    }

    this.cmpw = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      let addTo = (this.r[Y] << 8) | this.r[A];
      let result = addTo + (value ^ 0xffff) + 1;
      this.z = (result & 0xffff) === 0;
      this.n = (result & 0x8000) > 0;
      this.c = result > 0xffff;
    }

    this.addw = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      let addTo = (this.r[Y] << 8) | this.r[A];
      let result = addTo + value;
      this.z = (result & 0xffff) === 0;
      this.n = (result & 0x8000) > 0;
      this.c = result > 0xffff;
      this.v = (
        (addTo & 0x8000) === (value & 0x8000) &&
        (value & 0x8000) !== (result & 0x8000)
      );
      this.h = ((addTo & 0xfff) + (value & 0xfff)) > 0x0fff;
      this.r[A] = result & 0xff;
      this.r[Y] = (result & 0xff00) >> 8;
    }

    this.subw = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      value |= this.mem.read(adrh) << 8;
      value ^= 0xffff;
      let addTo = (this.r[Y] << 8) | this.r[A];
      let result = addTo + value + 1;
      this.z = (result & 0xffff) === 0;
      this.n = (result & 0x8000) > 0;
      this.c = result > 0xffff;
      this.v = (
        (addTo & 0x8000) === (value & 0x8000) &&
        (value & 0x8000) !== (result & 0x8000)
      );
      this.h = ((addTo & 0xfff) + (value & 0xfff) + 1) > 0xfff;
      this.r[A] = result & 0xff;
      this.r[Y] = (result & 0xff00) >> 8;
    }

    this.movw = function(adr, adrh, instr) {
      this.r[A] = this.mem.read(adr);
      this.r[Y] = this.mem.read(adrh);
      this.z = this.r[A] === 0 && this.r[Y] === 0;
      this.n = (this.r[Y] & 0x80) > 0;
    }

    this.movws = function(adr, adrh, instr) {
      this.mem.read(adr);
      this.mem.write(adr, this.r[A]);
      this.mem.write(adrh, this.r[Y]);
    }

    this.movm = function(adr, adrh, instr) {
      if(instr === 0x8f) {
        // MOV $dd, #$ii does a dummy read, MOV $dd, $dd does not
        this.mem.read(adrh);
      }
      this.mem.write(adrh, this.mem.read(adr));
    }

    this.asl = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      this.c = (value & 0x80) > 0;
      value <<= 1;
      this.setZandN(value);
      this.mem.write(adr, value & 0xff);
    }

    this.asla = function(adr, adrh, instr) {
      this.c = (this.r[A] & 0x80) > 0;
      this.r[A] <<= 1;
      this.setZandN(this.r[A]);
    }

    this.rol = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      let carry = (value & 0x80) > 0;
      value = (value << 1) | (this.c ? 1 : 0);
      this.c = carry > 0;
      this.setZandN(value);
      this.mem.write(adr, value & 0xff);
    }

    this.rola = function(adr, adrh, instr) {
      let carry = (this.r[A] & 0x80) > 0;
      this.r[A] = (this.r[A] << 1) | (this.c ? 1 : 0);
      this.c = carry > 0;
      this.setZandN(this.r[A]);
    }

    this.lsr = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      this.c = (value & 0x1) > 0;
      value >>= 1;
      this.setZandN(value);
      this.mem.write(adr, value & 0xff);
    }

    this.lsra = function(adr, adrh, instr) {
      this.c = (this.r[A] & 0x1) > 0;
      this.r[A] >>= 1;
      this.setZandN(this.r[A]);
    }

    this.ror = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      let carry = (value & 0x1) > 0;
      value = (value >> 1) | (this.c ? 0x80 : 0);
      this.c = carry > 0;
      this.setZandN(value);
      this.mem.write(adr, value & 0xff);
    }

    this.rora = function(adr, adrh, instr) {
      let carry = (this.r[A] & 0x1) > 0;
      this.r[A] = (this.r[A] >> 1) | (this.c ? 0x80 : 0);
      this.c = carry > 0;
      this.setZandN(this.r[A]);
    }

    this.inc = function(adr, adrh, instr) {
      let value = (this.mem.read(adr) + 1) & 0xff;
      this.setZandN(value);
      this.mem.write(adr, value);
    }

    this.inca = function(adr, adrh, instr) {
      this.r[A]++;
      this.setZandN(this.r[A]);
    }

    this.incx = function(adr, adrh, instr) {
      this.r[X]++;
      this.setZandN(this.r[X]);
    }

    this.incy = function(adr, adrh, instr) {
      this.r[Y]++;
      this.setZandN(this.r[Y]);
    }

    this.dec = function(adr, adrh, instr) {
      let value = (this.mem.read(adr) - 1) & 0xff;
      this.setZandN(value);
      this.mem.write(adr, value);
    }

    this.deca = function(adr, adrh, instr) {
      this.r[A]--;
      this.setZandN(this.r[A]);
    }

    this.decx = function(adr, adrh, instr) {
      this.r[X]--;
      this.setZandN(this.r[X]);
    }

    this.decy = function(adr, adrh, instr) {
      this.r[Y]--;
      this.setZandN(this.r[Y]);
    }

    this.pushp = function(adr, adrh, instr) {
      this.push(this.getP());
    }

    this.pusha = function(adr, adrh, instr) {
      this.push(this.r[A]);
    }

    this.pushx = function(adr, adrh, instr) {
      this.push(this.r[X]);
    }

    this.pushy = function(adr, adrh, instr) {
      this.push(this.r[Y]);
    }

    this.movxa = function(adr, adrh, instr) {
      this.r[X] = this.r[A];
      this.setZandN(this.r[X]);
    }

    this.movax = function(adr, adrh, instr) {
      this.r[A] = this.r[X];
      this.setZandN(this.r[A]);
    }

    this.movxp = function(adr, adrh, instr) {
      this.r[X] = this.r[SP];
      this.setZandN(this.r[X]);
    }

    this.movpx = function(adr, adrh, instr) {
      this.r[SP] = this.r[X];
    }

    this.movay = function(adr, adrh, instr) {
      this.r[A] = this.r[Y];
      this.setZandN(this.r[A]);
    }

    this.movya = function(adr, adrh, instr) {
      this.r[Y] = this.r[A];
      this.setZandN(this.r[Y]);
    }

    this.notc = function(adr, adrh, instr) {
      this.c = !this.c;
    }

    this.tset1 = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      let result = this.r[A] + (value ^ 0xff) + 1;
      this.setZandN(result);
      value |= this.r[A];
      this.mem.write(adr, value);
    }

    this.tclr1 = function(adr, adrh, instr) {
      let value = this.mem.read(adr);
      let result = this.r[A] + (value ^ 0xff) + 1;
      this.setZandN(result);
      value &= ~this.r[A];
      this.mem.write(adr, value);
    }

    this.cbne = function(adr, adrh, instr) {
      let value = this.mem.read(adr) ^ 0xff;
      let result = this.r[A] + value + 1;
      this.doBranch((result & 0xff) !== 0, adrh);
    }

    this.dbnz = function(adr, adrh, instr) {
      let value = (this.mem.read(adr) - 1) & 0xff;
      this.mem.write(adr, value);
      this.doBranch(value !== 0, adrh);
    }

    this.dbnzy = function(adr, adrh, instr) {
      this.r[Y]--;
      this.doBranch(this.r[Y] !== 0, adr);
    }

    this.popp = function(adr, adrh, instr) {
      this.setP(this.pop());
    }

    this.popa = function(adr, adrh, instr) {
      this.r[A] = this.pop();
    }

    this.popx = function(adr, adrh, instr) {
      this.r[X] = this.pop();
    }

    this.popy = function(adr, adrh, instr) {
      this.r[Y] = this.pop();
    }

    this.brk = function(adr, adrh, instr) {
      this.push(this.br[PC] >> 8);
      this.push(this.br[PC] & 0xff);
      this.push(this.getP());
      this.i = false;
      this.b = true;
      this.br[PC] = this.mem.read(0xffde) | (this.mem.read(0xffdf) << 8);
    }

    this.jmp = function(adr, adrh, instr) {
      this.br[PC] = adr;
    }

    this.bra = function(adr, adrh, instr) {
      this.br[PC] += adr;
    }

    this.call = function(adr, adrh, instr) {
      this.push(this.br[PC] >> 8);
      this.push(this.br[PC] & 0xff);
      this.br[PC] = adr;
    }

    this.pcall = function(adr, adrh, instr) {
      this.push(this.br[PC] >> 8);
      this.push(this.br[PC] & 0xff);
      this.br[PC] = 0xff00 + (adr & 0xff);
    }

    this.ret = function(adr, adrh, instr) {
      this.br[PC] = this.pop();
      this.br[PC] |= this.pop() << 8;
    }

    this.reti = function(adr, adrh, instr) {
      this.setP(this.pop());
      this.br[PC] = this.pop();
      this.br[PC] |= this.pop() << 8;
    }

    this.xcn = function(adr, adrh, instr) {
      this.r[A] = (this.r[A] >> 4) | (this.r[A] << 4);
      this.setZandN(this.r[A]);
    }

    this.sleep = function(adr, adrh, instr) {
      // interrupts are not supported on the spc in the snes, so act like stop
      this.br[PC]--;
    }

    this.stop = function(adr, adrh, instr) {
      this.br[PC]--;
    }

    this.mul = function(adr, adrh, instr) {
      let result = this.r[Y] * this.r[A];
      this.r[A] = result & 0xff;
      this.r[Y] = (result & 0xff00) >> 8;
      this.setZandN(this.r[Y]);
    }

    this.div = function(adr, adrh, instr) {
      let value = this.r[A] | (this.r[Y] << 8);
      let result = 0xffff;
      let mod = value & 0xff;
      if(this.r[X] !== 0) {
        result = (value / this.r[X]) & 0xffff;
        mod = value % this.r[X];
      }
      this.v = result > 0xff;
      this.h = (this.r[X] & 0xf) <= (this.r[Y] & 0xf);
      this.r[A] = result;
      this.r[Y] = mod;
      this.setZandN(this.r[A]);
    }

    this.daa = function(adr, adrh, instr) {
      if(this.r[A] > 0x99 || this.c) {
        this.r[A] += 0x60;
        this.c = true;
      }
      if((this.r[A] & 0xf) > 9 || this.h) {
        this.r[A] += 6;
      }
      this.setZandN(this.r[A]);
    }

    this.das = function(adr, adrh, instr) {
      if(this.r[A] > 0x99 || !this.c) {
        this.r[A] -= 0x60;
        this.c = false;
      }
      if((this.r[A] & 0xf) > 9 || !this.h) {
        this.r[A] -= 6;
      }
      this.setZandN(this.r[A]);
    }

    // function table

    this.functions = [
      this.nop , this.tcall,this.set1, this.bbs , this.or  , this.or  , this.or  , this.or  , this.or  , this.orm , this.or1 , this.asl , this.asl , this.pushp,this.tset1,this.brk ,
      this.bpl , this.tcall,this.clr1, this.bbc , this.or  , this.or  , this.or  , this.or  , this.orm , this.orm , this.decw, this.asl , this.asla, this.decx, this.cmpx, this.jmp ,
      this.clrp, this.tcall,this.set1, this.bbs , this.and , this.and , this.and , this.and , this.and , this.andm, this.or1n, this.rol , this.rol , this.pusha,this.cbne, this.bra ,
      this.bmi , this.tcall,this.clr1, this.bbc , this.and , this.and , this.and , this.and , this.andm, this.andm, this.incw, this.rol , this.rola, this.incx, this.cmpx, this.call,
      this.setp, this.tcall,this.set1, this.bbs , this.eor , this.eor , this.eor , this.eor , this.eor , this.eorm, this.and1, this.lsr , this.lsr , this.pushx,this.tclr1,this.pcall,
      this.bvc , this.tcall,this.clr1, this.bbc , this.eor , this.eor , this.eor , this.eor , this.eorm, this.eorm, this.cmpw, this.lsr , this.lsra, this.movxa,this.cmpy, this.jmp ,
      this.clrc, this.tcall,this.set1, this.bbs , this.cmp , this.cmp , this.cmp , this.cmp , this.cmp , this.cmpm, this.and1n,this.ror , this.ror , this.pushy,this.dbnz, this.ret ,
      this.bvs , this.tcall,this.clr1, this.bbc , this.cmp , this.cmp , this.cmp , this.cmp , this.cmpm, this.cmpm, this.addw, this.ror , this.rora, this.movax,this.cmpy, this.reti,
      this.setc, this.tcall,this.set1, this.bbs , this.adc , this.adc , this.adc , this.adc , this.adc , this.adcm, this.eor1, this.dec , this.dec , this.movy, this.popp, this.movm,
      this.bcc , this.tcall,this.clr1, this.bbc , this.adc , this.adc , this.adc , this.adc , this.adcm, this.adcm, this.subw, this.dec , this.deca, this.movxp,this.div , this.xcn ,
      this.ei  , this.tcall,this.set1, this.bbs , this.sbc , this.sbc , this.sbc , this.sbc , this.sbc , this.sbcm, this.mov1, this.inc , this.inc , this.cmpy, this.popa, this.movs,
      this.bcs , this.tcall,this.clr1, this.bbc , this.sbc , this.sbc , this.sbc , this.sbc , this.sbcm, this.sbcm, this.movw, this.inc , this.inca, this.movpx,this.das , this.mov ,
      this.di  , this.tcall,this.set1, this.bbs , this.movs, this.movs, this.movs, this.movs, this.cmpx, this.movsx,this.mov1s,this.movsy,this.movsy,this.movx, this.popx, this.mul ,
      this.bne , this.tcall,this.clr1, this.bbc , this.movs, this.movs, this.movs, this.movs, this.movsx,this.movsx,this.movws,this.movsy,this.decy, this.movay,this.cbne, this.daa ,
      this.clrv, this.tcall,this.set1, this.bbs , this.mov , this.mov , this.mov , this.mov , this.mov , this.movx, this.not1, this.movy, this.movy, this.notc, this.popy, this.sleep,
      this.beq , this.tcall,this.clr1, this.bbc , this.mov , this.mov , this.mov , this.mov , this.movx, this.movx, this.movm, this.movy, this.incy, this.movya,this.dbnzy,this.stop
    ];

  }

})();
