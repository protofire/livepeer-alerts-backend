const {
  hasDelegateChangedRules,
  generateNotificationList,
  getListOfUpdatedDelegates
} = require('../server/helpers/notifyDelegators')

const { createDelegator } = require('../server/helpers/test/util')
const { getDelegatorService } = require('../server/helpers/services/delegatorService')

const { getProtocolService } = require('../server/helpers/services/protocolService')

const { MathBN } = require('../server/helpers/utils')

const { unitAmountInTokenUnits } = require('../server/helpers/utils')

const { getDelegateService } = require('../server/helpers/services/delegateService')

const { createTranscoder, createRewardObject } = require('../server/helpers/test/util')

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const delegatesGraphql = require('../server/helpers/graphql/queries/delegate')

describe('## Check-delegate-change-rules test', () => {
  const protocolService = getProtocolService()
  const delegateService = getDelegateService(delegatesGraphql)
  const delegatorService = getDelegatorService()
  describe('# getListOfUpdatedDelegates', () => {
    it('Old list has 3 delegates, new list has same 3 but the last one has a different reward cut, should return the last one', done => {
      // given
      const delegate1 = createTranscoder('1', '10', '15', '0', '0')
      const delegate2 = createTranscoder('2', '15', '9', '0', '0')
      const delegate3 = createTranscoder('3', '19', '39', '10', '0')
      const delegate3New = {
        ...delegate3,
        rewardCut: '25'
      }
      const delegateExpected = {
        ...delegate3New
      }
      delete delegateExpected.id
      delete delegateExpected.address
      const resultExpected = [delegateExpected]

      const oldDelegates = [delegate1, delegate2, delegate3]
      const newDelegates = [delegate1, delegate2, delegate3New]

      // when
      const result = getListOfUpdatedDelegates(oldDelegates, newDelegates)

      const {
        _id,
        active,
        delegators,
        ensName,
        feeShare,
        lastRewardRound,
        pendingFeeShare,
        pendingPricePerSegment,
        pendingRewardCut,
        pools,
        pricePerSegment,
        rewardCut,
        status,
        totalStake
      } = result[0]

      const resultWithoutDbData = [
        {
          _id,
          active,
          delegators,
          ensName,
          feeShare,
          lastRewardRound,
          pendingFeeShare,
          pendingPricePerSegment,
          pendingRewardCut,
          pools,
          pricePerSegment,
          rewardCut,
          status,
          totalStake
        }
      ]

      // then
      expect(resultWithoutDbData).to.deep.equal(resultExpected)
      done()
    })
  })
  describe('# hasDelegateChangedRules', () => {
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; new delegate: feeShare: 100 => should return true', async () => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const oldDelegate = createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare
      )
      const newDelegate = {
        ...oldDelegate,
        feeShare: '100'
      }

      // when
      const result = hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; new delegate: rewardCut: 100 => should return true', async () => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const oldDelegate = createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare
      )
      const newDelegate = {
        ...oldDelegate,
        rewardCut: '100'
      }

      // when
      const result = hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; new delegate: pendingRewardCut: 100 => should return true', async () => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const oldDelegate = createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare
      )
      const newDelegate = {
        ...oldDelegate,
        rewardCut: '100'
      }

      // when
      const result = hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; new delegate: pendingFeeShare: 100 => should return true', async () => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const oldDelegate = createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare
      )
      const newDelegate = {
        ...oldDelegate,
        rewardCut: '100'
      }

      // when
      const result = hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; totalStake: 1, new delegate: totalStake: 100 => should return false', async () => {
      // given
      const transcoderId = 1
      const resultExpected = false
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const totalStake = '1'
      const oldDelegate = createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        null,
        null,
        totalStake
      )
      const newDelegate = {
        ...oldDelegate,
        totalStake: '100'
      }

      // when
      const result = hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
    })
    it('Old delegate: has the same values on rewardCut, feeShare, pendingRewardCut and pendingFeeShare as the new delegate, the other properties are different => should return false', async () => {
      // given
      const transcoderId = 1
      const resultExpected = false
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const totalStake = '1'
      let oldDelegate = createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        null,
        null,
        totalStake
      )
      oldDelegate = {
        ...oldDelegate,
        active: true,
        ensName: null,
        status: 'Registered',
        lastRewardRound: '1092'
      }
      const newDelegate = {
        ...oldDelegate,
        active: false,
        ensName: 'charles',
        status: 'NotRegistered',
        lastRewardRound: '1990'
      }

      // when
      const result = hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
    })
  })
  describe('# generateNotificationList', () => {
    it('if receives an empty list returns []', async () => {
      // given
      const resultExpected = []
      const listOfChangedDelegates = []
      const listOfDelegatesAndDelegators = []

      // when
      const result = await generateNotificationList(
        listOfChangedDelegates,
        listOfDelegatesAndDelegators
      )

      // then
      expect(result).to.deep.equal(resultExpected)
    })
    it('if receive a null object returns []', async () => {
      // given
      const resultExpected = []
      const listOfChangedDelegates = null
      const listOfDelegatesAndDelegators = null

      // when
      const result = await generateNotificationList(
        listOfChangedDelegates,
        listOfDelegatesAndDelegators
      )

      // then
      expect(result).to.deep.equal(resultExpected)
    })
    it('receives two changed delegates, with two different delegators, should generate two notifications', async () => {
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
      const resultExpected = [
        {
          delegatorAddress: delegatorAdd1,
          delegate: delegate1,
          subscriber: subscriber1
        },
        {
          delegatorAddress: delegatorAdd2,
          delegate: delegate2,
          subscriber: subscriber2
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

      // when
      const result = await generateNotificationList(
        listOfChangedDelegates,
        listOfDelegatesAndDelegators
      )

      // then
      expect(result).to.deep.equal(resultExpected)
    })
    it('100 minted tokens for next round, protocol bondedStake is 1400, the bondedStake of the delegate is 512.4 (36.6% of the totalBonded), result should be 36.6', async () => {
      // given
      const totalStake = unitAmountInTokenUnits('512.4')
      const totalBondedStake = unitAmountInTokenUnits(1400)
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
      const totalStake = unitAmountInTokenUnits('512.4')
      const totalBondedStake = unitAmountInTokenUnits(1400)
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
      const totalStake = unitAmountInTokenUnits('100')
      const totalBondedStake = unitAmountInTokenUnits(10000)
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
  describe('# getDelegateNextReward', () => {
    it('delegatorRewardForNextRound = 1000, rewardCut = 10%, result should be 10', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegateService, 'getDelegate').returns(delegate)
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
      const getSummaryStub = sinon.stub(delegateService, 'getDelegate').returns(delegate)
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
      const getSummaryStub = sinon.stub(delegateService, 'getDelegate').returns(delegate)
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
      const getSummaryStub = sinon.stub(delegateService, 'getDelegate').returns(delegate)
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
      const getSummaryStub = sinon.stub(delegateService, 'getDelegate').returns(delegate)
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
      const getSummaryStub = sinon.stub(delegateService, 'getDelegate').returns(delegate)
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
          .stub(delegateService, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(protocolService, 'getCurrentRound')
          .returns(currentRound)

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
          .stub(delegateService, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(protocolService, 'getCurrentRound')
          .returns(currentRound)

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
          .stub(delegateService, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(protocolService, 'getCurrentRound')
          .returns(currentRound)

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
        .stub(delegatorService, 'getDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(500)
      const rewardExpected = '50'

      // when
      const result = await delegatorService.getDelegatorNextReward()

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
        .stub(delegatorService, 'getDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(4866341500)
      const rewardExpected = '486634150'

      // when
      const result = await delegatorService.getDelegatorNextReward()

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
        .stub(delegatorService, 'getDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(4866341500)
      const rewardExpected = '4817678085'

      // when
      const result = await delegatorService.getDelegatorNextReward()

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
        .stub(delegatorService, 'getDelegatorAccount')
        .returns(delegator)
      const getDelegateTotalStakeStub = sinon
        .stub(delegatesGraphql, 'getDelegateTotalStake')
        .returns(delegateTotalStake)
      const getDelegateRewardToDelegatorsSub = sinon
        .stub(delegateService, 'getDelegateRewardToDelegators')
        .returns(0)
      const rewardExpected = '0'

      // when
      const result = await delegatorService.getDelegatorNextReward()

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
})
