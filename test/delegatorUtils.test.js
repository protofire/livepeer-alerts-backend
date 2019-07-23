const delegatorUtils = require('../server/helpers/delegatorUtils')
const delegatesUtils = require('../server/helpers/delegatesUtils')
const testUtil = require('../server/helpers/test/util')
const utils = require('../server/helpers/utils')
const { getDelegateService } = require('../server/helpers/services/delegateService')
const Delegator = require('../server/delegator/delegator.model')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')

describe('## DelegatorsUtils test', () => {
  describe('# getWeeklySharesPerRound', () => {
    it('if no delegatorAddress given, throws an error', async () => {
      // given
      const delegatorAddress = null
      const currentRound = 1
      const errorExpected =
        '[DelegatorUtils] - No delegatorAddress provided on getWeeklySharesPerRound()'
      let errorReceived = ''
      // when
      try {
        await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)
      } catch (err) {
        errorReceived = err.message
      }

      // then
      expect(errorReceived).equal(errorExpected)
    })
    it('if no currentRound given, throws an error', async () => {
      // given
      const delegatorAddress = 1
      const currentRound = null
      const errorExpected =
        '[DelegatorUtils] - No currentRound provided on getWeeklySharesPerRound()'
      let errorReceived = ''
      // when
      try {
        await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)
      } catch (err) {
        errorReceived = err.message
      }

      // then
      expect(errorReceived).equal(errorExpected)
    })
    it('Delegator has 0 shares on the last week, returns 0', async () => {
      // given
      const delegatorAddress = 1
      const currentRound = 7
      const totalDelegatorSharesExpected = '0'
      const averageSharesExpected = '0'
      const sharesExpected = []
      const shares = []
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.shares = shares

      const mockQuery = {
        exec: sinon.stub().returns(delegator)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegatorMock = sinon.mock(Delegator)

      const expectationDelegator = delegatorMock
        .expects('findById')
        .once()
        .withArgs(delegatorAddress)
        .returns(populateQuery)

      // when
      const {
        averageShares,
        totalDelegatorShares,
        weekRoundShares
      } = await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)

      // then
      expect(averageShares).equal(averageSharesExpected)
      expect(totalDelegatorShares).equal(totalDelegatorSharesExpected)
      expect(weekRoundShares).to.deep.equal(sharesExpected)
      delegatorMock.verify()
      // restore mocks
      delegatorMock.restore()
    })
    it('Delegator has 3 shares on the last week, returns the sum of them, the average and the shares', async () => {
      // given
      const delegatorAddress = 1
      const currentRound = 7
      const share1 = testUtil.createShare(delegatorAddress, '7', '100')
      const share2 = testUtil.createShare(delegatorAddress, '5', '200')
      const share3 = testUtil.createShare(delegatorAddress, '1', '300')
      const shares = [share3, share2, share1]
      const sharesExpected = shares
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.shares = shares
      const totalDelegatorSharesExpected = '600'
      const averageSharesExpected = utils.MathBN.div(totalDelegatorSharesExpected, 7)

      const mockQuery = {
        exec: sinon.stub().returns(delegator)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegatorMock = sinon.mock(Delegator)

      const expectationDelegator = delegatorMock
        .expects('findById')
        .once()
        .withArgs(delegatorAddress)
        .returns(populateQuery)

      // when
      const {
        averageShares,
        totalDelegatorShares,
        weekRoundShares
      } = await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)

      // then
      expect(averageShares).equal(averageSharesExpected)
      expect(totalDelegatorShares).equal(totalDelegatorSharesExpected)
      expect(weekRoundShares).to.deep.equal(sharesExpected)
      delegatorMock.verify()
      // restore mocks
      delegatorMock.restore()
    })
    it('Delegator has 7 shares on the last week, returns the sum of them, the average and the shares', async () => {
      // given
      const delegatorAddress = 1
      const currentRound = 7
      const share1 = testUtil.createShare(delegatorAddress, '1', '100')
      const share2 = testUtil.createShare(delegatorAddress, '2', '200')
      const share3 = testUtil.createShare(delegatorAddress, '3', '300')
      const share4 = testUtil.createShare(delegatorAddress, '4', '400')
      const share5 = testUtil.createShare(delegatorAddress, '5', '500')
      const share6 = testUtil.createShare(delegatorAddress, '6', '600')
      const share7 = testUtil.createShare(delegatorAddress, '7', '700')
      const shares = [share7, share6, share5, share4, share3, share2, share1]
      const sharesExpected = shares
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.shares = shares
      const totalDelegatorSharesExpected = '2800'
      const averageSharesExpected = utils.MathBN.div(totalDelegatorSharesExpected, 7)

      const mockQuery = {
        exec: sinon.stub().returns(delegator)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegatorMock = sinon.mock(Delegator)

      const expectationDelegator = delegatorMock
        .expects('findById')
        .once()
        .withArgs(delegatorAddress)
        .returns(populateQuery)

      // when
      const {
        averageShares,
        totalDelegatorShares,
        weekRoundShares
      } = await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)

      // then
      expect(averageShares).equal(averageSharesExpected)
      expect(totalDelegatorShares).equal(totalDelegatorSharesExpected)
      expect(weekRoundShares).to.deep.equal(sharesExpected)
      delegatorMock.verify()
      // restore mocks
      delegatorMock.restore()
    })
    it('Delegator has 8 shares in total, returns the sum of the first 7, the average and the shares (the ones that are part of the week)', async () => {
      // given
      const delegatorAddress = 1
      const currentRound = 7
      const share1 = testUtil.createShare(delegatorAddress, '1', '100')
      const share2 = testUtil.createShare(delegatorAddress, '2', '200')
      const share3 = testUtil.createShare(delegatorAddress, '3', '300')
      const share4 = testUtil.createShare(delegatorAddress, '4', '400')
      const share5 = testUtil.createShare(delegatorAddress, '5', '500')
      const share6 = testUtil.createShare(delegatorAddress, '6', '600')
      const share7 = testUtil.createShare(delegatorAddress, '7', '700')
      const share8 = testUtil.createShare(delegatorAddress, '8', '800')
      const shares = [share8, share7, share6, share5, share4, share3, share2, share1]
      const sharesExpected = shares.slice(0, currentRound)
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.shares = shares
      const totalDelegatorSharesExpected = '3500'
      const averageSharesExpected = utils.MathBN.div(totalDelegatorSharesExpected, 7)

      const mockQuery = {
        exec: sinon.stub().returns(delegator)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegatorMock = sinon.mock(Delegator)

      const expectationDelegator = delegatorMock
        .expects('findById')
        .once()
        .withArgs(delegatorAddress)
        .returns(populateQuery)

      // when
      const {
        averageShares,
        totalDelegatorShares,
        weekRoundShares
      } = await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)

      // then
      expect(averageShares).equal(averageSharesExpected)
      expect(totalDelegatorShares).equal(totalDelegatorSharesExpected)
      expect(weekRoundShares).to.deep.equal(sharesExpected)
      delegatorMock.verify()
      // restore mocks
      delegatorMock.restore()
    })
  })
  describe('# getDelegatorSharesSummary', () => {
    it('if no delegator given, throws an error', async () => {
      // given
      const delegator = null
      const currentRound = 1
      const errorExpected = '[DelegatorUtils] no delegator provided on getDelegatorSharesSummary()'
      let errorReceived = ''
      // when
      try {
        await delegatorUtils.getDelegatorSharesSummary(delegator, currentRound)
      } catch (err) {
        errorReceived = err.message
      }

      // then
      expect(errorReceived).equal(errorExpected)
    })
    it('if no currentRound given, throws an error', async () => {
      // given
      const delegatorId = 1
      const delegator = testUtil.createDelegator(delegatorId)
      const currentRound = null
      const errorExpected =
        '[DelegatorUtils] no currentRound provided on getDelegatorSharesSummary()'
      let errorReceived = ''
      // when
      try {
        await delegatorUtils.getDelegatorSharesSummary(delegator, currentRound)
      } catch (err) {
        errorReceived = err.message
      }

      // then
      expect(errorReceived).equal(errorExpected)
    })
    it('Should obtain the all values and return them', async () => {
      // given
      const delegatorId = 1
      const delegator = testUtil.createDelegator(delegatorId)
      const currentRound = 7
      const totalDelegatePools = []
      const startDate = ''
      const finishDate = ''
      const totalRounds = 7
      const totalDelegatorShares = []
      const sharesPerRound = []
      const averageShares = ''
      const missedRewardCalls = 0

      const resultExpected = {
        totalDelegatePools,
        totalDelegatorShares,
        startDate,
        finishDate,
        totalRounds,
        sharesPerRound,
        averageShares,
        missedRewardCalls
      }

      // Mocks util functions

      const getDelegateLastWeekRoundsPoolsStub = sinon
        .stub(delegatesUtils, 'getDelegateLastWeekRoundsPools')
        .resolves(totalDelegatePools)

      const getStartAndFinishDateOfWeeklySummaryStub = sinon
        .stub(utils, 'getStartAndFinishDateOfWeeklySummary')
        .resolves({ startDate, finishDate })

      const getWeeklySharesPerRoundStub = sinon
        .stub(delegatorUtils, 'getWeeklySharesPerRound')
        .resolves({ sharesPerRound, averageShares, totalDelegatorShares })

      const delegateService = getDelegateService()
      const getMissedRewardCallsStub = sinon
        .stub(delegateService, 'getMissedRewardCalls')
        .resolves(missedRewardCalls)

      // when
      const result = await delegatorUtils.getDelegatorSharesSummary(delegator, currentRound)

      // then
      expect(getDelegateLastWeekRoundsPoolsStub.called)
      expect(getStartAndFinishDateOfWeeklySummaryStub.called)
      expect(getWeeklySharesPerRoundStub.called)
      expect(getMissedRewardCallsStub.called)
      expect(resultExpected).to.deep.equal(resultExpected)
      // restore mocks
      getDelegateLastWeekRoundsPoolsStub.restore()
      getStartAndFinishDateOfWeeklySummaryStub.restore()
      getWeeklySharesPerRoundStub.restore()
      getMissedRewardCallsStub.restore()
    })
  })
})
