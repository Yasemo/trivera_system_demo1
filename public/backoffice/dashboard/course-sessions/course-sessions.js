console.log('Frontend: Course Sessions module script loaded');

// Global state for sessions data
window.sessionsState = window.sessionsState || {
    sessions: [],
    filteredSessions: []
};

// Store module-level event handlers in window object
window.sessionModuleHandlers = window.sessionModuleHandlers || {
    filterHandler: null,
    createFormHandler: null,
    modalOutsideClickHandler: null,
    modalCloseHandlers: [],
    typeChangeHandler: null
};

// Cleanup function that will be called when navigating away
window.cleanupSessionsModule = () => {
    console.log('Frontend: Cleaning up sessions module');

    // Remove event listeners using stored handlers
    const sessionSearch = document.getElementById('sessionSearch');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const locationFilter = document.getElementById('locationFilter');
    const createSessionBtn = document.getElementById('createSessionBtn');
    const sessionModal = document.getElementById('sessionModal');
    const modalClose = document.querySelectorAll('.modal-close');

    if (window.sessionModuleHandlers.filterHandler) {
        if (sessionSearch) sessionSearch.removeEventListener('input', window.sessionModuleHandlers.filterHandler);
        if (typeFilter) typeFilter.removeEventListener('change', window.sessionModuleHandlers.filterHandler);
        if (statusFilter) statusFilter.removeEventListener('change', window.sessionModuleHandlers.filterHandler);
        if (locationFilter) locationFilter.removeEventListener('change', window.sessionModuleHandlers.filterHandler);
    }

    if (window.sessionModuleHandlers.createFormHandler && createSessionBtn) {
        createSessionBtn.removeEventListener('click', window.sessionModuleHandlers.createFormHandler);
    }

    if (window.sessionModuleHandlers.modalOutsideClickHandler && sessionModal) {
        sessionModal.removeEventListener('click', window.sessionModuleHandlers.modalOutsideClickHandler);
    }

    modalClose.forEach((btn, index) => {
        if (window.sessionModuleHandlers.modalCloseHandlers[index]) {
            btn.removeEventListener('click', window.sessionModuleHandlers.modalCloseHandlers[index]);
        }
    });

    // Clear event handlers
    window.sessionModuleHandlers = {
        filterHandler: null,
        createFormHandler: null,
        modalOutsideClickHandler: null,
        modalCloseHandlers: [],
        typeChangeHandler: null
    };

    // Note: We no longer clear the state here to persist data between navigation
};

