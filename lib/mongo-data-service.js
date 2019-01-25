"use strict";

const {ValidationError} = require("btrz-service-req-res");
const {SimpleDao} = require("btrz-simple-dao");
const {QueryBuilder} = require("btrz-query-builder").mongo;

class MongoDataService {
  constructor(dao, config) {
    if (!dao || !dao.for) {
      throw new Error("dao is mandatory for MongoDataService");
    }
    if (!config) {
      throw new Error("config is mandatory for MongoDataService");
    }
    this.dao = dao;
    this.config = config;
  }

  static validateObjectId(Model, id) {
    const modelName = Model.name;
    if (!id) {
      throw new ValidationError("WRONG_DATA", `${modelName} ID is missing.`);
    }
    try {
      SimpleDao.objectId(id);
    } catch (e) {
      const uppercaseName = modelName.toUpperCase();
      throw new ValidationError(`INVALID_${uppercaseName}_ID`, `${modelName} ID is invalid.`);
    }
  }

  getById(Model, id) {
    return Promise.resolve().then(() => {
      MongoDataService.validateObjectId(Model, id);
      return this.dao.for(Model).findById(id);
    });
  }

  delete(Model, id) {
    return Promise.resolve().then(() => {
      MongoDataService.validateObjectId(Model, id);
      return this.dao.for(Model).removeById(id);
    });
  }

  getExisting(Model, id) {
    return this.getById(Model, id)
      .then((found) => {
        if (!found) {
          throw new ValidationError("NOT_FOUND", `${Model.name} not found`, 404);
        }
        return found;
      });
  }

  update(Model, id, data) {
    return Promise.resolve().then(() => {
      MongoDataService.validateObjectId(Model, id);
      if (!data) {
        throw new Error("The data is required for update");
      }
      return this.getById(Model, id);
    })
    .then((item) => {
      if (item) {
        return this.dao.save(Model.update(item, data));
      } else {
        throw new ValidationError("NOT_FOUND", `${Model.name} not found`, 404);
      }
    });
  }

  getCountedList(Model, accountId, filters, CustomQueryBuilder) {
    const queryBuilder = new QueryBuilder(CustomQueryBuilder),
      query = queryBuilder.build(accountId, filters),
      queryOptions = QueryBuilder.buildQueryOptions(filters, this.config.pageSize);
    return Promise.all([
        this.dao.for(Model).find(query, queryOptions).toArray(),
        this.dao.for(Model).count(query)
      ])
      .then(([list, count]) => {
        return {list, count};
      });
  }

  getAggregateCount(Model, query) {
    return new Promise((resolve, reject) => {
      this.dao
        .for(Model)
        .findAggregate(query)
        .toCursor()
        .then((cursor) => {
          let resolved = false;
          cursor
            .on("data", function (datum) {
              resolve(datum["total_documents"]);
              resolved = true;
            })
            .on("end", function () {
              if (!resolved) {
                resolve(0);
              }
            })
            .on("error", function (err) {
              reject(err);
            });
        });
    });
  }
}

module.exports = MongoDataService;
