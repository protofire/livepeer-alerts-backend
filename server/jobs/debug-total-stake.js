const axios = require('axios')
const { getProtocolService } = require('../helpers/services/protocolService')

const users = [
  {
    username: 'Livepeer',
    address: '0xABC04058E20c9CBA4f360244648FEDF30CeBc3B4'
  },
  {
    username: 'Mariano',
    address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064'
  },
  {
    username: 'Cristian',
    address: '0x155cCf41305F5fE3FAae64eCea8a1E2cAd08F085'
  }
]

let apiPromises = new Promise(async (resolve, reject) => {
  try {
    const protocolService = getProtocolService()
    const currentRound = await protocolService.getCurrentRound()
    for (let user of users) {
      const response = await axios.post(
        'https://apis.fabrx.io/v1.0/network/livepeer/getDelegator',
        { addr: user.address }
      )
      console.log(`CurrentRound: ${currentRound}`, `Username: ${user.username}`, response.data)
    }
    resolve()
  } catch (err) {
    console.error(err)
    reject(err)
  }
})

apiPromises.then(() => process.exit(0)).catch(err => process.exit(1))
