const { client } = require('./apolloClient')
const gql = require('graphql-tag')

const getTranscoderRewards = async transcoderAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        rewards(where: { transcoder: "${transcoderAddress}" }) {
          rewardTokens
        }
      }
    `
  })
  return queryResult.data && queryResult.data.rewards ? queryResult.data.rewards : null
}

const getTranscoderTotalStake = async transcoderAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoder(id: "${transcoderAddress}") {
          totalStake
        }
      }
    `
  })
  return queryResult.data && queryResult.data.transcoder && queryResult.data.transcoder.totalStake
    ? queryResult.data.transcoder.totalStake
    : null
}

module.exports = {
  getTranscoderRewards,
  getTranscoderTotalStake
}
