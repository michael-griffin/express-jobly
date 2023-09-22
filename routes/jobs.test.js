"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob =  {
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

  test("failed: make new company without admin privilege", async function () {
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
      "title" : "j",
      "minSalary" : 1500,
      "hasEquity" : false
    }

    const resp = await request(app).get("/companies").query(filters);
    expect(resp.body).toEqual({
      "companies": [{
        "description": "Desc1",
        "handle": "c1",
        "logoUrl": "http://c1.img",
        "name": "C1",
        "numEmployees": 1
      },
      {
        "description": "Desc2",
        "handle": "c2",
        "logoUrl": "http://c2.img",
        "name": "C2",
        "numEmployees": 2
      }]
    });
  });

  test("rejects invalid query: (extra fields)", async function () {
    const filters = { "minEmployees": 1, "thisisNotaField": "poor data" };

    const resp = await request(app).get("/companies").query(filters);
    expect(resp.statusCode).toEqual(400);
  });

  test("rejects invalid query: (minEmployees > max)", async function () {
    const filters = { "minEmployees": 10, "maxEmployees": 2 };

    const resp = await request(app).get("/companies").query(filters);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {

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

  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {

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
  });

  test("works for users", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: "c1-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {

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
  });

  test("works for users", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/companies/nope`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});