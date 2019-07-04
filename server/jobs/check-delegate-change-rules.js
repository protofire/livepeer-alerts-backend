const mongoose = require('../../config/mongoose')

const { getDelegateService } = require('../helpers/services/delegateService')
const Delegate = require('../delegate/delegate.model')

const {
  notifyDelegatesChangesInDelegates,
  getListOfUpdatedDelegates
} = require('../helpers/notifyDelegators')

const workerCheckDelegateChangeRules = async () => {
  const delegateService = getDelegateService()
  // Gets the last version of the delegates from graphql
  let delegatesFetched = await delegateService.getDelegates()
  // Get the local version of the delegates
  const delegatesOnDb = await Delegate.find()
  // Generates a list of delegates who did changed compared to their local version
  const updatedDelegates = getListOfUpdatedDelegates(delegatesOnDb, delegatesFetched)
  const delegatesUpdatedPromises = []
  const delegatesChanged = []

  // Iterates over all the changed delegates and update the local version of each one
  for (let updateDelegateIterator of updatedDelegates) {
    const updatedDelegate = new Delegate({
      _id: updateDelegateIterator.id,
      ...updateDelegateIterator
    })
    // Updates local delegate
    updatedDelegate.isNew = false
    delegatesUpdatedPromises.push(updatedDelegate.save())
    // Saves the changed-delegate
    delegatesChanged.push(updatedDelegate)
  }
  // Update the delegates locally
  if (delegatesUpdatedPromises.length > 0) {
    console.log(`[Check-Delegate-Change-Rules] - Updating changed delegates`)
    await Promise.all(delegatesUpdatedPromises)
  }
  // Send notification to delegators
  if (delegatesChanged.length > 0) {
    await notifyDelegatesChangesInDelegates(delegatesChanged)
  }

  process.exit(0)
}

return workerCheckDelegateChangeRules()
