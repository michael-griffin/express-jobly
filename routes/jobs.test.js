"use strict";
//FIXME: jobId is not being imported properly: problem is it's the result of an async
//call, so we would like to await it prior to export, but can't.
//

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  jobIdPromise,
  jobIds
} = require("./_testCommon");


beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    "title": "test-job1",
    "salary": 1,
    "equity": .6,
    "companyHandle": "c1"
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        "equity": .6,
        "companyHandle": "c1"
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        equity: "1",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("failed: make new job without admin privilege", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            title: "j1",
            salary: 1000,
            equity: "0.5",
            companyHandle: "c1",
          },
          {
            title: "j2",
            salary: 2000,
            equity: "0.6",
            companyHandle: "c1",
          },
          {
            title: "j4",
            salary: 3000,
            equity: "0",
            companyHandle: "c1",
          },
          {
            title: "j3",
            salary: 3000,
            equity: "1",
            companyHandle: "c2",
          }
        ],
    });
  });

});

describe("GET /jobs (with filters)", function () {
  test("ok for valid filter ", async function () {
    const filters = {
      "title": "j",
      "minSalary": 1500,
      "hasEquity": false
    };

    const resp = await request(app).get("/jobs").query(filters);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j2",
          salary: 2000,
          equity: "0.6",
          companyHandle: "c1",
        },
        {
          title: "j4",
          salary: 3000,
          equity: "0",
          companyHandle: "c1",
        },
        {
          title: "j3",
          salary: 3000,
          equity: "1",
          companyHandle: "c2",
        }
      ]
    });
  });

  test("rejects invalid query: (extra fields)", async function () {
    const filters = { "hasEquity": 1, "thisisNotaField": "poor data" };

    const resp = await request(app).get("/jobs").query(filters);
    expect(resp.statusCode).toEqual(400);
  });

  test("rejects invalid query: hasEquity filter is not boolean", async function () {
    const filters = { "hasEquity" : "string not boolean"};

    const resp = await request(app).get("/jobs").query(filters);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {

  // beforeEach(async function () {
  //   const jobToCreate = {
  //     "title": "test-job1",
  //     "salary": 1,
  //     "equity": .6,
  //     "companyHandle": "c1"
  //   };

  //   const job = await Job.create(jobToCreate);
  //   const seedResult = await db.query(`SELECT id FROM jobs WHERE title = 'test-job1'`);
  //   jobId = seedResult.rows[0].id;
  // });

  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.body).toEqual({
    job: {
      "title": "test-job1",
      "salary": 1,
      "equity": .6,
      "companyHandle": "c1",
      "id" : jobId
    }
    });
  });

  //TODO: don't believe there is an equivalent for this.
  // test("works for anon: job with no id", async function () {
  //   const resp = await request(app).get(`/companies/c2`);
  //   expect(resp.body).toEqual({
  //     company: {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //   });
  // });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/100000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {

  // beforeEach(async function () {
  //   const jobToCreate = {
  //     "title": "test-job1",
  //     "salary": 1,
  //     "equity": .6,
  //     "companyHandle": "c1"
  //   };

  //   const job = await Job.create(jobToCreate);
  //   const seedResult = await db.query(`SELECT id FROM jobs WHERE title = 'test-job1'`);
  //   jobId = seedResult.rows[0].id;
  // });

  test("works for users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "test-job-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        "title": "test-job-new",
        "salary": 1,
        "equity": .6,
        "companyHandle": "c1",
        "id" : jobId
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "test-job-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "test-job-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/100000`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        id: 10000000,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        equity: "not a number",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {

  // beforeEach(async function () {
  //   const jobToCreate = {
  //     "title": "test-job1",
  //     "salary": 1,
  //     "equity": .6,
  //     "companyHandle": "c1"
  //   };

  //   const job = await Job.create(jobToCreate);
  //   const seedResult = await db.query(`SELECT id FROM jobs WHERE title = 'test-job1'`);
  //   jobId = seedResult.rows[0].id;
  // });

  test("works for admin users", async function () {

    // const jobResp = await jobIdPromise;
    // const jobId = jobResp.rows[0].id;

    const jobId = jobIds[0].id;
    console.log('jobId is: ', jobId);

    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u2Token}`);

    // console.log('resp body is: ', resp.body);

    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/1000000`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});