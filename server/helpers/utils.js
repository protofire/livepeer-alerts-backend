const Big = require('big.js')
const BN = require('bn.js')
const { unitMap, toWei } = require('ethjs-unit')
const Earning = require('../earning/earning.model')
const Subscriber = require('../subscriber/subscriber.model')
const _ = require('lodash')

const MathBN = {
  sub: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.sub(bBN).toString(10)
  },
  add: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
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
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
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
    return aBN.mul(bBN).toString(10)
  },
  div: (a, b) => {
    const aBN = new Big(a || '0')
    const bBN = new Big(b || '0')
    try {
      return aBN.div(bBN).toString(10)
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

const createEarning = async data => {
  const { subscriber, totalStake, currentRound } = data
  // Save status earning by subscriber
  const earning = new Earning({
    email: subscriber.email,
    address: subscriber.address,
    earning: totalStake,
    round: currentRound
  })
  return await earning.save()
}

// Message const
const subscribe = 'Subscribe'
const unsubscribe = 'Unsubscribe'
const getInstantAlert = 'Get instant alert'

// Subscription method that save data
const subscriptionSave = async data => {
  const checkSubscriptorExist = await subscriptionExist(data)
  if (checkSubscriptorExist) {
    throw new Error('You are already subscribed')
  }

  const { address, chatId } = data

  // Create new subscriber on button press
  let subscriber = new Subscriber({
    address: address,
    frequency: 'daily',
    telegramChatId: chatId
  })
  await subscriber.save()

  // Get livepeer data
  const { getLivepeerCurrentRound, getLivepeerDelegatorStake } = require('./livepeerAPI')

  let [delegatorStake, currentRound] = await Promise.all([
    getLivepeerDelegatorStake(address),
    getLivepeerCurrentRound()
  ])

  // Create earning
  const earningCreated = await createEarning({
    totalStake: delegatorStake,
    currentRoud: currentRound,
    subscriber: subscriber
  })

  console.log(`Subscriptor saved successfully - Address ${address} - ChatId: ${chatId}`)

  return earningCreated
}

// Check for existing subscription user
const subscriptionExist = async data => {
  const { address, chatId } = data
  const count = await Subscriber.countDocuments({ address: address, telegramChatId: chatId })
  console.log(`Subscriptor exist ${!!count} - Address ${address} - ChatId: ${chatId}`)
  return count
}

// Delete existing subscription user
const subscriptionRemove = async data => {
  const { address, chatId } = data
  const subscriber = await Subscriber.findOne({ address: address, telegramChatId: chatId }).exec()
  if (!subscriber) {
    throw new Error('You are not subscribed, please subscribe to get alert notifications.')
  }
  const subscriptorRemoved = await subscriber.remove()
  console.log(`Subscriptor removed successfully - Address ${address} - ChatId: ${chatId}`)
  return subscriptorRemoved
}

// Get subscription user by address
const subscriptionFind = async data => {
  const { address, chatId } = data
  const subscriber = await Subscriber.findOne({ address: address, telegramChatId: chatId }).exec()
  if (!subscriber) {
    throw new Error('You are not subscribed,  please subscribe to get alert notifications.')
  }
  console.log(`Subscriptor found - Address ${address} - ChatId: ${chatId}`)
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
    welcomeText = `Welcome to Livepeer Alert, choose the following options to continue:
1. Subscribe for alerts
2. Get instant alert`
  }

  buttons.push([getInstantAlert])
  return { welcomeText, buttons }
}

const formatPercentage = (x, decimals) => {
  return !x
    ? ''
    : Big(x)
        .div('10000')
        .toFixed(decimals)
        .replace(/0+$/, '')
        .replace(/\.$/, '')
}

const formatBalance = (x, decimals = 0, unit = 'ether') => {
  decimals = decimals ? decimals : unitMap[unit].length
  return !x
    ? ''
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

module.exports = {
  MathBN,
  createEarning,
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
  formatBalance
}
