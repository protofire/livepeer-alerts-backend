const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonMongoose = require('sinon-mongoose')
const { getDelegateService } = require('../server/helpers/services/delegateService')
const Round = require('../server/round/round.model')
const Pool = require('../server/pool/pool.model')
const Delegate = require('../server/delegate/delegate.model')
const mongoose = require('../config/mongoose')
const delegateUtils = require('../server/helpers/delegatesUtils')

describe('## UpdateRoundPools', () => {
  after('Closes the db connection', function() {
    console.log('Finish tests, closing mongo connection')
    mongoose.connection.close()
  })
  const delegateService = getDelegateService()
  const delegatePoolService = require('../server/helpers/updateRoundPools')
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
        await delegatePoolService.updateDelegatesPools(null)
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

      const checkAndUpdateMissingLocalDelegatesStub = sinon
        .stub(delegateUtils, 'checkAndUpdateMissingLocalDelegates')
        .returns(null)

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
      expect(checkAndUpdateMissingLocalDelegatesStub.called)
      // restore stubs
      getPoolsPerRoundStub.restore()
      checkAndUpdateMissingLocalDelegatesStub.restore()
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

      const checkAndUpdateMissingLocalDelegatesStub = sinon
        .stub(delegateUtils, 'checkAndUpdateMissingLocalDelegates')
        .returns(null)

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
      expect(checkAndUpdateMissingLocalDelegatesStub.called)
      // restore stubs
      getPoolsPerRoundStub.restore()
      updateDelegatesPoolsStub.restore()
      checkAndUpdateMissingLocalDelegatesStub.restore()
    })
  })
  describe('# updateDelegatePoolsOfRound without interacting db', () => {
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
    it('Throws an error if the round received does not exists locally', async () => {
      // given
      const resultExpected = '[Update Delegates Pools] - The round provided does not exists'
      let throwedErr = ''
      const delegateId = '0'
      const roundId = '0'
      const round = new Round({
        _id: roundId,
        roundId,
        initialized: true,
        lastInitializedRound: roundId,
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

      try {
        await delegatePoolService.updateDelegatePoolsOfRound(round, roundPools)
      } catch (err) {
        throwedErr = err.message
      }
      // then
      expect(throwedErr).equal(resultExpected)
    }).timeout(5000)
    it('Should try to fetch a delegate from roundPool that does not exists on the db and logs the error', async () => {
      // given
      const totalStake = '100'
      const delegateId = '0'
      const roundId = '1403'
      const round = new Round({
        _id: roundId,
        roundId,
        initialized: true,
        lastInitializedRound: roundId,
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

      // Stubs the return of Delegate.findById to return null, so no delegate was found
      const delegateMock = sinon.mock(Delegate)

      const expectationDelegate = delegateMock
        .expects('findById')
        .twice()
        .resolves(null)

      // Stubs the Round.findById to return a round object
      const roundMock = sinon.mock(Round)

      const expectationRound = roundMock
        .expects('findById')
        .once()
        .resolves(round)

      // When
      await delegatePoolService.updateDelegatePoolsOfRound(round, roundPools)

      // then
      expect(getDelegateTotalStakeStub.called)
      expect(consoleLogStub.callCount).equal(2)
      expect(
        consoleLogStub.calledWith(
          '[Update Delegates Pools] - The delegate 0 of the pool 0xd18a02647d99dc9f79afbe0f58f8353178e6141f-1403 was not found, did you call the updateDelegatesJob() before?'
        )
      )
      expect(delegateMock.called)
      // restore stubs
      getDelegateTotalStakeStub.restore()
      delegateMock.verify()
      delegateMock.restore()
      roundMock.verify()
      roundMock.restore()
    })
  })
  describe('# updateDelegatePoolsOfRound  interacting db', () => {
    const roundId = '-1'
    const delegateId = '0'
    const poolId = `${delegateId}-${roundId}`
    const rewardTokens = '1'
    const roundData = {
      _id: roundId,
      roundId,
      initialized: true,
      lastInitializedRound: roundId,
      length: '5760',
      startBlock: '8081280',
      pools: [],
      shares: []
    }
    let round = new Round({
      ...roundData
    })
    const delegateData = {
      _id: delegateId,
      pools: [],
      delegators: []
    }
    let delegate = new Delegate(delegateData)
    beforeEach('Creates round and delegate objects on db', async function() {
      this.timeout(10000)
      console.log('Starting test, creating round and delegate')
      round = await round.save()
      delegate = await delegate.save()
      console.log('Objects created, executing tests cases')
    })
    afterEach('Removes the created round and delegate objects from the db', async function() {
      console.log('Finish test, deleting round delegate and round')
      await round.remove()
      await delegate.remove()
      await Pool.findByIdAndRemove(poolId)
      console.log('Objects removed and connection closed')
    })
    it('Should receive one pool and save it, update the round and the delegate', async () => {
      // given
      const totalStake = '100'

      const pool1 = {
        id: poolId,
        transcoder: {
          id: delegateId
        },
        rewardTokens
      }

      const roundPools = [pool1]

      const updatedRoundExpected = {
        ...roundData,
        pools: [poolId]
      }

      const updatedDelegateExpected = {
        ...delegateData,
        pools: [
          {
            id: poolId,
            delegate: pool1.transcoder.id,
            round: roundId,
            rewardTokens
          }
        ]
      }

      const expectedPool = {
        _id: poolId,
        delegate: delegateId,
        round: roundId,
        totalStakeOnRound: totalStake,
        rewardTokens
      }

      const getDelegateTotalStakeStub = sinon
        .stub(delegateService, 'getDelegateTotalStake')
        .returns(totalStake)

      // When
      await delegatePoolService.updateDelegatePoolsOfRound(round, roundPools)

      const createdPool = await Pool.findById(poolId)
      const createdPoolWithoutCursor = {
        _id: createdPool._id,
        delegate: createdPool.delegate,
        round: createdPool.round,
        totalStakeOnRound: createdPool.totalStakeOnRound,
        rewardTokens: createdPool.rewardTokens
      }
      const updatedRound = await Round.findById(roundId)
      const {
        _id,
        initialized,
        lastInitializedRound,
        length,
        startBlock,
        pools,
        shares
      } = updatedRound

      const updatedRoundWithoutCursor = {
        _id,
        roundId,
        initialized,
        lastInitializedRound,
        length,
        startBlock,
        pools,
        shares
      }

      const updatedDelegate = await Delegate.findById(delegateId).populate({ path: 'pools' })
      const poolResult = updatedDelegate.pools[0]
      const updatedDelegateWithoutCursor = {
        delegators: updatedDelegate.delegators,
        _id: updatedDelegate._id,
        pools: [
          {
            rewardTokens: poolResult.rewardTokens,
            id: poolResult._id,
            delegate: poolResult.delegate,
            round: poolResult.round
          }
        ]
      }

      // then
      expect(getDelegateTotalStakeStub.called)
      expect(createdPoolWithoutCursor).to.deep.equal(expectedPool)
      expect(updatedRoundWithoutCursor).to.deep.equal(updatedRoundExpected)
      expect(updatedDelegateWithoutCursor).to.deep.equal(updatedDelegateExpected)
      expect(updatedDelegate.pools.length).equal(1)
      // restore stubs
      getDelegateTotalStakeStub.restore()
    })
  })
  /**
   *  TODO -- Add at least one more tests:
   *  1) add two pools with different id but same delegate address and round id => should throw err
   *  should return error if try to save two pools pool with the same combination (delegate, round)
   */
})
