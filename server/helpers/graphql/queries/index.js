const {
  getDelegateSummary,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getLivepeerTranscoders,
  getPoolsPerRound
} = require('./delegate')
const { getCurrentRound } = require('./protocol')

module.exports = {
  getDelegateSummary,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getCurrentRound,
  getLivepeerTranscoders,
  getPoolsPerRound
}
