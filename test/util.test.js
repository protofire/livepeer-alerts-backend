const testUtils = require('../server/helpers/test/util')
const utils = require('../server/helpers/utils')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
chai.config.includeStack = true
const moment = require('moment')

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
        const newReward = testUtils.createRewardObject(transcoderId, roundI)
        if (roundI <= 10) {
          newReward.rewardTokens = null
        }
        rewards.push(newReward)
      }
      // when
      const missedRewardCalls = utils.calculateMissedRewardCalls(rewards, currentRound)
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
        const newReward = testUtils.createRewardObject(transcoderId, roundI)
        if (roundI <= 5) {
          newReward.rewardTokens = null
        }
        if (roundI >= 35) {
          newReward.rewardTokens = null
        }
        rewards.push(newReward)
      }
      // when
      const missedRewardCalls = utils.calculateMissedRewardCalls(rewards, currentRound)
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
        const newReward = testUtils.createRewardObject(transcoderId, roundI)
        rewards.push(newReward)
      }
      // when
      const missedRewardCalls = utils.calculateMissedRewardCalls(rewards, currentRound)
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
      const bondingRate = utils.calculateCurrentBondingRate(totalBonded, totalSupply)
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
      const bondingRate = utils.calculateCurrentBondingRate(totalBonded, totalSupply)
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
      const bondingRate = utils.calculateCurrentBondingRate(totalBonded, totalSupply)
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
      const bondingRate = utils.calculateCurrentBondingRate(totalBonded, totalSupply)
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
      const nextRoundInflation = utils.calculateNextRoundInflationRatio(
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
      const resultExpected = 0
      // when
      const nextRoundInflation = utils.calculateNextRoundInflationRatio(
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
      const nextRoundInflation = utils.calculateNextRoundInflationRatio(
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
      const amountInUnits = utils.tokenAmountInUnits(amount)
      // then
      expect(amountInUnits).to.equal(resultExpected)
      done()
    })
  })
  describe('# getStartAndFinishDateOfWeeklySummary', () => {
    it('If no finish date received throws error', done => {
      // given
      const finishDay = null
      const msgExpected = '[Utils] - FinishDay not received'
      let msgReceived = ''

      // when
      try {
        utils.getStartAndFinishDateOfWeeklySummary(finishDay)
      } catch (err) {
        msgReceived = err.message
      }

      // then
      expect(msgReceived).to.equal(msgExpected)
      done()
    })
    it('If finish date received is not a date, throws error', done => {
      // given
      const finishDay = {}
      const msgExpected = '[Utils] - FinishDay received is not a valid date'
      let msgReceived = ''

      // when
      try {
        utils.getStartAndFinishDateOfWeeklySummary(finishDay)
      } catch (err) {
        msgReceived = err.message
      }

      // then
      expect(msgReceived).to.equal(msgExpected)
      done()
    })
    it('If the finishDay is today, should return today - 7 days as finishDate formated ', done => {
      // given
      const finishDay = new Date()
      const finishDate = moment(finishDay)
      const finishDateCopy = finishDate.clone()
      const startDate = finishDateCopy.subtract(7, 'days')
      const fromDateExpected = startDate.format('MMMM do')
      const toDateExpected = finishDate.format('MMMM do')
      const startRoundDateExpected = startDate.format('MMM D')
      const endRoundDateExpected = finishDate.format('MMM D, YYYY')

      // when
      const {
        fromDateCardinal,
        toDateCardinal,
        startRoundDate,
        endRoundDate
      } = utils.getStartAndFinishDateOfWeeklySummary(finishDay)

      // then
      expect(fromDateCardinal).to.equal(fromDateExpected)
      expect(toDateCardinal).to.equal(toDateExpected)
      expect(startRoundDate).to.equal(startRoundDateExpected)
      expect(endRoundDate).to.equal(endRoundDateExpected)
      done()
    })
  })
})
