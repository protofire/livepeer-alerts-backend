/**
 * Handler for delegators
 * @returns {Delegator}
 */

const { getDelegatorService } = require('../helpers/services/delegatorService')
const delegatorUtils = require('../helpers/delegatorUtils')

// Return the next-round-reward
const getNextReward = async (req, res, next) => {
  const { address } = req.params
  try {
    const delegatorService = getDelegatorService()
    const nextReward = await delegatorService.getDelegatorNextReward(address)
    res.json({ nextReward })
  } catch (error) {
    next(error)
  }
}

const getDelegator = async (req, res, next) => {
  const { address } = req.params
  try {
    const delegatorService = getDelegatorService()
    const delegator = await delegatorService.getDelegatorAccount(address)
    res.json({ delegator })
  } catch (error) {
    next(error)
  }
}

const getSummary30RoundsRewards = async (req, res, next) => {
  const { address } = req.params
  try {
    const summary = await delegatorUtils.getSummary30RoundsRewards(address)
    res.json({ summary })
  } catch (error) {
    next(error)
  }
}
module.exports = {
  getNextReward,
  getDelegator,
  getSummary30RoundsRewards
}
