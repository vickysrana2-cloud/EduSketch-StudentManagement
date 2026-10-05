const markService = require("../services/markService");
const studentService = require("../services/studentService");

const addMark = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, marks } = req.body;

    if (!subject || marks === undefined) {
      return res.status(400).json({
        success: false,
        message: "Subject and marks are required",
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

    const mark = await markService.addMark(
      id,
      subject,
      marks
    );

    return res.status(201).json({
      success: true,
      message: "Mark added successfully",
      mark,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateMark = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, marks } = req.body;

    const existingMark =
      await markService.getMarkById(id);

    if (!existingMark) {
      return res.status(404).json({
        success: false,
        message: "Mark not found",
      });
    }

    const updatedMark =
      await markService.updateMark(
        id,
        subject,
        marks
      );

    return res.status(200).json({
      success: true,
      message: "Mark updated successfully",
      mark: updatedMark,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteMark = async (req, res) => {
  try {
    const { id } = req.params;

    const existingMark =
      await markService.getMarkById(id);

    if (!existingMark) {
      return res.status(404).json({
        success: false,
        message: "Mark not found",
      });
    }

    await markService.deleteMark(id);

    return res.status(200).json({
      success: true,
      message: "Mark deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  addMark,
  updateMark,
  deleteMark,
};