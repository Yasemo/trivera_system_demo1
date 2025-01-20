const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to read activity data
async function readActivityData() {
    try {
        const filePath = path.join(__dirname, '..', 'db', 'activity-data.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading activity data:', error);
        throw error;
    }
}

// Valid doer types from ActivityDoerType enum
const VALID_DOER_TYPES = ['employee', 'student', 'client', 'partner', 'subscriber', 'system'];

// Get activity data with optional filters
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const typeUpper = type.toUpperCase();

        // Special handling for 'in-review' type
        if (type === 'in-review') {
            const activities = await readActivityData();
            const filteredActivities = activities.filter(a =>
                a.status === 'PENDING' || a.status === 'IN_PROGRESS'
            );
            return res.json(filteredActivities);
        }

        // Validate doer type
        if (!VALID_DOER_TYPES.includes(type)) {
            return res.status(400).json({
                error: `Invalid type. Must be one of: ${VALID_DOER_TYPES.join(', ')} or "in-review"`
            });
        }

        const activities = await readActivityData();

        // Filter activities by doer type
        const filteredActivities = activities.filter(a =>
            a.doerType.toLowerCase() === type.toLowerCase()
        );

        res.setHeader('Content-Type', 'application/json');
        res.json(filteredActivities);
    } catch (error) {
        console.error('Error fetching activity data:', error);
        res.status(500).json({ error: 'Failed to fetch activity data' });
    }
});

// Add new activity entry
router.post('/:type', async (req, res) => {
    try {
        const activities = await readActivityData();
        const filePath = path.join(__dirname, '..', 'db', 'activity-data.json');

        // Create new activity with required fields
        const newActivity = {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            category: req.body.category,
            action: req.body.action,
            doerType: req.body.doerType,
            doerId: req.body.doerId,
            doerName: req.body.doerName,
            targetType: req.body.targetType,
            targetId: req.body.targetId,
            status: req.body.status || 'PENDING',
            currentStep: req.body.currentStep || 1,
            totalSteps: req.body.totalSteps || 1,
            metadata: req.body.metadata || {},
            assignedTo: req.body.assignedTo || [],
            notes: req.body.notes || [],
            statusHistory: [
                {
                    from: null,
                    to: req.body.status || 'PENDING',
                    timestamp: new Date().toISOString(),
                    changedBy: req.body.doerId,
                    reason: 'Activity created'
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to beginning of array
        activities.unshift(newActivity);

        // Write back to file
        await fs.writeFile(filePath, JSON.stringify(activities, null, 4));

        res.setHeader('Content-Type', 'application/json');
        res.status(201).json(newActivity);
    } catch (error) {
        console.error('Error adding activity:', error);
        res.status(500).json({ error: 'Failed to add activity' });
    }
});

// Add note to activity
router.post('/:type/:activityId/notes', async (req, res) => {
    try {
        const { activityId } = req.params;
        const { text, userId } = req.body;

        if (!text || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const activities = await readActivityData();
        const filePath = path.join(__dirname, '..', 'db', 'activity-data.json');

        // Find the activity
        const activity = activities.find(a => a.id === activityId);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Add the new note with user's name
        const newNote = {
            text,
            timestamp: new Date().toISOString(),
            userId,
            userName: req.body.userName || 'Unknown User'
        };

        activity.notes.push(newNote);
        activity.updatedAt = new Date().toISOString();

        // Write back to file
        await fs.writeFile(filePath, JSON.stringify(activities, null, 4));

        res.json({ success: true, note: newNote });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

module.exports = router;
