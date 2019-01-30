// Create a bot that uses 'polling' to fetch new updates
const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const promiseRetry = require('promise-retry')
const config = require('../../config/config')
const moment = require('moment')
const { NoAlertToSendError } = require('./JobsErrors')

const {
  getLivepeerDelegatorAccount,
  getLivepeerTranscoderAccount,
  getLivepeerCurrentRoundInfo,
  getLivepeerDefaultConstants
} = require('./livepeerAPI')
const {
  getButtonsBySubscriptor,
  truncateStringInTheMiddle,
  getEarningParams,
  formatBalance
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
      console.log(err)
    }
  }
  return
}

const getTelegramBodyParams = async subscriber => {
  let delegatorAccount, transcoderAccount, currentRoundObject, constants
  await promiseRetry(async retry => {
    // Get delegator Account
    try {
      delegatorAccount = await getLivepeerDelegatorAccount(subscriber.address)
      constants = await getLivepeerDefaultConstants()

      if (delegatorAccount && delegatorAccount.status == constants.DELEGATOR_STATUS.Bonded) {
        // Get transcoder account
        transcoderAccount = await getLivepeerTranscoderAccount(delegatorAccount.delegateAddress)
        currentRoundObject = await getLivepeerCurrentRoundInfo()
      }
    } catch (err) {
      retry()
    }
  })
  console.log(`[Telegram bot] - Delegator account ${JSON.stringify(delegatorAccount)}`)
  console.log(`[Telegram bot] - Transcoder account ${JSON.stringify(transcoderAccount)}`)
  console.log(`[Telegram bot] - Current round ${JSON.stringify(currentRoundObject)}`)

  if (!delegatorAccount || !transcoderAccount || !currentRoundObject) {
    throw new NoAlertToSendError({ status: delegatorAccount.status })
  }

  const currentRound = currentRoundObject.id
  const { roundFrom, roundTo, earningFromRound, earningToRound } = await getEarningParams({
    transcoderAccount,
    currentRound,
    subscriber
  })

  // Check if call reward
  const callReward = transcoderAccount.lastRewardRound === currentRound

  // Calculate earned lpt
  const lptEarned = formatBalance(earningToRound, 2)

  const dateYesterday = moment()
    .subtract(1, 'days')
    .startOf('day')
    .format('dddd DD, YYYY hh:mm A')

  // Open template file
  const filename = callReward
    ? '../notifications/telegram/transcoder-claim-reward-call/notification-success.hbs'
    : '../notifications/telegram/transcoder-claim-reward-call/notification-warning.hbs'
  const fileTemplate = path.join(__dirname, filename)
  const source = fs.readFileSync(fileTemplate, 'utf8')

  const { delegateAddress, totalStake } = delegatorAccount

  // Create telegram generator
  const template = Handlebars.compile(source)
  const body = template({
    transcoderAddressUrl: `https://explorer.livepeer.org/accounts/${delegateAddress}/transcoding`,
    transcoderAddress: truncateStringInTheMiddle(delegateAddress),
    dateYesterday: dateYesterday,
    roundFrom: roundFrom,
    roundTo: roundTo,
    lptEarned: lptEarned,
    delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`
  })

  return {
    dateYesterday,
    lptEarned,
    roundFrom,
    roundTo,
    callReward,
    totalStake,
    currentRound,
    body,
    delegateAddress
  }
}

const sendNotificationTelegram = async (subscriber, createEarningOnSend = false) => {
  // Get telegram body
  const { body } = await getTelegramBodyParams(subscriber)

  // Create earning
  if (createEarningOnSend) {
    const Earning = require('../earning/earning.model')
    await Earning.save(subscriber)
  }

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

module.exports = { sendNotificationTelegram, getTelegramBodyParams }
