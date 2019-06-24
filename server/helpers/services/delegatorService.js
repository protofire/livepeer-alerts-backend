const _ = require('lodash')
let delegatorServiceInstance
const defaultSource = require('../sdk/delegator') // the delegate information comes from the SDK as default, graphql is not implemented

const getDelegatorService = (source = defaultSource) => {
  if (!delegatorServiceInstance) {
    delegatorServiceInstance = new DelegatorService(source)
  }
  return delegatorServiceInstance
}

class DelegatorService {
  constructor(source) {
    this.source = source
  }

  getDelegatorAccount = async address => {
    const { getLivepeerDelegatorAccount } = this.source
    return await getLivepeerDelegatorAccount(address)
  }

  getDelegatorTokenBalance = async address => {
    const { getLivepeerDelegatorTokenBalance } = this.source
    return await getLivepeerDelegatorTokenBalance(address)
  }

  getLivepeerDelegatorStake = async address => {
    const { getLivepeerDelegatorStake } = this.source
    return await getLivepeerDelegatorStake(address)
  }
}

module.exports = {
  getDelegatorService
}
