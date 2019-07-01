/**
 * Handler for delegators
 * @returns {Delegator}
 */

const { getDelegatorService } = require('../helpers/services/delegatorService')

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

module.exports = {
  getNextReward
}