import {
  Routes,
  Route,
} from "react-router-dom";

import StudentList from "./pages/StudentList";
import StudentDetails from "./pages/StudentDetails";
import AddStudent from "./pages/AddStudent";

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<StudentList />}
      />

      <Route
        path="/students/:id"
        element={<StudentDetails />}
      />

      <Route
        path="/add-student"
        element={<AddStudent />}
      />
    </Routes>
  );
};

export default AppRoutes;