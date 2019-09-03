const mongoose = require('../../config/mongoose')
const { getDelegateService } = require('../helpers/services/delegateService')
const { getProtocolService } = require('../helpers/services/protocolService')
const Delegate = require('../delegate/delegate.model')
const Pool = require('../pool/pool.model')
const { MathBN } = require('./utils')

const updateDelegatePoolsOfRound = async (round, pool) => {
  const delegateService = getDelegateService()

  const { id, rewardTokens, transcoder } = pool
  const delegateId = transcoder && transcoder.id
  if (!delegateId) {
    throw new Error(`The pool ${id} does not contain a valid delegate address`)
  }

  const { roundId } = round
  const foundPool = await Pool.findById(id)

  let [totalStakeOnRound, delegate] = await Promise.all([
    delegateService.getDelegateTotalStake(delegateId),
    Delegate.findById(delegateId)
  ])

  const isActualRoundPromise = async () => {
    const protocolService = getProtocolService()
    const currentRound = await protocolService.getCurrentRound()
    return currentRound === roundId
  }

  if (foundPool) {
    let poolModified = false

    const mustUpdateRewards =
      rewardTokens !== foundPool.rewardTokens &&
      rewardTokens !== null &&
      MathBN.gte(rewardTokens, foundPool.rewardTokens)

    if (mustUpdateRewards) {
      foundPool.rewardTokens = rewardTokens
      poolModified = true
    }

    const isActualRound = await isActualRoundPromise()
    const mustUpdateTotalStakeOnRound =
      isActualRound &&
      totalStakeOnRound !== foundPool.totalStakeOnRound &&
      totalStakeOnRound !== null &&
      MathBN.gte(totalStakeOnRound, foundPool.totalStakeOnRound)

    if (mustUpdateTotalStakeOnRound) {
      foundPool.totalStakeOnRound = totalStakeOnRound
      poolModified = true
    }

    if (poolModified) {
      await foundPool.save()
    }
  } else {
    let newPool = await Pool.create({
      _id: id,
      rewardTokens,
      totalStakeOnRound,
      delegate: delegateId,
      round: roundId
    })

    round.pools.push(newPool)
    await round.save()

    if (delegate) {
      delegate.pools.push(newPool)
      await delegate.save()
    }
  }
}

const updateDelegatesPools = async newRound => {
  const delegateService = getDelegateService()
  const roundWithPoolsData = await delegateService.getPoolsPerRound(newRound.roundId)
  if (
    !roundWithPoolsData ||
    !roundWithPoolsData.rewards ||
    roundWithPoolsData.rewards.length === 0
  ) {
    console.log('Pools per round not found')
    return
  }
  const roundPools = roundWithPoolsData.rewards
  for (let pool of roundPools) {
    try {
      console.log(`Updating pool ${pool.id} for round ${newRound.roundId}`)
      await service.updateDelegatePoolsOfRound(newRound, pool)
    } catch (err) {
      console.error(`Error when updating pool ${pool.id}: continue updating next`, err)
      continue
    }
  }
}

const service = {
  updateDelegatesPools,
  updateDelegatePoolsOfRound
}

module.exports = service