// Function to initialize the course sessions module
function initializeCourseSessionsModule() {
    console.log('Frontend: Initializing course sessions module');
    // DOM Elements
    const sessionSearch = document.getElementById('sessionSearch');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const locationFilter = document.getElementById('locationFilter');
    const sessionsTableBody = document.getElementById('sessionsTableBody');
    const sessionModal = document.getElementById('sessionModal');
    const modalClose = document.querySelectorAll('.modal-close');

    // Log DOM element status
    console.log('Frontend: DOM Elements found:', {
        sessionSearch: !!sessionSearch,
        typeFilter: !!typeFilter,
        statusFilter: !!statusFilter,
        locationFilter: !!locationFilter,
        sessionsTableBody: !!sessionsTableBody,
        sessionModal: !!sessionModal,
        modalClose: modalClose.length
    });

    // Fetch sessions data
    async function fetchSessions() {
        try {
            console.log('Frontend: Fetching sessions...');
            const response = await fetch('/api/backoffice/course-sessions');
            console.log('Frontend: Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch sessions: ${response.status}`);
            }
            window.sessionsState.sessions = await response.json();
            console.log('Frontend: Received sessions data:', window.sessionsState.sessions);
            window.sessionsState.filteredSessions = [...window.sessionsState.sessions];
            console.log('Frontend: Set filtered sessions:', window.sessionsState.filteredSessions.length, 'sessions');
            renderSessions();
            updateQuickStats();
        } catch (error) {
            console.error('Error fetching sessions:', error);
            if (error.message === 'Failed to fetch') {
                console.error('Network error or server not responding');
            } else {
                console.error('Response:', error.message);
            }
            alert('Error loading sessions data. Please try again or contact support if the issue persists.');
        }
    }

    // Format date for display
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Render sessions table
    function renderSessions() {
        console.log('Frontend: Starting render with', window.sessionsState.filteredSessions.length, 'sessions');
        if (!sessionsTableBody) {
            console.error('Frontend: sessionsTableBody element not found!');
            return;
        }
        sessionsTableBody.innerHTML = window.sessionsState.filteredSessions.map(session => `
            <tr data-session-id="${session.id}">
                <td>${session.id}</td>
                <td>${session.courseId}</td>
                <td>${session.type}</td>
                <td class="date-display">${formatDate(session.startDate)}</td>
                <td class="date-display">${formatDate(session.endDate)}</td>
                <td>${session.location}</td>
                <td>
                    <div class="enrollment-display">
                        <span class="enrollment-count">${session.enrollmentCount}</span>
                        <span>/</span>
                        <span>${session.maxEnrollment}</span>
                    </div>
                </td>
                <td><span class="status-badge" data-status="${session.status}">${session.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon view-session" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="btn btn-icon edit-session" title="Edit Session">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add click handlers for view/edit buttons
        document.querySelectorAll('.view-session').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = e.target.closest('tr').dataset.sessionId;
                showSessionDetails(sessionId, false);
            });
        });

        document.querySelectorAll('.edit-session').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const row = btn.closest('tr');
                if (!row) {
                    console.error('Could not find parent row');
                    return;
                }
                const sessionId = row.dataset.sessionId;
                if (!sessionId) {
                    console.error('No session ID found');
                    return;
                }
                console.log('Editing session:', sessionId);
                showSessionDetails(sessionId, true);
            });
        });

        document.querySelectorAll('tr[data-session-id]').forEach(row => {
            row.addEventListener('click', () => {
                const sessionId = row.dataset.sessionId;
                showSessionDetails(sessionId, false);
            });
        });
    }

    // Filter sessions based on search and filter values
    function filterSessions() {
        const searchTerm = sessionSearch.value.toLowerCase();
        const typeValue = typeFilter.value;
        const statusValue = statusFilter.value;
        const locationValue = locationFilter.value;

        window.sessionsState.filteredSessions = window.sessionsState.sessions.filter(session => {
            const matchesSearch =
                session.id.toLowerCase().includes(searchTerm) ||
                session.courseId.toLowerCase().includes(searchTerm);

            const matchesType = !typeValue || session.type === typeValue;
            const matchesStatus = !statusValue || session.status === statusValue;
            const matchesLocation = !locationValue || session.location === locationValue;

            return matchesSearch && matchesType && matchesStatus && matchesLocation;
        });

        renderSessions();
    }

    // Show session details in modal
    function showSessionDetails(sessionId, editMode = false) {
        const session = window.sessionsState.sessions.find(s => s.id === sessionId);
        if (!session) return;

        const modalBody = sessionModal.querySelector('.modal-body');
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        modalTitle.textContent = editMode ? 'Edit Session' : 'Session Details';
        saveBtn.style.display = editMode ? 'block' : 'none';
        editBtn.style.display = editMode ? 'none' : 'block';

        if (editMode) {
            modalBody.innerHTML = `
                <div class="course-details edit-mode">
                    <div class="detail-section">
                        <h4>Session Information</h4>
                        <div class="form-group">
                            <label>Session ID</label>
                            <input type="text" id="sessionId" value="${session.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Course ID</label>
                            <input type="text" id="courseId" value="${session.courseId}">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select id="type">
                                <option value="public" ${session.type === 'public' ? 'selected' : ''}>Public</option>
                                <option value="private" ${session.type === 'private' ? 'selected' : ''}>Private</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="datetime-local" id="startDate" value="${session.startDate.slice(0, 16)}">
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="datetime-local" id="endDate" value="${session.endDate.slice(0, 16)}">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="status">
                                <option value="draft" ${session.status === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="approved" ${session.status === 'approved' ? 'selected' : ''}>Approved</option>
                                <option value="in-review" ${session.status === 'in-review' ? 'selected' : ''}>In Review</option>
                                <option value="cancelled" ${session.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Location</label>
                            <select id="location">
                                <option value="Virtual" ${session.location === 'Virtual' ? 'selected' : ''}>Virtual</option>
                                <option value="On-site" ${session.location === 'On-site' ? 'selected' : ''}>On-site</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Max Enrollment</label>
                            <input type="number" id="maxEnrollment" value="${session.maxEnrollment}">
                        </div>
                        <div class="form-group">
                            <label>Instructor</label>
                            <input type="text" id="instructor" value="${session.instructor}">
                        </div>
                    </div>
                    ${session.type === 'private' ? `
                        <div class="detail-section">
                            <h4>Private Session Details</h4>
                            <div class="form-group">
                                <label>Client ID</label>
                                <input type="text" id="clientId" value="${session.clientId || ''}">
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="course-details">
                    <div class="detail-section">
                        <h4>Session Information</h4>
                        <div class="detail-grid">
                            <span class="detail-label">Session ID:</span>
                            <span>${session.id}</span>
                            <span class="detail-label">Course ID:</span>
                            <span>${session.courseId}</span>
                            <span class="detail-label">Type:</span>
                            <span>${session.type}</span>
                            <span class="detail-label">Start Date:</span>
                            <span>${formatDate(session.startDate)}</span>
                            <span class="detail-label">End Date:</span>
                            <span>${formatDate(session.endDate)}</span>
                            <span class="detail-label">Status:</span>
                            <span class="status-badge" data-status="${session.status}">${session.status}</span>
                            <span class="detail-label">Location:</span>
                            <span>${session.location}</span>
                            <span class="detail-label">Enrollment:</span>
                            <span>${session.enrollmentCount} / ${session.maxEnrollment}</span>
                            <span class="detail-label">Instructor:</span>
                            <span>${session.instructor}</span>
                        </div>
                    </div>
                    ${session.type === 'private' ? `
                        <div class="detail-section">
                            <h4>Private Session Details</h4>
                            <div class="detail-grid">
                                <span class="detail-label">Client ID:</span>
                                <span>${session.clientId || 'N/A'}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        sessionModal.classList.add('active');

        // Add event listeners for edit mode
        if (editMode) {
            saveBtn.onclick = async () => {
                try {
                    await saveSessionChanges(sessionId);
                    sessionModal.classList.remove('active');
                } catch (error) {
                    console.error('Failed to save changes:', error);
                }
            };
            cancelBtn.onclick = () => {
                sessionModal.classList.remove('active');
            };
        } else {
            editBtn.onclick = () => showSessionDetails(sessionId, true);
        }
    }

    // Save session changes
    async function saveSessionChanges(sessionId) {
        console.log('Saving changes for session:', sessionId);

        const updatedSession = {
            id: sessionId,
            courseId: document.getElementById('courseId').value,
            type: document.getElementById('type').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            status: document.getElementById('status').value,
            location: document.getElementById('location').value,
            maxEnrollment: parseInt(document.getElementById('maxEnrollment').value),
            instructor: document.getElementById('instructor').value,
            creationSource: window.sessionsState.sessions.find(s => s.id === sessionId).creationSource,
            enrollmentCount: window.sessionsState.sessions.find(s => s.id === sessionId).enrollmentCount
        };

        // Add client ID for private sessions
        if (updatedSession.type === 'private') {
            updatedSession.clientId = document.getElementById('clientId').value;
        }

        try {
            const response = await fetch(`/api/backoffice/course-sessions/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedSession)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to update session: ${response.status} - ${errorData}`);
            }

            // Update local data
            const index = window.sessionsState.sessions.findIndex(s => s.id === sessionId);
            if (index !== -1) {
                window.sessionsState.sessions[index] = updatedSession;
                filterSessions();
            }

            sessionModal.classList.remove('active');
            console.log('Session updated successfully');
        } catch (error) {
            console.error('Error updating session:', error);
            alert(`Error updating session: ${error.message}`);
            throw error;
        }
    }

    // Create new session
    async function createNewSession(sessionData) {
        try {
            console.log('Creating new session:', sessionData);
            const response = await fetch('/api/backoffice/course-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to create session: ${response.status} - ${errorData}`);
            }

            const newSession = await response.json();
            window.sessionsState.sessions.push(newSession);
            filterSessions();
            sessionModal.classList.remove('active');
            console.log('Session created successfully');
        } catch (error) {
            console.error('Error creating session:', error);
            alert(`Error creating session: ${error.message}`);
            throw error;
        }
    }

    // Show empty session form for creation
    function showCreateSessionForm() {
        const modalBody = sessionModal.querySelector('.modal-body');
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        modalTitle.textContent = 'Create New Session';
        saveBtn.style.display = 'block';
        editBtn.style.display = 'none';

        modalBody.innerHTML = `
            <div class="course-details edit-mode">
                <div class="detail-section">
                    <h4>Session Information</h4>
                    <div class="form-group">
                        <label>Course ID</label>
                        <input type="text" id="courseId" placeholder="Enter course ID">
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="type">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="datetime-local" id="startDate">
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="datetime-local" id="endDate">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="status">
                            <option value="draft">Draft</option>
                            <option value="approved">Approved</option>
                            <option value="in-review">In Review</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <select id="location">
                            <option value="Virtual">Virtual</option>
                            <option value="On-site">On-site</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Max Enrollment</label>
                        <input type="number" id="maxEnrollment" placeholder="Enter max enrollment">
                    </div>
                    <div class="form-group">
                        <label>Instructor</label>
                        <input type="text" id="instructor" placeholder="Enter instructor name">
                    </div>
                </div>
                <div id="privateSessionFields" style="display: none;">
                    <div class="detail-section">
                        <h4>Private Session Details</h4>
                        <div class="form-group">
                            <label>Client ID</label>
                            <input type="text" id="clientId" placeholder="Enter client ID">
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show/hide private session fields based on type selection
        const typeSelect = document.getElementById('type');
        const privateFields = document.getElementById('privateSessionFields');
        window.sessionModuleHandlers.typeChangeHandler = () => {
            privateFields.style.display = typeSelect.value === 'private' ? 'block' : 'none';
        };
        typeSelect.addEventListener('change', window.sessionModuleHandlers.typeChangeHandler);

        sessionModal.classList.add('active');

        // Add event listener for save button
        saveBtn.onclick = async () => {
            try {
                const newSession = {
                    courseId: document.getElementById('courseId').value,
                    type: document.getElementById('type').value,
                    startDate: document.getElementById('startDate').value,
                    endDate: document.getElementById('endDate').value,
                    status: document.getElementById('status').value,
                    location: document.getElementById('location').value,
                    maxEnrollment: parseInt(document.getElementById('maxEnrollment').value),
                    instructor: document.getElementById('instructor').value,
                    creationSource: 'staff'
                };

                if (newSession.type === 'private') {
                    newSession.clientId = document.getElementById('clientId').value;
                }

                await createNewSession(newSession);
            } catch (error) {
                console.error('Failed to create session:', error);
            }
        };

        cancelBtn.onclick = () => {
            sessionModal.classList.remove('active');
        };
    }

    // Only set up event listeners if all required elements exist
    if (sessionSearch && typeFilter && statusFilter && locationFilter && sessionModal && sessionsTableBody) {
        console.log('Frontend: All required DOM elements found, setting up event listeners');

        // Store handlers
        window.sessionModuleHandlers.filterHandler = filterSessions;
        window.sessionModuleHandlers.createFormHandler = showCreateSessionForm;
        window.sessionModuleHandlers.modalOutsideClickHandler = (e) => {
            if (e.target === sessionModal) {
                sessionModal.classList.remove('active');
            }
        };

        // Event Listeners
        sessionSearch.addEventListener('input', window.sessionModuleHandlers.filterHandler);
        typeFilter.addEventListener('change', window.sessionModuleHandlers.filterHandler);
        statusFilter.addEventListener('change', window.sessionModuleHandlers.filterHandler);
        locationFilter.addEventListener('change', window.sessionModuleHandlers.filterHandler);

        // Create session button
        const createSessionBtn = document.getElementById('createSessionBtn');
        if (createSessionBtn) {
            createSessionBtn.addEventListener('click', window.sessionModuleHandlers.createFormHandler);
        }

        modalClose.forEach(btn => {
            const handler = () => sessionModal.classList.remove('active');
            window.sessionModuleHandlers.modalCloseHandlers.push(handler);
            btn.addEventListener('click', handler);
        });

        // Close modal when clicking outside
        sessionModal.addEventListener('click', window.sessionModuleHandlers.modalOutsideClickHandler);

        // Check if we have existing data
        if (window.sessionsState.sessions.length > 0) {
            console.log('Frontend: Using existing sessions data');
            renderSessions();
            updateQuickStats();
        } else {
            // Initialize
            fetchSessions();
        }
    } else {
        console.error('Frontend: Some required DOM elements are missing');
    }

    // Update quick stats in context panel
    function updateQuickStats() {
        const activeSessionsCount = window.sessionsState.sessions.filter(s =>
            s.status === 'approved' &&
            new Date(s.endDate) >= new Date()
        ).length;

        const totalEnrollment = window.sessionsState.sessions.reduce((total, session) =>
            total + session.enrollmentCount, 0
        );

        const activeSessionsElement = document.getElementById('activeSessionsCount');
        const totalEnrollmentElement = document.getElementById('totalEnrollmentCount');

        if (activeSessionsElement) activeSessionsElement.textContent = activeSessionsCount;
        if (totalEnrollmentElement) totalEnrollmentElement.textContent = totalEnrollment;
    }
}

// Export initialization function for dashboard.js
window.initializeCourseSessionsModule = async () => {
    console.log('Frontend: Starting course sessions module initialization');

    // Wait for DOM elements with retry
    await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total with 100ms intervals

        const checkElements = () => {
            attempts++;
            const requiredElements = {
                sessionSearch: document.getElementById('sessionSearch'),
                typeFilter: document.getElementById('typeFilter'),
                statusFilter: document.getElementById('statusFilter'),
                locationFilter: document.getElementById('locationFilter'),
                sessionsTableBody: document.getElementById('sessionsTableBody'),
                sessionModal: document.getElementById('sessionModal')
            };

            const missingElements = Object.entries(requiredElements)
                .filter(([_, element]) => !element)
                .map(([id]) => id);

            if (missingElements.length === 0) {
                console.log('Frontend: All required elements found');
                resolve();
            } else if (attempts >= maxAttempts) {
                const error = 'Missing required elements after ' + attempts + ' attempts: ' + missingElements.join(', ');
                console.error('Frontend:', error);
                reject(new Error(error));
            } else {
                setTimeout(checkElements, 100);
            }
        };

        checkElements();
    });

    try {
        // Initialize the module
        console.log('Frontend: Initializing module');
        initializeCourseSessionsModule();

        // Verify initialization was successful
        if (!window.sessionsState || !window.sessionModuleHandlers) {
            throw new Error('Module initialization failed: state or handlers not properly set up');
        }

        console.log('Frontend: Course sessions module initialization complete');
    } catch (error) {
        console.error('Frontend: Module initialization failed:', error);
        throw error;
    }
};

// Initialize if loaded directly (not through dashboard)
if (document.getElementById('sessionSearch')) {
    window.initializeCourseSessionsModule();
}
