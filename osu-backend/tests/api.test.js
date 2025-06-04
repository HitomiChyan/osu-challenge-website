const request = require('supertest');
const bcrypt = require('bcrypt');

jest.mock('fs');
const fs = require('fs');
fs.readFileSync.mockImplementation(() => {
  const admins = [
    {
      username: 'testadmin',
      role: 'full',
      passwordHash: bcrypt.hashSync('secret', 10)
    }
  ];
  return JSON.stringify({ admins });
});

const app = require('../app');

describe('API endpoints', () => {
  let agent;

  beforeEach(() => {
    agent = request.agent(app);
  });

  test('successful login sets a session cookie', async () => {
    const res = await agent
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('unauthenticated requests receive 401', async () => {
    const res1 = await request(app)
      .post('/api/registrations')
      .send({});
    expect(res1.status).toBe(401);

    const res2 = await request(app)
      .post('/api/nonchallengers')
      .send({});
    expect(res2.status).toBe(401);
  });

  test('creating a registration returns expected status and fields', async () => {
    await agent
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'secret' });

    const body = {
      activityName: 'test',
      twitchName: 'abc',
      twitchID: '123',
      osuID: 'osu1',
      rank: '5Digit',
      time: '2023-01-01',
      results: ['挑戰失敗', '挑戰失敗', '挑戰失敗'],
      manualTickets: 1
    };
    const res = await agent.post('/api/registrations').send(body);
    expect(res.status).toBe(200);
    expect(res.body.insertedId).toBeDefined();
    expect(res.body.message).toBeDefined();
  });

  test('creating a nonchallenger returns expected status and fields', async () => {
    await agent
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'secret' });

    const body = {
      activityName: 'test',
      twitchName: 'abc',
      twitchID: '123',
      manualTickets: 2
    };
    const res = await agent.post('/api/nonchallengers').send(body);
    expect(res.status).toBe(200);
    expect(res.body.insertedId).toBeDefined();
    expect(res.body.message).toBeDefined();
  });
});
