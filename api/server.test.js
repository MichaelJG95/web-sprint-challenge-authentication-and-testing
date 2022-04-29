const request = require('supertest')
const server = require('./server')
const db = require('../data/dbConfig')
const bcrypt = require('bcryptjs')

beforeAll(async () => {
  await db.migrate.rollback()
  await db.migrate.latest()
})
beforeEach(async () => {
  await db('users').truncate();
    await db('users')
        .insert([
          {
            username: 'bob',
            password: '$2a$10$dFwWjD8hi8K2I9/Y65MWi.WU0qn9eAVaiBoRSShTvuJVGw8XpsCiq', // password "1234"
          },
          {
            username: 'sue',
            password: '$2a$10$dFwWjD8hi8K2I9/Y65MWi.WU0qn9eAVaiBoRSShTvuJVGw8XpsCiq', // password "1234"
          },
        ])
})
afterAll(async () => {
  await db.destroy()
})

it('[0] sanity check', () => {
  expect(true).not.toBe(false)
})

describe('server.js', () => {
  describe('[POST] /api/auth/login', () => {
    it('[1] responds with the correct message on valid credentials', async () => {
      const res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '1234' })
      expect(res.body.message).toMatch(/welcome, bob/i)
    }, 750)
    it('[2] responds with the correct status and message on invalid credentials', async () => {
      let res = await request(server).post('/api/auth/login').send({ username: 'bobsy', password: '1234' })
      expect(res.body.message).toMatch(/invalid credentials/i)
      expect(res.status).toBe(401)
      res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '12345' })
      expect(res.body.message).toMatch(/invalid credentials/i)
      expect(res.status).toBe(401)
    }, 750)
  })
  describe('[POST] /api/auth/register', () => {
    it('[3] creates a new user in the database', async () => {
      await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      const devon = await db('users').where('username', 'devon').first()
      expect(devon).toMatchObject({ username: 'devon' })
    }, 750)
    it('[4] saves the user with a bcrypted password instead of plain text', async () => {
      await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      const devon = await db('users').where('username', 'devon').first()
      expect(bcrypt.compareSync('1234', devon.password)).toBeTruthy()
    }, 750)
    it('[5] responds with the just created user', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: 'instructor' })
      expect(res.body).toMatchObject({ id: 3, username: 'devon' })
    }, 750)
    it('[6] responds with proper status on success', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      expect(res.status).toBe(201)
    }, 750)
  })
  describe('[GET] /api/jokes', () => {
    it('[7] requests without a token are bounced with proper status and message', async () => {
      const res = await request(server).get('/api/jokes')
      expect(res.body.message).toMatch(/token required/i)
    }, 750)
    it('[8] requests with an invalid token are bounced with proper status and message', async () => {
      const res = await request(server).get('/api/jokes').set('Authorization', 'foobar')
      expect(res.body.message).toMatch(/token invalid/i)
    }, 750)
    it('[9] requests with a valid token obtain a list of jokes', async () => {
      let res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '1234' })
      res = await request(server).get('/api/jokes').set('Authorization', res.body.token)
      expect(res.body).toMatchObject([
        {
          "id": "0189hNRf2g",
          "joke": "I'm tired of following my dreams. I'm just going to ask them where they are going and meet up with them later."
        },
        {
          "id": "08EQZ8EQukb",
          "joke": "Did you hear about the guy whose whole left side was cut off? He's all right now."
        },
        {
          "id": "08xHQCdx5Ed",
          "joke": "Why didn’t the skeleton cross the road? Because he had no guts."
        },
      ])
    }, 750)
  })
  describe('[GET] /api/users', () => {
    it('[10] requests obtain a list of users', async () => {
      const res = await request(server).get('/api/users')
      expect(res.body).toMatchObject([{ "id": 1, "username": "bob" }, { "id": 2, "username": "sue" }])
    }, 750)
  })
})
