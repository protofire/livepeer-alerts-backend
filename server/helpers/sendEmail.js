const stripTags = require('striptags')
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const sgMail = require('@sendgrid/mail')
const promiseRetry = require('promise-retry')
const config = require('../../config/config')
const moment = require('moment')
const {
  getLivepeerDelegatorAccount,
  getLivepeerTranscoderAccount,
  getLivepeerCurrentRound
} = require('./livepeerAPI')
const Earning = require('../earning/earning.model')
const {
  sendgridAPIKEY,
  fromEmail,
  activationEmailUrl,
  frontendUrl,
  unsubscribeEmailUrl,
  termsOfServiceUrl
} = config

Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return v1 == v2 ? options.fn(this) : options.inverse(this)
    case '===':
      return v1 === v2 ? options.fn(this) : options.inverse(this)
    case '!=':
      return v1 != v2 ? options.fn(this) : options.inverse(this)
    case '!==':
      return v1 !== v2 ? options.fn(this) : options.inverse(this)
    case '<':
      return v1 < v2 ? options.fn(this) : options.inverse(this)
    case '<=':
      return v1 <= v2 ? options.fn(this) : options.inverse(this)
    case '>':
      return v1 > v2 ? options.fn(this) : options.inverse(this)
    case '>=':
      return v1 >= v2 ? options.fn(this) : options.inverse(this)
    case '&&':
      return v1 && v2 ? options.fn(this) : options.inverse(this)
    case '||':
      return v1 || v2 ? options.fn(this) : options.inverse(this)
    default:
      return options.inverse(this)
  }
})

const sendEmail = async (toEmail, subject, body) => {
  sgMail.setApiKey(sendgridAPIKEY)

  const msg = {
    to: toEmail,
    from: fromEmail,
    subject: subject,
    text: stripTags(body),
    html: body
  }

  if (!['test'].includes(config.env)) {
    try {
      await sgMail.send(msg)
      console.log(`Email sended to ${toEmail} successfully`)
    } catch (err) {
      console.log(err)
    }
  }
}

const getEmailBody = async subscriber => {
  let delegatorAccount, transcoderAccount, currentRound
  await promiseRetry(async retry => {
    // Get delegator Account
    try {
      delegatorAccount = await getLivepeerDelegatorAccount(subscriber.address)
      if (delegatorAccount && delegatorAccount.status == 'Bonded') {
        // Get transcoder account
        transcoderAccount = await getLivepeerTranscoderAccount(delegatorAccount.delegateAddress)
        currentRound = await getLivepeerCurrentRound()
      }
    } catch (err) {
      retry()
    }
  })
  if (!delegatorAccount || !transcoderAccount || !currentRound) {
    throw new Error('There is no email to send')
  }

  // Check if call reward
  const callReward = transcoderAccount.lastRewardRound === currentRound

  // Calculate fees, fromRound, toRound, earnedFromInflation
  const earnings = await Earning.aggregate([
    {
      $group: {
        _id: {
          round: '$round',
          email: '$email',
          address: '$address',
          earning: '$earning'
        }
      }
    },
    {
      $sort: { round: -1 }
    },
    {
      $limit: 2
    }
  ]).exec()

  const roundFrom = earnings && earnings.length > 0 ? earnings[0]._id.round : 0
  const roundTo = earnings && earnings.length > 1 ? earnings[1]._id.round : roundFrom
  const earningFromRound = earnings && earnings.length > 0 ? earnings[0]._id.earning : 0
  const earningToRound = earnings && earnings.length > 1 ? earnings[1]._id.earning : 0
  let lptEarned = 0
  if (earningFromRound && earningToRound) {
    lptEarned = earningFromRound - earningToRound
  }
  const dateYesterday = moment()
    .subtract(1, 'days')
    .startOf('day')
    .format('dddd DD, YYYY hh:mm A')

  return {
    dateYesterday,
    lptEarned,
    roundFrom,
    roundTo,
    callReward,
    totalStake: delegatorAccount.totalStake,
    currentRound,
    delegateAddress: delegatorAccount.delegateAddress
  }
}

const createEarning = async data => {
  const { subscriber, totalStake, currentRound } = data
  // Save status earning by subscriber
  const earning = new Earning({
    email: subscriber.email,
    address: subscriber.address,
    earning: totalStake,
    round: currentRound
  })
  return await earning.save()
}

const sendNotificationEmail = async (subscriber, createEarningOnSend = false) => {
  // Get email body
  const {
    dateYesterday,
    lptEarned,
    roundFrom,
    roundTo,
    callReward,
    totalStake,
    currentRound,
    delegateAddress
  } = await getEmailBody(subscriber)

  // Open template file
  const filename = callReward
    ? '../emails/templates/notification_success.hbs'
    : '../emails/templates/notification_warning.hbs'
  const fileTemplate = path.join(__dirname, filename)
  const source = fs.readFileSync(fileTemplate, 'utf8')

  // Create email generator
  const template = Handlebars.compile(source)

  const body = template({
    transcoderAddressUrl: `https://explorer.livepeer.org/accounts/${delegateAddress}/transcoding`,
    transcoderAddress: `${delegateAddress.slice(0, 8)}...`,
    dateYesterday: dateYesterday,
    roundFrom: roundFrom,
    roundTo: roundTo,
    lptEarned: lptEarned,
    delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`
  })

  const subject = callReward
    ? `Livepeer staking alert - All good`
    : `Livepeer staking alert - Pay attention`

  // Create earning
  if (createEarningOnSend) {
    await createEarning({ subscriber, totalStake, currentRound })
  }

  // Send email
  await sendEmail(subscriber.email, subject, body)

  // Save last email sent
  subscriber.lastEmailSent = Date.now()
  return await subscriber.save({ validateBeforeSave: false })
}

const sendActivationEmail = toEmail => {
  // Open template file
  const fileTemplate = path.join(__dirname, '../emails/templates/activation.hbs')
  const source = fs.readFileSync(fileTemplate, 'utf8')

  // Create email generator
  const template = Handlebars.compile(source)
  const body = template({ unsubscribeEmailUrl, activationEmailUrl, termsOfServiceUrl })
  const subject = 'Livepeer alert notification - Please confirm your email address'

  // Send activation email
  sendEmail(toEmail, subject, body)
}

module.exports = { sendNotificationEmail, sendActivationEmail }
