"use strict";
//FIXME:


const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
// const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

const jobIds = [];

async function commonBeforeAll() {


  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  //
  await db.query("DELETE FROM jobs");

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: true,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  // await Job.create({
  //   title: 'j11',
  //   salary: 1000,
  //   equity: .5,
  //   companyHandle: "c1"
  // })

  const resp = await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ('j1', 1000, .5, 'c1'),
             ('j2', 2000, .6, 'c1'),
             ('j3', 3000, 1, 'c2'),
             ('j4', 3000, 0, 'c1')
      RETURNING id`);
  const newIds = resp.rows;

  newIds.forEach(id => {
    jobIds.push(id);
  })
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token  = createToken({username: "u2", isAdmin: true})


// async function jobFunction (){
//   return await db.query(`SELECT id FROM jobs WHERE title = 'j3'`);
// }
let jobIdPromise = db.query(`SELECT id FROM jobs WHERE title = 'j3'`);

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  jobIdPromise,
  jobIds
};
