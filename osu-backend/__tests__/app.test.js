const request = require('supertest');
const fs = require('fs');
const bcrypt = require('bcrypt');

jest.mock('fs');
jest.mock('bcrypt');
jest.mock('../dbConnect');

const getDb = require('../dbConnect');

beforeEach(() => {
  fs.readFileSync.mockReturnValue(JSON.stringify({
    admins: [{ username: 'admin', role: 'full', passwordHash: 'hash' }]
  }));
  bcrypt.compare.mockResolvedValue(true);
  getDb.mockResolvedValue({
    collection: () => ({
      insertOne: jest.fn().mockResolvedValue({ insertedId: '1' })
    })
  });
  jest.resetModules();
});

describe('app routes', () => {
  let app;
  beforeEach(() => {
    app = require('../app');
  });

  test('successful login', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: '登入成功', role: 'full' });
  });

  test('registration creation', async () => {
    const agent = request.agent(app);
    await agent.post('/api/admin/login')
      .send({ username: 'admin', password: 'secret' });

    const res = await agent.post('/api/registrations')
      .send({
        activityName: 'act',
        twitchName: 'tw',
        twitchID: '1',
        osuID: 'osu',
        rank: '3Digit',
        time: '2025-01-01',
        results: ['FC', 'FC', 'FC']
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('insertedId');
  });
});
