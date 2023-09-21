"use strict";
//FIXME: Add tests for both ensureAdmin and ensureValidUser

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureValidUser
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: { } } };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });
});

describe("test for ensureAdmin", function(){

  test("works if admin privilege is present", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    ensureAdmin(req, res, next);
  });

  test("failed: unauthorized error if no admin privilege is present", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => ensureAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("failed: unauthorized error if wrong isAdmin value exists", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: "true" } } };
    expect(() => ensureAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("failed: unauthorized error if nothing assigned to res.locals", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });


})

describe("test for ensureValidUser", function(){

  test("test for correct current user, but not an admin", function(){

    const req = {params:{username: "test"}};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    ensureValidUser(req,res,next);

  })

  test("test for not the current user, but is an admin", function(){

    const req = {params:{username: "test"}};
    const res = { locals: { user: { username: "test2", isAdmin: true } } };
    ensureValidUser(req,res,next);

  })

  test("failed: not current user and not an admin", function(){

    const req = {params:{username: "test"}};
    const res = { locals: { user: { username: "test2", isAdmin: false } } };
    expect(() => ensureValidUser(req, res, next))
        .toThrow(UnauthorizedError);

  })

  test("failed: no user logged in", function(){

    const req = {params:{username: "test"}};
    const res = { locals: { } };
    expect(() => ensureValidUser(req, res, next))
        .toThrow(UnauthorizedError);

  })

  test("failed: no username param provided in request", function(){

    const req = {};
    const res = { locals: { user: { username: "test2", isAdmin: true } } };
    expect(() => ensureValidUser(req, res, next))
        .toThrow(TypeError);

  })
})
