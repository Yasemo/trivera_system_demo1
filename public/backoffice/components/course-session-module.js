class CourseSessionModule extends BaseModule {
    constructor() {
        super();

        this.instructors = [];
        this.loadInstructors();

        // Configure module for course sessions
        Object.assign(this.moduleConfig, {
            entityType: 'CourseSession',
            apiEndpoint: '/api/backoffice/course-sessions',
            idField: 'id',
            displayNameField: 'courseId',
            searchFields: ['id', 'courseId', 'instructor', 'location'],
            listFields: [
                { path: 'courseId', label: 'Course', type: 'text' },
                { path: 'type', label: 'Type', type: 'text' },
                { path: 'startDate', label: 'Start Date', type: 'datetime' },
                { path: 'endDate', label: 'End Date', type: 'datetime' },
                { path: 'instructor', label: 'Instructor', type: 'text' },
                { path: 'location', label: 'Location', type: 'text' },
                { path: 'status', label: 'Status', type: 'status' }
            ],
            statusField: 'status',
            cssPath: '/backoffice/dashboard/course-sessions/course-sessions.css',
            filters: [
                {
                    id: 'statusFilter',
                    label: 'All Statuses',
                    field: 'status',
                    options: [
                        { value: 'draft', label: 'Draft' },
                        { value: 'in-review', label: 'In Review' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'cancelled', label: 'Cancelled' }
                    ]
                },
                {
                    id: 'typeFilter',
                    label: 'All Types',
                    field: 'type',
                    options: [
                        { value: 'public', label: 'Public' },
                        { value: 'private', label: 'Private' }
                    ]
                },
                {
                    id: 'locationFilter',
                    label: 'All Locations',
                    field: 'location',
                    options: [
                        { value: 'Virtual', label: 'Virtual' },
                        { value: 'On-site', label: 'On-site' }
                    ]
                }
            ],
            schema: {
                courseId: 'string',
                type: "string (enum: 'public', 'private')",
                startDate: 'string (datetime)',
                endDate: 'string (datetime)',
                status: "string (enum: 'approved', 'in-review', 'draft', 'cancelled')",
                location: "string (enum: 'Virtual', 'On-site')",
                maxEnrollment: 'number',
                instructor: 'string',
                clientId: 'string (optional)',
                customOutlineDoc: 'string (optional)',
                cancelReason: 'string (optional)',
                cancelledAt: 'string (datetime, optional)'
            }
        });
    }

    // Load instructors from the API
    async loadInstructors() {
        try {
            const response = await fetch('/api/backoffice/instructors');
            if (!response.ok) throw new Error('Failed to fetch instructors');
            this.instructors = await response.json();
        } catch (error) {
            console.error('Error loading instructors:', error);
            this.instructors = [];
        }
    }

    // Override showCreateForm to ensure instructors are loaded
    async showCreateForm() {
        if (this.instructors.length === 0) {
            await this.loadInstructors();
        }
        super.showCreateForm();
    }

    // Override showItemDetails to ensure instructors are loaded
    async showItemDetails(itemId, editMode = false) {
        if (this.instructors.length === 0) {
            await this.loadInstructors();
        }
        super.showItemDetails(itemId, editMode);
    }

    // Override generateFormField to handle specific field types
    generateFormField(fieldName, fieldSchema = '', value = '') {
        const label = this.formatLabel(fieldName);
        const isRequired = ['courseId', 'type', 'startDate', 'endDate', 'location', 'status', 'maxEnrollment'].includes(fieldName);
        const requiredMark = isRequired ? '<span class="required">*</span>' : '';

        switch (fieldName) {
            case 'startDate':
            case 'endDate':
                const dateValue = value ? new Date(value).toISOString().slice(0, 16) : '';
                return `
                    <div class="form-group">
                        <label for="${fieldName}">${label} ${requiredMark}</label>
                        <input type="datetime-local" id="${fieldName}" name="${fieldName}" 
                               value="${dateValue}" required
                               min="${new Date().toISOString().slice(0, 16)}">
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'type':
                return `
                    <div class="form-group">
                        <label for="type">Session Type ${requiredMark}</label>
                        <select id="type" name="type" required>
                            <option value="">Select Type</option>
                            <option value="public" ${value === 'public' ? 'selected' : ''}>Public</option>
                            <option value="private" ${value === 'private' ? 'selected' : ''}>Private</option>
                        </select>
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'location':
                return `
                    <div class="form-group">
                        <label for="location">Location ${requiredMark}</label>
                        <select id="location" name="location" required>
                            <option value="">Select Location</option>
                            <option value="Virtual" ${value === 'Virtual' ? 'selected' : ''}>Virtual</option>
                            <option value="On-site" ${value === 'On-site' ? 'selected' : ''}>On-site</option>
                        </select>
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'status':
                return `
                    <div class="form-group">
                        <label for="status">Status ${requiredMark}</label>
                        <select id="status" name="status" required>
                            <option value="">Select Status</option>
                            <option value="draft" ${value === 'draft' ? 'selected' : ''}>Draft</option>
                            <option value="in-review" ${value === 'in-review' ? 'selected' : ''}>In Review</option>
                            <option value="approved" ${value === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="cancelled" ${value === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'instructor':
                const activeInstructors = this.instructors.filter(i => i.status === 'Active');
                return `
                    <div class="form-group">
                        <label for="instructor">Instructor</label>
                        <select id="instructor" name="instructor">
                            <option value="TBD">Select Instructor</option>
                            ${activeInstructors.map(instructor => {
                    const fullName = `${instructor.firstName} ${instructor.lastName}`;
                    return `
                                    <option value="${fullName}" ${value === fullName ? 'selected' : ''}>
                                        ${fullName}
                                    </option>
                                `;
                }).join('')}
                        </select>
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'enrollmentCount':
            case 'maxEnrollment':
                const isMax = fieldName === 'maxEnrollment';
                return `
                    <div class="form-group">
                        <label for="${fieldName}">${label} ${isMax ? requiredMark : ''}</label>
                        <input type="number" id="${fieldName}" name="${fieldName}" 
                               value="${value || ''}" min="0" step="1" ${isMax ? 'required' : ''}
                               placeholder="Enter ${label.toLowerCase()}">
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'courseId':
                return `
                    <div class="form-group">
                        <label for="courseId">Course ID ${requiredMark}</label>
                        <input type="text" id="courseId" name="courseId" 
                               value="${value || ''}" required
                               placeholder="Enter course ID">
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'clientId':
                const display = this.shadowRoot?.getElementById('type')?.value === 'private' ? 'block' : 'none';
                return `
                    <div class="form-group client-id-group" style="display: ${display}">
                        <label for="clientId">Client ID <span class="required">*</span></label>
                        <input type="text" id="clientId" name="clientId" 
                               value="${value || ''}"
                               placeholder="Enter client ID">
                        <div class="validation-message"></div>
                    </div>
                `;

            case 'customOutlineDoc':
                const outlineDisplay = this.shadowRoot?.getElementById('type')?.value === 'private' ? 'block' : 'none';
                return `
                    <div class="form-group custom-outline-group" style="display: ${outlineDisplay}">
                        <label for="customOutlineDoc">Custom Outline Document</label>
                        <input type="text" id="customOutlineDoc" name="customOutlineDoc" 
                               value="${value || ''}"
                               placeholder="Enter document name">
                        <div class="validation-message"></div>
                    </div>
                `;

            default:
                return super.generateFormField(fieldName, fieldSchema, value);
        }
    }

    // Override setupEventListeners to handle session type changes
    setupEventListeners() {
        super.setupEventListeners();

        // Add event listener for session type changes
        this.shadowRoot.addEventListener('change', (e) => {
            if (e.target.id === 'type') {
                this.handleSessionTypeChange(e.target.value);
            }
        });
    }

    // Handle session type changes
    handleSessionTypeChange(type) {
        const clientIdGroup = this.shadowRoot.querySelector('.client-id-group');
        const customOutlineGroup = this.shadowRoot.querySelector('.custom-outline-group');

        if (type === 'private') {
            if (clientIdGroup) clientIdGroup.style.display = 'block';
            if (customOutlineGroup) customOutlineGroup.style.display = 'block';
        } else {
            if (clientIdGroup) clientIdGroup.style.display = 'none';
            if (customOutlineGroup) customOutlineGroup.style.display = 'none';
        }
    }

    formatLabel(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/Id$/, 'ID');
    }

    // Override generateViewDetails for better session details display
    generateViewDetails(item) {
        return `
            <div class="session-details">
                <div class="detail-section">
                    <h4>Session Information</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Session ID:</span>
                        <span>${item.id}</span>
                        <span class="detail-label">Course ID:</span>
                        <span>${item.courseId}</span>
                        <span class="detail-label">Type:</span>
                        <span>${item.type}</span>
                        <span class="detail-label">Status:</span>
                        <span class="status-badge" data-status="${item.status}">${item.status}</span>
                        <span class="detail-label">Creation Source:</span>
                        <span>${item.creationSource}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Schedule</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Start Date:</span>
                        <span>${this.formatFieldValue(item.startDate, 'datetime')}</span>
                        <span class="detail-label">End Date:</span>
                        <span>${this.formatFieldValue(item.endDate, 'datetime')}</span>
                        <span class="detail-label">Location:</span>
                        <span>${item.location}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Enrollment</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Current Enrollment:</span>
                        <span>${item.enrollmentCount}</span>
                        <span class="detail-label">Maximum Capacity:</span>
                        <span>${item.maxEnrollment}</span>
                        <span class="detail-label">Instructor:</span>
                        <span>${item.instructor}</span>
                    </div>
                </div>

                ${item.type === 'private' ? `
                    <div class="detail-section">
                        <h4>Client Information</h4>
                        <div class="detail-grid">
                            <span class="detail-label">Client ID:</span>
                            <span>${item.clientId || 'N/A'}</span>
                            <span class="detail-label">Custom Outline:</span>
                            <span>${item.customOutlineDoc || 'None'}</span>
                        </div>
                    </div>
                ` : ''}

                ${item.status === 'cancelled' ? `
                    <div class="detail-section">
                        <h4>Cancellation Details</h4>
                        <div class="detail-grid">
                            <span class="detail-label">Cancel Reason:</span>
                            <span>${item.cancelReason || 'Not specified'}</span>
                            <span class="detail-label">Cancelled At:</span>
                            <span>${this.formatFieldValue(item.cancelledAt, 'datetime')}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Override formatFieldValue to handle specific field types
    formatFieldValue(value, type) {
        if (type === 'datetime') {
            return value ? new Date(value).toLocaleString() : '';
        }
        return super.formatFieldValue(value, type);
    }

    // Override gatherFormData to handle date fields and validation
    gatherFormData() {
        const formData = {
            creationSource: 'staff', // Always set creationSource to 'staff' for backoffice creation
            enrollmentCount: 0 // Initialize enrollment count to 0 for new sessions
        };
        const requiredFields = ['courseId', 'type', 'startDate', 'endDate', 'location', 'status', 'maxEnrollment'];

        requiredFields.forEach(fieldName => {
            const input = this.shadowRoot.getElementById(fieldName);
            if (!input) return;

            let value = input.value.trim();
            if (!value) {
                throw new Error(`${this.formatLabel(fieldName)} is required`);
            }

            if (fieldName === 'startDate' || fieldName === 'endDate') {
                value = new Date(value).toISOString();
            } else if (fieldName === 'maxEnrollment') {
                value = parseInt(value, 10);
                if (isNaN(value) || value < 1) {
                    throw new Error('Maximum enrollment must be a positive number');
                }
            }

            formData[fieldName] = value;
        });

        // Handle optional fields
        const optionalFields = ['enrollmentCount', 'instructor', 'clientId', 'customOutlineDoc', 'cancelReason'];
        optionalFields.forEach(fieldName => {
            const input = this.shadowRoot.getElementById(fieldName);
            if (!input) return;

            let value = input.value.trim();
            if (fieldName === 'enrollmentCount' && value) {
                value = parseInt(value, 10);
                if (isNaN(value) || value < 0) {
                    throw new Error('Enrollment count must be a non-negative number');
                }
                if (value > formData.maxEnrollment) {
                    throw new Error('Enrollment count cannot exceed maximum enrollment');
                }
            }

            if (value) {
                formData[fieldName] = value;
            }
        });

        // Set default instructor to TBD if not selected
        if (!formData.instructor) {
            formData.instructor = 'TBD';
        }

        // Validate client ID for private sessions
        if (formData.type === 'private' && !formData.clientId) {
            throw new Error('Client ID is required for private sessions');
        }

        // Validate dates
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }

        return formData;
    }
}

customElements.define('course-session-module', CourseSessionModule);
