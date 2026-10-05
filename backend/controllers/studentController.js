const studentService = require("../services/studentService");

const createStudent = async (req, res) => {
  try {
    const { name, email, age } = req.body;

    if (!name || !email || !age) {
      return res.status(400).json({
        success: false,
        message: "Name, email and age are required",
      });
    }

    const student = await studentService.createStudent(
      name,
      email,
      age
    );

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    const { students, totalRecords } =
      await studentService.getAllStudents(
  limit,
  offset,
  search
);

    const totalPages = Math.ceil(
      totalRecords / limit
    );

    return res.status(200).json({
      success: true,
      data: students,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student id",
      });
    }

    const student =
      await studentService.getStudentById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student id",
      });
    }

    const existingStudent =
      await studentService.getStudentById(id);

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const updatedStudent =
      await studentService.updateStudent(
        id,
        name,
        email,
        age
      );

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student id",
      });
    }

    const existingStudent =
      await studentService.getStudentById(id);

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await studentService.deleteStudent(id);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  }catch (error) {
  console.error(error);

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Email already exists",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};