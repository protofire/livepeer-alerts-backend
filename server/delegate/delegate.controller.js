/**
 * Activate subscriber.
 * @returns {Subscriber}
 */

const { getDelegate, getDelegateRoi, getTopDelegates } = require('../helpers/graphql/delegate')

const delegateByAddress = async (req, res, next) => {
  const { address = null } = req.params
  let result = null
  try {
    result = await getDelegate(address)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

const delegateRoi = async (req, res, next) => {
  const { address = null } = req.params
  let result = null
  try {
    result = await getDelegateRoi(address)
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
  delegateByAddress,
  delegateRoi,
  topDelegates
}
