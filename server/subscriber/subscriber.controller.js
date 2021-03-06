const { getDelegatorService } = require('../helpers/services/delegatorService')
const { getProtocolService } = require('../helpers/services/protocolService')
const { getDelegateService } = require('../helpers/services/delegateService')

const APIError = require('../helpers/APIError')
const httpStatus = require('http-status')
const Subscriber = require('./subscriber.model')
const Share = require('../share/share.model')
const moment = require('moment')
const _ = require('lodash')

const utils = require('../helpers/utils')

const subscriberUtils = require('../helpers/subscriberUtils')

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
    const { email, address, telegramFrequency, emailFrequency, telegramChatId } = req.body
    const count = await Subscriber.countDocuments({ address: address, email: email })
    if (count) {
      throw new APIError('Subscriptor already exist', httpStatus.UNPROCESSABLE_ENTITY, true)
    }

    const subscriber = new Subscriber({
      email: email,
      address: address,
      emailFrequency,
      telegramFrequency,
      telegramChatId: telegramChatId
    })

    // Create subscriber
    const savedSubscriber = await subscriber.save()
    // Send email notification promise
    let sendNotificationPromise = new Promise(async (resolve, reject) => {
      try {
        // Get round info
        const protocolService = getProtocolService()
        const delegateService = getDelegateService()
        const delegatorService = getDelegatorService()
        const currentRoundInfo = await protocolService.getCurrentRoundInfo()
        const currentRound = currentRoundInfo.id

        // Detect role
        const { constants, role, delegator } = await subscriberUtils.getSubscriptorRole(
          savedSubscriber
        )

        // Check if the delegate didRewardCall
        const delegateCalledReward = await delegateService.getDidDelegateCalledReward(
          delegator.delegateAddress
        )

        // Send email notification
        if (role === constants.ROLE.TRANSCODER) {
          const { sendDelegateNotificationEmail } = require('../helpers/sendDelegateEmail')
          await sendDelegateNotificationEmail(subscriber, delegateCalledReward, currentRound)
        }

        if (role === constants.ROLE.DELEGATOR) {
          const { sendDelegatorNotificationEmail } = require('../helpers/sendDelegatorEmail')

          let delegatorRoundReward = await Share.getDelegatorShareAmountOnRound(
            currentRound,
            delegator.address
          )
          delegatorRoundReward = utils.tokenAmountInUnits(delegatorRoundReward)
          // If there are no shares for that user, return the next delegatorReward as default
          if (!delegatorRoundReward || delegatorRoundReward === '0') {
            console.error(
              `[Notificate-Delegators] - share for round ${currentRound} of delegator ${delegator.address} not found, returning next reward`
            )
            delegatorRoundReward = await delegatorService.getDelegatorNextReward(delegator.address)
          }

          const delegatorTemplateData = {
            delegateCalledReward,
            delegatorRoundReward
          }

          await sendDelegatorNotificationEmail({
            subscriber,
            delegator,
            currentRoundInfo,
            constants,
            delegatorTemplateData,
            isNewSubscriber: true
          })
        }
        resolve()
      } catch (err) {
        console.error(err)
        reject()
      }
    })

    sendNotificationPromise.then(() => {})

    return res.json(savedSubscriber)
  } catch (e) {
    console.error(e)
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
    const { email, address, emailFrequency, telegramFrequency, telegramChatId } = req.body

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
    if (emailFrequency) {
      subscriber.emailFrequency = emailFrequency
    }
    if (telegramFrequency) {
      subscriber.telegramFrecuency = telegramFrequency
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
  console.log('[SubscriberController] - returning subscriber summary')
  try {
    const { addressWithoutSubscriber = null } = req.params

    const delegatorService = getDelegatorService()
    const protocolService = getProtocolService()
    const delegateService = getDelegateService()

    const subscriptor = {
      address: addressWithoutSubscriber
    }

    console.log('[SubscriberController] - fetching subscriptor data')
    let [balance, currentRoundInfo, subscriptorData] = await Promise.all([
      delegatorService.getDelegatorTokenBalance(addressWithoutSubscriber),
      protocolService.getCurrentRoundInfo(),
      subscriberUtils.getSubscriptorRole(subscriptor)
    ])
    console.log('[SubscriberController] - returned subscription data')

    // Detect role
    const { constants, role, delegator } = subscriptorData

    let returnData = {
      role,
      balance: utils.fromBaseUnit(balance)
    }

    // Check if the delegate didRewardCall
    const delegateCalledReward = await delegateService.getDidDelegateCalledReward(
      delegator.delegateAddress
    )

    let transcoder = await delegateService.getDelegate(delegator.delegateAddress)
    switch (role) {
      case constants.ROLE.TRANSCODER:
        // Format values of the delegate for the frontend
        transcoder.delegateCalledReward = delegateCalledReward
        transcoder.totalStakeInLPT = utils.fromBaseUnit(transcoder.totalStake)
        transcoder.pendingRewardCutInPercentage = utils.formatPercentage(
          transcoder.pendingRewardCut
        )
        transcoder.rewardCutInPercentage = utils.formatPercentage(transcoder.rewardCut)
        returnData = {
          ...returnData,
          transcoder
        }
        break
      case constants.ROLE.DELEGATOR:
        // Format values of the delegator for the frontend
        delegator.delegateCalledReward = delegateCalledReward
        delegator.delegateIsActive = transcoder.active
        delegator.totalStakeInLPT = utils.fromBaseUnit(delegator.totalStake)
        delegator.bondedAmountInLPT = utils.fromBaseUnit(delegator.bondedAmount)
        delegator.pendingRewardCutInPercentage = utils.formatPercentage(delegator.pendingRewardCut)
        delegator.rewardCutInPercentage = utils.formatPercentage(delegator.rewardCut)

        // Calculate rounds until bonded
        delegator.roundsUntilUnbonded = utils.getDelegatorRoundsUntilUnbonded({
          delegator,
          constants,
          currentRoundInfo
        })
        returnData = {
          ...returnData,
          delegator
        }
        break
      default:
        return
    }

    res.json(returnData)
  } catch (error) {
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

const stats = async (req, res, next) => {
  try {
    const stats = []
    const subscribers = await Subscriber.find()
    const delegatorService = getDelegatorService()

    const delegatorsPromises = []
    for (let subscriber of subscribers) {
      delegatorsPromises.push(delegatorService.getDelegatorAccount(subscriber.address))
    }
    const delegators = await Promise.all(delegatorsPromises)

    for (let subscriber of subscribers) {
      const sharesCount = await Share.countDocuments({ delegator: subscriber.address })
      const delegator = _.find(delegators, ['address', subscriber.address])

      let item = {
        address: subscriber.address,
        createdAt: moment(subscriber.createdAt).format('DD/MM/YYYY'),
        shares: sharesCount,
        status: delegator.status
      }
      stats.push(item)
    }

    res.json(stats)
  } catch (e) {
    next(e)
  }
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
  getByAddress,
  stats
}
