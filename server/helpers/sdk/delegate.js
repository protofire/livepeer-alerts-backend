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

module.exports = {
  getLivepeerDelegates,
  getLivepeerDelegateAccount
}
