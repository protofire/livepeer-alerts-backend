const { TOKEN_DECIMAL_UNITS } = require('../../config/constants')

const Big = require('big.js')
const BN = require('bn.js')
const { unitMap, toWei } = require('ethjs-unit')
const Subscriber = require('../subscriber/subscriber.model')
const _ = require('lodash')
const promiseRetry = require('promise-retry')
const {
  NotSubscribedError,
  AlreadySubscribedError,
  StatusMustBeBondedError
} = require('./JobsErrors')

const MathBN = {
  sub: (a, b) => {
    const aBN = new Big(a || '0')
    const bBN = new Big(b || '0')
    return aBN.sub(bBN).toString(10)
  },
  add: (a, b) => {
    const aBN = new Big(a || '0')
    const bBN = new Big(b || '0')
    return aBN.add(bBN).toString(10)
  },
  gt: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.gt(bBN)
  },
  gte: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.gte(bBN)
  },
  lt: (a, b) => {
    const aBN = MathBN.toBig(a)
    const bBN = MathBN.toBig(b)
    return aBN.lt(bBN)
  },
  lte: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.lte(bBN)
  },
  mul: (a, b) => {
    const aBN = new Big(a || '0')
    const bBN = new Big(b || '0')
    return aBN.mul(bBN).toString()
  },
  div: (a, b) => {
    const aBN = new Big(a || '0')
    const bBN = new Big(b || '0')
    try {
      return aBN.div(bBN).toString()
    } catch (err) {
      console.error(err)
      return 0
    }
  },
  min: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return (aBN.lt(bBN) ? a : b).toString(10)
  },
  max: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return (aBN.gt(bBN) ? a : b).toString(10)
  },
  toBig: x => {
    return new Big(x)
  },
  pow: (a, b) => {
    const aBN = MathBN.toBig(a)
    return aBN.pow(b)
  }
}

const truncateStringInTheMiddle = (
  str,
  strLength = 41,
  strPositionStart = 8,
  strPositionEnd = 8
) => {
  if (typeof str === 'string' && str.length > strLength) {
    return `${str.substr(0, strPositionStart)}...${str.substr(
      str.length - strPositionEnd,
      str.length
    )}`
  }
  return str
}

// Message const
const subscribe = 'Subscribe'
const unsubscribe = 'Unsubscribe'
const getInstantAlert = 'Get instant alert'

// Subscription method that save data
const subscriptionSave = async data => {
  const checkSubscriptorExist = await subscriptionExist(data)
  if (checkSubscriptorExist) {
    throw new AlreadySubscribedError()
  }

  const { address, chatId } = data

  // Create new subscriber on button press
  let subscriber = new Subscriber({
    address: address,
    frequency: 'daily',
    telegramChatId: chatId
  })
  const subscriberCreated = await subscriber.save()

  console.log(
    `[Telegram bot] - Subscriptor saved successfully - Address ${address} - ChatId: ${chatId}`
  )

  return subscriberCreated
}

// Check for existing subscription user
const subscriptionExist = async data => {
  const { address, chatId } = data
  if (!chatId) {
    return false
  }
  const count = await Subscriber.countDocuments({ telegramChatId: chatId })
  console.log(
    `[Telegram bot] - Subscriptor exist ${!!count} - Address ${address} - ChatId: ${chatId}`
  )
  return count > 0
}

// Delete existing subscription user
const subscriptionRemove = async data => {
  const { address, chatId } = data
  const subscriber = await Subscriber.findOne({ address: address, telegramChatId: chatId }).exec()
  if (!subscriber) {
    throw new NotSubscribedError()
  }
  const subscriptorRemoved = await subscriber.remove()
  console.log(
    `[Telegram bot] - Subscriptor removed successfully - Address ${address} - ChatId: ${chatId}`
  )
  return subscriptorRemoved
}

// Get subscription user by address
const subscriptionFind = async data => {
  const { address, chatId } = data
  const subscriber = await Subscriber.findOne({ address: address, telegramChatId: chatId }).exec()
  if (!subscriber) {
    throw new NotSubscribedError()
  }
  console.log(`[Telegram bot] - Subscriptor found - Address ${address} - ChatId: ${chatId}`)
  return subscriber
}

const getButtonsBySubscriptor = async subscriptor => {
  let buttons = []
  let welcomeText
  const checkSubscriptorExist = await subscriptionExist(subscriptor)
  if (checkSubscriptorExist) {
    buttons.push([unsubscribe])
    welcomeText = `Choose the following options to continue:
1. Unsubscribe for alerts
2. Get instant alert`
  } else {
    buttons.push([subscribe])
    welcomeText = `Welcome to Livepeer Tools, choose the following options to continue:
1. Subscribe for alerts
2. Get instant alert`
  }

  buttons.push([getInstantAlert])
  return { welcomeText, buttons }
}

const formatPercentage = (x, decimals) => {
  return !x
    ? '0'
    : Big(x)
        .div('10000')
        .toFixed(decimals)
        .replace(/0+$/, '')
        .replace(/\.$/, '')
}

