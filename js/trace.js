
// TODO: peek functions to avoid side effects of reading

function getTrace(cpu, cycles) {
  let str = "";
  str += getByteRep(cpu.r[1]) + ":";
  str += getWordRep(cpu.br[4]) + ": ";
  str += getDisassembly(cpu);
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
  // TODO: side effects of reading
  let op = cpu.mem.read((cpu.r[1] << 16) | cpu.br[4], true);
  let p1 = cpu.mem.read((cpu.r[1] << 16) | ((cpu.br[4] + 1) & 0xffff), true);
  let p2 = cpu.mem.read((cpu.r[1] << 16) | ((cpu.br[4] + 2) & 0xffff), true);
  let p3 = cpu.mem.read((cpu.r[1] << 16) | ((cpu.br[4] + 3) & 0xffff), true);
  let wo = (p2 << 8) | p1;
  let lo = (p3 << 16) | wo;

  let name = opNames[op].toUpperCase();
  switch(cpu.modes[op]) {
    case 0: return name + "             ";
    case 1: return name + " #$" + getByteRep(p1) + "        ";
    case 2: return name + " #$" + (cpu.m ? getByteRep(p1) + "        " : getWordRep(wo) + "      ");
    case 3: return name + " #$" + (cpu.x ? getByteRep(p1) + "        " : getWordRep(wo) + "      ");
    case 4: return name + " #$" + getWordRep(wo) + "      ";
    case 5: return name + " $" + getByteRep(p1) + "         ";
    case 6: return name + " $" + getByteRep(p1) + ",X       ";
    case 7: return name + " $" + getByteRep(p1) + ",Y       ";
    case 8: return name + " ($" + getByteRep(p1) + ")       ";
    case 9: return name + " ($" + getByteRep(p1) + ",X)     ";
    case 10:
    case 11: return name + " ($" + getByteRep(p1) + "),Y     ";
    case 12: return name + " [$" + getByteRep(p1) + "]       ";
    case 13: return name + " [$" + getByteRep(p1) + "],Y     ";
    case 14: return name + " $" + getByteRep(p1) + ",S       ";
    case 15: return name + " ($" + getByteRep(p1) + ",S),Y   ";
    case 16: return name + " $" + getWordRep(wo) + "       ";
    case 17:
    case 18: return name + " $" + getWordRep(wo) + ",X     ";
    case 19:
    case 20: return name + " $" + getWordRep(wo) + ",Y     ";
    case 21: return name + " $" + getLongRep(lo) + "     ";
    case 22: return name + " $" + getLongRep(lo) + ",X   ";
    case 23: return name + " ($" + getWordRep(wo) + ")     ";
    case 24: return name + " ($" + getWordRep(wo) + ",X)   ";
    case 25: return name + " [$" + getWordRep(wo) + "]     ";
    case 26: return name + " $" + getWordRep((cpu.br[4] + 2 + cpu.getSigned(p1, true)) & 0xffff) + "       ";
    case 27: return name + " $" + getWordRep((cpu.br[4] + 3 + cpu.getSigned(wo, false)) & 0xffff) + "       ";
    case 28: return name + " #$" + getByteRep(p2) + ", #$" + getByteRep(p1) + "  ";
  }
}

