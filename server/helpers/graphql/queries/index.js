const {
  getLivepeerTranscoderAccount,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getLivepeerTranscoders
} = require('./delegate')
const { getCurrentRound } = require('./protocol')

module.exports = {
  getLivepeerTranscoderAccount,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getCurrentRound,
  getLivepeerTranscoders
}
