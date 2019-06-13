const createRewardObject = (transcoderId, roundId) => {
  // ID between 1 and 100
  const id = Math.floor(Math.random() * 100 + 1)
  // Reward token between 1*10.pow(21) and 99 * 10.pow(21)
  const base = Math.pow(10, 21)
  const top = 9 * Math.pow(10, 21)
  const rewardTokens = Math.floor(Math.random() * top + base).toString()
  const transcoder = createTranscoder(transcoderId)
  const round = createRoundObject(roundId)
  return {
    id,
    rewardTokens,
    transcoder,
    round
  }
}

const createRoundObject = roundId => {
  return {
    id: roundId
  }
}

// TODO Complete with all the fields
const createTranscoder = transcoderId => {
  return {
    id: transcoderId,
    active: true,
    status: 'Registered'
  }
}

module.exports = {
  createRewardObject,
  createRoundObject,
  createTranscoder
}