const opNames = [
  "brk", "ora", "cop", "ora", "tsb", "ora", "asl", "ora", "php", "ora", "asl", "phd", "tsb", "ora", "asl", "ora",
  "bpl", "ora", "ora", "ora", "trb", "ora", "asl", "ora", "clc", "ora", "inc", "tcs", "trb", "ora", "asl", "ora",
  "jsr", "and", "jsl", "and", "bit", "and", "rol", "and", "plp", "and", "rol", "pld", "bit", "and", "rol", "and",
  "bmi", "and", "and", "and", "bit", "and", "rol", "and", "sec", "and", "dec", "tsc", "bit", "and", "rol", "and",
  "rti", "eor", "wdm", "eor", "mvp", "eor", "lsr", "eor", "pha", "eor", "lsr", "phk", "jmp", "eor", "lsr", "eor",
  "bvc", "eor", "eor", "eor", "mvn", "eor", "lsr", "eor", "cli", "eor", "phy", "tcd", "jml", "eor", "lsr", "eor",
  "rts", "adc", "per", "adc", "stz", "adc", "ror", "adc", "pla", "adc", "ror", "rtl", "jmp", "adc", "ror", "adc",
  "bvs", "adc", "adc", "adc", "stz", "adc", "ror", "adc", "sei", "adc", "ply", "tdc", "jmp", "adc", "ror", "adc",
  "bra", "sta", "brl", "sta", "sty", "sta", "stx", "sta", "dey", "bit", "txa", "phb", "sty", "sta", "stx", "sta",
  "bcc", "sta", "sta", "sta", "sty", "sta", "stx", "sta", "tya", "sta", "txs", "txy", "stz", "sta", "stz", "sta",
  "ldy", "lda", "ldx", "lda", "ldy", "lda", "ldx", "lda", "tay", "lda", "tax", "plb", "ldy", "lda", "ldx", "lda",
  "bcs", "lda", "lda", "lda", "ldy", "lda", "ldx", "lda", "clv", "lda", "tsx", "tyx", "ldy", "lda", "ldx", "lda",
  "cpy", "cmp", "rep", "cmp", "cpy", "cmp", "dec", "cmp", "iny", "cmp", "dex", "wai", "cpy", "cmp", "dec", "cmp",
  "bne", "cmp", "cmp", "cmp", "pei", "cmp", "dec", "cmp", "cld", "cmp", "phx", "stp", "jml", "cmp", "dec", "cmp",
  "cpx", "sbc", "sep", "sbc", "cpx", "sbc", "inc", "sbc", "inx", "sbc", "nop", "xba", "cpx", "sbc", "inc", "sbc",
  "beq", "sbc", "sbc", "sbc", "pea", "sbc", "inc", "sbc", "sed", "sbc", "plx", "xce", "jsr", "sbc", "inc", "sbc"
]

function getSpcTrace(cpu, cycles) {
  let str = "";
  str += getWordRep(cpu.br[0]) + ": ";
  str += getSpcDisassembly(cpu);
  str += "A:" + getByteRep(cpu.r[0]) + " ";
  str += "X:" + getByteRep(cpu.r[1]) + " ";
  str += "Y:" + getByteRep(cpu.r[2]) + " ";
  str += "SP:" + getByteRep(cpu.r[3]) + " ";
  str += getSpcFlags(cpu) + " ";
  str += "CYC:" + cycles
  return str;
}

function getSpcFlags(cpu) {
  let val = "";
  val += cpu.n ? "N" : "n";
  val += cpu.v ? "V" : "v";
  val += cpu.p ? "P" : "p";
  val += cpu.b ? "B" : "b";
  val += cpu.h ? "H" : "h";
  val += cpu.i ? "I" : "i";
  val += cpu.z ? "Z" : "z";
  val += cpu.c ? "C" : "c";
  return val;
}

