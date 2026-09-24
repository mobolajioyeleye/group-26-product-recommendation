const pool = require("../config/database");

const createUser = async (name, email, password, role = "User") => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password, role]
  );

  return result.rows[0];
};

const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM users
     ORDER BY created_at DESC`
  );

  return result.rows;
};

const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT *
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0];
};

const updateUser = async (id, name, email, role) => {
  const result = await pool.query(
    `UPDATE users
     SET name = $1,
         email = $2,
         role = $3
     WHERE id = $4
     RETURNING id, name, email, role, created_at`,
    [name, email, role, id]
  );

  return result.rows[0];
};

const updateUserPassword = async (id, password) => {
  const result = await pool.query(
    `UPDATE users
     SET password = $1
     WHERE id = $2
     RETURNING id, name, email, role, created_at`,
    [password, id]
  );

  return result.rows[0];
};

const deleteUser = async (id) => {
  const result = await pool.query(
    `DELETE FROM users
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  findUserByEmail,
  updateUser,
  updateUserPassword,
  deleteUser,
};