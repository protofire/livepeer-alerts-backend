const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const TelegramBot = require('node-telegram-bot-api')
const path = require('path')
const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getTelegramBodyParams } = require('../helpers/sendTelegramClaimRewardCall')
const {
  subscribe,
  unsubscribe,
  getInstantAlert,
  getButtonsBySubscriptor,
  subscriptionFind,
  subscriptionRemove,
  subscriptionSave
} = require('../helpers/utils')
const { NoAddressError } = require('../helpers/JobsErrors')
const TelegramModel = require('../telegram/telegram.model')

const { telegramBotKey } = config

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramBotKey, { polling: true })

const findAddress = async chatId => {
  const telegramModel = await TelegramModel.findOne({ chatId: chatId }).exec()
  if (!telegramModel || !telegramModel.address) {
    throw new NoAddressError()
  }
  return telegramModel.address
}

// Start process
bot.onText(/^\/start ([\w-]+)$/, async (msg, [, command]) => {
  try {
    const address = command

    // Validate existing address
    if (!address) {
      throw new NoAddressError()
    }

    // Save address an chatId
    const subscriptorData = {
      address: address,
      chatId: msg.chat.id
    }

    let telegrams = await TelegramModel.find({ chatId: msg.chat.id }).exec()
    if (telegrams.length > 1) {
      telegrams.shift()
      telegrams.forEach(async telegram => {
        await telegram.remove()
      })
    }

    // Must exist only one telegram object
    let telegramObject = await TelegramModel.findOne({ chatId: msg.chat.id }).exec()
    if (!telegramObject) {
      const telegramModel = new TelegramModel(subscriptorData)
      telegramObject = await telegramModel.save()
    } else {
      telegramObject.chatId = msg.chat.id
      telegramObject.address = address
      await telegramObject.save()
    }

    const { buttons, welcomeText } = await getButtonsBySubscriptor(subscriptorData)

    // Buttons setup for telegram
    bot
      .sendMessage(msg.chat.id, welcomeText, {
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true
        }
      })
      .catch(function(error) {
        if (error.response && error.response.statusCode === 403) {
          console.log(`BOT blocked by the user with chatId ${msg.chat.id}`)
        }
      })
  } catch (e) {
    bot.sendMessage(msg.chat.id, e.message)
  }
})

// Capture messages
bot.on('message', async msg => {
  // Subscribe process
  if (msg.text.toString().indexOf(subscribe) === 0) {
    try {
      const address = await findAddress(msg.chat.id)

      bot.sendMessage(msg.chat.id, `Waiting for subscription...`)

      // Subscribe user
      const subscriptorData = { address: address, chatId: msg.chat.id }
      await subscriptionSave(subscriptorData)

      const { buttons, welcomeText } = await getButtonsBySubscriptor(subscriptorData)

      // Buttons resetup for telegram, only show unsubscribe and get instant alert
      bot.sendMessage(
        msg.chat.id,
        `The subscription was successful, your wallet address is ${address}.`,
        {
          reply_markup: {
            keyboard: buttons,
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      )
    } catch (e) {
      bot.sendMessage(
        msg.chat.id,
        'There was a problem when you try to subscribe, try it again later'
      )
    }
  }

  // Unsubscribe message
  if (msg.text.toString().indexOf(unsubscribe) === 0) {
    try {
      const address = await findAddress(msg.chat.id)

      bot.sendMessage(msg.chat.id, `Waiting for unsubscription...`)

      // Remove subscribe
      const subscriptorData = { address: address, chatId: msg.chat.id }
      await subscriptionRemove(subscriptorData)

      const { buttons, welcomeText } = await getButtonsBySubscriptor(subscriptorData)

      // Buttons resetup for telegram, only show subscribe and get instant alert
      bot.sendMessage(
        msg.chat.id,
        `The unsubscription was successful, your wallet address is ${address}.`,
        {
          reply_markup: {
            keyboard: buttons,
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      )
    } catch (e) {
      bot.sendMessage(msg.chat.id, e.message)
    }
  }

  // Get instant alert
  if (msg.text.toString().indexOf(getInstantAlert) === 0) {
    try {
      const address = await findAddress(msg.chat.id)

      // Find subscriptor to get telegram body
      const subscriptorData = { address: address, chatId: msg.chat.id }
      const subscriptor = await subscriptionFind(subscriptorData)

      bot.sendMessage(msg.chat.id, `Waiting for alert notification...`)

      const { body } = await getTelegramBodyParams(subscriptor)

      const { buttons, welcomeText } = await getButtonsBySubscriptor(subscriptorData)

      // Buttons resetup for telegram, only show subscribe and get instant alert
      bot.sendMessage(msg.chat.id, `${body}`, {
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true
        },
        parse_mode: 'HTML'
      })
      console.log(`Telegram sended to chatId ${msg.chat.id} successfully`)
    } catch (e) {
      console.log(JSON.stringify(e))
      bot.sendMessage(msg.chat.id, e.message)
    }
  }
})
