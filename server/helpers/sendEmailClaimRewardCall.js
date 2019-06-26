const { getDelegatorService } = require('./services/delegatorService')
const { getProtocolService } = require('./services/protocolService')
const { getDelegateService } = require('./services/delegateService')

const sgMail = require('@sendgrid/mail')
const promiseRetry = require('promise-retry')
const config = require('../../config/config')
const moment = require('moment')
const Earning = require('../earning/earning.model')

const {
  truncateStringInTheMiddle,
  getEarningParams,
  formatBalance,
  getDelegatorRoundsUntilUnbonded
} = require('./utils')

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

const sendNotificationEmail = async (subscriber, createEarningOnSend = false) => {
  try {
    const delegatorService = getDelegatorService()
    const protocolService = getProtocolService()
    const delegateService = getDelegateService()
    let [delegator, constants] = await promiseRetry(async retry => {
      return Promise.all([
        delegatorService.getDelegatorAccount(subscriber.address),
        protocolService.getLivepeerDefaultConstants()
      ]).catch(err => retry())
    })

    let templateId
    let body = {}

    switch (delegator.status) {
      case constants.DELEGATOR_STATUS.Bonded:
        // Check call reward
        let [transcoderAccount, currentRound] = await promiseRetry(async retry => {
          return Promise.all([
            delegateService.getDelegate(delegator.delegateAddress),
            protocolService.getCurrentRound()
          ]).catch(err => retry())
        })

        const callReward = transcoderAccount && transcoderAccount.lastRewardRound === currentRound

        // Select template based on call reward
        templateId = callReward
          ? sendgridTemplateIdClaimRewardCallAllGood
          : sendgridTemplateIdClaimRewardCallPayAttention

        const { roundFrom, roundTo, earningToRound } = await getEarningParams({
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

        const { delegateAddress, totalStake } = delegator

        // Generate params for body
        body = {
          callReward,
          totalStake,
          currentRound,
          transcoderAddress: truncateStringInTheMiddle(delegateAddress),
          dateYesterday,
          roundFrom,
          roundTo,
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
          return Promise.all([protocolService.getLivepeerCurrentRoundInfo()]).catch(err => retry())
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

    if (createEarningOnSend) {
      await Earning.save(subscriber)
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