function getSpcDisassembly(cpu) {
  let op = cpu.mem.read(cpu.br[0]);
  let p1 = cpu.mem.read((cpu.br[0] + 1) & 0xffff);
  let p2 = cpu.mem.read((cpu.br[0] + 2) & 0xffff);
  let wo = (p2 << 8) | p1;
  let wob = wo & 0x1fff;
  let wobd = wo >> 13;

  let str = spcOpBegin[op];
  let end = spcOpEnd[op];

  switch(cpu.modes[op]) {
    case 0: str += end; break;
    case 1: str += " $" + getWordRep((cpu.br[0] + 2 + cpu.getSigned(p1)) & 0xffff) + end; break;
    case 2: str += " $" + getByteRep(p1) + end; break;
    case 3: {
      if((op & 0xf) === 3) {
        str += " $" + getByteRep(p1) + end + ", $" + getWordRep((cpu.br[0] + 3 + cpu.getSigned(p2)) & 0xffff); break;
      }
      str += " $" + getByteRep(p1) + ", $" + getWordRep((cpu.br[0] + 3 + cpu.getSigned(p2)) & 0xffff) + end; break;
    }
    case 4: str += " $" + getWordRep(wo) + end; break;
    case 5: str += " (X)" + end; break;
    case 6: str += " [$" + getByteRep(p1) + "+X]" + end; break;
    case 7: str += " #$" + getByteRep(p1) + end; break;
    case 8: str += " $" + getByteRep(p1) + "+X" + end; break;
    case 9: str += " $" + getWordRep(wo) + "+X" + end; break;
    case 10: str += " $" + getWordRep(wo) + "+Y" + end; break;
    case 11: str += " [$" + getByteRep(p1) + "]+Y" + end; break;
    case 12: str += " $" + getByteRep(p2) + ", $" + getByteRep(p1) + end; break;
    case 13: str += " (X), (Y)" + end; break;
    case 14: str += " $" + getByteRep(p2) + ", #$" + getByteRep(p1) + end; break;
    case 15: str += " $" + getByteRep(p1) + "+Y" + end; break;
    case 16: {
      if(op === 0x2a || op === 0x6a) {
        str += "$" + getWordRep(wob) + "." + wobd + end; break;
      }
      str += " $" + getWordRep(wob) + "." + wobd + end; break;
    }
    case 17: str += " $" + getByteRep(p1) + "+X, $" + getWordRep((cpu.br[0] + 3 + cpu.getSigned(p2)) & 0xffff) + end; break;
    case 18: str += " [$" + getWordRep(wo) + "+X]" + end; break;
    case 19: str += " (X+)" + end; break;
  }
  let spaces = 20 - str.length;
  for(let i = 0; i < spaces; i++) {
    str += " ";
  }
  return str;
}

