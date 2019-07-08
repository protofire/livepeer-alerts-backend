const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const { getDelegateService } = require('../server/helpers/services/delegateService')
const Round = require('../server/round/round.model')
const Pool = require('../server/pool/pool.model')
const Delegate = require('../server/delegate/delegate.model')
const mongoose = require('../config/mongoose')

describe('## UpdateRoundPools test', () => {
  const delegateService = getDelegateService()
  const delegatePoolService = require('../server/helpers/update-round-pools')
  describe('# updateDelegatesPools', () => {
    const currentRound = new Round({
      _id: '1403',
      roundId: '1403',
      initialized: true,
      lastInitializedRound: '1403',
      length: '5760',
      startBlock: '8081280',
      pools: [],
      shares: []
    })
    it('Should get poolsPerRound with no round and throw error', async () => {
      // given
      const resultExpected = true

      const getPoolsPerRoundStub = sinon.stub(delegateService, 'getPoolsPerRound')

      // when
      let throwedErr = false
      try {
        await delegatePoolService.updateDelegatesPools(currentRound)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(getPoolsPerRoundStub.called)
      // restore stubs
      getPoolsPerRoundStub.restore()
    })
    it('Should get poolsPerRound with no rewards and throw error', async () => {
      // given
      const resultExpected = true
      const poolsPerRound = {
        id: '2',
        initialized: true,
        length: '2',
        lastInitializedRound: '1',
        startBlock: '8081280',
        rewards: null
      }

      const getPoolsPerRoundStub = sinon
        .stub(delegateService, 'getPoolsPerRound')
        .returns(poolsPerRound)

      // when
      let throwedErr = false
      try {
        await delegatePoolService.updateDelegatesPools(currentRound)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(getPoolsPerRoundStub.called)
      // restore stubs
      getPoolsPerRoundStub.restore()
    })
    it('Should get poolsPerRound with rounds and do not throw error and call updateDelegatePoolsOfRound with currentRound and poolsPerRound', async () => {
      // given
      const resultExpected = false
      const poolsPerRound = {
        id: '2',
        initialized: true,
        length: '2',
        lastInitializedRound: '1',
        startBlock: '8081280',
        rewards: [
          {
            id: '0xd18a02647d99dc9f79afbe0f58f8353178e6141f-1403',
            transcoder: {},
            rewardTokens: '326285844888667229310'
          }
        ]
      }

      const getPoolsPerRoundStub = sinon
        .stub(delegateService, 'getPoolsPerRound')
        .returns(poolsPerRound)

      const updateDelegatesPoolsStub = sinon.stub(delegatePoolService, 'updateDelegatePoolsOfRound')

      // when
      let throwedErr = false
      try {
        await delegatePoolService.updateDelegatesPools(currentRound)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(getPoolsPerRoundStub.called)
      expect(updateDelegatesPoolsStub.called)
      sinon.assert.calledWith(updateDelegatesPoolsStub, currentRound, poolsPerRound.rewards)
      // restore stubs
      getPoolsPerRoundStub.restore()
      updateDelegatesPoolsStub.restore()
    })
  })
  describe('# updateDelegatePoolsOfRound', () => {
    it('should be called without round and throw an error', async () => {
      // given
      const resultExpected = true
      let throwedErr = false
      // when
      try {
        await delegatePoolService.updateDelegatePoolsOfRound(null, [])
      } catch (err) {
        throwedErr = true
      }
      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('should be called without roundPools and throw an error', async () => {
      // given
      const resultExpected = true
      let throwedErr = false
      // when
      try {
        await delegatePoolService.updateDelegatePoolsOfRound([], null)
      } catch (err) {
        throwedErr = true
      }
      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('should be called without roundPools and round and throw an error', async () => {
      // given
      const resultExpected = true
      let throwedErr = false
      // when
      try {
        await delegatePoolService.updateDelegatePoolsOfRound(null, null)
      } catch (err) {
        throwedErr = true
      }
      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('should try to save pool without a round to be created before an throws error', async () => {
      // given
      const resultExpected = true
      let throwedErr = false
      const totalStake = '100'
      const delegateId = '0'
      const round = new Round({
        _id: '1403',
        roundId: '1403',
        initialized: true,
        lastInitializedRound: '1403',
        length: '5760',
        startBlock: '8081280',
        pools: [],
        shares: []
      })
      const roundPools = [
        {
          id: '0xd18a02647d99dc9f79afbe0f58f8353178e6141f-1403',
          transcoder: {
            id: delegateId
          },
          rewardTokens: '1'
        },
        {
          id: '0xd18a02647d99dc9f79afbe0f58f8353178e6141f-1403',
          transcoder: {
            id: delegateId
          },
          rewardTokens: '2'
        }
      ]
      const poolId1 = `${round._id}-${roundPools[0].id}`
      const poolId2 = `${round._id}-${roundPools[0].id}`
      // Saves a test delegate
      const testDelegate = await new Delegate({
        _id: delegateId
      }).save()
      let fetchedDelegate = await Delegate.findById(delegateId)
      const getDelegateTotalStakeStub = sinon
        .stub(delegateService, 'getDelegateTotalStake')
        .returns(totalStake)
      try {
        await delegatePoolService.updateDelegatePoolsOfRound(round, roundPools)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(getDelegateTotalStakeStub.called)
      // restore stubs
      getDelegateTotalStakeStub.restore()
      // Delete created objects on db
      await fetchedDelegate.remove()
      const createdPool1 = await Pool.findByIdAndRemove(poolId1)
      const createdPool2 = await Pool.findByIdAndRemove(poolId2)
    })
    it('should try to fetch a delegate from roundPool that does not exists on the db and logs the error', async () => {
      // given
      const resultExpected = false
      let throwedErr = false
      const totalStake = '100'
      const delegateId = '0'
      const round = new Round({
        _id: '1403',
        roundId: '1403',
        initialized: true,
        lastInitializedRound: '1403',
        length: '5760',
        startBlock: '8081280',
        pools: [],
        shares: []
      })
      const roundPools = [
        {
          id: '0xd18a02647d99dc9f79afbe0f58f8353178e6141f-1403',
          transcoder: {
            id: delegateId
          },
          rewardTokens: '1'
        },
        {
          id: '0xd18a02647d99dc9f79afbe0f58f8353178e6141f-1403',
          transcoder: {
            id: delegateId
          },
          rewardTokens: '2'
        }
      ]
      const getDelegateTotalStakeStub = sinon
        .stub(delegateService, 'getDelegateTotalStake')
        .returns(totalStake)
      const consoleLogStub = sinon.stub(console, 'error')

      try {
        await delegatePoolService.updateDelegatePoolsOfRound(round, roundPools)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(getDelegateTotalStakeStub.called)
      expect(consoleLogStub.callCount).equal(2)
      expect(
        consoleLogStub.calledWith(
          '[Update Delegates Pools] - The delegate 0 of the pool 0xd18a02647d99dc9f79afbe0f58f8353178e6141f-1403 was not found, did you call the updateDelegatesJob() before?'
        )
      )
      // restore stubs
      getDelegateTotalStakeStub.restore()
    })
  })
})
