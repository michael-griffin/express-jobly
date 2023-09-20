"use strict";

const request = require("supertest");
const { sqlForPartialUpdate, sqlForWhere } = require("./sql");
const { BadRequestError } = require("../expressError");
const { commonBeforeEach } = require("../models/_testCommon");



describe("testing SQL statement converter", function () {


  test("test successful parse from JS to SQL, all 4 updates for user", function () {
    const testDataToUpdate = {
      firstName: "testfirstUpdated",
      lastName: "testlastUpdated",
      email: "test1@email.com",
      isAdmin: true
    };

    const testJsToSql = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };

    const finished = sqlForPartialUpdate(testDataToUpdate, testJsToSql);

    expect(finished).toEqual(
      {
        "setCols": "\"first_name\"=$1, \"last_name\"=$2, \"email\"=$3, \"is_admin\"=$4",
        "values": ["testfirstUpdated", "testlastUpdated", "test1@email.com", true]
      });

  });

  test("test successful, smaller set of data ", function () {
    const testSmallDataToUpdate = {
      firstName: "testSmallUpdate",
    };

    const testJsToSql = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };

    const finished = sqlForPartialUpdate(testSmallDataToUpdate, testJsToSql);

    expect(finished).toEqual(
      {
        "setCols": "\"first_name\"=$1",
        "values": ["testSmallUpdate"]
      });
  });

  test("test failed parse: no keys in dataToUpdate", function () {

    const testNoKeysToUpdate = {};


    const testJsToSql = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };



    expect(() => sqlForPartialUpdate(testNoKeysToUpdate,
      testJsToSql))
      .toThrow("No data");
  });

  test("what happens when JsToSql changes", function () {

    const testDataToUpdate = {
      firstName: "testfirstUpdated",
      lastName: "testlastUpdated",
      email: "test1@email.com",
      isAdmin: true
    };

    const testJsToSql = {
    };

    const finished = sqlForPartialUpdate(testDataToUpdate, testJsToSql);

    expect(finished).toEqual({
      "setCols": "\"firstName\"=$1, \"lastName\"=$2, \"email\"=$3, \"isAdmin\"=$4",
      "values": ["testfirstUpdated", "testlastUpdated", "test1@email.com", true]
    });
  });

});


describe("testing sqlForWhere", function () {
  // beforeEach(function () {
  //   console.log('got sqlforWhere beforeEach');
    const jsToSql = {
      minEmployees: "num_employees",
      maxEmployees: "num_employees",
      nameLike: "name",
    }
  // })
  test("test successful where clause made", function () {
    const filters = {
      "minEmployees" : 1,
      "maxEmployees" : 2,
      "nameLike" : "C"
    }
    const jsToSql = {
      minEmployees: "num_employees",
      maxEmployees: "num_employees",
      nameLike: "name",
    }

    const finished = sqlForWhere(filters, jsToSql);
    expect(finished.whereClause).toEqual(
      "WHERE num_employees >= $1 AND num_employees <= $2 AND name ILIKE '$3'");

    expect(finished.values).toEqual(
      [1, 2, '%C%']
    )
  })

  test("test partial filters", function () {
    const filters = {
      maxEmployees : 1
    }

    const jsToSql = {
      minEmployees: "num_employees",
      maxEmployees: "num_employees",
      nameLike: "name",
    }

    const finished = sqlForWhere(filters, jsToSql);

    expect(finished.whereClause).toEqual("WHERE num_employees <= $1")
    expect(finished.values).toEqual([1])

  });

  test("test no filters", function () {
    const filters = {
    }

    const jsToSql = {
      minEmployees: "num_employees",
      maxEmployees: "num_employees",
      nameLike: "name",
    }

    const finished = sqlForWhere(filters, jsToSql);

    expect(finished.whereClause).toEqual("")
    expect(finished.values).toEqual([])
  });

  // test("test wrong filter fields", function () {
  //   const filters = {
  //     "notagoodname" : 1,
  //     "minEmployees" : 1
  //   }


  // })
});