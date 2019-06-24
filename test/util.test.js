const { createRewardObject } = require('../server/helpers/test/util')
const {
  calculateMissedRewardCalls,
  calculateCurrentBondingRate,
  calculateNextRoundInflationRatio,
  tokenAmountInUnits
} = require('../server/helpers/utils')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
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
  describe('# Current bonding rate calculation', () => {
    it('Total bonded is 100, total supply is 1000,  the bonding rate should be 0.1 (10%)', done => {
      // given
      const totalBonded = 100
      const totalSupply = 1000
      const resultExpected = '0.1'
      // when
      const bondingRate = calculateCurrentBondingRate(totalBonded, totalSupply)
      // then
      expect(bondingRate).to.equal(resultExpected)
      done()
    })
    it('Total bonded is 0, total supply is 1000,  the bonding rate should be 0 (0%)', done => {
      // given
      const totalBonded = 0
      const totalSupply = 1000
      const resultExpected = 0
      // when
      const bondingRate = calculateCurrentBondingRate(totalBonded, totalSupply)
      // then
      expect(bondingRate).to.equal(resultExpected)
      done()
    })
    it('Total bonded is 1000, total supply is 1000,  the bonding rate should be 1 (100%)', done => {
      // given
      const totalBonded = 1000
      const totalSupply = 1000
      const resultExpected = '1'
      // when
      const bondingRate = calculateCurrentBondingRate(totalBonded, totalSupply)
      // then
      expect(bondingRate).to.equal(resultExpected)
      done()
    })
    it('Total bonded is 999, total supply is 1000,  the bonding rate should be 0.999 (99%)', done => {
      // given
      const totalBonded = 999
      const totalSupply = 1000
      const resultExpected = '0.999'
      // when
      const bondingRate = calculateCurrentBondingRate(totalBonded, totalSupply)
      // then
      expect(bondingRate).to.equal(resultExpected)
      done()
    })
  })
  describe('# Next inflation rate calculation', () => {
    it('The inflation rate is 1000, the inflation change is 3, the currentBondingRate is bellow the targetCurrentRate, result should be 1003', done => {
      // given
      const inflationRate = 1000
      const inflationChange = 3
      const targetBondingRate = 50
      const totalBonded = 10
      const totalSupply = 1000
      const resultExpected = '1003'
      // when
      const nextRoundInflation = calculateNextRoundInflationRatio(
        inflationRate,
        inflationChange,
        targetBondingRate,
        totalBonded,
        totalSupply
      )
      // then
      expect(nextRoundInflation).to.equal(resultExpected)
      done()
    })
    it('The inflation rate is 0, the inflation change is 3, the currentBondingRate is bellow the targetCurrentRate, result should be 0', done => {
      // given
      const inflationRate = 0
      const inflationChange = 3
      const targetBondingRate = 50
      const totalBonded = 10
      const totalSupply = 1000
      const resultExpected = '0'
      // when
      const nextRoundInflation = calculateNextRoundInflationRatio(
        inflationRate,
        inflationChange,
        targetBondingRate,
        totalBonded,
        totalSupply
      )
      // then
      expect(nextRoundInflation).to.equal(resultExpected)
      done()
    })
    it('The inflation rate is 1000, the inflation change is 3, the currentBondingRate reached the targetCurrentRate, result should be 997', done => {
      // given
      const inflationRate = 1000
      const inflationChange = 3
      const targetBondingRate = 0.5
      const totalBonded = 999
      const totalSupply = 1000
      const resultExpected = '997'
      // when
      const nextRoundInflation = calculateNextRoundInflationRatio(
        inflationRate,
        inflationChange,
        targetBondingRate,
        totalBonded,
        totalSupply
      )
      // then
      expect(nextRoundInflation).to.equal(resultExpected)
      done()
    })
  })
  describe('# Token amount in units', () => {
    it('Should convert token units in units amount', done => {
      // given
      const amount = 1000000000000000111
      const decimals = 18
      const resultExpected = '1.0000000000000001'
      // when
      const amountInUnits = tokenAmountInUnits(amount)
      // then
      expect(amountInUnits).to.equal(resultExpected)
      done()
    })
  })
})
