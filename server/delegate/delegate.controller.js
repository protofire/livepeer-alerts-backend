/**
 * Activate subscriber.
 * @returns {Subscriber}
 */

const { getDelegate } = require('../helpers/graphql/queries/delegate')

const getByAddress = async (req, res, next) => {
  const { address } = req.params
  console.log('asdasdas')
  try {
    const result = await getDelegate(address)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getByAddress
}
