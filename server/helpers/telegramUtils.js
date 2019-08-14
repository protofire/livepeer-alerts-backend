const Handlebars = require('handlebars')
const path = require('path')
const fs = require('fs')
const TelegramModel = require('../telegram/telegram.model')
const promiseRetry = require('promise-retry')
const config = require('../../config/config')
const moment = require('moment')
const Share = require('../share/share.model')
const { getDelegatorService } = require('./services/delegatorService')
const { getProtocolService } = require('./services/protocolService')
const { getDelegateService } = require('./services/delegateService')

const { NoAddressError } = require('../helpers/JobsErrors')
const { telegramSubscriptorExists, getSubscriptorRole } = require('../helpers/subscriberUtils')

const utils = require('../helpers/utils')

// Message const
const subscribe = 'Subscribe'
const unsubscribe = 'Unsubscribe'
const getInstantAlert = 'Get instant alert'

const getButtonsBySubscriptor = async chatId => {
  let buttons = []
  let welcomeText
  const checkSubscriptorExist = await telegramSubscriptorExists(chatId)
  if (checkSubscriptorExist) {
    buttons.push([unsubscribe])
    welcomeText = `Choose the following options to continue:
1. Unsubscribe for alerts
2. Get instant alert`
  } else {
    buttons.push([subscribe])
    welcomeText = `Welcome to Livepeer Tools, choose the following options to continue:
1. Subscribe for alerts
2. Get instant alert`
  }

  buttons.push([getInstantAlert])
  return { welcomeText, buttons }
}

/**
 * Receives a chatID and returns the address of the given subscriber
 * @param chatId
 * @returns {Promise<*>}
 */
const findAddressFromChatId = async chatId => {
  const telegramModel = await TelegramModel.findOne({ chatId: chatId }).exec()
  if (!telegramModel || !telegramModel.address) {
    throw new NoAddressError()
  }
  return telegramModel.address
}

const getTelegramBodyBySubscriptor = async subscriptor => {
  // Starting
  let { constants, delegator, role } = await getSubscriptorRole(subscriptor)
  const delegateService = getDelegateService()
  let data
  if (role === constants.ROLE.TRANSCODER) {
    // Check if the delegate didRewardCall
    const [delegateCalledReward] = await promiseRetry(retry => {
      return Promise.all([
        delegateService.getDidDelegateCalledReward(delegator.delegateAddress)
      ]).catch(err => retry())
    })

    // OK, is a delegate, let's send notifications
    data = getDelegateTelegramBody(delegateCalledReward)
  } else {
    // OK, is a delegator, let's send notifications
    data = await getDelegatorTelegramBody(subscriptor)
  }

  return data && data.body
}

