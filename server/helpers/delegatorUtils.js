const Delegator = require('../delegator/delegator.model')
const Share = require('../share/share.model')
const mongoose = require('../../config/mongoose')
const { MathBN } = require('./utils')

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
  // The first time we register the delegator on the db, he won't have any shares, we save 0
  if (!lastDelegatorShare) {
    console.error('[Delegator utils] - last share not found')
    return 0
  }
  const newShare = MathBN.sub(currentDelegatorTotalStake, lastDelegatorShare.totalStakeOnRound)
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

const delegatorUtils = {
  checkAndUpdateMissingLocalDelegators,
  getDelegatorCurrentRewardTokens
}

module.exports = delegatorUtils
