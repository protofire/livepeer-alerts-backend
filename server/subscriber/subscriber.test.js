const mongoose = require('mongoose')
const request = require('supertest-as-promised')
const httpStatus = require('http-status')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
const app = require('../../index')

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

describe('## Subscriber APIs', () => {
  let subscriber = {
    email: 'KK123',
    address: 'TTTTHGHH',
    frequency: 'weekly'
  }

  describe('# POST /api/subscribers', () => {
    it('should create a new subscriber', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          subscriber = res.body
          done()
        })
        .catch(done)
    })
  })

  describe('# GET /api/subscribers/:subscriberId', () => {
    it('should get subscriber details', done => {
      request(app)
        .get(`/api/subscribers/${subscriber._id}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          done()
        })
        .catch(done)
    })

    it('should report error with message - Not found, when subscriber does not exists', done => {
      request(app)
        .get('/api/subscribers/56c787ccc67fc16ccc1a5e92')
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.message).to.equal('Not Found')
          done()
        })
        .catch(done)
    })
  })

  describe('# PUT /api/subscribers/:subscriberId', () => {
    it('should update subscriber email details', done => {
      subscriber.email = 'KK'
      request(app)
        .put(`/api/subscribers/${subscriber._id}`)
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal('KK')
          done()
        })
        .catch(done)
    })
  })

  describe('# PUT /api/subscribers/:subscriberId', () => {
    it('should update subscriber address details', done => {
      subscriber.address = 'GG'
      request(app)
        .put(`/api/subscribers/${subscriber._id}`)
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.address).to.equal('GG')
          done()
        })
        .catch(done)
    })
  })

  describe('# PUT /api/subscribers/:subscriberId', () => {
    it('should update subscriber frequency details', done => {
      subscriber.frequency = 'monthly'
      request(app)
        .put(`/api/subscribers/${subscriber._id}`)
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.frequency).to.equal('monthly')
          done()
        })
        .catch(done)
    })
  })

  describe('# GET /api/subscribers/', () => {
    it('should get all subscribers', done => {
      request(app)
        .get('/api/subscribers')
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body).to.be.an('array')
          done()
        })
        .catch(done)
    })

    it('should get all subscribers (with limit and skip)', done => {
      request(app)
        .get('/api/subscribers')
        .query({ limit: 10, skip: 1 })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body).to.be.an('array')
          done()
        })
        .catch(done)
    })
  })

  describe('# DELETE /api/subscribers/', () => {
    it('should delete subscriber', done => {
      request(app)
        .delete(`/api/subscribers/${subscriber._id}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal('KK')
          done()
        })
        .catch(done)
    })
  })
})
