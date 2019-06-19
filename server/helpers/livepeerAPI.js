const LivepeerSDK = require('@mariano-aguero/sdk')
const { MathBN, calculateNextRoundInflationRatio } = require('./utils')

const INFLATION_DIV_UNITS = 1000000

const getLivepeerTranscoders = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoders()
}

const getLivepeerDelegatorAccount = async address => {
  if (!address) {
    return null
  }
  const { rpc } = await LivepeerSDK.default()
  const summary = await rpc.getDelegator(address)

  summary.totalStake = getTotalStakeFromSummary(summary)
  return summary
}

const getLivepeerTranscoderAccount = async address => {
  if (!address) {
    return null
  }
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoder(address)
}

const getLivepeerCurrentRound = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getCurrentRound()
}

const getLivepeerLastInitializedRound = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getLastInitializedRound()
}

const getLivepeerCurrentRoundInfo = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getCurrentRoundInfo()
}

const getLivepeerRoundLength = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getRoundLength()
}

const getLivepeerRoundsPerYear = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getRoundsPerYear()
}

const getLivepeerDelegatorTokenBalance = async address => {
  if (!address) {
    return null
  }
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTokenBalance(address)
}

const getLivepeerDelegatorStake = async address => {
  if (!address) {
    return null
  }
  const { rpc } = await LivepeerSDK.default()
  const summary = await rpc.getDelegator(address)
  return getTotalStakeFromSummary(summary)
}

const getTotalStakeFromSummary = summary => {
  const { bondedAmount = 0, pendingStake = 0 } = summary
  return MathBN.max(bondedAmount, pendingStake)
}

const getTokenTotalSupply = async () => {
  const { rpc } = await LivepeerSDK.default()
  return rpc.getTokenTotalSupply()
}

// Returns the inflation of the current round, the value should be divided by 1.000.000 in order to make it a ratio
const getInflationRate = async () => {
  const { rpc } = await LivepeerSDK.default()
  const inflation = await rpc.getInflation()
  return MathBN.div(inflation, INFLATION_DIV_UNITS)
}

// Returns the change of inflation for the next round, the value should be divided by 1.000.000 in order to make it a ratio
const getInflationChange = async () => {
  const { rpc } = await LivepeerSDK.default()
  const inflationChange = await rpc.getInflationChange()
  return MathBN.div(inflationChange, INFLATION_DIV_UNITS)
}

// Returns the inflation as a ratio for the next round, the value should be divided by 1.000.000 in order to make it a ratio
const getNextRoundInflation = async () => {
  const inflationRate = await getInflationRate()
  const inflationChange = await getInflationChange()
  const targetBondingRate = await getTargetBondingRate()
  const totalBonded = await getTotalBonded()
  const totalSupply = await getTokenTotalSupply()
  return calculateNextRoundInflationRatio(
    inflationRate,
    inflationChange,
    targetBondingRate,
    totalBonded,
    totalSupply
  )
}

// Returns the targetBondingRate, the value should be divided by 1.000.000 in order to make it a ratio
const getTargetBondingRate = async () => {
  const { rpc } = await LivepeerSDK.default()
  const target = await rpc.getTargetBondingRate()
  return MathBN.div(target, INFLATION_DIV_UNITS)
}

const getTotalBonded = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTotalBonded()
}

const getLivepeerDefaultConstants = async () => {
  const { constants } = await LivepeerSDK.default()
  const { Bonded, Pending, Unbonded, Unbonding } = constants.DELEGATOR_STATUS
  return {
    DELEGATOR_STATUS: {
      Bonded,
      Pending,
      Unbonded,
      Unbonding
    },
    ROLE: {
      DELEGATOR: 'Delegator',
      TRANSCODER: 'Transcoder'
    }
  }
}

const getLivepeerLatestBlock = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getBlock('latest')
}

const getLivepeerRoundProgress = async () => {
  const [currentRoundInfo, roundLength, latestBlock] = await Promise.all([
    getLivepeerCurrentRoundInfo(),
    getLivepeerRoundLength(),
    getLivepeerLatestBlock()
  ])

  const { id, initialized, lastInitializedRound, length, startBlock } = currentRoundInfo
  const { number } = latestBlock
  const nextRoundStartBlock = MathBN.add(startBlock, length)

  const nextRoundNum = MathBN.add(id, '1')
  const blocksUntilNextRound = MathBN.sub(nextRoundStartBlock - number)

  return {
    roundId: id,
    isInitialized: initialized,
    lastInitializedRound: lastInitializedRound,
    length: length,
    startBlock: startBlock,
    blocksUntilNextRound: blocksUntilNextRound,
    nextRoundStartBlock: nextRoundStartBlock,
    roundLength: roundLength,
    nextRoundNum: nextRoundNum,
    progress: length > 0 ? (blocksUntilNextRound * 100) / length : 0
  }
}

module.exports = {
  getLivepeerTranscoders,
  getLivepeerDelegatorAccount,
  getLivepeerTranscoderAccount,
  getLivepeerCurrentRound,
  getLivepeerDelegatorTokenBalance,
  getLivepeerDelegatorStake,
  getLivepeerCurrentRoundInfo,
  getLivepeerLastInitializedRound,
  getLivepeerDefaultConstants,
  getLivepeerRoundLength,
  getLivepeerRoundsPerYear,
  getLivepeerLatestBlock,
  getLivepeerRoundProgress,
  getInflationRate,
  getInflationChange,
  getNextRoundInflation,
  getTotalBonded,
  getTargetBondingRate
}
