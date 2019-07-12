const mongoose = require('../../config/mongoose')
const delegatorUtils = require('./delegatorUtils')
const Share = require('../share/share.model')
const Round = require('../round/round.model')
const Subscriber = require('../subscriber/subscriber.model')

const updateDelegatorSharesOfRound = async (round, delegator) => {
  console.log('[Update Delegators Shares] - Starts updating delegator shares')
  if (!round) {
    console.error('[Update Delegators Shares] - No round shares were provided')
    throw new Error('[Update Delegators Shares] - No round shares were provided')
  }
  if (!delegator) {
    console.error('[Update Delegators Shares] - No delegator was provided')
    throw new Error('[Update Delegators Shares] - No delegator was provided')
  }
  // Checks that the round exists before continue
  const { roundId } = round
  round = await Round.findById(roundId)
  if (!round) {
    console.error('[Update Delegators Shares] - The round provided does not exists')
    throw new Error('[Update Delegators Shares] - The round provided does not exists')
  }

  // Creates the share object
  const delegatorAddress = delegator._id
  const { totalStake } = delegator
  const shareId = `${delegatorAddress}-${roundId}`
  const rewardTokens = await delegatorUtils.getDelegatorCurrentRewardTokens(
    roundId,
    delegatorAddress,
    totalStake
  )

  let newSavedShared = new Share({
    _id: shareId,
    rewardTokens,
    totalStakeOnRound: totalStake,
    delegator: delegatorAddress,
    delegate: delegator.delegate,
    round: roundId
  })

  try {
    // Saves the share
    console.log(`[Update Delegators Shares] - Saving new share for delegator ${delegatorAddress}`)
    newSavedShared = await newSavedShared.save()
    // Updates the pool with the share
    round.shares.push(newSavedShared)
    console.log('[Update Delegators Shares] - Updating round with share')
    round = await round.save()
    // Finally updates the delegator with the new share
    delegator.shares.push(newSavedShared)
    delegator = await delegator.save()
  } catch (err) {
    console.error(
      `[Update Delegators Shares] - Error Updating share on delegator ${delegatorAddress}`
    )
    console.error(err)
    throw err
  }
}

// Executed on round changed, only executes for the delegators which are subscribed
const updateDelegatorsShares = async newRound => {
  console.log('[Update Delegator shares] - Start')
  if (!newRound) {
    throw new Error('[Update Delegator shares] - No round was provided')
  }

  // Fetch all the delegators that are subscribed
  const delegators = await Subscriber.getDelegatorSubscribers()
  if (!delegators) {
    console.log('[Update Delegator shares] - No delegators subscribers found')
    return
  }

  // Then checks if all the fetched delegators exists locally, otherwise, add the ones that are missing
  await delegatorUtils.checkAndUpdateMissingLocalDelegators(delegators)

  // Then updates the delegators shares on the current round
  for (let delegatorIterator of delegators) {
    await service.updateDelegatorSharesOfRound(newRound, delegatorIterator)
  }

  console.log('[Update Delegators Share] - Finish')
}

const service = {
  updateDelegatorsShares,
  updateDelegatorSharesOfRound
}

module.exports = service
