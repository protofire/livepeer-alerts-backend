const config = require('../../config/config')
const { getTelegramClaimRewardCallBody, getButtonsBySubscriptor } = require('./telegramUtils')

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
        `[Telegram bot] - Telegram sent to chatId ${chatId} successfully. Body of the message: ${body}`
      )
    } catch (err) {
      console.error(err)
    }
  }
  return
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
