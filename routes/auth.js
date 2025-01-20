const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Mock database access (replace with actual database in production)
const { employees } = require('../db/employee.json');
const { clients } = require('../db/client.json');
const { partners } = require('../db/partner.json');
const { students } = require('../db/students.json');

// Helper function to generate a simple token (replace with proper JWT in production)
function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Backoffice login
router.post('/backoffice/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const employee = employees.find(emp => emp.email === email);
        if (!employee) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // In production, use proper password hashing comparison
        const isValidPassword = password === 'password';
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set session data
        const userData = {
            id: employee.id,
            email: employee.email,
            role: employee.role,
            firstName: employee.firstName,
            lastName: employee.lastName,
            type: 'employee'
        };

        req.session.user = userData;

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ message: 'Error saving session' });
            }

            res.json({
                token: generateToken(),
                user: {
                    id: employee.id,
                    email: employee.email,
                    role: employee.role,
                    firstName: employee.firstName,
                    lastName: employee.lastName
                }
            });
        });
    } catch (error) {
        console.error('Backoffice login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Client login
router.post('/client/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const client = clients.find(c =>
            c.primaryContact.email === email ||
            c.billingContact.email === email
        );

        if (!client) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // In production, use proper password hashing comparison
        const isValidPassword = password === 'password';
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set session data
        req.session.user = {
            id: client.id,
            email,
            type: 'client'
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ message: 'Error saving session' });
            }

            res.json({
                token: generateToken(),
                user: {
                    id: client.id,
                    companyName: client.companyName,
                    email
                }
            });
        });
    } catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Partner login
router.post('/partner/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const partner = partners.find(p =>
            p.primaryContact.email === email ||
            p.billingContact.email === email
        );

        if (!partner) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // In production, use proper password hashing comparison
        const isValidPassword = password === 'password';
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set session data
        req.session.user = {
            id: partner.id,
            email,
            type: 'partner'
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ message: 'Error saving session' });
            }

            res.json({
                token: generateToken(),
                user: {
                    id: partner.id,
                    companyName: partner.companyName,
                    email
                }
            });
        });
    } catch (error) {
        console.error('Partner login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Student login
router.post('/student/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const student = students.find(s => s.email === email);
        if (!student) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // In production, use proper password hashing comparison
        const isValidPassword = password === 'password';
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set session data
        req.session.user = {
            id: student.studentId,
            email: student.email,
            type: 'student'
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ message: 'Error saving session' });
            }

            res.json({
                token: generateToken(),
                user: {
                    id: student.studentId,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email
                }
            });
        });
    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user info
router.get('/backoffice/user', (req, res) => {
    console.log('Session user:', req.session.user); // Debug log

    if (!req.session.user || req.session.user.type !== 'employee') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const employee = employees.find(emp => emp.id === req.session.user.id);
    console.log('Found employee:', employee); // Debug log

    if (!employee) {
        return res.status(401).json({ message: 'User not found' });
    }

    const userData = {
        id: employee.id,
        email: employee.email,
        role: employee.role,
        firstName: employee.firstName,
        lastName: employee.lastName
    };
    console.log('Sending user data:', userData); // Debug log

    res.json(userData);
});

// Logout route
router.post('/logout', (req, res) => {
    if (req.session) {
        const sessionID = req.sessionID;
        req.session.destroy(err => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ message: 'Error during logout' });
            }
            // Clear the session cookie
            res.clearCookie('trivera.sid', {
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
            });
            res.json({ message: 'Logged out successfully' });
        });
    } else {
        res.json({ message: 'Already logged out' });
    }
});

module.exports = router;