const spcOpBegin = [
  "NOP  ", "TCALL", "SET1 ", "BBS  ", "OR    A,", "OR    A,", "OR    A,", "OR    A,", "OR    A, ", "OR   ", "OR1   C,", "ASL  ", "ASL  ", "PUSH  PSW", "TSET1", "BRK  ",
  "BPL  ", "TCALL", "CLR1 ", "BBC  ", "OR    A,", "OR    A,", "OR    A,", "OR    A,", "OR   ", "OR   ", "DECW ", "ASL  ", "ASL   A", "DEC   X", "CMP   X,", "JMP  ",
  "CLRP ", "TCALL", "SET1 ", "BBS  ", "AND   A,", "AND   A,", "AND   A,", "AND   A,", "AND   A,", "AND  ", "OR1   C, /", "ROL  ", "ROL  ", "PUSH  A", "CBNE ", "BRA  ",
  "BMI  ", "TCALL", "CLR1 ", "BBC  ", "AND   A,", "AND   A,", "AND   A,", "AND   A,", "AND  ", "AND  ", "INCW ", "ROL  ", "ROL   A", "INC   X", "CMP   X,", "CALL ",
  "SETP ", "TCALL", "SET1 ", "BBS  ", "EOR   A,", "EOR   A,", "EOR   A,", "EOR   A,", "EOR   A,", "EOR  ", "AND1  C,", "LSR  ", "LSR  ", "PUSH  X", "TCLR1", "PCALL",
  "BVC  ", "TCALL", "CLR1 ", "BBC  ", "EOR   A,", "EOR   A,", "EOR   A,", "EOR   A,", "EOR  ", "EOR  ", "CMPW  YA,", "LSR  ", "LSR   A", "MOV   X, A", "CMP   Y,", "JMP  ",
  "CLRC ", "TCALL", "SET1 ", "BBS  ", "CMP   A,", "CMP   A,", "CMP   A,", "CMP   A,", "CMP   A,", "CMP  ", "AND1  C, /", "ROR  ", "ROR  ", "PUSH  Y", "DBNZ ", "RET  ",
  "BVS  ", "TCALL", "CLR1 ", "BBC  ", "CMP   A,", "CMP   A,", "CMP   A,", "CMP   A,", "CMP  ", "CMP  ", "ADDW  YA,", "LSR  ", "LSR   A", "MOV   A, X", "CMP   Y,", "RETI ",
  "SETC ", "TCALL", "SET1 ", "BBS  ", "ADC   A,", "ADC   A,", "ADC   A,", "ADC   A,", "ADC   A,", "ADC  ", "EOR1  C,", "DEC  ", "DEC  ", "MOV   Y,", "POP   PSW", "MOV  ",
  "BCC  ", "TCALL", "CLR1 ", "BBC  ", "ADC   A,", "ADC   A,", "ADC   A,", "ADC   A,", "ADC  ", "ADC  ", "SUBW  YA,", "DEC  ", "DEC   A", "MOV   X, SP", "DIV   YA, X", "XCN   A",
  "EI   ", "TCALL", "SET1 ", "BBS  ", "SBC   A,", "SBC   A,", "SBC   A,", "SBC   A,", "SBC   A,", "SBC  ", "MOV1  C,", "INC  ", "INC  ", "CMP   Y,", "POP   A", "MOV  ",
  "BCS  ", "TCALL", "CLR1 ", "BBC  ", "SBC   A,", "SBC   A,", "SBC   A,", "SBC   A,", "SBC  ", "SBC  ", "MOVW  YA,", "INC  ", "INC   A", "MOV   SP, X", "DAS   A", "MOV   A,",
  "DI   ", "TCALL", "SET1 ", "BBS  ", "MOV  ", "MOV  ", "MOV  ", "MOV  ", "CMP   X,", "MOV  ", "MOV1 ", "MOV  ", "MOV  ", "MOV   X,", "POP   A", "MUL   YA",
  "BNE  ", "TCALL", "CLR1 ", "BBC  ", "MOV  ", "MOV  ", "MOV  ", "MOV  ", "MOV  ", "MOV  ", "MOVW ", "MOV  ", "DEC   Y", "MOV   A, Y", "CBNE ", "DAA   A",
  "CLRV ", "TCALL", "SET1 ", "BBS  ", "MOV   A,", "MOV   A,", "MOV   A,", "MOV   A,", "MOV   A,", "MOV   X,", "NOT1 ", "MOV   Y,", "MOV   Y,", "NOTC ", "POP   Y", "SLEEP",
  "BEQ  ", "TCALL", "CLR1 ", "BBC  ", "MOV   A,", "MOV   A,", "MOV   A,", "MOV   A,", "MOV   X,", "MOV   X,", "MOV  ", "MOV   Y,", "INC   Y", "MOV   Y, A", "DBNZ  Y,", "STOP"
]

const spcOpEnd = [
  "", " 0", ".0", ".0", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 1", ".0", ".0", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 2", ".1", ".1", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 3", ".1", ".1", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 4", ".2", ".2", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 5", ".2", ".2", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 6", ".3", ".3", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 7", ".3", ".3", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 8", ".4", ".4", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 9", ".4", ".4", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 10", ".5", ".5", "", "", "", "", "", "", "", "", "", "", "", ", A",
  "", " 11", ".5", ".5", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 12", ".6", ".6", ", A", ", A", ", A", ", A", "", ", X",  ", C", ", Y", ", Y", "", "", "",
  "", " 13", ".6", ".6", ", A", ", A", ", A", ", A", ", X", ", X", ", YA", ", Y", "", "", "", "",
  "", " 14", ".7", ".7", "", "", "", "", "", "", "", "", "", "", "", "",
  "", " 15", ".7", ".7", "", "", "", "", "", "", "", "", "", "", "", ""
]
