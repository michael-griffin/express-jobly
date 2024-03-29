"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /**
   * Takes in a filters object similar to below, and returns
   * an SQL ready WHERE clause, along with the values to pass in for that WHERE
   * filters can have anywhere from 0-3 of the keys below.
   * {
   *   minEmployees : int,
   *   maxEmployees : int,
   *   nameLike : string
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
      minEmployees: "num_employees",
      maxEmployees: "num_employees",
      nameLike: "name",
    };

    const keys = Object.keys(filters);

    if (keys.length === 0) {
      return {
        whereClause: "",
        values: []
      };
    }

    if (filters.minEmployees && filters.maxEmployees &&
      filters.minEmployees > filters.maxEmployees) {
      throw new BadRequestError("you must have a greater maxEmployee than minEmployee");
    }

    if (filters.nameLike) {
      filters.nameLike = `%${filters.nameLike}%`;
    }

    const sqlStrings = keys.map((colName, idx) => {
      let sqlString;
      if (colName === "minEmployees") {
        sqlString = `${jsToSql[colName] || colName} >= $${idx + 1}`;
      } else if (colName === "maxEmployees") {
        sqlString = `${jsToSql[colName] || colName} <= $${idx + 1}`;
      } else if (colName === "nameLike") {
        sqlString = `${jsToSql[colName] || colName} ILIKE $${idx + 1}`;
      } else {
        throw new BadRequestError("Wrong key for filter");
      }
      return sqlString;
    });

    let fullSqlString = "WHERE " + sqlStrings.join(" AND ");
    let values = Object.values(filters);
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
    const { whereClause, values } = Company.sqlForWhere(filters);

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${whereClause}
        ORDER BY name`,
      values);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
