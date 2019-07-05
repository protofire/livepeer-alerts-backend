const LivepeerSDK = require('@livepeer/sdk')

const getLivepeerTranscoders = async () => {
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoders()
}

const getLivepeerTranscoderAccount = async address => {
  if (!address) {
    return null
  }
  const { rpc } = await LivepeerSDK.default()
  return await rpc.getTranscoder(address)
}

module.exports = {
  getLivepeerTranscoders,
  getLivepeerTranscoderAccount
}
