import {
  V5SerialDevice,
  ProgramIniConfig,
} from "../../dist/v5-serial-protocol.es.js";

const logEl = document.getElementById("log");
const connectBtn = document.getElementById("connect-btn");
const uploadBtn = document.getElementById("upload-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const basenameInput = document.getElementById("basename");
const slotInput = document.getElementById("slot");
const autorunInput = document.getElementById("autorun");
const binFileInput = document.getElementById("bin-file");
const coldFileInput = document.getElementById("cold-file");
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");

let device;
function appendLog(msg) {
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

connectBtn.addEventListener("click", async () => {
  try {
    device = new V5SerialDevice(navigator.serial);
    appendLog("Connecting to device...");
    const ok = await device.connect();
    if (!ok) {
      appendLog("Connect cancelled or failed");
      return;
    }
    appendLog("Connected");
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    uploadBtn.disabled = false;
  } catch (e) {
    appendLog("Connect error: " + e);
  }
});

disconnectBtn.addEventListener("click", async () => {
  if (!device) return;
  await device.disconnect();
  appendLog("Disconnected");
  connectBtn.disabled = false;
  disconnectBtn.disabled = true;
  uploadBtn.disabled = true;
});

function readFileAsUint8(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(new Uint8Array(fr.result));
    fr.onerror = rej;
    fr.readAsArrayBuffer(file);
  });
}

uploadBtn.addEventListener("click", async () => {
  if (!device || !device.isConnected) {
    appendLog("Not connected");
    return;
  }
  const binFile = binFileInput.files[0];
  if (!binFile) {
    appendLog("Select a .bin file");
    return;
  }

  appendLog("Reading .bin file...");
  const binBuf = await readFileAsUint8(binFile);

  let coldBuf = undefined;
  if (coldFileInput.files[0]) {
    appendLog("Reading cold/lib file...");
    coldBuf = await readFileAsUint8(coldFileInput.files[0]);
  }

  // Build INI using ProgramIniConfig (always generate here)
  const ini = new ProgramIniConfig();
  ini.autorun = autorunInput.checked;
  ini.baseName = basenameInput.value || "slot_" + slotInput.value;
  ini.program.name = "Web Upload";
  ini.program.slot = Number(slotInput.value) - 1;
  ini.program.icon = "USER902x.bmp";
  ini.program.description = "Uploaded via web";

  appendLog("Starting upload...");
  uploadBtn.disabled = true;

  try {
    const isDone = await device.brain.uploadProgram(
      ini,
      binBuf,
      coldBuf,
      (state, current, total) => {
        progressLabel.textContent = state + " " + current + "/" + total;
        const pct = total ? Math.round((current / total) * 100) : 0;
        progressBar.style.width = pct + "%";
      },
    );
    progressBar.style.width = "100%";
  } catch (e) {
    appendLog("Upload failed: " + e);
  } finally {
    uploadBtn.disabled = false;
  }
});

appendLog("Web uploader ready");
