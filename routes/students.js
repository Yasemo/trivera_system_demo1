const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to read student data
async function readStudentData() {
    try {
        const filePath = path.join(__dirname, '..', 'db', 'students.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading student data:', error);
        throw error;
    }
}

// Get all students
router.get('/', async (req, res) => {
    try {
        const data = await readStudentData();
        res.json({ students: data.students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const data = await readStudentData();
        const student = data.students.find(s => s.id === req.params.id);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

module.exports = router;
