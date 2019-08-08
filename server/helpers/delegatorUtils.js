const Big = require('big.js')
const mongoose = require('../../config/mongoose')
const Delegator = require('../delegator/delegator.model')
const Delegate = require('../delegate/delegate.model')
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

// Receives all the delegators that are stored locally and the delegators from the graph
// If there are delegators who are not stored locally, save them on the db
const checkAndUpdateMissingLocalDelegators = async fetchedDelegators => {
  console.error(`[Delegator utils] - checkAndUpdateMissingLocalDelegators Start`)
  if (!fetchedDelegators || fetchedDelegators.length === 0) {
    console.error(
      '[Delegator utils] - there were no remote delegators received on checkAndUpdateMissingLocalDelegators()'
    )
    return
  }
  const updateDelegatorPromises = []
  const updateDelegatePromises = []
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
      console.log(`[Delegator utils] - updating delegate: ${delegateAddress} with new delegator`)
      // Updates the delegator of the delegate with the delegator address if is not already there
      const delegate = await Delegate.findById(delegateAddress).populate({ path: 'delegators' })
      if (delegate) {
        const { delegators } = delegate
        if (!delegators.includes(remoteId)) {
          console.log(
            `[Delegator utils] - remote delegator ${remoteId} not found on the delegator list of the delegate, adding it`
          )
          delegators.push(remoteId)
          updateDelegatePromises.push(delegate.save())
        }
      }
    } else {
      console.log(`[Delegator utils] - remote delegator ${remoteId} found locally, updating it`)
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
  await Promise.all(updateDelegatePromises)
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
  const {
    delegatorNextReward,
    delegateNextReward,
    delegator
  } = await delegatorService.getDelegatorAndDelegateNextReward(delegatorAddress)
  // Get current round
  const currentRound = await protocolService.getCurrentRound()

  // Get last 30 delegator rewards
  const delegatorShares = await delegatorUtils.getDelegatorLastXShares(
    delegatorAddress,
    currentRound,
    rewardsRound
  )

  // Get last 30 delegate reward
  const delegatePools = await delegateUtils.getDelegateLastXPools(
    delegator.delegateAddress,
    currentRound,
    rewardsRound
  )

  // Sums all the shares  and pools in a unique reward
  let delegatorLastRoundReward = new Big(0)
  let delegator7RoundsRewards = new Big(0)
  let delegator30RoundsRewards = new Big(0)

  const lastRoundStartValue = currentRound - 1
  const last7RoundStartValue = currentRound - 7
  const last30RoundStartValue = currentRound - 30
  let amountOfSharesFor7RoundsAvailable = 0
  let amountOfSharesFor30RoundsAvailable = 0

  delegatorShares.forEach(share => {
    if (share.round === lastRoundStartValue.toString()) {
      delegatorLastRoundReward = utils.MathBN.add(delegatorLastRoundReward, share.rewardTokens)
    }
    if (share.round >= last7RoundStartValue.toString()) {
      delegator7RoundsRewards = utils.MathBN.add(delegator7RoundsRewards, share.rewardTokens)
      amountOfSharesFor7RoundsAvailable++
    }
    if (share.round >= last30RoundStartValue.toString()) {
      delegator30RoundsRewards = utils.MathBN.add(delegator30RoundsRewards, share.rewardTokens)
      amountOfSharesFor30RoundsAvailable++
    }
  })

  // Only calculates 7 rounds rewards if on every round of the 7 rounds there are shares, otherwise returns 0
  if (amountOfSharesFor7RoundsAvailable !== 7) {
    console.log(
      `[DelegatorUtils] - not enough rounds shares for displaying 7 rounds shares, amount available: ${amountOfSharesFor7RoundsAvailable}`
    )
    delegator7RoundsRewards = new Big(0)
  }
  // Only calculates 30 rounds rewards if on every round of the 30 rounds there are shares, otherwise returns 0
  if (amountOfSharesFor30RoundsAvailable !== 30) {
    console.log(
      `[DelegatorUtils] - not enough rounds shares for displaying 30 rounds shares, amount available: ${amountOfSharesFor30RoundsAvailable}`
    )
    delegator30RoundsRewards = new Big(0)
  }

  let delegateLastRoundReward = new Big(0)
  let delegate7RoundsRewards = new Big(0)
  let delegate30RoundsRewards = new Big(0)

  delegatePools.forEach(pool => {
    if (pool.round === lastRoundStartValue.toString()) {
      delegateLastRoundReward = utils.MathBN.add(delegateLastRoundReward, pool.rewardTokens)
    }
    if (pool.round >= last7RoundStartValue.toString()) {
      delegate7RoundsRewards = utils.MathBN.add(delegate7RoundsRewards, pool.rewardTokens)
    }
    if (pool.round >= last30RoundStartValue.toString()) {
      delegate30RoundsRewards = utils.MathBN.add(delegate30RoundsRewards, pool.rewardTokens)
    }
  })

  // Formats the values to token units
  delegateLastRoundReward = utils.tokenAmountInUnits(delegateLastRoundReward)
  delegate7RoundsRewards = utils.tokenAmountInUnits(delegate7RoundsRewards)
  delegate30RoundsRewards = utils.tokenAmountInUnits(delegate30RoundsRewards)

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
  const totalDelegatorSharesWithoutDecimals = delegatorShares.reduce(
    (totalDelegatorShares, currentShare) => {
      if (currentShare.rewardTokens) {
        return utils.MathBN.add(totalDelegatorShares, currentShare.rewardTokens)
      }
      return totalDelegatorShares
    },
    new Big('0')
  )

  const totalDelegatorShares = new Big(totalDelegatorSharesWithoutDecimals).toFixed(
    TO_FIXED_VALUES_DECIMALS
  )

  const averageShares = utils.MathBN.divAsBig(totalDelegatorShares, 7).toFixed(
    TO_FIXED_VALUES_DECIMALS
  )

  // Formats shares to 4 decimals
  delegatorShares.forEach(shareElement => {
    const newReward = new Big(shareElement.rewardTokens)
    shareElement.rewardTokens = newReward.toFixed(TO_FIXED_VALUES_DECIMALS)
  })
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
