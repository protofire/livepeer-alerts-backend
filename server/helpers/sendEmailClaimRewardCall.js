const sgMail = require('@sendgrid/mail')
const promiseRetry = require('promise-retry')
const config = require('../../config/config')
const moment = require('moment')

const {
  getLivepeerDelegatorAccount,
  getLivepeerTranscoderAccount,
  getLivepeerCurrentRound,
  getLivepeerDefaultConstants,
  getLivepeerCurrentRoundInfo
} = require('./livepeerAPI')
const {
  truncateStringInTheMiddle,
  formatBalance,
  getDelegatorRoundsUntilUnbonded
} = require('./utils')

const { getDelegatorNextReturn } = require('./delegate')

const {
  sendgridAPIKEY,
  fromEmail,
  fromEmailName,
  bccEmail,
  unsubscribeEmailUrl,
  sendgridTemplateIdClaimRewardCallAllGood,
  sendgridTemplateIdClaimRewardCallPayAttention,
  sendgridTemplateIdClaimRewardUnbondedState,
  sendgridTemplateIdClaimRewardUnbondingState
} = config

const sendEmailClaimRewardCall = async data => {
  const {
    email,
    templateId,
    transcoderAddress,
    dateYesterday,
    roundFrom,
    roundTo,
    lptEarned,
    delegatingStatusUrl,
    delegateAddress,
    roundsUntilUnbonded
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
      unsubscribeEmailUrl: unsubscribeEmailUrl,
      roundsUntilUnbonded: roundsUntilUnbonded
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

const sendNotificationEmail = async subscriber => {
  try {
    let [delegator, constants] = await promiseRetry(async retry => {
      return Promise.all([
        getLivepeerDelegatorAccount(subscriber.address),
        getLivepeerDefaultConstants()
      ]).catch(err => retry())
    })

    let templateId
    let body = {}

    switch (delegator.status) {
      case constants.DELEGATOR_STATUS.Bonded:
        // Check call reward
        let [transcoderAccount, currentRound] = await promiseRetry(async retry => {
          return Promise.all([
            getLivepeerTranscoderAccount(delegator.delegateAddress),
            getLivepeerCurrentRound()
          ]).catch(err => retry())
        })

        const callReward = transcoderAccount && transcoderAccount.lastRewardRound === currentRound

        // Select template based on call reward
        templateId = callReward
          ? sendgridTemplateIdClaimRewardCallAllGood
          : sendgridTemplateIdClaimRewardCallPayAttention

        const earningNextReturn = await getDelegatorNextReturn(delegator.address)

        // Calculate lpt earned tokens
        const lptEarned = formatBalance(earningNextReturn, 2, 'wei')

        const dateYesterday = moment()
          .subtract(1, 'days')
          .startOf('day')
          .format('dddd DD, YYYY hh:mm A')

        const { delegateAddress, totalStake } = delegator

        // Generate params for body
        body = {
          callReward,
          totalStake,
          currentRound,
          transcoderAddress: truncateStringInTheMiddle(delegateAddress),
          dateYesterday,
          roundFrom: currentRound,
          roundTo: currentRound + 1,
          lptEarned,
          delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${
            subscriber.address
          }/delegating`,
          delegateAddress
        }
        break

      case constants.DELEGATOR_STATUS.Unbonded:
        templateId = sendgridTemplateIdClaimRewardUnbondedState
        break

      case constants.DELEGATOR_STATUS.Unbonding:
        templateId = sendgridTemplateIdClaimRewardUnbondingState

        const [currentRoundInfo] = await promiseRetry(retry => {
          return Promise.all([getLivepeerCurrentRoundInfo()]).catch(err => retry())
        })

        const roundsUntilUnbonded = getDelegatorRoundsUntilUnbonded({
          delegator,
          constants,
          currentRoundInfo
        })

        // Generate params for body
        body = {
          roundsUntilUnbonded
        }

        break
      default:
        return
    }

    body.email = subscriber.email
    body.templateId = templateId

    await sendEmailClaimRewardCall(body)

    // // Save last email sent
    subscriber.lastEmailSent = Date.now()
    return await subscriber.save({ validateBeforeSave: false })
  } catch (e) {
    console.error(e)
    return
  }
}

module.exports = { sendNotificationEmail }
