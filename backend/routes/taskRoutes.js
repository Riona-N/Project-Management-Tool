const express = require('express');
const Task = require('../models/Task');

const router = express.Router();

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE task
router.post('/', async (req, res) => {
  try {
    const { title, status, completed, createdBy, assignedTo, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!createdBy) {
      return res.status(400).json({ error: 'CreatedBy is required' });
    }
    
    const task = new Task({ 
      title, 
      status: status || 'todo',
      completed: completed || false,
      createdBy,
      assignedTo: assignedTo || null,
      priority: priority || 'medium'
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('Task creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// UPDATE task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
