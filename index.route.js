const express = require('express')
const subscribersRouters = require('./server/subscriber/subscriber.route')
const telegramRouters = require('./server/telegram/telegram.route')
const roundRouters = require('./server/round/round.route')
const delegateRouters = require('./server/delegate/delegate.route')
const delegatorRouters = require('./server/delegator/delegator.route')
const shareRouters = require('./server/share/share.route')

const router = express.Router() // eslint-disable-line new-cap

router.get('/health-check', (req, res) => res.send('OK'))

router.use('/subscribers', subscribersRouters)

router.use('/telegrams', telegramRouters)

router.use('/rounds', roundRouters)

router.use('/delegates', delegateRouters)

router.use('/delegators', delegatorRouters)

router.use('/shares', shareRouters)

module.exports = router
