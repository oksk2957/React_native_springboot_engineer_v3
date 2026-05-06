import axios from 'axios';

const API_BASE_URL = '/api';

export const subjectService = {
  getAllSubjects: () => axios.get(\\/subjects\),
  getSubjectById: (id) => axios.get(\\/subjects/\\),
  createSubject: (subject) => axios.post(\\/subjects\, subject),
  updateSubject: (id, subject) => axios.put(\\/subjects/\\, subject),
  deleteSubject: (id) => axios.delete(\\/subjects/\\)
};

export const problemService = {
  getAllProblems: () => axios.get(\\/problems\),
  getProblemById: (id) => axios.get(\\/problems/\\),
  getProblemsBySubject: (subjectId) => axios.get(\\/subjects/\/problems\),
  createProblem: (problem) => axios.post(\\/problems\, problem),
  updateProblem: (id, problem) => axios.put(\\/problems/\\, problem),
  deleteProblem: (id) => axios.delete(\\/problems/\\)
};
