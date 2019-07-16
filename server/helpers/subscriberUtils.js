const Subscriber = require('../subscriber/subscriber.model')
const { NotSubscribedError, AlreadySubscribedError } = require('./JobsErrors')
const { VALID_SUBSCRIPTION_FREQUENCIES } = require('../../config/constants')
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

const subscriberUtils = {
  emailSubscriptorExists,
  telegramSubscriptorExists,
  isValidFrequency,
  createEmailSubscriptor,
  createTelegramSubscriptor,
  removeTelegramSubscription,
  getSubscriptorRole
}

module.exports = subscriberUtils
