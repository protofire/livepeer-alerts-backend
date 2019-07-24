const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const {
  sendRoundNotifications,
  generateNotificationList
} = require('../server/helpers/notification/notificationUtils')
const notificateDelegateUtil = require('../server/helpers/notification/notificateDelegateUtils')
const notificateDelegatorUtil = require('../server/helpers/notification/notificateDelegatorUtils')
const utils = require('../server/helpers/utils')

const { getProtocolService } = require('../server/helpers/services/protocolService')

const { getDelegateService } = require('../server/helpers/services/delegateService')

describe('## Notification utils test', () => {
  const delegatesGraphql = require('../server/helpers/graphql/queries/delegate')
  const protocolService = getProtocolService()
  const delegateService = getDelegateService(delegatesGraphql)
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
  describe('# generateNotificationList', () => {
    it('if receives an empty list returns []', done => {
      // given
      const resultExpected = []
      const listOfChangedDelegates = []
      const listOfDelegatesAndDelegators = []
      const listOfPropertiesChanged = []

      // when
      const result = generateNotificationList(
        listOfChangedDelegates,
        listOfDelegatesAndDelegators,
        listOfPropertiesChanged
      )

      // then
      expect(result).to.deep.equal(resultExpected)
      done()
    })
    it('if receive a null object returns []', done => {
      // given
      const resultExpected = []
      const listOfChangedDelegates = null
      const listOfDelegatesAndDelegators = null
      const listOfPropertiesChanged = []

      // when
      const result = generateNotificationList(
        listOfChangedDelegates,
        listOfDelegatesAndDelegators,
        listOfPropertiesChanged
      )

      // then
      expect(result).to.deep.equal(resultExpected)
      done()
    })
    it('receives two changed delegates, with two different delegators, should generate two notifications', done => {
      // given
      const delegate1 = {
        _id: '1'
      }
      const delegate2 = {
        _id: '2'
      }
      const subscriber1 = {
        email: 'test@test.com'
      }
      const subscriber2 = {
        email: 'test2@test.com'
      }
      const delegatorAdd1 = '10'
      const delegatorAdd2 = '20'
      const propertieChanged1 = {
        hasChanged: true,
        id: delegate1._id,
        newProperties: [],
        oldProperties: {}
      }
      const propertieChanged2 = {
        hasChanged: true,
        id: delegate2._id,
        newProperties: [],
        oldProperties: {}
      }
      const resultExpected = [
        {
          delegatorAddress: delegatorAdd1,
          delegateAddress: delegate1._id,
          delegate: delegate1,
          subscriber: subscriber1,
          propertiesChanged: {
            ...propertieChanged1
          }
        },
        {
          delegatorAddress: delegatorAdd2,
          delegateAddress: delegate2._id,
          delegate: delegate2,
          subscriber: subscriber2,
          propertiesChanged: {
            ...propertieChanged2
          }
        }
      ]
      const listOfChangedDelegates = [delegate1, delegate2]
      const listOfDelegatesAndDelegators = [
        {
          delegatorAddress: delegatorAdd1,
          delegateAddress: delegate1._id,
          subscriber: subscriber1
        },
        {
          delegatorAddress: delegatorAdd2,
          delegateAddress: delegate2._id,
          subscriber: subscriber2
        }
      ]
      const listOfPropertiesChanged = [
        {
          ...propertieChanged1
        },
        {
          ...propertieChanged2
        }
      ]

      // when
      const result = generateNotificationList(
        listOfChangedDelegates,
        listOfDelegatesAndDelegators,
        listOfPropertiesChanged
      )

      // then
      expect(result).to.deep.equal(resultExpected)
      done()
    })
    it('100 minted tokens for next round, protocol bondedStake is 1400, the bondedStake of the delegate is 512.4 (36.6% of the totalBonded), result should be 36.6', async () => {
      // given
      const totalStake = utils.unitAmountInTokenUnits('512.4')
      const totalBondedStake = utils.unitAmountInTokenUnits(1400)
      const getTotalStakeStub = sinon
        .stub(delegateService, 'getDelegateTotalStake')
        .returns(totalStake)
      const mintedTokensStub = sinon
        .stub(protocolService, 'getMintedTokensForNextRound')
        .returns(100)

      const totalBondedStub = sinon
        .stub(protocolService, 'getTotalBonded')
        .returns(totalBondedStake)

      const rewardExpected = '36.6'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getTotalStakeStub.called)
      expect(mintedTokensStub.called)
      expect(totalBondedStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getTotalStakeStub.restore()
      mintedTokensStub.restore()
      totalBondedStub.restore()
    })
    it('0 minted tokens for next round, protocol bondedStake is 1400, the bondedStake of the delegate is 512.4 (36.6% of the totalBonded), result should be 0', async () => {
      // given
      const totalStake = utils.unitAmountInTokenUnits('512.4')
      const totalBondedStake = utils.unitAmountInTokenUnits(1400)
      const getTotalStakeStub = sinon
        .stub(delegateService, 'getDelegateTotalStake')
        .returns(totalStake)
      const mintedTokensStub = sinon.stub(protocolService, 'getMintedTokensForNextRound').returns(0)

      const totalBondedStub = sinon
        .stub(protocolService, 'getTotalBonded')
        .returns(totalBondedStake)
      const rewardExpected = '0'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getTotalStakeStub.called)
      expect(mintedTokensStub.called)
      expect(totalBondedStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getTotalStakeStub.restore()
      mintedTokensStub.restore()
      totalBondedStub.restore()
    })
    it('1000 minted tokens for next round, protocol bondedStake is 10000, the bondedStake of the delegate is 100 (1% of the totalBonded), result should be 10', async () => {
      // given
      const totalStake = utils.unitAmountInTokenUnits('100')
      const totalBondedStake = utils.unitAmountInTokenUnits(10000)
      const getTotalStakeStub = sinon
        .stub(delegateService, 'getDelegateTotalStake')
        .returns(totalStake)
      const mintedTokensStub = sinon
        .stub(protocolService, 'getMintedTokensForNextRound')
        .returns(1000)

      const totalBondedStub = sinon
        .stub(protocolService, 'getTotalBonded')
        .returns(totalBondedStake)
      const rewardExpected = '10'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getTotalStakeStub.called)
      expect(mintedTokensStub.called)
      expect(totalBondedStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getTotalStakeStub.restore()
      mintedTokensStub.restore()
      totalBondedStub.restore()
    })
  })
})
