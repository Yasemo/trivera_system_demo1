class BaseModule extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.items = [];
        this.filteredItems = [];

        // Default configuration - to be overridden by child classes
        this.moduleConfig = {
            entityType: '', // e.g., 'Course', 'Student', 'Instructor'
            apiEndpoint: '',
            idField: 'id', // Primary key field
            displayNameField: '', // Field to use as display name
            searchFields: [], // Fields to include in search
            listFields: [], // Fields to show in list view
            statusField: 'status', // Field containing status
            schema: {}, // Entity schema from entity_schemas.json
            filters: [] // Array of filter configurations
        };

        // Create notifications container in shadow DOM
        this.notificationsContainer = document.createElement('div');
        this.notificationsContainer.className = 'notifications-container';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add notification to the shadowRoot's notifications container
        this.notificationsContainer.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async connectedCallback() {
        await this.loadSchema();
        await this.render();
        // Append notifications container after render
        this.shadowRoot.appendChild(this.notificationsContainer);
        await this.fetchItems();
        this.setupEventListeners();
    }

    async loadSchema() {
        // Load schema from entity_schemas.json based on entityType
        try {
            const response = await fetch('/db/entity_schemas.json', {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to load schema: ${response.status}`);
            }

            const schemas = await response.json();
            if (!schemas[this.moduleConfig.entityType]) {
                throw new Error(`Schema not found for entity type: ${this.moduleConfig.entityType}`);
            }

            this.moduleConfig.schema = schemas[this.moduleConfig.entityType];
            console.log('Schema loaded successfully:', this.moduleConfig.schema);
        } catch (error) {
            console.error('Error loading schema:', error);
            throw error; // Re-throw to handle in calling code
        }
    }

    async fetchItems() {
        try {
            const apiUrl = this.moduleConfig.apiEndpoint.startsWith('/api/backoffice') ?
                this.moduleConfig.apiEndpoint :
                `/api/backoffice${this.moduleConfig.apiEndpoint}`;

            const response = await fetch(apiUrl, {
                credentials: 'same-origin' // Include cookies in the request
            });

            if (response.status === 401) {
                window.location.href = '/backoffice/index.html';
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.moduleConfig.entityType}s: ${response.status}`);
            }

            const data = await response.json();
            // Handle different response structures (some endpoints return arrays, others objects with arrays)
            this.items = Array.isArray(data) ? data : data[`${this.moduleConfig.entityType.toLowerCase()}s`];
            this.filteredItems = [...this.items];
            this.renderItems();
        } catch (error) {
            console.error(`Error fetching ${this.moduleConfig.entityType}s:`, error);
            if (error.message.includes('401')) {
                window.location.href = '/backoffice/index.html';
            } else {
                this.showNotification(`Error loading ${this.moduleConfig.entityType}s. Please try again.`, 'error');
            }
        }
    }

    setupEventListeners() {
        // Search input
        this.shadowRoot.getElementById('searchInput').addEventListener('input', () => this.filterItems());

        // Filter selects
        this.shadowRoot.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', () => this.filterItems());
        });

        // Create button
        const createBtn = this.shadowRoot.getElementById('createBtn');
        createBtn.addEventListener('click', () => {
            if (!this.moduleConfig.schema) {
                console.error('Schema not loaded yet');
                return;
            }
            console.log('Schema available:', this.moduleConfig.schema);
            this.showCreateForm();
        });

        // Modal close buttons
        this.shadowRoot.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });

        // Close modal when clicking outside
        this.shadowRoot.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target === this.shadowRoot.getElementById('itemModal')) {
                this.hideModal();
            }
        });
    }

    showModal() {
        const modal = this.shadowRoot.getElementById('itemModal');
        if (!modal) return;

        // Add modal-open class to host element
        this.classList.add('modal-open');

        // Show modal with transition
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    hideModal() {
        const modal = this.shadowRoot.getElementById('itemModal');
        if (!modal) return;

        // Remove modal-open class from host element
        this.classList.remove('modal-open');

        // Hide modal with transition
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200); // Match transition duration in CSS
    }

    filterItems() {
        const searchTerm = this.shadowRoot.getElementById('searchInput').value.toLowerCase();
        const filterValues = {};

        // Get all filter values
        this.shadowRoot.querySelectorAll('.filter-select').forEach(select => {
            filterValues[select.id] = select.value;
        });

        this.filteredItems = this.items.filter(item => {
            // Search term matching
            const matchesSearch = this.moduleConfig.searchFields.some(field => {
                const value = this.getNestedValue(item, field);
                return value && value.toString().toLowerCase().includes(searchTerm);
            });

            // Filter matching
            const matchesFilters = Object.entries(filterValues).every(([filterId, filterValue]) => {
                if (!filterValue) return true; // Skip empty filters
                const field = this.moduleConfig.filters.find(f => f.id === filterId).field;
                const itemValue = this.getNestedValue(item, field);
                return !filterValue || itemValue === filterValue;
            });

            return matchesSearch && matchesFilters;
        });

        this.renderItems();
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, part) => current && current[part], obj);
    }

    setNestedValue(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        const target = parts.reduce((current, part) => current[part] = current[part] || {}, obj);
        target[last] = value;
    }

    renderItems() {
        const tableBody = this.shadowRoot.getElementById('tableBody');
        tableBody.innerHTML = this.filteredItems.map(item => this.renderTableRow(item)).join('');

        // Add click handlers
        tableBody.querySelectorAll('.view-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = e.target.closest('tr').dataset.itemId;
                this.showItemDetails(itemId, false);
            });
        });

        tableBody.querySelectorAll('.edit-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const itemId = e.target.closest('tr').dataset.itemId;
                this.showItemDetails(itemId, true);
            });
        });

        tableBody.querySelectorAll('tr[data-item-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                // Don't trigger row click if clicking edit or view buttons
                if (e.target.closest('.action-buttons')) {
                    return;
                }
                const itemId = row.dataset.itemId;
                this.showItemDetails(itemId, false);
            });
        });
    }

    renderTableRow(item) {
        return `
            <tr data-item-id="${item[this.moduleConfig.idField]}">
                ${this.moduleConfig.listFields.map(field => `
                    <td>${this.formatFieldValue(this.getNestedValue(item, field.path), field.type)}</td>
                `).join('')}
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon view-item" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="btn btn-icon edit-item" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    formatFieldValue(value, type) {
        if (value === null || value === undefined) return '';

        switch (type) {
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'datetime':
                return new Date(value).toLocaleString();
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(value);
            case 'array':
                return Array.isArray(value) ? value.join(', ') : value;
            case 'boolean':
                return value ? 'Yes' : 'No';
            case 'status':
                return `<span class="status-badge" data-status="${value}">${value}</span>`;
            default:
                return value;
        }
    }

    generateFormField(fieldName, fieldSchema, value = '') {
        const label = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        // Handle array types
        if (fieldSchema.includes('[]')) {
            return `
                <div class="form-group">
                    <label for="${fieldName}">${label}</label>
                    <input type="text" id="${fieldName}" name="${fieldName}" 
                           value="${Array.isArray(value) ? value.join(', ') : value}"
                           placeholder="Enter values separated by commas"
                           required>
                    <small class="help-text">Enter multiple values separated by commas</small>
                </div>
            `;
        }

        // Handle enum types
        if (fieldSchema.includes('enum:')) {
            const options = fieldSchema.match(/enum: '([^']+)'/)[1].split(', ');
            return `
                <div class="form-group">
                    <label for="${fieldName}">${label}</label>
                    <select id="${fieldName}" name="${fieldName}" required>
                        <option value="">Select ${label}</option>
                        ${options.map(opt => `
                            <option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>
                        `).join('')}
                    </select>
                </div>
            `;
        }

        // Handle text areas for longer content
        if (fieldName.toLowerCase().includes('summary') ||
            fieldName.toLowerCase().includes('description') ||
            fieldName.toLowerCase().includes('notes')) {
            return `
                <div class="form-group">
                    <label for="${fieldName}">${label}</label>
                    <textarea id="${fieldName}" name="${fieldName}" rows="4" required>${value || ''}</textarea>
                </div>
            `;
        }

        // Handle number type
        if (fieldSchema.includes('number')) {
            return `
                <div class="form-group">
                    <label for="${fieldName}">${label}</label>
                    <input type="number" id="${fieldName}" name="${fieldName}" 
                           value="${value || ''}" step="any" required>
                </div>
            `;
        }

        // Default text input
        return `
            <div class="form-group">
                <label for="${fieldName}">${label}</label>
                <input type="text" id="${fieldName}" name="${fieldName}" 
                       value="${value || ''}" required>
            </div>
        `;
    }

    showItemDetails(itemId, editMode = false) {
        const item = this.items.find(i => i[this.moduleConfig.idField] === itemId);
        if (!item) return;

        const modal = this.shadowRoot.getElementById('itemModal');
        const modalBody = modal.querySelector('.modal-body');
        const modalTitle = this.shadowRoot.getElementById('modalTitle');
        const saveBtn = this.shadowRoot.getElementById('saveBtn');
        const editBtn = this.shadowRoot.getElementById('editBtn');

        modalTitle.textContent = editMode ?
            `Edit ${this.moduleConfig.entityType}` :
            `${this.moduleConfig.entityType} Details`;

        saveBtn.style.display = editMode ? 'block' : 'none';
        editBtn.style.display = editMode ? 'none' : 'block';

        modalBody.innerHTML = editMode ?
            this.generateEditForm(item) :
            this.generateViewDetails(item);

        if (editMode) {
            saveBtn.onclick = () => this.saveChanges(itemId);
        } else {
            editBtn.onclick = () => this.showItemDetails(itemId, true);
        }

        this.showModal();
    }

    generateEditForm(item) {
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            console.error('Schema not loaded');
            return '<div>Loading...</div>';
        }

        return `
            <div class="edit-form">
                ${Object.entries(this.moduleConfig.schema).map(([fieldName, fieldSchema]) => {
            return this.generateFormField(fieldName, fieldSchema, item[fieldName]);
        }).join('')}
            </div>
        `;
    }

    generateViewDetails(item) {
        if (!this.moduleConfig.schema || Object.keys(this.moduleConfig.schema).length === 0) {
            console.error('Schema not loaded');
            return '<div>Loading...</div>';
        }

        return `
            <div class="details-view">
                ${Object.entries(this.moduleConfig.schema).map(([fieldName, fieldSchema]) => {
            const value = item[fieldName];
            const label = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `
                        <div class="detail-row">
                            <span class="detail-label">${label}:</span>
                            <span class="detail-value">${this.formatFieldValue(value, fieldSchema)}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    showCreateForm() {
        const modal = this.shadowRoot.getElementById('itemModal');
        const modalBody = modal.querySelector('.modal-body');
        const modalTitle = this.shadowRoot.getElementById('modalTitle');
        const saveBtn = this.shadowRoot.getElementById('saveBtn');
        const editBtn = this.shadowRoot.getElementById('editBtn');

        modalTitle.textContent = `Create New ${this.moduleConfig.entityType}`;
        saveBtn.style.display = 'block';
        editBtn.style.display = 'none';

        // Generate empty form
        modalBody.innerHTML = this.generateEditForm({});

        // Set up save handler for create
        saveBtn.onclick = () => this.createItem();

        this.showModal();
    }

    async createItem() {
        try {
            const formData = this.gatherFormData();

            // Ensure the API endpoint starts with /api/backoffice
            const apiUrl = this.moduleConfig.apiEndpoint.startsWith('/api/backoffice') ?
                this.moduleConfig.apiEndpoint :
                `/api/backoffice${this.moduleConfig.apiEndpoint}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin', // Include cookies in the request
                body: JSON.stringify(formData)
            });

            if (response.status === 401) {
                window.location.href = '/backoffice/index.html';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to create ${this.moduleConfig.entityType}`);
            }

            this.items.push(data);
            this.filterItems();
            this.hideModal();

            // Show success message using non-blocking notification
            this.showNotification(`${this.moduleConfig.entityType} created successfully`, 'success');
        } catch (error) {
            console.error(`Error creating ${this.moduleConfig.entityType}:`, error);
            if (error.message.includes('401')) {
                window.location.href = '/backoffice/index.html';
                return;
            }
            this.showNotification(error.message, 'error');
        }
    }

    async saveChanges(itemId) {
        try {
            const formData = this.gatherFormData();

            // Ensure the API endpoint starts with /api/backoffice
            const apiUrl = this.moduleConfig.apiEndpoint.startsWith('/api/backoffice') ?
                this.moduleConfig.apiEndpoint :
                `/api/backoffice${this.moduleConfig.apiEndpoint}`;

            const response = await fetch(`${apiUrl}/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin', // Include cookies in the request
                body: JSON.stringify(formData)
            });

            if (response.status === 401) {
                window.location.href = '/backoffice/index.html';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to update ${this.moduleConfig.entityType}`);
            }

            const index = this.items.findIndex(i => i[this.moduleConfig.idField] === itemId);
            if (index !== -1) {
                this.items[index] = data;
                this.filterItems();
            }

            this.hideModal();

            // Show success message using non-blocking notification
            this.showNotification(`${this.moduleConfig.entityType} updated successfully`, 'success');
        } catch (error) {
            console.error(`Error updating ${this.moduleConfig.entityType}:`, error);
            if (error.message.includes('401')) {
                window.location.href = '/backoffice/index.html';
            } else {
                this.showNotification(error.message, 'error');
            }
        }
    }

    gatherFormData() {
        const formData = {};
        Object.entries(this.moduleConfig.schema).forEach(([fieldName, fieldSchema]) => {
            const input = this.shadowRoot.getElementById(fieldName);
            if (!input) return;

            let value = input.value.trim();

            // Handle array types
            if (fieldSchema.includes('[]')) {
                value = value ? value.split(',').map(v => v.trim()) : [];
            }
            // Handle number types
            else if (fieldSchema.includes('number')) {
                value = value ? parseFloat(value) : null;
            }
            // Handle empty values
            else if (!value && input.required) {
                throw new Error(`${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
            }

            formData[fieldName] = value;
        });
        return formData;
    }

    async render() {
        const styles = await this.getStyles();

        // Set the HTML content
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="module-header">
                <h2>${this.moduleConfig.entityType} Management</h2>
                <div class="module-controls">
                    <div class="search-bar">
                        <input type="text" id="searchInput" placeholder="Search ${this.moduleConfig.entityType.toLowerCase()}s...">
                        <button class="btn btn-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="filter-controls">
                        ${this.moduleConfig.filters.map(filter => `
                            <select id="${filter.id}" class="filter-select">
                                <option value="">${filter.label}</option>
                                ${filter.options.map(opt => `
                                    <option value="${opt.value}">${opt.label}</option>
                                `).join('')}
                            </select>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="module-container">
                <div class="list-container">
                    <table class="table">
                        <thead>
                            <tr>
                                ${this.moduleConfig.listFields.map(field => `
                                    <th>${field.label}</th>
                                `).join('')}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            <!-- Items will be dynamically inserted -->
                        </tbody>
                    </table>
                </div>

                <div class="context-panel">
                    <div class="panel-section">
                        <h3>Quick Actions</h3>
                        <button class="btn btn-primary" id="createBtn">Create New ${this.moduleConfig.entityType}</button>
                        <button class="btn btn-secondary" id="exportBtn">Export ${this.moduleConfig.entityType}s</button>
                        <button class="btn btn-secondary" id="importBtn">Import ${this.moduleConfig.entityType}s</button>
                    </div>
                    <div class="panel-section">
                        <h3>Bulk Actions</h3>
                        <button class="btn btn-secondary" id="bulkUpdateBtn">Bulk Update</button>
                        <button class="btn btn-secondary" id="bulkDeleteBtn">Bulk Delete</button>
                    </div>
                    <div class="panel-section">
                        <h3>Reports</h3>
                        <button class="btn btn-secondary" id="reportBtn">Generate Report</button>
                    </div>
                </div>
            </div>

            <!-- Item Modal -->
            <div id="itemModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">${this.moduleConfig.entityType} Details</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- Details will be dynamically inserted -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-close" id="cancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="saveBtn" style="display: none;">Save Changes</button>
                        <button class="btn btn-primary" id="editBtn">Edit</button>
                    </div>
                </div>
            </div>
        `;
    }

    async getStyles() {
        try {
            // Load shared module styles
            const moduleStylesResponse = await fetch('/backoffice/components/module-styles.css');
            const moduleStyles = await moduleStylesResponse.text();

            // Load module-specific styles if they exist
            let specificStyles = '';
            if (this.moduleConfig.cssPath) {
                try {
                    const specificResponse = await fetch(this.moduleConfig.cssPath);
                    specificStyles = await specificResponse.text();
                } catch (error) {
                    console.warn(`No specific styles found for ${this.moduleConfig.entityType} module`);
                }
            }

            // Combine shared and specific styles
            return `
                ${moduleStyles}
                ${specificStyles}
                
                /* Notification styles */
                .notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .notification {
                    padding: 15px 25px;
                    border-radius: 4px;
                    color: white;
                    animation: slideIn 0.3s ease-out;
                    transition: opacity 0.3s ease-out;
                }
                
                .notification.fade-out {
                    opacity: 0;
                }
                
                .notification.success {
                    background-color: #4caf50;
                }
                
                .notification.error {
                    background-color: #f44336;
                }
                
                .notification.info {
                    background-color: #2196f3;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
        } catch (error) {
            console.error('Error loading styles:', error);
            return '';
        }
    }
}

customElements.define('base-module', BaseModule);
