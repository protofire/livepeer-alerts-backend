const config = require('../../config/config')
const { frontendUrl } = config

class NoAddressError extends Error {
  constructor(configName) {
    let message = `To subscribe to Livepeer Tools, you must pass your wallet address as a valid parameter. 
  Go to the <a href="${frontendUrl}">website</a> and copy the link to subscribe telegram so you can start receiving notifications in the application.`
    super(message)
  }
}

class NotSubscribedError extends Error {
  constructor(configName) {
    let message = `You are not subscribed,  please subscribe to get alert notifications.`
    super(message)
  }
}

class AlreadySubscribedError extends Error {
  constructor(configName) {
    let message = `You are already subscribed.`
    super(message)
  }
}

class StatusMustBeBondedError extends Error {
  constructor(err) {
    const { status } = err
    let message = `You can't subscribe. Your status must be Bonded. Your actual status is ${status}`
    super(message)
  }
}

class NoAlertToSendError extends Error {
  constructor(err) {
    const { status } = err
    let message = `There is no alert to send, your status must be Bonded. Your actual status is ${status}`
    super(message)
  }
}

module.exports = {
  NoAddressError,
  AlreadySubscribedError,
  NotSubscribedError,
  StatusMustBeBondedError,
  NoAlertToSendError
}
