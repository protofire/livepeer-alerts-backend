const delegateUtils = require('../server/helpers/delegatesUtils')
const testUtil = require('../server/helpers/test/util')
const Delegate = require('../server/delegate/delegate.model')
const utils = require('../server/helpers/utils')
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const mongoose = require('../config/mongoose')

after(done => {
  mongoose.connection.close()
  done()
})

describe('## DelegatesUtils test', () => {
  describe('# getListOfUpdatedDelegates', () => {
    it('Old list has 3 delegates, new list has same 3 but the last one has a different reward cut, should return the last one', done => {
      // given
      const delegate1 = testUtil.createTranscoder('1', '10', '15', '0', '0')
      const delegate2 = testUtil.createTranscoder('2', '15', '9', '0', '0')
      const delegate3 = testUtil.createTranscoder('3', '19', '39', '10', '0')
      const delegate3New = {
        ...delegate3,
        rewardCut: '25'
      }
      const delegateExpected = {
        ...delegate3New
      }
      const resultExpected = {
        hasChanged: true,
        id: delegateExpected._id,
        oldProperties: {
          active: delegate3.active,
          feeShare: delegate3.feeShare,
          pendingFeeShare: delegate3.pendingFeeShare,
          pendingRewardCut: delegate3.pendingRewardCut,
          rewardCut: delegate3.rewardCut
        },
        newProperties: {
          active: delegate3New.active,
          feeShare: delegate3New.feeShare,
          pendingFeeShare: delegate3New.pendingFeeShare,
          pendingRewardCut: delegate3New.pendingRewardCut,
          rewardCut: delegate3New.rewardCut
        }
      }

      const oldDelegates = [delegate1, delegate2, delegate3]
      const newDelegates = [delegate1, delegate2, delegate3New]

      // when
      const result = delegateUtils.getListOfUpdatedDelegates(oldDelegates, newDelegates)

      const resultFix = {
        ...result.propertiesChangedList[0]
      }

      // then
      expect(resultFix).to.deep.equal(resultExpected)
      done()
    })
  })
  describe('# hasDelegateChangedRules', () => {
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; ; new delegate: feeShare: 100 => should return true', done => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const active = false
      const oldDelegate = testUtil.createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        active
      )
      const newDelegate = {
        ...oldDelegate,
        feeShare: '100'
      }

      // when
      const result = delegateUtils.hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
      done()
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; active: false; new delegate: rewardCut: 100 => should return true', done => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const active = false
      const oldDelegate = testUtil.createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        active
      )
      const newDelegate = {
        ...oldDelegate,
        rewardCut: '100'
      }

      // when
      const result = delegateUtils.hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
      done()
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; active: false; new delegate: pendingRewardCut: 100 => should return true', done => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const active = false
      const oldDelegate = testUtil.createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        active
      )
      const newDelegate = {
        ...oldDelegate,
        rewardCut: '100'
      }

      // when
      const result = delegateUtils.hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
      done()
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; active: false; new delegate: pendingFeeShare: 100 => should return true', done => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const oldDelegate = testUtil.createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare
      )
      const newDelegate = {
        ...oldDelegate,
        rewardCut: '100'
      }

      // when
      const result = delegateUtils.hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
      done()
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; totalStake: 1, active: false, new delegate: totalStake: 100 => should return false', done => {
      // given
      const transcoderId = 1
      const resultExpected = false
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const totalStake = '1'
      const active = false
      const oldDelegate = testUtil.createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        active,
        null,
        null,
        totalStake
      )
      const newDelegate = {
        ...oldDelegate,
        totalStake: '100'
      }

      // when
      const result = delegateUtils.hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
      done()
    })
    it('Old delegate: rewardCut: 1, feeShare: 1, pendingRewardCut: 1, pendingFeeShare: 1; totalStake: 1, active: false, new delegate: active: true => should return true', done => {
      // given
      const transcoderId = 1
      const resultExpected = true
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const totalStake = '1'
      const active = false
      const oldDelegate = testUtil.createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        active,
        null,
        null,
        totalStake
      )
      const newDelegate = {
        ...oldDelegate,
        active: true
      }

      // when
      const result = delegateUtils.hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
      done()
    })
    it('Old delegate: has the same values on rewardCut, feeShare, pendingRewardCut, pendingFeeShare and active as the new delegate, the other properties are different => should return false', done => {
      // given
      const transcoderId = 1
      const resultExpected = false
      const rewardCut = '1'
      const feeShare = '1'
      const pendingRewardCut = '1'
      const pendingFeeShare = '1'
      const totalStake = '1'
      const active = false
      let oldDelegate = testUtil.createTranscoder(
        transcoderId,
        rewardCut,
        feeShare,
        pendingRewardCut,
        pendingFeeShare,
        active,
        null,
        null,
        totalStake
      )
      oldDelegate = {
        ...oldDelegate,
        ensName: null,
        status: 'Registered',
        lastRewardRound: '1092'
      }
      const newDelegate = {
        ...oldDelegate,
        ensName: 'charles',
        status: 'NotRegistered',
        lastRewardRound: '1990'
      }

      // when
      const result = delegateUtils.hasDelegateChangedRules(oldDelegate, newDelegate)

      // then
      expect(result).equal(resultExpected)
      done()
    })
  })
  describe('# getDelegateRulesChanged', () => {
    it('Old delegate and new delegate have the same properties ; new has same but with different active property => result should be true with property active', done => {
      // given
      const delegate3 = testUtil.createTranscoder('3', '19', '39', '10', '0')
      const delegate3New = {
        ...delegate3,
        active: !delegate3.active
      }
      const resultExpected = {
        hasChanged: true,
        oldProperties: {
          active: delegate3.active,
          feeShare: delegate3.feeShare,
          pendingFeeShare: delegate3.pendingFeeShare,
          pendingRewardCut: delegate3.pendingRewardCut,
          rewardCut: delegate3.rewardCut
        },
        newProperties: {
          active: delegate3New.active,
          feeShare: delegate3New.feeShare,
          pendingFeeShare: delegate3New.pendingFeeShare,
          pendingRewardCut: delegate3New.pendingRewardCut,
          rewardCut: delegate3New.rewardCut
        }
      }

      // when
      const result = delegateUtils.getDelegateRulesChanged(delegate3, delegate3New)

      // then
      expect(result).to.deep.equal(resultExpected)
      done()
    })
  })
  describe('# getDelegateLastWeekRoundsPools', () => {
    it('Throws error if no delegateAddress given', async () => {
      // given
      const delegateAddress = null
      const currentRound = 1
      const errorExpected =
        '[DelegatesUtils] - No delegateAddress provided on getDelegateLastWeekRoundsPools()'
      let throwedErrorMsg = ''
      // when
      try {
        await delegateUtils.getDelegateLastWeekRoundsPools(delegateAddress, currentRound)
      } catch (err) {
        throwedErrorMsg = err.message
      }
      // then
      expect(throwedErrorMsg).equal(errorExpected)
    })
    it('Throws error if no currentRound given', async () => {
      // given
      const delegateAddress = 1
      const currentRound = null
      const errorExpected =
        '[DelegatesUtils] - No currentRound provided on getDelegateLastWeekRoundsPools()'
      let throwedErrorMsg = ''
      // when
      try {
        await delegateUtils.getDelegateLastWeekRoundsPools(delegateAddress, currentRound)
      } catch (err) {
        throwedErrorMsg = err.message
      }
      // then
      expect(throwedErrorMsg).equal(errorExpected)
    })
    it('Delegate has 0 pools on the last week, returns 0', async () => {
      // given
      const delegateAddress = 1
      const currentRound = 7
      const resultExpected = '0.0000'
      const pools = []
      const delegate = testUtil.createTranscoder(delegateAddress)
      delegate.pools = pools

      const mockQuery = {
        exec: sinon.stub().returns(delegate)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegateMock = sinon.mock(Delegate)

      const expectationDelegate = delegateMock
        .expects('findById')
        .once()
        .withArgs(delegateAddress)
        .returns(populateQuery)

      // when
      const result = await delegateUtils.getDelegateLastWeekRoundsPools(
        delegateAddress,
        currentRound
      )

      // then
      expect(result).equal(resultExpected)
      delegateMock.verify()
      // restore mocks
      delegateMock.restore()
    })
    it('Delegate has 3 pools on the last week, returns the sum of them', async () => {
      // given
      const delegateAddress = 1
      const currentRound = 7
      const reward1 = utils.unitAmountInTokenUnits('100')
      const reward2 = utils.unitAmountInTokenUnits('200')
      const reward3 = utils.unitAmountInTokenUnits('300')
      const pool1 = testUtil.createPool(delegateAddress, '7', reward1)
      const pool2 = testUtil.createPool(delegateAddress, '5', reward2)
      const pool3 = testUtil.createPool(delegateAddress, '1', reward3)
      const resultExpected = '600.0000'
      const pools = [pool3, pool2, pool1]
      const delegate = testUtil.createTranscoder(delegateAddress)
      delegate.pools = pools

      const mockQuery = {
        exec: sinon.stub().returns(delegate)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegateMock = sinon.mock(Delegate)

      const expectationDelegate = delegateMock
        .expects('findById')
        .once()
        .withArgs(delegateAddress)
        .returns(populateQuery)

      // when
      const result = await delegateUtils.getDelegateLastWeekRoundsPools(
        delegateAddress,
        currentRound
      )

      // then
      expect(result).equal(resultExpected)
      delegateMock.verify()
      // restore mocks
      delegateMock.restore()
    })
    it('Delegate has 7 pools on the last week, returns the sum of them', async () => {
      // given
      const delegateAddress = 1
      const currentRound = 7
      const reward1 = utils.unitAmountInTokenUnits('100')
      const reward2 = utils.unitAmountInTokenUnits('200')
      const reward3 = utils.unitAmountInTokenUnits('300')
      const reward4 = utils.unitAmountInTokenUnits('400')
      const reward5 = utils.unitAmountInTokenUnits('500')
      const reward6 = utils.unitAmountInTokenUnits('600')
      const reward7 = utils.unitAmountInTokenUnits('700')
      const pool1 = testUtil.createPool(delegateAddress, '1', reward1)
      const pool2 = testUtil.createPool(delegateAddress, '2', reward2)
      const pool3 = testUtil.createPool(delegateAddress, '3', reward3)
      const pool4 = testUtil.createPool(delegateAddress, '4', reward4)
      const pool5 = testUtil.createPool(delegateAddress, '5', reward5)
      const pool6 = testUtil.createPool(delegateAddress, '6', reward6)
      const pool7 = testUtil.createPool(delegateAddress, '7', reward7)
      const resultExpected = '2800.0000'
      const pools = [pool7, pool6, pool5, pool4, pool3, pool2, pool1]
      const delegate = testUtil.createTranscoder(delegateAddress)
      delegate.pools = pools

      const mockQuery = {
        exec: sinon.stub().returns(delegate)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegateMock = sinon.mock(Delegate)

      const expectationDelegate = delegateMock
        .expects('findById')
        .once()
        .withArgs(delegateAddress)
        .returns(populateQuery)

      // when
      const result = await delegateUtils.getDelegateLastWeekRoundsPools(
        delegateAddress,
        currentRound
      )

      // then
      expect(result).equal(resultExpected)
      delegateMock.verify()
      // restore mocks
      delegateMock.restore()
    })
    it('Delegate has 8 pools in total, returns the sum of the first 7 (the ones that are part of the week)', async () => {
      // given
      const delegateAddress = 1
      const currentRound = 7
      const reward1 = utils.unitAmountInTokenUnits('100')
      const reward2 = utils.unitAmountInTokenUnits('200')
      const reward3 = utils.unitAmountInTokenUnits('300')
      const reward4 = utils.unitAmountInTokenUnits('400')
      const reward5 = utils.unitAmountInTokenUnits('500')
      const reward6 = utils.unitAmountInTokenUnits('600')
      const reward7 = utils.unitAmountInTokenUnits('700')
      const reward8 = utils.unitAmountInTokenUnits('800')
      const pool1 = testUtil.createPool(delegateAddress, '1', reward1)
      const pool2 = testUtil.createPool(delegateAddress, '2', reward2)
      const pool3 = testUtil.createPool(delegateAddress, '3', reward3)
      const pool4 = testUtil.createPool(delegateAddress, '4', reward4)
      const pool5 = testUtil.createPool(delegateAddress, '5', reward5)
      const pool6 = testUtil.createPool(delegateAddress, '6', reward6)
      const pool7 = testUtil.createPool(delegateAddress, '7', reward7)
      const pool8 = testUtil.createPool(delegateAddress, '8', reward8)
      const resultExpected = '2800.0000'
      const pools = [pool8, pool7, pool6, pool5, pool4, pool3, pool2, pool1]
      const delegate = testUtil.createTranscoder(delegateAddress)
      delegate.pools = [pool7, pool6, pool5, pool4, pool3, pool2, pool1]

      const mockQuery = {
        exec: sinon.stub().returns(delegate)
      }

      const populateQuery = {
        populate: sinon.stub().returns(mockQuery)
      }

      const delegateMock = sinon.mock(Delegate)

      const expectationDelegate = delegateMock
        .expects('findById')
        .once()
        .withArgs(delegateAddress)
        .returns(populateQuery)

      // when
      const result = await delegateUtils.getDelegateLastWeekRoundsPools(
        delegateAddress,
        currentRound
      )

      // then
      expect(result).equal(resultExpected)
      delegateMock.verify()
      // restore mocks
      delegateMock.restore()
    })
  })
})
