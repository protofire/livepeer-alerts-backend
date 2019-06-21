const { MathBN } = require('../../../server/helpers/utils')

const { tokenAmountInUnits, unitAmountInTokenUnits } = require('../../../server/helpers/utils')

const { getDelegateService } = require('../../../server/helpers/delegateService')

const { createTranscoder } = require('../../../server/helpers/test/util')
const delegatesGraphql = require('../../../server/helpers/graphql/queries/delegate')
const protocolSdk = require('../../../server/helpers/livepeerAPI')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')

describe('## DelegateService test', () => {
  describe('# getDelegate', () => {
    it('getDelegate should return a delegate with missedRewardCalls', async () => {
      // given
      const delegate = createTranscoder()
      const missedRewardCalls = 0
      // stubs the delegateGraphql service
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      // stubs getMissedRewardCalls method
      const getMissedRewardCallsStub = sinon
        .stub(delegateService, 'getMissedRewardCalls')
        .returns(missedRewardCalls)
      const resultExpected = {
        ...delegate,
        totalStake: tokenAmountInUnits(delegate.totalStake),
        last30MissedRewardCalls: missedRewardCalls
      }

      // when
      const result = await delegateService.getDelegate()

      // then
      expect(getSummaryStub.called)
      expect(getMissedRewardCallsStub.called)
      expect(result.summary).to.deep.equal(resultExpected)
    })
  })
  describe('# getDelegateProtocolNextReward', () => {
    // bondedStake = 400
    // totalSupply = 1000
    // delegateBondedStake = 40 (10%)
    // inflation = 0.14%
    // nextTokenRewards = 140
    // result (delegateReward) = 14
    it('140 minted tokens for next round, protocol bondedStake is 400, the bondedStake of the delegate is 40 (10% of the totalBonded), result should be 14 (10% of 140)', async () => {
      // given
      const delegate = createTranscoder()
      delegate.totalStake = unitAmountInTokenUnits(40)
      const totalBondedStake = unitAmountInTokenUnits(400)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const getMintedTokensForNextRoundStub = sinon
        .stub(protocolSdk, 'getMintedTokensForNextRound')
        .returns(140)
      const getTotalBondedStub = sinon.stub(protocolSdk, 'getTotalBonded').returns(totalBondedStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const rewardExpected = '14'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getSummaryStub.called)
      expect(getMintedTokensForNextRoundStub.called)
      expect(getTotalBondedStub.called)
      expect(result).equal(rewardExpected)
    })
    it('100 minted tokens for next round, protocol bondedStake is 1400, the bondedStake of the delegate is 512.4 (36.6% of the totalBonded), result should be 36.6', async () => {
      // given
      const delegate = createTranscoder()
      delegate.totalStake = unitAmountInTokenUnits('512.4')
      const totalBondedStake = unitAmountInTokenUnits(1400)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const getMintedTokensForNextRoundStub = sinon
        .stub(protocolSdk, 'getMintedTokensForNextRound')
        .returns(100)
      const getTotalBondedStub = sinon.stub(protocolSdk, 'getTotalBonded').returns(totalBondedStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const rewardExpected = '36.6'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getSummaryStub.called)
      expect(getMintedTokensForNextRoundStub.called)
      expect(getTotalBondedStub.called)
      expect(result).equal(rewardExpected)
    })
    it('0 minted tokens for next round, protocol bondedStake is 1400, the bondedStake of the delegate is 512.4 (36.6% of the totalBonded), result should be 0', async () => {
      // given
      const delegate = createTranscoder()
      delegate.totalStake = unitAmountInTokenUnits('512.4')
      const totalBondedStake = unitAmountInTokenUnits(1400)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const getMintedTokensForNextRoundStub = sinon
        .stub(protocolSdk, 'getMintedTokensForNextRound')
        .returns(0)
      const getTotalBondedStub = sinon.stub(protocolSdk, 'getTotalBonded').returns(totalBondedStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const rewardExpected = '0'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getSummaryStub.called)
      expect(getMintedTokensForNextRoundStub.called)
      expect(getTotalBondedStub.called)
      expect(result).equal(rewardExpected)
    })
    it('1000 minted tokens for next round, protocol bondedStake is 10000, the bondedStake of the delegate is 100 (1% of the totalBonded), result should be 10', async () => {
      // given
      const delegate = createTranscoder()
      delegate.totalStake = unitAmountInTokenUnits('100')
      const totalBondedStake = unitAmountInTokenUnits(10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const getMintedTokensForNextRoundStub = sinon
        .stub(protocolSdk, 'getMintedTokensForNextRound')
        .returns(1000)
      const getTotalBondedStub = sinon.stub(protocolSdk, 'getTotalBonded').returns(totalBondedStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const rewardExpected = '10'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getSummaryStub.called)
      expect(getMintedTokensForNextRoundStub.called)
      expect(getTotalBondedStub.called)
      expect(result).equal(rewardExpected)
    })
  })
  describe('# getDelegateNextReward', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getDelegateRewardToDelegators', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getDelegateRewardToDelegators', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getDelegatorNextReturn', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getMissedRewardCalls', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
})
