const LivepeerSDK = require('@mariano-aguero/sdk')
const { MathBN } = require('./utils')

const getLivepeerTranscoders = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoders()
}

const getLivepeerDelegatorAccount = async address => {
  const { rpc } = await LivepeerSDK.default()
  const summary = await rpc.getDelegator(address)

  summary.totalStake = getTotalStakeFromSummary(summary)
  return summary
}

const getLivepeerTranscoderAccount = async address => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoder(address)
}

const getLivepeerCurrentRound = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getCurrentRound()
}

const getLivepeerCurrentRoundInfo = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getCurrentRoundInfo()
}

const getLivepeerDelegatorTokenBalance = async address => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTokenBalance(address)
}

const getLivepeerDelegatorStake = async address => {
  const { rpc } = await LivepeerSDK.default()
  const summary = await rpc.getDelegator(address)
  return getTotalStakeFromSummary(summary)
}

const getTotalStakeFromSummary = summary => {
  const { bondedAmount = 0, pendingStake = 0 } = summary
  return MathBN.max(bondedAmount, pendingStake)
}

module.exports = {
  getLivepeerTranscoders,
  getLivepeerDelegatorAccount,
  getLivepeerTranscoderAccount,
  getLivepeerCurrentRound,
  getLivepeerDelegatorTokenBalance,
  getLivepeerDelegatorStake,
  getLivepeerCurrentRoundInfo
}
