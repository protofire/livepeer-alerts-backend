const { getProtocolService } = require('./protocolService')

const _ = require('lodash')
const { MathBN } = require('../utils')
const { tokenAmountInUnits } = require('../utils')

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

  // Returns the delegate summary
  getDelegate = async delegateAddress => {
    const { getDelegateSummary } = this.source
    const summary = await getDelegateSummary(delegateAddress)
    return {
      summary: {
        ...summary,
        totalStake: tokenAmountInUnits(_.get(summary, 'totalStake', 0))
      }
    }
  }

  // Receives a delegateAddress and returns the TOTAL reward (protocol reward, no the reward cut) of that delegate for the next round
  getDelegateProtocolNextReward = async delegateAddress => {
    const protocolService = getProtocolService()
    // FORMULA: mintedTokensForNextRound * delegateParticipationInTotalBonded

    let [totalStake, mintedTokensForNextRound, totalBondedInProtocol] = await promiseRetry(
      retry => {
        return Promise.all([
          this.getDelegateTotalStake(delegateAddress),
          protocolService.getMintedTokensForNextRound(),
          protocolService.getTotalBonded()
        ]).catch(err => {
          console.error('error ', err)
          retry()
        })
      }
    )

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
    // FORMULA: DelegateRewardToDelegators = DelegateProtocolNextReward - DelegateProtocolNextReward * rewardCut
    let [summary, protocolNextReward] = await Promise.all([
      this.getDelegate(delegateAddress),
      this.getDelegateProtocolNextReward(delegateAddress)
    ])
    const { pendingRewardCut } = summary
    const rewardCut = MathBN.div(pendingRewardCut, PROTOCOL_DIVISION_BASE)
    const rewardToDelegate = MathBN.mul(protocolNextReward, rewardCut)
    return MathBN.sub(protocolNextReward, rewardToDelegate)
  }

  // For a given delegatorAddress, returns the next round reward if exists
  getDelegatorNextReturn = async delegatorAddress => {
    const protocolService = getProtocolService()
    const { getLivepeerDelegatorAccount } = protocolService
    const { getDelegateTotalStake } = this.source
    // FORMULA: rewardToDelegators * delegatorParticipationInTotalStake
    const delegator = await promiseRetry(retry => {
      try {
        return getLivepeerDelegatorAccount(delegatorAddress)
      } catch (err) {
        retry()
      }
    })
    const { delegateAddress, totalStake } = delegator
    const delegateTotalStake = await getDelegateTotalStake(delegateAddress)
    // Delegator participation FORMULA: delegatorTotalStake / delegateTotalStake
    const delegatorParticipationInTotalStake = MathBN.div(totalStake, delegateTotalStake)
    const rewardToDelegators = await this.getDelegateRewardToDelegators(delegateAddress)
    return MathBN.mul(rewardToDelegators, delegatorParticipationInTotalStake)
  }

  getMissedRewardCalls = async delegateAddress => {
    console.log('missed rewards')
    const { getDelegateRewards } = this.source
    const protocolService = getProtocolService()
    let missedCalls = 0
    console.log('before rewards with add ', delegateAddress)
    const rewards = await getDelegateRewards(delegateAddress)
    console.log('rewards')
    const currentRound = await protocolService.getCurrentRound()
    console.log('round')
    if (rewards) {
      missedCalls = calculateMissedRewardCalls(rewards, currentRound)
    }
    console.log('finish cal ', missedCalls)
    return missedCalls
  }

  getDelegateTotalStake = async delegateAddress => {
    const { getDelegateTotalStake } = this.source
    const totalStake = await getDelegateTotalStake(delegateAddress)
    return totalStake
  }
}

module.exports = {
  getDelegateService
}
