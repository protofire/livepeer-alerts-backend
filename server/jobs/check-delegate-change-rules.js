const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')

const { getDelegateService } = require('../helpers/services/delegateService')
const Delegate = require('../delegate/delegate.model')
const Subscriber = require('../subscriber/subscriber.model')

const workerCheckDelegateChangeRules = async () => {
  const delegateService = getDelegateService()
  const delegatesFetched = await delegateService.getDelegates()
  const delegatesUpdated = []
  // List of delegates address who changed their rules
  const delegatesChanged = []

  console.log(`[Check-Delegate-Change-Rules] - Delegates ${delegatesFetched.length}`)
  for (let delegateIterator of delegatesFetched) {
    let delegateOnDbFound = await Delegate.findOne({ _id: delegateIterator.id })
    if (delegateOnDbFound) {
      if (hasDelegateChangedRules(delegateOnDbFound, delegateIterator)) {
        delegateOnDbFound = {
          _id: delegateOnDbFound._id,
          ...delegateIterator
        }
        const updatedDelegate = new Delegate({ ...delegateOnDbFound })
        // Updates local delegate
        updatedDelegate.isNew = false
        delegatesUpdated.push(updatedDelegate.save())

        // Saves the changed-delegate
        delegatesChanged.push(updatedDelegate)
      }
    } else {
      // Saves new delegate on db
      const newDelegate = new Delegate({
        _id: delegateIterator.id,
        ...delegateIterator
      })
      delegatesUpdated.push(newDelegate.save())
    }
  }
  // Update the delegates locally
  console.log(`[Check-Delegate-Change-Rules] - Updating changed delegates`)
  await Promise.all(delegatesUpdated)

  // Send notification to delegators
  await notifyDelegatesChangesInDelegates(delegatesChanged)

  process.exit(0)
}

const notifyDelegatesChangesInDelegates = async listOfChangedDelegates => {
  console.log(`[Check-Delegate-Change-Rules] - Notifying delegators of changed delegates`)
  if (!listOfChangedDelegates || listOfChangedDelegates.length === 0) {
    return
  }
  // Gets a list of delegators and their delegates
  const listOfDelegatesAndDelegators = await Subscriber.getListOfDelegateAddressAndDelegatorAddress()

  // For every delegator checks if the delegateAddress if the one that changed, in that case, notify the delegator
  listOfDelegatesAndDelegators.every(value => {
    const { delegateAddress, delegatorAddress } = value
    const delegateChanged = listOfChangedDelegates.find(element => element._id === delegateAddress)
    console.log('changed ', delegateChanged)
    if (delegateChanged) {
      // Send notification to the delegator
      console.log(
        `[Check-Delegate-Change-Rules] - Send notification to delegator ${delegatorAddress}`
      )
      // TODO - Dispatch notification of rules changes something like notifyDelegator(delegatorAddress, delegate)
    }
  })
}

const hasDelegateChangedRules = (oldDelegate, newDelegate) => {
  const { feeShare, pendingFeeShare, rewardCut, pendingRewardCut } = oldDelegate
  const hasChanged =
    feeShare !== newDelegate.feeShare ||
    pendingFeeShare !== newDelegate.pendingFeeShare ||
    rewardCut !== newDelegate.rewardCut ||
    pendingRewardCut !== newDelegate.pendingRewardCut

  if (hasChanged)
    console.log(`[Check-Delegate-Change-Rules] - Delegate ${oldDelegate._id} has changed`)

  return hasChanged
}

return workerCheckDelegateChangeRules()
