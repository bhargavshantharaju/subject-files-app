jest.mock('../lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    storage: { from: jest.fn() }
  }
}));

const { supabaseAdmin } = require('../lib/supabaseAdmin');
const handler = require('../pages/api/signed-url').default;

function makeReq(body = {}) { return { method: 'POST', body }; }
function makeRes() { return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }; }

describe('POST /api/signed-url', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if path missing', async () => {
    const res = makeRes();
    await handler(makeReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns URL if success', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({ data: { signedUrl: 'https://x' } });
    supabaseAdmin.storage.from.mockReturnValue({ createSignedUrl });

    const req = makeReq({ path: 'a', expires: 60 });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ url: 'https://x' });
  });
});
