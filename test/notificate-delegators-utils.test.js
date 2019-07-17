const { DAILY_FREQUENCY, WEEKLY_FREQUENCY } = require('../config/constants')

const {
  sendEmailRewardCallNotificationToDelegators
} = require('../server/jobs/notificate-delegators-utils')

const {
  createDelegator,
  createSubscriber,
  getLivepeerDefaultConstants
} = require('../server/helpers/test/util')
const { getProtocolService } = require('../server/helpers/services/protocolService')
const { getDelegatorService } = require('../server/helpers/services/delegatorService')
const SubscriberUtils = require('../server/helpers/subscriberUtils')
const delegatorEmailUtils = require('../server/helpers/sendDelegatorEmail')
const Utils = require('../server/helpers/utils')
const Subscriber = require('../server/subscriber/subscriber.model')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonMongoose = require('sinon-mongoose')

describe('## NotificateDelegatorsUtils', () => {
  const protocolService = getProtocolService()
  const delegatorService = getDelegatorService()
  describe('# sendEmailRewardCallNotificationToDelegators', () => {
    it('If one of the given subscribers its an delegate, should skip sending notifications and log it', async () => {
      // given
      const subscriber = createSubscriber()
      const subscribers = [subscriber]
      const constants = getLivepeerDefaultConstants()
      const subscriptorRoleReturn = { role: constants.ROLE.TRANSCODER, constants, delegator: null }
      const resultExpected = `[Notificate-Delegators] - Not sending email to ${subscriber.email} because is a delegate`
      const resultExpected2 = `[Notificate-Delegators] - Emails subscribers to notify 0`
      const currentRound = 1
      const currentRoundInfo = {
        id: currentRound
      }

      // Stubs the return of Subscriber.find to return the list of subscribers
      const subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      const getSubscriptorRoleStub = sinon
        .stub(SubscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      const consoleLogMock = sinon.mock(console)

      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected)

      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected2)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      const getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      // when
      await sendEmailRewardCallNotificationToDelegators()

      // then

      subscriberMock.verify()
      consoleLogMock.verify()
      // restore stubs
      subscriberMock.restore()
      consoleLogMock.restore()
      getSubscriptorRoleStub.restore()
      getCurrentRoundInfoStub.restore()
    })
    it('If there are delegators on the subscribers which they never received an email, should send an email to them', async () => {
      // given
      const delegator = createDelegator()
      const lastEmailSent = null
      const lastTelegramSent = null
      const subscriber = createSubscriber()
      subscriber.lastEmailSent = lastEmailSent
      subscriber.lastTelegramSent = lastTelegramSent
      const subscribers = [subscriber]
      const constants = getLivepeerDefaultConstants()
      const subscriptorRoleReturn = { role: constants.ROLE.DELEGATOR, constants, delegator }
      const resultExpected = `[Notificate-Delegators] - Emails subscribers to notify ${subscribers.length}`
      const currentRound = 1
      const currentRoundInfo = {
        id: currentRound
      }

      // Stubs the return of Subscriber.find to return the list of subscribers
      const subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      const getSubscriptorRoleStub = sinon
        .stub(SubscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      const consoleLogMock = sinon.mock(console)

      const expectationConsole = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      const getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      const getDidDelegateCalledRewardStub = sinon
        .stub(Utils, 'getDidDelegateCalledReward')
        .returns(true)

      const getDelegatorNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorNextReward')
        .returns(1)

      const delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .once()
        .resolves(null)

      // when
      await sendEmailRewardCallNotificationToDelegators()

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      // restore stubs
      subscriberMock.restore()
      consoleLogMock.restore()
      getSubscriptorRoleStub.restore()
      getCurrentRoundInfoStub.restore()
      getDidDelegateCalledRewardStub.restore()
      getDelegatorNextRewardStub.restore()
      delegatorEmailUtilsMock.restore()
    })
    it('There is one delegator with weekly subscription, the current round is 10 and the last round in which an email was sent is 9, no emails should be sent', async () => {
      // given
      const delegator = createDelegator()
      const lastEmailSent = 9
      const lastTelegramSent = null
      const currentRound = 10
      const currentRoundInfo = {
        id: currentRound
      }
      const roundsDifference = currentRound - lastEmailSent
      const subscriber = createSubscriber()
      subscriber.lastEmailSent = lastEmailSent
      subscriber.lastTelegramSent = lastTelegramSent
      subscriber.emailFrequency = WEEKLY_FREQUENCY
      const subscribers = [subscriber]
      const constants = getLivepeerDefaultConstants()
      const subscriptorRoleReturn = { role: constants.ROLE.DELEGATOR, constants, delegator }
      const logExpectation1 = `[Notificate-Delegators] - Rounds between last email sent and current round: ${roundsDifference} - Subscription frequency: ${subscriber.emailFrequency} - Email ${subscriber.email} - Address  ${subscriber.address}`
      const logExpectation2 = `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
      const logExpectation3 = `[Notificate-Delegators] - Emails subscribers to notify 0`

      // Stubs the return of Subscriber.find to return the list of subscribers
      const subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      const getSubscriptorRoleStub = sinon
        .stub(SubscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      const consoleLogMock = sinon.mock(console)

      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation1)

      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation2)

      const expectationConsole3 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation3)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      const getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      const getDidDelegateCalledRewardStub = sinon
        .stub(Utils, 'getDidDelegateCalledReward')
        .returns(true)

      const getDelegatorNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorNextReward')
        .returns(1)

      const delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .never()
        .resolves(null)

      // when
      await sendEmailRewardCallNotificationToDelegators()

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      // restore stubs
      subscriberMock.restore()
      consoleLogMock.restore()
      getSubscriptorRoleStub.restore()
      getCurrentRoundInfoStub.restore()
      getDidDelegateCalledRewardStub.restore()
      getDelegatorNextRewardStub.restore()
      delegatorEmailUtilsMock.restore()
    })
    it('There is one delegator with weekly subscription, the current round is 10 and the last round in which an email was sent is 3, an email should be sent', async () => {
      // given
      const delegator = createDelegator()
      const lastEmailSent = 3
      const lastTelegramSent = null
      const currentRound = 10
      const currentRoundInfo = {
        id: currentRound
      }
      const roundsDifference = currentRound - lastEmailSent
      const subscriber = createSubscriber()
      subscriber.lastEmailSent = lastEmailSent
      subscriber.lastTelegramSent = lastTelegramSent
      subscriber.emailFrequency = WEEKLY_FREQUENCY
      const subscribers = [subscriber]
      const constants = getLivepeerDefaultConstants()
      const subscriptorRoleReturn = { role: constants.ROLE.DELEGATOR, constants, delegator }
      const logExpectation1 = `[Notificate-Delegators] - Rounds between last email sent and current round: ${roundsDifference} - Subscription frequency: ${subscriber.emailFrequency} - Email ${subscriber.email} - Address  ${subscriber.address}`
      const logExpectation2 = `[Notificate-Delegators] - Emails subscribers to notify ${subscribers.length}`

      // Stubs the return of Subscriber.find to return the list of subscribers
      const subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      const getSubscriptorRoleStub = sinon
        .stub(SubscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      const consoleLogMock = sinon.mock(console)

      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation1)

      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation2)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      const getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      const getDidDelegateCalledRewardStub = sinon
        .stub(Utils, 'getDidDelegateCalledReward')
        .returns(true)

      const getDelegatorNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorNextReward')
        .returns(1)

      const delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .once()
        .resolves(null)

      // when
      await sendEmailRewardCallNotificationToDelegators()

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      // restore stubs
      subscriberMock.restore()
      consoleLogMock.restore()
      getSubscriptorRoleStub.restore()
      getCurrentRoundInfoStub.restore()
      getDidDelegateCalledRewardStub.restore()
      getDelegatorNextRewardStub.restore()
      delegatorEmailUtilsMock.restore()
    })
    it('There is one delegator with daily subscription, the current round is 10 and the last round in which an email was sent is 9, an email should be sent', async () => {
      // given
      const delegator = createDelegator()
      const lastEmailSent = 9
      const lastTelegramSent = null
      const currentRound = 10
      const currentRoundInfo = {
        id: currentRound
      }
      const roundsDifference = currentRound - lastEmailSent
      const subscriber = createSubscriber()
      subscriber.lastEmailSent = lastEmailSent
      subscriber.lastTelegramSent = lastTelegramSent
      subscriber.emailFrequency = DAILY_FREQUENCY
      const subscribers = [subscriber]
      const constants = getLivepeerDefaultConstants()
      const subscriptorRoleReturn = { role: constants.ROLE.DELEGATOR, constants, delegator }
      const logExpectation1 = `[Notificate-Delegators] - Rounds between last email sent and current round: ${roundsDifference} - Subscription frequency: ${subscriber.emailFrequency} - Email ${subscriber.email} - Address  ${subscriber.address}`
      const logExpectation2 = `[Notificate-Delegators] - Emails subscribers to notify ${subscribers.length}`

      // Stubs the return of Subscriber.find to return the list of subscribers
      const subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      const getSubscriptorRoleStub = sinon
        .stub(SubscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      const consoleLogMock = sinon.mock(console)

      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation1)

      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation2)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      const getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      const getDidDelegateCalledRewardStub = sinon
        .stub(Utils, 'getDidDelegateCalledReward')
        .returns(true)

      const getDelegatorNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorNextReward')
        .returns(1)

      const delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .once()
        .resolves(null)

      // when
      await sendEmailRewardCallNotificationToDelegators()

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      // restore stubs
      subscriberMock.restore()
      consoleLogMock.restore()
      getSubscriptorRoleStub.restore()
      getCurrentRoundInfoStub.restore()
      getDidDelegateCalledRewardStub.restore()
      getDelegatorNextRewardStub.restore()
      delegatorEmailUtilsMock.restore()
    })
    it('There is one delegator with daily subscription, the current round is 10 and the last round in which an email was sent is 10, no emails should be sent', async () => {
      // given
      const delegator = createDelegator()
      const lastEmailSent = 10
      const lastTelegramSent = null
      const currentRound = 10
      const currentRoundInfo = {
        id: currentRound
      }
      const roundsDifference = currentRound - lastEmailSent
      const subscriber = createSubscriber()
      subscriber.lastEmailSent = lastEmailSent
      subscriber.lastTelegramSent = lastTelegramSent
      subscriber.emailFrequency = DAILY_FREQUENCY
      const subscribers = [subscriber]
      const constants = getLivepeerDefaultConstants()
      const subscriptorRoleReturn = { role: constants.ROLE.DELEGATOR, constants, delegator }
      const logExpectation1 = `[Notificate-Delegators] - Rounds between last email sent and current round: ${roundsDifference} - Subscription frequency: ${subscriber.emailFrequency} - Email ${subscriber.email} - Address  ${subscriber.address}`
      const logExpectation2 = `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} round and the frequency is ${subscriber.emailFrequency}`
      const logExpectation3 = `[Notificate-Delegators] - Emails subscribers to notify 0`

      // Stubs the return of Subscriber.find to return the list of subscribers
      const subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      const getSubscriptorRoleStub = sinon
        .stub(SubscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      const consoleLogMock = sinon.mock(console)

      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation1)

      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation2)

      const expectationConsole3 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation3)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      const getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      const getDidDelegateCalledRewardStub = sinon
        .stub(Utils, 'getDidDelegateCalledReward')
        .returns(true)

      const getDelegatorNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorNextReward')
        .returns(1)

      const delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .never()
        .resolves(null)

      // when
      await sendEmailRewardCallNotificationToDelegators()

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      // restore stubs
      subscriberMock.restore()
      consoleLogMock.restore()
      getSubscriptorRoleStub.restore()
      getCurrentRoundInfoStub.restore()
      getDidDelegateCalledRewardStub.restore()
      getDelegatorNextRewardStub.restore()
      delegatorEmailUtilsMock.restore()
    })
  })
})
