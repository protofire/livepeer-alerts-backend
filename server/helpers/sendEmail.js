const stripTags = require('striptags')
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const sgMail = require('@sendgrid/mail')
const config = require('../../config/config')
const { getLivepeerTranscoders } = require('./livepeerAPI')

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

const sendNotificationEmail = async toEmail => {
  // Open template file
  const fileTemplate = path.join(__dirname, '../emails/templates/notification.hbs')
  const source = fs.readFileSync(fileTemplate, 'utf8')

  // Create email generator
  const template = Handlebars.compile(source)
  const data = await getLivepeerTranscoders()
  const body = template({ data: data })
  const subject = 'Livepeer alert notification for Tokenholders'

  // Send email
  sendEmail(toEmail, subject, body)
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
