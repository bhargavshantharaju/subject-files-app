jest.mock('../lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn()
  }
}));

jest.mock('../lib/virusScanner', () => ({
  scanBuffer: jest.fn()
}));

const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { scanBuffer } = require('../lib/virusScanner');
const handler = require('../pages/api/record-file').default;

function makeReq(body = {}, headers = {}) {
  return { method: 'POST', body, headers };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('POST /api/record-file', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 if no token', async () => {
    const req = makeReq({});
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 if token invalid', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ error: { message: 'bad token' } });
    const req = makeReq({}, { authorization: 'Bearer bad' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 if subject missing', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    supabaseAdmin.from.mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null }) });

    const req = makeReq({ path: 'a' }, { authorization: 'Bearer tok' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Subject not found' }));
  });

  it('rejects infected file', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    // mock subject exists
    const selectMock = jest.fn().mockReturnThis();
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 's1' } });
    supabaseAdmin.from.mockReturnValue({ select: selectMock, eq: jest.fn().mockReturnThis(), maybeSingle });

    // mock download
    const arrayBuffer = async () => new Uint8Array([1,2,3]).buffer;
    supabaseAdmin.storage = { from: jest.fn().mockReturnValue({ download: jest.fn().mockResolvedValue({ data: { arrayBuffer } }) }) };

    scanBuffer.mockResolvedValue({ infected: true, output: 'EICAR FOUND' });

    const req = makeReq({ subject_id: 's1', path: 'p' }, { authorization: 'Bearer tok' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'File infected – upload rejected' }));
  });

  it('inserts metadata when file clean', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 's1' } });
    const insert = jest.fn().mockResolvedValue({ data: [{ id: 'f1' }] });
    supabaseAdmin.from.mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle, insert });

    const arrayBuffer = async () => new Uint8Array([1,2,3]).buffer;
    supabaseAdmin.storage = { from: jest.fn().mockReturnValue({ download: jest.fn().mockResolvedValue({ data: { arrayBuffer } }) }) };

    scanBuffer.mockResolvedValue({ infected: false, output: 'OK' });

    const req = makeReq({ subject_id: 's1', path: 'p', name: 'file.txt', size: 10, content_type: 'text/plain' }, { authorization: 'Bearer tok' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.anything() }));
  });
});
