const { tokenAmountInUnits } = require('../../../server/helpers/utils')

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
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
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
