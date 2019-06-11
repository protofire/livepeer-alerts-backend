// React apollo
const fetch = require('node-fetch')
const { ApolloClient } = require('apollo-client')
const { createHttpLink } = require('apollo-link-http')
const { InMemoryCache } = require('apollo-cache-inmemory')
const config = require('../../../config/config')

const httpLink = createHttpLink({
  uri: config.apolloApiUrl,
  fetch: fetch
})

const client = new ApolloClient({
  link: httpLink,
  //url: config.apolloApiUrl,
  cache: new InMemoryCache()
})

module.exports = {
  client
}
