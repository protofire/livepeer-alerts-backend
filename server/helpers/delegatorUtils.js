const Big = require('big.js')
const mongoose = require('../../config/mongoose')
const Delegator = require('../delegator/delegator.model')
const Share = require('../share/share.model')
const utils = require('./utils')
const delegateUtils = require('./delegatesUtils')
const { getDelegateService } = require('./services/delegateService')
const { getDelegatorService } = require('./services/delegatorService')
const { getProtocolService } = require('./services/protocolService')
const { TO_FIXED_VALUES_DECIMALS } = require('../../config/constants')

// Fetch the round-id delegator total stake from the last share and make a sub with the current total stake
const getDelegatorCurrentRewardTokens = async (
  currentRoundId,
  delegatorAddress,
  currentDelegatorTotalStake
) => {
  if (!currentRoundId) {
    console.error(
      '[Delegator utils] - no round id was provided on getDelegateCurrentRewardTokens()'
    )
    throw new Error(
      '[Delegator utils] - no round id was provided on getDelegateCurrentRewardTokens()'
    )
  }
  if (!delegatorAddress) {
    console.error(
      '[Delegator utils] - no delegatorAddress was provided on getDelegateCurrentRewardTokens()'
    )
    throw new Error(
      '[Delegator utils] - no delegatorAddress was provided on getDelegateCurrentRewardTokens()'
    )
  }
  if (!currentDelegatorTotalStake) {
    console.error(
      '[Delegator utils] - no currentDelegatorTotalStake was provided on getDelegateCurrentRewardTokens()'
    )
    throw new Error(
      '[Delegator utils] - no currentDelegatorTotalStake was provided on getDelegateCurrentRewardTokens()'
    )
  }
  const lastRoundId = currentRoundId - 1
  const lastDelegatorShareId = `${delegatorAddress}-${lastRoundId}`
  const lastDelegatorShare = await Share.findById(lastDelegatorShareId)
  // The first time we register the delegator on the db, he won't have any shares, we save as default value, the delegatorNextReward (an approximation of how much the delegator has obtained)
  if (!lastDelegatorShare) {
    const { getDelegatorService } = require('../helpers/services/delegatorService')
    const delegatorService = getDelegatorService()
    console.error('[Delegator utils] - last share not found')
    return await delegatorService.getDelegatorNextReward(delegatorAddress)
  }
  const newShare = utils.MathBN.sub(
    currentDelegatorTotalStake,
    lastDelegatorShare.totalStakeOnRound
  )
  console.log(`[Delegator utils] - returning new share: ${newShare}`)
  return newShare
}

// Receives all the delegates that are stored locally and the delegates from the graph
// If there are delegates who are not stored locally, save them on the db
const checkAndUpdateMissingLocalDelegators = async fetchedDelegators => {
  console.error(`[Delegator utils] - checkAndUpdateMissingLocalDelegators Start`)
  if (!fetchedDelegators || fetchedDelegators.length === 0) {
    console.error(
      '[Delegator utils] - there were no remote delegators received on checkAndUpdateMissingLocalDelegators()'
    )
    return
  }
  const updateDelegatorPromises = []
  for (let remoteDelegatorIterator of fetchedDelegators) {
    const remoteId = remoteDelegatorIterator.address
    const delegateAddress = remoteDelegatorIterator.delegateAddress
      ? remoteDelegatorIterator.delegateAddress
      : remoteDelegatorIterator.delegate
    if (!remoteId) {
      console.error(`[Delegator utils] - delegator ${remoteDelegatorIterator} has not id, skipped`)
      continue
    }
    if (!delegateAddress) {
      console.error(`[Delegator utils] - delegator ${remoteId} has not delegate address, skipped`)
      continue
    }
    const localFound = await Delegator.findById(remoteId)
    if (!localFound) {
      console.log(`[Delegator utils] - remote delegator ${remoteId} not found locally, adding it`)
      const { startRound, totalStake } = remoteDelegatorIterator
      const newDelegator = new Delegator({
        _id: remoteId,
        delegate: delegateAddress,
        startRound,
        totalStake
      })
      updateDelegatorPromises.push(newDelegator.save())
    } else {
      // If found, just update it
      const updatedDelegator = new Delegator({
        _id: remoteId,
        delegate: delegateAddress,
        startRound: remoteDelegatorIterator.startRound,
        totalStake: remoteDelegatorIterator.totalStake,
        shares: localFound.shares
      })
      updateDelegatorPromises.push(updatedDelegator.save())
    }
  }
  await Promise.all(updateDelegatorPromises)
  console.error(`[Delegator utils] - checkAndUpdateMissingLocalDelegators Finished`)
}

