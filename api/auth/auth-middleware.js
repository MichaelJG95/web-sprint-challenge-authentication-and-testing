const User = require('../users/users-model')

const checkUsernameExists = async (req, res, next) => {
    try {
      const [user] = await User.findBy({ username: req.body.username })
      if (!user) {
        next({ status: 401, message: 'invalid credentials' })
      } else {
        req.user = user
        next()
      }
    } catch (err) {
      next(err)
    }
}

const validateInput = (req, res, next) => {
    if(!req.body.username || !req.body.password){
        res.status(401).json({ message: 'username and password required'})
        return
    }
    next()
}

module.exports = {
    checkUsernameExists,
    validateInput
  }
  