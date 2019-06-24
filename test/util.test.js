const { createRewardObject } = require('../server/helpers/test/util')
const BN = require('bn.js')
const { calculateMissedRewardCalls } = require('../server/helpers/utils')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
const assert = chai.assert
const { MathBN } = require('../server/helpers/utils')

chai.config.includeStack = true

describe('## Utils file test', () => {
  describe('# Missed reward call calculation', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {
      // given
      const rewards = []
      const transcoderId = '1'
      const currentRound = {
        id: 30
      }
      for (let roundI = 1; roundI <= 30; roundI++) {
        const newReward = createRewardObject(transcoderId, roundI)
        if (roundI <= 10) {
          newReward.rewardTokens = null
        }
        rewards.push(newReward)
      }
      // when
      const missedRewardCalls = calculateMissedRewardCalls(rewards, currentRound)
      // then
      expect(missedRewardCalls).to.equal(10)
      done()
    })
    it('There are 40 rounds, the firsts 5 of them do not have reward object, neither the last 10 of them, result should be 5', done => {
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
      // when
      const missedRewardCalls = calculateMissedRewardCalls(rewards, currentRound)
      // then
      expect(missedRewardCalls).to.equal(5)
      done()
    })
    it('There are 30 rounds, all of them have reward, result should be 0', done => {
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
      // when
      const missedRewardCalls = calculateMissedRewardCalls(rewards, currentRound)
      // then
      expect(missedRewardCalls).to.equal(0)
      done()
    })
  })
})
