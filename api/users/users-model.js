const db = require('../../data/dbConfig.js');

function find() {
  return db('users')
    .select('id', 'username',)
}

function findBy(filter) {
      return db('users')
      .select('id', 'username', 'password')
      .where(filter)
  }

function findById(id) {
    return db('users')
    .select('id', 'username', 'password')
    .where('users.id', id).first()
}

async function add({ username, password}) {
  let created_user_id
  await db.transaction(async trx => {
    const [user_id] = await trx('users').insert({ username, password })
    created_user_id = user_id
  })
  return findById(created_user_id)
}

module.exports = {
  add,
  find,
  findBy,
  findById,
};