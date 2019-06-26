const { getProtocolService } = require('./protocolService')

const _ = require('lodash')
const { MathBN } = require('../utils')
const { tokenAmountInUnits, unitAmountInTokenUnits } = require('../utils')

const { PROTOCOL_DIVISION_BASE } = require('../../../config/constants')

const { calculateMissedRewardCalls } = require('../utils')
const promiseRetry = require('promise-retry')

let delegateServiceInstance
const delegatesSource = require('../graphql/queries') // the default source for delegates is GRAPHQL

const getDelegateService = (source = delegatesSource) => {
  if (!delegateServiceInstance) {
    delegateServiceInstance = new DelegateService(source)
  }
  return delegateServiceInstance
}

class DelegateService {
  constructor(source) {
    this.source = source
  }

  // Returns the delegate summary plus the missed reward calls, nextReward, nextDelegateReward, rewardToDelegators
  getDelegate = async delegateAddress => {
    const { getDelegateSummary } = this.source
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
  getDelegateProtocolNextReward = async delegateAddress => {
    const { getDelegateSummary } = this.source
    const protocolService = getProtocolService()
    const { getMintedTokensForNextRound, getTotalBonded } = protocolService
    // FORMULA: mintedTokensForNextRound * delegateParticipationInTotalBonded

    let [summary, mintedTokensForNextRound, totalBondedInProtocol] = await promiseRetry(retry => {
      return Promise.all([
        getDelegateSummary(delegateAddress),
        getMintedTokensForNextRound(),
        getTotalBonded()
      ]).catch(err => retry())
    })

    const { totalStake } = summary
    // FORMULA: delegateTotalStake / protocolTotalBonded
    const participationInTotalBondedRatio = MathBN.div(totalStake, totalBondedInProtocol)
    return MathBN.mul(mintedTokensForNextRound, participationInTotalBondedRatio)
  }

  // Receives a delegateAddress and returns the REAL reward of the delegate (nextReward*rewardCut)
  getDelegateNextReward = async delegateAddress => {
    const { getDelegateSummary } = this.source
    // DelegateReward = DelegateProtocolNextReward * rewardCut
    let [summary, protocolNextReward] = await promiseRetry(retry => {
      return Promise.all([
        getDelegateSummary(delegateAddress),
        this.getDelegateProtocolNextReward(delegateAddress)
      ]).catch(err => retry())
    })

    const { pendingRewardCut } = summary
    const rewardCut = MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
    return MathBN.mul(protocolNextReward, rewardCut)
  }

  // For a given delegateAddress return the next reward that will be distributed towards delegators
  getDelegateRewardToDelegators = async delegateAddress => {
    const { getDelegateSummary } = this.source
    // FORMULA: DelegateRewardToDelegators = DelegateProtocolNextReward - (DelegateProtocolNextReward * rewardCut)
    let [summary, protocolNextReward] = await promiseRetry(retry => {
      return Promise.all([
        getDelegateSummary(delegateAddress),
        this.getDelegateProtocolNextReward(delegateAddress)
      ]).catch(err => retry())
    })

    const { pendingRewardCut } = summary
    const rewardCut = MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
    const rewardToDelegate = MathBN.mul(protocolNextReward, rewardCut)
    return MathBN.sub(protocolNextReward, rewardToDelegate)
  }

  getMissedRewardCalls = async delegateAddress => {
    const protocolService = getProtocolService()
    let missedCalls = 0
    const rewards = await this.getDelegateRewards(delegateAddress)
    const currentRound = await protocolService.getCurrentRound()
    if (rewards) {
      missedCalls = calculateMissedRewardCalls(rewards, currentRound)
    }
    return missedCalls
  }

  getDelegateRewards = async delegateAddress => {
    const { getDelegateRewards } = this.source
    const rewards = await getDelegateRewards(delegateAddress)
    return rewards
  }

  getDelegateTotalStake = async delegateAddress => {
    const { getDelegateTotalStake } = this.source
    const totalStake = await getDelegateTotalStake(delegateAddress)
    return totalStake
  }

  // Returns an array of all the active and registered delegates
  getRegisteredDelegates = async () => {
    const { getRegisteredDelegates } = this.source
    return await getRegisteredDelegates()
  }

  // Calculates how much of lptTokenRewards a delegator will obtain from a given delegator
  // Receives a amount of staked LPT (delegatorAmountToStake), the totalStake of the delegate and the rewardsToDelegators amount
  // Note: delegatorAmountToStake should be on tokenUnits
  // All the values should be in tokenValues (18 decimals)
  simulateNextReturnForGivenDelegatorStakedAmount = (
    rewardsToDelegatorsInTokens,
    delegateTotalStakeInTokens,
    delegatorAmountToStakeInTokens
  ) => {
    const rewardsToDelegators = tokenAmountInUnits(rewardsToDelegatorsInTokens)
    const delegateTotalStake = tokenAmountInUnits(delegateTotalStakeInTokens)
    const delegatorAmountToStake = tokenAmountInUnits(delegatorAmountToStakeInTokens)
    // Checks that the delegatorStakedAmount is <= delegateTotalStake
    if (MathBN.lte(delegatorAmountToStake, delegateTotalStake)) {
      // Calculates the delegatorParticipation in the totalStake
      // FORMULA: delegatorStakedAmount / delegateTotalStake
      const participationInTotalStakeRatio = MathBN.div(delegatorAmountToStake, delegateTotalStake)
      // Then calculates the reward with FORMULA: participationInTotalStakeRatio * rewardToDelegators
      return MathBN.mul(rewardsToDelegators, participationInTotalStakeRatio)
    } else {
      return 0
    }
  }

  // Returns the best active and registered <topNumber> delegates based on the return that they will provide on 1000 bonded LPT
  getTopDelegates = async (topNumber, amountToStake = 1000) => {
    let topDelegates = []
    const delegates = await this.getRegisteredDelegates()
    const amountToStakeInTokens = unitAmountInTokenUnits(amountToStake)
    for (let delegateIterator of delegates) {
      const rewardsToDelegators = await this.getDelegateRewardToDelegators(delegateIterator.address)
      const rewardsConverted = unitAmountInTokenUnits(rewardsToDelegators)
      // Best return formula = order delegates by the best amount of return that will be given towards bonded delegators
      const roi = this.simulateNextReturnForGivenDelegatorStakedAmount(
        rewardsConverted,
        delegateIterator.totalStake,
        amountToStakeInTokens
      )
      const totalStake = tokenAmountInUnits(delegateIterator.totalStake)
      topDelegates.push({
        id: delegateIterator.id,
        totalStake,
        roi
      })
    }
    // Sorts in ROI descending order
    topDelegates.sort((a, b) => {
      const aBn = MathBN.toBig(a.roi)
      const bBn = MathBN.toBig(b.roi)
      return bBn.sub(aBn)
    })
    return topDelegates.slice(0, topNumber)
  }
}

module.exports = {
  getDelegateService
}
