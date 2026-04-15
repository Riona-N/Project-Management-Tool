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
    const {
      title,
      description,
      status,
      completed,
      createdBy,
      assignedTo,
      priority,
      dueDate,
      tags,
      checklist,
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!createdBy) {
      return res.status(400).json({ error: 'CreatedBy is required' });
    }
    
    const task = new Task({
      details: {
        title,
        description: description || '',
        createdBy,
        assignedTo: assignedTo || null,
      },
      status: status || 'todo',
      completed: completed || false,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags : [],
      checklist: Array.isArray(checklist) ? checklist : [],
      history: [{ status: status || 'todo', changedAt: new Date() }],
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
    const updateData = {};

    if (req.body.details && typeof req.body.details === 'object') {
      Object.entries(req.body.details).forEach(([key, value]) => {
        updateData[`details.${key}`] = value;
      });
    }

    if (req.body.title) updateData['details.title'] = req.body.title;
    if (req.body.description) updateData['details.description'] = req.body.description;
    if (req.body.createdBy) updateData['details.createdBy'] = req.body.createdBy;
    if (req.body.assignedTo) updateData['details.assignedTo'] = req.body.assignedTo;
    if ('status' in req.body) updateData.status = req.body.status;
    if ('completed' in req.body) updateData.completed = req.body.completed;
    if ('priority' in req.body) updateData.priority = req.body.priority;
    if ('dueDate' in req.body) updateData.dueDate = req.body.dueDate;
    if ('tags' in req.body) updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    if ('checklist' in req.body) updateData.checklist = Array.isArray(req.body.checklist) ? req.body.checklist : [];

    const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
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

// DELETE all tasks
router.delete('/', async (req, res) => {
  try {
    const result = await Task.deleteMany({});
    res.json({ message: 'All tasks deleted', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
