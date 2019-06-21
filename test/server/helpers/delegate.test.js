const { createRewardObject } = require('../server/helpers/test/util')
const BN = require('bn.js')
const { calculateMissedRewardCalls } = require('../server/helpers/utils')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
const assert = chai.assert
const { MathBN } = require('../server/helpers/utils')

chai.config.includeStack = true

describe('## Delegate test', () => {
  describe('# getDelegateProtocolNextReward', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getDelegateNextReward', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getDelegateRewardToDelegators', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getDelegateRewardToDelegators', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getDelegatorNextReturn', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
  describe('# getMissedRewardCalls', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', done => {})
  })
})
