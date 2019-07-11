const {
  getLivepeerDelegateAccount,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getLivepeerDelegates
} = require('./delegate')
const { getCurrentRound } = require('./protocol')

module.exports = {
  getLivepeerDelegateAccount,
  getDelegateRewards,
  getDelegateTotalStake,
  getRegisteredDelegates,
  getCurrentRound,
  getLivepeerDelegates
}
