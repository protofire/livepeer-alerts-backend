const { getCurrentRound } = require('./protocol')

const { client } = require('./apolloClient')
const gql = require('graphql-tag')
const BN = require('bn.js')
const { MathBN, tokenAmountInUnits } = require('../utils')

// Returns the delegate summary, does not include rewards, ROI, missed reward calls or any calculated data
const getDelegateSummary = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoder(id: "${delegateAddress}") {
          id,
          active,
          ensName,
          status,
          lastRewardRound,
          rewardCut,
          feeShare,
          pricePerSegment,
          pendingRewardCut,
          pendingFeeShare,
          pendingPricePerSegment,
          totalStake
        }
      }
    `
  })
  return queryResult.data && queryResult.data.transcoder ? queryResult.data.transcoder : null
}

// Returns the delegate summary plus the ROI and missed reward calls
const getDelegate = async delegateAddress => {
  const summary = await getDelegateSummary(delegateAddress)
  const roi = await getDelegateRoi(delegateAddress)
  const last30MissedRewardCalls = await getMissedRewardCalls(delegateAddress)
  return {
    summary: {
      ...summary,
      totalStake: summary.totalStake ? tokenAmountInUnits(summary.totalStake) : null,
      roi,
      last30MissedRewardCalls
    }
  }
}

// Returns the amount of tokens rewards on each round for the given delegate
const getDelegateRewards = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        rewards(where: { transcoder: "${delegateAddress}" }) {
          rewardTokens
          round {
            id
          }
        }
      }
    `
  })
  return queryResult.data && queryResult.data.rewards ? queryResult.data.rewards : null
}

const getDelegateTotalStake = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoder(id: "${delegateAddress}") {
          totalStake
        }
      }
    `
  })
  return queryResult.data && queryResult.data.transcoder && queryResult.data.transcoder.totalStake
    ? queryResult.data.transcoder.totalStake
    : null
}

const getDelegateRoi = async delegateAddress => {
  const rewards = await getDelegateRewards(delegateAddress)
  const totalStake = await getDelegateTotalStake(delegateAddress)
  if (!rewards && !totalStake) {
    return null
  } else {
    const totalReward = rewards.reduce((total, reward) => {
      // Removes the cases in which the rewardToken is null
      const rewardTokenAmount = reward.rewardTokens ? reward.rewardTokens : 0
      const amount = tokenAmountInUnits(rewardTokenAmount)
      return MathBN.add(total, amount)
    }, new BN(0))
    return MathBN.div(totalReward, totalStake)
  }
}

const getMissedRewardCalls = async delegateAddress => {
  let missedCalls = 0
  const rewards = await getDelegateRewards(delegateAddress)
  const currentRound = await getCurrentRound()

  if (rewards) {
    missedCalls = rewards
      .sort((a, b) => b.round.id - a.round.id)
      .filter(
        reward =>
          reward.rewardTokens === null &&
          reward.round.id >= currentRound.id - 30 &&
          reward.round.id !== currentRound.id
      ).length
  }
  return missedCalls
}

module.exports = {
  getDelegate,
  getDelegateRewards,
  getDelegateTotalStake,
  getDelegateRoi,
  getMissedRewardCalls
}
