const {
  getDelegateSummary,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates
} = require('./delegate')
const { getCurrentRound } = require('./protocol')

module.exports = {
  getDelegateSummary,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getCurrentRound
}
