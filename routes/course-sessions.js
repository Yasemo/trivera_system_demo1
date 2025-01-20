const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Utility function to read sessions file
async function readSessionsFile() {
    const sessionsData = await fs.readFile(path.join(__dirname, '../db/course-sessions.json'), 'utf8');
    return JSON.parse(sessionsData);
}

// Utility function to write sessions file
async function writeSessionsFile(data) {
    await fs.writeFile(
        path.join(__dirname, '../db/course-sessions.json'),
        JSON.stringify(data, null, 2),
        'utf8'
    );
}

// Get all sessions
router.get('/', async (req, res) => {
    try {
        const sessionsData = await fs.readFile(path.join(__dirname, '../db/course-sessions.json'), 'utf8');
        const data = JSON.parse(sessionsData);
        console.log('Server: Sending sessions data:', data.sessions.length, 'sessions found');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data.sessions));
    } catch (error) {
        console.error('Error reading sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Create a new session
router.post('/', async (req, res) => {
    try {
        const newSession = req.body;

        // Validate required fields
        const requiredFields = ['courseId', 'type', 'startDate', 'endDate', 'status',
            'creationSource', 'maxEnrollment', 'location', 'instructor'];

        const missingFields = requiredFields.filter(field => !newSession[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Additional validation for private sessions
        if (newSession.type === 'private' && !newSession.clientId) {
            return res.status(400).json({
                error: 'clientId is required for private sessions'
            });
        }

        // Read current data
        const data = await readSessionsFile();

        // Generate unique session ID (e.g., CS + random string)
        newSession.id = 'CS' + Math.random().toString(36).substr(2, 6).toUpperCase();

        // Set initial enrollment count
        newSession.enrollmentCount = 0;

        // Add new session
        data.sessions.push(newSession);

        // Write updated data
        await writeSessionsFile(data);

        res.status(201).json(newSession);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Update a session
router.put('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updatedSession = req.body;

        // Validate required fields
        const requiredFields = ['courseId', 'type', 'startDate', 'endDate', 'status',
            'creationSource', 'maxEnrollment', 'location', 'instructor'];

        const missingFields = requiredFields.filter(field => !updatedSession[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Additional validation for private sessions
        if (updatedSession.type === 'private' && !updatedSession.clientId) {
            return res.status(400).json({
                error: 'clientId is required for private sessions'
            });
        }

        // Read current data
        const data = await readSessionsFile();

        // Find session index
        const sessionIndex = data.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Update session
        data.sessions[sessionIndex] = {
            ...data.sessions[sessionIndex],
            ...updatedSession,
            id: sessionId // Ensure id remains unchanged
        };

        // Write updated data
        await writeSessionsFile(data);

        res.json(data.sessions[sessionIndex]);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: 'Failed to update session' });
    }
});

// Debug route to catch all requests
router.all('*', (req, res) => {
    console.log('Catch-all route hit:', req.method, req.url);
    res.status(404).send('Route not found');
});

module.exports = router;
