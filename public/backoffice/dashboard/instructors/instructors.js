console.log('Frontend: Instructors module script loaded');

// Global state for instructors data
window.instructorsState = window.instructorsState || {
    instructors: [],
    filteredInstructors: []
};

// Store module-level event handlers in window object
window.moduleEventHandlers = window.moduleEventHandlers || {
    filterHandler: null,
    createFormHandler: null,
    modalOutsideClickHandler: null,
    modalCloseHandlers: []
};

// Function to initialize the instructors module
function initializeInstructorsModule() {
    console.log('Frontend: Initializing instructors module');

    // DOM Elements
    const instructorSearch = document.getElementById('instructorSearch');
    const statusFilter = document.getElementById('statusFilter');
    const expertiseFilter = document.getElementById('expertiseFilter');
    const deliveryMethodFilter = document.getElementById('deliveryMethodFilter');
    const instructorsTableBody = document.getElementById('instructorsTableBody');
    const instructorModal = document.getElementById('instructorModal');
    const modalClose = document.querySelectorAll('.modal-close');

    // Log DOM element status
    console.log('Frontend: DOM Elements found:', {
        instructorSearch: !!instructorSearch,
        statusFilter: !!statusFilter,
        expertiseFilter: !!expertiseFilter,
        deliveryMethodFilter: !!deliveryMethodFilter,
        instructorsTableBody: !!instructorsTableBody,
        instructorModal: !!instructorModal,
        modalClose: modalClose.length
    });

    // Fetch instructors data
    async function fetchInstructors() {
        try {
            console.log('Frontend: Fetching instructors...');
            const response = await fetch('/api/backoffice/instructors');
            console.log('Frontend: Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch instructors: ${response.status}`);
            }
            window.instructorsState.instructors = await response.json();
            console.log('Frontend: Received instructors data:', window.instructorsState.instructors);
            window.instructorsState.filteredInstructors = [...window.instructorsState.instructors];
            console.log('Frontend: Set filtered instructors:', window.instructorsState.filteredInstructors.length, 'instructors');
            renderInstructors();
        } catch (error) {
            console.error('Error fetching instructors:', error);
            if (error.message === 'Failed to fetch') {
                console.error('Network error or server not responding');
            } else {
                console.error('Response:', error.message);
            }
            alert('Error loading instructors data. Please try again or contact support if the issue persists.');
        }
    }

    // Render instructors table
    function renderInstructors() {
        console.log('Frontend: Starting render with', window.instructorsState.filteredInstructors.length, 'instructors');
        if (!instructorsTableBody) {
            console.error('Frontend: instructorsTableBody element not found!');
            return;
        }
        instructorsTableBody.innerHTML = window.instructorsState.filteredInstructors.map(instructor => `
            <tr data-instructor-id="${instructor.id}">
                <td>${instructor.id}</td>
                <td>${instructor.firstName} ${instructor.lastName}</td>
                <td>${instructor.expertise.slice(0, 3).join(', ')}${instructor.expertise.length > 3 ? '...' : ''}</td>
                <td><span class="status-badge" data-status="${instructor.status}">${instructor.status}</span></td>
                <td>${instructor.performanceMetrics.averageRating.toFixed(1)}</td>
                <td>${instructor.performanceMetrics.totalSessionsTaught}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon view-instructor" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="btn btn-icon edit-instructor" title="Edit Instructor">
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
        document.querySelectorAll('.view-instructor').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const instructorId = e.target.closest('tr').dataset.instructorId;
                showInstructorDetails(instructorId, false);
            });
        });

        document.querySelectorAll('.edit-instructor').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit button clicked');
                const row = btn.closest('tr');
                if (!row) {
                    console.error('Could not find parent row');
                    return;
                }
                const instructorId = row.dataset.instructorId;
                if (!instructorId) {
                    console.error('No instructor ID found');
                    return;
                }
                console.log('Editing instructor:', instructorId);
                showInstructorDetails(instructorId, true);
            });
        });

        document.querySelectorAll('tr[data-instructor-id]').forEach(row => {
            row.addEventListener('click', () => {
                const instructorId = row.dataset.instructorId;
                showInstructorDetails(instructorId, false);
            });
        });
    }

    // Filter instructors based on search and filter values
    function filterInstructors() {
        const searchTerm = instructorSearch.value.toLowerCase();
        const statusValue = statusFilter.value;
        const expertiseValue = expertiseFilter.value;
        const deliveryMethodValue = deliveryMethodFilter.value;

        window.instructorsState.filteredInstructors = window.instructorsState.instructors.filter(instructor => {
            const matchesSearch =
                instructor.id.toLowerCase().includes(searchTerm) ||
                instructor.firstName.toLowerCase().includes(searchTerm) ||
                instructor.lastName.toLowerCase().includes(searchTerm) ||
                instructor.email.toLowerCase().includes(searchTerm) ||
                instructor.expertise.some(exp => exp.toLowerCase().includes(searchTerm));

            const matchesStatus = !statusValue || instructor.status === statusValue;
            const matchesExpertise = !expertiseValue || instructor.expertise.includes(expertiseValue);
            const matchesDeliveryMethod = !deliveryMethodValue || instructor.preferredDeliveryMethods.includes(deliveryMethodValue);

            return matchesSearch && matchesStatus && matchesExpertise && matchesDeliveryMethod;
        });

        renderInstructors();
    }

    // Show instructor details in modal
    function showInstructorDetails(instructorId, editMode = false) {
        const instructor = window.instructorsState.instructors.find(i => i.id === instructorId);
        if (!instructor) return;

        const modalBody = instructorModal.querySelector('.modal-body');
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        modalTitle.textContent = editMode ? 'Edit Instructor' : 'Instructor Details';
        saveBtn.style.display = editMode ? 'block' : 'none';
        editBtn.style.display = editMode ? 'none' : 'block';

        if (editMode) {
            modalBody.innerHTML = `
                <div class="instructor-details edit-mode">
                    <div class="detail-section">
                        <h4>Basic Information</h4>
                        <div class="form-group">
                            <label>ID</label>
                            <input type="text" id="instructorId" value="${instructor.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" id="firstName" value="${instructor.firstName}">
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" id="lastName" value="${instructor.lastName}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="email" value="${instructor.email}">
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="phone" value="${instructor.phone}">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="status">
                                <option value="Active" ${instructor.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Inactive" ${instructor.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Expertise & Delivery Methods</h4>
                        <div class="form-group">
                            <label>Expertise (comma-separated)</label>
                            <input type="text" id="expertise" value="${instructor.expertise.join(', ')}">
                        </div>
                        <div class="form-group">
                            <label>Preferred Delivery Methods</label>
                            <div class="checkbox-group">
                                <label>
                                    <input type="checkbox" value="Virtual" 
                                        ${instructor.preferredDeliveryMethods.includes('Virtual') ? 'checked' : ''}>
                                    Virtual
                                </label>
                                <label>
                                    <input type="checkbox" value="On-site" 
                                        ${instructor.preferredDeliveryMethods.includes('On-site') ? 'checked' : ''}>
                                    On-site
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Availability</h4>
                        <div class="form-group">
                            <label>Preferred Time Zone</label>
                            <input type="text" id="timeZone" value="${instructor.availability.preferredTimeZone}">
                        </div>
                        <div class="form-group">
                            <label>Maximum Sessions per Month</label>
                            <input type="number" id="maxSessions" value="${instructor.availability.maxSessionsPerMonth}">
                        </div>
                    </div>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="instructor-details">
                    <div class="detail-section">
                        <h4>Basic Information</h4>
                        <div class="detail-grid">
                            <span class="detail-label">ID:</span>
                            <span>${instructor.id}</span>
                            <span class="detail-label">Name:</span>
                            <span>${instructor.firstName} ${instructor.lastName}</span>
                            <span class="detail-label">Email:</span>
                            <span>${instructor.email}</span>
                            <span class="detail-label">Phone:</span>
                            <span>${instructor.phone}</span>
                            <span class="detail-label">Status:</span>
                            <span class="status-badge" data-status="${instructor.status}">${instructor.status}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Expertise & Skills</h4>
                        <ul class="expertise-list">
                            ${instructor.expertise.map(exp => `<li>${exp}</li>`).join('')}
                        </ul>
                        <h4 class="mt-4">Preferred Delivery Methods</h4>
                        <ul class="expertise-list">
                            ${instructor.preferredDeliveryMethods.map(method => `<li>${method}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="detail-section">
                        <h4>Performance Metrics</h4>
                        <div class="detail-grid">
                            <span class="detail-label">Average Rating:</span>
                            <div class="rating">
                                <span class="rating-value">${instructor.performanceMetrics.averageRating.toFixed(1)}</span>
                                <span class="rating-count">(${instructor.performanceMetrics.totalSessionsTaught} sessions)</span>
                            </div>
                            <span class="detail-label">Student Satisfaction:</span>
                            <span>${instructor.performanceMetrics.studentSatisfactionScore}%</span>
                            <span class="detail-label">Last Review:</span>
                            <span>${new Date(instructor.performanceMetrics.lastReviewDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Availability</h4>
                        <div class="detail-grid">
                            <span class="detail-label">Time Zone:</span>
                            <span>${instructor.availability.preferredTimeZone}</span>
                            <span class="detail-label">Max Sessions/Month:</span>
                            <span>${instructor.availability.maxSessionsPerMonth}</span>
                        </div>
                        ${instructor.availability.blackoutDates.length > 0 ? `
                            <h4 class="mt-4">Blackout Dates</h4>
                            <ul>
                                ${instructor.availability.blackoutDates.map(date => `
                                    <li>${new Date(date.startDate).toLocaleDateString()} - ${new Date(date.endDate).toLocaleDateString()}: ${date.reason}</li>
                                `).join('')}
                            </ul>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        instructorModal.classList.add('active');

        // Add event listeners for edit mode
        if (editMode) {
            saveBtn.onclick = async () => {
                try {
                    await saveInstructorChanges(instructorId);
                    instructorModal.classList.remove('active');
                } catch (error) {
                    console.error('Failed to save changes:', error);
                }
            };
            cancelBtn.onclick = () => {
                instructorModal.classList.remove('active');
            };
        } else {
            editBtn.onclick = () => showInstructorDetails(instructorId, true);
        }
    }

    // Save instructor changes
    async function saveInstructorChanges(instructorId) {
        console.log('Saving changes for instructor:', instructorId);

        const updatedInstructor = {
            id: instructorId,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            status: document.getElementById('status').value,
            expertise: document.getElementById('expertise').value.split(',').map(item => item.trim()),
            preferredDeliveryMethods: Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.value),
            availability: {
                preferredTimeZone: document.getElementById('timeZone').value,
                maxSessionsPerMonth: parseInt(document.getElementById('maxSessions').value),
                blackoutDates: [] // Maintain existing blackout dates
            }
        };

        console.log('Updated instructor data:', updatedInstructor);

        try {
            const url = `/api/backoffice/instructors/${encodeURIComponent(instructorId)}`;
            console.log('Making PUT request to:', url);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedInstructor)
            });

            console.log('Response status:', response.status);
            const responseData = await response.text();
            console.log('Response data:', responseData);

            if (!response.ok) {
                throw new Error(`Failed to update instructor: ${response.status} - ${responseData}`);
            }

            // Update local data
            const index = window.instructorsState.instructors.findIndex(i => i.id === instructorId);
            if (index !== -1) {
                console.log('Updating local data at index:', index);
                window.instructorsState.instructors[index] = {
                    ...window.instructorsState.instructors[index],
                    ...updatedInstructor
                };
                filterInstructors(); // Re-render the table
            }

            instructorModal.classList.remove('active');
            console.log('Instructor updated successfully');
        } catch (error) {
            console.error('Error updating instructor:', error);
            alert(`Error updating instructor: ${error.message}`);
            throw error;
        }
    }

    // Create new instructor
    async function createNewInstructor(instructorData) {
        try {
            console.log('Creating new instructor:', instructorData);
            const response = await fetch('/api/backoffice/instructors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(instructorData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to create instructor: ${response.status} - ${errorData}`);
            }

            const newInstructor = await response.json();
            window.instructorsState.instructors.push(newInstructor);
            filterInstructors(); // Re-render the table
            instructorModal.classList.remove('active');
            console.log('Instructor created successfully');
        } catch (error) {
            console.error('Error creating instructor:', error);
            alert(`Error creating instructor: ${error.message}`);
            throw error;
        }
    }

    // Show empty instructor form for creation
    function showCreateInstructorForm() {
        const modalBody = instructorModal.querySelector('.modal-body');
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        modalTitle.textContent = 'Create New Instructor';
        saveBtn.style.display = 'block';
        editBtn.style.display = 'none';

        modalBody.innerHTML = `
            <div class="instructor-details edit-mode">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" id="firstName" placeholder="Enter first name">
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" id="lastName" placeholder="Enter last name">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="email" placeholder="Enter email">
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="phone" placeholder="Enter phone number">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="status">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Expertise & Delivery Methods</h4>
                    <div class="form-group">
                        <label>Expertise (comma-separated)</label>
                        <input type="text" id="expertise" placeholder="e.g., Java, Spring Framework, JavaScript">
                    </div>
                    <div class="form-group">
                        <label>Preferred Delivery Methods</label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" value="Virtual">
                                Virtual
                            </label>
                            <label>
                                <input type="checkbox" value="On-site">
                                On-site
                            </label>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Availability</h4>
                    <div class="form-group">
                        <label>Preferred Time Zone</label>
                        <input type="text" id="timeZone" placeholder="e.g., America/New_York">
                    </div>
                    <div class="form-group">
                        <label>Maximum Sessions per Month</label>
                        <input type="number" id="maxSessions" placeholder="Enter maximum sessions">
                    </div>
                </div>
            </div>
        `;

        instructorModal.classList.add('active');

        // Add event listener for save button
        saveBtn.onclick = async () => {
            try {
                const newInstructor = {
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    status: document.getElementById('status').value,
                    expertise: document.getElementById('expertise').value.split(',').map(item => item.trim()),
                    preferredDeliveryMethods: Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                        .map(checkbox => checkbox.value),
                    availability: {
                        preferredTimeZone: document.getElementById('timeZone').value,
                        maxSessionsPerMonth: parseInt(document.getElementById('maxSessions').value),
                        blackoutDates: []
                    },
                    performanceMetrics: {
                        averageRating: 0,
                        totalSessionsTaught: 0,
                        studentSatisfactionScore: 0,
                        lastReviewDate: new Date().toISOString()
                    }
                };

                await createNewInstructor(newInstructor);
            } catch (error) {
                console.error('Failed to create instructor:', error);
            }
        };

        cancelBtn.onclick = () => {
            instructorModal.classList.remove('active');
        };
    }

    // Only set up event listeners if all required elements exist
    if (instructorSearch && statusFilter && expertiseFilter && deliveryMethodFilter && instructorModal && instructorsTableBody) {
        // Store and attach event handlers
        window.moduleEventHandlers.filterHandler = filterInstructors;
        window.moduleEventHandlers.createFormHandler = showCreateInstructorForm;
        window.moduleEventHandlers.modalOutsideClickHandler = (e) => {
            if (e.target === instructorModal) {
                instructorModal.classList.remove('active');
            }
        };

        // Event Listeners
        instructorSearch.addEventListener('input', window.moduleEventHandlers.filterHandler);
        statusFilter.addEventListener('change', window.moduleEventHandlers.filterHandler);
        expertiseFilter.addEventListener('change', window.moduleEventHandlers.filterHandler);
        deliveryMethodFilter.addEventListener('change', window.moduleEventHandlers.filterHandler);

        // Create instructor button
        const createInstructorBtn = document.getElementById('createInstructorBtn');
        if (createInstructorBtn) {
            createInstructorBtn.addEventListener('click', window.moduleEventHandlers.createFormHandler);
        }

        modalClose.forEach(btn => {
            const handler = () => instructorModal.classList.remove('active');
            window.moduleEventHandlers.modalCloseHandlers.push(handler);
            btn.addEventListener('click', handler);
        });

        // Close modal when clicking outside
        instructorModal.addEventListener('click', window.moduleEventHandlers.modalOutsideClickHandler);

        // Check if we have existing data and it's valid
        if (window.instructorsState?.instructors?.length > 0) {
            console.log('Frontend: Using existing instructors data');
            window.instructorsState.filteredInstructors = [...window.instructorsState.instructors];
            renderInstructors();
        } else {
            // Initialize or refresh data
            console.log('Frontend: No existing data found, fetching from server');
            fetchInstructors();
        }
    } else {
        console.error('Frontend: Some required DOM elements are missing');
    }
}

