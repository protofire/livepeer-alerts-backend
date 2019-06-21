const _ = require('lodash')
const { MathBN } = require('../../server/helpers/utils')
const { tokenAmountInUnits } = require('./utils')

const { PROTOCOL_DIVISION_BASE } = require('../../config/constants')

const { calculateMissedRewardCalls } = require('./utils')

const { getCurrentRound } = require('./graphql/queries/protocol')

let delegateServiceInstance
const defaultDelegateSource = require('./graphql/queries/delegate')
const defaultProtocolSource = require('./livepeerAPI')

const getDelegateService = (
  delegateSource = defaultDelegateSource,
  protocolSource = defaultProtocolSource
) => {
  if (!delegateServiceInstance) {
    delegateServiceInstance = new DelegateService(delegateSource, protocolSource)
  }
  return delegateServiceInstance
}

class DelegateService {
  constructor(delegateDataSource, protocolDataSource) {
    this.delegateSource = delegateDataSource
    this.protocolSource = protocolDataSource
  }

  // Returns the delegate summary plus the missed reward calls
  async getDelegate(delegateAddress) {
    const { getDelegateSummary } = this.delegateSource
    const summary = await getDelegateSummary(delegateAddress)
    const last30MissedRewardCalls = await this.getMissedRewardCalls(delegateAddress)
    return {
      summary: {
        ...summary,
        totalStake: tokenAmountInUnits(_.get(summary, 'totalStake', 0)),
        last30MissedRewardCalls
      }
    }
  }

  // Receives a delegateAddress and returns the TOTAL reward (protocol reward, no the reward cut) of that delegate for the next round
  async getDelegateProtocolNextReward(delegateAddress) {
    const { getDelegateSummary } = this.delegateSource
    const { getMintedTokensForNextRound, getTotalBonded } = this.protocolSource
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
  async getDelegateNextReward(delegateAddress) {
    const { getDelegateSummary, getDelegateProtocolNextReward } = this.delegateSource
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
  async getDelegateRewardToDelegators(delegateAddress) {
    const { getDelegateSummary, getDelegateProtocolNextReward } = this.delegateSource
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
  async getDelegatorNextReturn(delegatorAddress) {
    const { getLivepeerDelegatorAccount } = this.protocolSource
    const { getDelegateTotalStake, getDelegateRewardToDelegators } = this.delegateSource
    // FORMULA: rewardToDelegators * delegatorParticipationInTotalStake
    const delegator = await getLivepeerDelegatorAccount(delegatorAddress)
    const { delegateAddress, totalStake } = delegator
    const delegateTotalStake = await getDelegateTotalStake(delegateAddress)
    // FORMULA: delegateTotalStake / totalStake
    const delegatorParticipationInTotalStake = MathBN.div(delegateTotalStake, totalStake)
    const rewardToDelegators = await getDelegateRewardToDelegators(delegateAddress)
    return MathBN.mul(rewardToDelegators, delegatorParticipationInTotalStake)
  }

  async getMissedRewardCalls(delegateAddress) {
    const { getDelegateRewards } = this.delegateSource
    let missedCalls = 0
    const rewards = await getDelegateRewards(delegateAddress)
    const currentRound = await getCurrentRound()

    if (rewards) {
      missedCalls = calculateMissedRewardCalls(rewards, currentRound)
    }
    return missedCalls
  }
}

module.exports = {
  getDelegateService
}
