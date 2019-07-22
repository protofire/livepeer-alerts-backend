const sgMail = require('@sendgrid/mail')
const config = require('../../config/config')

const {
  sendgridAPIKEY,
  fromEmail,
  fromEmailName,
  bccEmail,
  unsubscribeEmailUrl,
  sendgridTemplateIdDidRewardCallAllGood,
  sendgridTemplateIdDidRewardCallPayAttention
} = config

const sendEmail = async data => {
  const { email, templateId } = data

  sgMail.setApiKey(sendgridAPIKEY)
  sgMail.setSubstitutionWrappers('{{', '}}')

  const msg = {
    to: email,
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
  if (!['test'].includes(config.env)) {
    try {
      await sgMail.send(msg)
      console.log(`Email sent to ${email} successfully`)
    } catch (err) {
      console.error('error on email')
      console.error(err)
    }
  }
  return
}

const sendDelegateNotificationEmail = async data => {
  try {
    const { subscriber, delegateCalledReward } = data

    const templateId = delegateCalledReward
      ? sendgridTemplateIdDidRewardCallAllGood
      : sendgridTemplateIdDidRewardCallPayAttention

    // Send email
    let emailData = {
      email: subscriber.email,
      templateId
    }

    await sendEmail(emailData)

    // Save last email sent
    subscriber.lastEmailSent = Date.now()
    return await subscriber.save({ validateBeforeSave: false })
  } catch (e) {
    console.error(e)
    return
  }
}

const delegateEmailUtils = {
  sendDelegateNotificationEmail
}

module.exports = delegateEmailUtils
