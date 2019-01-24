"use strict";

const {MongoDataService} = require("../index");
const {expect} = require("chai");

describe("Mongo Data Service", () => {
  it("should be called MongoDataService", () => {
    expect(MongoDataService.name).to.equal("MongoDataService");
  });
});
