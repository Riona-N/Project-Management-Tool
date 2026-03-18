import React, { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000'

export default function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [draggedTask, setDraggedTask] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [trendFilter, setTrendFilter] = useState('all')
  const [loginError, setLoginError] = useState('')

  const allUsers = ['student@vitapex.ac.in', 'boss@gmail.com']

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        setCurrentPage('dashboard')
        loadTasks()
      } catch (err) {
        console.error('Failed to load user:', err)
      }
    }
  }, [])

  useEffect(() => {
    if (currentPage === 'dashboard' && user) {
      loadTasks()
      const interval = setInterval(loadTasks, 5000)
      return () => clearInterval(interval)
    }
  }, [currentPage, user])

  async function loadTasks() {
    try {
      const res = await fetch(`${API_URL}/tasks`)
      const data = await res.json()
      setTasks(data || [])
      
      if (user?.role === 'employee') {
        const assignedTasks = data.filter(t => t.assignedTo === user.email && t.status !== 'done')
        setNotifications(assignedTasks)
      }
    } catch (err) {
      console.error('Error loading tasks:', err)
    }
  }

  async function handleLogin() {
    setLoginError('')

    // Validation
    if (!loginEmail.trim()) {
      setLoginError('Please enter your email')
      return
    }

    if (!loginPassword.trim()) {
      setLoginError('Please enter your password')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(loginEmail)) {
      setLoginError('Please enter a valid email address')
      return
    }

    if (loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters')
      return
    }

    // Send login request to backend
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Save user to localStorage
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        setUser(data.user)
        setCurrentPage('dashboard')
        setLoginEmail('')
        setLoginPassword('')
        loadTasks()
      } else {
        setLoginError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setLoginError('Login failed. Please check if the backend is running.')
    }
  }

  function handleLogout() {
    localStorage.removeItem('currentUser')
    setUser(null)
    setCurrentPage('login')
    setLoginEmail('')
    setLoginPassword('')
    setLoginError('')
    setNotifications([])
  }

  async function addTask() {
    if (!newTaskTitle.trim()) {
      alert('Please enter a task title')
      return
    }

    if (user?.role === 'admin' && !newTaskAssignedTo.trim()) {
      alert('Please select who to assign this task to')
      return
    }

    try {
      const taskData = {
        title: newTaskTitle,
        status: 'todo',
        createdBy: user.email,
        assignedTo: user?.role === 'admin' ? newTaskAssignedTo : user.email,
        priority: newTaskPriority
      }

      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      const responseData = await res.json()
      
      if (res.ok) {
        setNewTaskTitle('')
        setNewTaskAssignedTo('')
        setNewTaskPriority('medium')
        loadTasks()
      } else {
        console.error('Backend error:', responseData)
        alert('Error creating task: ' + (responseData.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Error adding task:', err)
      alert('Error adding task: ' + err.message)
    }
  }

  async function updateTaskStatus(taskId, newStatus) {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        loadTasks()
      }
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  async function deleteTask(taskId) {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' })
        if (res.ok) {
          loadTasks()
        }
      } catch (err) {
        console.error('Error deleting task:', err)
      }
    }
  }

  function handleDragStart(e, task) {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e, newStatus) {
    e.preventDefault()
    if (draggedTask) {
      updateTaskStatus(draggedTask._id, newStatus)
      setDraggedTask(null)
    }
  }

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'inProgress'),
    done: tasks.filter(t => t.status === 'done')
  }

  const filteredTasksByStatus = {
    todo: filterPriority === 'all' ? tasksByStatus.todo : tasksByStatus.todo.filter(t => t.priority === filterPriority),
    inProgress: filterPriority === 'all' ? tasksByStatus.inProgress : tasksByStatus.inProgress.filter(t => t.priority === filterPriority),
    done: filterPriority === 'all' ? tasksByStatus.done : tasksByStatus.done.filter(t => t.priority === filterPriority)
  }

  const getUniqueUsers = () => {
    const users = new Set()
    tasks.forEach(t => {
      if (t.createdBy) users.add(t.createdBy)
      if (t.assignedTo) users.add(t.assignedTo)
    })
    return Array.from(users).sort()
  }

  const filteredTasksForAnalytics = filterUser === 'all' ? tasks : tasks.filter(t => t.createdBy === filterUser || t.assignedTo === filterUser)

  const getCompletionTrendData = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      last7Days.push(date)
    }

    const trendData = last7Days.map(date => {
      const dayStart = new Date(date)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const tasksCreatedToday = filteredTasksForAnalytics.filter(t => {
        const taskDate = new Date(t.createdAt)
        return taskDate >= dayStart && taskDate <= dayEnd
      }).length

      const tasksCompletedByDay = filteredTasksForAnalytics.filter(t => {
        const taskDate = new Date(t.createdAt)
        return t.status === 'done' && taskDate <= dayEnd
      }).length

      const tasksInProgressByDay = filteredTasksForAnalytics.filter(t => {
        const taskDate = new Date(t.createdAt)
        return t.status === 'inProgress' && taskDate <= dayEnd
      }).length

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created: tasksCreatedToday,
        completed: tasksCompletedByDay,
        inProgress: tasksInProgressByDay,
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
      }
    })

    return trendData
  }

  const completionTrend = getCompletionTrendData()
  const maxValue = Math.max(
    ...completionTrend.map(d => Math.max(d.created, d.completed, d.inProgress)),
    1
  )

  const stats = {
    total: filteredTasksForAnalytics.length,
    completed: filteredTasksForAnalytics.filter(t => t.status === 'done').length,
    inProgress: filteredTasksForAnalytics.filter(t => t.status === 'inProgress').length,
    pending: filteredTasksForAnalytics.filter(t => t.status === 'todo').length
  }

  if (currentPage === 'login') {
  return (
    <div className="full-container login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>TASK MASTER</h1>
          <h2>Log in to your account</h2>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter email"
              className="login-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter password"
              className="login-input"
            />
          </div>

          {loginError && <div className="error-message">{loginError}</div>}

          <button type="submit" className="login-btn">Continue</button>
        </form>

        
      </div>
    </div>
  )
}
return (
  <div className="full-container dashboard-container">
    {/* Dashboard Header */}
    <div className="dashboard-header">
      <div className="header-left">
        <h1>🎯 TASK MASTER</h1>
      </div>
      <div className="header-right">
        {/* Notification Bell */}
        {user?.role === 'employee' && (
          <div className="notification-wrapper">
            <button
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              title={`${notifications.length} pending tasks`}
            >
              🔔
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <h4>📬 Assigned Tasks</h4>
                {notifications.length === 0 ? (
                  <div className="no-notifications">No pending tasks</div>
                ) : (
                  <ul className="notification-list">
                    {notifications.map((task) => (
                      <li key={task._id} className="notification-item">
                        <div className="notification-title">{task.title}</div>
                        <small>From: {task.createdBy}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-circle">
            {user?.initials || user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.name || user?.email}</div>
            <div className="profile-role">
              {user?.role === 'admin' ? '👔 Boss' : '👤 Employee'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>

    {/* Dashboard Navigation */}
    <div className="dashboard-nav">
      <button
        className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentPage('dashboard')}
      >
        📊 Board
      </button>
      <button
        className={`nav-btn ${currentPage === 'analytics' ? 'active' : ''}`}
        onClick={() => setCurrentPage('analytics')}
      >
        📈 Reports
      </button>
    </div>

    {/* Dashboard Content */}
      {currentPage === 'dashboard' && (
        <div className="dashboard-content">
          {/* Stats */}
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">To Do</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          {/* Create Task */}
          <div className="create-task-section">
            <h3>Create New Task</h3>
            <div className="create-task-form">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="task-title-input"
              />
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="assign-select">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              {user?.role === 'admin' && (
                <select value={newTaskAssignedTo} onChange={(e) => setNewTaskAssignedTo(e.target.value)} className="assign-select">
                  <option value="">Assign to...</option>
                  {allUsers.map(u => (
                    <option key={u} value={u} disabled={u === user.email}>
                      {u === user.email ? 'Me' : u}
                    </option>
                  ))}
                </select>
              )}
              <button onClick={addTask} className="create-btn">Create</button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="filters">
            <button className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`} onClick={() => setFilterPriority('all')}>
              All
            </button>
            <button className={`filter-btn ${filterPriority === 'high' ? 'active' : ''}`} onClick={() => setFilterPriority('high')}>
              High Priority
            </button>
            <button className={`filter-btn ${filterPriority === 'medium' ? 'active' : ''}`} onClick={() => setFilterPriority('medium')}>
              Medium Priority
            </button>
            <button className={`filter-btn ${filterPriority === 'low' ? 'active' : ''}`} onClick={() => setFilterPriority('low')}>
              Low Priority
            </button>
          </div>

          <div className="kanban-board">
            {/* To Do Column */}
            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'todo')}
            >
              <div className="column-header">
                <h4>🔴To Do ({filteredTasksByStatus.todo.length})</h4>
              </div>
              <div className="tasks-container">
                {filteredTasksByStatus.todo.map(task => (
                  <div key={task._id} className="task-card" draggable onDragStart={(e) => handleDragStart(e, task)}>
                    <div className="task-header">
                      <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                      <button className="delete-task-btn" onClick={() => deleteTask(task._id)}>×</button>
                    </div>
                    <h5>{task.title}</h5>
                    <div className="task-meta">
                      <small>By: {task.createdBy}</small>
                      <br />
                      <small>For: {task.assignedTo}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'inProgress')}
            >
              <div className="column-header">
                <h4>🟡 In Progress ({filteredTasksByStatus.inProgress.length})</h4>
              </div>
              <div className="tasks-container">
                {filteredTasksByStatus.inProgress.map(task => (
                  <div key={task._id} className="task-card" draggable onDragStart={(e) => handleDragStart(e, task)}>
                    <div className="task-header">
                      <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                      <button className="delete-task-btn" onClick={() => deleteTask(task._id)}>×</button>
                    </div>
                    <h5>{task.title}</h5>
                    <div className="task-meta">
                      <small>By: {task.createdBy}</small>
                      <br />
                      <small>For: {task.assignedTo}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Done Column */}
            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'done')}
            >
              <div className="column-header">
                <h4>🟢Done ({filteredTasksByStatus.done.length})</h4>
              </div>
              <div className="tasks-container">
                {filteredTasksByStatus.done.map(task => (
                  <div key={task._id} className="task-card completed" draggable onDragStart={(e) => handleDragStart(e, task)}>
                    <div className="task-header">
                      <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                      <button className="delete-task-btn" onClick={() => deleteTask(task._id)}>×</button>
                    </div>
                    <h5>{task.title}</h5>
                    <div className="task-meta">
                      <small>By: {task.createdBy}</small>
                      <br />
                      <small>For: {task.assignedTo}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Page */}
      {currentPage === 'analytics' && (
        <div className="analytics-content">
          <h2>📊 Task Reports & Analytics</h2>
          
          {user?.role === 'admin' && (
            <div className="reports-filter" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 600, color: '#683f0b' }}>Filter by User:</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d5bdaf',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  color: '#683f0b',
                  fontWeight: '500'
                }}
              >
                <option value="all">All Users</option>
                {getUniqueUsers().map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          )}

          <div className="reports-grid">
            {/* Task Distribution Chart */}
            <div className="report-card">
              <h3>Task Status Distribution</h3>
              <div className="chart-wrapper">
                <div className="pie-chart-container">
                  {stats.total > 0 ? (
                    <>
                      <svg width="200" height="200" viewBox="0 0 200 200">
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#FF6B6B"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.pending / stats.total) * 502.4} 502.4`}
                          transform="rotate(-90 100 100)"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#4ECDC4"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.inProgress / stats.total) * 502.4} 502.4`}
                          strokeDashoffset={-((stats.pending / stats.total) * 502.4)}
                          transform="rotate(-90 100 100)"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#95E1D3"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.completed / stats.total) * 502.4} 502.4`}
                          strokeDashoffset={-((stats.pending / stats.total) * 502.4 + (stats.inProgress / stats.total) * 502.4)}
                          transform="rotate(-90 100 100)"
                        />
                      </svg>
                    </>
                  ) : (
                    <p>No tasks yet</p>
                  )}
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#FF6B6B' }}></span>
                  <span>To Do: {stats.pending}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#4ECDC4' }}></span>
                  <span>In Progress: {stats.inProgress}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#95E1D3' }}></span>
                  <span>Completed: {stats.completed}</span>
                </div>
              </div>
            </div>

            {/* Task Summary */}
            <div className="report-card">
              <h3>Summary</h3>
              <div className="summary-list">
                <div className="summary-item">
                  <span className="summary-label">Total Tasks Created</span>
                  <span className="summary-value">{stats.total}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Tasks Pending</span>
                  <span className="summary-value">{stats.pending}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Tasks In Progress</span>
                  <span className="summary-value">{stats.inProgress}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Tasks Completed</span>
                  <span className="summary-value">{stats.completed}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Completion Rate</span>
                  <span className="summary-value">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            {/* Task Completion Trend Line Graph */}
            <div className="report-card full-width">
              <h3>📈 Task Completion Trend (Last 7 Days)</h3>
              <div style={{ position: 'relative', padding: '20px', backgroundColor: '#f5ebe0ff', borderRadius: '8px' }}>
                
                {/* Filter Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setTrendFilter('all')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: trendFilter === 'all' ? '#683f0b' : '#e3d5ca',
                      color: trendFilter === 'all' ? '#fff' : '#683f0b',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                  >
                    📊 All Data
                  </button>
                  <button
                    onClick={() => setTrendFilter('created')}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid #f5d5c8',
                      borderRadius: '6px',
                      backgroundColor: trendFilter === 'created' ? '#f5d5c8' : 'transparent',
                      color: '#683f0b',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                  >
                    📋 Tasks Created
                  </button>
                  <button
                    onClick={() => setTrendFilter('completed')}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid #d5bdaf',
                      borderRadius: '6px',
                      backgroundColor: trendFilter === 'completed' ? '#d5bdaf' : 'transparent',
                      color: '#683f0b',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✅ Tasks Completed
                  </button>
                  <button
                    onClick={() => setTrendFilter('inProgress')}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid #e3d5ca',
                      borderRadius: '6px',
                      backgroundColor: trendFilter === 'inProgress' ? '#e3d5ca' : 'transparent',
                      color: '#683f0b',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                  >
                    ⚙️ In Progress
                  </button>
                </div>

                {/* SVG Line Chart for Completion Trend */}
                <svg width="100%" height="600" style={{ marginBottom: '20px' }} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((val, idx) => (
                    <line
                      key={`grid-${idx}`}
                      x1="70"
                      y1={560 - (val / 100) * 530}
                      x2="920"
                      y2={560 - (val / 100) * 530}
                      stroke="#d5bdaf"
                      strokeDasharray="4"
                      opacity={val === 0 ? 1 : 0.5}
                    />
                  ))}

                  {/* Y-axis */}
                  <line x1="70" y1="30" x2="70" y2="560" stroke="#683f0b" strokeWidth="2" />
                  {/* X-axis */}
                  <line x1="70" y1="560" x2="920" y2="560" stroke="#683f0b" strokeWidth="2" />

                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((val, idx) => (
                    <text key={`ylabel-${idx}`} x="45" y={565 - (val / 100) * 530} textAnchor="end" fontSize="16" fill="#683f0b" fontWeight="700">
                      {Math.ceil((val / 100) * maxValue)}
                    </text>
                  ))}

                  {/* Created Tasks Line */}
                  {(trendFilter === 'all' || trendFilter === 'created') && completionTrend.length > 1 && (
                    <polyline
                      points={completionTrend
                        .map((d, idx) => {
                          const x = 80 + (idx / (completionTrend.length - 1)) * 840
                          const y = 560 - (d.created / maxValue) * 530
                          return `${x},${y}`
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#f5d5c8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Completed Tasks Line */}
                  {(trendFilter === 'all' || trendFilter === 'completed') && completionTrend.length > 1 && (
                    <polyline
                      points={completionTrend
                        .map((d, idx) => {
                          const x = 80 + (idx / (completionTrend.length - 1)) * 840
                          const y = 560 - (d.completed / maxValue) * 530
                          return `${x},${y}`
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#d5bdaf"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* In Progress Tasks Line */}
                  {(trendFilter === 'all' || trendFilter === 'inProgress') && completionTrend.length > 1 && (
                    <polyline
                      points={completionTrend
                        .map((d, idx) => {
                          const x = 80 + (idx / (completionTrend.length - 1)) * 840
                          const y = 560 - (d.inProgress / maxValue) * 530
                          return `${x},${y}`
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#e3d5ca"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points for Completed Tasks */}
                  {(trendFilter === 'all' || trendFilter === 'completed') && completionTrend.map((d, idx) => (
                    <circle
                      key={`completed-point-${idx}`}
                      cx={80 + (idx / (completionTrend.length - 1)) * 840}
                      cy={560 - (d.completed / maxValue) * 530}
                      r="6"
                      fill="#d5bdaf"
                      stroke="#683f0b"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      title={`${d.fullDate}: ${d.completed} completed`}
                    />
                  ))}

                  {/* Data Points for Created Tasks */}
                  {(trendFilter === 'all' || trendFilter === 'created') && completionTrend.map((d, idx) => (
                    <circle
                      key={`created-point-${idx}`}
                      cx={80 + (idx / (completionTrend.length - 1)) * 840}
                      cy={560 - (d.created / maxValue) * 530}
                      r="6"
                      fill="#f5d5c8"
                      stroke="#683f0b"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      title={`${d.fullDate}: ${d.created} created`}
                    />
                  ))}

                  {/* Data Points for In Progress Tasks */}
                  {(trendFilter === 'all' || trendFilter === 'inProgress') && completionTrend.map((d, idx) => (
                    <circle
                      key={`inprog-point-${idx}`}
                      cx={80 + (idx / (completionTrend.length - 1)) * 840}
                      cy={560 - (d.inProgress / maxValue) * 530}
                      r="6"
                      fill="#e3d5ca"
                      stroke="#725124"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      title={`${d.fullDate}: ${d.inProgress} in progress`}
                    />
                  ))}

                  {/* X-axis labels */}
                  {completionTrend.map((d, idx) => (
                    <text
                      key={`xlabel-${idx}`}
                      x={80 + (idx / (completionTrend.length - 1)) * 840}
                      y="585"
                      textAnchor="middle"
                      fontSize="15"
                      fill="#683f0b"
                      fontWeight="600"
                    >
                      {d.date}
                    </text>
                  ))}
                </svg>

                {/* Legend */}
                
              </div>
            </div>

            {/* All Tasks (moved back below the graph) */}
            <div className="report-card full-width">
              <h3>All Tasks {filterUser !== 'all' && `(${filterUser})`}</h3>
              <div className="tasks-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Created By</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasksForAnalytics.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>No tasks yet</td>
                      </tr>
                    ) : (
                      filteredTasksForAnalytics.map(task => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>{task.createdBy}</td>
                          <td>{task.assignedTo}</td>
                          <td><span className={`status-badge status-${task.status}`}>{task.status}</span></td>
                          <td><span className={`priority-badge priority-${task.priority}`}>{task.priority}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>


)
}