const formatBalance = (x, decimals = 0, unit = 'ether') => {
  decimals = decimals ? decimals : unitMap[unit].length
  return !x
    ? '0'
    : Big(x)
        .div(unitMap[unit])
        .toFixed(decimals)
        .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
}

const toBaseUnit = x => {
  return !x ? '' : toWei(x, 'ether').toString(10)
}

const fromBaseUnit = x => {
  return !x ? '' : formatBalance(x, 4)
}

const getSubscriptorRole = async subscriptor => {
  const { getProtocolService } = require('./services/protocolService')
  const { getDelegatorService } = require('./services/delegatorService')
  const protocolService = getProtocolService()
  const delegatorService = getDelegatorService()

  let [constants, delegator] = await promiseRetry(retry => {
    return Promise.all([
      protocolService.getLivepeerDefaultConstants(),
      delegatorService.getDelegatorAccount(subscriptor.address)
    ]).catch(err => {
      console.error(err)
      retry()
    })
  })

  const { status, address, delegateAddress } = delegator

  // Detect role
  const role =
    delegator &&
    status === constants.DELEGATOR_STATUS.Bonded &&
    delegateAddress &&
    address.toLowerCase() === delegateAddress.toLowerCase()
      ? constants.ROLE.TRANSCODER
      : constants.ROLE.DELEGATOR
  return {
    role,
    constants,
    delegator
  }
}

const getDidDelegateCallReward = async delegateAddress => {
  const { getProtocolService } = require('./services/protocolService')
  const { getLivepeerTranscoderAccount } = require('./sdk') // should use delegateService but the value lastRewardRound is not updated
  const protocolService = getProtocolService()

  const [delegate, currentRoundInfo] = await Promise.all([
    getLivepeerTranscoderAccount(delegateAddress),
    protocolService.getCurrentRoundInfo()
  ])

  // Check if transcoder call reward
  const callReward = delegate && delegate.lastRewardRound === currentRoundInfo.id
  return callReward
}

const getDelegatorRoundsUntilUnbonded = data => {
  const { delegator, constants, currentRoundInfo } = data
  const isUnbonding = delegator.status === constants.DELEGATOR_STATUS.Unbonding
  return isUnbonding
    ? MathBN.sub(delegator.withdrawRound, currentRoundInfo.lastInitializedRound)
    : 0
}

const tokenAmountInUnits = (amount, decimals = TOKEN_DECIMAL_UNITS) => {
  if (!amount) {
    return 0
  }
  const decimalsPerToken = MathBN.pow(10, decimals)
  return MathBN.div(amount, decimalsPerToken)
}

const unitAmountInTokenUnits = (amount, decimals = TOKEN_DECIMAL_UNITS) => {
  const decimalsPerToken = MathBN.pow(10, decimals)
  return MathBN.mul(amount, decimalsPerToken)
}

const calculateMissedRewardCalls = (rewards, currentRound) => {
  if (!currentRound || !rewards) {
    return 0
  }
  return rewards
    .sort((a, b) => b.round.id - a.round.id)
    .filter(
      reward =>
        reward.rewardTokens === null &&
        reward.round.id >= currentRound.id - 30 &&
        reward.round.id !== currentRound.id
    ).length
}

const calculateCurrentBondingRate = (totalBonded, totalSupply) => {
  if (!totalBonded || !totalSupply) {
    return 0
  }
  return MathBN.div(totalBonded, totalSupply)
}

// Calculates the nextRoundInflation as a ratio
const calculateNextRoundInflationRatio = (
  inflationRate,
  inflationChange,
  targetBondingRate,
  totalBonded,
  totalSupply
) => {
  if (!inflationRate || !inflationChange || !targetBondingRate || !totalBonded || !totalSupply) {
    return 0
  }

  let nextRoundInflation
  const currentBondingRate = calculateCurrentBondingRate(totalBonded, totalSupply)
  // If the current bonding rate is bellow the targetBondingRate, the inflation is positive, otherwise is negative
  if (MathBN.lt(currentBondingRate, targetBondingRate)) {
    nextRoundInflation = MathBN.add(inflationRate, inflationChange)
  } else {
    nextRoundInflation = MathBN.sub(inflationRate, inflationChange)
  }
  return nextRoundInflation
}

module.exports = {
  MathBN,
  truncateStringInTheMiddle,
  subscribe,
  unsubscribe,
  getInstantAlert,
  getButtonsBySubscriptor,
  subscriptionFind,
  subscriptionRemove,
  subscriptionExist,
  subscriptionSave,
  fromBaseUnit,
  toBaseUnit,
  formatBalance,
  formatPercentage,
  getSubscriptorRole,
  getDidDelegateCallReward,
  getDelegatorRoundsUntilUnbonded,
  tokenAmountInUnits,
  unitAmountInTokenUnits,
  calculateMissedRewardCalls,
  calculateNextRoundInflationRatio,
  calculateCurrentBondingRate
}
