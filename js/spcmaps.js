
function Temp() {

  // will be placed in spc.js later

  this.modes = [
    IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD ,
    REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II ,
    IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD ,
    REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II ,
    IMP, IMP, DP , DPR, DP , ABS, IND, IDX, IMM, DD ,
    REL, IMP, DP , DPR, DPX, ABX, ABY, IDY, DI , II ,
    IMP, IMP, DP , DPR,
    REL, IMP, DP , DPR,
    IMP, IMP, DP , DPR,
    REL, IMP, DP , DPR,
    IMP, IMP, DP , DPR,
    REL, IMP, DP , DPR,
    IMP, IMP, DP , DPR,
    REL, IMP, DP , DPR,
    IMP, IMP, DP , DPR,
    REL, IMP, DP , DPR,
  ];

  this.cycles = [
    2, 8, 4, 5, 3, 4, 3, 6, 2, 6,
    2, 8, 4, 5, 4, 5, 5, 6, 5, 5,
    2, 8, 4, 5, 3, 4, 3, 6, 2, 6,
    2, 8, 4, 5, 4, 5, 5, 6, 5, 5,
    2, 8, 4, 5, 3, 4, 3, 6, 2, 6,
    2, 8, 4, 5, 4, 5, 5, 6, 5, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
    2, 8, 4, 5,
  ];

  this.functions = [
    this.nop , this.tcall,this.set1, this.bbs , this.or  , this.or  , this.or  , this.or  , this.or  , this.orm ,
    this.bpl , this.tcall,this.clr1, this.bbc , this.or  , this.or  , this.or  , this.or  , this.orm , this.orm ,
    this.clrp, this.tcall,this.set1, this.bbs , this.and , this.and , this.and , this.and , this.and , this.andm,
    this.bmi , this.tcall,this.clr1, this.bbc , this.and , this.and , this.and , this.and , this.andm, this.andm,
    this.setp, this.tcall,this.set1, this.bbs , this.eor , this.eor , this.eor , this.eor , this.eor , this.eorm,
    this.bvc , this.tcall,this.clr1, this.bbc , this.eor , this.eor , this.eor , this.eor , this.eorm, this.eorm,
    this.clrc, this.tcall,this.set1, this.bbs ,
    this.bvs , this.tcall,this.clr1, this.bbc ,
    this.setc, this.tcall,this.set1, this.bbs ,
    this.bcc , this.tcall,this.clr1, this.bbc ,
    this.ei  , this.tcall,this.set1, this.bbs ,
    this.bcs , this.tcall,this.clr1, this.bbc ,
    this.di  , this.tcall,this.set1, this.bbs ,
    this.bne , this.tcall,this.clr1, this.bbc ,
    this.clrv, this.tcall,this.set1, this.bbs ,
    this.bew , this.tcall,this.clr1, this.bbc ,
  ];
}
