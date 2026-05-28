import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  FolderKanban, Users, CheckSquare, Calendar, 
  Search, Bell, Plus, ChevronLeft, Menu, X, 
  TrendingUp, UserPlus, Trash2, 
  CheckCircle2, Circle, Sparkles, 
  Send, FileCheck, Paperclip, MessageCircle,
  ArrowRight
} from 'lucide-react';
import { 
  getMe, getProjects, createProject, deleteProject, 
  getTasks, createTask, updateTask, deleteTask, 
  uploadFile, getTaskFiles, getProjectMembers, 
  addProjectMember, removeProjectMember,
  getChatMessages, sendChatMessage,
  submitProject, getSubmissionStatus,
  getFriendSuggestions, sendFriendRequest, getPendingRequests, acceptFriendRequest, getFriends
} from '../services/api';

const socket = io('http://localhost:5000');

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [taskFiles, setTaskFiles] = useState({});
  const [isOwner, setIsOwner] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [submissionData, setSubmissionData] = useState({ title: '', description: '', file: null });
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPanelOpen, setChatPanelOpen] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Checklist state
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showChecklistInput, setShowChecklistInput] = useState(null);
  
  // Friends state
  const [suggestions, setSuggestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendPanelOpen, setFriendPanelOpen] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      setSidebarOpen(!isMobile);
      if (isMobile) { setChatPanelOpen(false); setFriendPanelOpen(false); }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (selectedProject) {
      socket.emit('join-project', selectedProject.id);
      socket.on('new-message', (data) => {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          message: data.message,
          user_id: data.userId,
          name: data.userName,
          created_at: data.createdAt
        }]);
      });
      return () => { socket.off('new-message'); };
    }
  }, [selectedProject]);

  const loadData = useCallback(async () => {
    try {
      const userRes = await getMe();
      setUser(userRes.data.user);
      const projectsRes = await getProjects();
      setProjects(projectsRes.data.projects || []);
      const suggestionsRes = await getFriendSuggestions();
      setSuggestions(suggestionsRes.data.suggestions || []);
      const pendingRes = await getPendingRequests();
      setPendingRequests(pendingRes.data.requests || []);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    loadData();
  }, [navigate, loadData]);

  const loadProjectMembers = async (projectId) => {
    try {
      const res = await getProjectMembers(projectId);
      setMembers(res.data.members || []);
      const currentUserIsOwner = res.data.members?.some(m => m.id === user?.id && m.role === 'owner');
      setIsOwner(currentUserIsOwner);
    } catch (err) { console.error(err); setMembers([]); setIsOwner(false); }
  };

  const loadTasks = async (projectId) => {
    try {
      const tasksRes = await getTasks(projectId);
      setTasks(tasksRes.data.tasks || []);
      for (const task of tasksRes.data.tasks || []) {
        const filesRes = await getTaskFiles(task.id);
        setTaskFiles(prev => ({ ...prev, [task.id]: filesRes.data.files || [] }));
      }
    } catch (err) { console.error(err); }
  };

  const loadChatMessages = async (projectId) => {
    try {
      const res = await getChatMessages(projectId);
      setChatMessages(res.data.messages || []);
    } catch (err) { console.error(err); }
  };

  const loadSubmissionStatus = async (projectId) => {
    try {
      const res = await getSubmissionStatus(projectId);
      setSubmissionStatus(res.data.submission);
    } catch (err) { console.error(err); }
  };

  const handleProjectClick = async (project) => {
    setSelectedProject(project);
    await loadProjectMembers(project.id);
    await loadTasks(project.id);
    await loadChatMessages(project.id);
    await loadSubmissionStatus(project.id);
    setActiveTab('tasks');
    if (window.innerWidth < 768) setMobileMenuOpen(false);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(newProject);
      setShowProjectModal(false);
      setNewProject({ name: '', description: '', deadline: '' });
      loadData();
    } catch (err) { alert('Failed to create project'); }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Delete this project?')) {
      try {
        await deleteProject(id);
        if (selectedProject?.id === id) { setSelectedProject(null); setTasks([]); setMembers([]); }
        loadData();
      } catch (err) { alert('Failed to delete project'); }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await createTask({ ...newTask, project_id: selectedProject.id });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      await loadTasks(selectedProject.id);
      loadData();
    } catch (err) { alert('Failed to create task'); }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/tasks/${taskId}`, 
        { status: newStatus },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      if (response.data.success) {
        await loadTasks(selectedProject.id);
        loadData();
      }
    } catch (err) { 
      console.error('Error updating task:', err);
      alert('Failed to update task status'); 
    }
  };

  const handleToggleTaskComplete = async (taskId, isCompleted) => {
    try {
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`, 
        { is_completed: isCompleted, status: isCompleted ? 'done' : 'todo' },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      await loadTasks(selectedProject.id);
      loadData();
    } catch (err) { alert('Failed to update task'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteTask(taskId);
        await loadTasks(selectedProject.id);
        loadData();
      } catch (err) { alert('Failed to delete task'); }
    }
  };

  const handleFileUpload = async (taskId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadFile(taskId, file);
      alert('File uploaded!');
      const filesRes = await getTaskFiles(taskId);
      setTaskFiles(prev => ({ ...prev, [taskId]: filesRes.data.files || [] }));
    } catch (err) { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleAddChecklistItem = async (taskId) => {
    if (!newChecklistItem.trim()) return;
    try {
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/checklist`, 
        { title: newChecklistItem },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      setNewChecklistItem('');
      setShowChecklistInput(null);
      await loadTasks(selectedProject.id);
    } catch (err) {
      console.error('Error adding checklist:', err);
      alert('Failed to add checklist item');
    }
  };

  const handleToggleChecklist = async (checklistId, isCompleted) => {
    try {
      await axios.put(`http://localhost:5000/api/tasks/checklist/${checklistId}`, 
        { is_completed: !isCompleted },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      await loadTasks(selectedProject.id);
    } catch (err) {
      console.error('Error toggling checklist:', err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await addProjectMember(selectedProject.id, newMemberEmail, 'member');
      alert('Member added!');
      setNewMemberEmail('');
      setShowMemberModal(false);
      await loadProjectMembers(selectedProject.id);
    } catch (err) { alert(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove member?')) {
      try {
        await removeProjectMember(selectedProject.id, userId);
        await loadProjectMembers(selectedProject.id);
      } catch (err) { alert('Failed to remove member'); }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProject) return;
    try {
      await sendChatMessage(selectedProject.id, newMessage, null);
      socket.emit('send-message', { 
        projectId: selectedProject.id, 
        message: newMessage, 
        userId: user?.id, 
        userName: user?.name 
      });
      setNewMessage('');
      await loadChatMessages(selectedProject.id);
    } catch (err) { console.error(err); }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      alert('Request sent!');
      const suggestionsRes = await getFriendSuggestions();
      setSuggestions(suggestionsRes.data.suggestions || []);
      const pendingRes = await getPendingRequests();
      setPendingRequests(pendingRes.data.requests || []);
    } catch (err) { alert('Failed to send request'); }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      alert('Friend added!');
      const suggestionsRes = await getFriendSuggestions();
      setSuggestions(suggestionsRes.data.suggestions || []);
      const pendingRes = await getPendingRequests();
      setPendingRequests(pendingRes.data.requests || []);
    } catch (err) { alert('Failed to accept'); }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await submitProject(selectedProject.id, submissionData.title, submissionData.description, submissionData.file);
      alert('Project submitted to lecturer!');
      setShowSubmitModal(false);
      setSubmissionData({ title: '', description: '', file: null });
      await loadSubmissionStatus(selectedProject.id);
    } catch (err) { alert('Failed to submit'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const member = members.find(m => m.id === userId);
    return member?.name || 'Unknown';
  };

  const getPriorityConfig = (priority) => {
    switch(priority) {
      case 'high': return { label: 'High', icon: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
      case 'medium': return { label: 'Medium', icon: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
      case 'low': return { label: 'Low', icon: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
      default: return { label: 'Medium', icon: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    }
  };

  const calculateProjectProgress = (projectTasks) => {
    if (!projectTasks || projectTasks.length === 0) return 0;
    let totalChecklist = 0;
    let completedChecklist = 0;
    projectTasks.forEach(task => {
      if (task.checklist && task.checklist.length > 0) {
        totalChecklist += task.checklist.length;
        completedChecklist += task.checklist.filter(c => c.is_completed).length;
      }
      if (task.is_completed || task.status === 'done') {
        if (!task.checklist || task.checklist.length === 0) {
          completedChecklist += 1;
          totalChecklist += 1;
        }
      } else {
        if (!task.checklist || task.checklist.length === 0) {
          totalChecklist += 1;
        }
      }
    });
    if (totalChecklist === 0) return 0;
    return Math.round((completedChecklist / totalChecklist) * 100);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  const totalTasks = projects.reduce((sum, p) => sum + (parseInt(p.task_count) || 0), 0);
  const completedTasks = projects.reduce((sum, p) => sum + (parseInt(p.completed_count) || 0), 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const projectTasksMap = {};
  tasks.forEach(t => { projectTasksMap[t.project_id] = projectTasksMap[t.project_id] || []; projectTasksMap[t.project_id].push(t); });

  return (
    <div className="dashboard">
      <div className="bg-animation">
        <div className="orb1"></div><div className="orb2"></div><div className="orb3"></div><div className="orb4"></div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
      </AnimatePresence>

      <motion.aside initial="closed" animate={sidebarOpen || mobileMenuOpen ? "open" : "closed"} variants={{ open: { x: 0 }, closed: { x: -300 } }} className="sidebar">
        <div className="sidebar-header">
          <div className="logo"><div className="logo-icon">🚀</div><span className="logo-text">TeamSync</span><span className="logo-badge">PRO</span></div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle"><ChevronLeft size={20} /></button>
          <button onClick={() => setMobileMenuOpen(false)} className="mobile-close"><X size={24} /></button>
        </div>

        <div className="user-card">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
          <div><div className="user-name">{user?.name}</div><div className="user-email">{user?.email}</div><div className="user-role"><Sparkles size={12} /> Project Manager</div></div>
        </div>

        <nav className="nav">
          <button onClick={() => setActiveTab('projects')} className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}><FolderKanban size={22} /><span>Projects</span><span className="nav-count">{projects.length}</span></button>
          <button onClick={() => setActiveTab('team')} className={`nav-item ${activeTab === 'team' ? 'active' : ''}`}><Users size={22} /><span>Team</span><span className="nav-count">{members.length}</span></button>
          <button onClick={() => setActiveTab('tasks')} className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}><CheckSquare size={22} /><span>Tasks</span><span className="nav-count">{tasks.filter(t => !t.is_completed && t.status !== 'done').length}</span></button>
        </nav>

        <div className="sidebar-footer"><button onClick={handleLogout} className="logout-btn">🚪 Logout</button></div>
      </motion.aside>

      <main className={`main ${sidebarOpen ? 'main-open' : ''}`}>
        <header className="header">
          <div className="header-left">
            <button onClick={() => setMobileMenuOpen(true)} className="mobile-menu"><Menu size={24} /></button>
            <div>
              <h1 className="title">{activeTab === 'projects' && 'Projects'}{activeTab === 'team' && (selectedProject ? `${selectedProject.name} · Team` : 'Team Management')}{activeTab === 'tasks' && (selectedProject ? `${selectedProject.name} · Tasks` : 'Task Board')}</h1>
              <p className="subtitle">{activeTab === 'projects' && 'Manage all your group projects'}{activeTab === 'team' && (selectedProject ? 'Invite team members' : 'Select a project')}{activeTab === 'tasks' && (selectedProject ? `Progress: ${calculateProjectProgress(projectTasksMap[selectedProject?.id] || [])}% complete` : 'Select a project')}</p>
            </div>
          </div>
          <div className="header-right">
            <div className="search"><Search size={20} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            {activeTab === 'projects' && <button onClick={() => setShowProjectModal(true)} className="btn-primary"><Plus size={18} />New Project</button>}
            {activeTab === 'team' && selectedProject && isOwner && <button onClick={() => setShowMemberModal(true)} className="btn-primary"><UserPlus size={18} />Invite</button>}
            {activeTab === 'tasks' && selectedProject && <>
              <button onClick={() => setShowTaskModal(true)} className="btn-primary"><Plus size={18} />Task</button>
              <button onClick={() => setShowSubmitModal(true)} className="btn-primary submit"><FileCheck size={18} />Submit</button>
            </>}
          </div>
        </header>

        <div className="stats">
          <div className="stat"><div className="stat-icon"><FolderKanban size={28} /></div><div><div className="stat-value">{projects.length}</div><div className="stat-label">Projects</div></div></div>
          <div className="stat"><div className="stat-icon"><CheckSquare size={28} /></div><div><div className="stat-value">{totalTasks}</div><div className="stat-label">Tasks</div></div></div>
          <div className="stat"><div className="stat-icon"><TrendingUp size={28} /></div><div><div className="stat-value">{completionRate}%</div><div className="stat-label">Complete</div></div></div>
          <div className="stat"><div className="stat-icon"><Users size={28} /></div><div><div className="stat-value">{members.length || 1}</div><div className="stat-label">Members</div></div></div>
        </div>

        {activeTab === 'projects' && (
          <div className="projects">
            {projects.length === 0 ? (
              <div className="empty"><div className="empty-icon">🚀</div><h3>Create your first project</h3><button onClick={() => setShowProjectModal(true)} className="empty-btn">+ New Project</button></div>
            ) : (
              <div className="projects-grid">
                {projects.map(p => {
                  const prog = calculateProjectProgress(projectTasksMap[p.id] || []);
                  return (
                    <div key={p.id} className="project-card" onClick={() => handleProjectClick(p)}>
                      <div className="project-card-glow"></div>
                      <div className="project-card-header"><div className="project-icon">📁</div><button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="project-delete"><Trash2 size={16} /></button></div>
                      <h3 className="project-name">{p.name}</h3>
                      <p className="project-desc">{p.description || 'No description'}</p>
                      <div className="project-team"><div className="project-avatars"><div className="project-avatar">{user?.name?.charAt(0)}</div></div><span>{p.member_count || 1} members</span></div>
                      <div className="project-progress"><div className="project-progress-header"><span>Progress</span><span>{prog}%</span></div><div className="project-progress-bar"><div className="project-progress-fill" style={{ width: `${prog}%` }}></div></div></div>
                      <button className="project-btn">Open <ArrowRight size={16} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team">
            {!selectedProject ? (
              <div className="empty"><div className="empty-icon">👥</div><h3>Select a project</h3><button onClick={() => setActiveTab('projects')} className="empty-btn">View Projects</button></div>
            ) : (
              <div className="members">
                {members.map(m => (
                  <div key={m.id} className="member-card">
                    <div className="member-avatar">{m.name.charAt(0)}{m.online && <div className="member-online"></div>}</div>
                    <div><div className="member-name">{m.name}</div><div className="member-email">{m.email}</div><div className={`member-role ${m.role === 'owner' ? 'owner' : ''}`}>{m.role === 'owner' ? '👑 Owner' : '🤝 Member'}</div></div>
                    {isOwner && m.role !== 'owner' && <button onClick={() => handleRemoveMember(m.id)} className="member-remove">Remove</button>}
                  </div>
                ))}
                {isOwner && <div className="invite-card" onClick={() => setShowMemberModal(true)}><div className="invite-icon">+</div><div><div className="invite-title">Invite Member</div><div className="invite-subtitle">Add by email</div></div></div>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-layout">
            <div className="kanban-container">
              {!selectedProject ? (
                <div className="empty"><div className="empty-icon">✅</div><h3>Select a project</h3><button onClick={() => setActiveTab('projects')} className="empty-btn">View Projects</button></div>
              ) : tasks.length === 0 ? (
                <div className="empty"><div className="empty-icon">📝</div><h3>No tasks yet</h3><button onClick={() => setShowTaskModal(true)} className="empty-btn">+ New Task</button></div>
              ) : (
                <div className="kanban">
                  {[
                    { status: 'todo', title: 'To Do', icon: '📝' },
                    { status: 'in_progress', title: 'In Progress', icon: '🔄' },
                    { status: 'review', title: 'Review', icon: '👀' },
                    { status: 'done', title: 'Done', icon: '✅' }
                  ].map(col => {
                    const colTasks = tasks.filter(t => (t.status || 'todo') === col.status);
                    return (
                      <div key={col.status} className="kanban-col">
                        <div className="kanban-header"><span>{col.icon}</span><span>{col.title}</span><span className="kanban-count">{colTasks.length}</span></div>
                        <div className="kanban-tasks">
                          {colTasks.map(task => (
                            <div key={task.id} className="task-card">
                              <div className="task-header">
                                <div className="task-title">
                                  <button onClick={() => handleToggleTaskComplete(task.id, !task.is_completed)} className="task-checkbox">
                                    {task.is_completed || task.status === 'done' ? <CheckCircle2 size={18} color="#10b981" /> : <Circle size={18} />}
                                  </button>
                                  <h4 style={{ textDecoration: task.is_completed || task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</h4>
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} className="task-delete"><Trash2 size={14} /></button>
                              </div>
                              
                              {task.description && <p className="task-desc">{task.description}</p>}
                              
                              {task.checklist && task.checklist.length > 0 && (
                                <div className="task-checklist">
                                  <div className="task-checklist-title">
                                    📋 Subtasks ({task.checklist.filter(c => c.is_completed).length}/{task.checklist.length})
                                  </div>
                                  {task.checklist.map(item => (
                                    <div key={item.id} className="task-checklist-item">
                                      <button onClick={() => handleToggleChecklist(item.id, item.is_completed)} className="checklist-checkbox">
                                        {item.is_completed ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} />}
                                      </button>
                                      <span style={{ textDecoration: item.is_completed ? 'line-through' : 'none', opacity: item.is_completed ? 0.6 : 1 }}>
                                        {item.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="task-add-subtask">
                                {showChecklistInput === task.id ? (
                                  <div className="task-add-subtask-input">
                                    <input 
                                      type="text" 
                                      placeholder="Enter subtask..." 
                                      value={newChecklistItem}
                                      onChange={(e) => setNewChecklistItem(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem(task.id)}
                                      autoFocus
                                    />
                                    <button onClick={() => handleAddChecklistItem(task.id)}>Add</button>
                                    <button onClick={() => { setShowChecklistInput(null); setNewChecklistItem(''); }}>Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setShowChecklistInput(task.id)} className="task-add-subtask-btn">
                                    + Add Subtask
                                  </button>
                                )}
                              </div>
                              
                              <div className="task-meta">
                                <span className={`task-priority ${task.priority}`}>
                                  {task.priority === 'high' ? '🔴 High' : task.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                                </span>
                                <span className="task-assignee"><Users size={12} /> {getUserName(task.assigned_to)}</span>
                                {task.due_date && <span className="task-due"><Calendar size={12} /> {new Date(task.due_date).toLocaleDateString()}</span>}
                              </div>
                              
                              <div className="task-actions">
                                <label className="task-attach"><Paperclip size={12} /> Attach<input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(task.id, e.target.files[0])} disabled={uploading} /></label>
                                <select value={task.status || 'todo'} onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)} className="task-select">
                                  <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                                </select>
                              </div>
                              
                              {taskFiles[task.id]?.length > 0 && (
                                <div className="task-files">
                                  <div>📎 Attachments ({taskFiles[task.id].length})</div>
                                  <div className="task-files-list">
                                    {taskFiles[task.id].map(f => <a key={f.id} href={`http://localhost:5000${f.file_url}`} target="_blank" rel="noreferrer" className="task-file">📄 {f.comment?.substring(0, 30)}</a>)}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`chat-panel ${chatPanelOpen ? '' : 'closed'}`}>
              <div className="chat-header"><h3><MessageCircle size={18} /> Chat</h3><button onClick={() => setChatPanelOpen(!chatPanelOpen)} className="chat-toggle">{chatPanelOpen ? '→' : '←'}</button></div>
              {chatPanelOpen && (
                <>
                  <div className="chat-messages">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`chat-msg ${msg.user_id === user?.id ? 'own' : ''}`}>
                        <div className="chat-avatar">{msg.name?.charAt(0) || 'U'}</div>
                        <div className="chat-bubble"><div className="chat-name">{msg.name}</div><div>{msg.message}</div><div className="chat-time">{new Date(msg.created_at).toLocaleTimeString()}</div></div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="chat-input"><input type="text" placeholder="Type message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} /><button onClick={handleSendMessage}><Send size={18} /></button></div>
                </>
              )}
            </div>

            <div className={`friends-panel ${friendPanelOpen ? '' : 'closed'}`}>
              <div className="friends-header"><h3><UserPlus size={18} /> Connect</h3><button onClick={() => setFriendPanelOpen(!friendPanelOpen)} className="friends-toggle">{friendPanelOpen ? '→' : '←'}</button></div>
              {friendPanelOpen && (
                <>
                  <div className="friends-section"><h4>Suggestions</h4>{suggestions.map(s => (<div key={s.id} className="friend-card"><div className="friend-avatar">{s.name?.charAt(0)}</div><div><div className="friend-name">{s.name}</div><div className="friend-email">{s.email}</div></div><button onClick={() => handleSendFriendRequest(s.id)} className="friend-add"><UserPlus size={14} /></button></div>))}</div>
                  <div className="friends-section"><h4>Requests</h4>{pendingRequests.map(r => (<div key={r.id} className="friend-card"><div className="friend-avatar">{r.name?.charAt(0)}</div><div><div className="friend-name">{r.name}</div><div className="friend-email">{r.email}</div></div><button onClick={() => handleAcceptRequest(r.id)} className="friend-accept"><CheckCircle2 size={14} /></button></div>))}</div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showProjectModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal" onClick={() => setShowProjectModal(false)}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}><div className="modal-header"><h2>New Project</h2><button onClick={() => setShowProjectModal(false)}>×</button></div><form onSubmit={handleCreateProject}><input type="text" placeholder="Project name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} required /><textarea placeholder="Description" rows="3" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} /><input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} /><div className="modal-footer"><button type="button" onClick={() => setShowProjectModal(false)}>Cancel</button><button type="submit">Create</button></div></form></motion.div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showTaskModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal" onClick={() => setShowTaskModal(false)}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}><div className="modal-header"><h2>New Task</h2><button onClick={() => setShowTaskModal(false)}>×</button></div><form onSubmit={handleCreateTask}><input type="text" placeholder="Task title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required /><textarea placeholder="Description" rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} /><select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><select value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}><option value="">Assign to...</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} /><div className="modal-footer"><button type="button" onClick={() => setShowTaskModal(false)}>Cancel</button><button type="submit">Create</button></div></form></motion.div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showMemberModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal" onClick={() => setShowMemberModal(false)}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}><div className="modal-header"><h2>Invite Member</h2><button onClick={() => setShowMemberModal(false)}>×</button></div><form onSubmit={handleAddMember}><input type="email" placeholder="Email address" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required /><p className="modal-hint">User must have an account</p><div className="modal-footer"><button type="button" onClick={() => setShowMemberModal(false)}>Cancel</button><button type="submit">Invite</button></div></form></motion.div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmitModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal" onClick={() => setShowSubmitModal(false)}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}><div className="modal-header"><h2>Submit to Lecturer</h2><button onClick={() => setShowSubmitModal(false)}>×</button></div><form onSubmit={handleSubmitProject}><input type="text" placeholder="Submission title" value={submissionData.title} onChange={e => setSubmissionData({...submissionData, title: e.target.value})} required /><textarea placeholder="Notes" rows="3" value={submissionData.description} onChange={e => setSubmissionData({...submissionData, description: e.target.value})} /><input type="file" accept=".pdf,.doc,.docx,.zip" onChange={e => setSubmissionData({...submissionData, file: e.target.files[0]})} /><div className="modal-footer"><button type="button" onClick={() => setShowSubmitModal(false)}>Cancel</button><button type="submit">Submit</button></div></form></motion.div></motion.div>}
      </AnimatePresence>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0a0a1a; }
        .dashboard { min-height: 100vh; position: relative; }
        .bg-animation { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .orb1, .orb2, .orb3, .orb4 { position: absolute; border-radius: 50%; animation: float 20s infinite; }
        .orb1 { top: -20%; left: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent); }
        .orb2 { bottom: -20%; right: -10%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(6,182,212,0.1), transparent); animation-delay: 2s; }
        .orb3 { top: 40%; left: 20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(245,158,11,0.08), transparent); animation-delay: 4s; }
        .orb4 { bottom: 30%; right: 20%; width: 350px; height: 350px; background: radial-gradient(circle, rgba(236,72,153,0.08), transparent); animation-delay: 6s; }
        @keyframes float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,30px); } }
        .loading-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a0a1a, #1a1a2e); }
        .loading-spinner { width: 50px; height: 50px; border: 3px solid rgba(139,92,246,0.2); border-top-color: #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: 280px; background: rgba(10,10,26,0.95); backdrop-filter: blur(20px); border-right: 1px solid rgba(139,92,246,0.2); z-index: 50; transition: transform 0.3s; }
        .sidebar-header { display: flex; justify-content: space-between; padding: 24px 20px; border-bottom: 1px solid rgba(139,92,246,0.15); }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .logo-text { font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #fff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .logo-badge { font-size: 10px; background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px; }
        .sidebar-toggle { background: rgba(255,255,255,0.05); border: none; border-radius: 10px; padding: 8px; cursor: pointer; color: #94a3b8; }
        .mobile-close { display: none; background: none; border: none; color: #94a3b8; }
        @media (max-width: 1024px) { .sidebar-toggle { display: none; } .mobile-close { display: block; } }
        .user-card { margin: 20px; padding: 16px; background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05)); border: 1px solid rgba(139,92,246,0.2); border-radius: 20px; display: flex; align-items: center; gap: 14px; }
        .user-avatar { width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; }
        .user-name { font-size: 15px; font-weight: 600; color: white; }
        .user-email { font-size: 11px; color: #94a3b8; }
        .user-role { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; padding: 2px 10px; background: rgba(139,92,246,0.2); border-radius: 20px; font-size: 10px; color: #a855f7; }
        .nav { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
        .nav-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: transparent; border: none; border-radius: 14px; cursor: pointer; font-size: 14px; font-weight: 500; color: #94a3b8; width: 100%; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
        .nav-item.active { background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1)); color: #a855f7; border: 1px solid rgba(139,92,246,0.3); }
        .nav-count { margin-left: auto; padding: 2px 8px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 11px; }
        .sidebar-footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; border-top: 1px solid rgba(139,92,246,0.15); }
        .logout-btn { width: 100%; padding: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 14px; cursor: pointer; color: #ef4444; font-weight: 500; }
        .main { transition: margin-left 0.3s; padding: 24px 32px; position: relative; z-index: 1; }
        .main-open { margin-left: 280px; }
        @media (max-width: 1024px) { .main { margin-left: 0 !important; padding: 16px; } }
        .header { display: flex; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .mobile-menu { display: none; background: rgba(255,255,255,0.05); border: none; border-radius: 12px; padding: 10px; cursor: pointer; color: white; }
        @media (max-width: 1024px) { .mobile-menu { display: block; } }
        .title { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #fff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { font-size: 14px; color: #94a3b8; margin-top: 6px; }
        .header-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .search { display: flex; align-items: center; gap: 10px; padding: 10px 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.2); border-radius: 18px; width: 260px; }
        .search input { background: none; border: none; outline: none; color: white; flex: 1; }
        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border: none; border-radius: 18px; color: white; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,92,246,0.3); }
        .submit { background: linear-gradient(135deg, #10b981, #059669); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(139,92,246,0.15); border-radius: 24px; padding: 20px; display: flex; align-items: center; gap: 18px; transition: 0.2s; }
        .stat:hover { transform: translateY(-4px); border-color: rgba(139,92,246,0.3); }
        .stat-icon { width: 52px; height: 52px; background: rgba(139,92,246,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #a855f7; }
        .stat-value { font-size: 28px; font-weight: 700; color: white; }
        .stat-label { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }
        .project-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(139,92,246,0.15); border-radius: 24px; padding: 22px; cursor: pointer; position: relative; overflow: hidden; transition: 0.3s; }
        .project-card:hover { transform: translateY(-8px); border-color: rgba(139,92,246,0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .project-card-glow { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #8b5cf6, #a855f7); opacity: 0; transition: 0.3s; }
        .project-card:hover .project-card-glow { opacity: 1; }
        .project-card-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
        .project-icon { font-size: 44px; }
        .project-delete { background: rgba(239,68,68,0.1); border: none; border-radius: 10px; padding: 6px 10px; cursor: pointer; color: #ef4444; opacity: 0; transition: 0.3s; }
        .project-card:hover .project-delete { opacity: 1; }
        .project-name { font-size: 20px; font-weight: 700; color: white; margin-bottom: 8px; }
        .project-desc { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
        .project-team { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .project-avatars { display: flex; }
        .project-avatar { width: 34px; height: 34px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-left: -8px; border: 2px solid #1a1a2e; }
        .project-avatar:first-child { margin-left: 0; }
        .project-progress { margin-bottom: 20px; }
        .project-progress-header { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 6px; }
        .project-progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
        .project-progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #6366f1); border-radius: 10px; transition: width 0.5s; }
        .project-btn { width: 100%; padding: 10px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); border-radius: 16px; color: #a855f7; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .project-btn:hover { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; }
        .members { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
        .member-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(139,92,246,0.15); border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 16px; transition: 0.2s; }
        .member-card:hover { transform: translateY(-3px); border-color: rgba(139,92,246,0.3); }
        .member-avatar { position: relative; width: 56px; height: 56px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; }
        .member-online { position: absolute; bottom: 3px; right: 3px; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid #1a1a2e; }
        .member-name { font-size: 16px; font-weight: 600; color: white; }
        .member-email { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .member-role { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; margin-top: 6px; background: rgba(139,92,246,0.2); color: #a855f7; }
        .member-role.owner { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .member-remove { padding: 6px 14px; background: rgba(239,68,68,0.15); border: none; border-radius: 10px; color: #ef4444; cursor: pointer; }
        .invite-card { background: rgba(255,255,255,0.02); border: 2px dashed rgba(139,92,246,0.3); border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: 0.2s; }
        .invite-card:hover { border-color: #8b5cf6; background: rgba(139,92,246,0.05); transform: translateY(-3px); }
        .invite-icon { width: 56px; height: 56px; background: rgba(139,92,246,0.15); border-radius: 18px; display: flex; align-items: center; justify-content; center; font-size: 24px; color: #8b5cf6; }
        .invite-title { font-size: 16px; font-weight: 600; color: white; }
        .invite-subtitle { font-size: 11px; color: #94a3b8; margin-top: 3px; }
        .tasks-layout { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
        .kanban-container { flex: 2; min-width: 300px; overflow-x: auto; }
        .chat-panel, .friends-panel { width: 320px; background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(139,92,246,0.2); border-radius: 20px; transition: 0.3s; flex-shrink: 0; }
        .chat-panel.closed, .friends-panel.closed { width: 50px; }
        @media (max-width: 1400px) { .tasks-layout { flex-direction: column; } .chat-panel, .friends-panel { width: 100%; } .chat-panel.closed, .friends-panel.closed { width: 100%; height: 56px; } }
        .kanban { display: flex; gap: 20px; padding-bottom: 10px; }
        .kanban-col { min-width: 320px; background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(139,92,246,0.15); border-radius: 20px; padding: 16px; }
        .kanban-header { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 14px; margin-bottom: 16px; background: rgba(255,255,255,0.02); }
        .kanban-count { margin-left: auto; padding: 2px 10px; background: rgba(139,92,246,0.2); border-radius: 20px; font-size: 12px; color: #a855f7; }
        .kanban-tasks { display: flex; flex-direction: column; gap: 14px; max-height: calc(100vh - 260px); overflow-y: auto; }
        .task-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.1); border-radius: 16px; padding: 16px; transition: 0.2s; }
        .task-card:hover { transform: translateY(-3px); border-color: rgba(139,92,246,0.3); background: rgba(255,255,255,0.08); }
        .task-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .task-title { display: flex; align-items: center; gap: 10px; }
        .task-checkbox { background: none; border: none; cursor: pointer; padding: 0; }
        .task-title h4 { font-size: 14px; font-weight: 600; color: white; margin: 0; }
        .task-delete { background: none; border: none; cursor: pointer; color: #94a3b8; opacity: 0; transition: 0.2s; }
        .task-card:hover .task-delete { opacity: 1; }
        .task-desc { font-size: 12px; color: #94a3b8; margin-bottom: 10px; }
        .task-checklist { margin: 10px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 12px; }
        .task-checklist-title { font-size: 11px; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
        .task-checklist-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; color: #cbd5e1; }
        .checklist-checkbox { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; }
        .task-add-subtask { margin: 8px 0; }
        .task-add-subtask-btn { background: none; border: 1px dashed rgba(139,92,246,0.3); border-radius: 8px; padding: 4px 10px; font-size: 11px; color: #a855f7; cursor: pointer; width: 100%; text-align: center; }
        .task-add-subtask-input { display: flex; gap: 6px; align-items: center; }
        .task-add-subtask-input input { flex: 1; padding: 6px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; color: white; font-size: 11px; }
        .task-add-subtask-input button { padding: 4px 12px; background: rgba(139,92,246,0.2); border: none; border-radius: 8px; color: #a855f7; cursor: pointer; font-size: 11px; }
        .task-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
        .task-priority { padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .task-assignee, .task-due { padding: 3px 10px; background: rgba(255,255,255,0.05); border-radius: 20px; font-size: 10px; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
        .task-actions { display: flex; gap: 10px; margin-top: 8px; }
        .task-attach { padding: 5px 12px; background: rgba(139,92,246,0.15); border-radius: 12px; font-size: 10px; cursor: pointer; color: #a855f7; display: inline-flex; align-items: center; gap: 5px; }
        .task-select { padding: 5px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.2); border-radius: 12px; font-size: 10px; color: white; cursor: pointer; }
        .task-files { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(139,92,246,0.1); font-size: 11px; color: #94a3b8; }
        .task-files-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .task-file { font-size: 10px; color: #60a5fa; text-decoration: none; background: rgba(96,165,250,0.1); padding: 3px 10px; border-radius: 14px; }
        .chat-header, .friends-header { display: flex; justify-content: space-between; padding: 14px; border-bottom: 1px solid rgba(139,92,246,0.1); }
        .chat-header h3, .friends-header h3 { display: flex; align-items: center; gap: 8px; color: white; font-size: 14px; margin: 0; }
        .chat-toggle, .friends-toggle { background: rgba(255,255,255,0.05); border: none; border-radius: 8px; padding: 4px 8px; cursor: pointer; color: #94a3b8; }
        .chat-messages { height: 380px; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .chat-msg { display: flex; gap: 10px; }
        .chat-msg.own { flex-direction: row-reverse; }
        .chat-avatar { width: 30px; height: 30px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; }
        .chat-bubble { max-width: 70%; background: rgba(255,255,255,0.05); border-radius: 14px; padding: 8px 12px; }
        .chat-msg.own .chat-bubble { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
        .chat-name { font-size: 9px; font-weight: 600; color: #a855f7; margin-bottom: 4px; }
        .chat-msg.own .chat-name { color: white; }
        .chat-time { font-size: 8px; color: #64748b; margin-top: 4px; }
        .chat-input { display: flex; gap: 8px; padding: 14px; border-top: 1px solid rgba(139,92,246,0.1); }
        .chat-input input { flex: 1; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.2); border-radius: 20px; color: white; outline: none; }
        .chat-input button { padding: 8px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border: none; border-radius: 20px; cursor: pointer; color: white; }
        .friends-section { padding: 14px; border-bottom: 1px solid rgba(139,92,246,0.1); }
        .friends-section h4 { color: #94a3b8; font-size: 10px; margin-bottom: 10px; text-transform: uppercase; }
        .friend-card { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 8px; }
        .friend-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .friend-name { font-size: 12px; font-weight: 500; color: white; }
        .friend-email { font-size: 9px; color: #64748b; }
        .friend-add, .friend-accept { padding: 5px; background: rgba(139,92,246,0.2); border: none; border-radius: 8px; cursor: pointer; color: #a855f7; }
        .friend-accept { background: rgba(34,197,94,0.2); color: #22c55e; }
        .empty { text-align: center; padding: 60px; background: rgba(255,255,255,0.03); border-radius: 24px; }
        .empty-icon { font-size: 70px; margin-bottom: 20px; }
        .empty h3 { font-size: 22px; color: white; margin-bottom: 10px; }
        .empty-btn { padding: 10px 24px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border: none; border-radius: 16px; color: white; font-weight: 600; cursor: pointer; margin-top: 16px; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .modal-content { background: linear-gradient(135deg, #1a1a2e, #0f0f1a); border: 1px solid rgba(139,92,246,0.2); border-radius: 28px; width: 480px; max-width: 90%; max-height: 90vh; overflow: auto; }
        .modal-header { display: flex; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(139,92,246,0.15); }
        .modal-header h2 { font-size: 22px; color: white; }
        .modal-header button { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }
        .modal form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .modal input, .modal textarea, .modal select { padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.2); border-radius: 14px; color: white; outline: none; }
        .modal input:focus { border-color: #8b5cf6; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
        .modal-footer button:first-child { padding: 10px 20px; background: rgba(255,255,255,0.05); border: none; border-radius: 12px; color: #94a3b8; cursor: pointer; }
        .modal-footer button:last-child { padding: 10px 24px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; }
        .modal-hint { font-size: 11px; color: #64748b; margin-top: -8px; }
        @media (max-width: 1024px) {
          .kanban { flex-direction: column; }
          .kanban-col { min-width: 100%; }
          .projects-grid { grid-template-columns: 1fr; }
          .members { grid-template-columns: 1fr; }
          .stats { grid-template-columns: 1fr; }
          .title { font-size: 24px; }
          .search { width: 100%; }
          .header-right { flex-direction: column; width: 100%; }
          .btn-primary { width: 100%; justify-content: center; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.4); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default Dashboard;