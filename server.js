const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const courseSessionsRoutes = require('./routes/course-sessions');
const instructorsRoutes = require('./routes/instructors');
const activityRoutes = require('./routes/activity');
const clientsRoutes = require('./routes/clients');
const partnersRoutes = require('./routes/partners');
const studentsRoutes = require('./routes/students');

// Security middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'trivera-demo-secret',
    resave: true,
    saveUninitialized: false,
    rolling: true, // Extends session lifetime on each request
    name: 'trivera.sid', // Custom session cookie name
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        sameSite: 'lax', // Allow session persistence during navigation
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/' // Ensure cookie is available across all paths
    },
    store: new session.MemoryStore(), // Explicitly use memory store
    unset: 'keep' // Prevent session destruction on unset
}));

// Add session activity tracking middleware
app.use((req, res, next) => {
    if (req.session) {
        req.session.lastActivity = Date.now();
    }
    next();
});

// Authentication middleware
const authMiddleware = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// Portal type verification middleware
const portalTypeMiddleware = (allowedTypes) => (req, res, next) => {
    if (!allowedTypes.includes(req.session.user?.type)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

// Configure MIME types
express.static.mime.define({
    'application/javascript': ['js'],
    'application/json': ['json']
});

// Serve Chart.js from node_modules
app.use('/node_modules/chart.js/dist', express.static(path.join(__dirname, 'node_modules/chart.js/dist')));

// Serve static files
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
    }
}));

// Serve db directory for schemas
app.use('/db', express.static('db', {
    setHeaders: (res, path) => {
        if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
    }
}));

// Portal routes with authentication
app.use('/backoffice', express.static('public/backoffice', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use('/client', express.static('public/client-portal'));
app.use('/partner', express.static('public/partner-portal'));
app.use('/student', express.static('public/student-portal'));

// API routes
app.use('/api/auth', authRoutes);

// Serve entity schemas
app.get('/db/entity_schemas.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'db', 'entity_schemas.json'));
});

// Activity routes (must be first to handle /api/backoffice/activity/*)
app.use('/api/backoffice/activity', authMiddleware, portalTypeMiddleware(['employee']), activityRoutes);

// Protected API routes
app.use('/api/backoffice/courses', authMiddleware, portalTypeMiddleware(['employee']), coursesRoutes);
app.use('/api/backoffice/course-sessions', authMiddleware, portalTypeMiddleware(['employee']), courseSessionsRoutes);
app.use('/api/backoffice/instructors', authMiddleware, portalTypeMiddleware(['employee']), instructorsRoutes);
app.use('/api/backoffice/clients', authMiddleware, portalTypeMiddleware(['employee']), clientsRoutes);
app.use('/api/backoffice/partners', authMiddleware, portalTypeMiddleware(['employee']), partnersRoutes);
app.use('/api/backoffice/students', authMiddleware, portalTypeMiddleware(['employee']), studentsRoutes);

// User info endpoint
app.get('/api/backoffice/user', authMiddleware, portalTypeMiddleware(['employee']), (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get employee data from database
    const { employees } = require('./db/employee.json');
    const employee = employees.find(emp => emp.id === req.session.user.id);

    if (!employee) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Return full user info
    res.json({
        id: employee.id,
        email: employee.email,
        role: employee.role,
        firstName: employee.firstName,
        lastName: employee.lastName,
        type: req.session.user.type
    });
});

app.use('/api/backoffice', authMiddleware, portalTypeMiddleware(['employee']));
app.use('/api/client', authMiddleware, portalTypeMiddleware(['client']));
app.use('/api/partner', authMiddleware, portalTypeMiddleware(['partner']));
app.use('/api/student', authMiddleware, portalTypeMiddleware(['student']));

// API routes should be before the catch-all route
// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Catch-all route for SPA - moved after API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
