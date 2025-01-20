class PartnerModule extends UserManagementBaseModule {
    constructor() {
        super();

        // Activity tracking configuration
        this.moduleType = 'PARTNERS';
        this.actionTypes = {
            CREATE: 'Created',
            UPDATE: 'Updated',
            STATUS_CHANGE: 'Status Changed',
            DELETE: 'Deleted'
        };

        // Configure module for partners
        Object.assign(this.moduleConfig, {
            entityType: 'Partner',
            apiEndpoint: '/api/backoffice/partners',
            idField: 'partnerId',
            displayNameField: 'companyName',
            searchFields: ['companyName', 'contactName', 'email', 'territory'],
            listFields: [
                { path: 'companyName', label: 'Company Name', type: 'text' },
                { path: 'primaryContact.firstName,primaryContact.lastName', label: 'Contact Name', type: 'contact' },
                { path: 'territory', label: 'Territory', type: 'text' },
                { path: 'commissionRate', label: 'Commission Rate', type: 'percentage' },
                { path: 'status', label: 'Status', type: 'status' }
            ],
            statusField: 'status',
            filters: [
                {
                    id: 'territoryFilter',
                    label: 'All Territories',
                    field: 'territory',
                    options: [
                        { value: 'North America', label: 'North America' },
                        { value: 'Europe', label: 'Europe' },
                        { value: 'Asia Pacific', label: 'Asia Pacific' },
                        { value: 'Latin America', label: 'Latin America' },
                        { value: 'Middle East', label: 'Middle East' }
                    ]
                },
                {
                    id: 'statusFilter',
                    label: 'All Statuses',
                    field: 'status',
                    options: [
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' },
                        { value: 'Pending', label: 'Pending' }
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
                    <label for="companyName">Company Name <span class="required">*</span></label>
                    <input type="text" id="companyName" name="companyName" 
                           value="${item.companyName || ''}" required
                           placeholder="Enter company name">
                </div>
                <div class="form-group">
                    <label for="contactName">Contact Name <span class="required">*</span></label>
                    <input type="text" id="contactName" name="contactName" 
                           value="${item.contactName || ''}" required
                           placeholder="Enter primary contact name">
                </div>
                <div class="form-group">
                    <label for="email">Email <span class="required">*</span></label>
                    <input type="email" id="email" name="email" 
                           value="${item.email || ''}" required
                           placeholder="Enter contact email">
                </div>
                <div class="form-group">
                    <label for="phone">Phone <span class="required">*</span></label>
                    <input type="tel" id="phone" name="phone" 
                           value="${item.phone || ''}" required
                           placeholder="Enter contact phone">
                </div>
                <div class="form-group">
                    <label for="territory">Territory <span class="required">*</span></label>
                    <select id="territory" name="territory" required>
                        <option value="">Select Territory</option>
                        <option value="North America" ${item.territory === 'North America' ? 'selected' : ''}>North America</option>
                        <option value="Europe" ${item.territory === 'Europe' ? 'selected' : ''}>Europe</option>
                        <option value="Asia Pacific" ${item.territory === 'Asia Pacific' ? 'selected' : ''}>Asia Pacific</option>
                        <option value="Latin America" ${item.territory === 'Latin America' ? 'selected' : ''}>Latin America</option>
                        <option value="Middle East" ${item.territory === 'Middle East' ? 'selected' : ''}>Middle East</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="commissionRate">Commission Rate (%) <span class="required">*</span></label>
                    <input type="number" id="commissionRate" name="commissionRate" 
                           value="${item.commissionRate || ''}" required
                           min="0" max="100" step="0.1"
                           placeholder="Enter commission rate">
                </div>
                <div class="form-group">
                    <label for="status">Status <span class="required">*</span></label>
                    <select id="status" name="status" required>
                        <option value="">Select Status</option>
                        <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="address">Address <span class="required">*</span></label>
                    <textarea id="address" name="address" 
                             required rows="3" 
                             placeholder="Enter company address">${item.address || ''}</textarea>
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
        const requiredFields = ['companyName', 'contactName', 'email', 'phone', 'territory', 'commissionRate', 'status', 'address'];

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

            // Commission rate validation
            if (fieldName === 'commissionRate') {
                const rate = parseFloat(value);
                if (isNaN(rate) || rate < 0 || rate > 100) {
                    throw new Error('Commission rate must be between 0 and 100');
                }
                formData[fieldName] = rate;
            } else {
                formData[fieldName] = value;
            }
        });

        // Add optional fields
        const notes = this.shadowRoot.getElementById('notes');
        if (notes) {
            formData.notes = notes.value.trim();
        }

        return formData;
    }

    generateViewDetails(item) {
        return `
            <div class="partner-details">
                <div class="detail-section">
                    <h4>Company Information</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Company Name:</span>
                        <span>${item.companyName}</span>
                        <span class="detail-label">Territory:</span>
                        <span>${item.territory}</span>
                        <span class="detail-label">Commission Rate:</span>
                        <span>${item.commissionRate}%</span>
                        <span class="detail-label">Status:</span>
                        <span class="status-badge" data-status="${item.status}">${item.status}</span>
                        <span class="detail-label">Address:</span>
                        <span>${item.address}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Contact Information</h4>
                    <div class="detail-grid">
                        <span class="detail-label">Contact Name:</span>
                        <span>${item.contactName}</span>
                        <span class="detail-label">Email:</span>
                        <span>${item.email}</span>
                        <span class="detail-label">Phone:</span>
                        <span>${item.phone}</span>
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

    formatFieldValue(value, type, field) {
        if (type === 'percentage') {
            return `${value}%`;
        }
        return super.formatFieldValue(value, type, field);
    }
}

customElements.define('partner-module', PartnerModule);
