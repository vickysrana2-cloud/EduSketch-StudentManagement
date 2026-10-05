import api from "../api/axios";

export const addMark = async (
  studentId,
  data
) => {
  const response = await api.post(
    `/students/${studentId}/marks`,
    data
  );

  return response.data;
};

export const updateMark = async (
  markId,
  data
) => {
  const response = await api.put(
    `/students/marks/${markId}`,
    data
  );

  return response.data;
};

export const deleteMark = async (
  markId
) => {
  const response = await api.delete(
    `/students/marks/${markId}`
  );

  return response.data;
};