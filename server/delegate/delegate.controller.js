/**
 * Activate subscriber.
 * @returns {Subscriber}
 */

const utils = require('../helpers/utils')
const graphqlDelegate = require('../helpers/graphql/delegate')
const BN = require('bn.js')

const delegateByAddress = async (req, res, next) => {
  const { address = null } = req.params
}

const delegateRoi = async (req, res, next) => {
  const { address = null } = req.params
  let result = null
  try {
    const rewards = await graphqlDelegate.getTranscoderRewards(address)
    const totalStake = await graphqlDelegate.getTranscoderTotalStake(address)

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
  delegateByAddress,
  delegateRoi
}
