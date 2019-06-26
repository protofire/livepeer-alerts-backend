const { getLivepeerTranscoderAccount, getLivepeerTranscoders } = require('./delegate')
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
  getLivepeerTranscoderAccount,
  getLivepeerTranscoders,
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
