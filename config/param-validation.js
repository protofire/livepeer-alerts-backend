const Joi = require('joi')
const { VALID_SUBSCRIPTION_FREQUENCIES, DAILY_FREQUENCY } = require('./constants')

module.exports = {
  // POST /api/subscribers
  createSubscriber: {
    body: {
      email: Joi.string()
        .email()
        .required(),
      address: Joi.string().required(),
      emailFrequency: Joi.string()
        .valid(VALID_SUBSCRIPTION_FREQUENCIES)
        .required(),
      telegramFrequency: Joi.string()
        .valid(VALID_SUBSCRIPTION_FREQUENCIES)
        .default(DAILY_FREQUENCY),
      telegramChatId: [Joi.string().optional(), Joi.allow(null)]
    }
  },

  // UPDATE /api/subscribers/:subscriberId
  updateSubscriber: {
    body: {
      email: Joi.string()
        .email()
        .required(),
      address: Joi.string().required(),
      emailFrequency: Joi.string()
        .valid(VALID_SUBSCRIPTION_FREQUENCIES)
        .required(),
      telegramFrequency: Joi.string()
        .valid(VALID_SUBSCRIPTION_FREQUENCIES)
        .default(DAILY_FREQUENCY),
      telegramChatId: [Joi.string().optional(), Joi.allow(null)]
    },
    params: {
      subscriberId: Joi.string()
        .hex()
        .required()
    }
  },

  // DELETE /api/subscribers/:subscriberId
  deleteSubscriber: {
    params: {
      subscriberId: Joi.string()
        .hex()
        .required()
    }
  },

  // GET /api/subscribers/:subscriberId
  getSubscriber: {
    params: {
      subscriberId: Joi.string()
        .hex()
        .required()
    }
  },

  // GET /api/subscribers/summary/:address
  getSummary: {
    params: {
      addressWithoutSubscriber: Joi.string().required()
    }
  },

  // POST /api/subscribers/activate
  activateSubscriber: {
    body: {
      activatedCode: Joi.number().required()
    }
  },

  // GET /api/subscribers/address/:address
  // GET /api/delegates/address/:address
  // GET /api/delegates/roi/:address
  // GET /api/delegates/rewardStatus/:address
  // GET /api/delegators/address/:address
  // GET /api/delegators/reward/:address
  getByAddress: {
    params: {
      address: Joi.string().required()
    }
  },

  // GET /api/delegates/top/:number
  getTopDelegates: {
    params: {
      number: Joi.number()
        .min(0)
        .required()
    }
  }
}
