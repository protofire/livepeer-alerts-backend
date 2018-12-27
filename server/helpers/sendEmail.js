const stripTags = require('striptags')
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const sgMail = require('@sendgrid/mail')
const config = require('../../config/config')
const {
  getLivepeerDelegatorAccount,
  getLivepeerTranscoders,
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

const sendEmail = (toEmail, subject, body) => {
  sgMail.setApiKey(sendgridAPIKEY)

  const msg = {
    to: toEmail,
    from: fromEmail,
    subject: subject,
    text: stripTags(body),
    html: body
  }

  if (!['test', 'development'].includes(config.env)) {
    sgMail.send(msg)
  }
}

const sendNotificationEmail = async subscriber => {
  // Open template file
  const fileTemplate = path.join(__dirname, '../emails/templates/notification.hbs')
  const source = fs.readFileSync(fileTemplate, 'utf8')

  // Create email generator
  const template = Handlebars.compile(source)

  // Obtain information for template
  const [delegatorAccount, transcoders, currentRound] = await Promise.all([
    getLivepeerDelegatorAccount(subscriber.address),
    getLivepeerTranscoders(),
    getLivepeerCurrentRound()
  ])

  // Save status earning by subscriber
  const earning = new Earning({
    email: subscriber.email,
    address: subscriber.address,
    earning: delegatorAccount.fees,
    round: currentRound
  })
  await earning.save()

  // Calculate fees, fromRound, toRound, earnedFromInflation
  const earnings = await Earning.find()
    .sort({ createdAt: -1 })
    .skip(0)
    .limit(2)
    .exec()
  const fromRound = earnings && earnings.length > 0 ? earnings[1].round : 0
  const toRound = earnings && earnings.length > 0 ? earnings[0].round : 0
  const earnedFromInflation =
    earnings && earnings.length > 0 ? earnings[0].earning - earnings[1].earning : 0

  const body = template({ transcoders, currentRound, fromRound, toRound, earnedFromInflation })
  const subject = 'Livepeer alert notification for Tokenholders'

  // Send email
  console.log(`Send email notification to ${subscriber.email}`)
  sendEmail(subscriber.email, subject, body)

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
