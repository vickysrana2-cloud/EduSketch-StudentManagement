import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudents } from "../services/studentService";
import { useTheme } from "../context/ThemeContext";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const fetchStudents = async () => {
    try {
      const response = await getStudents(page, 5, search);

      setStudents(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-50
        to-slate-100
        dark:from-slate-900
        dark:to-slate-950
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          py-10
        "
      >
        {/* Header */}
        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-6
            mb-10
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
              Student Management
            </h1>

            <p
              className="
               text-slate-500 dark:text-slate-300
                mt-2
              "
            >
              Manage students and academic records
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleTheme}
              className="
      px-5
      py-3
      rounded-xl
      bg-white dark:bg-slate-800
      border
      border-slate-300
              dark:border-slate-600
      shadow-sm
      hover:bg-slate-100
      dark:hover:bg-slate-700
      transition
    "
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <Link
              to="/add-student"
              className="
      inline-flex
      items-center
      justify-center
      rounded-xl
      bg-slate-900
      px-6
      py-3
      text-white
      font-medium
      transition
      hover:bg-slate-800
      shadow-lg
    "
            >
              + Add Student
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="
      w-full
      md:w-96
      px-4
      py-3
      rounded-xl
      border
      border-slate-300
      dark:border-slate-700
      bg-white dark:bg-slate-800
      text-slate-900
      dark:text-white
      placeholder:text-slate-400
      dark:placeholder:text-slate-500
      shadow-sm
      focus:outline-none
      focus:ring-2
      focus:ring-slate-900
      transition
    "
          />
        </div>

        {/* Stats Card */}
        <div
          className="
            bg-white dark:bg-slate-800
            rounded-2xl
            shadow-sm
            border
            border-slate-200 dark:border-slate-700
            p-6
            mb-8
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <div>
              <p
                className="
                  text-sm
                  text-slate-500 dark:text-slate-300
                "
              >
                Total Students
              </p>

              <h2
                className="
                  text-3xl
                  font-bold
                  text-slate-900 dark:text-white
                  mt-1
                "
              >
                {pagination?.totalRecords}
              </h2>
            </div>

            <div
              className="
                h-14
                w-14
                rounded-full
                bg-slate-100
dark:bg-slate-700
                flex
                items-center
                justify-center
                text-xl
              "
            >
              🎓
            </div>
          </div>
        </div>

        {/* Student Cards */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-6
          "
        >
          {students.map((student) => (
            <Link key={student.id} to={`/students/${student.id}`}>
              <div
                className="
                    bg-white dark:bg-slate-800
                    rounded-2xl
                    border
                    border-slate-200 dark:border-slate-700
                    p-6
                    shadow-md
                    dark:shadow-black/30
                    transition-all
                    duration-300
                    ease-in-out
                    hover:-translate-y-1
                    hover:shadow-xl
                    hover:border-slate-300
                    dark:hover:border-slate-500
                    cursor-pointer
                  "
              >
                <div
                  className="
                      flex
                      items-start
                      justify-between
                    "
                >
                  <div>
                    <h3
                      className="
                          text-xl
                          font-semibold
                          text-slate-900 dark:text-white
                        "
                    >
                      {student.name}
                    </h3>

                    <p
                      className="
                          text-slate-500 dark:text-slate-300
                          mt-1
                          break-all
                        "
                    >
                      {student.email}
                    </p>
                  </div>

                  <div
                    className="
                        h-12
                        w-12
                        rounded-full
                        bg-slate-100
dark:bg-slate-700
                        flex
                        items-center
                        justify-center
                        font-bold
                        text-slate-700
                        dark:text-white
                      "
                  >
                    {student.name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>

                <div
                  className="
                      mt-6
                      pt-4
                    border-t
border-slate-100
dark:border-slate-700
                      flex
                      justify-between
                      items-center
                    "
                >
                  <span
                    className="
                        text-sm
                        text-slate-500 dark:text-slate-300
                      "
                  >
                    Age
                  </span>

                  <span
                    className="
                        font-semibold
                        text-slate-900 dark:text-white
                      "
                  >
                    {student.age}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {students.length === 0 && (
          <div
            className="
                    bg-white dark:bg-slate-800
              rounded-2xl
              border
              border-slate-200 dark:border-slate-700
              p-12
              text-center
              mt-6
            "
          >
            <h3
              className="
                text-xl
                font-semibold
                text-slate-700
dark:text-white
              "
            >
              No Students Found
            </h3>

            <p
              className="
                text-slate-500 dark:text-slate-300
                mt-2
              "
            >
              Create your first student record.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div
          className="
            mt-10
            flex
            items-center
            justify-center
            gap-4
          "
        >
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="
              px-5
              py-2.5
              rounded-xl
              border
              border-slate-300
              dark:border-slate-600
              bg-white dark:bg-slate-800
              text-slate-700
dark:text-white
              disabled:opacity-40
              disabled:cursor-not-allowed
              hover:bg-slate-100
              dark:hover:bg-slate-700
              transition
            "
          >
            Previous
          </button>

          <div
            className="
              px-5
              py-2.5
              rounded-xl
              bg-slate-900
              text-white
              font-medium
            "
          >
            Page {pagination?.currentPage}
            {" / "}
            {pagination?.totalPages}
          </div>

          <button
            disabled={page === pagination?.totalPages}
            onClick={() => setPage(page + 1)}
            className="
              px-5
              py-2.5
              rounded-xl
              border
              border-slate-300
              dark:border-slate-600
              bg-white dark:bg-slate-800
              text-slate-700
dark:text-white
              disabled:opacity-40
              disabled:cursor-not-allowed
              hover:bg-slate-100
              dark:hover:bg-slate-700
              transition
            "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
