const Subscriber = require('../subscriber/subscriber.model')
const Delegate = require('../delegate/delegate.model')
const { sendDelegatorNotificationDelegateChangeRulesEmail } = require('./sendDelegatorEmail')

const notifyDelegatorsWhenDelegateChangeTheRules = async listOfChangedDelegates => {
  console.log(`[Check-Delegate-Change-Rules] - Notifying delegators of changed delegates`)
  if (!listOfChangedDelegates || listOfChangedDelegates.length === 0) {
    return null
  }

  // Gets a list of delegators and their delegates
  const listOfDelegatesAndDelegators = await Subscriber.getListOfDelegateAddressAndDelegatorAddress()

  const notificationList = generateNotificationList(
    listOfChangedDelegates,
    listOfDelegatesAndDelegators
  )
  for (let iterator of notificationList) {
    // Send notification to the delegator
    const { subscriber, delegateAddress, delegatorAddress } = iterator
    console.log(
      `[Check-Delegate-Change-Rules] - Send notification to delegator ${delegatorAddress} with email ${
        subscriber.email
      }`
    )
    await sendDelegatorNotificationDelegateChangeRulesEmail(subscriber, delegateAddress)
  }
}

const generateNotificationList = (listOfChangedDelegates, listOfDelegatesAndDelegators) => {
  const notificationList = []
  if (
    !listOfChangedDelegates ||
    listOfChangedDelegates.length === 0 ||
    !listOfDelegatesAndDelegators ||
    listOfDelegatesAndDelegators.length === 0
  ) {
    return notificationList
  }

  // For every delegator checks if the delegateAddress if the one that changed, in that case, notify the delegator
  for (let iterator of listOfDelegatesAndDelegators) {
    const { delegateAddress, delegatorAddress, subscriber } = iterator
    const delegateChanged = listOfChangedDelegates.find(element => {
      return element._id === delegateAddress
    })
    if (delegateChanged) {
      notificationList.push({
        delegateAddress,
        delegatorAddress,
        delegate: delegateChanged,
        subscriber
      })
    }
  }
  return notificationList
}

module.exports = {
  notifyDelegatorsWhenDelegateChangeTheRules,
  generateNotificationList
}
