const Subscriber = require('../subscriber/subscriber.model')
const Delegate = require('../delegate/delegate.model')
const { sendDelegatorNotificationDelegateChangeRulesEmail } = require('./sendDelegatorEmail')

const notifyDelegatorsWhenDelegateChangeTheRules = async (
  listOfChangedDelegates,
  listOfPropertiesChanged
) => {
  console.log(`[Check-Delegate-Change-Rules] - Notifying delegators of changed delegates`)
  if (
    !listOfChangedDelegates ||
    listOfChangedDelegates.length === 0 ||
    !listOfPropertiesChanged ||
    listOfPropertiesChanged.length === 0
  ) {
    return null
  }

  try {
    // Gets a list of delegators and their delegates
    const listOfDelegatesAndDelegators = await Subscriber.getListOfDelegateAddressAndDelegatorAddress()
    const notificationList = generateNotificationList(
      listOfChangedDelegates,
      listOfDelegatesAndDelegators,
      listOfPropertiesChanged
    )
    for (let iterator of notificationList) {
      // Send notification to the delegator
      const { subscriber, delegateAddress, delegatorAddress, propertiesChanged } = iterator

      if (!subscriber.email) {
        continue
      }
      console.log(
        `[Check-Delegate-Change-Rules] - Send notification to delegator ${delegatorAddress} with email ${subscriber.email}`
      )
      await sendDelegatorNotificationDelegateChangeRulesEmail(
        subscriber,
        delegateAddress,
        propertiesChanged
      )
    }
  } catch (err) {
    console.error(
      `[Check-Delegate-Change-Rules] - Error while trying to send notification to delegators: ${err}`
    )
    throw err
  }
}

const generateNotificationList = (
  listOfChangedDelegates,
  listOfDelegatesAndDelegators,
  listOfPropertiesChanged
) => {
  const notificationList = []
  if (
    !listOfChangedDelegates ||
    listOfChangedDelegates.length === 0 ||
    !listOfDelegatesAndDelegators ||
    listOfDelegatesAndDelegators.length === 0 ||
    !listOfPropertiesChanged ||
    listOfPropertiesChanged.length === 0
  ) {
    return notificationList
  }

  // For every delegator checks if the delegateAddress if the one that changed, in that case, notify the delegator
  for (let iterator of listOfDelegatesAndDelegators) {
    const { delegateAddress, delegatorAddress, subscriber } = iterator
    const delegateChanged = listOfChangedDelegates.find(element => {
      return element._id === delegateAddress
    })
    const propertiesChanged = listOfPropertiesChanged.find(element => {
      return element.id === delegateAddress
    })
    if (delegateChanged) {
      notificationList.push({
        delegateAddress,
        delegatorAddress,
        delegate: delegateChanged,
        subscriber,
        propertiesChanged
      })
    }
  }
  return notificationList
}

module.exports = {
  notifyDelegatorsWhenDelegateChangeTheRules,
  generateNotificationList
}
