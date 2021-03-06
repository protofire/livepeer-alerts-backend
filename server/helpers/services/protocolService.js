const promiseRetry = require('promise-retry')

const utils = require('../utils')

const {
  CACHE_UPDATE_INTERVAL,
  PROTOCOL_DIVISION_BASE,
  LIVEPEER_DEFAULT_CONSTANTS
} = require('../../../config/constants')

const defaultProtocolSource = require('../sdk/protocol')
let protocolServiceInstance

const getProtocolService = (source = defaultProtocolSource) => {
  if (!protocolServiceInstance) {
    protocolServiceInstance = new ProtocolService(source)
  }
  return protocolServiceInstance
}

class ProtocolService {
  constructor(source) {
    // The source of the functions that fetch data of the protocol, currently we are only supporting SDK
    this.source = source
    this.currentRound = null
    this.defaultConstants = LIVEPEER_DEFAULT_CONSTANTS
    this.totalBonded = null
    this.targetBondingRate = null
    this.inflationChange = null
    this.inflationRate = null
    this.totalTokenSupply = null
    this.lastInitializedRound = null
    this.currentRoundLenght = null
    this.currentRoundInfo = null
    this.roundsPerYear = null

    // Sets an interval that will reset the cached values periodically
    setInterval(() => {
      this.currentRound = null
      this.totalBonded = null
      this.targetBondingRate = null
      this.inflationChange = null
      this.inflationRate = null
      this.totalTokenSupply = null
      this.lastInitializedRound = null
      this.currentRoundLenght = null
      this.currentRoundInfo = null
      this.roundsPerYear = null
    }, CACHE_UPDATE_INTERVAL)
  }

  getTokenTotalSupply = async () => {
    if (!this.totalTokenSupply) {
      this.totalTokenSupply = await this.source.getTokenTotalSupply()
    }
    return this.totalTokenSupply
  }

  // Returns the inflation of the current round, the value should be divided by 1.000.000 in order to make it a ratio
  getInflationRate = async () => {
    if (!this.inflationRate) {
      const inflation = await this.source.getInflationRate()
      this.inflationRate = utils.MathBN.div(inflation, PROTOCOL_DIVISION_BASE)
    }
    return this.inflationRate
  }

  // Returns the change of inflation for the next round, the value should be divided by 1.000.000 in order to make it a ratio
  getInflationChange = async () => {
    if (!this.inflationChange) {
      const inflationChange = await this.source.getInflationChange()
      this.inflationChange = utils.MathBN.div(inflationChange, PROTOCOL_DIVISION_BASE)
    }
    return this.inflationChange
  }

  getLastInitializedRound = async () => {
    if (!this.lastInitializedRound) {
      this.lastInitializedRound = await this.source.getLivepeerLastInitializedRound()
    }
    return this.lastInitializedRound
  }

  getCurrentRoundInfo = async () => {
    if (!this.currentRoundInfo) {
      this.currentRoundInfo = await this.source.getLivepeerCurrentRoundInfo()
    }
    return this.currentRoundInfo
  }

  getRoundLength = async () => {
    if (!this.currentRoundLenght) {
      this.currentRoundLenght = await this.source.getLivepeerRoundLength()
    }
  }

  getRoundsPerYear = async () => {
    if (!this.roundsPerYear) {
      this.roundsPerYear = await this.source.getLivepeerRoundsPerYear()
    }
  }
  getCurrentRound = async () => {
    if (!this.currentRound) {
      this.currentRound = await this.source.getLivepeerCurrentRound()
    }
    return this.currentRound
  }

  // Returns the targetBondingRate, the value should be divided by 1.000.000 in order to make it a ratio
  getTargetBondingRate = async () => {
    if (!this.targetBondingRate) {
      const target = await this.source.getTargetBondingRate()
      this.targetBondingRate = utils.MathBN.div(target, PROTOCOL_DIVISION_BASE)
    }
    return this.targetBondingRate
  }

  // Returns the total amount of tokens bonded in the protocol
  getTotalBonded = async () => {
    if (!this.totalBonded) {
      this.totalBonded = await this.source.getTotalBonded()
    }
    return this.totalBonded
  }

  getLivepeerDefaultConstants = async () => {
    if (!this.defaultConstants) {
      this.defaultConstants = await this.source.getLivepeerDefaultConstants()
    }
    return this.defaultConstants
  }

  getLatestBlock = async () => {
    return await this.source.getLivepeerLatestBlock()
  }

  getLivepeerRoundProgress = async () => {
    const [currentRoundInfo, roundLength, latestBlock] = await promiseRetry(retry => {
      return Promise.all([
        this.getCurrentRoundInfo(),
        this.getRoundLength(),
        this.getLatestBlock()
      ]).catch(err => retry())
    })

    const { id, initialized, lastInitializedRound, length, startBlock } = currentRoundInfo
    const { number } = latestBlock
    const nextRoundStartBlock = utils.MathBN.add(startBlock, length)

    const nextRoundNum = utils.MathBN.add(id, '1')
    const blocksUntilNextRound = utils.MathBN.sub(nextRoundStartBlock - number)

    return {
      id,
      roundId: id,
      initialized,
      lastInitializedRound,
      length,
      startBlock,
      blocksUntilNextRound,
      nextRoundStartBlock,
      roundLength,
      nextRoundNum,
      progress: length > 0 ? (blocksUntilNextRound * 100) / length : 0
    }
  }

  // Returns the amount of minted tokens for the next round (inflation * totalSupply)
  getMintedTokensForNextRound = async () => {
    let [nextInflation, totalSupply] = await Promise.all([
      this.getNextRoundInflation(),
      this.getTokenTotalSupply()
    ])
    const mintedTokens = utils.MathBN.mul(totalSupply, nextInflation)
    return utils.tokenAmountInUnits(mintedTokens)
  }

  // Returns the inflation as a ratio for the next round, the value should be divided by 1.000.000 in order to make it a ratio
  getNextRoundInflation = async () => {
    let [
      inflationRate,
      inflationChange,
      targetBondingRate,
      totalBonded,
      totalSupply
    ] = await Promise.all([
      this.getInflationRate(),
      this.getInflationChange(),
      this.getTargetBondingRate(),
      this.getTotalBonded(),
      this.getTokenTotalSupply()
    ])
    return utils.calculateNextRoundInflationRatio(
      inflationRate,
      inflationChange,
      targetBondingRate,
      totalBonded,
      totalSupply
    )
  }
}

module.exports = {
  getProtocolService
}
