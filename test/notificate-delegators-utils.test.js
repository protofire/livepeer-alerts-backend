const { DAILY_FREQUENCY, WEEKLY_FREQUENCY } = require('../config/constants')

const {
  createDelegator,
  createSubscriber,
  getLivepeerDefaultConstants
} = require('../server/helpers/test/util')
const { getProtocolService } = require('../server/helpers/services/protocolService')
const { getDelegatorService } = require('../server/helpers/services/delegatorService')
const subscriberUtils = require('../server/helpers/subscriberUtils')
const delegatorEmailUtils = require('../server/helpers/sendDelegatorEmail')
const notificateDelegatorUtils = require('../server/helpers/notification/notificateDelegatorUtils')
const delegatorsUtils = require('../server/helpers/delegatorUtils')
const utils = require('../server/helpers/utils')
const Subscriber = require('../server/subscriber/subscriber.model')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonMongoose = require('sinon-mongoose')

describe('## NotificateDelegatorsUtils', () => {
  const protocolService = getProtocolService()
  const delegatorService = getDelegatorService()
  let subscriberMock,
    consoleLogMock,
    getSubscriptorRoleStub,
    getCurrentRoundInfoStub,
    getDidDelegateCalledRewardStub,
    getDelegatorNextRewardStub,
    delegatorEmailUtilsMock,
    getLivepeerDefaultConstantsStub,
    getSubscribersDelegatorsAndDelegatorStub,
    delegatorsUtilsMock
  afterEach('Restore all the mocks', () => {
    if (subscriberMock) {
      subscriberMock.restore()
    }
    if (consoleLogMock) {
      consoleLogMock.restore()
    }
    if (getSubscriptorRoleStub) {
      getSubscriptorRoleStub.restore()
    }
    if (getCurrentRoundInfoStub) {
      getCurrentRoundInfoStub.restore()
    }
    if (getDidDelegateCalledRewardStub) {
      getDidDelegateCalledRewardStub.restore()
    }
    if (getDelegatorNextRewardStub) {
      getDelegatorNextRewardStub.restore()
    }
    if (delegatorEmailUtilsMock) {
      delegatorEmailUtilsMock.restore()
    }
    if (getLivepeerDefaultConstantsStub) {
      getLivepeerDefaultConstantsStub.restore()
    }
    if (getSubscribersDelegatorsAndDelegatorStub) {
      getSubscribersDelegatorsAndDelegatorStub.restore()
    }
    if (delegatorsUtilsMock) {
      delegatorsUtilsMock.restore()
    }
  })
  describe('# sendEmailRewardCallNotificationToDelegators', () => {
    it('Should throw an error if no currentRoundInfo received', async () => {
      // given
      const currentRoundInfo = null
      let result = false
      const resultExpected = true
      // when
      try {
        await notificateDelegatorUtils.sendEmailRewardCallNotificationToDelegators(currentRoundInfo)
      } catch (err) {
        result = true
      }
      // then
      expect(result).equal(resultExpected)
    })
    it('If there are no subscribers delegators, should sent no emails', async () => {
      // given
      const currentRound = 1
      const currentRoundInfo = {
        id: currentRound
      }
      const subscribersDelegators = []
      const constants = getLivepeerDefaultConstants()
      const resultExpected1 = `[Notificate-Delegators] - Start sending email notification to delegators`
      const resultExpected2 = `[Notificate-Delegators] - Emails subscribers to notify 0`

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      getSubscribersDelegatorsAndDelegatorStub = sinon
        .stub(subscriberUtils, 'getEmailSubscribersDelegators')
        .returns(subscribersDelegators)

      consoleLogMock = sinon.mock(console)

      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected1)

      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected2)

      getDidDelegateCalledRewardStub = sinon.stub(utils, 'getDidDelegateCalledReward').returns(true)

      getLivepeerDefaultConstantsStub = sinon
        .stub(protocolService, 'getLivepeerDefaultConstants')
        .returns(constants)

      getDelegatorNextRewardStub = sinon.stub(delegatorService, 'getDelegatorNextReward').returns(1)

      delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .never()
        .resolves(null)

      // when
      await notificateDelegatorUtils.sendEmailRewardCallNotificationToDelegators(currentRoundInfo)

      // then
      expect(getSubscribersDelegatorsAndDelegatorStub.called)
      expect(getLivepeerDefaultConstantsStub.called)
      expect(getDelegatorNextRewardStub.called)
      expect(getDidDelegateCalledRewardStub.called)
      consoleLogMock.verify()
      delegatorEmailUtilsMock.verify()
    })
    it('If there are delegators on the subscribers list which they never received an email, should send an email to them', async () => {
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
      const resultExpected1 = `[Notificate-Delegators] - Start sending email notification to delegators`
      const resultExpected2 = `[Notificate-Delegators] - Emails subscribers to notify ${subscribers.length}`
      const resultExpected3 = `[Subscribers-utils] - Returning list of email subscribers delegators`
      const resultExpected4 = `[Subscribers-utils] - Amount of email subscribers delegators: ${subscribers.length}`
      const currentRound = 1
      const currentRoundInfo = {
        id: currentRound
      }

      // Stubs the return of Subscriber.find to return the list of subscribers
      subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      getSubscriptorRoleStub = sinon
        .stub(subscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      consoleLogMock = sinon.mock(console)

      const expectationConsole = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected1)

      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected2)

      const expectationConsole3 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected3)

      const expectationConsole4 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(resultExpected4)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      getDidDelegateCalledRewardStub = sinon.stub(utils, 'getDidDelegateCalledReward').returns(true)

      getDelegatorNextRewardStub = sinon.stub(delegatorService, 'getDelegatorNextReward').returns(1)

      getLivepeerDefaultConstantsStub = sinon
        .stub(protocolService, 'getLivepeerDefaultConstants')
        .returns(constants)

      delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .once()
        .resolves(null)

      // when
      await notificateDelegatorUtils.sendEmailRewardCallNotificationToDelegators(currentRoundInfo)

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      expect(getLivepeerDefaultConstantsStub.called)
      expect(getDelegatorNextRewardStub.called)
      expect(getDidDelegateCalledRewardStub.called)
      expect(getCurrentRoundInfoStub.called)
      expect(getSubscriptorRoleStub.called)
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
      const logExpectation1 = `[Notificate-Delegators] - Start sending email notification to delegators`
      const logExpectation2 = `[Notificate-Delegators] - Emails subscribers to notify 0`
      const logExpectation3 = `[Subscribers-utils] - Returning list of email subscribers delegators`
      const logExpectation4 = `[Subscribers-utils] - Amount of email subscribers delegators: ${subscribers.length}`
      const logExpectation5 = `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} round and the frequency is ${subscriber.emailFrequency}`

      // Stubs the return of Subscriber.find to return the list of subscribers
      subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      getSubscriptorRoleStub = sinon
        .stub(subscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      consoleLogMock = sinon.mock(console)

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

      const expectationConsole4 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation4)

      const expectationConsole5 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation5)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      getDidDelegateCalledRewardStub = sinon.stub(utils, 'getDidDelegateCalledReward').returns(true)

      getDelegatorNextRewardStub = sinon.stub(delegatorService, 'getDelegatorNextReward').returns(1)

      getLivepeerDefaultConstantsStub = sinon
        .stub(protocolService, 'getLivepeerDefaultConstants')
        .returns(constants)

      delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .never()
        .resolves(null)

      // when
      await notificateDelegatorUtils.sendEmailRewardCallNotificationToDelegators(currentRoundInfo)

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      expect(getLivepeerDefaultConstantsStub.called)
      expect(getDelegatorNextRewardStub.called)
      expect(getDidDelegateCalledRewardStub.called)
      expect(getCurrentRoundInfoStub.called)
      expect(getSubscriptorRoleStub.called)
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
      const subscriber = createSubscriber()
      subscriber.lastEmailSent = lastEmailSent
      subscriber.lastTelegramSent = lastTelegramSent
      subscriber.emailFrequency = WEEKLY_FREQUENCY
      const subscribers = [subscriber]
      const constants = getLivepeerDefaultConstants()
      const subscriptorRoleReturn = { role: constants.ROLE.DELEGATOR, constants, delegator }
      const logExpectation1 = `[Notificate-Delegators] - Start sending email notification to delegators`
      const logExpectation2 = `[Notificate-Delegators] - Emails subscribers to notify ${subscribers.length}`
      const logExpectation3 = `[Subscribers-utils] - Returning list of email subscribers delegators`
      const logExpectation4 = `[Subscribers-utils] - Amount of email subscribers delegators: ${subscribers.length}`

      // Stubs the return of Subscriber.find to return the list of subscribers
      subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      getSubscriptorRoleStub = sinon
        .stub(subscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      consoleLogMock = sinon.mock(console)

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

      const expectationConsole4 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation4)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      getDidDelegateCalledRewardStub = sinon.stub(utils, 'getDidDelegateCalledReward').returns(true)

      getDelegatorNextRewardStub = sinon.stub(delegatorService, 'getDelegatorNextReward').returns(1)

      getLivepeerDefaultConstantsStub = sinon
        .stub(protocolService, 'getLivepeerDefaultConstants')
        .returns(constants)

      delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .once()
        .resolves(null)

      // Should get the delegator weekly summary
      delegatorsUtilsMock = sinon.mock(delegatorsUtils)

      const expectation2 = delegatorsUtilsMock
        .expects('getDelegatorSharesSummary')
        .once()
        .resolves(null)

      // when
      await notificateDelegatorUtils.sendEmailRewardCallNotificationToDelegators(currentRoundInfo)

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      delegatorsUtilsMock.verify()
      expect(getLivepeerDefaultConstantsStub.called)
      expect(getDelegatorNextRewardStub.called)
      expect(getDidDelegateCalledRewardStub.called)
      expect(getCurrentRoundInfoStub.called)
      expect(getSubscriptorRoleStub.called)
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
      const logExpectation1 = `[Notificate-Delegators] - Start sending email notification to delegators`
      const logExpectation2 = `[Notificate-Delegators] - Emails subscribers to notify ${subscribers.length}`
      const logExpectation3 = `[Subscribers-utils] - Returning list of email subscribers delegators`
      const logExpectation4 = `[Subscribers-utils] - Amount of email subscribers delegators: ${subscribers.length}`

      // Stubs the return of Subscriber.find to return the list of subscribers
      subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      const getSubscriptorRoleStub = sinon
        .stub(subscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      consoleLogMock = sinon.mock(console)

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

      const expectationConsole4 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation4)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      getDidDelegateCalledRewardStub = sinon.stub(utils, 'getDidDelegateCalledReward').returns(true)

      getDelegatorNextRewardStub = sinon.stub(delegatorService, 'getDelegatorNextReward').returns(1)

      getLivepeerDefaultConstantsStub = sinon
        .stub(protocolService, 'getLivepeerDefaultConstants')
        .returns(constants)

      delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .once()
        .resolves(null)

      // when
      await notificateDelegatorUtils.sendEmailRewardCallNotificationToDelegators(currentRoundInfo)

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      expect(getLivepeerDefaultConstantsStub.called)
      expect(getDelegatorNextRewardStub.called)
      expect(getDidDelegateCalledRewardStub.called)
      expect(getCurrentRoundInfoStub.called)
      expect(getSubscriptorRoleStub.called)
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
      const logExpectation1 = `[Notificate-Delegators] - Start sending email notification to delegators`
      const logExpectation2 = `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} round and the frequency is ${subscriber.emailFrequency}`
      const logExpectation3 = `[Notificate-Delegators] - Emails subscribers to notify 0`
      const logExpectation4 = `[Subscribers-utils] - Returning list of email subscribers delegators`
      const logExpectation5 = `[Subscribers-utils] - Amount of email subscribers delegators: ${subscribers.length}`

      // Stubs the return of Subscriber.find to return the list of subscribers
      subscriberMock = sinon.mock(Subscriber)

      const expectationSubscriber = subscriberMock
        .expects('find')
        .once()
        .resolves(subscribers)

      // Stubs the return of getSubscriptorRole to make the subscriber a delegate
      getSubscriptorRoleStub = sinon
        .stub(subscriberUtils, 'getSubscriptorRole')
        .returns(subscriptorRoleReturn)

      consoleLogMock = sinon.mock(console)

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

      const expectationConsole4 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation4)

      const expectationConsole5 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation5)

      // Stubs the return of getCurrentRoundInfo to return an mocked id
      getCurrentRoundInfoStub = sinon
        .stub(protocolService, 'getCurrentRoundInfo')
        .returns(currentRoundInfo)

      getDidDelegateCalledRewardStub = sinon.stub(utils, 'getDidDelegateCalledReward').returns(true)

      getDelegatorNextRewardStub = sinon.stub(delegatorService, 'getDelegatorNextReward').returns(1)

      getLivepeerDefaultConstantsStub = sinon
        .stub(protocolService, 'getLivepeerDefaultConstants')
        .returns(constants)

      delegatorEmailUtilsMock = sinon.mock(delegatorEmailUtils)

      const expectation = delegatorEmailUtilsMock
        .expects('sendDelegatorNotificationEmail')
        .never()
        .resolves(null)
      // when

      await notificateDelegatorUtils.sendEmailRewardCallNotificationToDelegators(currentRoundInfo)

      // then
      consoleLogMock.verify()
      subscriberMock.verify()
      delegatorEmailUtilsMock.verify()
      expect(getLivepeerDefaultConstantsStub.called)
      expect(getDelegatorNextRewardStub.called)
      expect(getDidDelegateCalledRewardStub.called)
      expect(getCurrentRoundInfoStub.called)
      expect(getSubscriptorRoleStub.called)
    })
  })
})
