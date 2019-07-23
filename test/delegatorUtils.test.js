const delegatorUtils = require('../server/helpers/delegatorUtils')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')

describe('## DelegatesUtils test', () => {
  describe('# getWeeklySharesPerRound', () => {
    it('if no delegatorAddress given, throws an error', async () => {
      // given
      const delegatorAddress = null
      const currentRound = 1
      const errorExpected =
        '[DelegatesUtils] - No delegatorAddress provided on getWeeklySharesPerRound()'
      let errorReceived = ''
      // when
      try {
        await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)
      } catch (err) {
        errorReceived = err.message
      }

      // then
      expect(errorReceived).equal(errorExpected)
    })
    it('if no currentRound given, throws an error', async () => {
      // given
      const delegatorAddress = 1
      const currentRound = null
      const errorExpected =
        '[DelegatesUtils] - No currentRound provided on getWeeklySharesPerRound()'
      let errorReceived = ''
      // when
      try {
        await delegatorUtils.getWeeklySharesPerRound(delegatorAddress, currentRound)
      } catch (err) {
        errorReceived = err.message
      }

      // then
      expect(errorReceived).equal(errorExpected)
    })
  })
})
