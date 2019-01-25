const sgMail = require('@sendgrid/mail')
const promiseRetry = require('promise-retry')
const config = require('../../config/config')
const moment = require('moment')
const Earning = require('../earning/earning.model')

const {
  getLivepeerDelegatorAccount,
  getLivepeerTranscoderAccount,
  getLivepeerCurrentRound,
  getLivepeerDefaultConstants
} = require('./livepeerAPI')
const { truncateStringInTheMiddle, getEarningParams, formatBalance } = require('./utils')

const {
  sendgridAPIKEY,
  fromEmail,
  fromEmailName,
  bccEmail,
  unsubscribeEmailUrl,
  sendgridTemplateIdClaimRewardCallAllGood,
  sendgridTemplateIdClaimRewardCallPayAttention
} = config

const sendEmail = async data => {
  const {
    email,
    templateId,
    transcoderAddress,
    dateYesterday,
    roundFrom,
    roundTo,
    lptEarned,
    delegatingStatusUrl,
    delegateAddress
  } = data

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
      delegateAddress: delegateAddress,
      transcoderAddress: transcoderAddress,
      dateYesterday: dateYesterday,
      roundFrom: roundFrom,
      roundTo: roundTo,
      lptEarned: lptEarned,
      delegatingStatusUrl: delegatingStatusUrl,
      unsubscribeEmailUrl: unsubscribeEmailUrl
    }
  }

  if (!['test'].includes(config.env)) {
    try {
      await sgMail.send(msg)
      console.log(`Email sended to ${email} successfully`)
    } catch (err) {
      console.log(err)
    }
  }
  return
}

const getEmailBodyParams = async subscriber => {
  let delegatorAccount, transcoderAccount, currentRound, constants
  await promiseRetry(async retry => {
    // Get delegator Account
    try {
      delegatorAccount = await getLivepeerDelegatorAccount(subscriber.address)
      constants = await getLivepeerDefaultConstants()
      if (delegatorAccount && delegatorAccount.status == constants.DELEGATOR_STATUS.Bonded) {
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
  const callReward = transcoderAccount && transcoderAccount.lastRewardRound === currentRound

  const { roundFrom, roundTo, earningToRound, earningFromRound } = await getEarningParams({
    transcoderAccount,
    currentRound,
    subscriber
  })

  // Calculate lpt earned tokens
  const lptEarned = formatBalance(earningToRound, 2)

  const dateYesterday = moment()
    .subtract(1, 'days')
    .startOf('day')
    .format('dddd DD, YYYY hh:mm A')

  // Open template file
  const { delegateAddress, totalStake } = delegatorAccount

  return {
    callReward,
    totalStake,
    currentRound,
    transcoderAddress: truncateStringInTheMiddle(delegateAddress),
    dateYesterday,
    roundFrom,
    roundTo,
    lptEarned,
    delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`,
    delegateAddress
  }
}

const sendNotificationEmail = async (subscriber, createEarningOnSend = false) => {
  try {
    // Get email body
    const {
      callReward,
      transcoderAddressUrl,
      transcoderAddress,
      dateYesterday,
      roundFrom,
      roundTo,
      lptEarned,
      delegatingStatusUrl,
      delegateAddress
    } = await getEmailBodyParams(subscriber)

    const templateId = callReward
      ? sendgridTemplateIdClaimRewardCallAllGood
      : sendgridTemplateIdClaimRewardCallPayAttention
    // Create earning
    if (createEarningOnSend) {
      await Earning.save(subscriber)
    }

    // Send email
    const data = {
      email: subscriber.email,
      templateId,
      transcoderAddressUrl,
      transcoderAddress,
      dateYesterday,
      roundFrom,
      roundTo,
      lptEarned,
      delegatingStatusUrl,
      delegateAddress
    }

    await sendEmail(data)

    // Save last email sent
    subscriber.lastEmailSent = Date.now()
    return await subscriber.save({ validateBeforeSave: false })
  } catch (e) {
    console.error(e)
    return
  }
}

module.exports = { sendNotificationEmail }
