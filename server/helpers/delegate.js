const _ = require('lodash')

const { tokenAmountInUnits } = require('./utils')

const { PROTOCOL_DIVISION_BASE } = require('../../config/constants')

const { calculateMissedRewardCalls, MathBN } = require('./utils')

const { getCurrentRound } = require('./graphql/queries/protocol')

const {
  getMintedTokensForNextRound,
  getLivepeerDelegatorAccount,
  getTotalBonded
} = require('./livepeerAPI')

const {
  getDelegateSummary,
  getDelegateTotalStake,
  getDelegateRewards,
  getRegisteredDelegates
} = require('./graphql/queries/delegate')

// Returns the delegate summary plus the missed reward calls
const getDelegate = async delegateAddress => {
  const summary = await getDelegateSummary(delegateAddress)
  const last30MissedRewardCalls = await getMissedRewardCalls(delegateAddress)
  return {
    summary: {
      ...summary,
      totalStake: tokenAmountInUnits(_.get(summary, 'totalStake', 0)),
      last30MissedRewardCalls
    }
  }
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
  // FORMULA: delegateTotalStake / protocolTotalBonded
  const participationInTotalBondedRatio = MathBN.div(totalStake, totalBondedInProtocol)

  return MathBN.mul(mintedTokensForNextRound, participationInTotalBondedRatio)
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
  return MathBN.mul(protocolNextReward, rewardCut)
}

// For a given delegateAddress return the next reward that will be distributed towards delegators
const getDelegateRewardToDelegators = async delegateAddress => {
  // FORMULA: DelegateRewardToDelegators = DelegateProtocolNextReward - DelegateProtocolNextReward * rewardCut
  let [summary, protocolNextReward] = await Promise.all([
    getDelegateSummary(delegateAddress),
    getDelegateProtocolNextReward(delegateAddress)
  ])
  const { pendingRewardCut } = summary
  const rewardCut = MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
  const rewardToDelegate = MathBN.mul(protocolNextReward, rewardCut)
  return MathBN.sub(protocolNextReward, rewardToDelegate)
}

// For a given delegatorAddress, returns the next round reward if exists
const getDelegatorNextReturn = async delegatorAddress => {
  // FORMULA: rewardToDelegators * delegatorParticipationInTotalStake
  const delegator = await getLivepeerDelegatorAccount(delegatorAddress)
  const { delegateAddress, totalStake } = delegator
  const delegateTotalStake = await getDelegateTotalStake(delegateAddress)
  // FORMULA: delegateTotalStake / totalStake
  const delegatorParticipationInTotalStake = MathBN.div(delegateTotalStake, totalStake)
  const rewardToDelegators = await getDelegateRewardToDelegators(delegateAddress)
  return MathBN.mul(rewardToDelegators, delegatorParticipationInTotalStake)
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

const getTopDelegates = async topNumber => {
  let topDelegates = []
  const delegates = await getRegisteredDelegates()
  for (delegateIterator of delegates) {
    const roi = await getDelegateNextReward(delegateIterator.address)
    topDelegates.push({
      id: delegateIterator.id,
      totalStake: delegateIterator.totalStake,
      roi
    })
  }
  // Sorts in ROI descending order
  topDelegates.sort((a, b) => {
    const bBn = MathBN.toBig(b.roi)
    return bBn.sub(a)
  })
  return topDelegates.slice(0, topNumber)
}

module.exports = {
  getDelegate,
  getDelegateProtocolNextReward,
  getDelegateNextReward,
  getDelegateRewardToDelegators,
  getDelegatorNextReturn,
  getMissedRewardCalls,
  getTopDelegates
}
