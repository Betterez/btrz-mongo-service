"use strict";

describe("Mongo Data Service", () => {
  const sinon = require("sinon");
  const chai = require("chai");
  const chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  const {expect} = chai;

  const {MongoDataService} = require("../index");
  const {SimpleDao} = require("btrz-simple-dao");
  const {ValidationError} = require("btrz-service-req-res");

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

  let sandbox = null;
  let dao = null;
  let config = null;
  let service = null;
  let id = null;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    dao = {
      for: sandbox.spy(function () { return this; }),
      find: sandbox.spy(function () { return this; }),
      findAggregate: function () { return this; },
      findById: sandbox.stub().resolves(),
      count: sandbox.stub().resolves(0),
      save: sandbox.stub().resolves(),
      removeById: sandbox.stub().resolves(),
      toArray: sandbox.stub().resolves(),
    };
    config = {};
    service = new MongoDataService(dao, config);
    id = SimpleDao.objectId().toString();
  });

  it("should be called MongoDataService", () => {
    expect(MongoDataService.name).to.equal("MongoDataService");
  });

  describe("constructor", () => {
    function sut() {
      return new MongoDataService(dao, config);
    }

    it("should fail if dao is not in dependencies", () => {
      dao = null;
      expect(sut).to.throw("dao is mandatory for MongoDataService");
    });

    it("should fail if dao in dependencies is not a valid dao (has for method)", () => {
      dao.for = null;
      expect(sut).to.throw("dao is mandatory for MongoDataService");
    });

    it("should fail if config is not in dependencies", () => {
      config = null;
      expect(sut).to.throw("config is mandatory for MongoDataService");
    });

    it("should create an instance of MongoDataService", () => {
      expect(sut()).to.be.an.instanceof(MongoDataService);
    });
  });

  describe("#getById()", () => {
    function sut() {
      return service.getById(TestModel, id);
    }

    let dbDocument = null;
    beforeEach(() => {
      dbDocument = {something: "important"};
      dao.findById = sandbox.stub().resolves(dbDocument);
    });

    it("should fail if ID is missing", () => {
      id = null;
      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "WRONG_DATA",
          message: "TestModel ID is missing.",
          status: 400
        });
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";

      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "INVALID_TESTMODEL_ID",
          message: "TestModel ID is invalid.",
          status: 400
        });
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      expect(dao.for.calledOnce).to.equal(true);
      expect(dao.for.firstCall.args[0]).to.be.eql(TestModel);
      expect(dao.findById.calledOnce).to.equal(true);
      expect(dao.findById.firstCall.args[0]).to.equal(id);
    });

    it("should return the document found from the database", async () => {
      const found = await sut();
      expect(found).to.deep.equal(dbDocument);
    });
  });

  describe("#delete()", () => {
    function sut() {
      return service.delete(TestModel, id);
    }

    it("should fail if ID is missing", () => {
      id = null;
      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "WRONG_DATA",
          message: "TestModel ID is missing.",
          status: 400
        });
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";

      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "INVALID_TESTMODEL_ID",
          message: "TestModel ID is invalid.",
          status: 400
        });
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      expect(dao.for.calledOnce).to.equal(true);
      expect(dao.for.firstCall.args[0]).to.be.eql(TestModel);
      expect(dao.removeById.calledOnce).to.equal(true);
      expect(dao.removeById.firstCall.args[0]).to.equal(id);
    });
  });

  describe("#getExisting()", () => {
    function sut() {
      return service.getExisting(TestModel, id);
    }

    let dbDocument = null;
    beforeEach(() => {
      dbDocument = {something: "important"};
      dao.findById = sandbox.spy(() => Promise.resolve(dbDocument));
    });

    it("should fail if ID is missing", () => {
      id = null;
      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "WRONG_DATA",
          message: "TestModel ID is missing.",
          status: 400
        });
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";

      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "INVALID_TESTMODEL_ID",
          message: "TestModel ID is invalid.",
          status: 400
        });
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      expect(dao.for.calledOnce).to.equal(true);
      expect(dao.for.firstCall.args[0]).to.be.eql(TestModel);
      expect(dao.findById.calledOnce).to.equal(true);
      expect(dao.findById.firstCall.args[0]).to.equal(id);
    });

    it("should return the document found from the database", async () => {
      const found = await sut();
      expect(found).to.deep.equal(dbDocument);
    });

    it("should fail if document was not found", () => {
      dbDocument = null;

      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "NOT_FOUND",
          message: "TestModel not found",
          status: 404
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
      dao.findById = sandbox.spy(() => Promise.resolve(existingDocument));
    });

    it("should fail if ID is missing", () => {
      id = null;
      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "WRONG_DATA",
          message: "TestModel ID is missing.",
          status: 400
        });
    });

    it("should fail if ID is an invalid Mongo objectId", () => {
      id = "something";

      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "INVALID_TESTMODEL_ID",
          message: "TestModel ID is invalid.",
          status: 400
        });
    });

    it("should fail if update data is missing", () => {
      data = null;
      return expect(sut())
        .to.eventually.be.rejectedWith(Error)
        .to.include({
          message: "The data is required for update"
        });
    });

    it("should call the dao findById with the Model and id", async () => {
      await sut();
      expect(dao.for.calledOnce).to.equal(true);
      expect(dao.for.firstCall.args[0]).to.be.eql(TestModel);
      expect(dao.findById.calledOnce).to.equal(true);
      expect(dao.findById.firstCall.args[0]).to.equal(id);
    });

    it("should fail if document was not found", () => {
      existingDocument = null;

      return expect(sut())
        .to.eventually.be.rejectedWith(ValidationError)
        .to.include({
          code: "NOT_FOUND",
          message: "TestModel not found",
          status: 404
        });
    });

    it("should update and save the document found", async () => {
      await sut();
      expect(dao.save.calledOnce).to.equal(true);
      expect(dao.save.firstCall.args[0]).to.deep.equal({
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
      dao.toCursor = sandbox.spy(() => Promise.resolve(cursor));
      query = [
        {$match: {accountId: "account-id"}},
        { $group: { _id: null, "total_documents": { $sum: 1 } } }
      ];
    });

    it("should return a promise with an integer", () => {
      return expect(sut()).to.eventually.equal(5);
    });

    it("should return a rejected promise if cursor fails", () => {
      cursor.on = function (event, handler) {
        if (event === "error") {
          handler(new Error("mongo cursor error"));
        }
        return this;
      };
      return expect(sut())
        .to.eventually.be.rejectedWith(Error)
        .to.include({message: "mongo cursor error"});
    });

    it("should resolve to zero if cursor ends with no results", () => {
      cursor.on = function (event, handler) {
        if (event === "end") {
          handler();
        }
        return this;
      };
      return expect(sut()).to.eventually.equal(0);
    });
  });

  describe("#getCountedList", () => {
    let model = null,
      accountId = null,
      filters = null,
      CustomQueryBuilder = null,
      listResult = null,
      countResult = null;

    beforeEach(() => {
      accountId = "123123123";
      filters = {},
      CustomQueryBuilder = {};
      model = new TestModel();
      listResult = [{_id: "1"}, {_id: "2"}];
      countResult = listResult.length;
      dao.toArray = sandbox.spy(() => Promise.resolve(listResult));
      dao.count = sandbox.spy(() => Promise.resolve(countResult));
    });

    function sut() {
      return service.getCountedList(model, accountId, filters, CustomQueryBuilder);
    }

    it("should return an object with a list and count", () => {
      return sut()
        .then((result) => {
          expect(result).to.deep.equal({
            list: listResult,
            count: countResult
          });
        });
    })

    it("should call count and find with same query and options", () => {
      return sut()
        .then(() => {
          expect(dao.find.callCount).to.equal(1);
          expect(dao.find.firstCall.args).to.deep.equal([{accountId}, {}]);
          expect(dao.count.callCount).to.equal(1);
          expect(dao.count.firstCall.args).to.deep.equal([{accountId}]);
        });
    });
  });
});
