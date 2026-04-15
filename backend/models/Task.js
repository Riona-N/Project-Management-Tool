const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    details: {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        default: '',
      },
      createdBy: {
        type: String,
        required: true,
      },
      assignedTo: {
        type: String,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ['todo', 'inProgress', 'done'],
      default: 'todo',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    checklist: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
        done: {
          type: Boolean,
          default: false,
        },
      },
    ],
    history: [
      {
        status: {
          type: String,
          enum: ['todo', 'inProgress', 'done'],
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
