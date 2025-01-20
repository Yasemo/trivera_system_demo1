class InstructorModule extends BaseModule {
    constructor() {
        super();

        // Configure module for instructors
        Object.assign(this.moduleConfig, {
            entityType: 'Instructor',
            apiEndpoint: '/api/backoffice/instructors',
            idField: 'id',
            displayNameField: 'firstName',
            searchFields: ['id', 'firstName', 'lastName', 'email', 'expertise'],
            listFields: [
                { path: 'id', label: 'ID', type: 'text' },
                { path: 'firstName', label: 'First Name', type: 'text' },
                { path: 'lastName', label: 'Last Name', type: 'text' },
                { path: 'email', label: 'Email', type: 'text' },
                { path: 'status', label: 'Status', type: 'status' },
                { path: 'performanceMetrics.averageRating', label: 'Rating', type: 'number' }
            ],
            statusField: 'status',
            filters: [
                {
                    id: 'statusFilter',
                    label: 'All Statuses',
                    field: 'status',
                    options: [
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' }
                    ]
                },
                {
                    id: 'deliveryMethodFilter',
                    label: 'Delivery Methods',
                    field: 'preferredDeliveryMethods',
                    options: [
                        { value: 'Virtual', label: 'Virtual' },
                        { value: 'On-site', label: 'On-site' }
                    ]
                }
            ],
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
                    <label for="firstName">First Name <span class="required">*</span></label>
                    <input type="text" id="firstName" name="firstName" 
                           value="${item.firstName || ''}" required
                           placeholder="Enter first name">
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name <span class="required">*</span></label>
                    <input type="text" id="lastName" name="lastName" 
                           value="${item.lastName || ''}" required
                           placeholder="Enter last name">
                </div>
                <div class="form-group">
                    <label for="email">Email <span class="required">*</span></label>
                    <input type="email" id="email" name="email" 
                           value="${item.email || ''}" required
                           placeholder="Enter email address">
                </div>
                <div class="form-group">
                    <label for="phone">Phone <span class="required">*</span></label>
                    <input type="tel" id="phone" name="phone" 
                           value="${item.phone || ''}" required
                           placeholder="Enter phone number">
                </div>
                <div class="form-group">
                    <label for="status">Status <span class="required">*</span></label>
                    <select id="status" name="status" required>
                        <option value="">Select Status</option>
                        <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Areas of Expertise <span class="required">*</span></label>
                    <div class="expertise-list">
                        <div class="tag-input">
                            <input type="text" id="expertiseInput" placeholder="Add expertise (press Enter)">
                            <div class="tags" id="expertiseTags">
                                ${(item.expertise || []).map(exp => `
                                    <span class="tag">
                                        ${exp}
                                        <button type="button" class="remove-tag">&times;</button>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="validation-message" style="display: none; color: red; margin-top: 5px;">
                        Please add at least one area of expertise
                    </div>
                </div>
                <div class="form-group">
                    <label>Preferred Delivery Methods <span class="required">*</span></label>
                    <div class="delivery-methods">
                        ${['Virtual', 'On-site'].map(method => `
                            <label class="checkbox-label">
                                <input type="checkbox" value="${method}" 
                                    ${(item.preferredDeliveryMethods || []).includes(method) ? 'checked' : ''}>
                                ${method}
                            </label>
                        `).join('')}
                    </div>
                    <div class="validation-message" style="display: none; color: red; margin-top: 5px;">
                        Please select at least one delivery method
                    </div>
                </div>
                <div class="form-group">
                    <label for="preferredTimeZone">Preferred Time Zone <span class="required">*</span></label>
                    <select id="preferredTimeZone" name="preferredTimeZone" required>
                        <option value="">Select Time Zone</option>
                        <option value="America/New_York" ${item.availability?.preferredTimeZone === 'America/New_York' ? 'selected' : ''}>Eastern Time</option>
                        <option value="America/Chicago" ${item.availability?.preferredTimeZone === 'America/Chicago' ? 'selected' : ''}>Central Time</option>
                        <option value="America/Denver" ${item.availability?.preferredTimeZone === 'America/Denver' ? 'selected' : ''}>Mountain Time</option>
                        <option value="America/Los_Angeles" ${item.availability?.preferredTimeZone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="maxSessionsPerMonth">Maximum Sessions per Month <span class="required">*</span></label>
                    <input type="number" id="maxSessionsPerMonth" name="maxSessionsPerMonth" 
                           value="${item.availability?.maxSessionsPerMonth || 0}" min="0" max="20" step="1" required>
                </div>
            </div>
        `;
    }

    // Override generateFormField to handle specific field types
    generateFormField(fieldName, fieldSchema = '', value = '') {
        // Add required indicator to all required fields
        const isRequired = ['firstName', 'lastName', 'email', 'phone', 'status', 'expertise', 'preferredDeliveryMethods', 'preferredTimeZone', 'maxSessionsPerMonth'].includes(fieldName);
        const requiredMark = isRequired ? '<span class="required">*</span>' : '';

        switch (fieldName) {
            case 'expertise':
                const expertiseList = Array.isArray(value) ? value : [];
                return `
                    <div class="form-group">
                        <label>Areas of Expertise</label>
                        <div class="expertise-list">
                            <div class="tag-input">
                                <input type="text" id="expertiseInput" placeholder="Add expertise (press Enter)">
                                <div class="tags" id="expertiseTags">
                                    ${expertiseList.map(exp => `
                                        <span class="tag">
                                            ${exp}
                                            <button type="button" class="remove-tag">&times;</button>
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

            case 'preferredDeliveryMethods':
                const methods = ['Virtual', 'On-site'];
                const currentMethods = Array.isArray(value) ? value : [];
                return `
                    <div class="form-group">
                        <label>Preferred Delivery Methods</label>
                        <div class="delivery-methods">
                            ${methods.map(method => `
                                <label class="checkbox-label">
                                    <input type="checkbox" value="${method}" 
                                        ${currentMethods.includes(method) ? 'checked' : ''}>
                                    ${method}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;

            case 'availability.preferredTimeZone':
                return `
                    <div class="form-group">
                        <label for="preferredTimeZone">Preferred Time Zone</label>
                        <select id="preferredTimeZone" name="preferredTimeZone">
                            <option value="America/New_York" ${value === 'America/New_York' ? 'selected' : ''}>Eastern Time</option>
                            <option value="America/Chicago" ${value === 'America/Chicago' ? 'selected' : ''}>Central Time</option>
                            <option value="America/Denver" ${value === 'America/Denver' ? 'selected' : ''}>Mountain Time</option>
                            <option value="America/Los_Angeles" ${value === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time</option>
                        </select>
                    </div>
                `;

            case 'availability.maxSessionsPerMonth':
                return `
                    <div class="form-group">
                        <label for="maxSessionsPerMonth">Maximum Sessions per Month</label>
                        <input type="number" id="maxSessionsPerMonth" name="maxSessionsPerMonth" 
                            value="${value || 0}" min="0" max="20" step="1">
                    </div>
                `;

            case 'performanceMetrics.averageRating':
            case 'performanceMetrics.studentSatisfactionScore':
                return `
                    <div class="form-group">
                        <label for="${fieldName}">${this.formatLabel(fieldName)}</label>
                        <input type="number" id="${fieldName}" name="${fieldName}" 
                            value="${value || 0}" min="0" max="100" step="0.1" readonly>
                    </div>
                `;

            default:
                return super.generateFormField(fieldName, fieldSchema, value);
        }
    }

    formatLabel(fieldName) {
        return fieldName
            .split('.')
            .pop()
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    // Override generateViewDetails for better instructor details display
    generateViewDetails(item) {
        return `
            <div class="instructor-details">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <div class="detail-grid">
                        <span class="detail-label">ID:</span>
                        <span>${item.id}</span>
                        <span class="detail-label">Name:</span>
                        <span>${item.firstName} ${item.lastName}</span>
                        <span class="detail-label">Email:</span>
                        <span>${item.email}</span>
                        <span class="detail-label">Phone:</span>
                        <span>${item.phone}</span>
                        <span class="detail-label">Status:</span>
                        <span class="status-badge" data-status="${item.status}">${item.status}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Expertise & Delivery</h4>
                    <div class="expertise-tags">
                        ${item.expertise.map(exp => `
                            <span class="tag">${exp}</span>
                        `).join('')}
                    </div>
                    <div class="detail-grid">
                        <span class="detail-label">Delivery Methods:</span>
                        <span>${item.preferredDeliveryMethods.join(', ')}</span>
                        <span class="detail-label">Languages:</span>
                        <span>${item.languages ? item.languages.join(', ') : 'Not specified'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Availability</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Time Zone:</span>
                        <span>${item.availability.preferredTimeZone}</span>
                        <span class="detail-label">Max Sessions/Month:</span>
                        <span>${item.availability.maxSessionsPerMonth}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Performance Metrics</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Average Rating:</span>
                        <span>${item.performanceMetrics.averageRating.toFixed(1)}/5.0</span>
                        <span class="detail-label">Sessions Taught:</span>
                        <span>${item.performanceMetrics.totalSessionsTaught}</span>
                        <span class="detail-label">Satisfaction Score:</span>
                        <span>${item.performanceMetrics.studentSatisfactionScore}%</span>
                        <span class="detail-label">Last Review:</span>
                        <span>${this.formatFieldValue(item.performanceMetrics.lastReviewDate, 'date')}</span>
                    </div>
                </div>

                ${item.certifications && item.certifications.length > 0 ? `
                    <div class="detail-section">
                        <h4>Certifications</h4>
                        <div class="certifications-list">
                            ${item.certifications.map(cert => `
                                <div class="certification-item">
                                    <span class="cert-name">${cert.name}</span>
                                    <span class="cert-dates">
                                        Valid: ${this.formatFieldValue(cert.issueDate, 'date')} - 
                                        ${this.formatFieldValue(cert.expiryDate, 'date')}
                                    </span>
                                    <span class="cert-id">ID: ${cert.certificationId}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Override gatherFormData to handle special fields and validation
    gatherFormData() {
        const formData = {};

        // Handle required fields first
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'status'];
        requiredFields.forEach(fieldName => {
            const input = this.shadowRoot.getElementById(fieldName);
            if (!input) return;

            let value = input.value.trim();
            if (!value) {
                throw new Error(`${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
            }

            formData[fieldName] = value;
        });

        // Handle expertise tags
        const expertise = Array.from(
            this.shadowRoot.querySelectorAll('.tag')
        ).map(tag => tag.textContent.trim());

        if (expertise.length === 0) {
            const validationMessage = this.shadowRoot.querySelector('.expertise-list + .validation-message');
            if (validationMessage) {
                validationMessage.style.display = 'block';
            }
            throw new Error('Please add at least one area of expertise');
        }
        formData.expertise = expertise;

        // Handle delivery methods
        const deliveryMethods = Array.from(
            this.shadowRoot.querySelectorAll('.delivery-methods input:checked')
        ).map(checkbox => checkbox.value);

        if (deliveryMethods.length === 0) {
            const validationMessage = this.shadowRoot.querySelector('.delivery-methods + .validation-message');
            if (validationMessage) {
                validationMessage.style.display = 'block';
            }
            throw new Error('Please select at least one delivery method');
        }
        formData.preferredDeliveryMethods = deliveryMethods;

        // Handle availability fields
        const timeZone = this.shadowRoot.getElementById('preferredTimeZone');
        const maxSessions = this.shadowRoot.getElementById('maxSessionsPerMonth');

        if (!timeZone.value) {
            throw new Error('Preferred Time Zone is required');
        }

        if (!maxSessions.value || parseInt(maxSessions.value) < 0) {
            throw new Error('Maximum Sessions per Month must be a positive number');
        }

        formData.availability = {
            preferredTimeZone: timeZone.value,
            maxSessionsPerMonth: parseInt(maxSessions.value)
        };

        // Hide validation messages if all is valid
        this.shadowRoot.querySelectorAll('.validation-message').forEach(msg => {
            msg.style.display = 'none';
        });

        return formData;
    }

    // Override setupEventListeners to handle expertise tags
    setupEventListeners() {
        super.setupEventListeners();

        // Add expertise tag handling when in edit mode
        this.shadowRoot.addEventListener('keydown', (e) => {
            if (e.target.id === 'expertiseInput' && e.key === 'Enter') {
                e.preventDefault();
                const input = e.target;
                const value = input.value.trim();
                if (value) {
                    const tagsContainer = this.shadowRoot.getElementById('expertiseTags');
                    const tag = document.createElement('span');
                    tag.className = 'tag';
                    tag.innerHTML = `
                        ${value}
                        <button type="button" class="remove-tag">&times;</button>
                    `;
                    tagsContainer.appendChild(tag);
                    input.value = '';
                }
            }
        });

        // Remove expertise tag
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag')) {
                e.target.closest('.tag').remove();
            }
        });
    }
}

customElements.define('instructor-module', InstructorModule);
