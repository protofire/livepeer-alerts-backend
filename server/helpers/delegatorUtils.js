const Delegator = require('../delegator/delegator.model')
const Share = require('../share/share.model')
const mongoose = require('../../config/mongoose')
const utils = require('./utils')
const delegateUtils = require('./delegatesUtils')
const { getDelegateService } = require('./services/delegateService')

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
  }
  if (!currentRound) {
  }
  // Calculates totalDelegatePools
  try {
    const totalDelegatePools = await delegateUtils.getDelegateLastWeekRoundsPools(
      delegator.delegateAddress,
      currentRound
    )

    const today = new Date()
    const { startDate, finishDate } = utils.getStartAndFinishDateOfWeeklySummary(today)

    const totalRounds = 7

    // Format: (roundNumber, shareEarned)
    const {
      sharesPerRound,
      averageShares,
      totalDelegatorShares
    } = await delegatorUtils.getWeeklySharesPerRound(delegator.delegateAddress, currentRound)

    const delegateService = getDelegateService()
    const missedRewardCalls = await delegateService.getMissedRewardCalls(
      delegator.delegateAddress,
      totalRounds
    )

    return {
      totalDelegatePools,
      totalDelegatorShares,
      startDate,
      finishDate,
      totalRounds,
      sharesPerRound,
      averageShares,
      missedRewardCalls
    }
  } catch (err) {
    console.error(`[Delegator utils] - Error on getDelegatorSharesSummary(): ${err}`)
    throw err
  }
}

const getWeeklySharesPerRound = async () => {
  return {
    sharesPerRound: [],
    averageShares: 0,
    totalDelegatorShares: 0
  }
}

const delegatorUtils = {
  checkAndUpdateMissingLocalDelegators,
  getDelegatorCurrentRewardTokens,
  getDelegatorSharesSummary,
  getWeeklySharesPerRound
}

module.exports = delegatorUtils
