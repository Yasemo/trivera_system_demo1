class StudentModule extends UserManagementBaseModule {
    constructor() {
        super();

        // Activity tracking configuration
        this.moduleType = 'STUDENTS';
        this.actionTypes = {
            CREATE: 'Created',
            UPDATE: 'Updated',
            STATUS_CHANGE: 'Status Changed',
            DELETE: 'Deleted'
        };

        // Configure module for students
        Object.assign(this.moduleConfig, {
            entityType: 'Student',
            apiEndpoint: '/api/backoffice/students',
            idField: 'studentId',
            displayNameField: 'firstName,lastName',
            searchFields: ['firstName', 'lastName', 'email', 'clientPartner', 'courseHistory.courseTitle'],
            listFields: [
                { path: 'firstName,lastName', label: 'Full Name', type: 'contact' },
                { path: 'email', label: 'Email', type: 'text' },
                { path: 'clientPartner', label: 'Company', type: 'text' },
                { path: 'courseHistory[0].startDate', label: 'Enrolled', type: 'date' },
                { path: 'status', label: 'Status', type: 'status' }
            ],
            statusField: 'status',
            filters: [
                {
                    id: 'courseFilter',
                    label: 'All Courses',
                    field: 'courseHistory[0].courseTitle',
                    options: [
                        { value: 'Getting Started with Programming, OO & Java Basics for Non-Developers', label: 'Java Basics' },
                        { value: 'Core Java Programming Developer\'s Workshop', label: 'Core Java' },
                        { value: 'React.js Essentials', label: 'React.js' },
                        { value: 'Node.js Application Development', label: 'Node.js' },
                        { value: 'Core Spring Quick Start', label: 'Spring' },
                        { value: 'TypeScript Programming', label: 'TypeScript' },
                        { value: 'Introduction to HTML5/CSS3', label: 'HTML/CSS' },
                        { value: 'JavaScript Programming Fundamentals', label: 'JavaScript' },
                        { value: 'Mastering Spring 5.x Developer Boot Camp', label: 'Spring Boot' }
                    ]
                },
                {
                    id: 'statusFilter',
                    label: 'All Statuses',
                    field: 'status',
                    options: [
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' },
                        { value: 'On Leave', label: 'On Leave' }
                    ]
                }
            ]
        });
    }

    async showCreateForm() {
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            await this.loadSchema();
        }
        super.showCreateForm();
    }

    async showItemDetails(itemId, editMode = false) {
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            await this.loadSchema();
        }
        super.showItemDetails(itemId, editMode);
    }

    generateEditForm(item = {}) {
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            console.error('Schema not loaded');
            return '<div>Loading...</div>';
        }

        return `
            <div class="edit-form">
                <div class="form-group">
                    <label for="firstName">First Name <span class="required">*</span></label>
                    <input type="text" id="firstName" name="firstName" 
                           value="${item.firstName || ''}" required
                           placeholder="Enter student's first name">
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name <span class="required">*</span></label>
                    <input type="text" id="lastName" name="lastName" 
                           value="${item.lastName || ''}" required
                           placeholder="Enter student's last name">
                </div>
                <div class="form-group">
                    <label for="email">Email <span class="required">*</span></label>
                    <input type="email" id="email" name="email" 
                           value="${item.email || ''}" required
                           placeholder="Enter student's email">
                </div>
                <div class="form-group">
                    <label for="phone">Phone <span class="required">*</span></label>
                    <input type="tel" id="phone" name="phone" 
                           value="${item.phone || ''}" required
                           placeholder="Enter student's phone">
                </div>
                <div class="form-group">
                    <label for="clientPartner">Company</label>
                    <input type="text" id="clientPartner" name="clientPartner" 
                           value="${item.clientPartner || ''}"
                           placeholder="Enter student's company (if applicable)">
                </div>
                <div class="form-group">
                    <label for="courseTitle">Current Course</label>
                    <select id="courseTitle" name="courseTitle">
                        <option value="">Select Course</option>
                        <option value="Getting Started with Programming, OO & Java Basics for Non-Developers" 
                            ${item.courseHistory?.[0]?.courseTitle === 'Getting Started with Programming, OO & Java Basics for Non-Developers' ? 'selected' : ''}>Java Basics</option>
                        <option value="Core Java Programming Developer's Workshop"
                            ${item.courseHistory?.[0]?.courseTitle === 'Core Java Programming Developer\'s Workshop' ? 'selected' : ''}>Core Java</option>
                        <option value="React.js Essentials"
                            ${item.courseHistory?.[0]?.courseTitle === 'React.js Essentials' ? 'selected' : ''}>React.js</option>
                        <option value="Node.js Application Development"
                            ${item.courseHistory?.[0]?.courseTitle === 'Node.js Application Development' ? 'selected' : ''}>Node.js</option>
                        <option value="Core Spring Quick Start"
                            ${item.courseHistory?.[0]?.courseTitle === 'Core Spring Quick Start' ? 'selected' : ''}>Spring</option>
                        <option value="TypeScript Programming"
                            ${item.courseHistory?.[0]?.courseTitle === 'TypeScript Programming' ? 'selected' : ''}>TypeScript</option>
                        <option value="Introduction to HTML5/CSS3"
                            ${item.courseHistory?.[0]?.courseTitle === 'Introduction to HTML5/CSS3' ? 'selected' : ''}>HTML/CSS</option>
                        <option value="JavaScript Programming Fundamentals"
                            ${item.courseHistory?.[0]?.courseTitle === 'JavaScript Programming Fundamentals' ? 'selected' : ''}>JavaScript</option>
                        <option value="Mastering Spring 5.x Developer Boot Camp"
                            ${item.courseHistory?.[0]?.courseTitle === 'Mastering Spring 5.x Developer Boot Camp' ? 'selected' : ''}>Spring Boot</option>
                        <option value="" ${!item.courseHistory?.[0]?.courseTitle ? 'selected' : ''}>No Active Course</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="startDate">Enrollment Date <span class="required">*</span></label>
                    <input type="date" id="startDate" name="startDate" 
                           value="${item.courseHistory?.[0]?.startDate || new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="status">Status <span class="required">*</span></label>
                    <select id="status" name="status" required>
                        <option value="">Select Status</option>
                        <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="On Leave" ${item.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes" 
                             rows="4" 
                             placeholder="Enter any additional notes">${item.notes || ''}</textarea>
                </div>
            </div>
        `;
    }

    gatherFormData() {
        const formData = {};
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'status'];

        requiredFields.forEach(fieldName => {
            const input = this.shadowRoot.getElementById(fieldName);
            if (!input) return;

            const value = input.value.trim();
            if (!value) {
                throw new Error(`${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
            }

            // Email validation
            if (fieldName === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    throw new Error('Please enter a valid email address');
                }
            }

            // Phone validation
            if (fieldName === 'phone') {
                const phoneRegex = /^\+?[\d\s-()]{10,}$/;
                if (!phoneRegex.test(value)) {
                    throw new Error('Please enter a valid phone number');
                }
            }

            formData[fieldName] = value;
        });

        // Add optional fields
        const clientPartner = this.shadowRoot.getElementById('clientPartner');
        if (clientPartner) {
            formData.clientPartner = clientPartner.value.trim();
        }

        const notes = this.shadowRoot.getElementById('notes');
        if (notes) {
            formData.notes = notes.value.trim();
        }

        // Handle course data
        const courseTitle = this.shadowRoot.getElementById('courseTitle');
        const startDate = this.shadowRoot.getElementById('startDate');
        if (courseTitle && startDate && courseTitle.value.trim()) {
            formData.courseHistory = [{
                courseTitle: courseTitle.value.trim(),
                startDate: startDate.value
            }];
        }

        return formData;
    }

    generateViewDetails(item) {
        return `
            <div class="student-details">
                <div class="detail-section">
                    <h4>Personal Information</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Full Name:</span>
                        <span>${item.firstName} ${item.lastName}</span>
                        <span class="detail-label">Email:</span>
                        <span>${item.email}</span>
                        <span class="detail-label">Phone:</span>
                        <span>${item.phone}</span>
                        <span class="detail-label">Company:</span>
                        <span>${item.clientPartner || 'N/A'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Enrollment Information</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Current Course:</span>
                        <span>${item.courseHistory?.[0]?.courseTitle || 'None'}</span>
                        <span class="detail-label">Enrollment Date:</span>
                        <span>${item.courseHistory?.[0]?.startDate ? new Date(item.courseHistory[0].startDate).toLocaleDateString() : 'N/A'}</span>
                        <span class="detail-label">Status:</span>
                        <span class="status-badge" data-status="${item.status}">${item.status}</span>
                    </div>
                </div>

                ${item.notes ? `
                    <div class="detail-section">
                        <h4>Additional Notes</h4>
                        <p>${item.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('student-module', StudentModule);
