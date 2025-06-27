import api from './apiService';

export const projectService = {
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data.projects; // Extract the projects array
  },

  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data.project; // Extract the project object
  },

  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data.project; // Extract the project object
  },

  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data.project; // Extract the project object
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data; // This one can stay as is (just returns success message)
  }
};