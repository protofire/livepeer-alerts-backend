const { getDelegate } = require('../../../server/helpers/delegate')

const { createTranscoder } = require('../../../server/helpers/test/util')
let delegatesGrapqhl = require('../../../server/helpers/graphql/queries/delegate')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const jest = require('jest')
/*const expect = chai.expect
const assert = chai.assert
const sinon = require('sinon')*/

describe('## Delegate test', () => {
  describe('# getDelegate', () => {
    it('There are 30 rounds, 10 of them do not have reward object, result should be 10', async () => {
      // given
      const delegate = createTranscoder()
      // when
      const result = await getDelegate()
      console.log('Get delegate ', result)
      // then
    })
  })
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
