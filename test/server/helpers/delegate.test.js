const { MathBN } = require('../../../server/helpers/utils')

const { tokenAmountInUnits, unitAmountInTokenUnits } = require('../../../server/helpers/utils')

const { getDelegateService } = require('../../../server/helpers/services/delegateService')

const {
  createTranscoder,
  createDelegator,
  createRewardObject
} = require('../../../server/helpers/test/util')
const delegatesGraphql = require('../../../server/helpers/graphql/queries/index')
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
      // restore stubs
      getSummaryStub.restore()
      getMissedRewardCallsStub.restore()
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
      // restore stubs
      getSummaryStub.restore()
      getMintedTokensForNextRoundStub.restore()
      getTotalBondedStub.restore()
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
      // restore stubs
      getSummaryStub.restore()
      getMintedTokensForNextRoundStub.restore()
      getTotalBondedStub.restore()
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
      // restore stubs
      getSummaryStub.restore()
      getMintedTokensForNextRoundStub.restore()
      getTotalBondedStub.restore()
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
      // restore stubs
      getSummaryStub.restore()
      getMintedTokensForNextRoundStub.restore()
      getTotalBondedStub.restore()
    })
  })
  describe('# getDelegateNextReward', () => {
    it('delegatorRewardForNextRound = 1000, rewardCut = 10%, result should be 10', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateProtocolNextRewardStub = sinon
        .stub(delegateService, 'getDelegateProtocolNextReward')
        .returns(1000)
      const rewardExpected = '100'

      // when
      const result = await delegateService.getDelegateNextReward()

      // then
      expect(getSummaryStub.called)
      expect(getDelegateProtocolNextRewardStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      getDelegateProtocolNextRewardStub.restore()
    })
    it('delegatorRewardForNextRound = 198761, rewardCut = 10%, result should be 19876.1', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateProtocolNextRewardStub = sinon
        .stub(delegateService, 'getDelegateProtocolNextReward')
        .returns(198761)
      const rewardExpected = '19876.1'

      // when
      const result = await delegateService.getDelegateNextReward()

      // then
      expect(getSummaryStub.called)
      expect(getDelegateProtocolNextRewardStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      getDelegateProtocolNextRewardStub.restore()
    })
    it('delegatorRewardForNextRound = 0, rewardCut = 10%, result should be 0', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateProtocolNextRewardStub = sinon
        .stub(delegateService, 'getDelegateProtocolNextReward')
        .returns(0)
      const rewardExpected = '0'

      // when
      const result = await delegateService.getDelegateNextReward()

      // then
      expect(getSummaryStub.called)
      expect(getDelegateProtocolNextRewardStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      getDelegateProtocolNextRewardStub.restore()
    })
  })
  describe('# getDelegateRewardToDelegators', () => {
    it('delegateNextProtocolReward = 1000, rewardCut = 10%, result should be 900', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateProtocolNextRewardStub = sinon
        .stub(delegateService, 'getDelegateProtocolNextReward')
        .returns(1000)
      const rewardExpected = '900'

      // when
      const result = await delegateService.getDelegateRewardToDelegators()

      // then
      expect(getSummaryStub.called)
      expect(getDelegateProtocolNextRewardStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      getDelegateProtocolNextRewardStub.restore()
    })
    it('delegateNextProtocolReward = 19843.21064318, rewardCut = 10%, result should be 17859.889578862', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateProtocolNextRewardStub = sinon
        .stub(delegateService, 'getDelegateProtocolNextReward')
        .returns(19843.21064318)
      const rewardExpected = '17858.889578862'

      // when
      const result = await delegateService.getDelegateRewardToDelegators()

      // then
      expect(getSummaryStub.called)
      expect(getDelegateProtocolNextRewardStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      getDelegateProtocolNextRewardStub.restore()
    })
    it('delegateNextProtocolReward = 0, rewardCut = 10%, result should be 0', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateProtocolNextRewardStub = sinon
        .stub(delegateService, 'getDelegateProtocolNextReward')
        .returns(0)
      const rewardExpected = '0'

      // when
      const result = await delegateService.getDelegateRewardToDelegators()

      // then
      expect(getSummaryStub.called)
      expect(getDelegateProtocolNextRewardStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      getDelegateProtocolNextRewardStub.restore()
    })
  })
  describe('# getDelegatorNextReturn', () => {
    // Delegate bondedStake = 1000
    // DelegatorBonded stake = 100 (10% participation)
    // Delegate nextRewardToDelegators = 500
    // Result = 50
    it('the next reward to delegators is 500, the % of participation of the delegator is 10%, result should be 50', async () => {
      // given
      const delegator = createDelegator()
      delegator.totalStake = unitAmountInTokenUnits(100)
      const delegateTotalStake = unitAmountInTokenUnits(1000)
      const getLivepeerDelegatorAccountSub = sinon
        .stub(protocolSdk, 'getLivepeerDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(500)
      const rewardExpected = '50'

      // when
      const result = await delegateService.getDelegatorNextReturn()

      // then
      expect(getLivepeerDelegatorAccountSub.called)
      expect(getDelegateTotalStakeStub.called)
      expect(getDelegateRewardToDelegatorsSub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getLivepeerDelegatorAccountSub.restore()
      getDelegateTotalStakeStub.restore()
      getDelegateRewardToDelegatorsSub.restore()
    })
    it('the next reward to delegators is 4866341500, the % of participation of the delegator is 10%, result should be 486634150', async () => {
      // given
      const delegator = createDelegator()
      delegator.totalStake = unitAmountInTokenUnits(100)
      const delegateTotalStake = unitAmountInTokenUnits(1000)
      const getLivepeerDelegatorAccountSub = sinon
        .stub(protocolSdk, 'getLivepeerDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(4866341500)
      const rewardExpected = '486634150'

      // when
      const result = await delegateService.getDelegatorNextReturn()

      // then
      expect(getLivepeerDelegatorAccountSub.called)
      expect(getDelegateTotalStakeStub.called)
      expect(getDelegateRewardToDelegatorsSub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getLivepeerDelegatorAccountSub.restore()
      getDelegateTotalStakeStub.restore()
      getDelegateRewardToDelegatorsSub.restore()
    })
    it('the next reward to delegators is 4866341500, the % of participation of the delegator is 99%, result should be 4817678085', async () => {
      // given
      const delegator = createDelegator()
      delegator.totalStake = unitAmountInTokenUnits(990)
      const delegateTotalStake = unitAmountInTokenUnits(1000)
      const getLivepeerDelegatorAccountSub = sinon
        .stub(protocolSdk, 'getLivepeerDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(4866341500)
      const rewardExpected = '4817678085'

      // when
      const result = await delegateService.getDelegatorNextReturn()

      // then
      expect(getLivepeerDelegatorAccountSub.called)
      expect(getDelegateTotalStakeStub.called)
      expect(getDelegateRewardToDelegatorsSub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getLivepeerDelegatorAccountSub.restore()
      getDelegateTotalStakeStub.restore()
      getDelegateRewardToDelegatorsSub.restore()
    })
    it('the next reward to delegators is 0, the % of participation of the delegator is 99%, result should be 0', async () => {
      // given
      const delegator = createDelegator()
      delegator.totalStake = unitAmountInTokenUnits(990)
      const delegateTotalStake = unitAmountInTokenUnits(1000)
      const getLivepeerDelegatorAccountSub = sinon
        .stub(protocolSdk, 'getLivepeerDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const delegateService = getDelegateService(delegatesGraphql, protocolSdk)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(0)
      const rewardExpected = '0'

      // when
      const result = await delegateService.getDelegatorNextReturn()

      // then
      expect(getLivepeerDelegatorAccountSub.called)
      expect(getDelegateTotalStakeStub.called)
      expect(getDelegateRewardToDelegatorsSub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getLivepeerDelegatorAccountSub.restore()
      getDelegateTotalStakeStub.restore()
      getDelegateRewardToDelegatorsSub.restore()
    })
  })
  describe('# getMissedRewardCalls', () => {
    describe('# Missed reward call calculation', () => {
      it('There are 30 rounds, 10 of them do not have reward object, result should be 10', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: '30'
        }
        for (let roundI = 1; roundI <= 30; roundI++) {
          const newReward = createRewardObject(transcoderId, roundI)
          if (roundI <= 10) {
            newReward.rewardTokens = null
          }
          rewards.push(newReward)
        }
        const getDelegateRewardsStub = sinon
          .stub(delegatesGraphql, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(delegatesGraphql, 'getCurrentRound')
          .returns(currentRound)
        const delegateService = getDelegateService(delegatesGraphql, protocolSdk)

        // when
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, currentRound)
        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(10)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
      it('There are 40 rounds, the firsts 5 of them do not have reward object, neither the last 10 of them, result should be 5', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: 40
        }
        for (let roundI = 1; roundI <= 40; roundI++) {
          const newReward = createRewardObject(transcoderId, roundI)
          if (roundI <= 5) {
            newReward.rewardTokens = null
          }
          if (roundI >= 35) {
            newReward.rewardTokens = null
          }
          rewards.push(newReward)
        }
        const getDelegateRewardsStub = sinon
          .stub(delegatesGraphql, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(delegatesGraphql, 'getCurrentRound')
          .returns(currentRound)
        const delegateService = getDelegateService(delegatesGraphql, protocolSdk)

        // when
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, currentRound)

        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(5)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
      it('There are 30 rounds, all of them have reward, result should be 0', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: 30
        }
        for (let roundI = 1; roundI <= 30; roundI++) {
          const newReward = createRewardObject(transcoderId, roundI)
          rewards.push(newReward)
        }

        const getDelegateRewardsStub = sinon
          .stub(delegatesGraphql, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(delegatesGraphql, 'getCurrentRound')
          .returns(currentRound)
        const delegateService = getDelegateService(delegatesGraphql, protocolSdk)

        // when
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, currentRound)

        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(0)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
    })
  })
})
