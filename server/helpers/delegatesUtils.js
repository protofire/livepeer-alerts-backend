const { TO_FIXED_VALUES_DECIMALS } = require('../../config/constants')
const mongoose = require('../../config/mongoose')
const Delegate = require('../delegate/delegate.model')
const Pool = require('../pool/pool.model')
const utils = require('./utils')
const Big = require('big.js')

const hasDelegateChangedRules = (oldDelegate, newDelegate) => {
  const { feeShare, pendingFeeShare, rewardCut, pendingRewardCut, active } = oldDelegate
  const hasChanged =
    feeShare !== newDelegate.feeShare ||
    pendingFeeShare !== newDelegate.pendingFeeShare ||
    rewardCut !== newDelegate.rewardCut ||
    pendingRewardCut !== newDelegate.pendingRewardCut ||
    active !== newDelegate.active

  if (hasChanged)
    console.log(`[Check-Delegate-Change-Rules] - Delegate ${oldDelegate._id} has changed`)

  return hasChanged
}

const getDelegateRulesChanged = (oldDelegate, newDelegate) => {
  const { feeShare, pendingFeeShare, rewardCut, pendingRewardCut, active } = oldDelegate
  const hasChanged =
    feeShare !== newDelegate.feeShare ||
    pendingFeeShare !== newDelegate.pendingFeeShare ||
    rewardCut !== newDelegate.rewardCut ||
    pendingRewardCut !== newDelegate.pendingRewardCut ||
    active !== newDelegate.active

  const oldProperties = {
    feeShare,
    pendingFeeShare,
    rewardCut,
    pendingRewardCut,
    active
  }

  const newProperties = {
    feeShare: newDelegate.feeShare,
    pendingFeeShare: newDelegate.pendingFeeShare,
    rewardCut: newDelegate.rewardCut,
    pendingRewardCut: newDelegate.pendingRewardCut,
    active: newDelegate.active
  }

  if (hasChanged)
    console.log(`[Check-Delegate-Change-Rules] - Delegate ${oldDelegate._id} has changed`)

  return {
    hasChanged,
    oldProperties,
    newProperties
  }
}

const getListOfUpdatedDelegates = (oldDelegates, newDelegates) => {
  const updatedDelegates = []
  const propertiesChangedList = []
  for (let newDelegateIterator of newDelegates) {
    // Founds the newDelegateIterator from the old delegates array
    let oldDelegateIterator = oldDelegates.find(old => {
      const found = old._id === newDelegateIterator.id
      return found
    })
    // This should not happen, because the job that saves new remote delegates (checkAndUpdateMissingLocalDelegates) should be executed first
    if (!oldDelegateIterator) {
      console.error(
        `[Check-Delegate-Change-Rules] - Remote Delegate ${newDelegateIterator.id} not found, did you called checkAndUpdateMissingLocalDelegates() before?`
      )
      continue
    }
    // Then checks if the rules between the old and new version of the delegate did changed
    const propertiesChanged = delegateUtils.getDelegateRulesChanged(
      oldDelegateIterator,
      newDelegateIterator
    )
    if (propertiesChanged.hasChanged) {
      oldDelegateIterator = {
        _id: oldDelegateIterator._id,
        ...newDelegateIterator
      }
      const updatedDelegate = new Delegate({ ...oldDelegateIterator })
      // Saves the changed-delegate
      updatedDelegates.push(updatedDelegate)

      // Save the changed-properties
      propertiesChangedList.push({
        id: oldDelegateIterator._id,
        ...propertiesChanged
      })
    }
  }
  // return updatedDelegates
  return {
    updatedDelegates,
    propertiesChangedList
  }
}

