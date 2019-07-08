const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const { getDelegateService } = require('../server/helpers/services/delegateService')
const { updateDelegatesPools } = require('../server/helpers/update-round-pools')
const Round = require('../server/round/round.model')

describe('## UpdateRoundPools test', () => {
  const delegateService = getDelegateService()
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
    it('Should get poolsPerRound with no rounds and throw error', async () => {
      // given
      const resultExpected = true

      const getPoolsPerRoundStub = sinon.stub(delegateService, 'getPoolsPerRound')

      // when
      let throwedErr = false
      try {
        await updateDelegatesPools(currentRound)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(getPoolsPerRoundStub.called)
      // restore stubs
      getPoolsPerRoundStub.restore()
    })
    it('Should get poolsPerRound with rounds and do not throw error', async () => {
      // given
      const resultExpected = false

      const getPoolsPerRoundStub = sinon.stub(delegateService, 'getPoolsPerRound')

      // when
      let throwedErr = false
      try {
        await updateDelegatesPools(currentRound)
      } catch (err) {
        throwedErr = true
      }

      // then
      expect(throwedErr).equal(resultExpected)
      expect(getPoolsPerRoundStub.called)
      // restore stubs
      getPoolsPerRoundStub.restore()
    })
    it('Should get poolsPerRound and call updateDelegatePoolsOfRound', async () => {
      // given
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

      const getPoolsPerRoundStub = sinon.stub(delegateService, 'getPoolsPerRound')

      // const updateDelegatePoolsOfRoundStub = sinon.stub(delegateService, 'getPoolsPerRound')

      // when
      updateDelegatesPools(currentRound)

      // then
      expect().equal()
      expect(getPoolsPerRoundStub.called)
      // restore stubs
      getPoolsPerRoundStub.restore()
    })
  })
  describe('# updateDelegatePoolsOfRound', () => {
    it('', async () => {})
  })
})
