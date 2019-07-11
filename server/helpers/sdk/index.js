const { getLivepeerDelegateAccount, getLivepeerDelegates } = require('./delegate')
const {
  getLivepeerCurrentRound,
  getTotalBonded,
  getInflationChange,
  getInflationRate,
  getLivepeerCurrentRoundInfo,
  getLivepeerDefaultConstants,
  getLivepeerLastInitializedRound,
  getLivepeerLatestBlock,
  getLivepeerRoundLength,
  getLivepeerRoundsPerYear,
  getTargetBondingRate
} = require('./protocol')

const {
  getLivepeerDelegatorTokenBalance,
  getLivepeerDelegatorStake,
  getLivepeerDelegatorAccount
} = require('./delegator')

module.exports = {
  getLivepeerDelegatorAccount,
  getLivepeerDelegatorStake,
  getLivepeerDelegatorTokenBalance,
  getLivepeerDelegateAccount,
  getLivepeerDelegates,
  getLivepeerCurrentRound,
  getTotalBonded,
  getInflationChange,
  getInflationRate,
  getLivepeerCurrentRoundInfo,
  getLivepeerDefaultConstants,
  getLivepeerLastInitializedRound,
  getLivepeerLatestBlock,
  getLivepeerRoundLength,
  getLivepeerRoundsPerYear,
  getTargetBondingRate
}
