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
} = require('../helpers/notification/notificationUtils')

const workerCheckDelegateChangeRules = async () => {
  console.log(`[Check-Delegate-Change-Rules] - Start`)
  const delegateService = getDelegateService()
  try {
    // Gets the last version of the delegates from graphql
    let delegatesFetched = await delegateService.getDelegates()
    // Then checks if all the fetched delegates exists locally, otherwise, add the ones that are missing
    await checkAndUpdateMissingLocalDelegates(delegatesFetched)
    // Get the local version of the delegates
    let delegatesOnDb = await Delegate.find()
    // Generates a list of delegates who did changed compared to their local version
    let { updatedDelegates, propertiesChangedList } = getListOfUpdatedDelegates(
      delegatesOnDb,
      delegatesFetched
    )
    // Updates existing local delegates with the fetched information
    if (updatedDelegates.length > 0) {
      console.log(`[Check-Delegate-Change-Rules] - Updating changed delegates`)
      updatedDelegates = await updateDelegatesLocally(updatedDelegates)
    }
    // Send notification to delegators
    if (updatedDelegates.length > 0 && propertiesChangedList.length) {
      await notifyDelegatorsWhenDelegateChangeTheRules(updatedDelegates, propertiesChangedList)
    }
    console.log(
      `[Check-Delegate-Change-Rules] - Finish, changed delegates: ${updatedDelegates.length}`
    )
    process.exit(0)
  } catch (err) {
    console.error(`[Check-Delegate-Change-Rules] - Error: ${err}`)
    process.exit(1)
  }
}

return workerCheckDelegateChangeRules()
