import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================
// AUTH SERVICES
// ============================================
export const register = (userData) => api.post('/auth/register', userData);
export const login = (userData) => api.post('/auth/login', userData);
export const getMe = () => api.get('/auth/me');

// ============================================
// PROJECT SERVICES
// ============================================
export const getProjects = () => api.get('/projects');
export const createProject = (projectData) => api.post('/projects', projectData);
export const updateProject = (id, projectData) => api.put(`/projects/${id}`, projectData);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const getProjectDetails = (projectId) => api.get(`/projects/${projectId}`);

// ============================================
// MEMBER SERVICES
// ============================================
export const getProjectMembers = (projectId) => api.get(`/projects/${projectId}/members`);
export const addProjectMember = (projectId, email, role) => api.post(`/projects/${projectId}/members`, { email, role });
export const removeProjectMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);
export const getAllUsers = () => api.get('/projects/users/all');

// ============================================
// TASK SERVICES
// ============================================
export const getTasks = (projectId) => api.get(`/tasks/project/${projectId}`);
export const createTask = (taskData) => api.post('/tasks', taskData);
export const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// ============================================
// UPLOAD SERVICES
// ============================================
export const uploadFile = (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/task/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const getTaskFiles = (taskId) => api.get(`/upload/task/${taskId}/files`);
export const uploadProfilePicture = (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/upload/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// ============================================
// COMMENT SERVICES
// ============================================
export const getComments = (taskId) => api.get(`/comments/task/${taskId}`);
export const createComment = (taskId, comment) => api.post(`/comments/task/${taskId}`, { comment });
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// ============================================
// CHAT SERVICES
// ============================================
export const getChatMessages = (projectId) => api.get(`/chat/project/${projectId}`);
export const sendChatMessage = (projectId, message, file_url) => api.post('/chat', { project_id: projectId, message, file_url });

// ============================================
// SUBMISSION SERVICES
// ============================================
export const submitProject = (projectId, title, description, file) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) formData.append('file', file);
    return api.post(`/submissions/project/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const getSubmissionStatus = (projectId) => api.get(`/submissions/project/${projectId}`);

// ============================================
// FRIEND SERVICES
// ============================================
export const getFriendSuggestions = () => api.get('/friends/suggestions');
export const sendFriendRequest = (userId) => api.post(`/friends/request/${userId}`);
export const getPendingRequests = () => api.get('/friends/requests/pending');
export const acceptFriendRequest = (requestId) => api.put(`/friends/request/${requestId}/accept`);
export const getFriends = () => api.get('/friends/list');

export default api;