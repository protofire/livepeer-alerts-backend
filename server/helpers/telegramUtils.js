const Handlebars = require('handlebars')
const path = require('path')
const fs = require('fs')
const moment = require('moment')
const TelegramModel = require('../telegram/telegram.model')
const promiseRetry = require('promise-retry')

const { getDelegatorService } = require('./services/delegatorService')
const { getProtocolService } = require('./services/protocolService')

const { NoAddressError } = require('../helpers/JobsErrors')
const { telegramSubscriptorExists, getSubscriptorRole } = require('../helpers/subscriberUtils')

const {
  truncateStringInTheMiddle,
  formatBalance,
  getDelegatorRoundsUntilUnbonded,
  getDidDelegateCalledReward
} = require('../helpers/utils')

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

  let data
  if (role === constants.ROLE.TRANSCODER) {
    // Check if the delegate didRewardCall
    const [delegateCalledReward] = await promiseRetry(retry => {
      return Promise.all([getDidDelegateCalledReward(delegator.delegateAddress)]).catch(err =>
        retry()
      )
    })

    // OK, is a delegate, let's send notifications
    data = getTelegramDidRewardCallBody({ delegateCalledReward })
  } else {
    // OK, is a delegator, let's send notifications
    data = await getTelegramClaimRewardCallBody(subscriptor)
  }

  return data && data.body
}

const getTelegramClaimRewardCallBody = async subscriber => {
  const { earningDecimals } = config
  const delegatorService = getDelegatorService()
  const protocolService = getProtocolService()

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
      const callReward = await getDidDelegateCalledReward(delegator.delegateAddress)
      // Open template file
      const filenameBonded = callReward
        ? '../notifications/telegram/delegate-claim-reward-call/notification-success.hbs'
        : '../notifications/telegram/delegate-claim-reward-call/notification-warning.hbs'
      const fileTemplateBonded = path.join(__dirname, filenameBonded)
      const sourceBonded = fs.readFileSync(fileTemplateBonded, 'utf8')

      const earningNextReturn = await delegatorService.getDelegatorNextReward(delegator.address)

      // Calculate earned lpt
      const lptEarned = formatBalance(earningNextReturn, earningDecimals, 'wei')

      const dateYesterday = moment()
        .subtract(1, 'days')
        .startOf('day')
        .format('dddd DD, YYYY hh:mm A')

      const { delegateAddress } = delegator

      // Create telegram generator
      const templateBonded = Handlebars.compile(sourceBonded)
      body = templateBonded({
        transcoderAddressUrl: `https://explorer.livepeer.org/accounts/${delegateAddress}/transcoding`,
        transcoderAddress: truncateStringInTheMiddle(delegateAddress),
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

      const roundsUntilUnbonded = getDelegatorRoundsUntilUnbonded({
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

const getTelegramDidRewardCallBody = delegateCalledReward => {
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

const telegramUtils = {
  subscribe,
  unsubscribe,
  getInstantAlert,
  getButtonsBySubscriptor,
  findAddressFromChatId,
  getTelegramBodyBySubscriptor,
  getTelegramClaimRewardCallBody,
  getTelegramDidRewardCallBody
}

module.exports = telegramUtils