import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createStudent } from "../services/studentService";
import { useTheme } from "../context/ThemeContext";

const AddStudent = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createStudent({
        ...formData,
        age: Number(formData.age),
      });

      navigate("/");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-colors duration-300 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            ← Back to Students
          </Link>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl dark:shadow-black/30 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
          <div className="px-8 py-8 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Add New Student
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-300">
              Create a new student profile and add it to the system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {[
              {label:"Full Name",name:"name",type:"text",placeholder:"Enter student name"},
              {label:"Email Address",name:"email",type:"email",placeholder:"Enter email address"},
              {label:"Age",name:"age",type:"number",placeholder:"Enter age",min:1,max:100}
            ].map((f)=>(
              <div key={f.name}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  name={f.name}
                  min={f.min}
                  max={f.max}
                  value={formData[f.name]}
                  onChange={handleChange}
                  required
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 focus:border-transparent transition"
                />
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium shadow-lg transition"
              >
                Create Student
              </button>

              <Link
                to="/"
                className="flex-1 text-center py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
