const Subscriber = require('../subscriber/subscriber.model')

const notifyDelegatesChangesInDelegates = async listOfChangedDelegates => {
  console.log(`[Check-Delegate-Change-Rules] - Notifying delegators of changed delegates`)
  // Gets a list of delegators and their delegates
  const listOfDelegatesAndDelegators = await Subscriber.getListOfDelegateAddressAndDelegatorAddress()
  const notificationList = generateNotificationList(
    listOfChangedDelegates,
    listOfDelegatesAndDelegators
  )
  for (let iterator of notificationList) {
    // Send notification to the delegator
    console.log(
      `[Check-Delegate-Change-Rules] - Send notification to delegator ${iterator.delegatorAddress}`
    )
    // TODO Call sendNotification fn
  }
}

const generateNotificationList = async (listOfChangedDelegates, listOfDelegatesAndDelegators) => {
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
    const { delegateAddress, delegatorAddress } = iterator
    const delegateChanged = listOfChangedDelegates.find(element => {
      return element._id === delegateAddress
    })
    if (delegateChanged) {
      notificationList.push({
        delegatorAddress,
        delegate: delegateChanged
      })
    }
  }
  return notificationList
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

module.exports = {
  notifyDelegatesChangesInDelegates,
  hasDelegateChangedRules,
  generateNotificationList
}
