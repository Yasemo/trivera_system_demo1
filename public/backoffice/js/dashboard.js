document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const navLinks = document.querySelectorAll('.nav-section a');
    const toggleNav = document.getElementById('toggleNav');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    let userInfo = null;
    let currentSection = null;

    // Store activities for filtering
    let allActivities = [];
    let currentDoerType = 'employee';

    // Activity tracking configuration
    const ACTIVITY_CATEGORIES = {
        SESSION: 'Session',
        ENROLLMENT: 'Enrollment',
        WAITLIST: 'Waitlist',
        PAYMENT: 'Payment',
        REFUND: 'Refund',
        COMMISSION: 'Commission',
        DOCUMENT: 'Document',
        CERTIFICATE: 'Certificate',
        USER: 'User',
        PROFILE: 'Profile',
        INTEGRATION: 'Integration',
        SYSTEM: 'System'
    };

    const ACTION_TYPES = {
        CREATE_SESSION: 'Create Session',
        REQUEST_PRIVATE_SESSION: 'Request Private Session',
        MODIFY_SESSION: 'Modify Session',
        CANCEL_SESSION: 'Cancel Session',
        ENROLL_STUDENT: 'Enroll Student',
        CANCEL_ENROLLMENT: 'Cancel Enrollment',
        TRANSFER_ENROLLMENT: 'Transfer Enrollment',
        ADD_TO_WAITLIST: 'Add to Waitlist',
        PROCESS_PAYMENT: 'Process Payment',
        PROCESS_REFUND: 'Process Refund',
        CALCULATE_COMMISSION: 'Calculate Commission',
        PAY_COMMISSION: 'Pay Commission',
        UPLOAD_DOCUMENT: 'Upload Document',
        GENERATE_CERTIFICATE: 'Generate Certificate',
        REVOKE_CERTIFICATE: 'Revoke Certificate',
        CREATE_ACCOUNT: 'Create Account',
        UPDATE_PROFILE: 'Update Profile',
        SYNC_LEARNWORLDS: 'Sync LearnWorlds',
        SYNC_ZOHO: 'Sync Zoho'
    };

    // Setup activity filters
    function setupActivityFilters() {
        const activitySection = document.querySelector('.activity-section');
        if (activitySection) {
            const filterSection = document.createElement('div');
            filterSection.className = 'filter-section';
            filterSection.innerHTML = `
                <div id="activity-filters" class="activity-filters">
                    <input type="text" id="activity-search" placeholder="Search activities...">
                    <select id="category-filter">
                        <option value="">All Categories</option>
                        ${Object.entries(ACTIVITY_CATEGORIES).map(([key, value]) =>
                `<option value="${key}">${value}</option>`
            ).join('')}
                    </select>
                    <select id="action-filter">
                        <option value="">All Actions</option>
                        ${Object.entries(ACTION_TYPES).map(([key, value]) =>
                `<option value="${key}">${value}</option>`
            ).join('')}
                    </select>
                    <select id="status-filter">
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="EXPIRED">Expired</option>
                    </select>
                    <select id="doer-filter">
                        <option value="">All Users</option>
                    </select>
                </div>
            `;

            activitySection.insertBefore(filterSection, activitySection.firstChild);
        }
    }

    // Add styles for activities
    function addActivityStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .activity-tabs {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
            }
            .tab-btn {
                padding: 0.5rem 1rem;
                border: none;
                background: none;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                font-weight: 500;
                color: #666;
                transition: all 0.3s ease;
            }
            .tab-btn:hover {
                color: #333;
            }
            .tab-btn.active {
                color: #007bff;
                border-bottom-color: #007bff;
            }
            .filter-section {
                margin-bottom: 1rem;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 4px;
            }
            .activity-filters {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .activity-filters input,
            .activity-filters select {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 0.9rem;
                color: #495057;
                background-color: #fff;
                transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
            }

            .activity-filters input:focus,
            .activity-filters select:focus {
                border-color: #80bdff;
                outline: 0;
                box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
            }

            .activity-filters select {
                appearance: none;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 16px 12px;
                padding-right: 2.25rem;
            }

            .activity-filters input::placeholder {
                color: #6c757d;
                opacity: 0.65;
            }
            .progress-container {
                width: 100%;
                height: 20px;
                background: #eee;
                border-radius: 10px;
                position: relative;
                overflow: hidden;
            }
            .progress-bar {
                height: 100%;
                background: #007bff;
                border-radius: 10px;
                transition: width 0.3s ease;
            }
            .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #333;
                font-size: 12px;
                font-weight: 500;
            }
            .status-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.875rem;
                font-weight: 500;
                text-transform: capitalize;
            }
            .status-badge.pending {
                background: #ffeeba;
                color: #856404;
            }
            .status-badge.in_progress {
                background: #b8daff;
                color: #004085;
            }
            .status-badge.completed {
                background: #c3e6cb;
                color: #155724;
            }
            .status-badge.failed {
                background: #f5c6cb;
                color: #721c24;
            }
            .status-badge.cancelled {
                background: #e2e3e5;
                color: #383d41;
            }
            .activity-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 1rem;
            }
            .activity-table th,
            .activity-table td {
                padding: 0.75rem;
                border-bottom: 1px solid #dee2e6;
            }
            .activity-table th {
                background: #f8f9fa;
                font-weight: 600;
                text-align: left;
            }
            .activity-table tbody tr:hover {
                background: #f8f9fa;
                cursor: pointer;
            }

            /* Activity Modal Styles */
            .activity-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .activity-modal.active {
                display: flex;
                opacity: 1;
            }

            .activity-modal-content {
                background: white;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                margin: auto;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                display: flex;
                flex-direction: column;
            }

            .activity-modal-header {
                padding: 1rem;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .activity-modal-body {
                padding: 1rem;
                overflow-y: auto;
            }

            .activity-modal-footer {
                padding: 1rem;
                border-top: 1px solid #dee2e6;
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
            }

            .activity-modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
            }

            .activity-details {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .activity-detail-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .activity-detail-label {
                font-weight: 600;
                color: #666;
            }

            .activity-notes {
                margin-top: 1rem;
            }

            .activity-note {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }

            .activity-note-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                color: #666;
                font-size: 0.9rem;
            }

            .new-note-form {
                margin-top: 1rem;
            }

            .new-note-form textarea {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                margin-bottom: 1rem;
                resize: vertical;
                min-height: 100px;
            }

            .metadata-section {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 4px;
                margin-top: 1rem;
            }

            .metadata-title {
                font-weight: 600;
                margin-bottom: 0.5rem;
            }

            .metadata-content {
                white-space: pre-wrap;
                font-family: monospace;
            }

            .status-history {
                margin-top: 1rem;
            }

            .status-history-item {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem;
                border-bottom: 1px solid #dee2e6;
            }

            .status-history-item:last-child {
                border-bottom: none;
            }
        `;
        document.head.appendChild(style);
    }

    // Fetch user info on load
    async function fetchUserInfo() {
        try {
            const response = await fetch('/api/backoffice/user', {
                credentials: 'same-origin'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/backoffice';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            userInfo = await response.json();
            console.log('Fetched user info:', userInfo); // Debug log

            // Store user info in localStorage
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            updateUserInterface();
            // After getting user info, fetch activity data
            await fetchActivityData();
        } catch (error) {
            console.error('Error fetching user info:', error);
            if (error.message.includes('401')) {
                window.location.href = '/backoffice';
            }
        }
    }

    // Setup tab switching
    function setupActivityTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', async () => {
                // Update active state
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update current doer type and fetch data
                currentDoerType = button.getAttribute('data-doer-type').toLowerCase();
                await fetchActivityData();
            });
        });
    }

    // Fetch and display activity data
    async function fetchActivityData() {
        try {
            const response = await fetch(`/api/backoffice/activity/${currentDoerType}`, {
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (response.status === 401) {
                console.log('Session expired, redirecting to login...');
                window.location.href = '/backoffice';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response but got ${contentType}`);
            }

            const activities = await response.json();
            console.log('Fetched activities:', activities); // Debug log

            if (!activities || activities.length === 0) {
                console.warn(`No activities found for ${currentDoerType}`);
                const activityLog = document.getElementById('activity-log');
                if (activityLog) {
                    activityLog.innerHTML = `<tr><td colspan="7" class="text-center">No activities found for ${currentDoerType}</td></tr>`;
                }
                return;
            }

            // Filter activities by doerType
            const filteredActivities = activities.filter(activity =>
                activity.doerType.toLowerCase() === currentDoerType.toLowerCase()
            );

            // Store activities
            allActivities = filteredActivities;

            displayActivityData(filteredActivities);
        } catch (error) {
            console.error('Error fetching activity data:', error);
            const activityLog = document.getElementById('activity-log');
            if (activityLog) {
                activityLog.innerHTML = '<tr><td colspan="6" class="text-center">Error loading activities. Please try refreshing the page.</td></tr>';
            }
        }
    }

    // Display activity data in the table
    function displayActivityData(activities) {
        if (!Array.isArray(activities)) {
            console.error('Activities is not an array:', activities);
            return;
        }

        updateFilterOptions(activities);
        applyFiltersAndDisplay();
    }

    // Show activity details modal
    async function showActivityModal(activity) {
        // Ensure we have user info before showing modal
        if (!userInfo) {
            try {
                const response = await fetch('/api/backoffice/user', {
                    credentials: 'same-origin'
                });
                if (!response.ok) throw new Error('Failed to fetch user info');
                userInfo = await response.json();
            } catch (error) {
                console.error('Error fetching user info:', error);
                alert('Failed to load user information. Please refresh the page.');
                return;
            }
        }

        const modal = document.createElement('div');
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="activity-modal-content">
                <div class="activity-modal-header">
                    <h3>${ACTIVITY_CATEGORIES[activity.category] || activity.category} - ${ACTION_TYPES[activity.action] || activity.action}</h3>
                    <button class="activity-modal-close">&times;</button>
                </div>
                <div class="activity-modal-body">
                    <div class="activity-details">
                        <div class="activity-detail-item">
                            <span class="activity-detail-label">Created By</span>
                            <span>${activity.doerName} (${activity.doerType})</span>
                        </div>
                        <div class="activity-detail-item">
                            <span class="activity-detail-label">Created At</span>
                            <span>${formatDate(activity.createdAt)}</span>
                        </div>
                        <div class="activity-detail-item">
                            <span class="activity-detail-label">Status</span>
                            <span class="status-badge ${activity.status.toLowerCase()}">${activity.status}</span>
                        </div>
                        <div class="activity-detail-item">
                            <span class="activity-detail-label">Progress</span>
                            <span>${activity.currentStep}/${activity.totalSteps}</span>
                        </div>
                        <div class="activity-detail-item">
                            <span class="activity-detail-label">Target Type</span>
                            <span>${activity.targetType}</span>
                        </div>
                        <div class="activity-detail-item">
                            <span class="activity-detail-label">Target ID</span>
                            <span>${activity.targetId}</span>
                        </div>
                    </div>

                    <div class="metadata-section">
                        <div class="metadata-title">Metadata</div>
                        <div class="metadata-content">${JSON.stringify(activity.metadata, null, 2)}</div>
                    </div>

                    <div class="status-history">
                        <h4>Status History</h4>
                        ${activity.statusHistory.map(history => `
                            <div class="status-history-item">
                                <div>
                                    ${history.from ? `${history.from} → ` : ''}${history.to}
                                    <small>(${history.reason})</small>
                                </div>
                                <div>${formatDate(history.timestamp)}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="activity-notes">
                        <h4>Notes</h4>
                        ${activity.notes.map(note => `
                            <div class="activity-note">
                                <div class="activity-note-header">
                                    <span>${note.userName || note.userId}</span>
                                    <span>${formatDate(note.timestamp)}</span>
                                </div>
                                <div>${note.text}</div>
                            </div>
                        `).join('')}

                        <div class="new-note-form">
                            <textarea id="new-note-text" placeholder="Add a new note..."></textarea>
                            <button class="btn btn-primary" id="add-note-btn">Add Note</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);

        // Handle close button
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 200);
        };

        modal.querySelector('.activity-modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        // Handle add note
        const addNoteBtn = modal.querySelector('#add-note-btn');
        const noteTextarea = modal.querySelector('#new-note-text');

        addNoteBtn.addEventListener('click', async () => {
            const noteText = noteTextarea.value.trim();
            if (!noteText) {
                alert('Please enter a note');
                return;
            }

            try {
                console.log('Current userInfo:', userInfo); // Debug log
                if (!userInfo || !userInfo.firstName || !userInfo.lastName) {
                    console.log('Fetching user info before adding note...'); // Debug log
                    const userResponse = await fetch('/api/backoffice/user', {
                        credentials: 'same-origin'
                    });
                    if (!userResponse.ok) throw new Error('Failed to fetch user info');
                    userInfo = await userResponse.json();
                    console.log('Fetched userInfo:', userInfo); // Debug log
                }

                const response = await fetch(`/api/backoffice/activity/${currentDoerType}/${activity.id}/notes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: noteText,
                        userId: userInfo.id,
                        userName: `${userInfo.firstName} ${userInfo.lastName}`
                    })
                });

                if (!response.ok) throw new Error('Failed to add note');

                // Refresh activity data and close modal
                await fetchActivityData();
                closeModal();
            } catch (error) {
                console.error('Error adding note:', error);
                alert('Failed to add note. Please try again.');
            }
        });
    }

    // Update filter dropdowns with unique values
    function updateFilterOptions(activities) {
        const doerFilter = document.getElementById('doer-filter');
        const categoryFilter = document.getElementById('category-filter');
        const actionFilter = document.getElementById('action-filter');
        const statusFilter = document.getElementById('status-filter');

        if (!doerFilter || !categoryFilter || !actionFilter || !statusFilter) return;

        // Get unique values
        const doers = [...new Set(activities.map(a => a.doerName))].sort();
        const categories = [...new Set(activities.map(a => a.category))].sort();
        const actions = [...new Set(activities.map(a => a.action))].sort();
        const statuses = [...new Set(activities.map(a => a.status))].sort();

        // Populate doer filter
        doerFilter.innerHTML = '<option value="">All Users</option>' +
            doers.map(doer => `<option value="${doer}">${doer}</option>`).join('');

        // Populate category filter
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${ACTIVITY_CATEGORIES[cat] || cat}</option>`).join('');

        // Populate action filter
        actionFilter.innerHTML = '<option value="">All Actions</option>' +
            actions.map(act => `<option value="${act}">${ACTION_TYPES[act] || act}</option>`).join('');

        // Populate status filter
        statusFilter.innerHTML = '<option value="">All Statuses</option>' +
            statuses.map(status => `<option value="${status}">${status}</option>`).join('');
    }

    // Apply filters and display filtered activities
    function applyFiltersAndDisplay() {
        const searchTerm = document.getElementById('activity-search')?.value.toLowerCase() || '';
        const selectedDoer = document.getElementById('doer-filter')?.value || '';
        const selectedCategory = document.getElementById('category-filter')?.value || '';
        const selectedAction = document.getElementById('action-filter')?.value || '';
        const selectedStatus = document.getElementById('status-filter')?.value || '';

        const activities = allActivities;

        const filteredActivities = activities.filter(activity => {
            const matchesSearch = !searchTerm ||
                activity.doerName.toLowerCase().includes(searchTerm) ||
                ACTIVITY_CATEGORIES[activity.category]?.toLowerCase().includes(searchTerm) ||
                ACTION_TYPES[activity.action]?.toLowerCase().includes(searchTerm) ||
                activity.status.toLowerCase().includes(searchTerm) ||
                JSON.stringify(activity.metadata).toLowerCase().includes(searchTerm) ||
                (activity.notes || []).some(note => note.text.toLowerCase().includes(searchTerm));
            const matchesDoer = !selectedDoer || activity.doerName === selectedDoer;
            const matchesCategory = !selectedCategory || activity.category === selectedCategory;
            const matchesAction = !selectedAction || activity.action === selectedAction;
            const matchesStatus = !selectedStatus || activity.status === selectedStatus;

            return matchesSearch && matchesDoer && matchesCategory && matchesAction && matchesStatus;
        });

        const activityLog = document.getElementById('activity-log');
        if (!activityLog) return;

        const rows = filteredActivities.map(activity => {
            const progress = activity.totalSteps > 0
                ? Math.round((activity.currentStep / activity.totalSteps) * 100)
                : 100;

            return `
                    <tr data-activity-id="${activity.id}">
                        <td>${formatDate(activity.createdAt)}</td>
                        <td>${activity.doerName || 'Unknown'}</td>
                        <td>${ACTIVITY_CATEGORIES[activity.category] || activity.category}</td>
                        <td>${ACTION_TYPES[activity.action] || activity.action}</td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                                <span class="progress-text">${activity.currentStep}/${activity.totalSteps}</span>
                            </div>
                        </td>
                        <td><span class="status-badge ${activity.status.toLowerCase()}">${activity.status}</span></td>
                        <td>${activity.notes.length > 0 ? activity.notes[activity.notes.length - 1].text : 'No notes'}</td>
                    </tr>
                `;
        }).join('');

        activityLog.innerHTML = rows || '<tr><td colspan="7" class="text-center">No activities found</td></tr>';

        // Add click event listeners to rows after setting innerHTML
        const activityRows = activityLog.querySelectorAll('tr[data-activity-id]');
        activityRows.forEach(row => {
            row.addEventListener('click', () => {
                const activityId = row.getAttribute('data-activity-id');
                const activity = allActivities.find(a => a.id === activityId);
                if (activity) {
                    showActivityModal(activity);
                }
            });
        });
    }

    // Add filter event listeners
    function setupFilterListeners() {
        const filterElements = [
            'activity-search',
            'category-filter',
            'action-filter',
            'status-filter',
            'doer-filter'
        ];

        filterElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                if (elementId === 'activity-search') {
                    // Add debounce for search inputs
                    let debounceTimeout;
                    element.addEventListener('input', () => {
                        clearTimeout(debounceTimeout);
                        debounceTimeout = setTimeout(() => {
                            applyFiltersAndDisplay();
                        }, 300);
                    });
                } else {
                    element.addEventListener('change', applyFiltersAndDisplay);
                }
            }
        });
    }

    // Format date for display
    function formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Log activity function
    async function logActivity(category, action, targetType, targetId, metadata = {}, totalSteps = 1) {
        if (!userInfo) return;

        try {
            const activity = {
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                category,
                action,
                doerType: 'EMPLOYEE',
                doerId: userInfo.id,
                doerName: `${userInfo.firstName} ${userInfo.lastName}`,
                targetType,
                targetId,
                status: 'PENDING',
                currentStep: 1,
                totalSteps,
                metadata,
                assignedTo: [],
                notes: [],
                statusHistory: [
                    {
                        from: null,
                        to: 'PENDING',
                        timestamp: new Date().toISOString(),
                        changedBy: userInfo.id,
                        reason: 'Activity created'
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const response = await fetch('/api/backoffice/activity/employee', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(activity)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Refresh activity display
            await fetchActivityData();

            return activity.id;
        } catch (error) {
            console.error('Error logging activity:', error);
            return null;
        }
    }

    // Export activity tracking for use in other modules
    window.activityTracking = {
        logActivity,
        ACTIVITY_CATEGORIES,
        ACTION_TYPES
    };

    // Update UI with user info
    function updateUserInterface() {
        // Try to get user info from localStorage if not available in memory
        if (!userInfo) {
            const storedUserInfo = localStorage.getItem('userInfo');
            if (storedUserInfo) {
                userInfo = JSON.parse(storedUserInfo);
                console.log('Loaded userInfo from localStorage:', userInfo);
            }
        }

        if (userInfo) {
            // Update welcome message with user's first name
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage && userInfo.firstName) {
                welcomeMessage.textContent = `Welcome back, ${userInfo.firstName}`;
            }
            console.log('User info loaded:', userInfo);
        }
    }

    // Handle logout
    async function handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });

            if (response.ok) {
                // Clear stored user info
                localStorage.removeItem('userInfo');
                // Redirect to login page
                window.location.href = '/backoffice';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout. Please try again.');
        }
    }

    // Navigation handling
    async function handleNavigation(e) {
        e.preventDefault();
        const section = e.target.getAttribute('href').substring(1);
        console.log('Dashboard: Navigating to section:', section);

        // Even if it's the same section, we should reinitialize if needed
        if (currentSection === section) {
            console.log('Dashboard: Reinitializing current section:', section);
            // Clean up the current section
            const cleanupFn = window[`cleanup${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}Module`];
            if (typeof cleanupFn === 'function') {
                console.log(`Dashboard: Cleaning up ${currentSection} module`);
                cleanupFn();
            }
        }

        // Update active state
        navLinks.forEach(link => {
            link.classList.toggle('active', link === e.target);
        });

        try {
            console.log('Dashboard: Fetching section content...');
            const response = await fetch(`/backoffice/dashboard/${section}/index.html`, {
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error(`Failed to load ${section} section`);

            const content = await response.text();
            const mainContent = document.querySelector('.dashboard-content');

            // Extract just the main content from the loaded HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const newContentElement = tempDiv.querySelector('.dashboard-content');

            if (!newContentElement) {
                throw new Error(`Section ${section} content structure is invalid`);
            }

            console.log('Dashboard: Setting new content for', section);

            // Don't update content if we're already on the dashboard
            if (section !== 'dashboard') {
                // Cleanup previous section if needed
                if (currentSection) {
                    const cleanupFn = window[`cleanup${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}Module`];
                    if (typeof cleanupFn === 'function') {
                        console.log(`Dashboard: Cleaning up ${currentSection} module`);
                        cleanupFn();
                    }
                }

                mainContent.innerHTML = newContentElement.innerHTML;
                currentSection = section;
            }

            // Update URL without page reload
            history.pushState(null, '', `#${section}`);

            // Load web component scripts if not already loaded
            const componentScripts = ['clients', 'partners', 'students'].includes(section) ? [
                '/backoffice/components/base-module.js',
                '/backoffice/components/user-management-base-module.js',
                `/backoffice/components/${section.replace(/s$/, '')}-module.js`
            ] : [
                '/backoffice/components/base-module.js',
                `/backoffice/components/${section.replace(/s$/, '')}-module.js`
            ];

            for (const scriptSrc of componentScripts) {
                if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = scriptSrc;
                        script.onload = resolve;
                        script.onerror = reject;
                        document.body.appendChild(script);
                    });
                }
            }

            // Give the browser time to register the custom elements
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`Error loading section ${section}:`, error);
            if (error.message.includes('404')) {
                alert(`The ${section} section is not available yet.`);
            } else {
                alert('Error loading section. Please try again.');
            }
        }
    }

    // Toggle navigation collapse
    function handleNavToggle() {
        const nav = document.querySelector('.dashboard-nav');
        nav.classList.toggle('collapsed');

        // Update toggle icon
        const icon = toggleNav.querySelector('.toggle-icon');
        if (nav.classList.contains('collapsed')) {
            icon.textContent = '→';
        } else {
            icon.textContent = '☰';
        }
    }

    // Handle dropdown toggles
    function handleDropdownToggle(e) {
        const section = e.target.closest('.nav-section');

        // Close other dropdowns
        dropdownToggles.forEach(toggle => {
            const otherSection = toggle.closest('.nav-section');
            if (otherSection !== section) {
                otherSection.classList.remove('active');
            }
        });

        // Toggle current dropdown
        section.classList.toggle('active');
    }

    // Event listeners
    logoutBtn.addEventListener('click', handleLogout);
    toggleNav.addEventListener('click', handleNavToggle);

    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', handleDropdownToggle);
    });

    // Initialize charts
    function initializeCharts() {
        // Mock data for enrollments per month (last 6 months)
        const enrollmentData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Course Enrollments',
                data: [45, 62, 58, 71, 83, 76],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        };

        // Mock data for new subscribers per month (last 6 months)
        const subscriberData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'New Subscribers',
                data: [28, 35, 42, 38, 45, 52],
                backgroundColor: 'rgba(255, 102, 0, 0.2)',
                borderColor: 'rgba(255, 102, 0, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        };

        // Common chart options
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        };

        // Create enrollments chart
        const enrollmentsCtx = document.getElementById('enrollmentsChart')?.getContext('2d');
        if (enrollmentsCtx) {
            new Chart(enrollmentsCtx, {
                type: 'line',
                data: enrollmentData,
                options: chartOptions
            });
        }

        // Create subscribers chart
        const subscribersCtx = document.getElementById('subscribersChart')?.getContext('2d');
        if (subscribersCtx) {
            new Chart(subscribersCtx, {
                type: 'line',
                data: subscriberData,
                options: chartOptions
            });
        }
    }

    // Initialize
    updateUserInterface(); // Show welcome message immediately using localStorage
    addActivityStyles(); // Add activity styles
    setupActivityFilters(); // Setup activity filters
    setupFilterListeners(); // Setup filter listeners after filters are created
    setupActivityTabs(); // Setup activity tab switching
    initializeCharts(); // Initialize the charts
    fetchUserInfo(); // This will also fetch activity data after user info is loaded

    // Handle initial section load if URL has a hash
    if (window.location.hash) {
        console.log('Dashboard: Initial hash detected:', window.location.hash);
        const section = window.location.hash.substring(1);
        const link = document.querySelector(`.nav-section a[href="#${section}"]`);
        if (link) {
            console.log('Dashboard: Triggering initial navigation');
            link.click();
        }
    }

    // Add warning before page unload if there are unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (window.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            // Implement save functionality
            console.log('Save shortcut pressed');
        }
    });
});
