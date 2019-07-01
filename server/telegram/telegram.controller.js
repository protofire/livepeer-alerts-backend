const Telegram = require('../models/telegram.model')

/**
 * Get telegram list.
 * @property {number} req.query.skip - Number of earnings to be skipped.
 * @property {number} req.query.limit - Limit number of earnings to be returned.
 * @returns {Telegram[]}
 */
const list = (req, res, next) => {
  const { limit = 50, skip = 0 } = req.query
  Telegram.list({ limit, skip })
    .then(telegrams => res.json(telegrams))
    .catch(e => next(e))
}

/**
 * Load telegrams by address and append to req.
 */
const loadByAddress = (req, res, next, address) => {
  Telegram.getTelegramsByAddress(address)
    .then(telegrams => {
      req.telegrams = telegrams // eslint-disable-line no-param-reassign
      return next()
    })
    .catch(e => next(e))
}

const remove = (req, res, next) => {
  const { telegrams } = req
  telegrams.forEach(async telegram => {
    await Telegram.remove()
  })

  res.json(telegrams)
}

module.exports = {
  list,
  loadByAddress,
  remove
}
