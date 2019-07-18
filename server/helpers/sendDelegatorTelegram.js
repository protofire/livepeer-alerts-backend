const config = require('../../config/config')
const { getDelegatorTelegramBody, getButtonsBySubscriptor } = require('./telegramUtils')

const sendDelegatorTelegram = async (chatId, address, body) => {
  if (!['test'].includes(config.env)) {
    try {
      const TelegramBot = require('node-telegram-bot-api')
      const { telegramBotKey } = config
      let bot = new TelegramBot(telegramBotKey)
      const { buttons } = await getButtonsBySubscriptor(chatId)
      await bot.sendMessage(chatId, body, {
        reply_markup: {
          keyboard: buttons
        },
        parse_mode: 'HTML'
      })

      console.log(
        `[Telegram bot] - Telegram sent to chatId ${chatId} successfully. Body of the message: ${body}`
      )
      bot = null
    } catch (err) {
      console.error(`[Telegram bot] - Error on sendDelegatorTelegram(): ${err}`)
    }
  }
  return
}

const sendDelegatorNotificationTelegram = async subscriber => {
  const { body } = await getDelegatorTelegramBody(subscriber)
  const { telegramChatId, address } = subscriber
  // Send telegram
  await sendDelegatorTelegram(telegramChatId, address, body)

  // Save last telegram sent
  subscriber.lastTelegramSent = Date.now()
  return await subscriber.save()
}

module.exports = { sendDelegatorNotificationTelegram }
