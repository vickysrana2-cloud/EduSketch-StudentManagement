import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

import {
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../services/studentService";

import { addMark, updateMark, deleteMark } from "../services/markService";

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const [student, setStudent] = useState(null);

  const [isEditingStudent, setIsEditingStudent] = useState(false);

  const [studentFormData, setStudentFormData] = useState({
    name: "",
    email: "",
    age: "",
  });

  const [markData, setMarkData] = useState({
    subject: "",
    marks: "",
  });

  const [editingMarkId, setEditingMarkId] = useState(null);

  const [editMarkData, setEditMarkData] = useState({
    subject: "",
    marks: "",
  });

  const fetchStudent = async () => {
    try {
      const response = await getStudentById(id);

      setStudent(response.student);

      setStudentFormData({
        name: response.student.name,
        email: response.student.email,
        age: response.student.age,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, []);

  const handleChange = (e) => {
    setMarkData({
      ...markData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddMark = async (e) => {
    e.preventDefault();

    try {
      await addMark(id, {
        subject: markData.subject,
        marks: Number(markData.marks),
      });

      setMarkData({
        subject: "",
        marks: "",
      });

      alert("Mark added successfully");

      fetchStudent();
    } catch (error) {
      console.log(error);

      alert("Failed to add mark");
    }
  };

  const handleDeleteMark = async (markId) => {
    const confirmed = window.confirm("Delete this mark?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteMark(markId);

      alert("Mark deleted successfully");

      fetchStudent();
    } catch (error) {
      console.log(error);

      alert("Failed to delete mark");
    }
  };

  const handleEditClick = (mark) => {
    setEditingMarkId(mark.id);

    setEditMarkData({
      subject: mark.subject,
      marks: mark.marks,
    });
  };

  const handleEditChange = (e) => {
    setEditMarkData({
      ...editMarkData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateMark = async (markId) => {
    try {
      await updateMark(markId, {
        subject: editMarkData.subject,
        marks: Number(editMarkData.marks),
      });

      alert("Mark updated successfully");

      setEditingMarkId(null);

      fetchStudent();
    } catch (error) {
      console.log(error);

      alert("Failed to update mark");
    }
  };

  const handleCancelEdit = () => {
    setEditingMarkId(null);
  };

  const handleStudentChange = (e) => {
    setStudentFormData({
      ...studentFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditStudent = () => {
    setIsEditingStudent(true);
  };

  const handleCancelStudentEdit = () => {
    setIsEditingStudent(false);

    setStudentFormData({
      name: student.name,
      email: student.email,
      age: student.age,
    });
  };

  const handleUpdateStudent = async () => {
    try {
      await updateStudent(id, {
        name: studentFormData.name,
        email: studentFormData.email,
        age: Number(studentFormData.age),
      });

      alert("Student updated successfully");

      setIsEditingStudent(false);

      fetchStudent();
    } catch (error) {
      console.log(error);

      alert(error.response?.data?.message || "Failed to update student");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteStudent(id);

      alert("Student deleted successfully");

      navigate("/");
    } catch (error) {
      console.log(error);

      alert("Failed to delete student");
    }
  };

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-white dark:text-white">Loading...</div>;
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link
        to="/"
        className="
          inline-flex
          items-center
          text-slate-600
          hover:text-slate-900 dark:text-white
          transition
          mb-6
        "
      >
        ← Back to Students
      </Link>
      <button onClick={toggleTheme} className="float-right px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition">{darkMode ? "☀️":"🌙"}</button>

      {/* Student Profile Card */}
      <div
        className="
          bg-white dark:bg-slate-800
          rounded-3xl
          transition-all duration-300
          shadow-md dark:shadow-black/30
          border
          border-slate-200 dark:border-slate-700
          p-8
          mb-8
        "
      >
        {isEditingStudent ? (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Edit Student
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={studentFormData.name}
                onChange={handleStudentChange}
                className="
                  w-full
                  border
                  border-slate-300 dark:border-slate-600
                  rounded-xl
                  px-4
                  py-3
                "
              />

              <input
                type="email"
                name="email"
                value={studentFormData.email}
                onChange={handleStudentChange}
                className="
                  w-full
                  border
                  border-slate-300 dark:border-slate-600
                  rounded-xl
                  px-4
                  py-3
                "
              />

              <input
                type="number"
                name="age"
                value={studentFormData.age}
                onChange={handleStudentChange}
                className="
                  w-full
                  border
                  border-slate-300 dark:border-slate-600
                  rounded-xl
                  px-4
                  py-3
                "
              />

              <div className="flex gap-3">
                <button
                  onClick={
                    handleUpdateStudent
                  }
                  className="
                    bg-slate-900
                    text-white
                    px-5
                    py-3
                    rounded-xl
                  "
                >
                  Save
                </button>

                <button
                  onClick={
                    handleCancelStudentEdit
                  }
                  className="
                    border
                    border-slate-300 dark:border-slate-600
                    px-5
                    py-3
                    rounded-xl
                  "
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="
                flex
                flex-col
                lg:flex-row
                lg:items-center
                lg:justify-between
                gap-6
              "
            >
              <div>
                <h1
                  className="
                    text-4xl
                    font-bold
                    text-slate-900 dark:text-white
                  "
                >
                  {student.name}
                </h1>

                <p
                  className="
                    text-slate-500 dark:text-slate-300
                    mt-2
                  "
                >
                  {student.email}
                </p>

                <div
                  className="
                    inline-block
                    mt-4
                    bg-slate-100 dark:bg-slate-700
                    px-4
                    py-2
                    rounded-full
                    text-slate-700 dark:text-white
                  "
                >
                  Age: {student.age}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={
                    handleEditStudent
                  }
                  className="
                    bg-slate-900
                    text-white
                    px-5
                    py-3
                    rounded-xl
                  "
                >
                  Edit Student
                </button>

                <button
                  onClick={
                    handleDelete
                  }
                  className="
                    bg-red-600
                    text-white
                    px-5
                    py-3
                    rounded-xl
                  "
                >
                  Delete Student
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Mark */}
      <div
        className="
          bg-white dark:bg-slate-800
          rounded-3xl
          transition-all duration-300
          shadow-md dark:shadow-black/30
          border
          border-slate-200 dark:border-slate-700
          p-8
          mb-8
        "
      >
        <h2
          className="
            text-2xl
            font-bold
            mb-6
          "
        >
          Add Mark
        </h2>

        <form
          onSubmit={handleAddMark}
          className="
            grid
            md:grid-cols-3
            gap-4
          "
        >
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={markData.subject}
            onChange={handleChange}
            required
            className="
              border
              border-slate-300 dark:border-slate-600
              rounded-xl
              px-4
              py-3
            "
          />

          <input
            type="number"
            name="marks"
            placeholder="Marks"
            min="0"
            max="100"
            value={markData.marks}
            onChange={handleChange}
            required
            className="
              border
              border-slate-300 dark:border-slate-600
              rounded-xl
              px-4
              py-3
            "
          />

          <button
            type="submit"
            className="
              bg-slate-900
              text-white
              rounded-xl
              px-4
              py-3
            "
          >
            Add Mark
          </button>
        </form>
      </div>

      {/* Marks Section */}
      <div
        className="
          bg-white dark:bg-slate-800
          rounded-3xl
          transition-all duration-300
          shadow-md dark:shadow-black/30
          border
          border-slate-200 dark:border-slate-700
          p-8
        "
      >
        <h2
          className="
            text-2xl
            font-bold
            mb-6
          "
        >
          Academic Records
        </h2>

        {student.marks?.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-300">
            No marks found
          </p>
        ) : (
          <div className="space-y-4">
            {student.marks?.map(
              (mark) => (
                <div
                  key={mark.id}
                  className="
                    border
                    border-slate-200 dark:border-slate-700
                    rounded-2xl
                    p-5
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                  "
                >
                  {editingMarkId ===
                  mark.id ? (
                    <>
                      <div className="flex gap-3 flex-wrap">
                        <input
                          type="text"
                          name="subject"
                          value={
                            editMarkData.subject
                          }
                          onChange={
                            handleEditChange
                          }
                          className="
                            border
                            border-slate-300 dark:border-slate-600
                            rounded-xl
                            px-3
                            py-2
                          "
                        />

                        <input
                          type="number"
                          name="marks"
                          value={
                            editMarkData.marks
                          }
                          onChange={
                            handleEditChange
                          }
                          className="
                            border
                            border-slate-300 dark:border-slate-600
                            rounded-xl
                            px-3
                            py-2
                          "
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateMark(
                              mark.id
                            )
                          }
                          className="
                            bg-slate-900
                            text-white
                            px-4
                            py-2
                            rounded-xl
                          "
                        >
                          Save
                        </button>

                        <button
                          onClick={
                            handleCancelEdit
                          }
                          className="
                            border
                            border-slate-300 dark:border-slate-600
                            px-4
                            py-2
                            rounded-xl
                          "
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h3
                          className="
                            font-semibold
                            text-lg
                          "
                        >
                          {mark.subject}
                        </h3>

                        <p
                          className="
                            text-slate-500 dark:text-slate-300
                          "
                        >
                          Score:{" "}
                          {mark.marks}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleEditClick(
                              mark
                            )
                          }
                          className="
                            bg-slate-900
                            text-white
                            px-4
                            py-2
                            rounded-xl
                          "
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteMark(
                              mark.id
                            )
                          }
                          className="
                            bg-red-600
                            text-white
                            px-4
                            py-2
                            rounded-xl
                          "
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default StudentDetails;