const getDelegatorTelegramBody = async subscriber => {
  const { earningDecimals } = config
  const delegatorService = getDelegatorService()
  const protocolService = getProtocolService()
  const delegateService = getDelegateService()

  let [delegator, constants] = await promiseRetry(async retry => {
    return Promise.all([
      delegatorService.getDelegatorAccount(subscriber.address),
      protocolService.getLivepeerDefaultConstants()
    ]).catch(err => retry())
  })

  let body = {}
  switch (delegator.status) {
    case constants.DELEGATOR_STATUS.Bonded:
      // Check call reward
      let [currentRound] = await promiseRetry(async retry => {
        return Promise.all([protocolService.getCurrentRound()]).catch(err => retry())
      })

      // Check if call reward
      const callReward = await delegateService.getDidDelegateCalledReward(delegator.delegateAddress)

      // Open template file
      const filenameBonded = callReward
        ? '../notifications/telegram/delegate-claim-reward-call/notification-success.hbs'
        : '../notifications/telegram/delegate-claim-reward-call/notification-warning.hbs'
      const fileTemplateBonded = path.join(__dirname, filenameBonded)
      const sourceBonded = fs.readFileSync(fileTemplateBonded, 'utf8')

      let earningNextReturn = await Share.getDelegatorShareAmountOnRound(
        currentRound,
        delegator.address
      )
      earningNextReturn = utils.tokenAmountInUnits(earningNextReturn)
      // If there are no shares for that user, return the next delegatorReward as default
      if (!earningNextReturn || earningNextReturn === '0') {
        console.error(
          `[Telegram-utils] - share for round ${currentRound} of delegator ${delegator.address} not found, returning next reward`
        )
        earningNextReturn = await delegatorService.getDelegatorNextReward(delegator.address)
      }
      // Calculate earned lpt
      const lptEarned = utils.formatBalance(earningNextReturn, earningDecimals, 'wei')

      const dateYesterday = moment()
        .subtract(1, 'days')
        .startOf('day')
        .format('dddd DD, YYYY hh:mm A')

      const { delegateAddress } = delegator

      // Create telegram generator
      const templateBonded = Handlebars.compile(sourceBonded)
      body = templateBonded({
        transcoderAddressUrl: `https://explorer.livepeer.org/accounts/${delegateAddress}/transcoding`,
        transcoderAddress: utils.truncateStringInTheMiddle(delegateAddress),
        dateYesterday: dateYesterday,
        roundFrom: currentRound - 1,
        roundTo: currentRound,
        lptEarned: lptEarned,
        delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`
      })
      break
    case constants.DELEGATOR_STATUS.Unbonded:
      // Open template file
      const filenameUnbonded =
        '../notifications/telegram/delegate-claim-reward-call/notification-state-unbonded.hbs'
      const fileTemplateUnbonded = path.join(__dirname, filenameUnbonded)
      const sourceUnbonded = fs.readFileSync(fileTemplateUnbonded, 'utf8')

      // Create telegram generator
      const templateUnbonded = Handlebars.compile(sourceUnbonded)
      body = templateUnbonded()
      break
    case constants.DELEGATOR_STATUS.Pending:
      // Open template file
      const filenamePending =
        '../notifications/telegram/delegate-claim-reward-call/notification-state-pending.hbs'
      const fileTemplatePending = path.join(__dirname, filenamePending)
      const sourcePending = fs.readFileSync(fileTemplatePending, 'utf8')

      // Create telegram generator
      const templatePending = Handlebars.compile(sourcePending)
      body = templatePending({
        delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`
      })
      break

    case constants.DELEGATOR_STATUS.Unbonding:
      // Open template file
      const filenameUnbonding =
        '../notifications/telegram/delegate-claim-reward-call/notification-state-unbonding.hbs'
      const fileTemplateUnbonding = path.join(__dirname, filenameUnbonding)
      const sourceUnbonding = fs.readFileSync(fileTemplateUnbonding, 'utf8')

      // Create telegram generator
      const templateUnbonding = Handlebars.compile(sourceUnbonding)
      const [currentRoundInfo] = await promiseRetry(retry => {
        return Promise.all([protocolService.getCurrentRoundInfo()]).catch(err => retry())
      })

      const roundsUntilUnbonded = utils.getDelegatorRoundsUntilUnbonded({
        delegator,
        constants,
        currentRoundInfo
      })

      body = templateUnbonding({
        roundsUntilUnbonded
      })
      break
    default:
      return
  }

  return {
    body
  }
}

const getDelegateTelegramBody = delegateCalledReward => {
  const filename = delegateCalledReward
    ? '../notifications/telegram/delegate-did-reward-call/notification-success.hbs'
    : '../notifications/telegram/delegate-did-reward-call/notification-warning.hbs'
  const fileTemplate = path.join(__dirname, filename)
  const source = fs.readFileSync(fileTemplate, 'utf8')

  // Create telegram body
  const template = Handlebars.compile(source)
  const body = template()
  return {
    body
  }
}

const getDelegatorBondingPeriodHasEndedTelegramBody = subscriber => {
  const filename =
    '../notifications/telegram/delegator-bonding-period-has-ended/notification-bonding-period-has-ended.hbs'
  const fileTemplate = path.join(__dirname, filename)
  const source = fs.readFileSync(fileTemplate, 'utf8')

  // Create telegram body
  const templateBonded = Handlebars.compile(source)

  const body = templateBonded({
    delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`
  })

  return {
    body
  }
}

const telegramUtils = {
  subscribe,
  unsubscribe,
  getInstantAlert,
  getButtonsBySubscriptor,
  findAddressFromChatId,
  getTelegramBodyBySubscriptor,
  getDelegatorTelegramBody,
  getDelegateTelegramBody,
  getDelegatorBondingPeriodHasEndedTelegramBody
}

module.exports = telegramUtils
