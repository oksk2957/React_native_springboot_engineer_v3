import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:9001/api',
});

export const subjectService = {
  getAllSubjects: () => api.get('/subjects'),
  getSubjectById: (id) => api.get(`/subjects/${id}`),
  createSubject: (subject) => api.post('/subjects', subject),
  updateSubject: (id, subject) => api.put(`/subjects/${id}`, subject),
  deleteSubject: (id) => api.delete(`/subjects/${id}`)
};

export const problemService = {
  getAllProblems: () => api.get('/problems'),
  getProblemById: (id) => api.get(`/problems/${id}`),
  getProblemsBySubject: (subjectId) => api.get(`/subjects/${subjectId}/problems`),
  createProblem: (problem) => api.post('/problems', problem),
  updateProblem: (id, problem) => api.put(`/problems/${id}`, problem),
  deleteProblem: (id) => api.delete(`/problems/${id}`)
};
