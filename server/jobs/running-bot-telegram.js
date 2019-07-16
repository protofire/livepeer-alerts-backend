const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const TelegramBot = require('node-telegram-bot-api')
const path = require('path')
const mongoose = require('../../config/mongoose')
const config = require('../../config/config')

const {
  getButtonsBySubscriptor,
  findAddressFromChatId,
  getTelegramBodyBySubscriptor,
  getInstantAlert,
  subscribe,
  unsubscribe
} = require('../helpers/telegramUtils')
const {
  createTelegramSubscriptor,
  removeTelegramSubscription
} = require('../helpers/subscriberUtils')

const { NoAddressError } = require('../helpers/JobsErrors')
const TelegramModel = require('../telegram/telegram.model')
const SubscriberModel = require('../subscriber/subscriber.model')

const { telegramBotKey } = config

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramBotKey, { polling: true })

// Start process
bot.onText(/^\/start ([\w-]+)$/, async (msg, [, command]) => {
  const telegramChatId = msg.chat.id
  try {
    const address = command

    // Validate existing address
    if (!address) {
      throw new NoAddressError()
    }

    // Save address an chatId
    const subscriptorData = {
      address: address,
      chatId: telegramChatId
    }

    // Must exist only one subscriber object
    let subscriberObject = await SubscriberModel.findOne({ telegramChatId }).exec()
    if (subscriberObject) {
      subscriberObject.address = address
      await subscriberObject.save()
    }

    // Clean all existing telegrams objects
    await TelegramModel.deleteMany({ chatId: telegramChatId })

    // Create new telegram object
    const telegramModel = new TelegramModel(subscriptorData)
    await telegramModel.save()

    const { buttons, welcomeText } = await getButtonsBySubscriptor(subscriptorData)

    // Buttons setup for telegram
    bot
      .sendMessage(telegramChatId, welcomeText, {
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true
        }
      })
      .catch(function(error) {
        if (error.response && error.response.statusCode === 403) {
          console.log(`[Telegram bot] - BOT blocked by the user with chatId ${telegramChatId}`)
        }
      })
  } catch (e) {
    bot.sendMessage(telegramChatId, e.message)
  }
})

// Capture messages
bot.on('message', async msg => {
  const telegramChatId = msg.chat.id
  // Subscribe process
  if (msg.text.toString().indexOf(subscribe) === 0) {
    await subscribeTelegramCallBack(bot, telegramChatId)
  }

  // Unsubscribe message
  if (msg.text.toString().indexOf(unsubscribe) === 0) {
    await unsubscribeTelegramCallBack(bot, telegramChatId)
  }

  // Get instant alert
  if (msg.text.toString().indexOf(getInstantAlert) === 0) {
    await getInstantAlertTelegramCallBack(bot, telegramChatId)
  }
})

// Action callbacks
const getInstantAlertTelegramCallBack = async (bot, telegramChatId) => {
  if (!bot) {
    return
  }
  if (!telegramChatId) {
    return
  }
  try {
    console.log(`[Telegram bot] - Sending instant alert to ${telegramChatId}`)
    const address = await findAddressFromChatId(telegramChatId)

    bot.sendMessage(telegramChatId, `Waiting for alert notification...`)

    const body = await getTelegramBodyBySubscriptor({ address, telegramChatId })

    const { buttons, welcomeText } = await getButtonsBySubscriptor(telegramChatId)

    // Buttons resetup for telegram, only show subscribe and get instant alert
    bot.sendMessage(telegramChatId, body, {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: true
      },
      parse_mode: 'HTML'
    })
    console.log(`[Telegram bot] - Telegram sended to chatId ${telegramChatId} successfully`)
  } catch (e) {
    console.error(e)
    bot.sendMessage(
      telegramChatId,
      'There was a problem when you try to get the instant alert, try it again later'
    )
  }
}

const unsubscribeTelegramCallBack = async (bot, telegramChatId) => {
  if (!bot) {
    return
  }
  if (!telegramChatId) {
    return
  }
  try {
    console.log(`[Telegram bot] - Unsubscribe user: ${telegramChatId}`)
    const address = await findAddressFromChatId(telegramChatId)

    bot.sendMessage(telegramChatId, `Waiting for unsubscription...`)

    // Remove subscribe
    await removeTelegramSubscription(address, telegramChatId)
    console.log(
      `[Telegram bot] - Subscriptor removed successfully - Address ${address} - ChatId: ${telegramChatId}`
    )

    const { buttons, welcomeText } = await getButtonsBySubscriptor(telegramChatId)

    // Buttons resetup for telegram, only show subscribe and get instant alert
    bot.sendMessage(
      telegramChatId,
      `The unsubscription was successful, your wallet address is ${address}.`,
      {
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    )
    console.log(`[Telegram bot] - Telegram sended to chatId ${telegramChatId} successfully`)
  } catch (e) {
    console.error(e)
    bot.sendMessage(
      telegramChatId,
      'There was a problem when you try to unsubscribe, try it again later'
    )
  }
}

const subscribeTelegramCallBack = async (bot, telegramChatId) => {
  if (!bot) {
    return
  }
  if (!telegramChatId) {
    return
  }
  try {
    const address = await findAddressFromChatId(telegramChatId)
    console.log(`[Telegram bot] - Subscribe user: ${telegramChatId}, address : ${address}`)

    bot.sendMessage(telegramChatId, `Waiting for subscription...`)

    // Subscribe user
    const subscriptor = await createTelegramSubscriptor(address, telegramChatId, 'daily')
    console.log(
      `[Telegram bot] - Subscriptor saved successfully - Address ${subscriptor.address} - ChatId: ${subscriptor.chatId}`
    )

    const body = await getTelegramBodyBySubscriptor(subscriptor)
    const { buttons, welcomeText } = await getButtonsBySubscriptor(telegramChatId)

    // Buttons resetup for telegram, only show unsubscribe and get instant alert
    bot.sendMessage(
      telegramChatId,
      `The subscription was successful, your wallet address is ${address}. 
        
${body}`,
      {
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true
        },
        parse_mode: 'HTML'
      }
    )
    console.log(`[Telegram bot] - Telegram sended to chatId ${telegramChatId} successfully`)
  } catch (e) {
    console.error(e)
    bot.sendMessage(
      telegramChatId,
      'There was a problem when you try to subscribe, try it again later'
    )
  }
}