/**
 * Generates a weekly summary for the given delegator between the (currentRound-7, currentRound)
 * Throws error if there is no delegator or currentRound received
 * Or if the delegator does not have a weekly subscription
 * If the delegator has no rewards at least for one of the last 7 rounds, throws an error
 * @param delegator
 * @returns {Promise<{summaryObject}>}
 */
const getDelegatorSharesSummary = async (delegator, currentRound) => {
  if (!delegator) {
    throw new Error('[DelegatorUtils] no delegator provided on getDelegatorSharesSummary()')
  }
  if (!currentRound) {
    throw new Error('[DelegatorUtils] no currentRound provided on getDelegatorSharesSummary()')
  }
  // Calculates totalDelegatePools
  try {
    const totalDelegatePools = await delegateUtils.getDelegateLastWeekRoundsPools(
      delegator.delegateAddress,
      currentRound
    )

    const today = new Date()

    const {
      fromDateCardinal,
      toDateCardinal,
      startRoundDate,
      endRoundDate
    } = utils.getStartAndFinishDateOfWeeklySummary(today)
    const totalRounds = 7

    const {
      weekRoundShares,
      averageShares,
      totalDelegatorShares
    } = await delegatorUtils.getWeeklySharesPerRound(delegator.address, currentRound)
    const delegateService = getDelegateService()
    const missedRewardCalls = await delegateService.getMissedRewardCalls(
      delegator.delegateAddress,
      totalRounds
    )

    return {
      fromDateCardinal,
      toDateCardinal,
      startRoundDate,
      endRoundDate,
      totalDelegatePools,
      totalDelegatorShares,
      totalRounds,
      weekRoundShares,
      averageShares,
      missedRewardCalls
    }
  } catch (err) {
    console.error(`[DelegatorUtils] - Error on getDelegatorSharesSummary(): ${err}`)
    throw err
  }
}

const getDelegatorLastXShares = async (delegatorAddress, currentRound, lastXRoundShares) => {
  console.log(`[DelegatorUtils] - Getting delegator last ${lastXRoundShares} shares`)
  if (!delegatorAddress) {
    throw new Error('[DelegatorUtils] - No delegatorAddress provided on getDelegatorLastXShares()')
  }
  if (!currentRound) {
    throw new Error('[DelegatorUtils] - No currentRound provided on getDelegatorLastXShares()')
  }
  if (!lastXRoundShares) {
    throw new Error('[DelegatorUtils] - No lastXRoundShares provided on getDelegatorLastXShares()')
  }
  // Filters all the shares that are not within the last x rounds
  const startRound = currentRound - lastXRoundShares
  const delegator = await Delegator.findById(delegatorAddress)
    .populate({
      path: 'shares',
      model: Share,
      options: {
        sort: {
          round: -1 // Sorts the delegatorShares in descending order based on roundId
        }
      },
      match: {
        round: { $gte: startRound, $lte: currentRound }
      }
    })
    .exec()
  let delegatorShares = []

  if (delegator) {
    delegatorShares = delegator.shares
  }
  console.log(`[DelegatorUtils] - Shares found: ${delegatorShares.length}`)
  return delegatorShares
}

