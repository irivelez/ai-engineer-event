#!/usr/bin/env node
// Run several QA commands under ONE browser-lock acquisition (they run serially; each still opens and closes
// its own browser). Usage:
//   node scripts/with-lock.mjs "node scripts/smoke.mjs" "node scripts/fps.mjs --moments factory"
import { spawnSync } from 'node:child_process';
import { acquireLock, lockPath } from './lib/browser.mjs';

const cmds = process.argv.slice(2);
if (!cmds.length) { console.log('usage: node scripts/with-lock.mjs "<cmd>" ["<cmd>" …]'); process.exit(1); }
const release = await acquireLock();
const onSig = () => { release(); process.exit(130); };
process.on('SIGINT', onSig);
process.on('SIGTERM', onSig);
let code = 0;
try {
  for (const c of cmds) {
    console.log(`\n$ ${c}   (lock ${lockPath()})`);
    const r = spawnSync(c, { shell: true, stdio: 'inherit', env: { ...process.env, ITAF_LOCK_HELD: '1' } });
    if (r.status) code = r.status;
  }
} finally {
  release();
}
process.exit(code);
