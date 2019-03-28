function createError(type, code, message) {
  const error = new Error(message);
  error.type = type;
  error.code = code;
  return error;
}

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
   * @throws {Error} When the ID is missing or invalid, throws Error with type="INVALID"
   */
  validateObjectId(Model, id) {
    const modelName = Model.name;
    const uppercaseName = modelName.toUpperCase();
    const invalidIdError = createError("INVALID", `INVALID_${uppercaseName}_ID`, `${modelName} ID is invalid.`);
    if (!id) {
      throw invalidIdError;
    }
    try {
      this.dao.objectId(id);
    } catch (e) {
      throw invalidIdError;
    }
  }

  /**
   * Search a Model by ID
   * @param {class} Model - Model class, will determine collection name to search the model by ID
   * @param {string} id - ID of the Model to search
   * @returns {Promise<Model>} A promise to be resolved with the Model found
   * @throws {Error} When the ID is missing or invalid, throws Error with type="INVALID"
   */
  getById(Model, id) {
    return Promise.resolve().then(() => {
      this.validateObjectId(Model, id);
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
      this.validateObjectId(Model, id);
      return this.dao.for(Model).removeById(id);
    });
  }

  /**
   * Search an existing Model by ID
   * @param {class} Model - Model class, will determine collection name to search the model by ID
   * @param {string} id - ID of the Model to search
   * @returns {Promise<Model>} A promise to be resolved with the Model found
   * @throws {Error} When the ID is missing or invalid, throws Error with type="INVALID"
   * @throws {Error} When the Model was not found, throws Error with type="NOT_FOUND"
   */
  getExisting(Model, id) {
    return this.getById(Model, id)
      .then((found) => {
        if (!found) {
          throw createError("NOT_FOUND", "NOT_FOUND", `${Model.name} not found`);
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
   * @throws {Error} When the ID is missing or invalid, throws Error with type="INVALID"
   * @throws {Error} When the update data is missing
   * @throws {Error} When the Model was not found, throws Error with type="NOT_FOUND"
   */
  update(Model, id, data) {
    return Promise.resolve().then(() => {
      this.validateObjectId(Model, id);
      if (!data) {
        throw new Error("The data is required for update");
      }
      return this.getById(Model, id);
    })
    .then((item) => {
      if (!item) {
        throw createError("NOT_FOUND", "NOT_FOUND", `${Model.name} not found`);
      }
      return this.dao.save(Model.update(item, data));
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
   * @param {QueryBuilder} queryBuilder - An instance of QueryBuilder (btrz-query-builder) created with a CustomQueryBuilder for this Model
   * @returns {Promise<CountedList>} A promise that resolves to an object with properties 'list' and 'count'
   */
  getCountedList(Model, accountId, filters, queryBuilder) {
    const query = queryBuilder.build(accountId, filters);
    const queryOptions = queryBuilder.constructor.buildQueryOptions(filters, this.config.pageSize);
    return Promise.all([
      this.dao.for(Model).find(query, queryOptions)
        .toArray(),
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
            .on("data", function (datum) { // eslint-disable-line func-names, prefer-arrow-callback
              resolve(datum["total_documents"]);
              resolved = true;
            })
            .on("end", function () { // eslint-disable-line func-names, prefer-arrow-callback
              if (!resolved) {
                resolve(0);
              }
            })
            .on("error", function (err) { // eslint-disable-line func-names, prefer-arrow-callback
              reject(err);
            });
        });
    });
  }
}

module.exports = MongoDataService;
