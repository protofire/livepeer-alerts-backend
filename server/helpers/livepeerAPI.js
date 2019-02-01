const LivepeerSDK = require('@mariano-aguero/sdk')
const { MathBN } = require('./utils')

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

  const { id, startBlock, length, initialized } = currentRoundInfo
  const { number } = latestBlock
  const nextRoundStartBlock = MathBN.add(startBlock, length)

  const nextRoundNum = MathBN.add(id, '1')
  const blocksUntilNextRound = MathBN.sub(nextRoundStartBlock - number)

  return {
    isInitialized: initialized,
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
  getLivepeerRoundProgress
}
