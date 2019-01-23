let exitSendNotificationJob = false

const LivepeerSDK = require('@mariano-aguero/sdk')

LivepeerSDK.default().then(async data => {
  const { rpc, events, config, utils } = data

  const contractAddress = config.contracts.RoundsManager.address

  console.log('Eth Node Version: ', await config.eth.net_version())
  console.log('Connected: ', await config.eth.net_listening())
  console.log('Current Provider: ', config.eth.currentProvider)
  console.log('Syncing: ', await config.eth.syncing())
  console.log('Latest Block: ', await config.eth.blockNumber())

  const RoundsManager = config.contracts.RoundsManager

  const eventRoundsManager = RoundsManager.NewRound()
  console.log('Listening for events on ', contractAddress)

  // watch for changes
  eventRoundsManager.watch(function(error, result) {
    if (!error) {
      console.log(JSON.stringify(result, 0, 2))
    } else {
      console.log(JSON.stringify(error, 0, 2))
    }
  })
})

// Wait until stack was empty
function wait() {
  if (!exitSendNotificationJob) {
    setTimeout(wait, 1000)
  } else {
    process.exit(1)
  }
}
wait()
