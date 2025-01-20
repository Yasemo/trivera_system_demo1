# Activity Entity Implementation Guide

## Overview
The Activity entity is a core component of the TriveraTech system that tracks and manages all actions and events across the platform. This guide explains how to implement the Activity entity using vanilla JavaScript.

## Core Enums and Constants

First, let's define our core enumerations that will be used throughout the Activity entity:

```javascript
// Activity Categories
const ActivityCategory = {
  SESSION: 'SESSION',           // Course session management
  ENROLLMENT: 'ENROLLMENT',     // Student enrollment activities
  WAITLIST: 'WAITLIST',        // Waitlist management
  PAYMENT: 'PAYMENT',          // Payment processing
  REFUND: 'REFUND',           // Refund processing
  COMMISSION: 'COMMISSION',    // Partner commission tracking
  DOCUMENT: 'DOCUMENT',        // Document management
  CERTIFICATE: 'CERTIFICATE',  // Certificate generation
  USER: 'USER',               // User account management
  PROFILE: 'PROFILE',         // Profile updates
  INTEGRATION: 'INTEGRATION', // Third-party integration
  SYSTEM: 'SYSTEM'           // System-level activities
};

// Activity Actions
const ActivityAction = {
  // Session actions
  CREATE_SESSION: 'CREATE_SESSION',
  REQUEST_PRIVATE_SESSION: 'REQUEST_PRIVATE_SESSION',
  MODIFY_SESSION: 'MODIFY_SESSION',
  CANCEL_SESSION: 'CANCEL_SESSION',
  
  // Enrollment actions
  ENROLL_STUDENT: 'ENROLL_STUDENT',
  CANCEL_ENROLLMENT: 'CANCEL_ENROLLMENT',
  TRANSFER_ENROLLMENT: 'TRANSFER_ENROLLMENT',
  
  // Additional actions can be added as needed
};

// Activity Doer Types
const ActivityDoerType = {
  EMPLOYEE: 'EMPLOYEE',
  STUDENT: 'STUDENT',
  CLIENT: 'CLIENT',
  PARTNER: 'PARTNER',
  SUBSCRIBER: 'SUBSCRIBER',
  SYSTEM: 'SYSTEM'
};

// Activity Status
const ActivityStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};
```

## Activity Class Implementation

Here's the main Activity class implementation:

```javascript
class Activity {
  constructor({
    id = null,
    category,
    action,
    doerType,
    doerId,
    doerName,
    targetType,
    targetId,
    metadata = {},
    currentStep = null,
    totalSteps = null,
    assignedTo = [],
    notes = []
  }) {
    // Required fields validation
    if (!category || !action || !doerType || !doerId || !targetType || !targetId) {
      throw new Error('Missing required fields for Activity');
    }

    // Identity
    this.id = id || this.generateId();
    this.category = category;
    this.action = action;

    // Actor Information
    this.doerType = doerType;
    this.doerId = doerId;
    this.doerName = doerName;

    // Target Information
    this.targetType = targetType;
    this.targetId = targetId;

    // Status Tracking
    this.status = ActivityStatus.PENDING;
    this.currentStep = currentStep;
    this.totalSteps = totalSteps;

    // Temporal Data
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;

    // Additional Data
    this.metadata = metadata;
    this.assignedTo = assignedTo;
    this.notes = notes;

    // Status History
    this.statusHistory = [{
      from: null,
      to: ActivityStatus.PENDING,
      timestamp: new Date(),
      changedBy: doerId,
      reason: 'Activity created'
    }];
  }

  // Utility Methods
  generateId() {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Status Management
  updateStatus(newStatus, changedBy, reason = '') {
    const oldStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();

    if (newStatus === ActivityStatus.COMPLETED) {
      this.completedAt = new Date();
    }

    this.statusHistory.push({
      from: oldStatus,
      to: newStatus,
      timestamp: new Date(),
      changedBy,
      reason
    });
  }

  // Note Management
  addNote(note) {
    this.notes.push(note);
    this.updatedAt = new Date();
  }

  // Assignment Management
  assign(userId) {
    if (!this.assignedTo.includes(userId)) {
      this.assignedTo.push(userId);
      this.updatedAt = new Date();
    }
  }

  unassign(userId) {
    this.assignedTo = this.assignedTo.filter(id => id !== userId);
    this.updatedAt = new Date();
  }

  // Metadata Management
  updateMetadata(newData) {
    this.metadata = { ...this.metadata, ...newData };
    this.updatedAt = new Date();
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      category: this.category,
      action: this.action,
      doerType: this.doerType,
      doerId: this.doerId,
      doerName: this.doerName,
      targetType: this.targetType,
      targetId: this.targetId,
      status: this.status,
      currentStep: this.currentStep,
      totalSteps: this.totalSteps,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      metadata: this.metadata,
      assignedTo: this.assignedTo,
      notes: this.notes,
      statusHistory: this.statusHistory
    };
  }
}
```

