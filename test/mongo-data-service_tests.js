"use strict";

describe("Mongo Data Service", () => {
  const {MongoDataService} = require("../index");
  const {expect} = require("chai");

  it("should be called MongoDataService", () => {
    expect(MongoDataService.name).to.equal("MongoDataService");
  });

  describe("constructor", () => {
    function sut() {
      return new MongoDataService(dao, config);
    }

    let dao = null,
      config = null;
    beforeEach(() => {
      dao = {for(){}};
      config = {};
    });

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
  });

  describe("#getById()", () => {
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
