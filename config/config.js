const Joi = require('joi')

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config()

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: Joi.number().default(4040),
  MONGOOSE_DEBUG: Joi.boolean().when('NODE_ENV', {
    is: Joi.string().equal('development'),
    then: Joi.boolean().default(true),
    otherwise: Joi.boolean().default(false)
  }),
  MONGO_HOST: Joi.string()
    .required()
    .description('Mongo DB host url'),
  MONGO_PORT: Joi.number().default(27017),
  SENDGRID_API_KEY: Joi.string()
    .required()
    .description('Sendgrid API KEY'),
  FROM_EMAIL: Joi.string()
    .email()
    .required()
    .description('From email'),
  FRONTEND_URL: Joi.string()
    .required()
    .description('Frontend URL'),
  ACTIVATION_EMAIL_URL: Joi.string()
    .required()
    .description('URL to activate email subscription'),
  UNSUBSCRIBE_EMAIL_URL: Joi.string()
    .required()
    .description('Unsubscribe email URL'),
  TERMS_OF_SERVICE_URL: Joi.string()
    .required()
    .description('Terms of service URL'),
  TELEGRAM_BOT_KEY: Joi.string()
    .required()
    .description('Telegram bot key')
})
  .unknown()
  .required()

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema)
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  mongo: {
    host: envVars.MONGO_HOST,
    port: envVars.MONGO_PORT
  },
  sendgridAPIKEY: envVars.SENDGRID_API_KEY,
  fromEmail: envVars.FROM_EMAIL,
  frontendUrl: envVars.FRONTEND_URL,
  activationEmailUrl: envVars.ACTIVATION_EMAIL_URL,
  unsubscribeEmailUrl: envVars.UNSUBSCRIBE_EMAIL_URL,
  termsOfServiceUrl: envVars.TERMS_OF_SERVICE_URL,
  telegramBotKey: envVars.TELEGRAM_BOT_KEY
}

module.exports = config
