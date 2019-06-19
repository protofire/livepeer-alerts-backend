const { client } = require('../apolloClient')
const gql = require('graphql-tag')

const getDelegateRewards = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        rewards(where: { transcoder: "${delegateAddress}" }) {
          rewardTokens
        }
      }
    `
  })
  return queryResult.data && queryResult.data.rewards ? queryResult.data.rewards : null
}

const getDelegateTotalStake = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoder(id: "${delegateAddress}") {
          totalStake
        }
      }
    `
  })
  return queryResult.data && queryResult.data.transcoder && queryResult.data.transcoder.totalStake
    ? queryResult.data.transcoder.totalStake
    : null
}

const getDelegate = async delegateAddress => {
  return {}
}

module.exports = {
  getDelegate,
  getDelegateRewards,
  getDelegateTotalStake
}