## Usage Examples

Here are some common usage examples:

```javascript
// Creating a new activity for a private session request
const sessionRequestActivity = new Activity({
  category: ActivityCategory.SESSION,
  action: ActivityAction.REQUEST_PRIVATE_SESSION,
  doerType: ActivityDoerType.CLIENT,
  doerId: 'client_123',
  doerName: 'Acme Corp',
  targetType: 'COURSE_SESSION',
  targetId: 'session_456',
  metadata: {
    requestedDates: ['2025-03-15', '2025-03-16'],
    expectedAttendees: 15,
    courseId: 'course_789',
    specialRequirements: 'On-site preferred'
  },
  assignedTo: ['emp_123']
});

// Updating activity status
sessionRequestActivity.updateStatus(
  ActivityStatus.IN_PROGRESS,
  'emp_123',
  'Started review of request'
);

// Adding notes
sessionRequestActivity.addNote('Client contacted for additional information');

// Updating metadata
sessionRequestActivity.updateMetadata({
  confirmedDate: '2025-03-15',
  confirmedLocation: 'Client HQ'
});
```

## Activity Store Implementation

To manage activities across the application, you might want to implement an Activity Store:

```javascript
class ActivityStore {
  constructor() {
    this.activities = new Map();
  }

  create(activityData) {
    const activity = new Activity(activityData);
    this.activities.set(activity.id, activity);
    return activity;
  }

  get(id) {
    return this.activities.get(id);
  }

  update(id, updateFn) {
    const activity = this.get(id);
    if (activity) {
      updateFn(activity);
      return true;
    }
    return false;
  }

  query(filters = {}) {
    return Array.from(this.activities.values())
      .filter(activity => {
        return Object.entries(filters).every(([key, value]) => {
          if (typeof value === 'function') {
            return value(activity[key]);
          }
          return activity[key] === value;
        });
      });
  }

  // Example query methods
  findByCategory(category) {
    return this.query({ category });
  }

  findByDoer(doerId) {
    return this.query({ doerId });
  }

  findPending() {
    return this.query({ status: ActivityStatus.PENDING });
  }
}
```

## Best Practices

1. Always validate required fields when creating activities
2. Keep metadata structured and documented
3. Use meaningful activity categories and actions
4. Maintain accurate status history
5. Include enough context in notes and reason fields
6. Use consistent ID formats for doerId and targetId fields

## Common Workflows

### Private Session Request Workflow
```javascript
const store = new ActivityStore();

// Client requests private session
const requestActivity = store.create({
  category: ActivityCategory.SESSION,
  action: ActivityAction.REQUEST_PRIVATE_SESSION,
  doerType: ActivityDoerType.CLIENT,
  doerId: 'client_123',
  doerName: 'Acme Corp',
  targetType: 'COURSE_SESSION',
  targetId: 'session_456',
  totalSteps: 3,
  currentStep: 1
});

// Employee reviews request
store.update(requestActivity.id, activity => {
  activity.updateStatus(ActivityStatus.IN_PROGRESS, 'emp_789', 'Review started');
  activity.currentStep = 2;
});

// Request approved
store.update(requestActivity.id, activity => {
  activity.updateStatus(ActivityStatus.COMPLETED, 'emp_789', 'Request approved');
  activity.currentStep = 3;
  activity.updateMetadata({
    approvalDate: new Date(),
    approvedBy: 'emp_789'
  });
});
```

This guide provides the foundation for implementing the Activity entity in your system. The implementation can be extended based on specific needs and requirements.
