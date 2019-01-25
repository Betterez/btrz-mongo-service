"use strict";

describe("Mongo Data Service", () => {
  const {MongoDataService} = require("../index");
  const {expect} = require("chai");
  const sinon = require("sinon");

  class TestModel {

  }

  class CursorMock {
    constructor () {
      this.counter = 0;
    }

    on (event, handler) {
      if (event === "data") {
        this.onDataHandler = handler;
      }

      this.counter++;

      if(this.counter >= 3) {
       this.doIt();
      }

      return this;
    }

    doIt() {
       this.onDataHandler({"total_documents": 5});
    }
  }

  let sandbox = null;
  let cursor = null;
  let dao = null;
  let config = null;
  let service = null;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    cursor = new CursorMock();
    //TODO: remove unused mock methods
    dao = {
      for: sandbox.spy(function () { return this; }),
      find: sandbox.spy(function () { return this; }),
      findAggregate: function () { return this; },
      findById: sandbox.spy(function (id) { return Promise.resolve({}); }),
      count: sandbox.spy(function () { return Promise.resolve(0); }),
      save: sandbox.spy(function (data) { return Promise.resolve(data); }),
      removeById: sandbox.spy(function (id) { return Promise.resolve({}); }),
      toArray: function () { return Promise.resolve(); },
      toCursor: function () {return Promise.resolve(cursor); },
      objectId: function (id) { return id; }
    };
    config = {};
    service = new MongoDataService(dao, config);
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
      service.getById();
    }

    it("should fail if ID is missing", () => {
    });

    it("should fail if ID is invalid", () => {
    });

    it("should call the dao findById with the id", () => {
    });

    it("should return the model found", () => {
    });
  });

  describe("#delete()", () => {
  });

  describe("#getExisting()", () => {
  });

  describe("#update()", () => {
  });

  describe("#getCountedList()", () => {
  });

  describe("#getAggregateCount()", () => {
  });
});
