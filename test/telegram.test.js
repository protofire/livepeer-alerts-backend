const mongoose = require('mongoose')
const request = require('supertest')
const httpStatus = require('http-status')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
const app = require('../index')

chai.config.includeStack = true

/**
 * root level hooks
 */
after(done => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

describe('## Telegram APIs', function() {
  describe('# GET /api/telegram/', () => {
    it('should get all telegrams', done => {
      request(app)
        .get('/api/telegrams')
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body).to.be.an('array')
          done()
        })
        .catch(done)
    })

    it('should get all telegrams (with limit and skip)', done => {
      request(app)
        .get('/api/telegrams')
        .query({ limit: 10, skip: 1 })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body).to.be.an('array')
          done()
        })
        .catch(done)
    })
  })
})
