const Subscriber = require('../../subscriber/subscriber.model')

const { sendDelegatorNotificationDelegateChangeRulesEmail } = require('../sendDelegatorEmail')

const notificateDelegateUtil = require('./notificateDelegateUtils')

const notificateDelegatorUtil = require('./notificateDelegatorUtils')

const sendRoundNotifications = async (roundProgress, round, thresholdSendNotification) => {
  let notificationsSent = false
  // Checks that roundProgress round and thresholdSendNotification are defined
  if (!roundProgress) {
    console.error(
      `[Check-Round-Change] - RoundProgress was not received, skipping sendNotifications`
    )
    throw new Error(
      `[Check-Round-Change] - RoundProgress was not received, skipping sendNotifications`
    )
  }

  if (!round || !round._id) {
    console.error(`[Check-Round-Change] - Round was not received, skipping sendNotifications`)
    throw new Error(`[Check-Round-Change] - Round was not received, skipping sendNotifications`)
  }
  if (!thresholdSendNotification) {
    console.error(
      `[Check-Round-Change] - thresholdSendNotification was not received, skipping sendNotifications`
    )
    throw new Error(
      `[Check-Round-Change] - thresholdSendNotification was not received, skipping sendNotifications`
    )
  }

  // Check if the notifications were not already sent
  if (round.notificationsForRoundSent) {
    console.log(
      `[Check-Round-Change] - notifications for round: ${round._id} were already sent, skipping sendNotifications`
    )
    return notificationsSent
  }

  // Checks if the progress if above a certain threshold
  if (roundProgress < thresholdSendNotification) {
    console.log(
      `[Check-Round-Change] - the roundProgress: ${roundProgress} is bellow the threshold: ${thresholdSendNotification}, skipping sendNotifications`
    )
    return notificationsSent
  }

  // Because the notifications were not sent for the round, and the current round progress is above a certain threshold, send notifications

  // Send email notifications for delegate and delegators
  try {
    console.log(`[Check-Round-Change] - Get all subscribers with email`)
    const emailSubscribers = await Subscriber.find({
      frequency: 'daily',
      activated: 1,
      email: { $ne: null }
    })
    // TODO -- Refactor as promise All
    console.log(`[Check-Round-Change] - Sending email round notifications to delegators`)
    await notificateDelegatorUtil.sendEmailRewardCallNotificationToDelegators(emailSubscribers)
    console.log(`[Check-Round-Change] - Sending email round notifications to delegates`)
    await notificateDelegateUtil.sendEmailRewardCallNotificationToDelegates(emailSubscribers)
    const telegramSubscribers = await Subscriber.find({
      frequency: 'daily',
      activated: 1,
      telegramChatId: { $ne: null }
    })

    // Send telegram notifications for delegates
    console.log(`[Check-Round-Change] - Sending telegram round notifications to delegators`)
    await notificateDelegatorUtil.sendTelegramRewardCallNotificationToDelegators(
      telegramSubscribers
    )
    console.log(`[Check-Round-Change] - Sending telegram round notifications to delegates`)
    await notificateDelegateUtil.sendTelegramRewardCallNotificationToDelegates(telegramSubscribers)
    console.log(`[Check-Round-Change] - finish sending notifications, updating round flag`)
    // Finally updates the current round with the notificationsForRoundSent flag
    round.notificationsForRoundSent = true
    await round.save()
    notificationsSent = true
    console.log(
      `[Check-Round-Change] - Round flag updated, notifications sent: ${notificationsSent}`
    )
    return notificationsSent
  } catch (err) {
    console.log(`[Check-Round-Change] - error on sendRoundNotifications(): ${err}`)
    throw err
  }
}

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
  generateNotificationList,
  sendRoundNotifications
}
