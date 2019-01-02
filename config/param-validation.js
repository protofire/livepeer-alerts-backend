const Joi = require('joi')

module.exports = {
  // POST /api/subscribers
  createSubscriber: {
    body: {
      email: Joi.string()
        .email()
        .required(),
      address: Joi.string().required(),
      frequency: Joi.string()
        .valid('monthly', 'weekly', 'daily', 'hourly')
        .required()
    }
  },

  // UPDATE /api/subscribers/:subscriberId
  updateSubscriber: {
    body: {
      email: Joi.string()
        .email()
        .required(),
      address: Joi.string().required(),
      frequency: Joi.string()
        .valid('monthly', 'weekly', 'daily', 'hourly')
        .required()
    },
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

  // GET /api/subscribers/address/:address
  getByAddress: {
    params: {
      address: Joi.string().required()
    }
  },

  // POST /api/subscribers/activate
  activateSubscriber: {
    body: {
      activatedCode: Joi.number().required()
    }
  }
}