// Cleanup function for the instructors module
window.cleanupInstructorsModule = () => {
    console.log('Frontend: Cleaning up instructors module');

    // Remove event listeners using stored handlers
    const instructorSearch = document.getElementById('instructorSearch');
    const statusFilter = document.getElementById('statusFilter');
    const expertiseFilter = document.getElementById('expertiseFilter');
    const deliveryMethodFilter = document.getElementById('deliveryMethodFilter');
    const createInstructorBtn = document.getElementById('createInstructorBtn');
    const instructorModal = document.getElementById('instructorModal');
    const modalClose = document.querySelectorAll('.modal-close');

    if (window.moduleEventHandlers.filterHandler) {
        if (instructorSearch) instructorSearch.removeEventListener('input', window.moduleEventHandlers.filterHandler);
        if (statusFilter) statusFilter.removeEventListener('change', window.moduleEventHandlers.filterHandler);
        if (expertiseFilter) expertiseFilter.removeEventListener('change', window.moduleEventHandlers.filterHandler);
        if (deliveryMethodFilter) deliveryMethodFilter.removeEventListener('change', window.moduleEventHandlers.filterHandler);
    }

    if (window.moduleEventHandlers.createFormHandler && createInstructorBtn) {
        createInstructorBtn.removeEventListener('click', window.moduleEventHandlers.createFormHandler);
    }

    if (window.moduleEventHandlers.modalOutsideClickHandler && instructorModal) {
        instructorModal.removeEventListener('click', window.moduleEventHandlers.modalOutsideClickHandler);
    }

    modalClose.forEach((btn, index) => {
        if (window.moduleEventHandlers.modalCloseHandlers[index]) {
            btn.removeEventListener('click', window.moduleEventHandlers.modalCloseHandlers[index]);
        }
    });

    // Clear event handlers
    window.moduleEventHandlers = {
        filterHandler: null,
        createFormHandler: null,
        modalOutsideClickHandler: null,
        modalCloseHandlers: []
    };

    // Note: We no longer clear the state here to persist data between navigation
};

// Initialize when the instructors section is loaded into the dashboard
if (document.getElementById('instructorSearch')) {
    initializeInstructorsModule();
} else {
    // Retry after a short delay
    setTimeout(() => {
        if (document.getElementById('instructorSearch')) {
            initializeInstructorsModule();
        }
    }, 100);
}
