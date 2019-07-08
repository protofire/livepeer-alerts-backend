const { getDelegateService } = require('../helpers/services/delegateService')
const mongoose = require('../../config/mongoose')
const Delegate = require('../delegate/delegate.model')
const Pool = require('../pool/pool.model')
const Round = require('../round/round.model')

// TODO - Move this examples to a test file
// TODO -- add test: should return error if try to save two pools pool with the same combination (delegate, round)
// TODO TEST TO ADD two pools with different id but same delegate address and round id => should throw err
const test = async () => {
  const currentRoundInfo = {
    id: '1403',
    roundId: '1403',
    initialized: true,
    lastInitializedRound: '1403',
    length: '5760',
    startBlock: '8081280',
    blocksUntilNextRound: '1780',
    nextRoundStartBlock: '8087040',
    roundLength: undefined,
    nextRoundNum: '1404',
    progress: 30.90277777777778
  }
  let { id } = currentRoundInfo
  // Get pools of the last round
  const delegateService = getDelegateService()
  const roundWithPoolsData = await delegateService.getPoolsPerRound(id)
  const roundPools = roundWithPoolsData.rewards
  for (let poolIterator of roundPools) {
    // Test find pool with round and delegate
    const findPool = await Pool.findById(poolIterator.id)
      .populate({
        path: 'round',
        populate: {
          path: 'pools'
        }
      })
      .populate({
        path: 'delegate',
        populate: {
          path: 'pools'
        }
      })
    // console.log('pol', findPool)
    // Test find round with pool
    const findRound = await Round.findById(id).populate('pools')
    //console.log("round ", findRound)
    // Test find delegate with pool
    const findDelegate = await Delegate.findById(delegateId).populate('pools')
    //console.log('found delegate', findDelegate)
  }
}

const updateDelegatePoolsOfRound = async (round, roundPools) => {
  console.log('[Update Delegates Pools] - Starts updating delegate pools')
  if (!roundPools) {
    console.error('[Update Delegates Pools] - No round pools were provided')
    return
  }
  const delegateService = getDelegateService()

  // Persists the pools locally
  for (let poolIterator of roundPools) {
    const delegateId = poolIterator.transcoder.id
    // Fetch the delegate current totalStake and the local delegate related to the pool
    let [totalStakeOnRound, delegate] = await Promise.all([
      delegateService.getDelegateTotalStake(delegateId),
      Delegate.findById(delegateId)
    ])
    if (!delegate) {
      // This should not happen because all the delegates on the db should be updated first
      console.error(
        `[Update Delegates Pools] - The delegate ${delegateId} of the pool ${poolIterator.id} was not found, did you call the updateDelegatesJob() before?`
      )
      continue
    }

    try {
      const { roundId } = round
      // Creates the pool object
      let newSavedPool = new Pool({
        _id: poolIterator.id,
        rewardTokens: poolIterator.rewardTokens,
        totalStakeOnRound,
        delegate: delegateId,
        round: roundId
      })
      // Saves the pool
      newSavedPool = await newSavedPool.save()
      // Also updates the round with the pool
      round.pools.push(newSavedPool)

      round = await Round.findOneAndUpdate(
        { _id: roundId },
        {
          $set: {
            pools: round.pools
          }
        },
        {
          // MongoDB findAndModify is deprecated, this should be used to disable it
          useFindAndModify: false
        }
      )
      // Finally Updates the delegate with the new pool
      console.log('[Update Delegates Pools] - Updating pools on delegate')
      delegate.pools.push(newSavedPool)
      delegate = await delegate.save()
    } catch (err) {
      console.error(`[Update Delegates Pools] - Error Updating pools on delegate ${delegateId}`)
      console.error(err)
    }
  }
}

// Executed on round changed
const updateDelegatesPools = async newRound => {
  console.log('[Update Delegates Pools] - Start')
  if (!newRound) {
    console.error('[Update Delegates Pools] - No round was provided')
    return
  }

  /**
   * TODO -- Here call service to update local delegates using the new version of delegates from graphql
   * Something like:
   * const delegatesFetched = await delegateService.getDelegates()
   * await checkAndUpdateMissingLocalDelegates(delegatesFetched)
   */

  // Fetch the pool data for the given round
  const delegateService = getDelegateService()
  const roundWithPoolsData = await delegateService.getPoolsPerRound(newRound.roundId)
  if (!roundWithPoolsData) {
    throw new Error('[Update Delegates Pools] - Pools per round not found')
  }
  const roundPools = roundWithPoolsData.rewards

  // Then updates the delegates on the current round
  await updateDelegatePoolsOfRound(newRound, roundPools)

  console.log('[Update Delegates Pools] - Finish')
}

const currentRound = new Round({
  _id: '1403',
  roundId: '1403',
  initialized: true,
  lastInitializedRound: '1403',
  length: '5760',
  startBlock: '8081280',
  pools: [],
  shares: []
})

//return updateDelegatesPools(currentRound)

module.exports = {
  updateDelegatesPools
}
