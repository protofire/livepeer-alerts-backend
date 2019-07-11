const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const TelegramBot = require('node-telegram-bot-api')
const promiseRetry = require('promise-retry')
const path = require('path')
const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getTelegramClaimRewardCallBody } = require('../helpers/sendTelegramClaimRewardCall')
const { getTelegramDidRewardCallBody } = require('../helpers/sendTelegramDidRewardCall')
const {
  subscribe,
  unsubscribe,
  getInstantAlert,
  getButtonsBySubscriptor,
  subscriptionRemove,
  subscriptionSave,
  getSubscriptorRole,
  getDidDelegateCallReward
} = require('../helpers/utils')

const { NoAddressError } = require('../helpers/JobsErrors')
const TelegramModel = require('../telegram/telegram.model')
const SubscriberModel = require('../subscriber/subscriber.model')

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

const getBodyBySubscriber = async subscriptor => {
  // Starting
  let { constants, delegator, role } = await getSubscriptorRole(subscriptor)

  let data
  if (role === constants.ROLE.TRANSCODER) {
    // Check if the delegate didRewardCall
    const [delegateCalledReward] = await promiseRetry(retry => {
      return Promise.all([getDidDelegateCallReward(delegator.delegateAddress)]).catch(err =>
        retry()
      )
    })

    // OK, is a delegate, let's send notifications
    data = getTelegramDidRewardCallBody({ delegateCalledReward })
  } else {
    // OK, is a delegator, let's send notifications
    data = await getTelegramClaimRewardCallBody(subscriptor)
  }

  return data && data.body
}

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
  // Subscribe process
  if (msg.text.toString().indexOf(subscribe) === 0) {
    const telegramChatId = msg.chat.id
    try {
      const address = await findAddress(telegramChatId)
      console.log(`[Telegram bot] - Subscribe user: ${telegramChatId}, address : ${address}`)

      bot.sendMessage(telegramChatId, `Waiting for subscription...`)

      // Subscribe user
      const subscriptorData = { address: address, chatId: telegramChatId }
      const subscriptor = await subscriptionSave(subscriptorData)

      const body = await getBodyBySubscriber(subscriptor)
      const { buttons, welcomeText } = await getButtonsBySubscriptor(subscriptorData)

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

  // Unsubscribe message
  if (msg.text.toString().indexOf(unsubscribe) === 0) {
    const telegramChatId = msg.chat.id
    try {
      console.log(`[Telegram bot] - Unsubscribe user: ${telegramChatId}`)
      const address = await findAddress(telegramChatId)

      bot.sendMessage(telegramChatId, `Waiting for unsubscription...`)

      // Remove subscribe
      const subscriptorData = { address: address, chatId: telegramChatId }
      await subscriptionRemove(subscriptorData)

      const { buttons, welcomeText } = await getButtonsBySubscriptor(subscriptorData)

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

  // Get instant alert
  if (msg.text.toString().indexOf(getInstantAlert) === 0) {
    const telegramChatId = msg.chat.id
    try {
      console.log(`[Telegram bot] - Sending instant alert to ${telegramChatId}`)
      const address = await findAddress(telegramChatId)

      bot.sendMessage(telegramChatId, `Waiting for alert notification...`)

      const body = await getBodyBySubscriber({ address: address, telegramChatId })

      const { buttons, welcomeText } = await getButtonsBySubscriptor({
        address: address,
        chatId: telegramChatId
      })

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
})
