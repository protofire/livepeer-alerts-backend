const { getDelegatorService } = require('../server/helpers/services/delegatorService')

const { getProtocolService } = require('../server/helpers/services/protocolService')

const { getDelegateService } = require('../server/helpers/services/delegateService')

const utils = require('../server/helpers/utils')
const testUtil = require('../server/helpers/test/util')

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const delegatesGraphql = require('../server/helpers/graphql/queries/delegate')

describe('## DelegateService test', () => {
  const protocolService = getProtocolService()
  const delegateService = getDelegateService(delegatesGraphql)
  const delegatorService = getDelegatorService()
  const mongoose = require('../config/mongoose')
  after('Close mongo connection', () => {
    mongoose.connection.close()
  })

  describe('# getDelegate', () => {
    it('getDelegate should return a delegate', async () => {
      // given
      const delegate = testUtil.createTranscoder()
      // stubs the delegateGraphql service
      const getSummaryStub = sinon
        .stub(delegatesGraphql, 'getLivepeerDelegateAccount')
        .returns(delegate)
      const resultExpected = {
        ...delegate,
        totalStake: utils.tokenAmountInUnits(delegate.totalStake)
      }

      // when
      const result = await delegateService.getDelegate()

      // then
      expect(getSummaryStub.called)
      expect(result).to.deep.equal(resultExpected)
      // restore stubs
      getSummaryStub.restore()
    })
  })
  describe('# getDelegateSummary', () => {
    it('getDelegateSummary should return a delegate summary', async () => {
      // given
      const delegate = testUtil.createTranscoder()
      // stubs the delegateGraphql service
      const getSummaryStub = sinon
        .stub(delegatesGraphql, 'getLivepeerDelegateAccount')
        .returns(delegate)
      const resultExpected = {
        summary: {
          ...delegate,
          totalStake: utils.tokenAmountInUnits(delegate.totalStake)
        }
      }

      // when
      const result = await delegateService.getDelegateSummary()

      // then
      expect(getSummaryStub.called)
      expect(result).to.deep.equal(resultExpected)
      // restore stubs
      getSummaryStub.restore()
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
      const totalStake = utils.unitAmountInTokenUnits(40)
      const totalBondedStake = utils.unitAmountInTokenUnits(400)
      const getTotalStakeStub = sinon
        .stub(delegateService, 'getDelegateTotalStake')
        .returns(totalStake)
      const totalBondedStub = sinon
        .stub(protocolService, 'getTotalBonded')
        .returns(totalBondedStake)
      const mintedTokensStub = sinon
        .stub(protocolService, 'getMintedTokensForNextRound')
        .returns(140)
      const rewardExpected = '14'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getTotalStakeStub.called)
      expect(totalBondedStub.called)
      expect(mintedTokensStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getTotalStakeStub.restore()
      totalBondedStub.restore()
      mintedTokensStub.restore()
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
  describe('# getMissedRewardCalls', () => {
    describe('# Missed reward call calculation without round period', () => {
      it('There are 30 rounds, 10 of them do not have reward object, result should be 10', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: '30'
        }
        for (let roundI = 1; roundI <= 30; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
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
        const missedRewardCalls = await delegateService.getMissedRewardCalls(transcoderId)
        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(10)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
      it('There are 40 rounds, the first 5 of them do not have reward object, neither the last 10 of them, result should be 10', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: 40
        }
        const resultExpected = 10
        for (let roundI = 1; roundI <= 40; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
          if (roundI <= 5) {
            newReward.rewardTokens = null
          }
          if (roundI >= 30) {
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
        const missedRewardCalls = await delegateService.getMissedRewardCalls(transcoderId)

        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(resultExpected)
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
        const resultExpected = 0
        for (let roundI = 1; roundI <= 30; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
          rewards.push(newReward)
        }

        const getDelegateRewardsStub = sinon
          .stub(delegateService, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(protocolService, 'getCurrentRound')
          .returns(currentRound)

        // when
        const missedRewardCalls = await delegateService.getMissedRewardCalls(transcoderId)

        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(resultExpected)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
    })
    describe('# Missed reward call calculation with round period', () => {
      it('There are 30 rounds, the first 10 of them do not have reward object, the periods are 7 rounds => result should be 0', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: '30'
        }
        const roundsPeriod = 7
        const resultExpected = 0
        for (let roundI = 1; roundI <= 30; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
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
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, roundsPeriod)
        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(resultExpected)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
      it('There are 30 rounds, the first 10 of them do not have reward object, the periods are 30 rounds => result should be 10', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: '30'
        }
        const roundsPeriod = 30
        const resultExpected = 10
        for (let roundI = 1; roundI <= 30; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
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
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, roundsPeriod)
        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(resultExpected)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
      it('There are 40 rounds, the first 5 of them do not have reward object, neither the last 10 of them, the periods are 40 rounds, result should be 15', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: 40
        }
        const roundsPeriod = 40
        const resultExpected = 15
        for (let roundI = 1; roundI <= 40; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
          if (roundI <= 5) {
            newReward.rewardTokens = null
          }
          if (roundI >= 30) {
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
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, roundsPeriod)

        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(resultExpected)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
      it('There are 40 rounds, the first 5 of them do not have reward object, neither the last 10 of them, the periods are 6 rounds, result should be 6', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: 40
        }
        const roundsPeriod = 6
        const resultExpected = 6
        for (let roundI = 1; roundI <= 40; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
          if (roundI <= 5) {
            newReward.rewardTokens = null
          }
          if (roundI >= 30) {
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
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, roundsPeriod)

        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(resultExpected)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
      it('There are 30 rounds, none of them have reward, the roundPeriod is 25 result should be 25', async () => {
        // given
        const rewards = []
        const transcoderId = '1'
        const currentRound = {
          id: 30
        }
        const roundsPeriod = 25
        const resultExpected = 25
        for (let roundI = 1; roundI <= 30; roundI++) {
          const newReward = testUtil.createRewardObject(transcoderId, roundI)
          newReward.rewardTokens = null
          rewards.push(newReward)
        }

        const getDelegateRewardsStub = sinon
          .stub(delegateService, 'getDelegateRewards')
          .returns(rewards)
        const getCurrentRoundStub = sinon
          .stub(protocolService, 'getCurrentRound')
          .returns(currentRound)

        // when
        const missedRewardCalls = await delegateService.getMissedRewardCalls(rewards, roundsPeriod)

        // then
        expect(getDelegateRewardsStub.called)
        expect(getCurrentRoundStub.called)
        expect(missedRewardCalls).to.equal(resultExpected)
        // restore stubs
        getDelegateRewardsStub.restore()
        getCurrentRoundStub.restore()
      })
    })
  })
  describe('# getTopDelegates', () => {
    describe('# topDelegates calculation', () => {
      it('There are no delegates, should return an empty array', async () => {
        // given
        const delegates = []
        const getRegisteredDelegatesStub = sinon
          .stub(delegateService, 'getRegisteredDelegates')
          .returns(delegates)
        // when
        const result = await delegateService.getTopDelegates(25)
        // then
        expect(result).to.deep.equal([])
        expect(getRegisteredDelegatesStub.called)
        // restore stubs
        getRegisteredDelegatesStub.restore()
      })
      it('There are 40 delegates, should return the first 25 with the best ROI', async () => {
        //given
        const totalDelegates = 40
        const topNumber = 25
        const amountToStake = 1000
        const roundId = 1
        let resultExpected = []
        const delegates = []
        const rewards = []

        for (let iterator = 0; iterator < totalDelegates; iterator++) {
          // Create delegates
          const newStake = 1000
          const stakeInTokens = utils.unitAmountInTokenUnits(newStake)
          const newDelegate = testUtil.createTranscoder(iterator, stakeInTokens)
          delegates.push(newDelegate)

          // Create rewards
          const rewardAmount = 1000 + iterator
          const newReward = testUtil.createRewardObject(iterator, roundId, rewardAmount)
          rewards.push(newReward)

          // Create results
          const rewardToDelegators = rewards[iterator].rewardTokens
          const delegateTotalStake = delegates[iterator].totalStake
          const delegatorAmountToStake = utils.unitAmountInTokenUnits(amountToStake)
          const rewardInTokens = utils.unitAmountInTokenUnits(rewardToDelegators)
          const newRoiResult = delegateService.simulateNextReturnForGivenDelegatorStakedAmount(
            rewardInTokens,
            delegateTotalStake,
            delegatorAmountToStake
          )
          const totalStakeInUnits = utils.tokenAmountInUnits(delegateTotalStake)
          resultExpected.push({
            id: iterator,
            totalStake: totalStakeInUnits,
            roi: newRoiResult
          })
        }

        // Orders the results desc by ROI value
        resultExpected.sort((a, b) => {
          const aBn = utils.MathBN.toBig(a.roi)
          const bBn = utils.MathBN.toBig(b.roi)
          return bBn.sub(aBn)
        })
        // Filters the first 25 results
        resultExpected = resultExpected.slice(0, topNumber)

        // Stub registeredDelegates
        const getRegisteredDelegatesStub = sinon
          .stub(delegateService, 'getRegisteredDelegates')
          .returns(delegates)

        // Stub rewards
        const getDelegateRewardToDelegatorsStub = sinon
          .stub(delegateService, 'getDelegateRewardToDelegators')
          .callsFake(delegateAddress => {
            const rewardObject = rewards.find(element => element.transcoder.id === delegateAddress)
            const rewardAmount = rewardObject.rewardTokens
            return rewardAmount
          })

        // when
        const result = await delegateService.getTopDelegates(topNumber, amountToStake)

        // then
        expect(result).to.deep.equal(resultExpected)
        expect(getRegisteredDelegatesStub.called)
        expect(getDelegateRewardToDelegatorsStub.called)
        // restore stubs
        getRegisteredDelegatesStub.restore()
        getDelegateRewardToDelegatorsStub.restore()
      })
    })
    describe('# simulateNextReturnForGivenDelegatorStakedAmount calculation', () => {
      it('100 rewardsToDelegators, the delegateTotalStake is 10000, the amount to bond is 1000 (10% participation), should return 10', async () => {
        // given
        const rewardsToDelegators = utils.unitAmountInTokenUnits(100)
        const totalStake = utils.unitAmountInTokenUnits(10000)
        const amountToBond = utils.unitAmountInTokenUnits(1000)
        const resultExpected = '10'

        // when
        const result = await delegateService.simulateNextReturnForGivenDelegatorStakedAmount(
          rewardsToDelegators,
          totalStake,
          amountToBond
        )

        // then
        expect(result).equal(resultExpected)
      })
      it('100 rewardsToDelegators, the delegateTotalStake is 10000, the amount to bond is 0 (0% participation), should return 0', async () => {
        // given
        const rewardsToDelegators = utils.unitAmountInTokenUnits(100)
        const totalStake = utils.unitAmountInTokenUnits(10000)
        const amountToBond = utils.unitAmountInTokenUnits(0)
        const resultExpected = '0'

        // when
        const result = await delegateService.simulateNextReturnForGivenDelegatorStakedAmount(
          rewardsToDelegators,
          totalStake,
          amountToBond
        )

        // then
        expect(result).equal(resultExpected)
      })
      it('100 rewardsToDelegators, the delegateTotalStake is 10000, the amount to bond is 5000 (50% participation), should return 50', async () => {
        // given
        const rewardsToDelegators = utils.unitAmountInTokenUnits(100)
        const totalStake = utils.unitAmountInTokenUnits(10000)
        const amountToBond = utils.unitAmountInTokenUnits(5000)
        const resultExpected = '50'

        // when
        const result = await delegateService.simulateNextReturnForGivenDelegatorStakedAmount(
          rewardsToDelegators,
          totalStake,
          amountToBond
        )

        // then
        expect(result).equal(resultExpected)
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
      const delegator = testUtil.createDelegator()
      delegator.totalStake = utils.unitAmountInTokenUnits(100)
      const delegateTotalStake = utils.unitAmountInTokenUnits(1000)
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
      const delegator = testUtil.createDelegator()
      delegator.totalStake = utils.unitAmountInTokenUnits(100)
      const delegateTotalStake = utils.unitAmountInTokenUnits(1000)
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
      const delegator = testUtil.createDelegator()
      delegator.totalStake = utils.unitAmountInTokenUnits(990)
      const delegateTotalStake = utils.unitAmountInTokenUnits(1000)
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
      const delegator = testUtil.createDelegator()
      delegator.totalStake = utils.unitAmountInTokenUnits(990)
      const delegateTotalStake = utils.unitAmountInTokenUnits(1000)
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
  describe('# getDelegateNextReward', () => {
    it('delegatorRewardForNextRound = 1000, rewardCut = 10%, result should be 10', async () => {
      // given
      const delegate = testUtil.createTranscoder()
      delegate.pendingRewardCut = utils.MathBN.mul(10, 10000)
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
      const delegate = testUtil.createTranscoder()
      delegate.pendingRewardCut = utils.MathBN.mul(10, 10000)
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
      const delegate = testUtil.createTranscoder()
      delegate.pendingRewardCut = utils.MathBN.mul(10, 10000)
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
      const delegate = testUtil.createTranscoder()
      delegate.pendingRewardCut = utils.MathBN.mul(10, 10000)
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
      const delegate = testUtil.createTranscoder()
      delegate.pendingRewardCut = utils.MathBN.mul(10, 10000)
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
      const delegate = testUtil.createTranscoder()
      delegate.pendingRewardCut = utils.MathBN.mul(10, 10000)
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
})
