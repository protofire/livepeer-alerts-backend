const Delegate = require('../delegate/delegate.model')
const mongoose = require('../../config/mongoose')

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

const getListOfUpdatedDelegates = (oldDelegates, newDelegates) => {
  const updatedDelegates = []
  for (let newDelegateIterator of newDelegates) {
    // Founds the newDelegateIterator from the old delegates array
    let oldDelegateIterator = oldDelegates.find(old => {
      const found = old._id === newDelegateIterator.id
      return found
    })
    // This should not happen, because the job that saves new remote delegates (checkAndUpdateMissingLocalDelegates) should be executed first
    if (!oldDelegateIterator) {
      console.error(
        `[Check-Delegate-Change-Rules] - Remote Delegate ${
          newDelegateIterator.id
        } not found, did you called checkAndUpdateMissingLocalDelegates() before?`
      )
      continue
    }
    // Then checks if the rules between the old and new version of the delegate did changed
    if (hasDelegateChangedRules(oldDelegateIterator, newDelegateIterator)) {
      oldDelegateIterator = {
        _id: oldDelegateIterator._id,
        ...newDelegateIterator
      }
      const updatedDelegate = new Delegate({ ...oldDelegateIterator })
      // Saves the changed-delegate
      updatedDelegates.push(updatedDelegate)
    }
  }
  return updatedDelegates
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
// TODO -- Maybe this could be an always-running proccess with it's subscribed to the graph
const checkAndUpdateMissingLocalDelegates = async fetchedDelegates => {
  if (!fetchedDelegates || fetchedDelegates.length === 0) {
    console.error(
      '[Check-And-Update-Missing-Local-Delegates] - there were no remote delegates received'
    )
    process.exit(1)
  }
  const updateDelegatePromises = []
  for (let remoteDelegateIterator of fetchedDelegates) {
    const remoteId = remoteDelegateIterator.id
    const localFound = await Delegate.findById(remoteId)
    if (!localFound) {
      console.log(
        `[Check-And-Update-Missing-Local-Delegates] - remote delegate ${remoteId} not found locally, adding it`
      )
      const newDelegate = new Delegate({
        _id: remoteId,
        ...remoteDelegateIterator
      })
      updateDelegatePromises.push(newDelegate.save())
    }
  }
  await Promise.all(updateDelegatePromises)
}

module.exports = {
  getListOfUpdatedDelegates,
  hasDelegateChangedRules,
  updateDelegatesLocally,
  checkAndUpdateMissingLocalDelegates
}
