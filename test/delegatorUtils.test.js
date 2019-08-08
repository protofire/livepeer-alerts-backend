const delegatorUtils = require('../server/helpers/delegatorUtils')
const delegatesUtils = require('../server/helpers/delegatesUtils')
const testUtil = require('../server/helpers/test/util')
const utils = require('../server/helpers/utils')
const { getDelegateService } = require('../server/helpers/services/delegateService')
const { getDelegatorService } = require('../server/helpers/services/delegatorService')
const { getProtocolService } = require('../server/helpers/services/protocolService')
const Delegator = require('../server/delegator/delegator.model')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const { TO_FIXED_VALUES_DECIMALS } = require('../config/constants')
const Big = require('big.js')
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
      const totalDelegatorSharesExpected = '0.0000'
      const averageSharesExpected = '0.0000'
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
      const totalDelegatorSharesExpected = '600.0000'
      const averageSharesExpected = utils.MathBN.divAsBig(totalDelegatorSharesExpected, 7).toFixed(
        TO_FIXED_VALUES_DECIMALS
      )

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
      const totalDelegatorSharesExpected = '2800.0000'
      const averageSharesExpected = utils.MathBN.divAsBig(totalDelegatorSharesExpected, 7).toFixed(
        TO_FIXED_VALUES_DECIMALS
      )

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
      const sharesExpected = [share7, share6, share5, share4, share3, share2, share1]
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.shares = sharesExpected
      const totalDelegatorSharesExpected = '2800.0000'
      const averageSharesExpected = utils.MathBN.divAsBig(totalDelegatorSharesExpected, 7).toFixed(
        TO_FIXED_VALUES_DECIMALS
      )

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
  describe('# getDelegatorSummary30RoundsRewards', () => {
    it('Throws error if no delegatorAddress given', async () => {
      // given
      const delegatorAddress = null
      const errorExpected =
        '[DelegatorUtils] - No delegatorAddress provided on getSummary30RoundsRewards()'
      let throwedErrorMsg = ''
      // when
      try {
        await delegatorUtils.getDelegatorSummary30RoundsRewards(delegatorAddress)
      } catch (err) {
        throwedErrorMsg = err.message
      }
      // then
      expect(throwedErrorMsg).equal(errorExpected)
    })
    it('Returns delegatorSummary with nextReward, lastRoundReward, last7RoundsReward and last30RoundsReward', async () => {
      // given
      const delegatorAddress = 1
      const delegateAddress = 2
      const currentRound = 8
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.delegateAddress = delegateAddress

      const delegatorNextReward = '100'
      const delegateNextReward = '1000'
      const nextRewardExpected = {
        delegatorNextReward,
        delegateNextReward,
        delegator
      }

      const shareReward1 = utils.unitAmountInTokenUnits('1000')
      const shareReward2 = utils.unitAmountInTokenUnits('2000')
      const shareReward3 = utils.unitAmountInTokenUnits('3000')
      const shareReward4 = utils.unitAmountInTokenUnits('4000')
      const shareReward5 = utils.unitAmountInTokenUnits('5000')
      const shareReward6 = utils.unitAmountInTokenUnits('6000')
      const shareReward7 = utils.unitAmountInTokenUnits('7000')
      const delegatorLastRoundReward = utils.tokenAmountInUnits(shareReward7)

      const share1 = testUtil.createShare(delegatorAddress, '1', shareReward1)
      const share2 = testUtil.createShare(delegatorAddress, '2', shareReward2)
      const share3 = testUtil.createShare(delegatorAddress, '3', shareReward3)
      const share4 = testUtil.createShare(delegatorAddress, '4', shareReward4)
      const share5 = testUtil.createShare(delegatorAddress, '5', shareReward5)
      const share6 = testUtil.createShare(delegatorAddress, '6', shareReward6)
      const share7 = testUtil.createShare(delegatorAddress, '7', shareReward7)

      const delegator7RoundsRewards = '28000'
      const delegator30RoundsRewards = '0' // Because there are only 7/30 rewards

      const poolReward1 = utils.unitAmountInTokenUnits('1000')
      const poolReward2 = utils.unitAmountInTokenUnits('2000')
      const poolReward3 = utils.unitAmountInTokenUnits('3000')
      const poolReward4 = utils.unitAmountInTokenUnits('4000')
      const poolReward5 = utils.unitAmountInTokenUnits('5000')
      const poolReward6 = utils.unitAmountInTokenUnits('6000')
      const poolReward7 = utils.unitAmountInTokenUnits('7000')

      const pool1 = testUtil.createShare(delegateAddress, '1', poolReward1)
      const pool2 = testUtil.createShare(delegateAddress, '2', poolReward2)
      const pool3 = testUtil.createShare(delegateAddress, '3', poolReward3)
      const pool4 = testUtil.createShare(delegateAddress, '4', poolReward4)
      const pool5 = testUtil.createShare(delegateAddress, '5', poolReward5)
      const pool6 = testUtil.createShare(delegateAddress, '6', poolReward6)
      const pool7 = testUtil.createShare(delegateAddress, '7', poolReward7)
      const delegateLastRoundReward = utils.tokenAmountInUnits(poolReward7)
      const delegate7RoundsRewards = '28000'
      const delegate30RoundsRewards = '28000' // Because there are only 7 rewards, should be the same as 7 rounds rewards

      const resultExpected = {
        nextReward: {
          delegatorReward: delegatorNextReward,
          delegateReward: delegateNextReward
        },
        lastRoundReward: {
          delegatorReward: delegatorLastRoundReward,
          delegateReward: delegateLastRoundReward
        },
        last7RoundsReward: {
          delegatorReward: delegator7RoundsRewards,
          delegateReward: delegate7RoundsRewards
        },

        last30RoundsReward: {
          delegatorReward: delegator30RoundsRewards,
          delegateReward: delegate30RoundsRewards
        }
      }

      const delegatorShares = [share1, share2, share3, share4, share5, share6, share7]
      const delegatePools = [pool1, pool2, pool3, pool4, pool5, pool6, pool7]
      const delegatorService = getDelegatorService()
      const protocolService = getProtocolService()
      // Mocks nextRewards
      const getDelegatorAndDelegateNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorAndDelegateNextReward')
        .resolves(nextRewardExpected)
      // Mocks last 30 delegator rewards
      const getDelegatorLastXSharesStub = sinon
        .stub(delegatorUtils, 'getDelegatorLastXShares')
        .resolves(delegatorShares)
      // Mocks last 30 delegate reward
      const getDelegateLastXPoolsStub = sinon
        .stub(delegatesUtils, 'getDelegateLastXPools')
        .resolves(delegatePools)
      // Mocks currentRound
      const getCurrentRoundStub = sinon
        .stub(protocolService, 'getCurrentRound')
        .resolves(currentRound)

      // when
      const result = await delegatorUtils.getDelegatorSummary30RoundsRewards(delegatorAddress)
      // then
      expect(result).to.deep.equal(resultExpected)
      expect(getDelegatorAndDelegateNextRewardStub.called)
      expect(getDelegatorLastXSharesStub.called)
      expect(getDelegateLastXPoolsStub.called)
      expect(getCurrentRoundStub.called)
      // restore mocks
      getDelegatorAndDelegateNextRewardStub.restore()
      getDelegatorLastXSharesStub.restore()
      getDelegateLastXPoolsStub.restore()
      getCurrentRoundStub.restore()
    })
    it('Returns delegatorSummary with 0 on delegator last30RoundsRewards if there are no at least more than 30 shares to calculate it', async () => {
      // given
      const delegatorAddress = 1
      const delegateAddress = 2
      const currentRound = 8
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.delegateAddress = delegateAddress

      const delegatorNextReward = '100'
      const delegateMockReward = '0'
      const delegateNextReward = delegateMockReward
      const nextRewardExpected = {
        delegatorNextReward,
        delegateNextReward,
        delegator
      }

      const shareReward1 = utils.unitAmountInTokenUnits('1000')
      const shareReward2 = utils.unitAmountInTokenUnits('2000')
      const shareReward3 = utils.unitAmountInTokenUnits('3000')
      const shareReward4 = utils.unitAmountInTokenUnits('4000')
      const shareReward5 = utils.unitAmountInTokenUnits('5000')
      const shareReward6 = utils.unitAmountInTokenUnits('6000')
      const shareReward7 = utils.unitAmountInTokenUnits('7000')
      const delegatorLastRoundReward = utils.tokenAmountInUnits(shareReward7)

      const share1 = testUtil.createShare(delegatorAddress, '1', shareReward1)
      const share2 = testUtil.createShare(delegatorAddress, '2', shareReward2)
      const share3 = testUtil.createShare(delegatorAddress, '3', shareReward3)
      const share4 = testUtil.createShare(delegatorAddress, '4', shareReward4)
      const share5 = testUtil.createShare(delegatorAddress, '5', shareReward5)
      const share6 = testUtil.createShare(delegatorAddress, '6', shareReward6)
      const share7 = testUtil.createShare(delegatorAddress, '7', shareReward7)

      const delegator7RoundsRewards = '28000'
      const delegator30RoundsRewards = '0' // Because there are only 7/30 rewards

      const resultExpected = {
        nextReward: {
          delegatorReward: delegatorNextReward,
          delegateReward: delegateNextReward
        },
        lastRoundReward: {
          delegatorReward: delegatorLastRoundReward,
          delegateReward: delegateMockReward
        },
        last7RoundsReward: {
          delegatorReward: delegator7RoundsRewards,
          delegateReward: delegateMockReward
        },

        last30RoundsReward: {
          delegatorReward: delegator30RoundsRewards,
          delegateReward: delegateMockReward
        }
      }

      const delegatorShares = [share1, share2, share3, share4, share5, share6, share7]
      const logExpectation1 = `[DelegatorUtils] - not enough rounds shares for displaying 30 rounds shares, amount available: ${delegatorShares.length}`
      const delegatePools = []
      const delegatorService = getDelegatorService()
      const protocolService = getProtocolService()
      // Mocks nextRewards
      const getDelegatorAndDelegateNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorAndDelegateNextReward')
        .resolves(nextRewardExpected)
      // Mocks last 30 delegator rewards
      const getDelegatorLastXSharesStub = sinon
        .stub(delegatorUtils, 'getDelegatorLastXShares')
        .resolves(delegatorShares)
      // Mocks last 30 delegate reward
      const getDelegateLastXPoolsStub = sinon
        .stub(delegatesUtils, 'getDelegateLastXPools')
        .resolves(delegatePools)
      // Mocks currentRound
      const getCurrentRoundStub = sinon
        .stub(protocolService, 'getCurrentRound')
        .resolves(currentRound)
      // Mocks console
      const consoleLogMock = sinon.mock(console)
      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation1)

      // when
      const result = await delegatorUtils.getDelegatorSummary30RoundsRewards(delegatorAddress)
      // then
      expect(result).to.deep.equal(resultExpected)
      consoleLogMock.verify()
      expect(getDelegatorAndDelegateNextRewardStub.called)
      expect(getDelegatorLastXSharesStub.called)
      expect(getDelegateLastXPoolsStub.called)
      expect(getCurrentRoundStub.called)
      // restore mocks
      getDelegatorAndDelegateNextRewardStub.restore()
      getDelegatorLastXSharesStub.restore()
      getDelegateLastXPoolsStub.restore()
      getCurrentRoundStub.restore()
      consoleLogMock.restore()
    })
    it('Returns delegatorSummary with 0 on delegator last7RoundsRewards if there are no at least more than 7 shares to calculate it', async () => {
      // given
      const delegatorAddress = 1
      const delegateAddress = 2
      const currentRound = 8
      const delegator = testUtil.createDelegator(delegatorAddress)
      delegator.delegateAddress = delegateAddress

      const delegatorNextReward = '100'
      const delegateMockReward = '0'
      const delegateNextReward = delegateMockReward
      const nextRewardExpected = {
        delegatorNextReward,
        delegateNextReward,
        delegator
      }

      const shareReward1 = utils.unitAmountInTokenUnits('1000')
      const shareReward2 = utils.unitAmountInTokenUnits('2000')
      const shareReward3 = utils.unitAmountInTokenUnits('3000')
      const shareReward4 = utils.unitAmountInTokenUnits('4000')
      const shareReward5 = utils.unitAmountInTokenUnits('5000')
      const shareReward6 = utils.unitAmountInTokenUnits('6000')
      const shareReward7 = utils.unitAmountInTokenUnits('7000')
      const delegatorLastRoundReward = utils.tokenAmountInUnits(shareReward7)

      const share1 = testUtil.createShare(delegatorAddress, '1', shareReward1)
      const share2 = testUtil.createShare(delegatorAddress, '2', shareReward2)
      const share3 = testUtil.createShare(delegatorAddress, '3', shareReward3)
      const share4 = testUtil.createShare(delegatorAddress, '4', shareReward4)
      const share5 = testUtil.createShare(delegatorAddress, '5', shareReward5)
      const share6 = testUtil.createShare(delegatorAddress, '6', shareReward6)
      const share7 = testUtil.createShare(delegatorAddress, '7', shareReward7)

      const delegator7RoundsRewards = '0' // Because there are only 6/7 rewards
      const delegator30RoundsRewards = '0' // Because there are only 7/30 rewards

      const resultExpected = {
        nextReward: {
          delegatorReward: delegatorNextReward,
          delegateReward: delegateNextReward
        },
        lastRoundReward: {
          delegatorReward: delegatorLastRoundReward,
          delegateReward: delegateMockReward
        },
        last7RoundsReward: {
          delegatorReward: delegator7RoundsRewards,
          delegateReward: delegateMockReward
        },

        last30RoundsReward: {
          delegatorReward: delegator30RoundsRewards,
          delegateReward: delegateMockReward
        }
      }

      const delegatorShares = [share1, share2, share3, share4, share6, share7]
      const logExpectation1 = `[DelegatorUtils] - not enough rounds shares for displaying 30 rounds shares, amount available: ${delegatorShares.length}`
      const logExpectation2 = `[DelegatorUtils] - not enough rounds shares for displaying 7 rounds shares, amount available: ${delegatorShares.length}`
      const delegatePools = []
      const delegatorService = getDelegatorService()
      const protocolService = getProtocolService()
      // Mocks nextRewards
      const getDelegatorAndDelegateNextRewardStub = sinon
        .stub(delegatorService, 'getDelegatorAndDelegateNextReward')
        .resolves(nextRewardExpected)
      // Mocks last 30 delegator rewards
      const getDelegatorLastXSharesStub = sinon
        .stub(delegatorUtils, 'getDelegatorLastXShares')
        .resolves(delegatorShares)
      // Mocks last 30 delegate reward
      const getDelegateLastXPoolsStub = sinon
        .stub(delegatesUtils, 'getDelegateLastXPools')
        .resolves(delegatePools)
      // Mocks currentRound
      const getCurrentRoundStub = sinon
        .stub(protocolService, 'getCurrentRound')
        .resolves(currentRound)
      // Mocks console
      const consoleLogMock = sinon.mock(console)
      const expectationConsole1 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation1)
      const expectationConsole2 = consoleLogMock
        .expects('log')
        .once()
        .withArgs(logExpectation2)

      // when
      const result = await delegatorUtils.getDelegatorSummary30RoundsRewards(delegatorAddress)
      // then
      expect(result).to.deep.equal(resultExpected)
      consoleLogMock.verify()
      expect(getDelegatorAndDelegateNextRewardStub.called)
      expect(getDelegatorLastXSharesStub.called)
      expect(getDelegateLastXPoolsStub.called)
      expect(getCurrentRoundStub.called)
      // restore mocks
      getDelegatorAndDelegateNextRewardStub.restore()
      getDelegatorLastXSharesStub.restore()
      getDelegateLastXPoolsStub.restore()
      getCurrentRoundStub.restore()
      consoleLogMock.restore()
    })
  })
})
