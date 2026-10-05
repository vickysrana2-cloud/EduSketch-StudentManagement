const pool = require("../config/db");

const createStudent = async (name, email, age) => {
  const query = `
    INSERT INTO students (name, email, age)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await pool.query(query, [name, email, age]);

  return result.rows[0];
};

const getAllStudents = async (
  limit,
  offset,
  search = ""
) => {
  const searchTerm = `%${search}%`;

  const studentsQuery = `
    SELECT *
    FROM students
    WHERE
      name ILIKE $1
      OR email ILIKE $1
    ORDER BY id
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM students
    WHERE
      name ILIKE $1
      OR email ILIKE $1
  `;

  const studentsResult =
    await pool.query(
      studentsQuery,
      [
        searchTerm,
        limit,
        offset,
      ]
    );

  const countResult =
    await pool.query(
      countQuery,
      [searchTerm]
    );

  return {
    students:
      studentsResult.rows,
    totalRecords: parseInt(
      countResult.rows[0].count
    ),
  };
};

const getStudentById = async (id) => {
  const studentResult = await pool.query(
    `
      SELECT *
      FROM students
      WHERE id = $1
    `,
    [id]
  );

  if (studentResult.rows.length === 0) {
    return null;
  }

  const student = studentResult.rows[0];

  const marksResult = await pool.query(
    `
      SELECT
        id,
        subject,
        marks,
        created_at
      FROM marks
      WHERE student_id = $1
      ORDER BY id
    `,
    [id]
  );

  student.marks = marksResult.rows;

  return student;
};

const updateStudent = async (
  id,
  name,
  email,
  age
) => {
  const result = await pool.query(
    `
      UPDATE students
      SET name = $1,
          email = $2,
          age = $3
      WHERE id = $4
      RETURNING *
    `,
    [name, email, age, id]
  );

  return result.rows[0];
};

const deleteStudent = async (id) => {
  await pool.query(
    "DELETE FROM students WHERE id = $1",
    [id]
  );
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};