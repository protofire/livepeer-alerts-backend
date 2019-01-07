## Livepeer notifications API
The following section details the Livepeer notifications API's function signatures and typedefs.

#### Table of Contents

- [Postman File](https://github.com/protofire/livepeer-alerts-backend/blob/master/utils/livepeer-alerts-backend.postman_collection.json)
- List of functions
    - [getSubscribers](#getSubscribers)
    - [getSubscribers/id](#getSubscribersId)
    - [getSubscribers/address](#getSubscribersAddress)
    - [getSubscribers/summary](#getSubscribersSummary)
    - [getEarnings](#getEarnings)
    - [createSubscriber](#createSubscriber)
    - [updateSubscriber](#updateSubscriber)
    - [deleteSubscriber](#deleteSubscriber)

#### getSubscribers

Gets all the subscribers 

**Parameters**

- `none`

**Examples**

```
subscribers = await axios.get('/api/subscribers/')
```

Returns
```
[
    {
        "activated": 1,
        "_id": "5c333bcc2e94f60017a535",
        "email": "test@test.com",
        "address": "0x9D45eecE52F0B8AE0238Ddaw342Da9928f4b9C4F",
        "frequency": "weekly",
        "activatedCode": "650949620395975200000",
        "createdAt": "2019-01-07T11:45:16.920Z",
        "__v": 0
    },
    {
        "activated": 1,
        "_id": "5c2e23a788a94c0017291dd8",
        "email": "test2@test.com",
        "address": "0x9D45EECe52gvasAe0238dCb0a42da9928f4b9c4f",
        "frequency": "daily",
        "activatedCode": "633789364971987800000",
        "createdAt": "2019-01-03T15:00:55.835Z",
        "__v": 0
    },
]
```

#### getSubscribersId

Get a subscriber by subscriberId if the user is subscribed

**Parameters**

- `id`

**Examples**

``` 
subscriber = await axios.get('/api/subscribers/5c333bcc2e94f60017a40925/')
```

```
Returns
{
    "activated": 1,
    "_id": "5c333bcc2e94f60017a40925",
    "email": "test1@altoros.com",
    "address": "0x9D45eecE52F0B8AE0238DCB0A42Da9918f4b9D4F",
    "frequency": "weekly",
    "activatedCode": "650949620395975200000",
    "createdAt": "2019-01-07T11:45:16.920Z",
    "__v": 0
}

```

#### getSubscribersAddress

Get a subscriber by subscriberAddress if the user is subscribed

**Parameters**

- `address`

**Examples**

```
subscriber = await axios.get('/api/subscribers/0x9D45eecE52F0B8AE0238DCB0A42Da9918f4b9D4F/')
```

```
Returns
{
    "activated": 1,
    "_id": "5c333bcc2e94f60017a40925",
    "email": "test1@altoros.com",
    "address": "0x9D45eecE52F0B8AE0238DCB0A42Da9928f4b9C4F",
    "frequency": "weekly",
    "activatedCode": "650949620395975200000",
    "createdAt": "2019-01-07T11:45:16.920Z",
    "__v": 0
}

```

#### getSubscribersSummary

Gets the subscriber summary by subscriberAddress

**Parameters**

- `address`

**Examples**

```
subscriberSummary = await axios.get('/api/subscribers/summary/0x9D45eecE52F0B8AE0238DCB0A42Da9918f4b9D4F/')
```

```
Returns
{
    "summary": {
        "address": "0x9D45EECe52F0b8Ae0238dCb0a42da9928f4b9c4f",
        "bondedAmount": "0",
        "delegateAddress": "",
        "delegatedAmount": "0",
        "fees": "0",
        "lastClaimRound": "0",
        "startRound": "0",
        "status": "Unbonding",
        "withdrawRound": "0",
        "totalStake": "0"
    },
    "balance": "0"
}

```

#### getEarnings

Gets earnings for each subscriber

**Parameters**

- `none`

**Examples**

```
earnings = await axios.get('/api/earnings')
```

```
Returns
[
    {
        "earning": 0,
        "round": 1219,
        "_id": "5c333bcd2e94f60017a40926",
        "email": "test1@altoros.com",
        "address": "0x9D45eecE52F0B8AE0238DCB0A42Da9928f4b9C4F",
        "createdAt": "2019-01-07T11:45:17.445Z",
        "__v": 0
    },
    {
        "earning": 0,
        "round": 1218,
        "_id": "5c3209fb7ada700017c9f68b",
        "email": "test@altoros.com",
        "address": "0x9D45eecE52F0B8AE0238DCB0A42Da9928f4b9C4F",
        "createdAt": "2019-01-06T14:00:27.319Z",
        "__v": 0
    }
]

```

#### createSubscriber

Creates a new subscriber

**Parameters**

- `none`

**Examples**

```
subscriberData = {
  email: "test@test.com",
  address: "0x6230A918266d27Ce0aBD576b32B6a0516dbA39d3",
  frequency: "weekly"
}
subscriber = await axios.post('/api/subscribers', subscriberData)
```

```
Returns
{
    "activated": 1,
    "_id": "5c33810995cf8800172a2c6c",
    "email": "test@altoros.com",
    "address": "0x6230A918266d27Ce0aBD576b32B6a0516dbA39d3",
    "frequency": "weekly",
    "activatedCode": "532323480334990440000",
    "createdAt": "2019-01-07T16:40:41.381Z",
    "__v": 0
}

```

#### updateSubscriber

Updates a new subscriber by subscriberId

**Parameters**

- `subscriberId`

**Examples**

```
subscriberData = {
    activated: 0,
    _id: "5c1cf5c0bc851f164a28da0c",
    email: "test@test.com",
    address: "asdas",
    frequency: "weekly",
    activatedCode: "513866267420361360000",
    createdAt: "2018-12-21T14:16:32.501Z",
    __v: 0
 }
subscriber = await axios.put('/api/subscribers/5c333bcc2e94f60017a40925', subscriberData)
```

```
Returns
{
    "activated": 0,
    "_id": "5c333bcc2e94f60017a40925",
    "email": "test@test.com",
    "address": "asdas",
    "frequency": "weekly",
    "activatedCode": "650949620395975200000",
    "createdAt": "2019-01-07T11:45:16.920Z",
    "__v": 0
}

```

#### deleteSubscriber

Deletes a new subscriber by subscriberId

**Parameters**

- `subscriberId`

**Examples**

```
subscriber = await axios.delete('/api/subscribers/5c1cf5c0bc851f164a28da0c')
```

```
Returns
{
    "activated": 0,
    "_id": "5c333bcc2e94f60017a40925",
    "email": "test@test.com",
    "address": "asdas",
    "frequency": "weekly",
    "activatedCode": "650949620395975200000",
    "createdAt": "2019-01-07T11:45:16.920Z",
    "__v": 0
}

```