const { client } = require('../apolloClient')
const gql = require('graphql-tag')

const { calculateMissedRewardCalls, tokenAmountInUnits } = require('../../utils')
const { getCurrentRound } = require('../protocol')

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
  const last30MissedRewardCalls = await getMissedRewardCalls(delegateAddress)
  return {
    summary: {
      ...summary,
      totalStake: summary.totalStake ? tokenAmountInUnits(summary.totalStake) : null,
      last30MissedRewardCalls
    }
  }
}

// Returns all the delegates registered as transcoders which have reward tokens
const getRegisteredDelegates = async () => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoders(where: { totalStake_gt: 0, status: "Registered", id_not: null }) {
          id
          totalStake
          rewards {
            id
            rewardTokens
          }
        }
      }
    `
  })
  return queryResult.data && queryResult.data.transcoders ? queryResult.data.transcoders : []
}

// Returns the amount of tokens rewards on each round for the given delegate
const getDelegateRewards = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        rewards(
        where: { transcoder: "${delegateAddress}" }
        orderBy: id, orderDirection: desc) {
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

const getMissedRewardCalls = async delegateAddress => {
  let missedCalls = 0
  const rewards = await getDelegateRewards(delegateAddress)
  const currentRound = await getCurrentRound()

  if (rewards) {
    missedCalls = calculateMissedRewardCalls(rewards, currentRound)
  }
  return missedCalls
}

module.exports = {
  getDelegate,
  getDelegateRewards,
  getDelegateTotalStake,
  getMissedRewardCalls,
  getDelegateSummary,
  getRegisteredDelegates
}
