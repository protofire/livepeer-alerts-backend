const { getProtocolService } = require('../server/helpers/services/protocolService')

const { MathBN } = require('../server/helpers/utils')

const { tokenAmountInUnits, unitAmountInTokenUnits } = require('../server/helpers/utils')

const { getDelegateService } = require('../server/helpers/services/delegateService')

const {
  createTranscoder,
  createRewardObject,
  createTotalStake
} = require('../server/helpers/test/util')

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const delegatesGraphql = require('../server/helpers/graphql/queries/delegate')

describe('## DelegateService test', () => {
  const protocolService = getProtocolService()
  const delegateService = getDelegateService(delegatesGraphql)
  describe('# getDelegate', () => {
    it('getDelegate should return a delegate with missedRewardCalls', async () => {
      // given
      const delegate = createTranscoder()
      const missedRewardCalls = 0
      // stubs the delegateGraphql service
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
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
      expect(getSummaryStub.called)
      expect(totalBondedStub.called)
      expect(mintedTokensStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      totalBondedStub.restore()
      mintedTokensStub.restore()
    })
    it('100 minted tokens for next round, protocol bondedStake is 1400, the bondedStake of the delegate is 512.4 (36.6% of the totalBonded), result should be 36.6', async () => {
      // given
      const delegate = createTranscoder()
      delegate.totalStake = unitAmountInTokenUnits('512.4')
      const totalBondedStake = unitAmountInTokenUnits(1400)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
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
      expect(getSummaryStub.called)
      expect(mintedTokensStub.called)
      expect(totalBondedStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      mintedTokensStub.restore()
      totalBondedStub.restore()
    })
    it('0 minted tokens for next round, protocol bondedStake is 1400, the bondedStake of the delegate is 512.4 (36.6% of the totalBonded), result should be 0', async () => {
      // given
      const delegate = createTranscoder()
      delegate.totalStake = unitAmountInTokenUnits('512.4')
      const totalBondedStake = unitAmountInTokenUnits(1400)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
      const mintedTokensStub = sinon.stub(protocolService, 'getMintedTokensForNextRound').returns(0)

      const totalBondedStub = sinon
        .stub(protocolService, 'getTotalBonded')
        .returns(totalBondedStake)
      const rewardExpected = '0'

      // when
      const result = await delegateService.getDelegateProtocolNextReward()

      // then
      expect(getSummaryStub.called)
      expect(mintedTokensStub.called)
      expect(totalBondedStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      mintedTokensStub.restore()
      totalBondedStub.restore()
    })
    it('1000 minted tokens for next round, protocol bondedStake is 10000, the bondedStake of the delegate is 100 (1% of the totalBonded), result should be 10', async () => {
      // given
      const delegate = createTranscoder()
      delegate.totalStake = unitAmountInTokenUnits('100')
      const totalBondedStake = unitAmountInTokenUnits(10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
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
      expect(getSummaryStub.called)
      expect(mintedTokensStub.called)
      expect(totalBondedStub.called)
      expect(result).equal(rewardExpected)
      // restore stubs
      getSummaryStub.restore()
      mintedTokensStub.restore()
      totalBondedStub.restore()
    })
  })
  describe('# getDelegateNextReward', () => {
    it('delegatorRewardForNextRound = 1000, rewardCut = 10%, result should be 10', async () => {
      // given
      const delegate = createTranscoder()
      delegate.pendingRewardCut = MathBN.mul(10, 10000)
      const getSummaryStub = sinon.stub(delegatesGraphql, 'getDelegateSummary').returns(delegate)
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
      it('There are 40 delegates, should return the first 35 with the best ROI', async () => {
        const amountOfDelegates = 40
        const roundId = 1
        // given
        const delegates = []
        const transcoderRewards = []
        const totalStakeMin = 1000
        const totalStakeMax = 10000
        const minReward = 100
        let results = []
        const amountToStake = 1000
        const topNumber = 25

        for (let iterator = 0; iterator <= amountOfDelegates; iterator++) {
          // Creates mock delegates
          const newTotalStake = createTotalStake(totalStakeMin, totalStakeMax)
          const newDelegate = createTranscoder(iterator, newTotalStake)
          delegates.push(newDelegate)

          // Creates mock rewards
          let newRewardAmount = createTotalStake(minReward, totalStakeMin) // creates a random big number between min and max
          newRewardAmount = tokenAmountInUnits(newRewardAmount)
          const newReward = createRewardObject(iterator, roundId, newRewardAmount)
          transcoderRewards.push(newReward)

          // Creates results
          const amountTestConvert = unitAmountInTokenUnits(amountToStake)
          const amountRewardConvert = unitAmountInTokenUnits(newRewardAmount)
          const newResult = delegateService.simulateNextReturnForGivenDelegatorStakedAmount(
            amountRewardConvert,
            newTotalStake,
            amountTestConvert
          )
          results.push({
            id: iterator,
            newTotalStake,
            roi: newResult
          })
        }

        // Orders resultExpected desc
        results.sort((a, b) => {
          const aBn = MathBN.toBig(a.roi)
          const bBn = MathBN.toBig(b.roi)
          return bBn.sub(aBn)
        })
        // Filters the first 25 roi results
        results = results.slice(0, topNumber)

        // Returns mock delegates
        const getRegisteredDelegatesStub = sinon
          .stub(delegateService, 'getRegisteredDelegates')
          .returns(delegates)

        // Returns mock rewards
        const getDelegateRewardToDelegatorsStub = sinon
          .stub(delegateService, 'getDelegateRewardToDelegators')
          .callsFake(delegateAddress => {
            const rewardObject = transcoderRewards.find(element => {
              return element.transcoder.id === delegateAddress
            })
            return rewardObject.rewardTokens
          })

        // when
        const result = await delegateService.getTopDelegates(topNumber, amountToStake)

        // then
        expect(result).to.deep.equal(results)
        expect(getRegisteredDelegatesStub.called)
        // restore stubs
        getRegisteredDelegatesStub.restore()
      })
      it('There are 40 delegates, should return the first 35 with the best ROI', async () => {
        // given
        const delegates = []
        const minStake = 1000
        const minReward = 50
        const amountToSimulateStake = 1000 // TO STAKE
        const topNumber = 35
        const amountOfDelegates = 40
        let transcodersRewards = []
        let roiResults = []

        for (let iterator = 1; iterator <= amountOfDelegates; iterator++) {
          // Create transcoders
          const totalStake = unitAmountInTokenUnits(MathBN.mul(iterator, minStake)) // TOTAL STAKE
          const newDelegate = createTranscoder(iterator, totalStake)
          delegates.push(newDelegate)

          // Create rewards of transcoders
          const rewardInUnits = MathBN.mul(iterator, minReward) // REWARD
          //console.log("amount unit", rewardInUnits)
          const rewardAmount = unitAmountInTokenUnits(rewardInUnits)
          transcodersRewards.push({
            id: iterator,
            reward: rewardAmount
          })

          const amountToSimulateStakeConverted = unitAmountInTokenUnits(amountToSimulateStake)
          // Create results expected
          const newResult = delegateService.simulateNextReturnForGivenDelegatorStakedAmount(
            rewardAmount,
            totalStake,
            amountToSimulateStakeConverted
          )
          if (iterator === 1) {
            console.log('result ts', totalStake, newResult, amountToSimulateStake)
          }
          roiResults.push({
            id: iterator,
            totalStake,
            roi: newResult
          })
        }

        // Orders resultExpected desc
        roiResults.sort((a, b) => {
          const aBn = MathBN.toBig(a.roi)
          const bBn = MathBN.toBig(b.roi)
          return bBn.sub(aBn)
        })
        // Filters the first 25 roi results
        roiResults = roiResults.slice(0, topNumber)

        const getRegisteredDelegatesStub = sinon
          .stub(delegateService, 'getRegisteredDelegates')
          .returns(delegates)

        const getDelegateRewardToDelegatorsStub = sinon
          .stub(delegateService, 'getDelegateRewardToDelegators')
          .callsFake(delegateAddress => {
            const rewardObject = transcodersRewards.find(element => element.id === delegateAddress)
            return rewardObject.reward
          })

        // when
        const result = await delegateService.getTopDelegates(topNumber, amountToSimulateStake)

        // then
        expect(result).to.deep.equal(roiResults)
        expect(getRegisteredDelegatesStub.called)
        expect(getDelegateRewardToDelegatorsStub.called)
        // restore stubs
        getRegisteredDelegatesStub.restore()
        getDelegateRewardToDelegatorsStub.restore()
      })
      it('There are 30 delegates, should return the first 25 with the best ROI', async () => {
        // given
        const delegates = []
        const minStake = 1000
        const minReward = 50
        const amountToSimulateStake = unitAmountInTokenUnits(1000)
        const topNumber = 25
        const amountOfDelegates = 30
        let transcodersRewards = []
        let roiResults = []

        for (let iterator = 1; iterator <= amountOfDelegates; iterator++) {
          // Create transcoders
          const totalStakeCalc = MathBN.mul(iterator, minStake)
          const totalStake = unitAmountInTokenUnits(totalStakeCalc)
          const newDelegate = createTranscoder(iterator, totalStake)
          delegates.push(newDelegate)

          // Create rewards of transcoders
          const rewardInUnits = MathBN.mul(iterator, minReward)
          const rewardAmount = unitAmountInTokenUnits(rewardInUnits)
          transcodersRewards.push({
            id: iterator,
            reward: rewardAmount
          })

          // Create results expected
          const newResult = delegateService.simulateNextReturnForGivenDelegatorStakedAmount(
            rewardAmount,
            totalStake,
            amountToSimulateStake
          )
          roiResults.push({
            id: iterator,
            totalStake: tokenAmountInUnits(totalStake),
            roi: newResult
          })
        }

        // Orders resultExpected desc
        roiResults.sort((a, b) => {
          const aBn = MathBN.toBig(a.roi)
          const bBn = MathBN.toBig(b.roi)
          return bBn.sub(aBn)
        })
        // Filters the first 25 roi results
        roiResults = roiResults.slice(0, topNumber)

        const getRegisteredDelegatesStub = sinon
          .stub(delegateService, 'getRegisteredDelegates')
          .returns(delegates)

        const getDelegateRewardToDelegatorsStub = sinon
          .stub(delegateService, 'getDelegateRewardToDelegators')
          .callsFake(delegateAddress => {
            const rewardObject = transcodersRewards.find(element => element.id === delegateAddress)
            return rewardObject.reward
          })

        // when
        const result = await delegateService.getTopDelegates(topNumber, amountToSimulateStake)

        // then
        expect(result).to.deep.equal(roiResults)
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
        const rewardsToDelegators = unitAmountInTokenUnits(100)
        const totalStake = unitAmountInTokenUnits(10000)
        const amountToBond = unitAmountInTokenUnits(1000)
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
        const rewardsToDelegators = unitAmountInTokenUnits(100)
        const totalStake = unitAmountInTokenUnits(10000)
        const amountToBond = unitAmountInTokenUnits(0)
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
        const rewardsToDelegators = unitAmountInTokenUnits(100)
        const totalStake = unitAmountInTokenUnits(10000)
        const amountToBond = unitAmountInTokenUnits(5000)
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
})
