let exitSendNotificationJob = false

const LivepeerSDK = require('@livepeer/sdk')

LivepeerSDK.default().then(async data => {
  const { rpc } = data

  const transcoders = await rpc.getTranscoders()

  console.log(transcoders)

  exitSendNotificationJob = true
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
