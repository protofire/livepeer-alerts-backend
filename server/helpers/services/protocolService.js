const { calculateNextRoundInflationRatio, tokenAmountInUnits } = require('../utils')

const { CACHE_UPDATE_INTERVAL, PROTOCOL_DIVISION_BASE } = require('../../../config/constants')

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
    this.defaultConstants = null
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
      this.defaultConstants = null
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

  async getTokenTotalSupply() {
    if (!this.totalTokenSupply) {
      this.totalTokenSupply = await this.source.getTokenTotalSupply()
    }
    return this.totalTokenSupply
  }

  // Returns the inflation of the current round, the value should be divided by 1.000.000 in order to make it a ratio
  async getInflationRate() {
    if (!this.inflationRate) {
      const inflation = await this.source.getInflation()
      this.inflationRate = MathBN.div(inflation, PROTOCOL_DIVISION_BASE)
    }
    return this.inflationRate
  }

  // Returns the change of inflation for the next round, the value should be divided by 1.000.000 in order to make it a ratio
  async getInflationChange() {
    if (!this.inflationChange) {
      const inflationChange = await this.source.getInflationChange()
      this.inflationChange = MathBN.div(inflationChange, PROTOCOL_DIVISION_BASE)
    }
    return this.inflationChange
  }

  async getLastInitializedRound() {
    if (!this.lastInitializedRound) {
      this.lastInitializedRound = await this.source.getLastInitializedRound()
    }
    return this.lastInitializedRound
  }

  async getCurrentRoundInfo() {
    if (!this.currentRoundInfo) {
      this.currentRoundInfo = await this.source.getLivepeerCurrentRoundInfo()
    }
    return this.currentRoundInfo
  }

  async getRoundLength() {
    if (!this.currentRoundLenght) {
      this.currentRoundLenght = await this.source.getRoundLength()
    }
  }

  async getRoundsPerYear() {
    if (!this.roundsPerYear) {
      this.roundsPerYear = await this.source.getRoundsPerYear()
    }
  }
  async getCurrentRound() {
    if (!this.currentRound) {
      this.currentRound = await this.source.getCurrentRound()
    }
    return this.currentRound
  }

  // Returns the targetBondingRate, the value should be divided by 1.000.000 in order to make it a ratio
  async getTargetBondingRate() {
    if (!this.targetBondingRate) {
      const target = await this.source.getTargetBondingRate()
      this.targetBondingRate = MathBN.div(target, PROTOCOL_DIVISION_BASE)
    }
    return this.targetBondingRate
  }

  // Returns the total amount of tokens bonded in the protocol
  async getTotalBonded() {
    if (!this.totalBonded) {
      this.totalBonded = await this.source.getTotalBonded()
    }
    return this.totalBonded
  }

  async getLivepeerDefaultConstants() {
    if (!this.defaultConstants) {
      this.defaultConstants = await this.source.getLivepeerDefaultConstants()
    }
    return this.defaultConstants
  }

  async getLatestBlock() {
    return await this.source.getLatestBlock()
  }

  async getLivepeerRoundProgress() {
    const [currentRoundInfo, roundLength, latestBlock] = await Promise.all([
      this.getCurrentRoundInfo(),
      this.getRoundLength(),
      this.getLatestBlock()
    ])

    const { id, initialized, lastInitializedRound, length, startBlock } = currentRoundInfo
    const { number } = latestBlock
    const nextRoundStartBlock = MathBN.add(startBlock, length)

    const nextRoundNum = MathBN.add(id, '1')
    const blocksUntilNextRound = MathBN.sub(nextRoundStartBlock - number)

    return {
      roundId: id,
      isInitialized: initialized,
      lastInitializedRound: lastInitializedRound,
      length: length,
      startBlock: startBlock,
      blocksUntilNextRound: blocksUntilNextRound,
      nextRoundStartBlock: nextRoundStartBlock,
      roundLength: roundLength,
      nextRoundNum: nextRoundNum,
      progress: length > 0 ? (blocksUntilNextRound * 100) / length : 0
    }
  }

  // Returns the amount of minted tokens for the next round (inflation * totalSupply)
  async getMintedTokensForNextRound() {
    let [nextInflation, totalSupply] = await Promise.all([
      this.getNextRoundInflation(),
      this.getTokenTotalSupply()
    ])
    const mintedTokens = MathBN.mul(totalSupply, nextInflation)
    return tokenAmountInUnits(mintedTokens)
  }

  // Returns the inflation as a ratio for the next round, the value should be divided by 1.000.000 in order to make it a ratio
  async getNextRoundInflation() {
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
    return calculateNextRoundInflationRatio(
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
