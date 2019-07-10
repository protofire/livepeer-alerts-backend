const { client } = require('../apolloClient')

const gql = require('graphql-tag')
const _ = require('lodash')

// Returns the delegate summary, does not include rewards, ROI, missed reward calls or any calculated data
const getLivepeerTranscoderAccount = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoder(id: "${delegateAddress}") {
          id,
          address: id,
          active,
          ensName,
          status,
          lastRewardRound,
          rewardCut,
          feeShare,
          pricePerSegment,
          pendingRewardCut,
          pendingFeeShare,
          pendingPricePerSegment,
          totalStake
        }
      }
    `
  })
  return _.get(queryResult, 'data.transcoder', null)
}

// Returns all the delegates registered as transcoders which have reward tokens
const getRegisteredDelegates = async () => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoders(where: { totalStake_gt: 0, status: "Registered", id_not: null, active: true }) {
          id
          address: id
          totalStake
          rewards {
            id
            rewardTokens
          }
        }
      }
    `
  })
  return _.get(queryResult, 'data.transcoders', [])
}

// Returns the amount of tokens rewards on each round for the given delegate
const getDelegateRewards = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        rewards(
        where: { transcoder: "${delegateAddress}" }
        orderBy: id, orderDirection: desc) {
          id,
          rewardTokens
          round {
            id
          }
        }
      }
    `
  })
  return _.get(queryResult, 'data.rewards', null)
}

const getDelegateTotalStake = async delegateAddress => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoder(id: "${delegateAddress}") {
          id,
          totalStake
        }
      }
    `
  })
  return _.get(queryResult, 'data.transcoder.totalStake', null)
}

const getLivepeerTranscoders = async () => {
  const queryResult = await client.query({
    query: gql`
      {
        transcoders {
          id
          active
          ensName
          status
          lastRewardRound
          rewardCut
          feeShare
          pricePerSegment
          pendingRewardCut
          pendingFeeShare
          pendingPricePerSegment
          totalStake
        }
      }
    `
  })
  return _.get(queryResult, 'data.transcoders', [])
}

module.exports = {
  getLivepeerTranscoderAccount,
  getRegisteredDelegates,
  getDelegateRewards,
  getDelegateTotalStake,
  getLivepeerTranscoders
}
