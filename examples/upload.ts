import { serial } from "node-web-serial-ponyfill";
import {
  ProgramIniConfig,
  V5SerialDevice,
  type ZerobaseSlotNumber,
} from "../src";

import fs from "fs";

function toUint8(b: Buffer): Uint8Array {
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return new Uint8Array(ab);
}

void (async function () {
  const device = new V5SerialDevice(serial);

  await device.connect();

  const slot = 2;
  const bin = toUint8(
    fs.readFileSync("./examples/pros-demo-program/hot.package.bin"),
  );
  const cold = toUint8(
    fs.readFileSync("./examples/pros-demo-program/cold.package.bin"),
  );

  const ini = new ProgramIniConfig();
  ini.autorun = true;
  ini.baseName = "slot_" + slot;
  ini.program.name = "PROS Demo";
  ini.program.slot = (slot - 1) as ZerobaseSlotNumber;
  ini.program.icon = "USER902x.bmp";
  ini.program.description = "Demo";

  const onProgress = (state: string, current: number, total: number): void => {
    console.log(state, current, total);
  };

  const isDone = await device.brain.uploadProgram(ini, bin, cold, onProgress);
  console.log("done", isDone);
})();
