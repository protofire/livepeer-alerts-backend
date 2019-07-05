const LivepeerSDK = require('@livepeer/sdk')
const getLivepeerDelegatorAccount = async address => {
  if (!address) {
    return null
  }
  const { rpc } = await LivepeerSDK.default()
  const summary = await rpc.getDelegator(address)

  summary.totalStake = getTotalStakeFromSummary(summary)
  return summary
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
  const { MathBN } = require('../utils')
  return MathBN.max(bondedAmount, pendingStake)
}

module.exports = {
  getLivepeerDelegatorAccount,
  getLivepeerDelegatorTokenBalance,
  getLivepeerDelegatorStake
}
