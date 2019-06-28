const { sendEmail } = require('./utils')

const config = require('../../config/config')

const {
  fromEmail,
  fromEmailName,
  bccEmail,
  unsubscribeEmailUrl,
  sendgridTemplateIdDidRewardCallAllGood,
  sendgridTemplateIdDidRewardCallPayAttention
} = config

const sendDelegateNotificationEmail = async data => {
  try {
    const { subscriber, delegateCalledReward } = data

    const templateId = delegateCalledReward
      ? sendgridTemplateIdDidRewardCallAllGood
      : sendgridTemplateIdDidRewardCallPayAttention

    // Create email msg
    const msg = {
      to: subscriber.email,
      bcc: bccEmail,
      from: {
        name: fromEmailName,
        email: fromEmail
      },
      templateId: templateId,
      dynamic_template_data: {
        unsubscribeEmailUrl: unsubscribeEmailUrl
      }
    }
    // Send email
    await sendEmail(msg)

    // Save last email sent
    subscriber.lastEmailSent = Date.now()
    return await subscriber.save({ validateBeforeSave: false })
  } catch (e) {
    console.error(e)
    return
  }
}

module.exports = { sendDelegateNotificationEmail }
