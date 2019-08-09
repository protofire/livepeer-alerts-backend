/**
 * Handler for delegates
 * @returns {Delegate}
 */

const { getDelegateService } = require('../helpers/services/delegateService')

const getByAddress = async (req, res, next) => {
  const { address } = req.params
  const delegateService = getDelegateService()
  try {
    const result = await delegateService.getDelegateSummary(address)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

const topDelegates = async (req, res, next) => {
  const { number } = req.params
  try {
    const delegateService = getDelegateService()
    let result = await delegateService.getTopDelegates(number)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

const getDelegateRewardStatus = async (req, res, next) => {
  const { address } = req.params
  try {
    const delegateService = getDelegateService()
    const summary = await delegateService.getDelegateRewardStatus(address)
    res.json({ summary })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getByAddress,
  topDelegates,
  getDelegateRewardStatus
}
