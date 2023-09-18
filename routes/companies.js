"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companyGetSchema = require("../schemas/companyGet.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login and Admin
 */
//FIXME: no need for loggedIn middleware
router.post("/",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      companyNewSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  });

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on optional provided search filters:
 {
      "minEmployees": 1,
      "maxEmployees": 2,
      "nameLike": "C"
    }
 *
 * Authorization required: none
 *
 *
 */

router.get("/", async function (req, res, next) {

  const requestObj = req.query;
  if (requestObj.minEmployees !== undefined) requestObj.minEmployees = Number(requestObj.minEmployees);
  if (requestObj.maxEmployees !== undefined) requestObj.maxEmployees = Number(requestObj.maxEmployees);

  const validator = jsonschema.validate(
    requestObj,
    companyGetSchema,
    { required: true },
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const companies = await Company.findAll(requestObj);
  return res.json({ companies });
});


/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: Admin
 */

router.patch("/:handle",
  ensureLoggedIn, //TODO:
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      companyUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  });

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: Admin
 */

router.delete("/:handle",
  ensureLoggedIn, //TODO: no need
  ensureAdmin,
  async function (req, res, next) {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  });


module.exports = router;
