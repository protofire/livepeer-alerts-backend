const { createRewardObject } = require('../server/helpers/test/util')
const BN = require('bn.js')
const { calculateMissedRewardCalls, calculateRoi } = require('../server/helpers/utils')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
const assert = chai.assert
const { MathBN } = require('../server/helpers/utils')

chai.config.includeStack = true

describe('## Utils file test', () => {
  describe('# ROI Calculation', () => {
    it('Transcoder has rewards, totalStake is not null, should return ROI value', done => {
      // given
      const rewards = []
      const transcoderId = '1'
      const totalStake = '692281940372333711643'
      let totalReward = new BN(0)
      for (let roundI = 1; roundI <= 30; roundI++) {
        const newReward = createRewardObject(transcoderId, roundI)
        const rewardToken = newReward.rewardTokens
        totalReward = MathBN.add(totalReward, rewardToken.toString())
        rewards.push(newReward)
      }

      // when
      const roi = calculateRoi(rewards, totalStake)

      const roiExpected = MathBN.div(totalReward, totalStake)
      // then
      expect(roi).to.equal(roiExpected)
      done()
    })
    it('Transcoder has no rewards, totalStake is not null, should return 0 as ROI value', done => {
      // given
      const rewards = []
      const transcoderId = '1'
      const totalStake = 100000000000000000000
      for (let roundI = 1; roundI <= 30; roundI++) {
        const newReward = createRewardObject(transcoderId, roundI)
        newReward.rewardTokens = null
        rewards.push(newReward)
      }
      // when
      const roi = calculateRoi(rewards, totalStake)
      // then
      expect(roi).to.equal('0')
      assert.isOk(roi)
      done()
    })
    it('Transcoder has no rewards, ROI should be 0', done => {
      // given
      const rewards = []
      const transcoderId = '1'
      const totalStake = 100000000000000000000
      for (let roundI = 1; roundI <= 30; roundI++) {
        const newReward = createRewardObject(transcoderId, roundI)
        newReward.rewardTokens = null
        rewards.push(newReward)
      }
      // when
      const roi = calculateRoi(rewards, totalStake)
      // then
      expect(roi).to.equal('0')
      assert.isOk(roi)
      done()
    })
    it('Roi function receives null rewards, ROI should be 0', done => {
      // given
      const rewards = []
      const transcoderId = '1'
      const totalStake = 100000000000000000000
      for (let roundI = 1; roundI <= 30; roundI++) {
        const newReward = createRewardObject(transcoderId, roundI)
        newReward.rewardTokens = null
        rewards.push(newReward)
      }
      // when
      const roi = calculateRoi(null, totalStake)
      // then
      expect(roi).to.equal('0')
      assert.isOk(roi)
      done()
    })
    it('Roi function receives empty rewards array, ROI should be 0', done => {
      // given
      const rewards = []
      const totalStake = 100000000000000000000
      // when
      const roi = calculateRoi(rewards, totalStake)
      // then
      expect(roi).to.equal('0')
      assert.isOk(roi)
      done()
    })
    it('Total stake is 0, should return 0 and do not crash', done => {
      // given
      const rewards = []
      const totalStake = 0
      // when
      const roi = calculateRoi(rewards, totalStake)
      // then
      expect(roi).to.equal('0')
      assert.isOk(roi)
      done()
    })
  })

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
