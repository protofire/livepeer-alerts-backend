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
  SENDGRID_TEMPLATE_ID_CLAIM_REWARD_UNBONDING_STATE: Joi.string()
    .required()
    .description('Sendgrid template id for notification related to the unbonding state'),
  SENDGRID_TEMPLATE_ID_CLAIM_REWARD_UNBONDED_STATE: Joi.string()
    .required()
    .description('Sendgrid template id for notification related to the unbonded state'),
  SENDGRID_TEMPLATE_ID_NOTIFICATION_DELEGATE_CHANGE_RULES: Joi.string()
    .required()
    .description('Sendgrid template id for notification related to delegate change of rule'),
  SENDGRID_TEMPLATE_ID_NOTIFICATION_DELEGATOR_BONDING_PERIOD_HAS_ENDED: Joi.string()
    .required()
    .description(
      'Sendgrid template id for notification related to delegator bonding period has ended'
    ),
  SENDGRID_TEMPLATE_ID_CLAIM_REWARD_PENDING_STATE: Joi.string()
    .required()
    .description('Sendgrid template id for notification related to the pending state'),
  SENDGRID_TEMPLATE_ID_DELEGATOR_WEEKLY_SUMMARY: Joi.string()
    .required()
    .description('Sendgrid template id for the summary week of the delegators'),
  MAINNET_CONTROLLER_ADDRESS: Joi.string()
    .required()
    .description('Mainnet controller adddress'),
  RINKEBY_CONTROLLER_ADDRESS: Joi.string()
    .required()
    .description('Rinkeby controller address'),
  THRESHOLD_SEND_NOTIFICATION: Joi.number()
    .required()
    .description('Threshold to send notification'),
  APOLLO_API_URL: Joi.string()
    .description('Livepeer dgraph API url')
    .required(),
  MINUTES_TO_WAIT_AFTER_LAST_SENT_EMAIL: Joi.string()
    .description('Minutes to wait after last sent email')
    .required(),
  MINUTES_TO_WAIT_AFTER_LAST_SENT_TELEGRAM: Joi.string()
    .description('Minutes to wait after last sent telegram')
    .required(),
  EARNING_DECIMALS: Joi.number()
    .description('Amount of decimals to display in the earnings')
    .default(6)
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
    host: `${envVars.MONGO_HOST}${envVars.MONGO_DATABASE}`,
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
  sendgridTemplateIdClaimRewardUnbondingState:
    envVars.SENDGRID_TEMPLATE_ID_CLAIM_REWARD_UNBONDING_STATE,
  sendgridTemplateIdClaimRewardUnbondedState:
    envVars.SENDGRID_TEMPLATE_ID_CLAIM_REWARD_UNBONDED_STATE,
  sendgridTemplateIdNotificationDelegateChangeRules:
    envVars.SENDGRID_TEMPLATE_ID_NOTIFICATION_DELEGATE_CHANGE_RULES,
  sendgridTemplateIdNotificationDelegatorBondingPeriodHasEnded:
    envVars.SENDGRID_TEMPLATE_ID_NOTIFICATION_DELEGATOR_BONDING_PERIOD_HAS_ENDED,
  sendgridTemplateIdClaimRewardPendingState:
    envVars.SENDGRID_TEMPLATE_ID_CLAIM_REWARD_PENDING_STATE,
  sendgrindTemplateIdDelegatorWeeklySummary: envVars.SENDGRID_TEMPLATE_ID_DELEGATOR_WEEKLY_SUMMARY,
  mainnetControllerAddress: envVars.MAINNET_CONTROLLER_ADDRESS,
  rinkebyControllerAddress: envVars.RINKEBY_CONTROLLER_ADDRESS,
  thresholdSendNotification: envVars.THRESHOLD_SEND_NOTIFICATION,
  apolloApiUrl: envVars.APOLLO_API_URL,
  minutesToWaitAfterLastSentEmail: envVars.MINUTES_TO_WAIT_AFTER_LAST_SENT_EMAIL,
  minutesToWaitAfterLastSentTelegram: envVars.MINUTES_TO_WAIT_AFTER_LAST_SENT_TELEGRAM,
  earningDecimals: envVars.EARNING_DECIMALS
}

module.exports = config