const updateDelegatesLocally = async listOfDelegatesToUpdate => {
  console.log(`[Update-Delegates-Locally] - Start Updating delegates`)
  let updatedDelegates = []
  const delegatesUpdatedPromises = []
  if (!listOfDelegatesToUpdate || listOfDelegatesToUpdate.length === 0) {
    console.error(`[Check-Delegate-Change-Rules] - No delegates received to update`)
    return updatedDelegates
  }
  // Iterates over all the changed delegates and update the local version of each one
  for (let updateDelegateIterator of listOfDelegatesToUpdate) {
    const id = updateDelegateIterator.id

    const {
      active,
      ensName,
      status,
      lastRewardRound,
      rewardCut,
      feeShare,
      pricePerSegment,
      pendingRewardCut,
      pendingFeeShare,
      pendingPricePerSegment,
      totalStake
    } = updateDelegateIterator
    const updatedDelegatePromise = Delegate.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          active,
          ensName,
          status,
          lastRewardRound,
          rewardCut,
          feeShare,
          pricePerSegment,
          pendingRewardCut,
          pendingFeeShare,
          pendingPricePerSegment,
          totalStake
        }
      },
      {
        // MongoDB findAndModify is deprecated, this should be used to disable it
        useFindAndModify: false,
        // Sets the replica concern to 0, default is 1
        // See: https://docs.mongodb.com/manual/reference/write-concern/
        writeConcern: {
          w: 0
        }
      }
    )

    delegatesUpdatedPromises.push(updatedDelegatePromise)
  }
  try {
    updatedDelegates = await Promise.all(delegatesUpdatedPromises)
  } catch (err) {
    console.error(`[Update-Delegates-Locally] - Error: ${err}`)
    throw err
  }

  console.log(`[Update-Delegates-Locally] - Finish with ${updatedDelegates.length} updates`)
  return updatedDelegates
}

// Receives all the delegates that are stored locally and the delegates from the graph
// If there are delegates who are not stored locally, save them on the db
const checkAndUpdateMissingLocalDelegates = async delegates => {
  if (!delegates || delegates.length === 0) {
    console.error(
      '[Check-And-Update-Missing-Local-Delegates] - there were no remote delegates received on checkAndUpdateMissingLocalDelegates'
    )
    return
  }
  const updateDelegatePromises = []
  for (let delegate of delegates) {
    const delegateId = delegate.id
    const localFound = await Delegate.findById(delegateId)
    if (!localFound) {
      console.log(
        `[Check-And-Update-Missing-Local-Delegates] - remote delegate ${delegateId} not found locally, adding it`
      )
      const newDelegate = new Delegate({
        _id: delegateId,
        ...delegate
      })
      updateDelegatePromises.push(newDelegate.save())
    }
  }
  await Promise.all(updateDelegatePromises)
}

const getDelegateLastXPools = async (delegateAddress, currentRound, lastXRoundPools) => {
  console.log(`[DelegatesUtils] - Getting delegate last ${lastXRoundPools} pools`)
  const startRound = currentRound - lastXRoundPools
  let delegate = await Delegate.findById(delegateAddress)
    .populate({
      path: 'pools',
      model: Pool,
      options: {
        sort: {
          round: -1 // Sorts the delegatePools in descending order based on roundId
        }
      },
      match: {
        round: { $gte: startRound, $lte: currentRound }
      }
    })
    .exec()

  let delegatePools = []

  if (delegate) {
    delegatePools = delegate.pools
  }
  console.log(`[DelegatesUtils] - Pools found: ${delegatePools.length}`)
  return delegatePools
}

const getDelegateLastWeekRoundsPools = async (delegateAddress, currentRound) => {
  if (!delegateAddress) {
    throw new Error(
      '[DelegatesUtils] - No delegateAddress provided on getDelegateLastWeekRoundsPools()'
    )
  }
  if (!currentRound) {
    throw new Error(
      '[DelegatesUtils] - No currentRound provided on getDelegateLastWeekRoundsPools()'
    )
  }

  // Gets all the pools within 7 the last 7 rounds
  const delegatePools = await getDelegateLastXPools(delegateAddress, currentRound, 7)
  // Sums all the pools in a unique reward
  let totalDelegatePools = delegatePools.reduce((totalDelegatePools, currentPool) => {
    if (currentPool.rewardTokens) {
      const rewardTokensToTokenUnits = utils.tokenAmountInUnits(currentPool.rewardTokens)
      return utils.MathBN.addAsBN(totalDelegatePools, rewardTokensToTokenUnits)
    }
    return totalDelegatePools
  }, new Big('0'))
  totalDelegatePools = totalDelegatePools.toFixed(TO_FIXED_VALUES_DECIMALS)
  return totalDelegatePools
}

const delegateUtils = {
  getListOfUpdatedDelegates,
  hasDelegateChangedRules,
  updateDelegatesLocally,
  checkAndUpdateMissingLocalDelegates,
  getDelegateRulesChanged,
  getDelegateLastWeekRoundsPools,
  getDelegateLastXPools
}

module.exports = delegateUtils
