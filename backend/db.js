const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "trainee_system",
  password: "Back12345", // replace with your DB password
  port: 5432,
});

module.exports = pool;