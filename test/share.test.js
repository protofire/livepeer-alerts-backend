const delegatorUtils = require('../server/helpers/delegatorUtils')
const Share = require('../server/share/share.model')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')

describe('## Share static methods test', () => {
  describe('# getDelegatorShareAmountOnRound', () => {
    it('getDelegatorShareAmountOnRound should return the share of the given round', async () => {
      // given
      const roundId = '1'
      const delegatorAddress = '1'
      const rewardTokens = '1000'
      const roundShare = {
        rewardTokens
      }

      const shareMock = sinon.mock(Share)

      const expectationShare = shareMock
        .expects('findOne')
        .once()
        .resolves(roundShare)

      // when
      const result = await Share.getDelegatorShareAmountOnRound(roundId, delegatorAddress)

      // then
      shareMock.verify()
      expect(result).equal(rewardTokens)
      // restore mocks
      shareMock.restore()
    })
  })
  describe('# getDelegatorCurrentRewardTokens', () => {
    it('If the is no round received, should throw error', async () => {
      // given
      const roundId = null
      const delegatorAddress = '1'
      const currentDelegatorTotalStake = '1000'
      let throwedError = false
      const expectedThrow = true

      // when
      try {
        const result = await delegatorUtils.getDelegatorCurrentRewardTokens(
          roundId,
          delegatorAddress,
          currentDelegatorTotalStake
        )
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
    })
    it('If the is no delegatorAddress received, should throw error', async () => {
      // given
      const roundId = '1'
      const delegatorAddress = null
      const currentDelegatorTotalStake = '1000'
      let throwedError = false
      const expectedThrow = true

      // when
      try {
        const result = await delegatorUtils.getDelegatorCurrentRewardTokens(
          roundId,
          delegatorAddress,
          currentDelegatorTotalStake
        )
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
    })
    it('If the is no currentDelegatorTotalStake received, should throw error', async () => {
      // given
      const roundId = '1'
      const delegatorAddress = '1'
      const currentDelegatorTotalStake = null
      let throwedError = false
      const expectedThrow = true

      // when
      try {
        const result = await delegatorUtils.getDelegatorCurrentRewardTokens(
          roundId,
          delegatorAddress,
          currentDelegatorTotalStake
        )
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
    })
    it('If the delegator has no shares on the last round, should return 0', async () => {
      // given
      const roundId = '1'
      const delegatorAddress = '1'
      const currentDelegatorTotalStake = '1000'
      const resultExpected = 0
      let throwedError = false
      const expectedThrow = false
      let result

      const shareMock = sinon.mock(Share)

      const expectationShare = shareMock
        .expects('findOne')
        .once()
        .resolves(null)

      // when
      try {
        result = await delegatorUtils.getDelegatorCurrentRewardTokens(
          roundId,
          delegatorAddress,
          currentDelegatorTotalStake
        )
      } catch (err) {
        throwedError = true
      }

      // then
      expect(expectedThrow).equal(throwedError)
      expect(result).equal(resultExpected)
      shareMock.verify()
      // restore mocks
      shareMock.restore()
    })
    it('Should return the current round reward tokens, the result should be the currentTotalStake minus the last round totalStake', async () => {
      // given
      const roundId = '1'
      const lastRoundId = '0'
      const delegatorAddress = '199'
      const currentDelegatorTotalStake = '10000'
      const lastRoundShare = {
        totalStakeOnRound: '9500'
      }
      const resultExpected = '500'
      const lastRoundShareId = `${delegatorAddress}-${lastRoundId}`
      let throwedError = false
      const expectedThrow = false

      const shareMock = sinon.mock(Share)

      const expectationShare = shareMock
        .expects('findById')
        .once()
        .withArgs(lastRoundShareId)
        .resolves(lastRoundShare)

      // when

      const result = await delegatorUtils.getDelegatorCurrentRewardTokens(
        roundId,
        delegatorAddress,
        currentDelegatorTotalStake
      )

      // then
      expect(expectedThrow).equal(throwedError)
      expect(result).equal(resultExpected)
      shareMock.verify()
      // restore mocks
      shareMock.restore()
    })
  })
})
