const mongoose = require('../../config/mongoose')
const delegatorUtils = require('./delegatorUtils')
const subscriberUtils = require('./subscriberUtils')
const Share = require('../share/share.model')
const Delegator = require('../delegator/delegator.model')
const { MathBN, unitAmountInTokenUnits } = require('./utils')

const updateDelegatorSharesOfRound = async (round, delegator) => {
  const { address, totalStake, delegateAddress } = delegator
  if (!address || !totalStake || !delegateAddress) {
    throw new Error(`Delegator ${JSON.stringify(delegator)} missing property`)
  }

  const { roundId } = round
  const shareId = `${address}-${roundId}`

  // Get reward tokens
  let rewardTokens = await delegatorUtils.getDelegatorCurrentRewardTokens(
    roundId,
    address,
    totalStake
  )

  const checkRewardTokens = async rewardTokens => {
    // Check if is the first one, detect reward
    if (!rewardTokens) {
      const lastRoundId = roundId - 1
      const lastDelegatorShareId = `${address}-${lastRoundId}`
      const lastDelegatorShare = await Share.findById(lastDelegatorShareId)
      if (!lastDelegatorShare) {
        const { getDelegatorService } = require('./services/delegatorService')
        const delegatorService = getDelegatorService()
        const rewardTokensInAmount = await delegatorService.getDelegatorNextReward(address)
        rewardTokens = unitAmountInTokenUnits(rewardTokensInAmount, 18)
      }
    }
    return rewardTokens
  }

  rewardTokens = await checkRewardTokens(rewardTokens)

  const share = await Share.findById(shareId)
  if (share) {
    let shareModified = false
    if (
      share.rewardTokens !== rewardTokens &&
      rewardTokens !== null &&
      MathBN.gte(rewardTokens, share.rewardTokens)
    ) {
      share.rewardTokens = rewardTokens
      shareModified = true
    }
    if (
      share.totalStakeOnRound !== totalStake &&
      totalStake !== null &&
      MathBN.gte(totalStake, share.totalStakeOnRound)
    ) {
      share.totalStakeOnRound = totalStake
      shareModified = true
    }
    if (shareModified) {
      await share.save()
    }
  } else {
    let newShare = await Share.create({
      _id: shareId,
      rewardTokens: rewardTokens,
      totalStakeOnRound: totalStake,
      delegator: address,
      delegate: delegateAddress,
      round: roundId
    })

    round.shares.push(newShare)
    await round.save()

    delegator = await Delegator.findById(address)
    if (delegator) {
      delegator.shares.push(newShare)
      await delegator.save()
    }
  }
}

// Executed on round changed, only executes for the delegators which are subscribed
const updateDelegatorsShares = async newRound => {
  const delegatorsAndSubscribers = await subscriberUtils.getDelegatorSubscribers()
  if (!delegatorsAndSubscribers || delegatorsAndSubscribers.length === 0) {
    console.log('No delegators subscribers found, stop updating shares')
    return
  }

  const delegators = []
  for (let delegatorAndSubscriber of delegatorsAndSubscribers) {
    const { delegator } = delegatorAndSubscriber
    delegators.push(delegator)
  }

  const delegatorsUnique = delegators.reduce((acc, current) => {
    const x = acc.find(item => item.address === current.address)
    if (!x) {
      return acc.concat([current])
    } else {
      return acc
    }
  }, [])

  if (!delegatorsUnique || delegatorsUnique.length === 0) {
    console.log('No delegators subscribers found, stop updating shares')
    return
  }

  for (let delegator of delegatorsUnique) {
    try {
      const shareId = `${delegator.address}-${newRound.roundId}`
      console.log(`Updating share ${shareId} for round ${newRound.roundId}`)
      await service.updateDelegatorSharesOfRound(newRound, delegator)
    } catch (err) {
      console.error(`Error when updating delegators shares: continue updating next delegator`, err)
      continue
    }
  }
  console.log('Finished, stop updating shares')
}

const service = {
  updateDelegatorsShares,
  updateDelegatorSharesOfRound
}

module.exports = service
