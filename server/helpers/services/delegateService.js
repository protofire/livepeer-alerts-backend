const promiseRetry = require('promise-retry')
const _ = require('lodash')

const { getProtocolService } = require('./protocolService')

const utils = require('../utils')
const { PROTOCOL_DIVISION_BASE } = require('../../../config/constants')

let delegateServiceInstance
// the default source for delegates is GRAPHQL
const graphqlSource = require('../graphql/queries')

const getDelegateService = (source = graphqlSource) => {
  if (!delegateServiceInstance) {
    delegateServiceInstance = new DelegateService(source)
  }
  return delegateServiceInstance
}

class DelegateService {
  constructor(source) {
    this.source = source
  }

  // Returns the delegate summary
  getDelegateSummary = async delegateAddress => {
    const { getLivepeerDelegateAccount } = this.source
    const summary = await getLivepeerDelegateAccount(delegateAddress)
    return {
      summary: {
        ...summary,
        id: delegateAddress,
        totalStake: utils.tokenAmountInUnits(_.get(summary, 'totalStake', 0))
      }
    }
  }

  // Returns the delegate
  getDelegate = async delegateAddress => {
    const delegateSummary = await this.getDelegateSummary(delegateAddress)
    const { summary } = delegateSummary
    return {
      ...summary
    }
  }

  // Receives a delegateAddress and returns the TOTAL reward (protocol reward, no the reward cut) of that delegate for the next round
  getDelegateProtocolNextReward = async delegateAddress => {
    const protocolService = getProtocolService()
    // FORMULA: mintedTokensForNextRound * delegateParticipationInTotalBonded
    const [totalStake, mintedTokensForNextRound, totalBondedInProtocol] = await Promise.all([
      this.getDelegateTotalStake(delegateAddress),
      protocolService.getMintedTokensForNextRound(),
      protocolService.getTotalBonded()
    ])
    // FORMULA: delegateTotalStake / protocolTotalBonded
    const participationInTotalBondedRatio = utils.MathBN.div(totalStake, totalBondedInProtocol)
    return utils.MathBN.mul(mintedTokensForNextRound, participationInTotalBondedRatio)
  }

  // Receives a delegateAddress and returns the REAL reward of the delegate (nextReward*rewardCut)
  getDelegateNextReward = async delegateAddress => {
    // DelegateReward = DelegateProtocolNextReward * rewardCut
    let [delegate, protocolNextReward] = await promiseRetry(retry => {
      return Promise.all([
        this.getDelegate(delegateAddress),
        this.getDelegateProtocolNextReward(delegateAddress)
      ]).catch(err => retry())
    })
    const { pendingRewardCut } = delegate
    const rewardCut = utils.MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
    return utils.MathBN.mul(protocolNextReward, rewardCut)
  }

  // For a given delegateAddress return the next reward that will be distributed towards delegators
  getDelegateRewardToDelegators = async delegateAddress => {
    // FORMULA: DelegateRewardToDelegators = DelegateProtocolNextReward - DelegateProtocolNextReward * rewardCut
    let [delegate, protocolNextReward] = await Promise.all([
      this.getDelegate(delegateAddress),
      this.getDelegateProtocolNextReward(delegateAddress)
    ])
    const { pendingRewardCut } = delegate
    const rewardCut = utils.MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
    const rewardToDelegate = utils.MathBN.mul(protocolNextReward, rewardCut)
    return utils.MathBN.sub(protocolNextReward, rewardToDelegate)
  }

