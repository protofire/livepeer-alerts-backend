const mongoose = require('../../config/mongoose')
const {
  updateDelegatesLocally,
  getListOfUpdatedDelegates,
  checkAndUpdateMissingLocalDelegates
} = require('../helpers/delegatesUtils')
const { getDelegateService } = require('../helpers/services/delegateService')
const Delegate = require('../delegate/delegate.model')
const {
  notifyDelegatorsWhenDelegateChangeTheRules
} = require('../helpers/notifyDelegatorsWhenDelegateChangeTheRules')

const workerCheckDelegateChangeRules = async () => {
  console.log(`[Check-Delegate-Change-Rules] - Start`)
  const delegateService = getDelegateService()
  // Gets the last version of the delegates from graphql
  let delegatesFetched = await delegateService.getDelegates()
  // Then checks if all the fetched delegates exists locally, otherwise, add the ones that are missing
  await checkAndUpdateMissingLocalDelegates(delegatesFetched)
  // Get the local version of the delegates
  let delegatesOnDb = await Delegate.find()
  // Generates a list of delegates who did changed compared to their local version
  const updatedDelegates = getListOfUpdatedDelegates(delegatesOnDb, delegatesFetched)
  let delegatesChanged = []
  // Updates existing local delegates with the fetched information
  if (updatedDelegates.length > 0) {
    console.log(`[Check-Delegate-Change-Rules] - Updating changed delegates`)
    delegatesChanged = await updateDelegatesLocally(updatedDelegates)
  }
  // Send notification to delegators
  console.log('changed', delegatesChanged)
  if (delegatesChanged.length > 0) {
    await notifyDelegatorsWhenDelegateChangeTheRules(delegatesChanged)
  }
  console.log(
    `[Check-Delegate-Change-Rules] - Finish, changed delegates: ${delegatesChanged.length}`
  )
  process.exit(0)
}

return workerCheckDelegateChangeRules()
