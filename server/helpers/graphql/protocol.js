const { client } = require('./apolloClient')
const gql = require('graphql-tag')

const CurrentRoundQuery = gql`
  {
    rounds(first: 1) {
      id
    }
  }
`

const getCurrentRound = async () => {
  const queryResult = await client.query({
    query: CurrentRoundQuery
  })
  return queryResult.data && queryResult.data.rounds ? queryResult.data.rounds[0] : null
}

module.exports = {
  getCurrentRound
}
