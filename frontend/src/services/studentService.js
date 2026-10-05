import api from "../api/axios";

export const getStudents = async (
  page = 1,
  limit = 5,
  search = ""
) => {
  const response = await api.get(
    `/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  );

  return response.data;
};

export const getStudentById = async (id) => {
  const response = await api.get(`/students/${id}`);

  return response.data;
};

export const createStudent = async (data) => {
  const response = await api.post(
    "/students",
    data
  );

  return response.data;
};

export const updateStudent = async (
  id,
  data
) => {
  const response = await api.put(
    `/students/${id}`,
    data
  );

  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(
    `/students/${id}`
  );

  return response.data;
};