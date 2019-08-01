const PROTOCOL_DIVISION_BASE = 1000000
const TOKEN_DECIMALS_MULTIPLIER = 1000000000000000000
const CACHE_UPDATE_INTERVAL = 1000 * 60 * 60 * 2 // Updates every 2 hours
const TOKEN_DECIMAL_UNITS = 18
const DAILY_FREQUENCY = 'daily'
const WEEKLY_FREQUENCY = 'weekly'
const VALID_SUBSCRIPTION_FREQUENCIES = [WEEKLY_FREQUENCY, DAILY_FREQUENCY]
const TO_FIXED_VALUES_DECIMALS = 4
const LIVEPEER_DEFAULT_CONSTANTS = {
  DELEGATOR_STATUS: {
    Bonded: 'Bonded',
    Pending: 'Pending',
    Unbonded: 'Unbonded',
    Unbonding: 'Unbonding'
  },
  ROLE: { DELEGATOR: 'Delegator', TRANSCODER: 'Transcoder' }
}

module.exports = {
  PROTOCOL_DIVISION_BASE,
  TOKEN_DECIMALS_MULTIPLIER,
  TOKEN_DECIMAL_UNITS,
  CACHE_UPDATE_INTERVAL,
  VALID_SUBSCRIPTION_FREQUENCIES,
  DAILY_FREQUENCY,
  WEEKLY_FREQUENCY,
  TO_FIXED_VALUES_DECIMALS,
  LIVEPEER_DEFAULT_CONSTANTS
}
