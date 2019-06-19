/**
 * Activate subscriber.
 * @returns {Subscriber}
 */

const utils = require('../helpers/utils')
const BN = require('bn.js')
const { getDelegate, getDelegateRewards, getDelegateTotalStake } = require('../helpers/graphql/queries/delegate')

const getByAddress = async (req, res, next) => {
  const { address } = req.params
  try {
    const result = await getDelegate(address)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
const delegateRoi = async (req, res, next) => {
  const { address } = req.params
  try {
    const rewards = await getDelegateRewards(address)
    const totalStake = await getDelegateTotalStake(address)
    let result = null
    if (rewards && totalStake) {
      const totalReward = rewards.reduce((total, reward) => {
        // Removes the cases in which the rewardToken is null
        const rewardTokenAmount = reward.rewardTokens ? reward.rewardTokens : 0
        const amount = utils.tokenAmountInUnits(rewardTokenAmount)
        return utils.MathBN.add(total, amount)
      }, new BN(0))
      result = utils.MathBN.div(totalReward, totalStake)
    }

    res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getByAddress,
  delegateRoi
}
