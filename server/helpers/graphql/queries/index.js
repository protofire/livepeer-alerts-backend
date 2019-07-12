const {
  getLivepeerDelegateAccount,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getLivepeerDelegates,
  getPoolsPerRound
} = require('./delegate')
const { getCurrentRound } = require('./protocol')

module.exports = {
  getLivepeerDelegateAccount,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getCurrentRound,
  getLivepeerDelegates,
  getPoolsPerRound
}
