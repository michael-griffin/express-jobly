/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobGetSchema = require("../schemas/jobGet.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: Admin
 */
router.post("/",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      jobNewSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
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
  if (requestObj.minSalary !== undefined) requestObj.minSalary = Number(requestObj.minSalary);

  const validator = jsonschema.validate(
    requestObj,
    jobGetSchema,
    { required: true },
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const jobs = await Job.findAll(requestObj);
  return res.json({ jobs });
});


/** GET /[handle]  =>  { job }
 *
 *  job is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: Admin
 */

router.patch("/:id",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      jobUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  });

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: Admin
 */

router.delete("/:id",
  ensureAdmin,
  async function (req, res, next) {
    console.log("id is : ", req.params.id);
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  });


module.exports = router;