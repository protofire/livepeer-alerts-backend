const subscriberUtils = require('../server/helpers/subscriberUtils')
const Subscriber = require('../server/subscriber/subscriber.model')
const { VALID_SUBSCRIPTION_FREQUENCIES } = require('../config/constants')
const mongoose = require('mongoose')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonMongoose = require('sinon-mongoose')
chai.config.includeStack = true

/**
 * root level hooks
 */
after(done => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

describe('## Subscriber utils functions tests', function() {
  describe('# telegramSubscriptorExists', () => {
    it('Throws error if no chatId received', async () => {
      // given
      const resultExpected = true
      const chatId = null

      const countDocumentsStub = sinon.stub(Subscriber, 'countDocuments')

      // when
      let throwedErr = false
      try {
        await subscriberUtils.telegramSubscriptorExists(chatId)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(countDocumentsStub.called)
      // restore stubs
      countDocumentsStub.restore()
    })
    it('Should return true if there is at least one subscriber with the chatId received', async () => {
      // given
      const resultExpected = true
      const chatId = '1'
      const subscribersWithSameId = '2'

      const countDocumentsStub = sinon
        .stub(Subscriber, 'countDocuments')
        .resolves(subscribersWithSameId)

      // when
      const subscriptorExists = await subscriberUtils.telegramSubscriptorExists(chatId)

      // then
      expect(subscriptorExists).equal(resultExpected)
      expect(countDocumentsStub.called)
      // restore stubs
      countDocumentsStub.restore()
    })
    it('Should return false if there is no subscribers with the chatId received', async () => {
      // given
      const resultExpected = false
      const chatId = '1'
      const subscribersWithSameId = '0'

      const countDocumentsStub = sinon
        .stub(Subscriber, 'countDocuments')
        .resolves(subscribersWithSameId)

      // when
      const subscriptorExists = await subscriberUtils.telegramSubscriptorExists(chatId)

      // then
      expect(subscriptorExists).equal(resultExpected)
      expect(countDocumentsStub.called)
      // restore stubs
      countDocumentsStub.restore()
    })
  })
  describe('# isValidFrequency', () => {
    it('Returns false if the received frequency is not defined', async () => {
      // given
      const resultExpected = false
      const frequency = null

      // when
      const subscriptorExists = await subscriberUtils.isValidFrequency(frequency)

      // then
      expect(subscriptorExists).equal(resultExpected)
    })
    it('Returns true if the received frequency is on the valid frequencies array', async () => {
      // given
      const resultExpected = true
      let isValidFrequencyResult = true

      // when
      for (let frequency of VALID_SUBSCRIPTION_FREQUENCIES) {
        isValidFrequencyResult = await subscriberUtils.isValidFrequency(frequency)
        if (!isValidFrequencyResult) {
          break
        }
      }

      // then
      expect(isValidFrequencyResult).equal(resultExpected)
    })
    it('Returns false if the received frequency is not on the valid frequencies array', async () => {
      // given
      const resultExpected = false
      const frequency = 'asdasdasd'

      // when
      const isValidFrequencyResult = await subscriberUtils.isValidFrequency(frequency)

      // then
      expect(isValidFrequencyResult).equal(resultExpected)
    })
  })
  describe('# createEmailSubscriptor', () => {
    it('Throws error if no address received', async () => {
      // given
      const resultExpected = true
      const email = 'asd@test.com'
      const address = null
      const emailFrequency = VALID_SUBSCRIPTION_FREQUENCIES[0]

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createEmailSubscriptor(address, email, emailFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Throws error if no email received', async () => {
      // given
      const resultExpected = true
      const email = null
      const address = '1231231'
      const emailFrequency = VALID_SUBSCRIPTION_FREQUENCIES[0]

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createEmailSubscriptor(address, email, emailFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Throws error if no emailFrequency received', async () => {
      // given
      const resultExpected = true
      const email = 'asd@test.com'
      const address = '123123123'
      const emailFrequency = null

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createEmailSubscriptor(address, email, emailFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Throws error if the subscriptor already exists', async () => {
      // given
      const resultExpected = true
      const email = 'asd@test.com'
      const address = '123123123'
      const emailFrequency = '1231'

      const emailSubscriptorExistsStub = sinon
        .stub(subscriberUtils, 'emailSubscriptorExists')
        .resolves(true)

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createEmailSubscriptor(address, email, emailFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(emailSubscriptorExistsStub.called)
      // restore mocks
      emailSubscriptorExistsStub.restore()
    })
    it('If the subscriptor not exists, creates a new one and return it', async () => {
      // given
      const email = 'asd@test.com'
      const address = '123123123'
      const emailFrequency = '1231'
      const createdSubscriber = new Subscriber({
        email,
        address,
        emailFrequency
      })

      const emailSubscriptorExistsStub = sinon
        .stub(subscriberUtils, 'emailSubscriptorExists')
        .resolves(false)

      // Stubs the Round.findById to return a round object
      const subscriberMock = sinon.stub(Subscriber.prototype, 'save').returns(createdSubscriber)

      const isValidFrequencyStub = sinon.stub(subscriberUtils, 'isValidFrequency').returns(true)

      // when
      const result = await subscriberUtils.createEmailSubscriptor(address, email, emailFrequency)

      // then
      expect(result).equal(createdSubscriber)
      expect(emailSubscriptorExistsStub.called)
      // restore mocks
      emailSubscriptorExistsStub.restore()
      subscriberMock.restore()
      isValidFrequencyStub.restore()
    })
  })
  describe('# createTelegramSubscriptor', () => {
    it('Throws error if no address received', async () => {
      // given
      const resultExpected = true
      const chatId = '1'
      const telegramFrequency = VALID_SUBSCRIPTION_FREQUENCIES[0]
      const address = null

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createTelegramSubscriptor(address, chatId, telegramFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Throws error if no chatId received', async () => {
      // given
      const resultExpected = true
      const chatId = null
      const address = '1231231'
      const telegramFrequency = VALID_SUBSCRIPTION_FREQUENCIES[0]

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createTelegramSubscriptor(address, chatId, telegramFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Throws error if no telegramFrequency received', async () => {
      // given
      const resultExpected = true
      const chatId = '1'
      const address = '1231231'
      const telegramFrequency = null

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createTelegramSubscriptor(address, chatId, telegramFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Throws error if the subscriptor already exists', async () => {
      // given
      const resultExpected = true
      const chatId = '1'
      const address = '1231231'
      const telegramFrequency = VALID_SUBSCRIPTION_FREQUENCIES[0]

      const telegramSubscriptorExistsStub = sinon
        .stub(subscriberUtils, 'telegramSubscriptorExists')
        .resolves(true)

      // when
      let throwedErr = false
      try {
        await subscriberUtils.createTelegramSubscriptor(address, chatId, telegramFrequency)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(telegramSubscriptorExistsStub.called)
      // restore mocks
      telegramSubscriptorExistsStub.restore()
    })
    it('If the subscriptor not exists, creates a new one and return it', async () => {
      // given
      const chatId = '1'
      const address = '1231231'
      const telegramFrequency = VALID_SUBSCRIPTION_FREQUENCIES[0]
      const createdSubscriber = new Subscriber({
        address,
        telegramChatId: chatId,
        telegramFrequency
      })

      const telegramSubscriptorExistsStub = sinon
        .stub(subscriberUtils, 'telegramSubscriptorExists')
        .resolves(false)

      // Stubs the Round.findById to return a round object
      const subscriberMock = sinon.stub(Subscriber.prototype, 'save').returns(createdSubscriber)

      const isValidFrequencyStub = sinon.stub(subscriberUtils, 'isValidFrequency').returns(true)

      // when
      const result = await subscriberUtils.createTelegramSubscriptor(
        address,
        chatId,
        telegramFrequency
      )

      // then
      expect(result).equal(createdSubscriber)
      expect(telegramSubscriptorExistsStub.called)
      // restore mocks
      telegramSubscriptorExistsStub.restore()
      subscriberMock.restore()
      isValidFrequencyStub.restore()
    })
  })
})
