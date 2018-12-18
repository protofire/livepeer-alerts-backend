const express = require('express')
const subscribersRouters = require('./server/subscriber/subscriber.route')

const router = express.Router() // eslint-disable-line new-cap

router.get('/health-check', (req, res) => res.send('OK'))

router.use('/subscribers', subscribersRouters)

module.exports = router
