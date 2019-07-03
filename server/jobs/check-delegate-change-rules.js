const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')

const { getDelegateService } = require('../helpers/services/delegateService')
const Delegate = require('../delegate/delegate.model')

const {
  notifyDelegatesChangesInDelegates,
  hasDelegateChangedRules
} = require('../helpers/notifyDelegators')

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

return workerCheckDelegateChangeRules()
