"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */
//id  |                       title                       | salary | equity |     company_handle
class Job {
  /** Create a job (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle
    ],
    );
    const job = result.rows[0];
    return job;
  }

  /**
   * Takes in a filters object similar to below, and returns
   * an SQL ready WHERE clause, along with the values to pass in for that WHERE
   * filters can have anywhere from 0-3 of the keys below.
   * {
   *   title : int,
   *   minSalary : float,
   *   hasEquity : string
   * }
   *
   * example output:
   * {
   *   whereClause: SqlString,
   *   values: [value, ...]
   * }
   */

  static sqlForWhere(filters = {}) {

    const jsToSql = {
      minSalary: "salary",
      hasEquity: "equity",
    };

    const keys = Object.keys(filters);

    if (keys.length === 0) {
      return {
        whereClause: "",
        values: []
      };
    }

    if (filters.title) {
      filters.title = `%${filters.title}%`;
    }

    const sqlStrings = keys.map((colName, idx) => {

      let sqlString;

      if (colName === "title") {
        sqlString = `title ILIKE $${idx + 1}`;

      } else if (colName === "minSalary") {
        sqlString = `${jsToSql[colName] || colName} >= $${idx + 1}`;

      } else if (colName === "hasEquity"){
        if (filters.hasEquity === true) sqlString = `${jsToSql[colName] || colName} > 0`;

      } else {
        throw new BadRequestError("Wrong key for filter");

      }
      return sqlString;
    });

    let filteredStrings = sqlStrings.filter(string => {
      if (string !== undefined) return true;
    });
    const fullSqlString = "WHERE " + filteredStrings.join(" AND ");

    const values = [];
    for (let key in filters){
      if (key !== "hasEquity") values.push(filters[key]);
    }
    // let values = Object.values(filters);
    return {
      whereClause: fullSqlString,
      values: values
    };

  }


  /** Find all companies by default.
   *
   * Can also accept optional filters:
   * {
   *   minEmployees : int,
   *   maxEmployees : int,
   *   nameLike : string
   * }
   *
   * To find all companies matching filter requirements
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */
  //
  static async findAll(filters) {
    const { whereClause, values } = Job.sqlForWhere(filters);

    const jobsRes = await db.query(`
        SELECT title,
          salary,
          equity,
          company_handle AS "companyHandle"
          FROM jobs
        ${whereClause}
        ORDER BY company_handle, title`,
      values);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *    Returns { title, salary, equity, companyHandle }
   *    Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT title,
          salary,
          equity,
          company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   *    Data can include: { title, salary, equity}
   *    Returns { title, salary, equity, companyHandle }
   *    Throws NotFoundError if not found.
   */

  static async update(id, data) {

    //Note: jsToSql would normally tweak column names, but title/salary/equity are ok
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
