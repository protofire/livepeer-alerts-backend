const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const { sendRoundNotifications } = require('../server/helpers/notification/notificationUtils')
const notificateDelegateUtil = require('../server/helpers/notification/notificateDelegateUtils')
const notificateDelegatorUtil = require('../server/helpers/notification/notificateDelegatorUtils')

describe('## Notification utils test', () => {
  describe('# sendRoundNotifications', () => {
    it('If the is no roundProgress  received, should throw error', async () => {
      // given
      const roundProgress = null
      const round = {}
      const thresholdSendNotification = '20'
      let throwedError = false
      const expectedThrow = true

      // when
      try {
        const result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
    })
    it('If the is no round  received, should throw error', async () => {
      // given
      const roundProgress = '50'
      const round = null
      const thresholdSendNotification = '20'
      let throwedError = false
      const expectedThrow = true

      // when
      try {
        const result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
    })
    it('If the is no thresholdSendNotification  received, should throw error', async () => {
      // given
      const roundProgress = '50'
      const round = {}
      const thresholdSendNotification = null
      let throwedError = false
      const expectedThrow = true

      // when
      try {
        const result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
    })
    it('If the round received has no id, should throw error', async () => {
      // given
      const roundProgress = '50'
      const round = {}
      const thresholdSendNotification = '20'
      let throwedError = false
      const expectedThrow = true

      // when
      try {
        const result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
    })
    it('If the notifications for the round were already sent, should not send notifications', async () => {
      // given
      const roundProgress = '50'
      const roundId = '1'
      const notificationsForRoundSent = true
      const round = { _id: roundId, notificationsForRoundSent }
      const thresholdSendNotification = '20'
      let throwedError = false
      const expectedThrow = false
      const resultExpected = false
      let result

      const notificateDelegatorMock = sinon.mock(notificateDelegatorUtil)

      const notificateDelegatorExpect1 = notificateDelegatorMock
        .expects('sendEmailRewardCallNotificationToDelegators')
        .never()
      const notificateDelegatorExpect2 = notificateDelegatorMock
        .expects('sendTelegramRewardCallNotificationToDelegators')
        .never()

      const notificateDelegateMock = sinon.mock(notificateDelegateUtil)

      const notificateDelegateExpect1 = notificateDelegateMock
        .expects('sendEmailRewardCallNotificationToDelegates')
        .never()
      const notificateDelegateExpect2 = notificateDelegateMock
        .expects('sendTelegramRewardCallNotificationToDelegates')
        .never()

      // when
      try {
        result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
      expect(result).equal(resultExpected)
      notificateDelegateMock.verify()
      notificateDelegatorMock.verify()
      // restore mocks
      notificateDelegateMock.restore()
      notificateDelegatorMock.restore()
    })
    it('The round is 40% to end (the completed progress its 60%). The threshold is 30% (70% of completed progress) -> send notifications', async () => {
      // given
      const roundProgress = '40' // This means that the round is 40% to end (or 60% completed)
      const roundId = '1'
      const notificationsForRoundSent = false
      const round = { _id: roundId, notificationsForRoundSent, save: () => {} }
      const thresholdSendNotification = '30' // Should send notifications if the progress its 70% completed or 30% to finish

      const notificateDelegatorMock = sinon.mock(notificateDelegatorUtil)

      const notificateDelegatorExpect1 = notificateDelegatorMock
        .expects('sendEmailRewardCallNotificationToDelegators')
        .once()
      const notificateDelegatorExpect2 = notificateDelegatorMock
        .expects('sendTelegramRewardCallNotificationToDelegators')
        .once()

      const notificateDelegateMock = sinon.mock(notificateDelegateUtil)

      const notificateDelegateExpect1 = notificateDelegateMock
        .expects('sendEmailRewardCallNotificationToDelegates')
        .once()
      const notificateDelegateExpect2 = notificateDelegateMock
        .expects('sendTelegramRewardCallNotificationToDelegates')
        .once()

      const roundMock = sinon.mock(round)

      const roundExpect = roundMock
        .expects('save')
        .once()
        .resolves(null)

      // when
      await sendRoundNotifications(roundProgress, round, thresholdSendNotification)

      // then
      notificateDelegateMock.verify()
      notificateDelegatorMock.verify()
      // restore mocks
      notificateDelegateMock.restore()
      notificateDelegatorMock.restore()
      roundMock.restore()
    })
    it('The round is 100% to end (the completed progress its 0%). The threshold is 30% (70% of completed progress) -> do not send notifications', async () => {
      // given
      const roundProgress = '100' // This means that the round is 100% to end (or 0% completed)
      const roundId = '1'
      const notificationsForRoundSent = false
      const round = { _id: roundId, notificationsForRoundSent }
      const thresholdSendNotification = '30' // Should send notifications if the progress its 70% completed or 30% to finish

      const notificateDelegatorMock = sinon.mock(notificateDelegatorUtil)

      const notificateDelegatorExpect1 = notificateDelegatorMock
        .expects('sendEmailRewardCallNotificationToDelegators')
        .never()
      const notificateDelegatorExpect2 = notificateDelegatorMock
        .expects('sendTelegramRewardCallNotificationToDelegators')
        .never()

      const notificateDelegateMock = sinon.mock(notificateDelegateUtil)

      const notificateDelegateExpect1 = notificateDelegateMock
        .expects('sendEmailRewardCallNotificationToDelegates')
        .never()
      const notificateDelegateExpect2 = notificateDelegateMock
        .expects('sendTelegramRewardCallNotificationToDelegates')
        .never()

      // when
      await sendRoundNotifications(roundProgress, round, thresholdSendNotification)

      // then
      notificateDelegateMock.verify()
      notificateDelegatorMock.verify()
      // restore mocks
      notificateDelegateMock.restore()
      notificateDelegatorMock.restore()
    })
    it('The round is 10% to end (the completed progress its 90%). The threshold is 30% (70% of completed progress) -> do not send notifications', async () => {
      // given
      const roundProgress = '10' // This means that the round is 40% to end (or 60% completed)
      const roundId = '1'
      const notificationsForRoundSent = false
      const round = { _id: roundId, notificationsForRoundSent }
      const thresholdSendNotification = '30' // Should send notifications if the progress its 70% completed or 30% to finish

      const notificateDelegatorMock = sinon.mock(notificateDelegatorUtil)

      const notificateDelegatorExpect1 = notificateDelegatorMock
        .expects('sendEmailRewardCallNotificationToDelegators')
        .never()
      const notificateDelegatorExpect2 = notificateDelegatorMock
        .expects('sendTelegramRewardCallNotificationToDelegators')
        .never()

      const notificateDelegateMock = sinon.mock(notificateDelegateUtil)

      const notificateDelegateExpect1 = notificateDelegateMock
        .expects('sendEmailRewardCallNotificationToDelegates')
        .never()
      const notificateDelegateExpect2 = notificateDelegateMock
        .expects('sendTelegramRewardCallNotificationToDelegates')
        .never()

      // when
      await sendRoundNotifications(roundProgress, round, thresholdSendNotification)

      // then
      notificateDelegateMock.verify()
      notificateDelegatorMock.verify()
      // restore mocks
      notificateDelegateMock.restore()
      notificateDelegatorMock.restore()
    })
    it('If the notifications for the round were not already sent, but the roundProgress is bellow the threshold should not send notifications', async () => {
      // given
      const roundProgress = '10' // this means that the round is 10% from the end, not from the start
      const roundId = '1'
      const notificationsForRoundSent = false
      const round = { _id: roundId, notificationsForRoundSent }
      const thresholdSendNotification = '30' // this means that when the progress is at least 70% (or 30% in roundProgress) the notifications must be sent
      let throwedError = false
      const expectedThrow = false
      const resultExpected = false
      let result

      const notificateDelegatorMock = sinon.mock(notificateDelegatorUtil)

      const notificateDelegatorExpect1 = notificateDelegatorMock
        .expects('sendEmailRewardCallNotificationToDelegators')
        .never()
      const notificateDelegatorExpect2 = notificateDelegatorMock
        .expects('sendTelegramRewardCallNotificationToDelegators')
        .never()

      const notificateDelegateMock = sinon.mock(notificateDelegateUtil)

      const notificateDelegateExpect1 = notificateDelegateMock
        .expects('sendEmailRewardCallNotificationToDelegates')
        .never()
      const notificateDelegateExpect2 = notificateDelegateMock
        .expects('sendTelegramRewardCallNotificationToDelegates')
        .never()

      // when
      try {
        result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
      expect(result).equal(resultExpected)
      notificateDelegateMock.verify()
      notificateDelegatorMock.verify()
      // restore mocks
      notificateDelegateMock.restore()
      notificateDelegatorMock.restore()
    })
    it('If the notifications for the round were not already sent, and the roundProgress is above the threshold should send notifications', async () => {
      // given
      const roundProgress = '21'
      const roundId = '1'
      const notificationsForRoundSent = false
      const round = { _id: roundId, notificationsForRoundSent, save: () => {} }
      const thresholdSendNotification = '20'
      let throwedError = false
      const expectedThrow = false
      const resultExpected = true
      let result

      const notificateDelegatorMock = sinon.mock(notificateDelegatorUtil)

      const notificateDelegatorExpect1 = notificateDelegatorMock
        .expects('sendEmailRewardCallNotificationToDelegators')
        .once()
        .resolves(null)
      const notificateDelegatorExpect2 = notificateDelegatorMock
        .expects('sendTelegramRewardCallNotificationToDelegators')
        .once()
        .resolves(null)

      const notificateDelegateMock = sinon.mock(notificateDelegateUtil)

      const notificateDelegateExpect1 = notificateDelegateMock
        .expects('sendEmailRewardCallNotificationToDelegates')
        .once()
        .resolves(null)
      const notificateDelegateExpect2 = notificateDelegateMock
        .expects('sendTelegramRewardCallNotificationToDelegates')
        .once()
        .resolves(null)

      const roundMock = sinon.mock(round)

      const roundExpect = roundMock
        .expects('save')
        .once()
        .resolves(null)

      // when
      try {
        result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
      expect(result).equal(resultExpected)
      notificateDelegateMock.verify()
      notificateDelegatorMock.verify()
      roundMock.verify()
      // restore mocks
      notificateDelegateMock.restore()
      notificateDelegatorMock.restore()
      roundMock.restore()
    })
    it('If the notifications for the round were not already sent, and the roundProgress is the same as the threshold should send notifications', async () => {
      // given
      const roundProgress = '20'
      const roundId = '1'
      const notificationsForRoundSent = false
      const round = { _id: roundId, notificationsForRoundSent, save: () => {} }
      const thresholdSendNotification = '20'
      let throwedError = false
      const expectedThrow = false
      const resultExpected = true
      let result

      const notificateDelegatorMock = sinon.mock(notificateDelegatorUtil)

      const notificateDelegatorExpect1 = notificateDelegatorMock
        .expects('sendEmailRewardCallNotificationToDelegators')
        .once()
        .resolves(null)
      const notificateDelegatorExpect2 = notificateDelegatorMock
        .expects('sendTelegramRewardCallNotificationToDelegators')
        .once()
        .resolves(null)

      const notificateDelegateMock = sinon.mock(notificateDelegateUtil)

      const notificateDelegateExpect1 = notificateDelegateMock
        .expects('sendEmailRewardCallNotificationToDelegates')
        .once()
        .resolves(null)
      const notificateDelegateExpect2 = notificateDelegateMock
        .expects('sendTelegramRewardCallNotificationToDelegates')
        .once()
        .resolves(null)

      const roundMock = sinon.mock(round)

      const roundExpect = roundMock
        .expects('save')
        .once()
        .resolves(null)

      // when
      try {
        result = await sendRoundNotifications(roundProgress, round, thresholdSendNotification)
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
      expect(result).equal(resultExpected)
      notificateDelegateMock.verify()
      notificateDelegatorMock.verify()
      roundMock.verify()
      // restore mocks
      notificateDelegateMock.restore()
      notificateDelegatorMock.restore()
      roundMock.restore()
    })
  })
})
