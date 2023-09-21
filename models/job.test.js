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

let jobId; //Used for update/delete


describe("test create new job", function () {
  test("works", async function () {
    const jobToCreate = {
      "title": "test-job1",
      "salary": 1,
      "equity": .6,
      "companyHandle": "c1"
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


  test("Create works: no salary property", async function () {
    const badCreate = {
      "title": "test-job2",
      "equity": 1,
      "companyHandle": "c1"
    };


    const job = await Job.create(badCreate);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
          FROM jobs
          WHERE title = 'test-job2'`
    );

    expect(result.rows.length).toEqual(1);
    expect(job.title).toEqual("test-job2");
    expect(job.equity).toEqual("1");
    expect(job.salary).toEqual(null);
    expect(job.companyHandle).toEqual("c1");

  });


  test("fails: equity too high", async function () {
    const badCreate = {
      "title": "test-job2",
      "equity": 3.0,
      "companyHandle": "c1"
    };

    try {
      const job = await Job.create(badCreate);
    } catch (err) {
      expect(err.message).toEqual('new row for relation "jobs" violates check constraint "jobs_equity_check"');
    }

  });

  test("fails: salary too low", async function () {
    const badCreate = {
      "title": "test-job2",
      "salary": -1000,
      "equity": 0.5,
      "companyHandle": "c1"
    };

    try {
      const job = await Job.create(badCreate);
    } catch (err) {
      expect(err.message).toEqual('new row for relation "jobs" violates check constraint "jobs_salary_check"');
    }

  });

  test("fails: no data", async function () {
    const badCreate = {};

    try {
      const job = await Job.create(badCreate);
    } catch (err) {
      expect(err.message).toEqual('null value in column \"title\" of relation \"jobs\" violates not-null constraint');
    }

  });
});

describe("test Job.get", function () {

  test("get works: real id", async function () {
    const seedResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const jobId = seedResult.rows[0].id;

    const testResult = await Job.get(jobId);

    expect(testResult).toEqual({
      title: "j1",
      salary: 1000,
      equity: "0.5",
      companyHandle: "c1"
    });
  });

  test("fails: not a valid id", async function () {
    try {
      const testResult = await Job.get(-10);
    } catch (err) {
      expect(err.message).toEqual("No job: -10");
    }
  });

  test("fails: no id provided", async function () {
    try {
      const testResult = await Job.get();
    } catch (err) {
      expect(err.message).toEqual("No job: undefined");
    }
  });
});



describe("test Job.update", function () {
  beforeEach(async function () {
    const jobToCreate = {
      "title": "test-job1",
      "salary": 1,
      "equity": .6,
      "companyHandle": "c1"
    };

    const job = await Job.create(jobToCreate);
    const seedResult = await db.query(`SELECT id FROM jobs WHERE title = 'test-job1'`);
    jobId = seedResult.rows[0].id;
  })

  test("successful update: all possible fields", async function () {
    const updateFields = {
      "title" : "test-job-updated",
      "salary" : 100000,
      "equity" : 1
    }

    const updateJob = await Job.update(jobId, updateFields);

    expect(updateJob).toEqual({
      "id" : jobId,
      "title" : "test-job-updated",
      "salary" : 100000,
      "equity" : "1",
      "companyHandle" : "c1"
    });

    const dbResult = await db.query(`
      SELECT id, title, salary, equity, company_handle as "companyHandle"
      FROM jobs
      WHERE id = $1`,
      [jobId]);
    const dbJob = dbResult.rows[0];

    expect(dbJob).toEqual({
      "id" : jobId,
      "title" : "test-job-updated",
      "salary" : 100000,
      "equity" : "1",
      "companyHandle" : "c1"
    })
  })


  test("successful update: partial fields", async function () {
    const updateFields = {"title" : "test-job-updated"}
    const updateJob = await Job.update(jobId, updateFields);

    expect(updateJob).toEqual({
      "id" : jobId,
      "title": "test-job-updated",
      "salary": 1,
      "equity": "0.6",
      "companyHandle": "c1"
    });

    const dbResult = await db.query(`
      SELECT id, title, salary, equity, company_handle as "companyHandle"
      FROM jobs
      WHERE id = $1`,
      [jobId]);
    const dbJob = dbResult.rows[0];

    expect(dbJob).toEqual({
      "id" : jobId,
      "title": "test-job-updated",
      "salary": 1,
      "equity": "0.6",
      "companyHandle": "c1"
    })
  })

  test ("fails: invalid value for field", async function () {
    const badFields = {"definitelyNot" : "aField"}

    try {
      const queryResult = await Job.update(jobId, badFields);
    } catch (err) {
      expect(err.message).toEqual('column "definitelyNot" of relation "jobs" does not exist');
    }
  })


  test("fails: no fields", async function () {
    const noFields = {}

    try {
      const queryResult = await Job.update(jobId, noFields);
    } catch (err) {
      expect(err.message).toEqual("No data");
    }
  })
});

describe("test Job.delete", function () {
  beforeEach(async function () {
    const jobToCreate = {
      "title": "test-job1",
      "salary": 1,
      "equity": .6,
      "companyHandle": "c1"
    };

    const job = await Job.create(jobToCreate);
    const seedResult = await db.query(`SELECT id FROM jobs WHERE title = 'test-job1'`);
    jobId = seedResult.rows[0].id;
  })

  test("successful delete", async function () {

  })
});