const getDelegatorSummary30RoundsRewards = async delegatorAddress => {
  if (!delegatorAddress) {
    throw new Error(
      '[DelegatorUtils] - No delegatorAddress provided on getSummary30RoundsRewards()'
    )
  }
  const rewardsRound = 30
  const delegatorService = getDelegatorService()
  const protocolService = getProtocolService()

  // Get next reward
  const [{ delegatorNextReward, delegateNextReward, delegator }, currentRound] = await Promise.all([
    delegatorService.getDelegatorAndDelegateNextReward(delegatorAddress),
    protocolService.getCurrentRound()
  ])
  // Get last 30 delegator rewards
  const [delegatorShares, delegatePools] = await Promise.all([
    delegatorUtils.getDelegatorLastXShares(delegatorAddress, currentRound, rewardsRound),
    delegateUtils.getDelegateLastXPools(delegator.delegateAddress, currentRound, rewardsRound)
  ])
  // Sums all the shares  and pools in a unique reward
  let delegatorLastRoundReward = new Big(0)
  let delegator7RoundsRewards = new Big(0)
  let delegator30RoundsRewards = new Big(0)

  const lastRoundStartValue = currentRound - 1
  const last7RoundStartValue = currentRound - 7
  const last30RoundStartValue = currentRound - 30

  delegatorShares.forEach(share => {
    if (share.round === lastRoundStartValue.toString()) {
      delegatorLastRoundReward = utils.MathBN.add(delegatorLastRoundReward, share.rewardTokens)
    }
    if (share.round >= last7RoundStartValue.toString()) {
      delegator7RoundsRewards = utils.MathBN.add(delegator7RoundsRewards, share.rewardTokens)
    }
    if (share.round >= last30RoundStartValue.toString()) {
      delegator30RoundsRewards = utils.MathBN.add(delegator30RoundsRewards, share.rewardTokens)
    }
  })

  let delegateLastRoundReward = new Big(0)
  let delegate7RoundsRewards = new Big(0)
  let delegate30RoundsRewards = new Big(0)

  delegatePools.forEach(pool => {
    if (pool.round === lastRoundStartValue.toString()) {
      delegateLastRoundReward = utils.MathBN.add(delegateLastRoundReward, pool.rewardTokens)
      delegateLastRoundReward = utils.tokenAmountInUnits(delegateLastRoundReward)
    }
    if (pool.round >= last7RoundStartValue.toString()) {
      delegate7RoundsRewards = utils.MathBN.add(delegate7RoundsRewards, pool.rewardTokens)
      delegate7RoundsRewards = utils.tokenAmountInUnits(delegate7RoundsRewards)
    }
    if (pool.round >= last30RoundStartValue.toString()) {
      delegate30RoundsRewards = utils.MathBN.add(delegate30RoundsRewards, pool.rewardTokens)
      delegate30RoundsRewards = utils.tokenAmountInUnits(delegate30RoundsRewards)
    }
  })

  return {
    nextReward: {
      delegatorReward: delegatorNextReward,
      delegateReward: delegateNextReward
    },
    lastRoundReward: {
      delegatorReward: delegatorLastRoundReward,
      delegateReward: delegateLastRoundReward
    },
    last7RoundsReward: {
      delegatorReward: delegator7RoundsRewards,
      delegateReward: delegate7RoundsRewards
    },
    last30RoundsReward: {
      delegatorReward: delegator30RoundsRewards,
      delegateReward: delegate30RoundsRewards
    }
  }
}

const getWeeklySharesPerRound = async (delegatorAddress, currentRound) => {
  if (!delegatorAddress) {
    throw new Error('[DelegatorUtils] - No delegatorAddress provided on getWeeklySharesPerRound()')
  }
  if (!currentRound) {
    throw new Error('[DelegatorUtils] - No currentRound provided on getWeeklySharesPerRound()')
  }

  // Filters all the last 7 rounds shares of the delegator
  const delegatorShares = await delegatorUtils.getDelegatorLastXShares(
    delegatorAddress,
    currentRound,
    7
  )
  // Sums all the shares in a unique reward
  const totalDelegatorShares = delegatorShares.reduce((totalDelegatorShares, currentShare) => {
    if (currentShare.rewardTokens) {
      return utils.MathBN.add(totalDelegatorShares, currentShare.rewardTokens)
    }
    return totalDelegatorShares
  }, '0')

  const averageShares = utils.MathBN.divAsBig(totalDelegatorShares, 7).toFixed(
    TO_FIXED_VALUES_DECIMALS
  )
  return {
    weekRoundShares: delegatorShares,
    averageShares,
    totalDelegatorShares
  }
}

const delegatorUtils = {
  checkAndUpdateMissingLocalDelegators,
  getDelegatorCurrentRewardTokens,
  getDelegatorSharesSummary,
  getWeeklySharesPerRound,
  getDelegatorSummary30RoundsRewards,
  getDelegatorLastXShares
}

module.exports = delegatorUtils