  /**
   * Returns the missed rewards calls of the delegate
   * between the last round and the lastRound-roundsPeriod
   * If no roundPeriodReceive, returns the missed rewardCalls
   * Of the last 30 rounds
   * @param delegateAddress, roundsPeriod
   * @returns {Promise<number>}
   */
  getMissedRewardCalls = async (delegateAddress, roundsPeriod) => {
    if (!delegateAddress) {
      throw new Error('[DelegateService] - no delegateAddress received on getMissedRewardCalls')
    }
    const protocolService = getProtocolService()
    let missedCalls = 0
    const rewards = await this.getDelegateRewards(delegateAddress)
    const currentRound = await protocolService.getCurrentRound()
    if (rewards) {
      missedCalls = utils.calculateMissedRewardCalls(rewards, currentRound, roundsPeriod)
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
    const rewardsToDelegators = utils.tokenAmountInUnits(rewardsToDelegatorsInTokens)
    const delegateTotalStake = utils.tokenAmountInUnits(delegateTotalStakeInTokens)
    const delegatorAmountToStake = utils.tokenAmountInUnits(delegatorAmountToStakeInTokens)
    // Checks that the delegatorStakedAmount is <= delegateTotalStake
    if (utils.MathBN.lte(delegatorAmountToStake, delegateTotalStake)) {
      // Calculates the delegatorParticipation in the totalStake
      // FORMULA: delegatorStakedAmount / delegateTotalStake
      const participationInTotalStakeRatio = utils.MathBN.div(
        delegatorAmountToStake,
        delegateTotalStake
      )
      // Then calculates the reward with FORMULA: participationInTotalStakeRatio * rewardToDelegators
      return utils.MathBN.mul(rewardsToDelegators, participationInTotalStakeRatio)
    } else {
      return 0
    }
  }

  // Returns the best active and registered <topNumber> delegates based on the return that they will provide on 1000 bonded LPT
  getTopDelegates = async (topNumber, amountToStake = 1000) => {
    let topDelegates = []
    const delegates = await this.getRegisteredDelegates()
    const amountToStakeInTokens = utils.unitAmountInTokenUnits(amountToStake)
    for (let delegateIterator of delegates) {
      const rewardsToDelegators = await this.getDelegateRewardToDelegators(delegateIterator.address)
      const rewardsConverted = utils.unitAmountInTokenUnits(rewardsToDelegators)
      // Best return formula = order delegates by the best amount of return that will be given towards bonded delegators
      const roi = this.simulateNextReturnForGivenDelegatorStakedAmount(
        rewardsConverted,
        delegateIterator.totalStake,
        amountToStakeInTokens
      )
      const totalStake = utils.tokenAmountInUnits(delegateIterator.totalStake)
      topDelegates.push({
        id: delegateIterator.id,
        totalStake,
        roi
      })
    }
    // Sorts in ROI descending order
    topDelegates.sort((a, b) => {
      const aBn = utils.MathBN.toBig(a.roi)
      const bBn = utils.MathBN.toBig(b.roi)
      return bBn.sub(aBn)
    })
    return topDelegates.slice(0, topNumber)
  }

  getDelegates = async () => {
    const { getLivepeerDelegates } = this.source
    const delegates = await getLivepeerDelegates()
    return delegates
  }

  getPoolsPerRound = async roundNumber => {
    const { getPoolsPerRound } = this.source
    return await getPoolsPerRound(roundNumber)
  }

  getDelegateRoi = async (delegateAddress, amountToStake = 1000) => {
    if (!delegateAddress) {
      throw new Error('[DelegateService] - no delegateAddress received on getDelegateRoi')
    }
    const rewardsToDelegators = await this.getDelegateRewardToDelegators(delegateAddress)
    const rewardsConverted = utils.unitAmountInTokenUnits(rewardsToDelegators)
    const totalStake = await this.getDelegateTotalStake(delegateAddress)
    const amountToStakeInTokens = utils.unitAmountInTokenUnits(amountToStake)
    // Best return formula = order delegates by the best amount of return that will be given towards bonded delegators
    const roi = this.simulateNextReturnForGivenDelegatorStakedAmount(
      rewardsConverted,
      totalStake,
      amountToStakeInTokens
    )
    const percent = utils.MathBN.mul(roi, 100)
    const roiPercent = utils.MathBN.div(percent, amountToStake)
    return {
      roi,
      roiPercent
    }
  }

  getDelegateRewardStatus = async delegateAddress => {
    if (!delegateAddress) {
      throw new Error('[DelegateService] - no delegateAddress received on getDelegateRewardStatus')
    }
    const missedRewardCalls = await this.getMissedRewardCalls(delegateAddress, 30)
    const delegateSummary = await this.getDelegateSummary(delegateAddress)
    const delegateRoi = await this.getDelegateRoi(delegateAddress)
    const { rewardCut, totalStake } = delegateSummary.summary
    const { roi, roiPercent } = delegateRoi
    return {
      totalStake,
      rewardCut,
      last30RoundsMissedRewardCalls: missedRewardCalls,
      roiAbs: roi,
      roiPercent
    }
  }

  getDidDelegateCalledReward = async delegateAddress => {
    const { getLivepeerDelegateAccount } = require('../sdk/delegate') // should use delegateService but the value lastRewardRound is not updated
    const protocolService = getProtocolService()

    const [delegate, currentRoundInfo] = await promiseRetry(retry => {
      return Promise.all([
        getLivepeerDelegateAccount(delegateAddress),
        protocolService.getCurrentRoundInfo()
      ]).catch(err => retry())
    })

    // Check if transcoder call reward
    const callReward = delegate && delegate.lastRewardRound === currentRoundInfo.id
    return callReward
  }
}
module.exports = {
  getDelegateService
}
