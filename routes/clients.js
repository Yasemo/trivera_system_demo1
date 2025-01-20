const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to read client data
async function readClientData() {
    try {
        const filePath = path.join(__dirname, '..', 'db', 'client.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading client data:', error);
        throw error;
    }
}

// Get all clients
router.get('/', async (req, res) => {
    try {
        const data = await readClientData();
        res.json({ clients: data.clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get client by ID
router.get('/:id', async (req, res) => {
    try {
        const data = await readClientData();
        const client = data.clients.find(c => c.id === req.params.id);

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

module.exports = router;
