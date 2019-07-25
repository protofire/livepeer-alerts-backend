const Delegator = require('../delegator/delegator.model')
const Share = require('../share/share.model')
const mongoose = require('../../config/mongoose')
const utils = require('./utils')
const delegateUtils = require('./delegatesUtils')
const { getDelegateService } = require('./services/delegateService')
const { getDelegatorService } = require('./services/delegatorService')
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

const getSummary30RoundsRewards = async delegatorAddress => {
  if (!delegatorAddress) {
    throw new Error(
      '[DelegatorUtils] - No delegatorAddress provided on getSummary30RoundsRewards()'
    )
  }
  const delegatorService = getDelegatorService()
  const {
    delegatorNextReward,
    delegateNextReward
  } = await delegatorService.getDelegatorAndDelegateNextReward(delegatorAddress)
  return {
    nextReward: {
      delegatorReward: delegatorNextReward,
      delegateReward: delegateNextReward
    },
    lastRoundReward: {
      delegatorReward: '',
      delegateReward: ''
    },
    last7RoundsReward: {
      delegatorReward: '',
      delegateReward: ''
    },
    last30RoundsReward: {
      delegatorReward: '',
      delegateReward: ''
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

  let delegator = await Delegator.findById(delegatorAddress)
    .populate({
      path: 'shares',
      options: {
        sort: {
          round: -1 // Sorts the delegatorShares in descending order based on roundId
        }
      }
    })
    .exec()

  const startRound = currentRound - 7
  // Filters all the shares that are not within the last 7 rounds
  const delegatorShares = delegator.shares.filter(
    shareElement => shareElement.round >= startRound && shareElement.round <= currentRound
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
  getSummary30RoundsRewards
}

module.exports = delegatorUtils
