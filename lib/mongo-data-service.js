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

  /**
   * Validate a string is not empty and is a valid Mongo ObjectID.
   * @param {class} Model - A model class, the name will be used in errors.
   * @param {string} id - An ID.
   * @throws {ValidationError} When the ID is missing or invalid
   */
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

  /**
   * Search a Model by ID
   * @param {class} Model - Model class, will determine collection name to search the model by ID
   * @param {string} id - ID of the Model to search
   * @returns {Promise<Model>} A promise to be resolved with the Model found
   * @throws {ValidationError} When the ID is missing or invalid
   */
  getById(Model, id) {
    return Promise.resolve().then(() => {
      MongoDataService.validateObjectId(Model, id);
      return this.dao.for(Model).findById(id);
    });
  }

  /**
   * Delete a Model by ID
   * @param {class} Model - Model class, will determine collection name to delete the model by ID
   * @param {string} id - ID of the Model to delete
   * @returns {Promise} A promise to be resolved with the delete result from Mongo
   */
  delete(Model, id) {
    return Promise.resolve().then(() => {
      MongoDataService.validateObjectId(Model, id);
      return this.dao.for(Model).removeById(id);
    });
  }

  /**
   * Search an existing Model by ID
   * @param {class} Model - Model class, will determine collection name to search the model by ID
   * @param {string} id - ID of the Model to search
   * @returns {Promise<Model>} A promise to be resolved with the Model found
   * @throws {ValidationError} When the ID is missing or invalid
   * @throws {ValidationError} When the Model was not found
   */
  getExisting(Model, id) {
    return this.getById(Model, id)
      .then((found) => {
        if (!found) {
          throw new ValidationError("NOT_FOUND", `${Model.name} not found`, 404);
        }
        return found;
      });
  }

  /**
   * Update an existing Model by ID
   * @param {class} Model - Model class, will determine collection name to search the model by ID
   * @param {string} id - ID of the Model to search
   * @param {Object} data - The new data to update the Model found
   * @returns {Promise<Model>} A promise to be resolved with the Model updated
   * @throws {ValidationError} When the ID is missing or invalid
   * @throws {Error} When the update data is missing
   * @throws {ValidationError} When the Model was not found
   */
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

  /**
   * Object containing a page and the full results count
   * @typedef {Object} CountedList
   * @property {Array<Model>} list - A page of the paginated results.
   * @property {number} count - The full count of existing results.
   */
  /**
   * Get a page of results and the total count
   * @param {class} Model - Model class, will determine collection to search in
   * @param {string} accountId - ID of the Account to search for
   * @param {Object} filters - The filters to apply when searching
   * @param {CustomQueryBuilder} CustomQueryBuilder - A specific QueryBuilder for this Model, must implement build() and buildQueryOptions()
   * @returns {Promise<CountedList>} A promise that resolves to an object with properties 'list' and 'count'
   */
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

  /**
   * Get the results count of an aggregate query
   * @param {class} Model - Model class, will determine collection to search in
   * @param {Object} query - The aggregate query to search with
   * @returns {Promise<number>} A promise to be resolved with the aggregate count
   * @throws {Error} When the aggregate query fails
   */
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
