const mongoose = require('../../config/mongoose')

const { getProtocolService } = require('../helpers/services/protocolService')
const roundPoolsUtils = require('../helpers/updateRoundPools')
const roundSharesUtils = require('../helpers/updateRoundShares')

const Round = require('../round/round.model')

const updatePoolsAndShares = new Promise(async (resolve, reject) => {
  console.log(`[Update pools and shares] - Start`)

  // Update delegate pools for last 3 rounds
  const protocolService = getProtocolService()
  const currentRoundInfo = await protocolService.getLivepeerRoundProgress()
  let { id, initialized, lastInitializedRound, length, startBlock } = currentRoundInfo

  const roundsToCheck = [id, `${id - 1}`, `${id - 2}`, `${id - 3}`, `${id - 4}`]

  for (let roundId of roundsToCheck) {
    try {
      let round = await Round.findById(roundId)
      if (!round) {
        const data = {
          _id: roundId,
          roundId,
          initialized,
          lastInitializedRound,
          length,
          startBlock
        }
        round = await Round.create(data)
      }
      await roundPoolsUtils.updateDelegatesPools(round)
    } catch (err) {
      console.log(`Error updating pools for round ${roundId}`, err && err.message)
      continue
    }
  }

  // Update delegator shares only for this round
  try {
    let round = await Round.findById(id)
    if (!round) {
      const data = {
        _id: id,
        roundId: id,
        initialized,
        lastInitializedRound,
        length,
        startBlock
      }
      round = await Round.create(data)
    }
    await roundSharesUtils.updateDelegatorsShares(round)
  } catch (err) {
    console.log(`Error updating shares for round ${id}`, err && err.message)
  }

  resolve()
})

updatePoolsAndShares
  .then(() => {
    mongoose.connection.close()
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
