"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureCurrentUser, ensureAdmin } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login, admin
 **/

router.post("/",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      userNewSchema,
      { required: true },
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  });


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login, admin
 **/

router.get("/",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    const users = await User.findAll();
    return res.json({ users });
  });


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login, current user
 **/

router.get("/:username",
  ensureLoggedIn,
  ensureCurrentUser,
  async function (req, res, next) {

    const user = await User.get(req.params.username);
    return res.json({ user });

  });


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login, current user
 **/

router.patch("/:username",
  ensureLoggedIn,
  ensureCurrentUser,
  async function (req, res, next) {

    const validator = jsonschema.validate(
      req.body,
      userUpdateSchema,
      { required: true },
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });

  });


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login, current user
 **/

router.delete("/:username",
  ensureLoggedIn,
  ensureCurrentUser,
  async function (req, res, next) {

    if (username !== res.locals.user.username) throw new UnauthorizedError("Must be current user");

    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });

  });


module.exports = router;
