/**
 * Handler for delegates
 * @returns {Delegate}
 */

const { getTopDelegates } = require('../../server/helpers/delegate')
const { getDelegateService } = require('../helpers/services/delegateService')

const getByAddress = async (req, res, next) => {
  const { address } = req.params
  const delegateService = getDelegateService()
  try {
    const result = await delegateService.getDelegate(address)
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
