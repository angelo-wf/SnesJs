
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
const IMP = 0;
const IMM = 1; // always 8 bit
const IMMm = 2; // size depends on m flag
const IMMx = 3; // size depends on x flag
const IMMl = 4; // alsways 16 bit
const DP = 5;
const DPX = 6;
const DPY = 7;
const IDX = 8;
const IDY = 9; // for RMW and writes
const IDYr = 10; // for reads
const IDL = 11;
const ILY = 12;
const SR = 13;
const ISY = 14;
const ABS = 15;
const ABX = 16; // for RMW and writes
const ABXr = 17; // for reads
const ABY = 18; // for RMW and writes
const ABYr = 19; // for reads
const ABL = 20;
const ALX = 21;
const IND = 22;
const IAX = 23;
const IAL = 24;
const REL = 25;
const RLL = 26;
const BM = 27; // block move

function Cpu(mem) {

  // memory handler
  this.mem = mem;

  // registers
  this.r = new Uint8Array(2);
  this.br = new Uint16Array(6);

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

    // cycles left
    this.cyclesLeft = 7;

  }
  this.reset();


}
