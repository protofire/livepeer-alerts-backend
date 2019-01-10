const Promise = require('bluebird')
const mongoose = require('mongoose')

/**
 * Telegram Schema
 */
const TelegramSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  chatId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

/**
 * @typedef Telegram
 */
module.exports = mongoose.model('Telegram', TelegramSchema)
