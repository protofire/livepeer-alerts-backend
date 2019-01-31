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
  MONGO_DATABASE: Joi.string()
    .required()
    .description('Mongo database name'),
  SENDGRID_API_KEY: Joi.string()
    .required()
    .description('Sendgrid API KEY'),
  FROM_EMAIL: Joi.string()
    .email()
    .required()
    .description('From email'),
  FROM_EMAIL_NAME: Joi.string()
    .required()
    .description('From name email'),
  BCC_EMAIL: Joi.string()
    .required()
    .description('BCC email'),
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
    .description('Telegram bot key'),
  SENDGRID_TEMPLATE_ID_CLAIM_REWARD_CALL_ALL_GOOD: Joi.string()
    .required()
    .description('Sendgrid template id for claim reward call all good notification'),
  SENDGRID_TEMPLATE_ID_CLAIM_REWARD_CALL_PAY_ATTENTION: Joi.string()
    .required()
    .description('Sendgrid template id for claim reward call pay attention notification'),
  SENDGRID_TEMPLATE_ID_DID_REWARD_CALL_ALL_GOOD: Joi.string()
    .required()
    .description('Sendgrid template id for did reward call all good notification'),
  SENDGRID_TEMPLATE_ID_DID_REWARD_CALL_PAY_ATTENTION: Joi.string()
    .required()
    .description('Sendgrid template id for did reward call pay attention notification'),
  MAINNET_CONTROLLER_ADDRESS: Joi.string()
    .required()
    .description('Mainnet controller adddress'),
  RINKEBY_CONTROLLER_ADDRESS: Joi.string()
    .required()
    .description('Rinkeby controller address')
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
    host: `${envVars.MONGO_HOST}`,
    database: envVars.MONGO_DATABASE,
    port: envVars.MONGO_PORT
  },
  sendgridAPIKEY: envVars.SENDGRID_API_KEY,
  fromEmail: envVars.FROM_EMAIL,
  fromEmailName: envVars.FROM_EMAIL_NAME,
  bccEmail: envVars.BCC_EMAIL,
  frontendUrl: envVars.FRONTEND_URL,
  activationEmailUrl: envVars.ACTIVATION_EMAIL_URL,
  unsubscribeEmailUrl: envVars.UNSUBSCRIBE_EMAIL_URL,
  termsOfServiceUrl: envVars.TERMS_OF_SERVICE_URL,
  telegramBotKey: envVars.TELEGRAM_BOT_KEY,
  sendgridTemplateIdClaimRewardCallAllGood: envVars.SENDGRID_TEMPLATE_ID_CLAIM_REWARD_CALL_ALL_GOOD,
  sendgridTemplateIdClaimRewardCallPayAttention:
    envVars.SENDGRID_TEMPLATE_ID_CLAIM_REWARD_CALL_PAY_ATTENTION,
  sendgridTemplateIdDidRewardCallAllGood: envVars.SENDGRID_TEMPLATE_ID_DID_REWARD_CALL_ALL_GOOD,
  sendgridTemplateIdDidRewardCallPayAttention:
    envVars.SENDGRID_TEMPLATE_ID_DID_REWARD_CALL_PAY_ATTENTION,
  mainnetControllerAddress: envVars.MAINNET_CONTROLLER_ADDRESS,
  rinkebyControllerAddress: envVars.RINKEBY_CONTROLLER_ADDRESS
}

module.exports = config
