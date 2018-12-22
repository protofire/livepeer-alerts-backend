const LivepeerSDK = require('@livepeer/sdk')

const getLivepeerTranscoders = async () => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  return await rpc.getTranscoders()
}

const getLivepeerDelegatorAccount = async address => {
  const livepeerSdk = await LivepeerSDK.default()
  const { rpc } = livepeerSdk
  return await rpc.getDelegator(address)
}

module.exports = {
  getLivepeerTranscoders,
  getLivepeerDelegatorAccount
}
