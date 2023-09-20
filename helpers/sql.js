"use strict";

const { BadRequestError } = require("../expressError");


/**
 * takes in two objects: first is data that needs to be
 * changed, and second is the format the data should appear
 * in follow sql query
 *
 * ex for dataToUpdate:
 *{ firstName: "justin", lastName: "song",
  email: "jsong@gmail.com", isAdmin: true }

 ex: for jsToSql:
{
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
}

ex of returned value:

{
  setCols:"\"first_name\"=$1, \"last_name\"=$2, \"email\"=$3, \"is_admin\"=$4",
  "values": ["justin", "song", "jsong@gmail.com", true]
}

 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  //converts keys of dataToUpdate to matching values from js to sql
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
