const { createDelegator } = require('../server/helpers/test/util')

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonMongoose = require('sinon-mongoose')
const Round = require('../server/round/round.model')
const Delegator = require('../server/delegator/delegator.model')
const Subscriber = require('../server/subscriber/subscriber.model')
const Share = require('../server/share/share.model')
const mongoose = require('../config/mongoose')
const delegatorSharesService = require('../server/helpers/updateRoundShares')
const delegatorUtils = require('../server/helpers/delegatorUtils')
const subscriberUtils = require('../server/helpers/subscriberUtils')
describe('## UpdateRoundShares', () => {
  after('Closes the db connection', function() {
    console.log('Finish tests, closing mongo connection')
    mongoose.connection.close()
  })
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

  describe('# updateDelegatorsShares', () => {
    it('Should call updateDelegatorsShares with no round and throw error', async () => {
      // given
      const resultExpected = true

      // when
      let throwedErr = false
      try {
        await delegatorSharesService.updateDelegatorsShares(null)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Should call updateDelegatorsShares with no subscribers on the db and logs on the console', async () => {
      // given
      const consoleLogStub = sinon.stub(console, 'log')
      // Stubs the return of subscriberUtils.getDelegatorSubscribers to return null, so no delegators were found
      const subscriberUtilsStub = sinon.stub(subscriberUtils, 'getDelegatorSubscribers').returns([])

      // when
      await delegatorSharesService.updateDelegatorsShares(currentRound)

      // then
      expect(
        consoleLogStub.calledWith('[Update Delegator shares] - No delegators subscribers found')
      )

      expect(subscriberUtilsStub.called)
      expect(consoleLogStub.called)
      // restore stubs
      consoleLogStub.restore()
      subscriberUtilsStub.restore()
    })
    it('Should receive a round, and there are delegators subscribers => should call checkAndUpdateMissingLocalDelegators() and updateDelegatorSharesOfRound() times of the amount of delegators', async () => {
      // given
      const delegator1 = createDelegator('1')
      const delegator2 = createDelegator('2')
      const delegators = [{ delegator: delegator1 }, { delegator: delegator2 }]

      const checkAndUpdateMissingLocalDelegatorsStub = sinon
        .stub(delegatorUtils, 'checkAndUpdateMissingLocalDelegators')
        .returns(null)

      // Stubs the return of subscriberUtils.getDelegatorSubscribers to return delegators
      const subscriberUtilsStub = sinon
        .stub(subscriberUtils, 'getDelegatorSubscribers')
        .returns(delegators)

      const updateDelegatorSharesOfRoundStub = sinon.stub(
        delegatorSharesService,
        'updateDelegatorSharesOfRound'
      )

      // when
      await delegatorSharesService.updateDelegatorsShares(currentRound)

      // then
      expect(subscriberUtilsStub.called)
      expect(checkAndUpdateMissingLocalDelegatorsStub.called)
      expect(updateDelegatorSharesOfRoundStub.called)
      expect(updateDelegatorSharesOfRoundStub.callCount).equal(delegators.length)
      // restore stubs
      checkAndUpdateMissingLocalDelegatorsStub.restore()
      updateDelegatorSharesOfRoundStub.restore()
      subscriberUtilsStub.restore()
    })
  })

  describe('# updateDelegatorSharesOfRound without interacting db', () => {
    it('Should call updateDelegatorSharesOfRound with no round and throw error', async () => {
      // given
      const resultExpected = true

      // when
      let throwedErr = false
      try {
        await delegatorSharesService.updateDelegatorSharesOfRound(null)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Should call updateDelegatorSharesOfRound with no delegator and throw error', async () => {
      // given
      const resultExpected = true

      // when
      let throwedErr = false
      try {
        await delegatorSharesService.updateDelegatorSharesOfRound(currentRound, null)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
    })
    it('Throws an error if the round received does not exists locally', async () => {
      // given
      const resultExpected = '[Update Delegators Shares] - The round provided does not exists'
      const delegator1 = createDelegator('1')
      let throwedErr = ''

      // Stubs the return of Round.findById to return null
      const roundMock = sinon.mock(Round)

      const delegatorMock = sinon.mock(Delegator)

      const expectationRound = roundMock
        .expects('findById')
        .once()
        .resolves(null)

      const expectationDelegator = delegatorMock
        .expects('findById')
        .once()
        .resolves({})

      try {
        await delegatorSharesService.updateDelegatorSharesOfRound(currentRound, delegator1)
      } catch (err) {
        throwedErr = err.message
      }
      // then
      expect(throwedErr).equal(resultExpected)
      expect(roundMock.called)
      roundMock.verify()
      delegatorMock.verify()
      // restore mocks
      roundMock.restore()
      delegatorMock.restore()
    })
  })

  describe.skip('# updateDelegatorSharesOfRound interacting db', () => {
    const roundId = '-1'
    const delegatorId = '0'
    const delegateId = '0'
    const shareId = `${delegatorId}-${roundId}`
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
    const delegatorData = {
      _id: delegatorId,
      shares: [],
      delegate: delegateId
    }
    let delegator = new Delegator(delegatorData)
    beforeEach('Creates round and delegate objects on db', async function() {
      this.timeout(10000)
      console.log('Starting test, creating round and delegate')
      round = await round.save()
      delegator = await delegator.save()
      console.log('Objects created, executing tests cases')
    })
    afterEach('Removes the created round and delegate objects from the db', async function() {
      console.log('Finish test, deleting round, share and delegate')
      await round.remove()
      await delegator.remove()
      await Share.findByIdAndRemove(shareId)
      console.log('Objects removed and connection closed')
    })
    it('Receives one delegator and round, creates a new share on db and update the round and delegator with the new share', async () => {
      // given
      const delegatorCurrentRewardTokens = '0'
      const newDelegatorTotalStake = '0'
      const shareExpected = {
        _id: shareId,
        rewardTokens: delegatorCurrentRewardTokens,
        totalStakeOnRound: newDelegatorTotalStake,
        delegator: delegatorId,
        delegate: delegateId,
        round: roundId
      }
      const delegatorExpected = {
        _id: delegatorId,
        delegate: delegateId,
        totalStake: newDelegatorTotalStake,
        shares: [shareExpected._id]
      }
      const roundExpected = {
        ...roundData,
        shares: [shareExpected._id]
      }

      const getDelegatorCurrentRewardTokensStub = sinon
        .stub(delegatorUtils, 'getDelegatorCurrentRewardTokens')
        .returns(delegatorCurrentRewardTokens)

      // when
      await delegatorSharesService.updateDelegatorSharesOfRound(round, delegator)

      // then
      const createdShare = await Share.findById(shareId)
      const createdShareWithoutCursor = {
        _id: createdShare._id,
        rewardTokens: createdShare.rewardTokens,
        totalStakeOnRound: createdShare.totalStakeOnRound,
        delegator: createdShare.delegator,
        delegate: createdShare.delegate,
        round: createdShare.round
      }
      const updatedDelegator = await Delegator.findById(delegatorId)
      const updatedDelegatorWithoutCursor = {
        _id: updatedDelegator._id,
        delegate: updatedDelegator.delegate,
        totalStake: updatedDelegator.totalStake,
        shares: updatedDelegator.shares
      }
      const updatedRound = await Round.findById(roundId)
      const updatedRoundWithoutCursor = {
        _id: updatedRound._id,
        roundId: updatedRound.roundId,
        initialized: updatedRound.initialized,
        lastInitializedRound: updatedRound.lastInitializedRound,
        length: updatedRound.length,
        startBlock: updatedRound.startBlock,
        pools: updatedRound.pools,
        shares: updatedRound.shares
      }

      expect(createdShareWithoutCursor).to.deep.equal(shareExpected)
      expect(updatedDelegatorWithoutCursor).to.deep.equal(delegatorExpected)
      expect(updatedRoundWithoutCursor).to.deep.equal(roundExpected)
      expect(getDelegatorCurrentRewardTokensStub.called)
    })
  })
})
