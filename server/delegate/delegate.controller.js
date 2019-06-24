/**
 * Activate subscriber.
 * @returns {Subscriber}
 */

const { getTopDelegates } = require('../../server/helpers/delegate')

const { getDelegate } = require('../helpers/graphql/delegate')

const getByAddress = async (req, res, next) => {
  const { address } = req.params
  try {
    const result = await getDelegate(address)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

const topDelegates = async (req, res, next) => {
  const { number = null } = req.params
  let result = null
  try {
    result = await getTopDelegates(number)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getByAddress,
  topDelegates
}
