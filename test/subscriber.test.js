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

describe('## Subscriber APIs', function() {
  let activatedTest = 1

  describe('# POST /api/subscribers', () => {
    const id = Math.floor(Math.random() * 900000000300000000000) + 1000000000000000
    let subscriber = {
      email: `mariano.aguero+${id}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      frequency: 'weekly'
    }

    const emailToUpdate = `mariano.aguero+${id + 1}@altoros.com`

    it('should create a new subscriber', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body
          done()
        })
        .catch(done)
    })

    it('should not create a new subscriber with wrong email', done => {
      request(app)
        .post('/api/subscribers')
        .send({
          email: 'test',
          address: 'test',
          frequency: 'weekly'
        })
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.message).to.equal('"email" must be a valid email')
          done()
        })
        .catch(done)
    })

    it('should not create a new subscriber with wrong frequency', done => {
      request(app)
        .post('/api/subscribers')
        .send({
          email: emailToUpdate,
          address: 'test',
          frequency: 'test'
        })
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.message).to.equal(
            '"frequency" must be one of [monthly, weekly, daily, hourly]'
          )
          done()
        })
        .catch(done)
    })

    it('should not create an empty subscriber', done => {
      request(app)
        .post('/api/subscribers')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.message).to.equal(
            '"email" is required and "address" is required and "frequency" is required'
          )
          done()
        })
        .catch(done)
    })
  })

  describe('# POST /api/subscribers/activate', () => {
    const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
    const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

    let subscriberToActivate1 = {
      email: `mariano.aguero+${id1}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      frequency: 'weekly'
    }
    let subscriberToActivate2 = {
      email: `mariano.aguero+${id2}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      frequency: 'weekly'
    }

    it('should create a new subscriber to activate', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriberToActivate1)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriberToActivate1.email)
          expect(res.body.address).to.equal(subscriberToActivate1.address)
          expect(res.body.frequency).to.equal(subscriberToActivate1.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriberToActivate1 = res.body

          request(app)
            .post('/api/subscribers/activate')
            .send({
              activatedCode: subscriberToActivate1.activatedCode
            })
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.activatedCode).to.equal(subscriberToActivate1.activatedCode)
              expect(res.body.activated).to.equal(1)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should create a new subscriber to activate and give an error', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriberToActivate2)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriberToActivate2.email)
          expect(res.body.address).to.equal(subscriberToActivate2.address)
          expect(res.body.frequency).to.equal(subscriberToActivate2.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriberToActivate2 = res.body

          request(app)
            .post('/api/subscribers/activate')
            .send({
              activatedCode: 'bar'
            })
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal('"activatedCode" must be a number')
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
  })

  describe('# GET /api/subscribers/:subscriberId', () => {
    const id = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

    let subscriber = {
      email: `mariano.aguero+${id}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      frequency: 'weekly'
    }

    it('should get subscriber details', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body
          request(app)
            .get(`/api/subscribers/${subscriber._id}`)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.email).to.equal(subscriber.email)
              done()
            })
            .catch(done)
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
      const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
      const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id1}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }
      let emailToUpdate = `mariano.aguero+${id2}@altoros.com`

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update email
          subscriber.email = emailToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.email).to.equal(emailToUpdate)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber with wrong email and get an error', done => {
      const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
      const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id1}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }
      let emailToUpdate = `mariano.aguero`

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update email
          subscriber.email = emailToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal('"email" must be a valid email')
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber with empty email and get an error', done => {
      const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
      const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id1}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }
      let emailToUpdate = ``

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update email
          subscriber.email = emailToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal(
                '"email" is not allowed to be empty. "email" must be a valid email'
              )
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber address details', done => {
      const id = Math.floor(Math.random() * 80007600300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update address
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
        .catch(done)
    })

    it('should update subscriber with wrong address and get an error', done => {
      const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
      const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id1}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }
      let addressToUpdate = 111

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update address
          subscriber.address = addressToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal('"address" must be a string')
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber with empty address and get an error', done => {
      const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
      const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id1}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }
      let addressToUpdate = ``

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update address
          subscriber.address = addressToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal('"address" is not allowed to be empty')
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber frequency details', done => {
      const id = Math.floor(Math.random() * 80007600300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update address
          subscriber.frequency = 'hourly'
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.frequency).to.equal('hourly')
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber with wrong frequency and get an error', done => {
      const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
      const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id1}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }
      let frequencyToUpdate = 'asdas'

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update address
          subscriber.frequency = frequencyToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal(
                '"frequency" must be one of [monthly, weekly, daily, hourly]'
              )
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber with empty frequency and get an error', done => {
      const id1 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000
      const id2 = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id1}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }
      let frequencyToUpdate = ``

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update frequency
          subscriber.frequency = frequencyToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal(
                '"frequency" is not allowed to be empty. "frequency" must be one of [monthly, weekly, daily, hourly]'
              )
              done()
            })
            .catch(done)
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
      const id = Math.floor(Math.random() * 80007600300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body
          request(app)
            .delete(`/api/subscribers/${subscriber._id}`)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.email).to.equal(subscriber.email)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
  })

  describe('# GET /api/subscribers/summary/:addresss', function() {
    it('should get summary description by address ', function(done) {
      const id = Math.floor(Math.random() * 800000000300000076000) + 1000000000000000

      let subscriber = {
        email: `mariano.aguero+${id}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        frequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.frequency).to.equal(subscriber.frequency)
          expect(res.body.activated).to.equal(activatedTest)

          request(app)
            .get(`/api/subscribers/summary/${subscriber.address}`)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.summary).to.have.property('address')
              expect(res.body.summary).to.have.property('bondedAmount')
              expect(res.body.summary).to.have.property('delegateAddress')
              expect(res.body.summary).to.have.property('delegatedAmount')
              expect(res.body.summary).to.have.property('fees')
              expect(res.body.summary).to.have.property('lastClaimRound')
              expect(res.body.summary).to.have.property('startRound')
              expect(res.body.summary).to.have.property('status')
              expect(res.body.summary).to.have.property('withdrawRound')
              expect(res.body.summary.address).to.equal(
                '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064'
              )
              done()
            })
            .catch(done)
        })
    })
  })
})
