const sgMail = require('@sendgrid/mail')
const config = require('../../config/config')
const moment = require('moment')
const { DAILY_FREQUENCY, WEEKLY_FREQUENCY } = require('../../config/constants')

const utils = require('./utils')

const {
  sendgridAPIKEY,
  fromEmail,
  fromEmailName,
  bccEmail,
  unsubscribeEmailUrl,
  sendgridTemplateIdClaimRewardCallAllGood,
  sendgridTemplateIdClaimRewardCallPayAttention,
  sendgridTemplateIdClaimRewardUnbondedState,
  sendgridTemplateIdClaimRewardUnbondingState,
  sendgridTemplateIdClaimRewardPendingState,
  sendgridTemplateIdNotificationDelegateChangeRules,
  sendgrindTemplateIdDelegatorWeeklySummary,
  sendgridTemplateIdNotificationDelegatorBondingPeriodHasEnded,
  earningDecimals
} = config

const sendEmail = async (email, templateId, dynamicTemplateData) => {
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
      ...dynamicTemplateData,
      unsubscribeEmailUrl
    }
  }

  if (!['test'].includes(config.env)) {
    try {
      console.log(`Trying to send email to ${email}`)
      await sgMail.send(msg)
      console.log(`Email sent to ${email} successfully`)
    } catch (err) {
      console.error(`There was an error trying to send email to ${email} with error: \n ${err}`)
      throw err
    }
  }
  return
}

