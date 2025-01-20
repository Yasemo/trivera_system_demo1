const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to instructors data file
const instructorsFilePath = path.join(__dirname, '../db/instructor.json');

// Helper function to read instructors data
async function readInstructorsData() {
    try {
        const data = await fs.readFile(instructorsFilePath, 'utf8');
        return JSON.parse(data).instructors;
    } catch (error) {
        console.error('Error reading instructors data:', error);
        throw new Error('Failed to read instructors data');
    }
}

// Helper function to write instructors data
async function writeInstructorsData(instructors) {
    try {
        await fs.writeFile(instructorsFilePath, JSON.stringify({ instructors }, null, 4));
    } catch (error) {
        console.error('Error writing instructors data:', error);
        throw new Error('Failed to write instructors data');
    }
}

// GET all instructors
router.get('/', async (req, res) => {
    try {
        const instructors = await readInstructorsData();
        res.json(instructors);
    } catch (error) {
        console.error('Error in GET /instructors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET instructor by ID
router.get('/:id', async (req, res) => {
    try {
        const instructors = await readInstructorsData();
        const instructor = instructors.find(i => i.id === req.params.id);

        if (!instructor) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        res.json(instructor);
    } catch (error) {
        console.error('Error in GET /instructors/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new instructor
router.post('/', async (req, res) => {
    try {
        const instructors = await readInstructorsData();

        // Generate new instructor ID
        const lastId = instructors.reduce((max, instructor) => {
            const num = parseInt(instructor.id.replace('INS', ''));
            return num > max ? num : max;
        }, 0);

        const newInstructor = {
            id: `INS${String(lastId + 1).padStart(3, '0')}`,
            ...req.body
        };

        instructors.push(newInstructor);
        await writeInstructorsData(instructors);

        res.status(201).json(newInstructor);
    } catch (error) {
        console.error('Error in POST /instructors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT update instructor
router.put('/:id', async (req, res) => {
    try {
        const instructors = await readInstructorsData();
        const index = instructors.findIndex(i => i.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        // Preserve fields that shouldn't be updated through the form
        const existingInstructor = instructors[index];
        const updatedInstructor = {
            ...existingInstructor,
            ...req.body,
            id: req.params.id, // Ensure ID cannot be changed
            performanceMetrics: existingInstructor.performanceMetrics, // Preserve metrics
            certifications: existingInstructor.certifications, // Preserve certifications
            documents: existingInstructor.documents // Preserve documents
        };

        instructors[index] = updatedInstructor;
        await writeInstructorsData(instructors);

        res.json(updatedInstructor);
    } catch (error) {
        console.error('Error in PUT /instructors/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE instructor
router.delete('/:id', async (req, res) => {
    try {
        const instructors = await readInstructorsData();
        const index = instructors.findIndex(i => i.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        instructors.splice(index, 1);
        await writeInstructorsData(instructors);

        res.status(204).send();
    } catch (error) {
        console.error('Error in DELETE /instructors/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
