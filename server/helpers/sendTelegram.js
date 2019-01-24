const TelegramBot = require('node-telegram-bot-api')
const stripTags = require('striptags')
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
  getLivepeerCurrentRoundInfo
} = require('./livepeerAPI')
const {
  getButtonsBySubscriptor,
  truncateStringInTheMiddle,
  getEarningParams,
  formatBalance
} = require('./utils')

const { telegramBotKey } = config

const sendTelegram = async data => {
  const { chatId, address, body } = data

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(telegramBotKey, { polling: true })

  if (!['test'].includes(config.env)) {
    try {
      const { buttons } = await getButtonsBySubscriptor({ address, chatId })
      await bot.sendMessage(chatId, body, {
        reply_markup: {
          keyboard: buttons
        },
        parse_mode: 'HTML'
      })
      console.log(`Telegram sended to chatId ${chatId} successfully. Body of the message: ${body}`)
    } catch (err) {
      console.log(err)
    }
  }
  return
}

const getTelegramBody = async subscriber => {
  let delegatorAccount, transcoderAccount, currentRoundObject
  await promiseRetry(async retry => {
    // Get delegator Account
    try {
      delegatorAccount = await getLivepeerDelegatorAccount(subscriber.address)
      if (delegatorAccount && delegatorAccount.status == 'Bonded') {
        // Get transcoder account
        transcoderAccount = await getLivepeerTranscoderAccount(delegatorAccount.delegateAddress)
        currentRoundObject = await getLivepeerCurrentRoundInfo()
      }
    } catch (err) {
      retry()
    }
  })
  console.log(`Delegator account ${JSON.stringify(delegatorAccount)}`)
  console.log(`Transcoder account ${JSON.stringify(transcoderAccount)}`)
  console.log(`Current round ${JSON.stringify(currentRoundObject)}`)

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
    ? '../notifications/telegram/templates/notification_success.hbs'
    : '../notifications/telegram/templates/notification_warning.hbs'
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
  const { body } = await getTelegramBody(subscriber)

  // Create earning
  if (createEarningOnSend) {
    const Earning = require('../earning/earning.model')
    await Earning.save(subscriber)
  }

  // Send telegram
  await sendTelegram({
    chatId: subscriber.telegramChatId,
    address: subscriber.address,
    body: body
  })

  // Save last telegram sent
  subscriber.lastTelegramSent = Date.now()
  return await subscriber.save({ validateBeforeSave: false })
}

module.exports = { sendNotificationTelegram, getTelegramBody }
