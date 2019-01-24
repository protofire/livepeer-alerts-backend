const Telegram = require('./telegram.model')

/**
 * Get telegram list.
 * @property {number} req.query.skip - Number of earnings to be skipped.
 * @property {number} req.query.limit - Limit number of earnings to be returned.
 * @returns {Telegram[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query
  Telegram.list({ limit, skip })
    .then(telegrams => res.json(telegrams))
    .catch(e => next(e))
}

module.exports = {
  list
}
