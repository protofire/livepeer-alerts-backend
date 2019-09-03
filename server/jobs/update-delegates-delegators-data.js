const mongoose = require('../../config/mongoose')
const { getDelegateService } = require('../helpers/services/delegateService')
const { checkAndUpdateMissingLocalDelegates } = require('../helpers/delegatesUtils')
const { checkAndUpdateMissingLocalDelegators } = require('../helpers/delegatorUtils')
const { getDelegatorSubscribers } = require('../helpers/subscriberUtils')

const updateDelegatesAndDelegatorsData = new Promise(async (resolve, reject) => {
  console.log(`Update delegates and delegators data - Start`)

  // Update delegates
  const delegateService = getDelegateService()
  const delegates = await delegateService.getDelegates()
  await checkAndUpdateMissingLocalDelegates(delegates)

  // Update delegators
  const delegatorsAndSubscribers = await getDelegatorSubscribers()
  if (!delegatorsAndSubscribers || delegatorsAndSubscribers.length === 0) {
    console.log('No delegators subscribers found')
    resolve()
  }

  const delegators = []
  for (let delegatorAndSubscriber of delegatorsAndSubscribers) {
    const { delegator } = delegatorAndSubscriber
    delegators.push(delegator)
  }

  const delegatorsUnique = delegators.reduce((acc, current) => {
    const x = acc.find(item => item.address === current.address)
    if (!x) {
      return acc.concat([current])
    } else {
      return acc
    }
  }, [])
  await checkAndUpdateMissingLocalDelegators(delegatorsUnique)

  resolve()
})

updateDelegatesAndDelegatorsData
  .then(() => {
    mongoose.connection.close()
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
