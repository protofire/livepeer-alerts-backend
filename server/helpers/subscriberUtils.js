const Subscriber = require('../subscriber/subscriber.model')
const { NotSubscribedError, AlreadySubscribedError } = require('./JobsErrors')
const {
  VALID_SUBSCRIPTION_FREQUENCIES,
  WEEKLY_FREQUENCY,
  DAILY_FREQUENCY
} = require('../../config/constants')
const promiseRetry = require('promise-retry')

/**
 * Looks for a subscriptor with the given address and email
 * Returns true if the subscriptor exists otherwise false
 * Throws exception if the address or email received are not defined
 * @param address
 * @param email
 * @returns {Promise<boolean>}
 */
const emailSubscriptorExists = async (address, email) => {
  if (!email) {
    throw new Error(`The email received is not defined`)
  }
  if (!address) {
    throw new Error(`The address received is not defined`)
  }
  const count = await Subscriber.countDocuments({ address, email })
  if (count) {
    return true
  }
  return false
}

/**
 * Looks for a subscriptor with the given chatId
 * Returns true if the subscriptor exists otherwise false
 * Throws exception if the chatId received is not defined
 * @param chatId
 * @returns {Promise<boolean>}
 */
const telegramSubscriptorExists = async chatId => {
  if (!chatId) {
    throw new Error(`The chatId received is not defined`)
  }
  const count = await Subscriber.countDocuments({ telegramChatId: chatId })
  return count > 0
}

/**
 * Returns true if the given frequency is accepted on the list of frequencies
 * Otherwise returns false
 * @param frequency
 */
const isValidFrequency = frequency => {
  if (!frequency) {
    return false
  }
  return VALID_SUBSCRIPTION_FREQUENCIES.includes(frequency)
}

/**
 * Creates a new email subscriptor based on email, address and emailFrequency
 * Throws exception if the subscriptor with that email and address already exists or if the params are not defined
 * Returns the createdSubscriber
 * @param email
 * @param address
 * @param emailFrequency
 * @returns {Promise<subscriber>}
 */
const createEmailSubscriptor = async (address, email, emailFrequency) => {
  if (!email) {
    throw new Error(`The email received is not defined`)
  }
  if (!address) {
    throw new Error(`The address received is not defined`)
  }
  if (!emailFrequency) {
    throw new Error(`The emailFrequency received is not defined`)
  }
  if (!subscriberUtils.isValidFrequency(emailFrequency)) {
    throw new Error(`The emailFrequency received is not supported`)
  }

  // First check if the emailSubscriptor already exists
  const subscriberExists = await subscriberUtils.emailSubscriptorExists(address, email)

  if (subscriberExists) {
    throw new AlreadySubscribedError()
  }

  // If the subscriber does not exists, create a new one and save it
  const subscriber = new Subscriber({
    email,
    address,
    emailFrequency
  })
  const savedSubscriber = await subscriber.save()
  return savedSubscriber
}

/**
 * Creates a new telegram subscriptor based on address, chatId and telegramFrequency
 * Throws exception if the subscriptor with that address and chatId already exists or if the params are not defined
 * Returns the createdSubscriber
 * @param chatId
 * @param address
 * @param telegramFrequency
 * @returns {Promise<subscriber>}
 */
const createTelegramSubscriptor = async (address, chatId, telegramFrequency) => {
  if (!address) {
    throw new Error(`The address received is not defined`)
  }
  if (!chatId) {
    throw new Error(`The chatId received is not defined`)
  }
  if (!telegramFrequency) {
    throw new Error(`The telegramFrequency received is not defined`)
  }
  if (!isValidFrequency(telegramFrequency)) {
    throw new Error(`The telegramFrequency received is not supported`)
  }

  // First check if the telegramSubscritor already exists
  const subscriberExists = await subscriberUtils.telegramSubscriptorExists(chatId)

  if (subscriberExists) {
    throw new AlreadySubscribedError()
  }

  // If the subscriber does not exists, create a new one and save it
  let subscriber = new Subscriber({
    address,
    telegramChatId: chatId,
    telegramFrequency
  })
  const savedSubscriber = await subscriber.save()
  return savedSubscriber
}

