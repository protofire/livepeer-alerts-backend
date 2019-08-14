# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0](https://github.com/protofire/livepeer-alerts-backend/compare/v1.2.2...v2.0.0) - (2019-08-06)
### Add
- My delegate rewards endpoint [#113](https://github.com/protofire/livepeer-alerts-backend/issues/113)
- My delegate box endpoint support  [#115](https://github.com/protofire/livepeer-alerts-backend/issues/115)
- Add support to multiple frequencies on the email subscriptions [#78](https://github.com/protofire/livepeer-alerts-backend/issues/78)
- Endpoint for supporting update of the email frequency [#91](https://github.com/protofire/livepeer-alerts-backend/issues/91)
- Send notification to subscribers according to their's frequency selected [#98](https://github.com/protofire/livepeer-alerts-backend/issues/98)
- Be notified when the PENDING > BONDED period has ended [#75](https://github.com/protofire/livepeer-alerts-backend/issues/75)
- Be notified when the UNBONDING > UNBONDED period has ended [#74](https://github.com/protofire/livepeer-alerts-backend/issues/74)
- Calculate top delegates based on their ROI values [#58](https://github.com/protofire/livepeer-alerts-backend/issues/58) 
- Add new weekly mail subscription including summary [#85](https://github.com/protofire/livepeer-alerts-backend/issues/85)
- Generate weekly summary [#101](https://github.com/protofire/livepeer-alerts-backend/issues/101)
- Connect sendgrid weekly template Email with backend [#102](https://github.com/protofire/livepeer-alerts-backend/issues/102)
- Design weekly email subscription with a summary [#95](https://github.com/protofire/livepeer-alerts-backend/issues/95)
- Apply the same design of weekly email to the rest emails [#105](https://github.com/protofire/livepeer-alerts-backend/issues/105)
- Save rewards of delegates and delegators from last round [#48](https://github.com/protofire/livepeer-alerts-backend/issues/48)  
- Increase the number of decimals of earning value [#71](https://github.com/protofire/livepeer-alerts-backend/issues/71) 
- Notificate Transcoder rules changes to Delegator [#49](https://github.com/protofire/livepeer-alerts-backend/issues/49)
- Improve Changelog description [#79](https://github.com/protofire/livepeer-alerts-backend/issues/79)
- Improve logging for debugging [#72](https://github.com/protofire/livepeer-alerts-backend/issues/72) 
- Add graphql [#37](https://github.com/protofire/livepeer-alerts-backend/issues/37)
- Sdk graphql refactoring [#42](https://github.com/protofire/livepeer-alerts-backend/issues/42)

### Fixes
- Earn values of emails are incorrect [#44](https://github.com/protofire/livepeer-alerts-backend/issues/44)
- Telegram bot do not support fallback messages [#99](https://github.com/protofire/livepeer-alerts-backend/issues/99)
- System is sending an email every hour [#64](https://github.com/protofire/livepeer-alerts-backend/issues/64)
- Livepeer.tools page shows wrong info about transcoder reward call [#65](https://github.com/protofire/livepeer-alerts-backend/issues/65) 
- Telegram bot is not always sending notifications [#70](https://github.com/protofire/livepeer-alerts-backend/issues/70) 
- Duplicated pools [#111](https://github.com/protofire/livepeer-alerts-backend/issues/111)
- Delegators not stored in delegates [#109](https://github.com/protofire/livepeer-alerts-backend/issues/109)
- Circular dependencies [#108](https://github.com/protofire/livepeer-alerts-backend/issues/108) 

## [1.2.2](https://github.com/protofire/livepeer-alerts-backend/compare/v1.2.1...v1.2.2) - (2019-07-16)
### Fixes
- Change displayed decimals of earnings to 6 [#96](https://github.com/protofire/livepeer-alerts-backend/pull/94)

## [1.2.1](https://github.com/protofire/livepeer-alerts-backend/compare/v1.2.0...v1.2.1) (2019-07-11)
### Fixes
- Broken unsubscribe link in notifications [#76](https://github.com/protofire/livepeer-alerts-backend/pull/76)

## [1.2.0](https://github.com/protofire/livepeer-alerts-backend/compare/v1.2.0...v1.1.2) (2019-07-08)
### Add
- Send a notification when my bonded-delegate changes his rules [#68](https://github.com/protofire/livepeer-alerts-backend/pull/68), Closes [#55](https://github.com/protofire/livepeer-alerts-backend/issues/55) [#49](https://github.com/protofire/livepeer-alerts-backend/issues/49)

### Fixes
- Refactors both sendDelegateTelegram() and getBodyBySubscriber() functions [#63](https://github.com/protofire/livepeer-alerts-backend/pull/63)
- Fixes top delegates by ROI function. [#67](https://github.com/protofire/livepeer-alerts-backend/pull/67)

## [1.1.2](https://github.com/protofire/livepeer-alerts-backend/compare/v1.1.2...v1.1.1) (2019-07-04)
### Fixes
- App is sending an email every hour, added verification flag, updated SDK livepeer package [#66](https://github.com/protofire/livepeer-alerts-backend/pull/66), Closes [#64](https://github.com/protofire/livepeer-alerts-backend/issues/64)

## [1.1.1](https://github.com/protofire/livepeer-alerts-backend/compare/v1.1.1...v1.1.0) (2019-07-04)
### Fixes
-  The summary functions returns an invalid delegateCalledReward value [#62](https://github.com/protofire/livepeer-alerts-backend/pull/62), Closes [#65](https://github.com/protofire/livepeer-alerts-backend/issues/65)

## [1.1.0](eer-alerts-backend/compare/v1.1.0...v1.0.0) (2019-06-28)
### Add
- Adds more tests [#41](https://github.com/protofire/livepeer-alerts-backend/pull/41)
- Graphql queries [#37](https://github.com/protofire/livepeer-alerts-backend/pull/37)
- Services based on SDK or Graphql [#42](https://github.com/protofire/livepeer-alerts-backend/pull/42)
- Apollo client [#37](https://github.com/protofire/livepeer-alerts-backend/pull/37)
- Improvements in workers [#53](https://github.com/protofire/livepeer-alerts-backend/pull/53)

### Fixes
- Earnings notification [#40](https://github.com/protofire/livepeer-alerts-backend/pull/40) [#43](https://github.com/protofire/livepeer-alerts-backend/pull/43) [#50](https://github.com/protofire/livepeer-alerts-backend/pull/50)
- Fix security issues [#36](https://github.com/protofire/livepeer-alerts-backend/pull/36)

## [1.0.0](https://github.com/protofire/livepeer-alerts-backend/compare/666886a084841f6587653e419bb174d0bb87e208...v1.0.0) (2018-12-17)
### Added
- Initial commit
