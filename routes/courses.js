const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Utility function to read courses file
async function readCoursesFile() {
    const coursesData = await fs.readFile(path.join(__dirname, '../db/courses.json'), 'utf8');
    return JSON.parse(coursesData);
}

// Utility function to write courses file
async function writeCoursesFile(data) {
    await fs.writeFile(
        path.join(__dirname, '../db/courses.json'),
        JSON.stringify(data, null, 2),
        'utf8'
    );
}

// Get all courses
router.get('/', async (req, res) => {
    try {
        const coursesData = await fs.readFile(path.join(__dirname, '../db/courses.json'), 'utf8');
        const data = JSON.parse(coursesData);
        console.log('Server: Sending courses data:', data.courses.length, 'courses found');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data.courses));
    } catch (error) {
        console.error('Error reading courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Create a new course
router.post('/', async (req, res) => {
    try {
        const newCourse = req.body;

        // Validate required fields
        const requiredFields = ['courseCode', 'courseTitle', 'courseSubtitle', 'status', 'skillLevel',
            'duration', 'publicSeatPrice', 'availableFormats', 'catalogSummary'];

        const missingFields = requiredFields.filter(field => !newCourse[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Read current data
        const data = await readCoursesFile();

        // Check if course code already exists
        if (data.courses.some(c => c.courseCode === newCourse.courseCode)) {
            return res.status(409).json({ error: 'Course code already exists' });
        }

        // Add new course
        data.courses.push(newCourse);

        // Write updated data
        await writeCoursesFile(data);

        res.status(201).json(newCourse);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Failed to create course' });
    }
});

// Update a course
router.put('/:courseCode', async (req, res) => {
    console.log('PUT request received for course:', req.params.courseCode);
    console.log('Request body:', req.body);
    try {
        const { courseCode } = req.params;
        const updatedCourse = req.body;

        // Validate required fields
        const requiredFields = ['courseTitle', 'courseSubtitle', 'status', 'skillLevel',
            'duration', 'publicSeatPrice', 'availableFormats', 'catalogSummary'];

        const missingFields = requiredFields.filter(field => !updatedCourse[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Read current data
        const data = await readCoursesFile();

        // Find course index
        const courseIndex = data.courses.findIndex(c => c.courseCode === courseCode);
        if (courseIndex === -1) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Update course
        data.courses[courseIndex] = {
            ...data.courses[courseIndex],
            ...updatedCourse,
            courseCode // Ensure courseCode remains unchanged
        };

        // Write updated data
        await writeCoursesFile(data);

        res.json(data.courses[courseIndex]);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// Debug route to catch all requests
router.all('*', (req, res) => {
    console.log('Catch-all route hit:', req.method, req.url);
    res.status(404).send('Route not found');
});

module.exports = router;
