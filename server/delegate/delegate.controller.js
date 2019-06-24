/**
 * Handler for delegates
 * @returns {Delegate}
 */

const { MathBN, tokenAmountInUnits } = require('../helpers/utils')
const BN = require('bn.js')
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
const getROI = async (req, res, next) => {
  const { address } = req.params
  const delegateService = getDelegateService()
  try {
    const rewards = await delegateService.getDelegateRewards(address)
    const totalStake = await delegateService.getDelegateTotalStake(address)
    let roi = null
    if (rewards && totalStake) {
      const totalReward = rewards.reduce((total, reward) => {
        // Removes the cases in which the rewardToken is null
        const rewardTokenAmount = reward.rewardTokens ? reward.rewardTokens : 0
        const amount = tokenAmountInUnits(rewardTokenAmount)
        return MathBN.add(total, amount)
      }, new BN(0))
      roi = MathBN.div(totalReward, totalStake)
    }

    res.json({ roi })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getByAddress,
  getROI
}