const removeTelegramSubscription = async (address, chatId) => {
  const subscriber = await Subscriber.findOne({ address: address, telegramChatId: chatId }).exec()
  if (!subscriber) {
    throw new NotSubscribedError()
  }
  const subscriptorRemoved = await subscriber.remove()
  return subscriptorRemoved
}

const findTelegramSubscription = async (address, chatId) => {
  const subscriber = await Subscriber.findOne({ address: address, telegramChatId: chatId }).exec()
  if (!subscriber) {
    throw new NotSubscribedError()
  }
  return subscriber
}

const getSubscriptorRole = async subscriptor => {
  const { getProtocolService } = require('./services/protocolService')
  const { getDelegatorService } = require('./services/delegatorService')
  const protocolService = getProtocolService()
  const delegatorService = getDelegatorService()

  let [constants, delegator] = await promiseRetry(retry => {
    return Promise.all([
      protocolService.getLivepeerDefaultConstants(),
      delegatorService.getDelegatorAccount(subscriptor.address)
    ]).catch(err => retry())
  })

  const { status, address, delegateAddress } = delegator

  // Detect role
  const role =
    delegator &&
    status === constants.DELEGATOR_STATUS.Bonded &&
    delegateAddress &&
    address.toLowerCase() === delegateAddress.toLowerCase()
      ? constants.ROLE.TRANSCODER
      : constants.ROLE.DELEGATOR
  return {
    role,
    constants,
    delegator
  }
}

/**
 * Checks that the last round in which the an email was sent, is bellow the frequency that the subscriber selected
 * For example: the subscriber has a frequency of 'daily', the last round in which the job sent an email is 1
 * The current round is 2 => an email must be sent. If the frequency was 'weekly' the email must be sent on the round 8.
 */
const shouldSubscriberReceiveEmailNotifications = (subscriber, currentRound) => {
  if (!subscriber) {
    throw new Error('No subscribers received on shouldSubscriberReceiveEmailNotifications()')
  }
  if (!currentRound) {
    throw new Error('No currentRound received on shouldSubscriberReceiveEmailNotifications()')
  }
  if (!subscriber.lastEmailSent) {
    return true
  }
  return shouldTheSubscriberReceiveNotification(
    currentRound,
    subscriber.lastEmailSent,
    subscriber.emailFrequency
  )
}

/**
 * Checks that the last round in which the a telegram was sent, is bellow the frequency that the subscriber selected
 * For example: the subscriber has a frequency of 'daily', the last round in which the job sent an email is 1
 * The current round is 2 => a telegram must be sent. If the frequency was 'weekly' the email must be sent on the round 8.
 */
const shouldSubscriberReceiveTelegramNotifications = (subscriber, currentRound) => {
  if (!subscriber) {
    throw new Error('No subscribers received on shouldSubscriberReceiveTelegramNotifications()')
  }
  if (!currentRound) {
    throw new Error('No currentRound received on shouldSubscriberReceiveTelegramNotifications()')
  }
  if (!subscriber.lastTelegramSent) {
    return true
  }
  return shouldTheSubscriberReceiveNotification(
    currentRound,
    subscriber.lastTelegramSent,
    subscriber.telegramFrequency
  )
}

const shouldTheSubscriberReceiveNotification = (
  currentRound,
  subscriberLastRoundNotificationReceived,
  subscriberFrequency
) => {
  if (!currentRound) {
    throw new Error('No currentRound received on shouldTheSubscriberReceiveNotification()')
  }
  if (!subscriberLastRoundNotificationReceived) {
    throw new Error(
      'No subscriberLastRoundNotificationReceived received on shouldTheSubscriberReceiveNotification()'
    )
  }
  if (!subscriberFrequency) {
    throw new Error('No subscriberFrequency received on shouldTheSubscriberReceiveNotification()')
  }
  if (!subscriberUtils.isValidFrequency(subscriberFrequency)) {
    throw new Error(
      'The frequency received is not valid on shouldTheSubscriberReceiveNotification()'
    )
  }
  const roundsBetweenLastNotificationSent = currentRound - subscriberLastRoundNotificationReceived
  switch (subscriberFrequency) {
    case DAILY_FREQUENCY: {
      if (roundsBetweenLastNotificationSent < 1) {
        return false
      }
      break
    }
    case WEEKLY_FREQUENCY: {
      if (roundsBetweenLastNotificationSent < 7) {
        return false
      }
      break
    }
  }
  return true
}

