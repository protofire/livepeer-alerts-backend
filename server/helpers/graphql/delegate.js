const {
  getMintedTokensForNextRound,
  getTotalBonded,
  getLivepeerDelegatorAccount
} = require('../livepeerAPI')
const {
  calculateMissedRewardCalls,
  calculateDelegateNextReward,
  calculateDelegateNextProtocolReward,
  calculateParticipationInTotalBondedRatio,
  calculateDelegateNextRewardToDelegators,
  calculateDelegatorNextReturn
} = require('../utils')

const { getCurrentRound } = require('./protocol')

const { client } = require('./apolloClient')
const gql = require('graphql-tag')
const BN = require('bn.js')
const { MathBN, tokenAmountInUnits } = require('../utils')

const { PROTOCOL_DIVISION_BASE } = require('../../../config/constants')

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

// Returns the delegate summary plus the missed reward calls
const getDelegate = async delegateAddress => {
  const summary = await getDelegateSummary(delegateAddress)
  const last30MissedRewardCalls = await getMissedRewardCalls(delegateAddress)
  return {
    summary: {
      ...summary,
      totalStake: summary && summary.totalStake ? tokenAmountInUnits(summary.totalStake) : null,
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

// Receives a delegateAddress and returns the TOTAL reward (protocol reward, no the reward cut) of that delegate for the next round
const getDelegateProtocolNextReward = async delegateAddress => {
  // FORMULA: mintedTokensForNextRound * delegateParticipationInTotalBonded
  let [summary, mintedTokensForNextRound, totalBondedInProtocol] = await Promise.all([
    getDelegateSummary(delegateAddress),
    getMintedTokensForNextRound(),
    getTotalBonded()
  ])
  const { totalStake } = summary
  const participationInTotalBondedRatio = calculateParticipationInTotalBondedRatio(
    totalStake,
    totalBondedInProtocol
  )
  return calculateDelegateNextProtocolReward(
    mintedTokensForNextRound,
    participationInTotalBondedRatio
  )
}

// Receives a delegateAddress and returns the REAL reward of the delegate (nextReward*rewardCut)
const getDelegateNextReward = async delegateAddress => {
  // DelegateReward = DelegateProtocolNextReward * rewardCut
  let [summary, protocolNextReward] = await Promise.all([
    getDelegateSummary(delegateAddress),
    getDelegateProtocolNextReward(delegateAddress)
  ])
  const { pendingRewardCut } = summary
  const rewardCut = MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
  return calculateDelegateNextReward(protocolNextReward, rewardCut)
}

// For a given delegateAddress return the next reward that will be distributed towards delegators
const getDelegateRewardToDelegators = async delegateAddress => {
  // DelegateRewardToDelegators = DelegateProtocolNextReward - DelegateProtocolNextReward * rewardCut
  let [summary, protocolNextReward] = await Promise.all([
    getDelegateSummary(delegateAddress),
    getDelegateProtocolNextReward(delegateAddress)
  ])
  const { pendingRewardCut } = summary
  const rewardCut = MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
  return calculateDelegateNextRewardToDelegators(protocolNextReward, rewardCut)
}

// For a given delegatorAddress, returns the next round reward if exists
const getDelegatorNextReturn = async delegatorAddress => {
  const delegator = await getLivepeerDelegatorAccount(delegatorAddress)
  const { delegateAddress, bondedAmount } = delegator
  const delegateTotalStake = await getDelegateTotalStake(delegateAddress)
  const delegatorParticipationInTotalStake = calculateParticipationInTotalBondedRatio(
    bondedAmount,
    delegateTotalStake
  )
  const rewardToDelegators = await getDelegateRewardToDelegators(delegateAddress)
  return calculateDelegatorNextReturn(rewardToDelegators, delegatorParticipationInTotalStake)
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
  getMissedRewardCalls
}
