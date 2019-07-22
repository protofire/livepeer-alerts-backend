const config = require('../../config/config')
const { getDelegateTelegramBody, getButtonsBySubscriptor } = require('./telegramUtils')

const sendDelegateTelegram = async (chatId, address, body) => {
  const TelegramBot = require('node-telegram-bot-api')
  const { telegramBotKey } = config
  const bot = new TelegramBot(telegramBotKey)

  if (!['test'].includes(config.env)) {
    try {
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
    } catch (err) {
      console.error(`[Telegram bot] - Error on sendDelegateTelegram(): ${err}`)
    }
  }
  return
}

const sendDelegateNotificationTelegram = async subscriber => {
  // Get telegram body
  const data = await getDelegateTelegramBody(subscriber)
  if (!data) {
    return
  }

  const { body } = data

  const { telegramChatId, address } = subscriber
  // Send telegram
  await sendDelegateTelegram(telegramChatId, address, body)

  // Save last telegram sent
  subscriber.lastTelegramSent = Date.now()
  return await subscriber.save()
}

const delegateTelegramUtils = {
  sendDelegateNotificationTelegram
}

module.exports = delegateTelegramUtils
