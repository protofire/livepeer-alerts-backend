const express = require('express')
const subscribersRouters = require('./server/subscriber/subscriber.route')
const earningsRouters = require('./server/earning/earning.route')
const telegramRouters = require('./server/telegram/telegram.route')
const roundRouters = require('./server/round/round.route')
const delegateRouters = require('./server/delegate/delegate.route')
const delegatorRouters = require('./server/delegator/delegator.route')

const router = express.Router() // eslint-disable-line new-cap

router.get('/health-check', (req, res) => res.send('OK'))

router.use('/subscribers', subscribersRouters)

router.use('/earnings', earningsRouters)

router.use('/telegrams', telegramRouters)

router.use('/rounds', roundRouters)

router.use('/delegates', delegateRouters)

router.use('/delegators', delegatorRouters)

module.exports = router
