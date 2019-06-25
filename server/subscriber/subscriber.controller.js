const { getDelegatorService } = require('../helpers/services/delegatorService')
const { getProtocolService } = require('../helpers/services/protocolService')
const { getDelegateService } = require('../helpers/services/delegateService')

const APIError = require('../helpers/APIError')
const httpStatus = require('http-status')
const Subscriber = require('./subscriber.model')
const Earning = require('../earning/earning.model')
const {
  fromBaseUnit,
  formatPercentage,
  getDelegatorRoundsUntilUnbonded
} = require('../helpers/utils')

/**
 * Load subscriber and append to req.
 */
const loadBySubscriberId = (req, res, next, subscriberId) => {
  Subscriber.get(subscriberId)
    .then(subscriber => {
      req.subscriber = subscriber // eslint-disable-line no-param-reassign
      return next()
    })
    .catch(e => next(e))
}

/**
 * Load subscriber by address and append to req.
 */
const loadByAddress = (req, res, next, address) => {
  Subscriber.getByAddress(address)
    .then(subscriber => {
      req.subscriber = subscriber // eslint-disable-line no-param-reassign
      return next()
    })
    .catch(e => next(e))
}

/**
 * Get subscriber
 * @returns {Subscriber}
 */
const get = (req, res) => {
  return res.json(req.subscriber)
}

/**
 * Create new subscriber
 * @property {string} req.body.username - The username of subscriber.
 * @returns {Subscriber}
 */
const create = async (req, res, next) => {
  try {
    const { email, address, frequency, telegramChatId } = req.body
    const count = await Subscriber.countDocuments({ address: address, email: email })
    if (count) {
      throw new APIError('Subscriptor already exist', httpStatus.UNPROCESSABLE_ENTITY, true)
    }

    const subscriber = new Subscriber({
      email: email,
      address: address,
      frequency: frequency,
      telegramChatId: telegramChatId
    })

    // Create subscriber
    const savedSubscriber = await subscriber.save()

    // Create earning
    Earning.save(savedSubscriber)

    const delegatorService = getDelegatorService()
    const protocolService = getProtocolService()
    const delegateService = getDelegateService()
    // Send email notification
    let [delegator, constants, currentRoundInfo] = await Promise.all([
      delegatorService.getDelegatorAccount(address),
      protocolService.getLivepeerDefaultConstants(),
      protocolService.getCurrentRoundInfo()
    ])

    let transcoderAccount = await delegateService.getDelegate(delegator.delegateAddress)

    // Detect role
    let data = {
      role:
        delegator &&
        delegator.status == constants.DELEGATOR_STATUS.Bonded &&
        delegator.delegateAddress &&
        delegator.address.toLowerCase() === delegator.delegateAddress.toLowerCase()
          ? constants.ROLE.TRANSCODER
          : constants.ROLE.DELEGATOR
    }

    // Check if transcoder call reward
    let delegateCalledReward =
      transcoderAccount && transcoderAccount.lastRewardRound === currentRoundInfo.id

    if (data.role === constants.ROLE.TRANSCODER) {
      const { sendNotificationEmail } = require('../helpers/sendEmailDidRewardCall')
      const data = {
        subscriber: savedSubscriber,
        delegateCalledReward: delegateCalledReward
      }
      await sendNotificationEmail(data)
    }

    if (data.role === constants.ROLE.DELEGATOR) {
      const { sendNotificationEmail } = require('../helpers/sendEmailClaimRewardCall')
      await sendNotificationEmail(savedSubscriber, true)
    }

    return res.json(savedSubscriber)
  } catch (e) {
    next(e)
  }
}

/**
 * Update existing subscriber
 * @property {string} req.body.username - The username of subscriber.
 * @returns {Subscriber}
 */
const update = async (req, res, next) => {
  try {
    const subscriber = req.subscriber
    const { email, address, frequency, telegramChatId } = req.body

    // Check for existing subscriber
    const differentEmail = email !== subscriber.email
    const differentAddress = address !== subscriber.address

    // Check for existing subscriptor
    if (differentEmail || differentAddress) {
      const count = await Subscriber.countDocuments({ address: address, email: email })
      if (count) {
        throw new APIError('Subscriptor already exist', httpStatus.UNPROCESSABLE_ENTITY, true)
      }
    }

    // Set subscriber properties
    if (email) {
      subscriber.email = email
    }
    if (address) {
      subscriber.address = address
    }
    if (frequency) {
      subscriber.frequency = frequency
    }
    if (telegramChatId) {
      subscriber.telegramChatId = telegramChatId
    }

    const savedSubscriber = await subscriber.save()
    res.json(savedSubscriber)
  } catch (e) {
    next(e)
  }
}

