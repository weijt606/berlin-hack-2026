import axios from 'axios';

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await axios.get(`/api/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(typeof res.data.timestamp).toBe('string');
  });
});
