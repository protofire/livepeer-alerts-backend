const Round = require('./round.model')
const { getProtocolService } = require('../helpers/services/protocolService')
const utils = require('../helpers/utils')
/**
 * Get round list.
 * @property {number} req.query.skip - Number of rounds to be skipped.
 * @property {number} req.query.limit - Limit number of rounds to be returned.
 * @returns {Round[]}
 */
const list = (req, res, next) => {
  const { limit = 50, skip = 0 } = req.query
  Round.list({ limit, skip })
    .then(telegrams => res.json(telegrams))
    .catch(e => next(e))
}

const protocolInfo = async (req, res, next) => {
  const protocolService = getProtocolService()
  const [
    totalSupply,
    inflationRate,
    inflationChange,
    targetBondingRate,
    totalBonded
  ] = await Promise.all([
    protocolService.getTokenTotalSupply(),
    protocolService.getInflationRate(),
    protocolService.getInflationChange(),
    protocolService.getTargetBondingRate(),
    protocolService.getTotalBonded()
  ])

  return res.json({
    totalSupply: utils.tokenAmountInUnits(totalSupply),
    inflationRate,
    inflationChange,
    targetBondingRate,
    totalBonded: utils.tokenAmountInUnits(totalBonded)
  })
}

module.exports = {
  list,
  protocolInfo
}
