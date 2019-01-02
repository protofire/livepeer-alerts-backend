const LivepeerSDK = require('@livepeer/sdk')
const { MathBN } = require('./utils')

const getLivepeerTranscoders = async () => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  return await rpc.getTranscoders()
}

const getLivepeerDelegatorAccount = async address => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  const summary = await rpc.getDelegator(address)

  // Add total stake
  const { bondedAmount = '', pendingStake = '' } = summary
  const totalStake = MathBN.max(bondedAmount, pendingStake)

  summary.totalStake = totalStake
  return summary
}

const getLivepeerTranscoderAccount = async address => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  return await rpc.getTranscoder(address)
}

const getLivepeerCurrentRound = async () => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  return await rpc.getCurrentRound()
}

const getLivepeerDelegatorTokenBalance = async address => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  return await rpc.getTokenBalance(address)
}

const getLivepeerDelegatorStake = async address => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  const summary = await rpc.getDelegator(address)

  // Add total stake
  const { bondedAmount = 0, pendingStake = 0 } = summary
  const totalStake = MathBN.max(bondedAmount, pendingStake)

  return totalStake
}

module.exports = {
  getLivepeerTranscoders,
  getLivepeerDelegatorAccount,
  getLivepeerTranscoderAccount,
  getLivepeerCurrentRound,
  getLivepeerDelegatorTokenBalance,
  getLivepeerDelegatorStake
}
