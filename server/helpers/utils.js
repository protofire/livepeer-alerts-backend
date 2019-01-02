const Big = require('big.js')
const BN = require('bn.js')

const MathBN = {
  sub: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.sub(bBN).toString(10)
  },
  add: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.add(bBN).toString(10)
  },
  gt: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.gt(bBN)
  },
  gte: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.gte(bBN)
  },
  lt: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.lt(bBN)
  },
  lte: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return aBN.lte(bBN)
  },
  mul: (a, b) => {
    const aBN = new Big(a || '0')
    const bBN = new Big(b || '0')
    return aBN.mul(bBN).toString(10)
  },
  div: (a, b) => {
    const aBN = new Big(a || '0')
    const bBN = new Big(b || '0')
    try {
      return aBN.div(bBN).toString(10)
    } catch (err) {
      console.error(err)
      return 0
    }
  },
  min: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return (aBN.lt(bBN) ? a : b).toString(10)
  },
  max: (a, b) => {
    const aBN = new BN(a || '0')
    const bBN = new BN(b || '0')
    return (aBN.gt(bBN) ? a : b).toString(10)
  },
  toBig: x => {
    return new Big(x)
  }
}

module.exports = {
  MathBN
}
