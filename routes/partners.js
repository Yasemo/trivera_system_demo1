const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to read partner data
async function readPartnerData() {
    try {
        const filePath = path.join(__dirname, '..', 'db', 'partner.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading partner data:', error);
        throw error;
    }
}

// Get all partners
router.get('/', async (req, res) => {
    try {
        const data = await readPartnerData();
        res.json({ partners: data.partners });
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

// Get partner by ID
router.get('/:id', async (req, res) => {
    try {
        const data = await readPartnerData();
        const partner = data.partners.find(p => p.id === req.params.id);

        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        res.json(partner);
    } catch (error) {
        console.error('Error fetching partner:', error);
        res.status(500).json({ error: 'Failed to fetch partner' });
    }
});

module.exports = router;
