
let logStr = "";

let c = el("output");
c.width = 512;
c.height = 480;
let ctx = c.getContext("2d");
let imgData = ctx.createImageData(512, 480);

let loopId = 0;

let snes = new Snes();

zip.workerScriptsPath = "lib/";
zip.useWebWorkers = false;

el("rom").onchange = function(e) {
  //audioHandler.resume();
  let freader = new FileReader();
  freader.onload = function() {
    let buf = freader.result;
    if(e.target.files[0].name.slice(-4) === ".zip") {
      // use zip.js to read the zip
      let blob = new Blob([buf]);
      zip.createReader(new zip.BlobReader(blob), function(reader) {
        reader.getEntries(function(entries) {
          if(entries.length) {
            let found = false;
            for(let i = 0; i < entries.length; i++) {
              let name = entries[i].filename;
              if(name.slice(-4) !== ".smc" && name.slice(-4) !== ".sfc") {
                continue;
              }
              found = true;
              log("Loaded \"" + name + "\" from zip");
              entries[i].getData(new zip.BlobWriter(), function(blob) {
                let breader = new FileReader();
                breader.onload = function() {
                  let rbuf = breader.result;
                  let arr = new Uint8Array(rbuf);
                  loadRom(arr);
                  reader.close(function() {});
                }
                breader.readAsArrayBuffer(blob);
              }, function(curr, total) {});
              break;
            }
            if(!found) {
              log("No .smc or .smf file found in zip");
            }
          } else {
            log("Zip file was empty");
          }
        });
      }, function(err) {
        log("Failed to read zip: " + err);
      });
    } else {
      // load rom normally
      let arr = new Uint8Array(buf);
      loadRom(arr);
    }
  }
  freader.readAsArrayBuffer(e.target.files[0]);
}

el("pause").onclick = function() {
  cancelAnimationFrame(loopId);
}

function loadRom(rom) {
  if(snes.loadRom(rom)) {
    snes.reset(true);
    loopId = requestAnimationFrame(update);
  }
  placeLog();
}

function run() {
  for(let i = 0; i < 100; i++) {
    // do {
    //   snes.cycle();
    // } while(snes.cpu.cyclesLeft > 0);
    // log(getTrace(snes.cpu, snes.cycles));

    do {
      snes.cycle();
    } while(snes.apu.spc.cyclesLeft > 0);
    log(getSpcTrace(snes.apu.spc, snes.cycles));
  }
}

function update() {
  run();
  placeLog();
  loopId = requestAnimationFrame(update);
}

function log(text) {
  logStr += text + "\n";
}

function placeLog(text) {
  el("log").innerHTML += logStr;
  el("log").scrollTop = el("log").scrollHeight;
  logStr = "";
}

function getByteRep(val) {
  return ("0" + val.toString(16)).slice(-2).toUpperCase();
}

function getWordRep(val) {
  return ("000" + val.toString(16)).slice(-4).toUpperCase();
}

function getLongRep(val) {
  return ("00000" + val.toString(16)).slice(-6).toUpperCase();
}

function clearArray(arr) {
  for(let i = 0; i < arr.length; i++) {
    arr[i] = 0;
  }
}

function el(id) {
  return document.getElementById(id);
}
