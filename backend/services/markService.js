const pool = require("../config/db");

const addMark = async (
  studentId,
  subject,
  marks
) => {
  const result = await pool.query(
    `
      INSERT INTO marks
      (student_id, subject, marks)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [studentId, subject, marks]
  );

  return result.rows[0];
};

const getMarkById = async (id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM marks
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

const updateMark = async (
  id,
  subject,
  marks
) => {
  const result = await pool.query(
    `
      UPDATE marks
      SET subject = $1,
          marks = $2
      WHERE id = $3
      RETURNING *
    `,
    [subject, marks, id]
  );

  return result.rows[0];
};

const deleteMark = async (id) => {
  await pool.query(
    `
      DELETE FROM marks
      WHERE id = $1
    `,
    [id]
  );
};

const getMarksByStudentId = async (studentId) => {
  const result = await pool.query(
    `
      SELECT id,
             subject,
             marks,
             created_at
      FROM marks
      WHERE student_id = $1
      ORDER BY id
    `,
    [studentId]
  );

  return result.rows;
};

module.exports = {
  addMark,
  getMarkById,
  updateMark,
  deleteMark,
  getMarksByStudentId,
};