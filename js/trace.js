
function getTrace(cpu, cycles) {
  let str = "";
  str += getByteRep(cpu.r[K]) + ":";
  str += getWordRep(cpu.br[PC]) + " - ";
  str += getDisassembly(cpu) + " - ";
  str += "A: " + getWordRep(cpu.br[A]) + ", ";
  str += "X: " + getWordRep(cpu.br[X]) + ", ";
  str += "Y: " + getWordRep(cpu.br[Y]) + ", ";
  str += "SP: " + getWordRep(cpu.br[SP]) + ", ";
  str += "DBR: " + getByteRep(cpu.r[DBR]) + ", ";
  str += "DPR: " + getWordRep(cpu.br[DPR]) + ", ";
  str += getFlags(cpu) + " " + (cpu.e ? "E" : "e") + ", ";
  str += "CYC: " + cycles
  return str;
}

function getFlags(cpu) {
  let val = "";
  val += cpu.n ? "N" : "n";
  val += cpu.v ? "V" : "v";
  val += cpu.m ? "M" : "m";
  val += cpu.x ? "X" : "x";
  val += cpu.d ? "D" : "d";
  val += cpu.i ? "I" : "i";
  val += cpu.z ? "Z" : "z";
  val += cpu.c ? "C" : "c";
  return val;
}

function getDisassembly(cpu) {
  let op = cpu.mem.read((cpu.r[K] << 16) | cpu.br[PC]);
  let p1 = cpu.mem.read((cpu.r[K] << 16) | ((cpu.br[PC] + 1) & 0xffff));
  let p2 = cpu.mem.read((cpu.r[K] << 16) | ((cpu.br[PC] + 2) & 0xffff));
  let p3 = cpu.mem.read((cpu.r[K] << 16) | ((cpu.br[PC] + 3) & 0xffff));
  let wo = (p2 << 8) | p1;
  let lo = (p3 << 16) | wo;
  console.log(op);
  let name = opNames[op].toUpperCase();
  switch(cpu.modes[op]) {
    case IMP: return name + "\t\t";
    case IMM: return name + " #$" + getByteRep(p1) + "\t";
    case IMMm: return name + " #$" + (cpu.m ? getByteRep(p1) : getWordRep(wo)) + "\t";
    case IMMx: return name + " #$" + (cpu.x ? getByteRep(p1) : getWordRep(wo)) + "\t";
    case IMMl: return name + "#$" + getWordRep(wo) + "\t";
    case DP: return name + " $" + getByteRep(p1) + "\t\t";
    case DPX: return name + " $" + getByteRep(p1) + ",X\t";
    case DPY: return name + " $" + getByteRep(p1) + ",Y\t";
    case IDP: return name + " ($" + getByteRep(p1) + ")\t";
    case IDX: return name + " ($" + getByteRep(p1) + ",X)\t";
    case IDY:
    case IDYr: return name + " ($" + getByteRep(p1) + "),Y\t";
    case IDL: return name + " [$" + getByteRep(p1) + "]\t";
    case ILY: return name + " [$" + getByteRep(p1) + "],Y\t";
    case SR: return name + " $" + getByteRep(p1) + ",S\t";
    case ISY: return name + " ($" + getByteRep(p1) + ",S)Y\t";
    case ABS: return name + " $" + getWordRep(wo) + "\t";
    case ABX:
    case ABXr: return name + " $" + getWordRep(wo) + ",X\t";
    case ABY:
    case ABYr: return name + " $" + getWordRep(wo) + ",Y\t";
    case ABL: return name + " $" + getLongRep(lo) + "\t";
    case ALX: return name + " $" + getLongRep(lo) + ",X\t";
    case IND: return name + " ($" + getWordRep(wo) + ")\t";
    case IAX: return name + " ($" + getWordRep(wo) + ",X)\t";
    case IAL: return name + " [$" + getWordRep(wo) + "]\t";
    case REL: return name + " $" + getWordRep((cpu.br[PC] + cpu.getSigned(p1, true)) & 0xffff) + "\t";
    case RLL: return name + " $" + getWordRep((cpu.br[PC] + cpu.getSigned(wo, false)) & 0xffff) + "\t";
    case BM: return name + " #$" + getByteRep(p2) + ",#$" + getByteRep(p1) + "\t";
  }
}

const opNames = [
  "brk", "ora", "cop", "ora", "tsb", "ora", "asl", "ora", "php", "ora", "asl ","phd", "tsb", "ora", "asl", "ora",
  "bpl", "ora", "ora", "ora", "trb", "ora", "asl", "ora", "clc", "ora", "inc ","tcs", "trb", "ora", "asl", "ora",
  "jsr", "and", "jsl", "and", "bit", "and", "rol", "and", "plp", "and", "rol ","pld", "bit", "and", "rol", "and",
  "bmi", "and", "and", "and", "bit", "and", "rol", "and", "sec", "and", "dec ","tsc", "bit", "and", "rol", "and",
  "rti", "eor", "wdm", "eor", "mvp", "eor", "lsr", "eor", "pha", "eor", "lsr ","phk", "jmp", "eor", "lsr", "eor",
  "bvc", "eor", "eor", "eor", "mvn", "eor", "lsr", "eor", "cli", "eor", "phy", "tcd", "jmp", "eor", "lsr", "eor",
  "rts", "adc", "per", "adc", "stz", "adc", "ror", "adc", "pla", "adc", "ror ","rtl", "jmp", "adc", "ror", "adc",
  "bvs", "adc", "adc", "adc", "stz", "adc", "ror", "adc", "sei", "adc", "ply", "tdc", "jmp", "adc", "ror", "adc",
  "bra", "sta", "brl", "sta", "sty", "sta", "stx", "sta", "dey", "bit ","txa", "phb", "sty", "sta", "stx", "sta",
  "bcc", "sta", "sta", "sta", "sty", "sta", "stx", "sta", "tya", "sta", "txs", "txy", "stz", "sta", "stz", "sta",
  "ldy", "lda", "ldx", "lda", "ldy", "lda", "ldx", "lda", "tay", "lda", "tax", "plb", "ldy", "lda", "ldx", "lda",
  "bcs", "lda", "lda", "lda", "ldy", "lda", "ldx", "lda", "clv", "lda", "tsx", "tyx", "ldy", "lda", "ldx", "lda",
  "cpy", "cmp", "rep", "cmp", "cpy", "cmp", "dec", "cmp", "iny", "cmp", "dex", "wai", "cpy", "cmp", "dec", "cmp",
  "bne", "cmp", "cmp", "cmp", "pei", "cmp", "dec", "cmp", "cld", "cmp", "phx", "stp", "jmp", "cmp", "dec", "cmp",
  "cpx", "sbc", "sep", "sbc", "cpx", "sbc", "inc", "sbc", "inx", "sbc", "nop", "xba", "cpx", "sbc", "inc", "sbc",
  "beq", "sbc", "sbc", "sbc", "pea", "sbc", "inc", "sbc", "sed", "sbc", "plx", "xce", "jsr", "sbc", "inc", "sbc"
]
