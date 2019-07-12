const delegateUtils = require('./delegatesUtils')

const { getDelegateService } = require('../helpers/services/delegateService')
const mongoose = require('../../config/mongoose')
const Delegate = require('../delegate/delegate.model')
const Pool = require('../pool/pool.model')
const Round = require('../round/round.model')

const updateSingleDelegatePool = async (delegateAddress, singlePool, round, session) => {
  const delegateService = getDelegateService()
  const poolId = singlePool.id
  const { rewardTokens } = singlePool
  // Fetch the delegate current totalStake and the local delegate related to the pool
  let [totalStakeOnRound, delegate] = await Promise.all([
    delegateService.getDelegateTotalStake(delegateAddress),
    Delegate.findById(delegateAddress)
  ])
  if (!delegate) {
    // This should not happen because all the delegates on the db should be updated first
    console.error(
      `[Update Delegates Pools] - The delegate ${delegateAddress} of the pool ${poolId} was not found, did you call the updateDelegatesJob() before?`
    )
    return
  }

  try {
    const { roundId } = round
    // Creates the pool object
    let newSavedPool = new Pool({
      _id: poolId,
      rewardTokens: rewardTokens,
      totalStakeOnRound,
      delegate: delegateAddress,
      round: roundId
    })
    // Saves the pool
    console.log('[Update Delegates Pools] - Saving new pool')
    newSavedPool = await newSavedPool.save({ session })
    // Also updates the round with the pool
    round.pools.push(newSavedPool)
    console.log('[Update Delegates Pools] - Updating round with pool')
    round = await round.save({ session })
    // Finally Updates the delegate with the new pool
    console.log('[Update Delegates Pools] - Updating delegate with pool')
    delegate.pools.push(newSavedPool)
    delegate = await delegate.save({ session })
  } catch (err) {
    console.error(`[Update Delegates Pools] - Error Updating pools on delegate ${delegateAddress}`)
    console.error(err)
    throw err
  }
}

const updateDelegatePoolsOfRound = async (round, roundPools) => {
  console.log('[Update Delegates Pools] - Starts updating delegate pools')
  if (!round) {
    console.error('[Update Delegates Pools] - No round pools was provided')
    throw new Error('[Update Delegates Pools] - No round pools was provided')
  }
  if (!roundPools) {
    console.error('[Update Delegates Pools] - No round pools were provided')
    throw new Error('[Update Delegates Pools] - No round pools were provided')
  }
  // Checks that the round exists before continue
  const { roundId } = round
  round = await Round.findById(roundId)
  if (!round) {
    console.error('[Update Delegates Pools] - The round provided does not exists')
    throw new Error('[Update Delegates Pools] - The round provided does not exists')
  }

  const session = await mongoose.startSession()
  await session.startTransaction()
  // Persists the pools locally
  try {
    for (let poolIterator of roundPools) {
      const delegateId = poolIterator.transcoder.id
      await service.updateSingleDelegatePool(delegateId, poolIterator, round, session)
    }
    // Finally commit transactions if there are no errors
    await session.commitTransaction()
  } catch (err) {
    console.error(`There was an error updating single delegate pool: ${err}`)
    await session.abortTransaction()
  } finally {
    await session.endSession()
  }
}

// Executed on round changed
const updateDelegatesPools = async newRound => {
  console.log('[Update Delegates Pools] - Start')
  if (!newRound) {
    throw new Error('[Update Delegates Pools] - No round was provided')
  }

  // Updates local delegates with the new version provided from graphql
  const delegateService = getDelegateService()
  // Gets the last version of the delegates from graphql
  const delegatesFetched = await delegateService.getDelegates()
  // Then checks if all the fetched delegates exists locally, otherwise, add the ones that are missing
  await delegateUtils.checkAndUpdateMissingLocalDelegates(delegatesFetched)

  // Fetch the pool data for the given round
  const roundWithPoolsData = await delegateService.getPoolsPerRound(newRound.roundId)
  if (!roundWithPoolsData || !roundWithPoolsData.rewards) {
    throw new Error('[Update Delegates Pools] - Pools per round not found')
  }
  const roundPools = roundWithPoolsData.rewards

  // Then updates the delegates on the current round
  await service.updateDelegatePoolsOfRound(newRound, roundPools)

  console.log('[Update Delegates Pools] - Finish')
}

const service = {
  updateDelegatesPools,
  updateDelegatePoolsOfRound,
  updateSingleDelegatePool
}

module.exports = service
