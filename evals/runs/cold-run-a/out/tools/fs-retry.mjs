// The fixture filesystem sometimes returns ENOTEMPTY while Chrome's killed
// children finish writing their profile. Add Node's standard cleanup retries;
// leave the skill files and all scoring logic untouched.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const remove = fs.rmSync;
fs.rmSync = (path, options) => {
  for (let attempt = 0; ; attempt++) {
    try { return remove(path, { maxRetries: 2, retryDelay: 50, ...options }); }
    catch (error) {
      // Retry the whole traversal so newly visible profile files are enumerated.
      if (!String(path).includes('/out/.tmp/') || attempt >= 8 || !['ENOTEMPTY','EBUSY'].includes(error.code)) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
};
syncBuiltinESMExports();
