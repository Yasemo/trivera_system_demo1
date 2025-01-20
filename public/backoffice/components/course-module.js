class CourseModule extends BaseModule {
    constructor() {
        super();

        // Activity tracking configuration
        this.moduleType = 'COURSES';
        this.actionTypes = {
            CREATE: 'Created',
            UPDATE: 'Updated',
            STATUS_CHANGE: 'Status Changed',
            DELETE: 'Deleted'
        };

        // Configure module for courses
        Object.assign(this.moduleConfig, {
            entityType: 'Course',
            apiEndpoint: '/api/backoffice/courses',
            idField: 'courseCode',
            displayNameField: 'courseTitle',
            searchFields: ['courseCode', 'courseTitle', 'courseSubtitle', 'catalogSummary'],
            listFields: [
                { path: 'courseCode', label: 'Course Code', type: 'text' },
                { path: 'courseTitle', label: 'Title', type: 'text' },
                { path: 'skillLevel', label: 'Skill Level', type: 'text' },
                { path: 'duration', label: 'Duration', type: 'text' },
                { path: 'publicSeatPrice', label: 'Price', type: 'currency' },
                { path: 'status', label: 'Status', type: 'status' }
            ],
            statusField: 'status',
            filters: [
                {
                    id: 'statusFilter',
                    label: 'All Statuses',
                    field: 'status',
                    options: [
                        { value: 'Approved', label: 'Approved' },
                        { value: 'Draft', label: 'Draft' }
                    ]
                },
                {
                    id: 'skillLevelFilter',
                    label: 'All Skill Levels',
                    field: 'skillLevel',
                    field: 'availableFormats',
                    options: [
                        { value: 'Instructor-Led Online', label: 'Instructor-Led Online' },
                        { value: 'Instructor-Led, Onsite In Person', label: 'Instructor-Led, Onsite In Person' },
                        { value: 'Courseware for License', label: 'Courseware for License' },
                        { value: 'On Public Schedule', label: 'On Public Schedule' },
                        { value: 'Blended', label: 'Blended' }
                    ]
                }
            ]
        });
    }

    // Override matchesFilters to handle array fields like availableFormats
    matchesFilters(item, filterValues) {
        return Object.entries(filterValues).every(([filterId, filterValue]) => {
            if (!filterValue) return true; // Skip empty filters

            const filter = this.moduleConfig.filters.find(f => f.id === filterId);
            const field = filter.field;
            const itemValue = this.getNestedValue(item, field);

            if (field === 'availableFormats') {
                return Array.isArray(itemValue) && itemValue.includes(filterValue);
            }

            return itemValue === filterValue;
        });
    }

    async showCreateForm() {
        // Wait for schema to be loaded
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            await this.loadSchema();
        }
        super.showCreateForm();
    }

    async showItemDetails(itemId, editMode = false) {
        // Wait for schema to be loaded
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            await this.loadSchema();
        }
        super.showItemDetails(itemId, editMode);
    }

    // Override generateEditForm to ensure proper form generation
    generateEditForm(item = {}) {
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            console.error('Schema not loaded');
            return '<div>Loading...</div>';
        }

        return `
            <div class="edit-form">
                <div class="form-group">
                    <label for="courseCode">Course Code <span class="required">*</span></label>
                    <input type="text" id="courseCode" name="courseCode" 
                           value="${item.courseCode || ''}" required
                           placeholder="Enter course code">
                </div>
                <div class="form-group">
                    <label for="courseTitle">Title <span class="required">*</span></label>
                    <input type="text" id="courseTitle" name="courseTitle" 
                           value="${item.courseTitle || ''}" required
                           placeholder="Enter course title">
                </div>
                <div class="form-group">
                    <label for="courseSubtitle">Subtitle <span class="required">*</span></label>
                    <input type="text" id="courseSubtitle" name="courseSubtitle" 
                           value="${item.courseSubtitle || ''}" required
                           placeholder="Enter course subtitle">
                </div>
                <div class="form-group">
                    <label for="status">Status <span class="required">*</span></label>
                    <select id="status" name="status" required>
                        <option value="">Select Status</option>
                        <option value="Approved" ${item.status === 'Approved' ? 'selected' : ''}>Approved</option>
                        <option value="Draft" ${item.status === 'Draft' ? 'selected' : ''}>Draft</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="skillLevel">Skill Level <span class="required">*</span></label>
                    <select id="skillLevel" name="skillLevel" required>
                        <option value="">Select Skill Level</option>
                        <option value="Basic" ${item.skillLevel === 'Basic' ? 'selected' : ''}>Basic</option>
                        <option value="Intermediate" ${item.skillLevel === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="Advanced" ${item.skillLevel === 'Advanced' ? 'selected' : ''}>Advanced</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="duration">Duration <span class="required">*</span></label>
                    <input type="text" id="duration" name="duration" 
                           value="${item.duration || ''}" required
                           placeholder="Enter duration (e.g., 5 Days)">
                </div>
                <div class="form-group">
                    <label for="publicSeatPrice">Public Seat Price <span class="required">*</span></label>
                    <input type="number" id="publicSeatPrice" name="publicSeatPrice" 
                           value="${item.publicSeatPrice || ''}" step="0.01" min="0" required
                           placeholder="Enter price (e.g., 999.99)">
                </div>
                <div class="form-group">
                    <label>Available Formats <span class="required">*</span></label>
                    <div class="format-list">
                        ${[
                'Instructor-Led Online',
                'Instructor-Led, Onsite In Person',
                'Courseware for License',
                'On Public Schedule',
                'Blended'
            ].map(format => `
                            <label class="format-checkbox">
                                <input type="checkbox" value="${format}" 
                                    ${(item.availableFormats || []).includes(format) ? 'checked' : ''}>
                                ${format}
                            </label>
                        `).join('')}
                    </div>
                    <div class="validation-message" style="display: none; color: red; margin-top: 5px;">
                        Please select at least one format
                    </div>
                </div>
                <div class="form-group">
                    <label for="catalogSummary">Catalog Summary <span class="required">*</span></label>
                    <textarea id="catalogSummary" name="catalogSummary" 
                             required rows="4" 
                             placeholder="Enter a detailed description of the course">${item.catalogSummary || ''}</textarea>
                </div>
            </div>
        `;
    }

    // Override generateFormField to handle arrays and specific field types
    generateFormField(fieldName, fieldSchema = '', value = '') {
        if (fieldName === 'availableFormats') {
            const formats = [
                'Instructor-Led Online',
                'Instructor-Led, Onsite In Person',
                'Courseware for License',
                'On Public Schedule',
                'Blended'
            ];
            const currentFormats = Array.isArray(value) ? value : [];

            return `
                <div class="form-group">
                    <label>Available Formats <span class="required">*</span></label>
                    <div class="format-list">
                        ${formats.map(format => `
                            <label class="format-checkbox">
                                <input type="checkbox" value="${format}" 
                                    ${currentFormats.includes(format) ? 'checked' : ''}>
                                ${format}
                            </label>
                        `).join('')}
                    </div>
                    <div class="validation-message" style="display: none; color: red; margin-top: 5px;">
                        Please select at least one format
                    </div>
                </div>
            `;
        }

        if (fieldName === 'catalogSummary') {
            return `
                <div class="form-group">
                    <label for="catalogSummary">Catalog Summary <span class="required">*</span></label>
                    <textarea id="catalogSummary" name="catalogSummary" 
                             required rows="4" 
                             placeholder="Enter a detailed description of the course">${value || ''}</textarea>
                </div>
            `;
        }

        if (fieldName === 'publicSeatPrice') {
            return `
                <div class="form-group">
                    <label for="publicSeatPrice">Public Seat Price <span class="required">*</span></label>
                    <input type="number" id="publicSeatPrice" name="publicSeatPrice" 
                           value="${value || ''}" step="0.01" min="0" required
                           placeholder="Enter price (e.g., 999.99)">
                </div>
            `;
        }

        // Add required indicator to all required fields
        const isRequired = ['courseCode', 'courseTitle', 'courseSubtitle', 'status', 'skillLevel', 'duration'].includes(fieldName);
        const label = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        if (isRequired) {
            return `
                <div class="form-group">
                    <label for="${fieldName}">${label} <span class="required">*</span></label>
                    <input type="text" id="${fieldName}" name="${fieldName}" 
                           value="${value || ''}" required
                           placeholder="Enter ${label.toLowerCase()}">
                </div>
            `;
        }

        return super.generateFormField(fieldName, fieldSchema, value);
    }

    // Override gatherFormData to handle special fields and validation
    gatherFormData() {
        const formData = {};

        // Handle required fields first
        const requiredFields = ['courseCode', 'courseTitle', 'courseSubtitle', 'status', 'skillLevel', 'duration', 'publicSeatPrice', 'catalogSummary'];

        requiredFields.forEach(fieldName => {
            const input = this.shadowRoot.getElementById(fieldName);
            if (!input) return;

            let value = input.value.trim();
            if (!value) {
                throw new Error(`${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
            }

            // Handle number type
            if (fieldName === 'publicSeatPrice') {
                value = parseFloat(value);
                if (isNaN(value) || value < 0) {
                    throw new Error('Public Seat Price must be a valid number');
                }
            }

            formData[fieldName] = value;
        });

        // Handle availableFormats separately
        const formats = Array.from(
            this.shadowRoot.querySelectorAll('.format-checkbox input:checked')
        ).map(checkbox => checkbox.value);

        if (formats.length === 0) {
            const validationMessage = this.shadowRoot.querySelector('.format-list + .validation-message');
            if (validationMessage) {
                validationMessage.style.display = 'block';
            }
            throw new Error('Please select at least one format');
        }

        formData.availableFormats = formats;

        // Hide validation message if formats are selected
        const validationMessage = this.shadowRoot.querySelector('.format-list + .validation-message');
        if (validationMessage) {
            validationMessage.style.display = 'none';
        }

        return formData;
    }

    // Override formatFieldValue to handle arrays and specific field types
    formatFieldValue(value, type) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return super.formatFieldValue(value, type);
    }

    // Override generateViewDetails for better course details display
    generateViewDetails(item) {
        return `
            <div class="course-details">
                <div class="detail-section">
                    <h4>Course Information</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Course Code:</span>
                        <span>${item.courseCode}</span>
                        <span class="detail-label">Title:</span>
                        <span>${item.courseTitle}</span>
                        <span class="detail-label">Subtitle:</span>
                        <span>${item.courseSubtitle}</span>
                        <span class="detail-label">Status:</span>
                        <span class="status-badge" data-status="${item.status}">${item.status}</span>
                        <span class="detail-label">Skill Level:</span>
                        <span>${item.skillLevel}</span>
                        <span class="detail-label">Duration:</span>
                        <span>${item.duration}</span>
                        <span class="detail-label">Public Seat Price:</span>
                        <span>${this.formatFieldValue(item.publicSeatPrice, 'currency')}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Available Formats</h4>
                    <ul class="format-list">
                        ${item.availableFormats.map(format => `
                            <li>${format}</li>
                        `).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>Catalog Summary</h4>
                    <p>${item.catalogSummary}</p>
                </div>
            </div>
        `;
    }
}

customElements.define('course-module', CourseModule);
