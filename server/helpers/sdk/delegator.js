const LivepeerSDK = require('@livepeer/sdk')
const { CACHE_UPDATE_INTERVAL } = require('../../../config/constants')
let rpcInstance = null

const getLivepeerRpc = async () => {
  if (!rpcInstance) {
    const { rpc } = await LivepeerSDK.default()
    rpcInstance = rpc
    // Sets an interval that will reset the cached values periodically
    setInterval(() => {
      rpcInstance = null
    }, CACHE_UPDATE_INTERVAL)
  }
  return rpcInstance
}

const getLivepeerDelegatorAccount = async address => {
  if (!address) {
    return null
  }
  const rpc = await getLivepeerRpc()
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
  console.log('Calculate total stake', bondedAmount, pendingStake)
  return MathBN.max(bondedAmount, pendingStake)
}

module.exports = {
  getLivepeerDelegatorAccount,
  getLivepeerDelegatorTokenBalance,
  getLivepeerDelegatorStake
}
