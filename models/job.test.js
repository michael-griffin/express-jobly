"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe("test create new job", function () {
  test("works", async function () {
    const jobToCreate = {
      "title" : "test-job1",
      "salary" : 1,
      "equity" : .6,
      "companyHandle" : "c1"
    };

    const job = await Job.create(jobToCreate);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE title = 'test-job1'`
    );

    expect(result.rows).toEqual([job]);
    expect(job.salary).toEqual(1);
    expect(job.equity).toEqual("0.6");
  });


  test("Test whether insufficient data is a problem", async function () {
    const badCreate = {
      "title" : "test-job2",
      "equity" : 1,
      "companyHandle" : "c1"
    };

    try {
      const job = await Job.create(badCreate);

      const result = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle"
          FROM jobs
          WHERE title = 'test-job2'`
      );

      console.log('bad created is: ', job);
      console.log('result.rows is: ', result.rows);
    } catch (err) {
      expect(err).toEqual('asd')
    }
  })

  //TODO: check whether salary fails if it's a negative number.

  test("attempt to add: equity too high", async function () {
    const badCreate = {
      "title" : "test-job2",
      "equity" : 3.0,
      "companyHandle" : "c1"
    };

    const job = await Job.create(badCreate);
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE title = 'test-job1'`
    );

  })
})

// describe("test Job.get", function () {
//   test("get works: real id", async function () {

//   })

//   test("get fails: id not in Database", async function () {

//   })
// })

// describe("test Job.update")