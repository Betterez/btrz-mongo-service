const assert = require("node:assert/strict");
const {describe, it, beforeEach, afterEach, mock} = require("node:test");

const {MongoDataService} = require("../index");
const {SimpleDao} = require("btrz-simple-dao");

class TestModel {
  static factory(data) {
    const model = new TestModel();
    model.something = data.something;
    return model;
  }

  static update(model, dto) {
    model.something = dto.something;
    model.updatedAt = "now";
    return model;
  }
}

function assertInvalidIdError(err) {
  assert.strictEqual(err.type, "INVALID");
  assert.strictEqual(err.code, "INVALID_TESTMODEL_ID");
  assert.strictEqual(err.message, "TestModel ID is invalid.");
  return true;
}

describe("Mongo Data Service", () => {
  let dao = null;
  let config = null;
  let service = null;
  let id = null;

  beforeEach(() => {
    dao = {
      for: mock.fn(function () { return this; }),
      find: mock.fn(function () { return this; }),
      findAggregate: function () { return this; },
      findById: mock.fn(async () => undefined),
      count: mock.fn(async () => 0),
      save: mock.fn(async () => undefined),
      removeById: mock.fn(async () => undefined),
      toArray: mock.fn(async () => undefined),
      objectId: mock.fn((_id) => SimpleDao.objectId(_id))
    };
    config = {};
    service = new MongoDataService(dao, config);
    id = SimpleDao.objectId().toString();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it("should be called MongoDataService", () => {
    assert.strictEqual(MongoDataService.name, "MongoDataService");
  });

  describe("constructor", () => {
    function sut() {
      return new MongoDataService(dao, config);
    }

    it("should fail if dao is not in dependencies", () => {
      dao = null;
      assert.throws(sut, /dao is mandatory for MongoDataService/);
    });

    it("should fail if dao in dependencies is not a valid dao (has for method)", () => {
      dao.for = null;
      assert.throws(sut, /dao is mandatory for MongoDataService/);
    });

    it("should fail if config is not in dependencies", () => {
      config = null;
      assert.throws(sut, /config is mandatory for MongoDataService/);
    });

    it("should create an instance of MongoDataService", () => {
      assert.ok(sut() instanceof MongoDataService);
    });
  });

  describe("#getById()", () => {
    function sut() {
      return service.getById(TestModel, id);
    }

    let dbDocument = null;
    beforeEach(() => {
      dbDocument = {something: "important"};
      dao.findById = mock.fn(async () => dbDocument);
    });

    it("should fail if ID is missing", () => {
      id = null;
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      assert.strictEqual(dao.for.mock.callCount(), 1);
      assert.deepStrictEqual(dao.for.mock.calls[0].arguments[0], TestModel);
      assert.strictEqual(dao.findById.mock.callCount(), 1);
      assert.strictEqual(dao.findById.mock.calls[0].arguments[0], id);
    });

    it("should return the document found from the database", async () => {
      const found = await sut();
      assert.deepStrictEqual(found, dbDocument);
    });
  });

  describe("#delete()", () => {
    function sut() {
      return service.delete(TestModel, id);
    }

    it("should fail if ID is missing", () => {
      id = null;
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      assert.strictEqual(dao.for.mock.callCount(), 1);
      assert.deepStrictEqual(dao.for.mock.calls[0].arguments[0], TestModel);
      assert.strictEqual(dao.removeById.mock.callCount(), 1);
      assert.strictEqual(dao.removeById.mock.calls[0].arguments[0], id);
    });
  });

  describe("#getExisting()", () => {
    function sut() {
      return service.getExisting(TestModel, id);
    }

    let dbDocument = null;
    beforeEach(() => {
      dbDocument = {something: "important"};
      dao.findById = mock.fn(() => Promise.resolve(dbDocument));
    });

    it("should fail if ID is missing", () => {
      id = null;
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      assert.strictEqual(dao.for.mock.callCount(), 1);
      assert.deepStrictEqual(dao.for.mock.calls[0].arguments[0], TestModel);
      assert.strictEqual(dao.findById.mock.callCount(), 1);
      assert.strictEqual(dao.findById.mock.calls[0].arguments[0], id);
    });

    it("should return the document found from the database", async () => {
      const found = await sut();
      assert.deepStrictEqual(found, dbDocument);
    });

    it("should fail if document was not found", () => {
      dbDocument = null;
      return assert.rejects(sut, (err) => {
        assert.strictEqual(err.type, "NOT_FOUND");
        assert.strictEqual(err.code, "NOT_FOUND");
        assert.strictEqual(err.message, "TestModel not found");
        return true;
      });
    });
  });

  describe("#update()", () => {
    function sut() {
      return service.update(TestModel, id, data);
    }

    let existingDocument = null;
    let data = null;
    beforeEach(() => {
      existingDocument = {something: "important"};
      data = {something: "new"};
      dao.findById = mock.fn(() => Promise.resolve(existingDocument));
    });

    it("should fail if ID is missing", () => {
      id = null;
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";
      return assert.rejects(sut, assertInvalidIdError);
    });

    it("should fail if update data is missing", () => {
      data = null;
      return assert.rejects(sut, (err) => {
        assert.strictEqual(err.message, "The data is required for update");
        return true;
      });
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      assert.strictEqual(dao.for.mock.callCount(), 1);
      assert.deepStrictEqual(dao.for.mock.calls[0].arguments[0], TestModel);
      assert.strictEqual(dao.findById.mock.callCount(), 1);
      assert.strictEqual(dao.findById.mock.calls[0].arguments[0], id);
    });

    it("should fail if document was not found", () => {
      existingDocument = null;
      return assert.rejects(sut, (err) => {
        assert.strictEqual(err.type, "NOT_FOUND");
        assert.strictEqual(err.code, "NOT_FOUND");
        assert.strictEqual(err.message, "TestModel not found");
        return true;
      });
    });

    it("should update and save the document found", async () => {
      await sut();
      assert.strictEqual(dao.save.mock.callCount(), 1);
      assert.deepStrictEqual(dao.save.mock.calls[0].arguments[0], {
        something: "new",
        updatedAt: "now"
      });
    });
  });

  describe("#getAggregateCount()", () => {
    function sut() {
      return service.getAggregateCount(query);
    }

    class ResultsCursorMock {
      constructor () {
        this.counter = 0;
      }

      on(event, handler) {
        if (event === "data") {
          this.onDataHandler = handler;
        }
        this.counter++;
        if (this.counter >= 3) {
         this.doIt();
        }
        return this;
      }

      doIt() {
        this.onDataHandler({"total_documents": 5});
      }
    }

    let query = null;
    let cursor = null;
    beforeEach(() => {
      cursor = new ResultsCursorMock();
      dao.toCursor = mock.fn(() => Promise.resolve(cursor));
      query = [
        {$match: {accountId: "account-id"}},
        { $group: { _id: null, "total_documents": { $sum: 1 } } }
      ];
    });

    it("should return a promise with an integer", () => {
      return assert.doesNotReject(async () => {
        const count = await sut();
        assert.strictEqual(count, 5);
      });
    });

    it("should return a rejected promise if cursor fails", () => {
      cursor.on = function (event, handler) {
        if (event === "error") {
          handler(new Error("mongo cursor error"));
        }
        return this;
      };
      return assert.rejects(sut, (err) => {
        assert.strictEqual(err.message, "mongo cursor error");
        return true;
      });
    });

    it("should resolve to zero if cursor ends with no results", () => {
      cursor.on = function (event, handler) {
        if (event === "end") {
          handler();
        }
        return this;
      };
      return assert.doesNotReject(async () => {
        const count = await sut();
        assert.strictEqual(count, 0);
      });
    });
  });

  describe("#getCountedList", () => {
    let model = null;
    let accountId = null;
    let filters = null;
    let queryBuilder = null;
    let listResult = null;
    let countResult = null;

    class QueryBuilder {
      build(_accountId, _filters) {
        return {accountId};
      }

      static buildQueryOptions(_filters, _pageSize) {
        return {};
      }
    }

    beforeEach(() => {
      accountId = "123123123";
      filters = {},
      queryBuilder = new QueryBuilder();
      model = new TestModel();
      listResult = [{_id: "1"}, {_id: "2"}];
      countResult = listResult.length;
      dao.toArray = mock.fn(() => Promise.resolve(listResult));
      dao.count = mock.fn(() => Promise.resolve(countResult));
    });

    function sut() {
      return service.getCountedList(model, accountId, filters, queryBuilder);
    }

    it("should return an object with a list and count", () => {
      return sut()
        .then((result) => {
          assert.deepStrictEqual(result, {
            list: listResult,
            count: countResult
          });
        });
    })

    it("should call count and find with same query and options", () => {
      return sut()
        .then(() => {
          assert.strictEqual(dao.find.mock.callCount(), 1);
          assert.deepStrictEqual(dao.find.mock.calls[0].arguments, [{accountId}, {}]);
          assert.strictEqual(dao.count.mock.callCount(), 1);
          assert.deepStrictEqual(dao.count.mock.calls[0].arguments, [{accountId}]);
        });
    });
  });
});
