import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export async function isClamAvailable() {
  try {
    await execAsync('clamscan --version');
    return true;
  } catch (err) {
    return false;
  }
}

export async function scanBufferWithClam(buffer) {
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `upload-scan-${Date.now()}`);
  await fs.promises.writeFile(tmpPath, buffer);
  try {
    // clamscan exits with code 0 if no virus found, 1 if virus found, >1 on error
    const { stdout, stderr } = await execAsync(`clamscan --no-summary "${tmpPath}"`);
    // stdout contains something like: '/tmp/upload-scan-...: OK' or '...: FOUND'
    if (/FOUND/.test(stdout)) return { infected: true, output: stdout };
    return { infected: false, output: stdout };
  } catch (err) {
    // If clamscan exits with code 1, it's an infection; stdout may be in err.stdout
    const stdout = err.stdout || '';
    if (/FOUND/.test(stdout)) return { infected: true, output: stdout };
    // Unexpected error
    throw err;
  } finally {
    // cleanup
    try { await fs.promises.unlink(tmpPath); } catch (e) { /* ignore */ }
  }
}

export async function scanBuffer(buffer) {
  const available = await isClamAvailable();
  if (!available) {
    // Clam not available; fallback: if environment variable REQUIRE_SCAN is set, throw error
    if (process.env.REQUIRE_SCAN === 'true') {
      throw new Error('ClamAV not available on server and scanning is required');
    }
    // Otherwise, log and return not infected (best effort)
    console.warn('ClamAV not available - skipping scan (configure ClamAV for real scanning)');
    return { infected: false, output: 'skipped' };
  }

  return await scanBufferWithClam(buffer);
}