/**
 * Returns the list of all the subscribers which their role is delegator and their delegator associated
 * @returns {Promise<array>}
 */
const getSubscribersDelegatorsAndDelegator = async () => {
  console.log('[Subscribers-utils] - Returning list of subscribers delegators')
  const allSubscribers = await Subscriber.find({ email: { $ne: null } })
  const subscribersList = []
  for (let subscriber of allSubscribers) {
    const { role, constants, delegator } = await subscriberUtils.getSubscriptorRole(subscriber)
    if (role === constants.ROLE.DELEGATOR) {
      subscribersList.push({
        subscriber,
        delegator
      })
    }
  }
  console.log(`[Subscribers-utils] - Amount of subscribers delegators: ${subscribersList.length}`)
  return subscribersList
}

/**
 * Returns the list of all the subscribers which their role is delegator and their delegator associated
 * and are subscribed to telegram
 * @returns {Promise<array>}
 */
const getTelegramSubscribersDelegatorsAndDelegator = async () => {
  console.log('[Subscribers-utils] - Returning list of subscribers delegators')
  const allSubscribers = await Subscriber.find({
    email: { $ne: null },
    telegramChatId: { $ne: null }
  })
  const subscribersList = []
  for (let subscriber of allSubscribers) {
    const { role, constants, delegator } = await subscriberUtils.getSubscriptorRole(subscriber)
    if (role === constants.ROLE.DELEGATOR) {
      subscribersList.push({
        subscriber,
        delegator
      })
    }
  }
  console.log(`[Subscribers-utils] - Amount of subscribers delegators: ${subscribersList.length}`)
  return subscribersList
}

/**
 * Returns the list of all the subscribers which their role is delegate
 * @returns {Promise<array>}
 */
const getSubscribersDelegates = async () => {
  console.log('[Subscribers-utils] - Returning list of subscribers delegates')
  const allSubscribers = await Subscriber.find({ email: { $ne: null } })
  const subscribersList = []
  for (let subscriber of allSubscribers) {
    const { role, constants } = await subscriberUtils.getSubscriptorRole(subscriber)
    if (role === constants.ROLE.TRANSCODER) {
      subscribersList.push({
        subscriber
      })
    }
  }
  console.log(`[Subscribers-utils] - Amount of subscribers delegates: ${subscribersList.length}`)
  return subscribersList
}

/**
 * Returns the list of all the subscribers which their role is delegate and are subscribed in telegram
 * @returns {Promise<array>}
 */
const getTelegramSubscribersDelegates = async () => {
  console.log('[Subscribers-utils] - Returning list of subscribers delegates')
  const allSubscribers = await Subscriber.find({
    email: { $ne: null },
    telegramChatId: { $ne: null }
  })
  const subscribersList = []
  for (let subscriber of allSubscribers) {
    const { role, constants } = await subscriberUtils.getSubscriptorRole(subscriber)
    if (role === constants.ROLE.TRANSCODER) {
      subscribersList.push({
        subscriber
      })
    }
  }
  console.log(`[Subscribers-utils] - Amount of subscribers delegates: ${subscribersList.length}`)
  return subscribersList
}

const subscriberUtils = {
  emailSubscriptorExists,
  telegramSubscriptorExists,
  isValidFrequency,
  createEmailSubscriptor,
  createTelegramSubscriptor,
  removeTelegramSubscription,
  getSubscriptorRole,
  shouldTheSubscriberReceiveNotification,
  shouldSubscriberReceiveEmailNotifications,
  shouldSubscriberReceiveTelegramNotifications,
  getSubscribersDelegates,
  getSubscribersDelegatorsAndDelegator,
  getTelegramSubscribersDelegates,
  getTelegramSubscribersDelegatorsAndDelegator
}

module.exports = subscriberUtils
