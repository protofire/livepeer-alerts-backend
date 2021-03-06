const LivepeerSDK = require('@livepeer/sdk')

const getLivepeerSDKInstance = () =>{
  return LivepeerSDK.default({gas: 2.1 * 1000000})
}

const getLivepeerCurrentRound = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getCurrentRound()
}

const getLivepeerLastInitializedRound = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getLastInitializedRound()
}

const getLivepeerCurrentRoundInfo = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getCurrentRoundInfo()
}

const getLivepeerRoundLength = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getRoundLength()
}

const getLivepeerRoundsPerYear = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getRoundsPerYear()
}
const getTokenTotalSupply = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return rpc.getTokenTotalSupply()
}

// Returns the inflation of the current round, the value should be divided by 1.000.000 in order to make it a ratio
const getInflationRate = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getInflation()
}

// Returns the change of inflation for the next round, the value should be divided by 1.000.000 in order to make it a ratio
const getInflationChange = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getInflationChange()
}

// Returns the targetBondingRate, the value should be divided by 1.000.000 in order to make it a ratio
const getTargetBondingRate = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getTargetBondingRate()
}

// Returns the total amount of tokens bonded in the protocol
const getTotalBonded = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getTotalBonded()
}

const getLivepeerDefaultConstants = async () => {
  const { constants } = await getLivepeerSDKInstance()
  const { Bonded, Pending, Unbonded, Unbonding } = constants.DELEGATOR_STATUS
  return {
    DELEGATOR_STATUS: {
      Bonded,
      Pending,
      Unbonded,
      Unbonding
    },
    ROLE: {
      DELEGATOR: 'Delegator',
      TRANSCODER: 'Transcoder'
    }
  }
}

const getLivepeerLatestBlock = async () => {
  const { rpc } = await getLivepeerSDKInstance()
  return await rpc.getBlock('latest')
}

module.exports = {
  getLivepeerCurrentRound,
  getLivepeerLastInitializedRound,
  getLivepeerCurrentRoundInfo,
  getLivepeerRoundLength,
  getLivepeerRoundsPerYear,
  getTokenTotalSupply,
  getInflationRate,
  getInflationChange,
  getTargetBondingRate,
  getTotalBonded,
  getLivepeerDefaultConstants,
  getLivepeerLatestBlock
}
