const config = require('../../config/config')
const { getTelegramDidRewardCallBody, getButtonsBySubscriptor } = require('./telegramUtils')

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

      console.log(
        `[Telegram bot] - Telegram sent to chatId ${chatId} successfully. Body of the message: ${body}`
      )
      bot = null
    } catch (err) {
      console.error(err)
    }
  }
  return
}

const sendNotificationTelegram = async data => {
  const { subscriber } = data

  const { body } = getTelegramDidRewardCallBody(subscriber.delegateCalledReward)

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
