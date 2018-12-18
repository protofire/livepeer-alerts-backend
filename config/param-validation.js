const Joi = require('joi')

module.exports = {
  // POST /api/subscribers
  createSubscriber: {
    body: {
      email: Joi.string().required(),
      address: Joi.string().required(),
      frequency: Joi.string()
        .valid('monthly', 'weekly', 'daily')
        .required()
    }
  },

  // UPDATE /api/subscribers/:subscriberId
  updateSubscriber: {
    body: {
      email: Joi.string().required(),
      address: Joi.string().required(),
      frequency: Joi.string().required()
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
  }
}
