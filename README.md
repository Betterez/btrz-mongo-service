# btrz-mongo-service

## What

This is a Service to access Mongo in a way that is useful for Betterez Node APIs.

This is a wrapper around [btrz-simple-dao](https://github.com/Betterez/btrz-simple-dao), providing some extra features like Mongo ID validation, Betterez Node API compatible error throwing with [ValidationError](https://github.com/Betterez/btrz-service-req-res/blob/master/lib/validation-error.js), etc.

## Why

Several Node APIs were using a mongo-data-service for each Model (btrz-inventory-api for example).

This was causing many duplicated methods between data-services and also many wrappers not needed, like delete just calling simpleDao.for(Model).removeById.

The solution is to have this single mongo data-access service, that implements several methods in a Model-independent way, and removes some unnecessary wrapping.

Many APIs were checking for valid Mongo IDs in every handler, via SimpleDao or via JOI. ALso many were re-implementing validation for "existing" models not found.

This Service provides Mongo ID validation and "existing" checks, integrated in the right methods.

## How to use

```
const {MongoDataService} = require("btrz-mongo-service");
const mongoDataService = new MongoDataService(dao, config);
```

Both dao and config are mandatory. Config is needed for pageSize configuration in pagination (getCountedList).

The Model is just a method parameter (always the first one).

## Available methods

Each available method is documented with JSDoc in [mongo-data-service.js](https://github.com/Betterez/btrz-mongo-service/blob/master/lib/mongo-data-service.js).

You might notice that some methods (getCount, save, delete) that are available in btrz-inventory-api data-services are not implemented here. The reason is they were just a SimpleDao call, there was nothing extra.