/**
 * Get subscribers list.
 * @property {number} req.query.skip - Number of subscribers to be skipped.
 * @property {number} req.query.limit - Limit number of subscribers to be returned.
 * @returns {Subscriber[]}
 */
const list = async (req, res, next) => {
  try {
    const { limit = 50, skip = 0 } = req.query
    const subscribers = await Subscriber.list({ limit, skip })
    res.json(subscribers)
  } catch (e) {
    next(e)
  }
}

/**
 * Delete subscriber.
 * @returns {Subscriber}
 */
const remove = async (req, res, next) => {
  try {
    const subscriber = req.subscriber
    const deletedSubscriber = await subscriber.remove()
    res.json(deletedSubscriber)
  } catch (e) {
    next(e)
  }
}

/**
 * Activate subscriber.
 * @returns {Subscriber}
 */
const activate = async (req, res, next) => {
  try {
    const activatedCode = req.body.activatedCode
    const subscriber = await Subscriber.getByActivatedCode(activatedCode)

    if (!subscriber) {
      throw new APIError(`Subscriptor doesn't exist`, httpStatus.NOT_FOUND, true)
    }

    subscriber.activated = 1
    const savedSubscriber = await subscriber.save()
    res.json(savedSubscriber)
  } catch (e) {
    next(e)
  }
}

/**
 * Summary information
 * @returns {Array}
 */
const summary = async (req, res, next) => {
  try {
    const { addressWithoutSubscriber = null } = req.params

    const delegatorService = getDelegatorService()
    const protocolService = getProtocolService()
    const delegateService = getDelegateService()

    let [delegator, balance, constants, currentRoundInfo] = await Promise.all([
      delegatorService.getDelegatorAccount(addressWithoutSubscriber),
      delegatorService.getDelegatorTokenBalance(addressWithoutSubscriber),
      protocolService.getLivepeerDefaultConstants(),
      protocolService.getCurrentRoundInfo()
    ])

    let transcoderAccount = await delegateService.getDelegate(delegator.delegateAddress)

    // Detect role
    let data = {
      role:
        delegator &&
        delegator.status == constants.DELEGATOR_STATUS.Bonded &&
        delegator.delegateAddress &&
        delegator.address.toLowerCase() === delegator.delegateAddress.toLowerCase()
          ? constants.ROLE.TRANSCODER
          : constants.ROLE.DELEGATOR
    }

    // Check if transcoder call reward
    let delegateCalledReward =
      transcoderAccount && transcoderAccount.lastRewardRound === currentRoundInfo.id

    switch (data.role) {
      case constants.ROLE.TRANSCODER:
        // Calculate some values for transcoder
        transcoderAccount.delegateCalledReward = delegateCalledReward
        transcoderAccount.totalStakeInLPT = fromBaseUnit(transcoderAccount.totalStake)
        transcoderAccount.pendingRewardCutInPercentage = formatPercentage(
          transcoderAccount.pendingRewardCut
        )
        transcoderAccount.rewardCutInPercentage = formatPercentage(transcoderAccount.rewardCut)
        data.transcoder = transcoderAccount
        break
      case constants.ROLE.DELEGATOR:
        // Calculate some values for delegator
        delegator.delegateCalledReward = delegateCalledReward
        delegator.totalStakeInLPT = fromBaseUnit(delegator.totalStake)
        delegator.bondedAmountInLPT = fromBaseUnit(delegator.bondedAmount)
        delegator.pendingRewardCutInPercentage = formatPercentage(delegator.pendingRewardCut)
        delegator.rewardCutInPercentage = formatPercentage(delegator.rewardCut)

        // Calculate rounds until bonded
        delegator.roundsUntilUnbonded = getDelegatorRoundsUntilUnbonded({
          delegator,
          constants,
          currentRoundInfo
        })

        data.delegator = delegator
        break
      default:
        return
    }

    data.balance = fromBaseUnit(balance)

    res.json(data)
  } catch (error) {
    console.error('eee ', error)
    next(error)
  }
}

/**
 * Subscriber by address
 * @returns {Array}
 */
const getByAddress = (req, res, next) => {
  return res.json(req.subscriber)
}

module.exports = {
  loadBySubscriberId,
  loadByAddress,
  get,
  create,
  update,
  list,
  remove,
  activate,
  summary,
  getByAddress
}
