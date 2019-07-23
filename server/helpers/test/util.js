const { DAILY_FREQUENCY } = require('../../../config/constants')

const { unitAmountInTokenUnits } = require('../utils')

const createRewardObject = (transcoderId, roundId, rewardAmount) => {
  // ID between 1 and 100
  const id = Math.floor(Math.random() * 100 + 1)
  // Reward token between 1*10.pow(21) and 99 * 10.pow(21)
  const base = Math.pow(10, 21)
  const top = 9 * Math.pow(10, 21)
  const rewardTokens = rewardAmount
    ? rewardAmount
    : Math.floor(Math.random() * top + base).toString()
  const transcoder = createTranscoder(transcoderId)
  const round = createRoundObject(roundId)
  return {
    id,
    rewardTokens,
    transcoder,
    round
  }
}

const createRoundObject = roundId => {
  return {
    id: roundId
  }
}

// TODO Complete with all the fields
const createTranscoder = (
  transcoderId,
  rewardCut = '100000',
  feeShare = '450000',
  pendingRewardCut = '50000',
  pendingFeeShare = '450000',
  active = true,
  pricePerSegment = '150000000000',
  pendingPricePerSegment = '150000000000',
  totalStake = '440522208151278163711606'
) => {
  const mockTranscoder = {
    _id: transcoderId,
    id: transcoderId,
    address: transcoderId,
    active,
    ensName: null,
    status: 'Registered',
    lastRewardRound: '1092',
    rewardCut,
    feeShare,
    pricePerSegment,
    pendingRewardCut,
    pendingFeeShare,
    pendingPricePerSegment,
    totalStake,
    pools: [],
    delegators: []
  }
  return mockTranscoder
}

const createDelegator = delegatorId => {
  const mockDelegator = {
    address: delegatorId,
    allowance: '9000000000000000000000',
    bondedAmount: '1648721740335621049244',
    delegateAddress: delegatorId,
    delegatedAmount: '0',
    fees: '0',
    lastClaimRound: '1348',
    pendingFees: '0',
    pendingStake: '1880033099473791560404',
    startRound: '1241',
    status: 'Bonded',
    withdrawRound: '0',
    withdrawAmount: '0',
    nextUnbondingLockId: '1',
    totalStake: '1880033099473791560404'
  }

  return mockDelegator
}

const createSubscriber = (
  email = 'test@subscriber.com',
  address = '1',
  emailFrequency = DAILY_FREQUENCY,
  telegramFrequency = DAILY_FREQUENCY,
  telegramChatId = '1',
  activated = 1,
  lastEmailSent = '1',
  lastTelegramSent = '1',
  createdAt = Date.now()
) => {
  return {
    email,
    address,
    emailFrequency,
    telegramFrequency,
    telegramChatId,
    activated,
    lastEmailSent,
    lastTelegramSent,
    createdAt
  }
}

const createTotalStake = (min, max) => {
  const stakeInUnits = Math.floor(Math.random() * max) + min
  return unitAmountInTokenUnits(stakeInUnits)
}

const createPool = (
  delegate = '1',
  round = '10',
  rewardTokens = '1000000',
  totalStakeOnRound = '5000000'
) => {
  return {
    _id: `${delegate}-${round}`,
    rewardTokens,
    totalStakeOnRound,
    delegate,
    round
  }
}

const getLivepeerDefaultConstants = () => {
  return {
    DELEGATOR_STATUS: {
      Bonded: 'Bonded',
      Pending: 'Pending',
      Unbonded: 'Unbonded',
      Unbonding: 'Unbonding'
    },
    ROLE: {
      DELEGATOR: 'Delegator',
      TRANSCODER: 'Transcoder'
    }
  }
}

const utils = {
  createRewardObject,
  createRoundObject,
  createTranscoder,
  createDelegator,
  createTotalStake,
  createSubscriber,
  createPool,
  getLivepeerDefaultConstants
}

module.exports = utils
