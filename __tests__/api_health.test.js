const handler = require('../pages/api/health').default;

function createMockReqRes() {
  const req = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return { req, res };
}

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
