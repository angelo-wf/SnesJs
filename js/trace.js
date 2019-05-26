

function getTrace(cpu, cycles) {
  let str = "";
  str += getByteRep(cpu.r[1]) + ":";
  str += getWordRep(cpu.br[4]) + " - ";
  str += getDisassembly(cpu) + " - ";
  str += "A:" + getWordRep(cpu.br[0]) + " ";
  str += "X:" + getWordRep(cpu.br[1]) + " ";
  str += "Y:" + getWordRep(cpu.br[2]) + " ";
  str += "SP:" + getWordRep(cpu.br[3]) + " ";
  str += "DBR:" + getByteRep(cpu.r[0]) + " ";
  str += "DPR:" + getWordRep(cpu.br[5]) + " ";
  str += getFlags(cpu) + " " + (cpu.e ? "E" : "e") + " ";
  str += "CYC:" + cycles
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
  if(cpu.abortWanted) {
    return "abort\t\t";
  }
  if(cpu.nmiWanted) {
    return "nmi\t\t";
  }
  if(cpu.irqWanted) {
    return "irq\t\t";
  }

  let op = cpu.mem.read((cpu.r[1] << 16) | cpu.br[4]);
  let p1 = cpu.mem.read((cpu.r[1] << 16) | ((cpu.br[4] + 1) & 0xffff));
  let p2 = cpu.mem.read((cpu.r[1] << 16) | ((cpu.br[4] + 2) & 0xffff));
  let p3 = cpu.mem.read((cpu.r[1] << 16) | ((cpu.br[4] + 3) & 0xffff));
  let wo = (p2 << 8) | p1;
  let lo = (p3 << 16) | wo;

  let name = opNames[op].toUpperCase();
  switch(cpu.modes[op]) {
    case 0: return name + "\t\t";
    case 1: return name + " #$" + getByteRep(p1) + "\t";
    case 2: return name + " #$" + (cpu.m ? getByteRep(p1) : getWordRep(wo)) + "\t";
    case 3: return name + " #$" + (cpu.x ? getByteRep(p1) : getWordRep(wo)) + "\t";
    case 4: return name + " #$" + getWordRep(wo) + "\t";
    case 5: return name + " $" + getByteRep(p1) + "\t";
    case 6: return name + " $" + getByteRep(p1) + ",X\t";
    case 7: return name + " $" + getByteRep(p1) + ",Y\t";
    case 8: return name + " ($" + getByteRep(p1) + ")\t";
    case 9: return name + " ($" + getByteRep(p1) + ",X)\t";
    case 10:
    case 11: return name + " ($" + getByteRep(p1) + "),Y\t";
    case 12: return name + " [$" + getByteRep(p1) + "]\t";
    case 13: return name + " [$" + getByteRep(p1) + "],Y\t";
    case 14: return name + " $" + getByteRep(p1) + ",S\t";
    case 15: return name + " ($" + getByteRep(p1) + ",S),Y\t";
    case 16: return name + " $" + getWordRep(wo) + "\t";
    case 17:
    case 18: return name + " $" + getWordRep(wo) + ",X\t";
    case 19:
    case 20: return name + " $" + getWordRep(wo) + ",Y\t";
    case 21: return name + " $" + getLongRep(lo) + "\t";
    case 22: return name + " $" + getLongRep(lo) + ",X\t";
    case 23: return name + " ($" + getWordRep(wo) + ")\t";
    case 24: return name + " ($" + getWordRep(wo) + ",X)\t";
    case 25: return name + " [$" + getWordRep(wo) + "]\t";
    case 26: return name + " $" + getWordRep((cpu.br[4] + 2 + cpu.getSigned(p1, true)) & 0xffff) + "\t";
    case 27: return name + " $" + getWordRep((cpu.br[4] + 3 + cpu.getSigned(wo, false)) & 0xffff) + "\t";
    case 28: return name + " #$" + getByteRep(p2) + ",#$" + getByteRep(p1) + "\t";
  }
}

const opNames = [
  "brk", "ora", "cop", "ora", "tsb", "ora", "asl", "ora", "php", "ora", "asl", "phd", "tsb", "ora", "asl", "ora",
  "bpl", "ora", "ora", "ora", "trb", "ora", "asl", "ora", "clc", "ora", "inc", "tcs", "trb", "ora", "asl", "ora",
  "jsr", "and", "jsl", "and", "bit", "and", "rol", "and", "plp", "and", "rol", "pld", "bit", "and", "rol", "and",
  "bmi", "and", "and", "and", "bit", "and", "rol", "and", "sec", "and", "dec", "tsc", "bit", "and", "rol", "and",
  "rti", "eor", "wdm", "eor", "mvp", "eor", "lsr", "eor", "pha", "eor", "lsr", "phk", "jmp", "eor", "lsr", "eor",
  "bvc", "eor", "eor", "eor", "mvn", "eor", "lsr", "eor", "cli", "eor", "phy", "tcd", "jmp", "eor", "lsr", "eor",
  "rts", "adc", "per", "adc", "stz", "adc", "ror", "adc", "pla", "adc", "ror", "rtl", "jmp", "adc", "ror", "adc",
  "bvs", "adc", "adc", "adc", "stz", "adc", "ror", "adc", "sei", "adc", "ply", "tdc", "jmp", "adc", "ror", "adc",
  "bra", "sta", "brl", "sta", "sty", "sta", "stx", "sta", "dey", "bit", "txa", "phb", "sty", "sta", "stx", "sta",
  "bcc", "sta", "sta", "sta", "sty", "sta", "stx", "sta", "tya", "sta", "txs", "txy", "stz", "sta", "stz", "sta",
  "ldy", "lda", "ldx", "lda", "ldy", "lda", "ldx", "lda", "tay", "lda", "tax", "plb", "ldy", "lda", "ldx", "lda",
  "bcs", "lda", "lda", "lda", "ldy", "lda", "ldx", "lda", "clv", "lda", "tsx", "tyx", "ldy", "lda", "ldx", "lda",
  "cpy", "cmp", "rep", "cmp", "cpy", "cmp", "dec", "cmp", "iny", "cmp", "dex", "wai", "cpy", "cmp", "dec", "cmp",
  "bne", "cmp", "cmp", "cmp", "pei", "cmp", "dec", "cmp", "cld", "cmp", "phx", "stp", "jmp", "cmp", "dec", "cmp",
  "cpx", "sbc", "sep", "sbc", "cpx", "sbc", "inc", "sbc", "inx", "sbc", "nop", "xba", "cpx", "sbc", "inc", "sbc",
  "beq", "sbc", "sbc", "sbc", "pea", "sbc", "inc", "sbc", "sed", "sbc", "plx", "xce", "jsr", "sbc", "inc", "sbc"
]
