const mongoose = require('mongoose')
const request = require('supertest')
const httpStatus = require('http-status')
const chai = require('chai') // eslint-disable-line import/newline-after-import
const expect = chai.expect
const app = require('../index')

chai.config.includeStack = true

const getRandomId = () => {
  return (
    '_' +
    Math.random()
      .toString(36)
      .substr(2, 9)
  )
}

const TIMEOUT_THRESHOLD = 60000 // 1 minute

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
  let activatedTest = 1
  describe('# POST /api/subscribers', () => {
    let subscriber = {
      email: `mariano.aguero+${getRandomId()}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      emailFrequency: 'weekly'
    }
    const emailToUpdate = `mariano.aguero+${getRandomId()}@altoros.com`

    it('should create a new subscriber', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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
          emailFrequency: 'weekly'
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
          emailFrequency: 'test'
        })
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.message).to.equal('"emailFrequency" must be one of [weekly, daily]')
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
            '"email" is required and "address" is required and "emailFrequency" is required'
          )
          done()
        })
        .catch(done)
    })
  })

  describe('# POST /api/subscribers/activate', () => {
    let subscriberToActivate1 = {
      email: `mariano.aguero+${getRandomId()}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      emailFrequency: 'weekly'
    }
    let subscriberToActivate2 = {
      email: `mariano.aguero+${getRandomId()}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      emailFrequency: 'weekly'
    }

    it('should create a new subscriber to activate', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriberToActivate1)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriberToActivate1.email)
          expect(res.body.address).to.equal(subscriberToActivate1.address)
          expect(res.body.emailFrequency).to.equal(subscriberToActivate1.emailFrequency)
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
          expect(res.body.emailFrequency).to.equal(subscriberToActivate2.emailFrequency)
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
    let subscriber = {
      email: `mariano.aguero+${getRandomId()}@altoros.com`,
      address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
      emailFrequency: 'weekly'
    }

    it('should get subscriber details', done => {
      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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

  describe('# PUT /api/subscribers/:subscriberId I', () => {
    it('should update subscriber email details', done => {
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }
      let emailToUpdate = `mariano.aguero+${getRandomId()}@altoros.com`

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update email
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send({
              email: emailToUpdate,
              address: subscriber.address,
              emailFrequency: subscriber.emailFrequency
            })
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
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }
      let emailToUpdate = `mariano.aguero`

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }
      let emailToUpdate = ``

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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
  })

  describe('# PUT /api/subscribers/:subscriberId II', () => {
    it('should update subscriber with wrong address and get an error', done => {
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }
      let addressToUpdate = 111

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }
      let addressToUpdate = ``

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update address
          subscriber.emailFrequency = 'daily'
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.emailFrequency).to.equal('daily')
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber with wrong frequency and get an error', done => {
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }
      let frequencyToUpdate = 'asdas'

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update address
          subscriber.emailFrequency = frequencyToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal('"emailFrequency" must be one of [weekly, daily]')
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('should update subscriber with empty frequency and get an error', done => {
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }

      let frequencyToUpdate = ``

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
          expect(res.body.activated).to.equal(activatedTest)
          subscriber = res.body

          // Update frequency
          subscriber.emailFrequency = frequencyToUpdate
          request(app)
            .put(`/api/subscribers/${subscriber._id}`)
            .send(subscriber)
            .expect(httpStatus.BAD_REQUEST)
            .then(res => {
              expect(res.body.message).to.equal(
                '"emailFrequency" is not allowed to be empty. "emailFrequency" must be one of [weekly, daily]'
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
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }
      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
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
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
          expect(res.body.activated).to.equal(activatedTest)

          request(app)
            .get(`/api/subscribers/summary/${res.body.address}`)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body).to.have.property('role')
              expect(res.body).to.have.property('balance')
              expect(res.body).to.have.property('delegator')
              expect(res.body.delegator).to.have.property('address')
              expect(res.body.delegator).to.have.property('allowance')
              expect(res.body.delegator).to.have.property('bondedAmount')
              expect(res.body.delegator).to.have.property('delegateAddress')
              expect(res.body.delegator).to.have.property('delegatedAmount')
              expect(res.body.delegator).to.have.property('fees')
              expect(res.body.delegator).to.have.property('lastClaimRound')
              expect(res.body.delegator).to.have.property('pendingFees')
              expect(res.body.delegator).to.have.property('pendingStake')
              expect(res.body.delegator).to.have.property('startRound')
              expect(res.body.delegator).to.have.property('status')
              expect(res.body.delegator).to.have.property('withdrawRound')
              expect(res.body.delegator).to.have.property('withdrawAmount')
              expect(res.body.delegator).to.have.property('totalStake')
              expect(res.body.delegator).to.have.property('delegateCalledReward')
              expect(res.body.delegator).to.have.property('totalStakeInLPT')
              expect(res.body.delegator).to.have.property('bondedAmountInLPT')
              expect(res.body.delegator).to.have.property('pendingRewardCutInPercentage')
              expect(res.body.delegator).to.have.property('rewardCutInPercentage')
              expect(res.body.delegator.address).to.equal(
                '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064'
              )
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
  })

  describe('# GET /api/subscribers/address/:addresss', () => {
    it('should get subscribers data by address ', done => {
      let subscriber = {
        email: `mariano.aguero+${getRandomId()}@altoros.com`,
        address: '0x18AD183A875e5A42a60Eb5D3a9D6657C3493d064',
        emailFrequency: 'weekly'
      }

      request(app)
        .post('/api/subscribers')
        .send(subscriber)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.email).to.equal(subscriber.email)
          expect(res.body.address).to.equal(subscriber.address)
          expect(res.body.emailFrequency).to.equal(subscriber.emailFrequency)
          expect(res.body.activated).to.equal(activatedTest)

          request(app)
            .get(`/api/subscribers/address/${subscriber.address}`)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.address).to.equal(subscriber.address)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
  })
})
