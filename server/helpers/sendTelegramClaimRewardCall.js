const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const promiseRetry = require('promise-retry')
const config = require('../../config/config')
const moment = require('moment')

const { getDelegatorService } = require('./services/delegatorService')
const { getProtocolService } = require('./services/protocolService')
const { getLivepeerTranscoderAccount } = require('./sdk/delegate')

const {
  getButtonsBySubscriptor,
  truncateStringInTheMiddle,
  formatBalance,
  getDelegatorRoundsUntilUnbonded
} = require('./utils')

const sendTelegramClaimRewardCall = async data => {
  const { chatId, address, body } = data

  const TelegramBot = require('node-telegram-bot-api')
  const { telegramBotKey } = config
  const bot = new TelegramBot(telegramBotKey)

  if (!['test'].includes(config.env)) {
    try {
      const { buttons } = await getButtonsBySubscriptor({ address, chatId })
      await bot.sendMessage(chatId, body, {
        reply_markup: {
          keyboard: buttons
        },
        parse_mode: 'HTML'
      })
      console.log(
        `[Telegram bot] - Telegram sended to chatId ${chatId} successfully. Body of the message: ${body}`
      )
    } catch (err) {
      console.error(err)
    }
  }
  return
}

const getTelegramClaimRewardCallBody = async subscriber => {
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
      let [transcoderAccount, currentRound] = await promiseRetry(async retry => {
        return Promise.all([
          getLivepeerTranscoderAccount(delegator.delegateAddress),
          protocolService.getCurrentRound()
        ]).catch(err => retry())
      })

      // Check if call reward
      const callReward = transcoderAccount && transcoderAccount.lastRewardRound === currentRound
      // Open template file
      const filenameBonded = callReward
        ? '../notifications/telegram/delegate-claim-reward-call/notification-success.hbs'
        : '../notifications/telegram/delegate-claim-reward-call/notification-warning.hbs'
      const fileTemplateBonded = path.join(__dirname, filenameBonded)
      const sourceBonded = fs.readFileSync(fileTemplateBonded, 'utf8')

      const earningNextReturn = await delegatorService.getDelegatorNextReward(delegator.address)

      // Calculate earned lpt
      const lptEarned = formatBalance(earningNextReturn, 2, 'wei')

      const dateYesterday = moment()
        .subtract(1, 'days')
        .startOf('day')
        .format('dddd DD, YYYY hh:mm A')

      const { delegateAddress, totalStake } = delegator

      // Create telegram generator
      const templateBonded = Handlebars.compile(sourceBonded)
      body = templateBonded({
        transcoderAddressUrl: `https://explorer.livepeer.org/accounts/${delegateAddress}/transcoding`,
        transcoderAddress: truncateStringInTheMiddle(delegateAddress),
        dateYesterday: dateYesterday,
        roundFrom: currentRound,
        roundTo: currentRound + 1,
        lptEarned: lptEarned,
        delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${
          subscriber.address
        }/delegating`
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

const sendNotificationTelegram = async subscriber => {
  // Get telegram body
  const data = await getTelegramClaimRewardCallBody(subscriber)

  if (!data) {
    return
  }

  const { body } = data

  // Send telegram
  await sendTelegramClaimRewardCall({
    chatId: subscriber.telegramChatId,
    address: subscriber.address,
    body: body
  })

  // Save last telegram sent
  subscriber.lastTelegramSent = Date.now()
  return await subscriber.save({ validateBeforeSave: false })
}

module.exports = { sendNotificationTelegram, getTelegramClaimRewardCallBody }
