
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

  return function(mem) {

    this.mem = mem;

    this.r = new Uint8Array(4);
    this.br = new Uint16Array(1);

    this.modes = [

    ];

    this.cycles = [

    ];

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
        let instr = this.mem.read(this.br[PC]++);
        let mode = this.modes[instr];
        this.cyclesLeft = this.cycles[instr];

        let eff = this.getAdr(mode);
        this.functions[instr].call(this, eff[0], eff[1], instr);
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

    this.setP = function(val) {
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
          // direct page, rel
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
          // absolute, indexed on x
          let adr = this.mem.read(this.br[PC]++);
          adr |= this.mem.read(this.br[PC]++) << 8;
          return [(adr + this.r[X]) & 0xffff, 0];
        }
        case ABY: {
          // absolute, indexed on y
          let adr = this.mem.read(this.br[PC]++);
          adr |= this.mem.read(this.br[PC]++) << 8;
          return [(adr + this.r[Y]) & 0xffff, 0];
        }
        case IDY: {
          // indirect indexed direct
          let pointer = this.mem.read(this.br[PC]++);
          let adr = this.mem.read((pointer & 0xff) | (this.p ? 0x100 : 0));
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
      this.mem.write(this.r[SP] | 0x100, this.br[PC] >> 8);
      this.r[SP]--;
      this.mem.write(this.r[SP] | 0x100, this.br[PC] & 0xff);
      this.r[SP]--;
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


  }

})();
