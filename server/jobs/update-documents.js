const mongoose = require('../../config/mongoose')
const { getDelegateService } = require('../helpers/services/delegateService')
const Delegate = require('../delegate/delegate.model')

const updateDelegatesOnDb = async () => {
  const delegateService = getDelegateService()
  const delegatesFetched = await delegateService.getDelegates()
  const delegatesUpdated = []
  for (let delegateIterator of delegatesFetched) {
    let delegateOnDbFound = await Delegate.findOne({ _id: delegateIterator.id })
    if (delegateOnDbFound) {
      if (hasDelegateChangedRules(delegateOnDbFound, delegateIterator)) {
        delegateOnDbFound = {
          _id: delegateOnDbFound._id,
          ...delegateIterator
        }
        const updatedDelegate = new Delegate({ ...delegateOnDbFound })
        // Updates local delegate
        updatedDelegate.isNew = false
        delegatesUpdated.push(updatedDelegate.save())

        // TODO - Dispatch notification of rules changes
      }
    } else {
      // Saves new delegate on db
      const newDelegate = new Delegate({
        _id: delegateIterator.id,
        ...delegateIterator
      })
      delegatesUpdated.push(newDelegate.save())
    }
  }
  // Finally update the delegates
  await Promise.all(delegatesUpdated)
  process.exit(0)
}

const hasDelegateChangedRules = (oldDelegate, newDelegate) => {
  let hasChanged = false
  const { feeShare, pendingFeeShare, rewardCut, pendingRewardCut } = oldDelegate
  if (
    feeShare !== newDelegate.feeShare ||
    pendingFeeShare !== newDelegate.pendingFeeShare ||
    rewardCut !== newDelegate.rewardCut ||
    pendingRewardCut !== newDelegate.pendingRewardCut
  ) {
    hasChanged = true
  }
  return hasChanged
}

module.exports = {
  updateDelegatesOnDb
}