const getBodyAndTemplateIdBasedOnDelegatorStatus = data => {
  const {
    subscriber,
    delegator,
    constants,
    currentRoundInfo,
    delegatorTemplateData,
    isNewSubscriber = false
  } = data

  if (!subscriber) {
    throw new Error(
      `[SendDelegatorEmail] - subscriber not received on getBodyAndTemplateIdBasedOnDelegatorStatus()`
    )
  }
  if (!delegator) {
    throw new Error(
      `[SendDelegatorEmail] - delegator not received on getBodyAndTemplateIdBasedOnDelegatorStatus()`
    )
  }
  if (!constants) {
    throw new Error(
      `[SendDelegatorEmail] - constants not received on getBodyAndTemplateIdBasedOnDelegatorStatus()`
    )
  }
  if (!currentRoundInfo) {
    throw new Error(
      `[SendDelegatorEmail] - currentRoundInfo not received on getBodyAndTemplateIdBasedOnDelegatorStatus()`
    )
  }
  let templateId
  let body = {}
  switch (delegator.status) {
    case constants.DELEGATOR_STATUS.Unbonded:
      subscriber.lastEmailSentForUnbondedStatus = currentRoundInfo.id
      subscriber.save().then(doc => {})

      templateId = sendgridTemplateIdClaimRewardUnbondedState
      break
    case constants.DELEGATOR_STATUS.Pending:
      body = {
        delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`
      }

      templateId = sendgridTemplateIdClaimRewardPendingState
      break
    case constants.DELEGATOR_STATUS.Unbonding:
      templateId = sendgridTemplateIdClaimRewardUnbondingState

      const roundsUntilUnbonded = utils.getDelegatorRoundsUntilUnbonded({
        delegator,
        constants,
        currentRoundInfo
      })

      // Generate params for body
      body = {
        roundsUntilUnbonded
      }
      break
    case constants.DELEGATOR_STATUS.Bonded:
      if (subscriber.emailFrequency === DAILY_FREQUENCY || isNewSubscriber) {
        const result = getDailyTemplate({
          subscriber,
          delegator,
          currentRound: currentRoundInfo.id,
          delegatorTemplateData
        })
        body = result.body
        templateId = result.templateId
      }
      if (subscriber.emailFrequency === WEEKLY_FREQUENCY && !isNewSubscriber) {
        const result = getWeeklyTemplate(delegatorTemplateData)
        body = result.body
        templateId = result.templateId
      }
      break
    default:
      throw new Error(`[SendDelegatorEmail] - delegator status: ${delegator.status} not supported`)
  }
  return { templateId, body }
}

const getDailyTemplate = data => {
  const { subscriber, delegator, currentRound, delegatorTemplateData } = data

  if (!subscriber) {
    throw new Error(`[SendDelegatorEmail] - subscriber not received on getDailyTemplate()`)
  }
  if (!delegator) {
    throw new Error(`[SendDelegatorEmail] - delegator not received on getDailyTemplate()`)
  }
  if (!currentRound) {
    throw new Error(`[SendDelegatorEmail] - currentRound not received on getDailyTemplate()`)
  }
  if (!delegatorTemplateData) {
    throw new Error(
      `[SendDelegatorEmail] - delegatorTemplateData not received on getDailyTemplate()`
    )
  }
  const { delegateCalledReward, delegatorRoundReward } = delegatorTemplateData
  if (!delegatorRoundReward) {
    throw new Error(
      `[SendDelegatorEmail] - delegatorRoundReward not received on getDailyTemplate()`
    )
  }

  // Select template based on call reward
  const templateId = delegateCalledReward
    ? sendgridTemplateIdClaimRewardCallAllGood
    : sendgridTemplateIdClaimRewardCallPayAttention

  // Calculate lpt earned tokens
  const lptEarned = utils.formatBalance(delegatorRoundReward, earningDecimals, 'wei')

  const dateYesterday = moment()
    .subtract(1, 'days')
    .startOf('day')
    .format('dddd DD, YYYY hh:mm A')

  const { delegateAddress, totalStake } = delegator

  // Generate params for body
  const body = {
    callReward: delegateCalledReward,
    totalStake,
    transcoderAddress: utils.truncateStringInTheMiddle(delegateAddress),
    dateYesterday,
    roundFrom: currentRound - 1,
    roundTo: currentRound,
    lptEarned,
    delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`,
    delegateAddress
  }

  return {
    templateId,
    body
  }
}

const getWeeklyTemplate = delegatorTemplateData => {
  if (!delegatorTemplateData) {
    throw new Error(
      `[SendDelegatorEmail] - delegatorTemplateData not received on getWeeklyTemplate()`
    )
  }
  const {
    totalRounds,
    totalDelegatePools,
    totalDelegatorShares,
    averageShares,
    missedRewardCalls,
    weekRoundShares = [],
    fromDateCardinal,
    toDateCardinal,
    startRoundDate,
    endRoundDate
  } = delegatorTemplateData

  const [
    share1 = 0,
    share2 = 0,
    share3 = 0,
    share4 = 0,
    share5 = 0,
    share6 = 0,
    share7 = 0
  ] = weekRoundShares

  const body = {
    totalRounds,
    totalDelegatePools,
    totalDelegatorShares,
    averageShares,
    missedRewardCalls,
    share1,
    share2,
    share3,
    share4,
    share5,
    share6,
    share7,
    fromDateCardinal,
    toDateCardinal,
    startRoundDate,
    endRoundDate
  }

  return {
    body,
    templateId: sendgrindTemplateIdDelegatorWeeklySummary
  }
}

const getRulesChangedTemplate = (subscriberAddress, delegateAddress, propertiesChanged) => {
  if (!subscriberAddress) {
    throw new Error(
      `[SendDelegatorEmail] - subscriberAddress not received on getRulesChangedTemplate()`
    )
  }
  if (!delegateAddress) {
    throw new Error(
      `[SendDelegatorEmail] - delegateAddress not received on getRulesChangedTemplate()`
    )
  }
  if (!propertiesChanged) {
    throw new Error(
      `[SendDelegatorEmail] - propertiesChanged not received on getRulesChangedTemplate()`
    )
  }
  const body = {
    transcoderAddress: utils.truncateStringInTheMiddle(delegateAddress),
    delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriberAddress}/delegating`,
    delegateAddress: delegateAddress,
    oldRewardCut: propertiesChanged.oldProperties.rewardCut,
    oldFeeShare: propertiesChanged.oldProperties.feeShare,
    oldPendingFeeShare: propertiesChanged.oldProperties.pendingFeeShare,
    oldPendingRewardCut: propertiesChanged.oldProperties.pendingRewardCut,
    oldActive: propertiesChanged.oldProperties.active,
    newRewardCut: propertiesChanged.newProperties.rewardCut,
    newFeeShare: propertiesChanged.newProperties.feeShare,
    newPendingFeeShare: propertiesChanged.newProperties.pendingFeeShare,
    newPendingRewardCut: propertiesChanged.newProperties.pendingRewardCut,
    newActive: propertiesChanged.newProperties.active
  }
  return body
}

const sendDelegatorNotificationEmail = async data => {
  const { subscriber, currentRoundInfo } = data
  try {
    const { templateId, body } = getBodyAndTemplateIdBasedOnDelegatorStatus(data)

    await sendEmail(subscriber.email, templateId, body)

    // Save the round in which the last email was sent
    subscriber.lastEmailSent = currentRoundInfo.id
    return await subscriber.save({ validateBeforeSave: false })
  } catch (e) {
    console.error(e)
    return
  }
}

const sendDelegatorNotificationDelegateChangeRulesEmail = async (
  subscriber,
  delegateAddress,
  propertiesChanged
) => {
  const { email } = subscriber
  try {
    if (!email) {
      throw new Error('The subscriber has no email')
    }

    const body = getRulesChangedTemplate(subscriber.address, delegateAddress, propertiesChanged)

    const templateId = sendgridTemplateIdNotificationDelegateChangeRules

    console.log(`Sending email to ${email} - Delegate change the rules`)
    await sendEmail(email, templateId, body)
  } catch (e) {
    console.error(e)
  }
  return
}

const sendDelegatorNotificationBondingPeriodHasEnded = async (
  subscriber,
  delegateAddress,
  currentRoundId
) => {
  try {
    if (!subscriber.email) {
      throw new Error('The subscriber has no email')
    }

    let body = {
      transcoderAddress: utils.truncateStringInTheMiddle(delegateAddress),
      delegatingStatusUrl: `https://explorer.livepeer.org/accounts/${subscriber.address}/delegating`,
      delegateAddress: delegateAddress,
      templateId: sendgridTemplateIdNotificationDelegatorBondingPeriodHasEnded,
      email: subscriber.email
    }

    await sendEmail(body)

    subscriber.lastPendingToBondingPeriodEmailSent = currentRoundId
    await subscriber.save({ validateBeforeSave: false })
  } catch (e) {
    console.error(e)
  }
  return
}

const delegatorEmailUtils = {
  sendDelegatorNotificationEmail,
  sendDelegatorNotificationDelegateChangeRulesEmail,
  sendDelegatorNotificationBondingPeriodHasEnded
}

module.exports = delegatorEmailUtils
