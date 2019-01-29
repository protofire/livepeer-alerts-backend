const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const config = require('../../config/config')

const { getButtonsBySubscriptor } = require('./utils')

const sendTelegramClaimRewardCall = async data => {
  const { chatId, address, body } = data

  if (!['test'].includes(config.env)) {
    try {
      const TelegramBot = require('node-telegram-bot-api')
      const { telegramBotKey } = config
      let bot = new TelegramBot(telegramBotKey)
      const { buttons } = await getButtonsBySubscriptor({ address, chatId })
      await bot.sendMessage(chatId, body, {
        reply_markup: {
          keyboard: buttons
        },
        parse_mode: 'HTML'
      })

      console.log(`Telegram sended to chatId ${chatId} successfully. Body of the message: ${body}`)
      bot = null
    } catch (err) {
      console.log(err)
    }
  }
  return
}

const sendNotificationTelegram = async data => {
  const { subscriber, delegateCalledReward } = data

  // Open template file
  const filename = delegateCalledReward
    ? '../notifications/telegram/transcoder-did-reward-call/notification-success.hbs'
    : '../notifications/telegram/transcoder-did-reward-call/notification-warning.hbs'
  const fileTemplate = path.join(__dirname, filename)
  const source = fs.readFileSync(fileTemplate, 'utf8')

  // Create telegram body
  const template = Handlebars.compile(source)
  const body = template()

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

module.exports = { sendNotificationTelegram }