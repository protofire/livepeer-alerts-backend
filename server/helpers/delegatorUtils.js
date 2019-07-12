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
  if (!fetchedDelegators || fetchedDelegators.length === 0) {
    console.error(
      '[Delegator utils] - there were no remote delegators received on checkAndUpdateMissingLocalDelegators()'
    )
    return
  }
  const updateDelegatorPromises = []
  for (let remoteDelegatorIterator of fetchedDelegators) {
    const remoteId = remoteDelegatorIterator._id
    let localFound = await Delegator.findById(remoteId)
    if (!localFound) {
      console.log(`[Delegator utils] - remote delegator ${remoteId} not found locally, adding it`)
      const newDelegator = new Delegator({
        _id: remoteId,
        ...remoteDelegatorIterator
      })
      updateDelegatorPromises.push(newDelegator.save())
    } else {
      // If found, just update it
      localFound = {
        ...remoteDelegatorIterator,
        shares: localFound.shares
      }
      updateDelegatorPromises.push(localFound.save())
    }
  }
  await Promise.all(updateDelegatorPromises)
}

const delegatorUtils = {
  checkAndUpdateMissingLocalDelegators,
  getDelegatorCurrentRewardTokens
}

module.exports = delegatorUtils
