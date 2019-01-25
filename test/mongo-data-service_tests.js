"use strict";

describe("Mongo Data Service", () => {
  const {MongoDataService} = require("../index");
  const {expect} = require("chai");

  it("should be called MongoDataService", () => {
    expect(MongoDataService.name).to.equal("MongoDataService");
  });

  describe("constructor", () => {
    function sut() {
      return new MongoDataService(dependencies);
    }

    let dependencies = null;
    beforeEach(() => {
      dependencies = {
        dao: {for(){}},
        config: {}
      };
    });

    it("should fail if dao is not in dependencies", () => {
      Reflect.deleteProperty(dependencies, "dao");
      expect(sut).to.throw("dao is mandatory for MongoDataService");
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
