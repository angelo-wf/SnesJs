
let player = new SpcPlayer();

let c = el("output");
c.width = 512;
c.height = 480;
let ctx = c.getContext("2d");
let imgData = ctx.getImageData(0, 0, 512, 480);

let loopId = 0;
let loaded = false;
let paused = false;
let pausedInBg = false;

let logging = false;

let audioHandler = new AudioHandler();

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
              if(name.slice(-4) !== ".spc" && name.slice(-4) !== ".SPC") {
                continue;
              }
              found = true;
              log("Loaded \"" + name + "\" from zip");
              entries[i].getData(new zip.BlobWriter(), function(blob) {
                let breader = new FileReader();
                breader.onload = function() {
                  let rbuf = breader.result;
                  let arr = new Uint8Array(rbuf);
                  loadSpc(arr);
                  reader.close(function() {});
                }
                breader.readAsArrayBuffer(blob);
              }, function(curr, total) {});
              break;
            }
            if(!found) {
              log("No .spc file found in zip");
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
      loadSpc(arr);
      // loadBlarggTest(arr);
    }
  }
  freader.readAsArrayBuffer(e.target.files[0]);
}

el("pause").onclick = function() {
  if(paused && loaded) {
    loopId = requestAnimationFrame(update);
    audioHandler.start();
    paused = false;
    el("pause").textContent = "Pause";
  } else {
    cancelAnimationFrame(loopId);
    audioHandler.stop();
    paused = true;
    el("pause").textContent = "Continue";
  }
}

el("reset").onclick = function() {
  if(loaded) {
    player.reset();
  }
}

document.onvisibilitychange = function(e) {
  if(document.hidden) {
    pausedInBg = false;
    if(!paused && loaded) {
      el("pause").click();
      pausedInBg = true;
    }
  } else {
    if(pausedInBg && loaded) {
      el("pause").click();
      pausedInBg = false;
    }
  }
}

function loadSpc(spc) {
  if(player.loadSpc(spc)) {
    if(!loaded && !paused) {
      loopId = requestAnimationFrame(update);
      audioHandler.start();
    }
    loaded = true;
  }
}

function runFrame() {
  if(logging) {
    do {
      player.cycle();
    } while(player.apu.spc.cyclesLeft > 0);
    log(getSpcTrace(player.apu.spc, player.apu.cycles));
  } else {
    player.runFrame();
  }
  player.setSamples(audioHandler.sampleBufferL, audioHandler.sampleBufferR, audioHandler.samplesPerFrame);
  audioHandler.nextBuffer();
  drawVisual();
}

function update() {
  runFrame();
  loopId = requestAnimationFrame(update);
}

function drawVisual() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, c.width, c.height);
  // draw text
  ctx.fillStyle = "#7fff7f";
  ctx.font = "12pt arial";
  ctx.fillText("Title:", 20, 25);
  ctx.fillText("Game:", 20, 45);
  ctx.fillText("Artist:", 20, 65);
  ctx.fillText("Dumper:", 20, 85);
  ctx.fillText("Comment:", 20, 105);
  ctx.fillText(player.tags.title, 100, 25);
  ctx.fillText(player.tags.game, 100, 45);
  ctx.fillText(player.tags.artist, 100, 65);
  ctx.fillText(player.tags.dumper, 100, 85);
  ctx.fillText(player.tags.comment, 100, 105);
  // draw visualisation per channel
  for(let i = 0; i < 8; i++) {
    ctx.fillStyle = "#3f1f1f";
    ctx.fillRect(10 + i * 55 + 5, 470 - 300, 10, 300);
    ctx.fillStyle = "#1f3f1f";
    ctx.fillRect(10 + i * 55 + 15, 470 - 300, 10, 300);
    ctx.fillStyle = "#3f3f1f";
    ctx.fillRect(10 + i * 55 + 25, 470 - 300, 10, 300);
    ctx.fillStyle = "#1f1f3f";
    ctx.fillRect(10 + i * 55 + 40, 470 - 300, 10, 300);
    ctx.fillStyle = "#ff7f7f";
    let scale = Math.abs(player.apu.dsp.channelVolumeL[i]) * 300 / 0x80;
    ctx.fillRect(10 + i * 55 + 5, 470 - scale, 10, scale);
    ctx.fillStyle = "#7fff7f";
    scale = Math.abs(player.apu.dsp.channelVolumeR[i]) * 300 / 0x80;
    ctx.fillRect(10 + i * 55 + 15, 470 - scale, 10, scale);
    ctx.fillStyle = "#ffff7f";
    scale = player.apu.dsp.gain[i] * 300 / 0x7ff;
    ctx.fillRect(10 + i * 55 + 25, 470 - scale, 10, scale);
    ctx.fillStyle = "#7f7fff";
    scale = player.apu.dsp.pitch[i] * 290 / 0x3fff;
    ctx.fillRect(10 + i * 55 + 40, 470 - scale - 10, 10, 10);
  }
}

window.onkeydown = function(e) {
  switch(e.key) {
    case "l":
    case "L": {
      logging = !logging;
      break;
    }
  }
}

function log(text) {
  el("log").innerHTML += text + "\n";
  el("log").scrollTop = el("log").scrollHeight;
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

function loadBlarggTest(spc) {
  // create a SPC file for it:
  // normal header, SPC registers (PC at $430), file's data starting from $400 in ram,
  // DSP pretty much disabled
  let header = [
    0x53, 0x4E, 0x45, 0x53, 0x2D, 0x53, 0x50, 0x43, 0x37, 0x30, 0x30, 0x20, 0x53, 0x6F, 0x75, 0x6E,
    0x64, 0x20, 0x46, 0x69, 0x6C, 0x65, 0x20, 0x44, 0x61, 0x74, 0x61, 0x20, 0x76, 0x30, 0x2E, 0x33,
    0x30, 0x1A, 0x1A, 0x1A, 0x1E
  ];
  let final = new Uint8Array(0x10200);
  for(let i = 0; i < 37; i++) {
    final[i] = header[i];
  }
  final[0x25] = 0x30;
  final[0x26] = 0x04; // PC at $430
  for(let i = 0; i < spc.length; i++) {
    final[0x500 + i] = spc[i];
  }
  // leave all the rest at 0
  loadSpc(final);
}

function getBlarggResult() {
  // check the bytes at $8000-$8002
  // 0xde 0xb0 0x61
  if(player.apu.ram[0x8001] !== 0xde || player.apu.ram[0x8002] !== 0xb0 || player.apu.ram[0x8003] !== 0x61) {
    return "[SPCplayerJs ERROR]: Wrong $8001-$8003 bytes!\n";
  }
  let str = "[SPCplayerJs NOTE]: test ";
  str += player.apu.ram[0x8000] === 0x80 ? "busy!\n" : "done!\n";
  let i = 0x8004;
  while(true) {
    if(player.apu.ram[i] === 0) {
      break;
    }
    str += String.fromCharCode(player.apu.ram[i]);
    i++;
  }
  return str;
}
