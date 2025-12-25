const { scanBuffer, isClamAvailable } = require('../lib/virusScanner');

// EICAR test string
const eicar = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');

describe('virusScanner e2e with ClamAV', () => {
  it('detects EICAR as infected when clamscan is available', async () => {
    const available = await isClamAvailable();
    if (!available) return console.warn('ClamAV not available; skipping e2e test');

    const result = await scanBuffer(eicar);
    expect(result.infected).toBe(true);
    expect(result.output).toEqual(expect.stringContaining('FOUND'));
  }, 20000);
});
