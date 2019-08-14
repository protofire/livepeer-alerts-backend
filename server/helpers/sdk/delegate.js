const LivepeerSDK = require('@livepeer/sdk')

const getLivepeerDelegates = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoders()
}

const getLivepeerDelegateAccount = async address => {
  if (!address) {
    return null
  }
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoder(address)
}

/**
 * Adds compatibility with the graphql getPoolsPerRound
 * This method sould be only executed with the graphql, is not available on the SDK
 * @param roundNumber
 * @returns {Promise<null>}
 */
const getPoolsPerRound = async roundNumber => {
  console.error(
    '[SDK - Delegate] - the function getPoolsPerRound() was called but is not available on the SDK, please use the graphql implementation'
  )
  return null
}

module.exports = {
  getLivepeerDelegates,
  getLivepeerDelegateAccount,
  getPoolsPerRound
}
