class UserManagementBaseModule extends BaseModule {
    constructor() {
        super();
        this.activeTab = 'list'; // 'list' or 'activity'
        this.activityItems = [];
        this.filteredActivityItems = [];
    }

    async connectedCallback() {
        await this.loadSchema();
        await this.render();
        this.shadowRoot.appendChild(this.notificationsContainer);
        await this.fetchItems();
        await this.fetchActivityItems();
        this.setupEventListeners();
    }

    async fetchItems() {
        try {
            const apiUrl = this.moduleConfig.apiEndpoint.startsWith('/api/backoffice') ?
                this.moduleConfig.apiEndpoint :
                `/api/backoffice${this.moduleConfig.apiEndpoint}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.moduleConfig.entityType}s: ${response.status}`);
            }

            const data = await response.json();
            // Handle nested data structure (e.g., { clients: [...] })
            this.items = data[`${this.moduleConfig.entityType.toLowerCase()}s`] || [];
            this.renderItems();
        } catch (error) {
            console.error(`Error fetching ${this.moduleConfig.entityType}s:`, error);
            this.showNotification(`Error loading data. Please try again.`, 'error');
        }
    }

    async fetchActivityItems() {
        try {
            const entityType = this.moduleConfig.entityType.toLowerCase();
            const activityUrl = `/api/backoffice/activity/${entityType}`;
            const response = await fetch(activityUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.moduleConfig.entityType} activity: ${response.status}`);
            }

            this.activityItems = await response.json();
            this.filteredActivityItems = [...this.activityItems];
            this.renderActivityItems();
            this.updateActivityFilterOptions(); // Update filter options after data is loaded
        } catch (error) {
            console.error(`Error fetching ${this.moduleConfig.entityType} activity:`, error);
            this.showNotification(`Error loading activity data. Please try again.`, 'error');
        }
    }

    updateActivityFilterOptions() {
        const moduleFilter = this.shadowRoot.getElementById('moduleFilter');
        const actionFilter = this.shadowRoot.getElementById('actionFilter');
        const statusFilter = this.shadowRoot.getElementById('statusFilter');

        if (moduleFilter) {
            const modules = this.getUniqueValues('module');
            moduleFilter.innerHTML = `
                <option value="">Filter by Module</option>
                ${modules.map(value => `<option value="${value}">${value}</option>`).join('')}
            `;
        }

        if (actionFilter) {
            const actions = this.getUniqueValues('actionType');
            actionFilter.innerHTML = `
                <option value="">Filter by Action</option>
                ${actions.map(value => `<option value="${value}">${value}</option>`).join('')}
            `;
        }

        if (statusFilter) {
            const statuses = this.getUniqueValues('status');
            statusFilter.innerHTML = `
                <option value="">Filter by Status</option>
                ${statuses.map(value => `<option value="${value}">${value}</option>`).join('')}
            `;
        }
    }

    setupEventListeners() {
        super.setupEventListeners();

        // Tab switching
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Activity search and filters
        const activitySearchInput = this.shadowRoot.getElementById('activitySearchInput');
        if (activitySearchInput) {
            activitySearchInput.addEventListener('input', () => {
                this.filterActivityItems();
            });
        }

        this.shadowRoot.querySelectorAll('.activity-filter-select').forEach(select => {
            select.addEventListener('change', () => {
                this.filterActivityItems();
            });
        });

        // Clear filters button
        const clearFiltersBtn = this.shadowRoot.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                // Clear search input
                const searchInput = this.shadowRoot.getElementById('activitySearchInput');
                if (searchInput) searchInput.value = '';

                // Clear all filter selects
                this.shadowRoot.querySelectorAll('.activity-filter-select').forEach(select => {
                    select.value = '';
                });

                // Reset filtered items to show all
                this.filteredActivityItems = [...this.activityItems];
                this.renderActivityItems();
            });
        }

        // Create button
        const createBtn = this.shadowRoot.getElementById('createBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateForm();
            });
        }

        // Table row actions
        const tableBody = this.shadowRoot.getElementById('tableBody');
        if (tableBody) {
            // Add click handlers to buttons after rendering
            tableBody.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const row = btn.closest('tr');
                    const itemId = row.dataset.itemId;

                    if (btn.classList.contains('view-item')) {
                        this.showItemDetails(itemId, false);
                    } else if (btn.classList.contains('edit-item')) {
                        this.showItemDetails(itemId, true);
                    }
                });
            });
        }

        // Modal buttons
        const modal = this.shadowRoot.getElementById('itemModal');
        if (modal) {
            // Close buttons
            modal.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            });

            // Edit button
            const editBtn = modal.querySelector('#editBtn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    const itemId = modal.dataset.itemId;
                    this.showItemDetails(itemId, true);
                });
            }

            // Save button
            const saveBtn = modal.querySelector('#saveBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    try {
                        const formData = this.gatherFormData();
                        const itemId = modal.dataset.itemId;
                        await this.saveItem(itemId, formData);
                        modal.classList.remove('active');
                        await this.fetchItems(); // Refresh the list
                    } catch (error) {
                        console.error('Error saving item:', error);
                        this.showNotification(error.message, 'error');
                    }
                });
            }
        }
    }

    renderItems() {
        const tableBody = this.shadowRoot.getElementById('tableBody');
        if (!tableBody) return;

        // Update table content
        tableBody.innerHTML = this.items.map(item => `
            <tr data-item-id="${item[this.moduleConfig.idField]}">
                ${this.moduleConfig.listFields.map(field => {
            let value;
            if (field.type === 'contact') {
                value = item; // Pass the whole item for contact type
            } else if (field.path.includes('.')) {
                // Handle nested paths like 'courseHistory.0.startDate'
                const parts = field.path.split('.');
                value = parts.reduce((obj, part) => obj?.[part], item);
            } else {
                value = item[field.path];
            }
            return `<td>${this.formatFieldValue(value, field.type, field)}</td>`;
        }).join('')}
                <td>
                    <button class="btn btn-icon action-btn view-item" title="View Details">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn btn-icon action-btn edit-item" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');

        // Re-add click handlers to buttons after updating content
        tableBody.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('tr');
                const itemId = row.dataset.itemId;

                if (btn.classList.contains('view-item')) {
                    this.showItemDetails(itemId, false);
                } else if (btn.classList.contains('edit-item')) {
                    this.showItemDetails(itemId, true);
                }
            });
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;

        // Update tab buttons
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Show/hide content
        this.shadowRoot.getElementById('listView').style.display = tabName === 'list' ? 'block' : 'none';
        this.shadowRoot.getElementById('activityView').style.display = tabName === 'activity' ? 'block' : 'none';
    }

    filterActivityItems() {
        const searchTerm = this.shadowRoot.getElementById('activitySearchInput').value.toLowerCase();
        const moduleFilter = this.shadowRoot.getElementById('moduleFilter').value;
        const actionFilter = this.shadowRoot.getElementById('actionFilter').value;
        const statusFilter = this.shadowRoot.getElementById('statusFilter').value;

        this.filteredActivityItems = this.activityItems.filter(item => {
            const matchesSearch =
                item.details.toLowerCase().includes(searchTerm) ||
                item[`${this.moduleConfig.entityType.toLowerCase()}Name`].toLowerCase().includes(searchTerm);

            const matchesModule = !moduleFilter || item.module === moduleFilter;
            const matchesAction = !actionFilter || item.actionType === actionFilter;
            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesModule && matchesAction && matchesStatus;
        });

        this.renderActivityItems();
    }

    renderActivityItems() {
        const tableBody = this.shadowRoot.getElementById('activityTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.filteredActivityItems.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item[`${this.moduleConfig.entityType.toLowerCase()}Name`]}</td>
                <td>${item.actionType}</td>
                <td>${item.module}</td>
                <td>${item.details}</td>
                <td><span class="status-badge" data-status="${item.status}">${item.status}</span></td>
            </tr>
        `).join('');
    }

    getUniqueValues(field) {
        return [...new Set(this.activityItems.map(item => item[field]))];
    }

    async render() {
        const styles = await this.getStyles();
        const moduleStyles = await this.getModuleStyles();

        this.shadowRoot.innerHTML = `
            <style>
                ${styles}
                ${moduleStyles}
                
                /* Tab styles */
                .tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .tab {
                    padding: 0.5rem 1rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    font-weight: 500;
                }
                
                .tab.active {
                    border-bottom-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                /* Activity view styles */
                #activityView {
                    display: none;
                }
                
                .activity-controls {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }
                
                .activity-search-bar {
                    flex: 1;
                    min-width: 200px;
                }
                
                .activity-filter-select {
                    min-width: 150px;
                }
            </style>

            <div class="tabs">
                <button class="tab active" data-tab="list">${this.moduleConfig.entityType} List</button>
                <button class="tab" data-tab="activity">${this.moduleConfig.entityType} Activity</button>
            </div>

            <div id="listView">
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
            </div>

            <div id="activityView">
                <div class="module-header">
                    <h2>${this.moduleConfig.entityType} Activity</h2>
                    <div class="activity-controls">
                        <div class="activity-search-bar">
                            <input type="text" id="activitySearchInput" placeholder="Search activity...">
                        </div>
                        <select id="moduleFilter" class="activity-filter-select">
                            <option value="">Filter by Module</option>
                        </select>
                        <select id="actionFilter" class="activity-filter-select">
                            <option value="">Filter by Action</option>
                        </select>
                        <select id="statusFilter" class="activity-filter-select">
                            <option value="">Filter by Status</option>
                        </select>
                    </div>
                </div>

                <div class="module-container">
                    <div class="list-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>${this.moduleConfig.entityType}</th>
                                    <th>Action</th>
                                    <th>Module</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="activityTableBody">
                                <!-- Activity items will be dynamically inserted -->
                            </tbody>
                        </table>
                    </div>

                    <div class="context-panel">
                        <div class="panel-section">
                            <h3>Activity Summary</h3>
                            <button class="btn btn-secondary" id="exportActivityBtn">Export Activity Log</button>
                        </div>
                        <div class="panel-section">
                            <h3>Filters</h3>
                            <button class="btn btn-secondary" id="clearFiltersBtn">Clear All Filters</button>
                        </div>
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

    async getModuleStyles() {
        return `
            /* Additional module-specific styles */
            .status-badge[data-status="Complete"] {
                background-color: var(--success-color);
            }
            
            .status-badge[data-status="Pending"] {
                background-color: var(--warning-color);
            }
            
            .status-badge[data-status="Active"] {
                background-color: var(--info-color);
            }
            
            .status-badge[data-status="Rejected"] {
                background-color: var(--danger-color);
            }
        `;
    }

    showItemDetails(itemId, editMode = false) {
        const modal = this.shadowRoot.getElementById('itemModal');
        const modalBody = modal.querySelector('.modal-body');
        const saveBtn = modal.querySelector('#saveBtn');
        const editBtn = modal.querySelector('#editBtn');
        const item = this.items.find(i => i[this.moduleConfig.idField] === itemId);

        if (!item) {
            console.error('Item not found:', itemId);
            return;
        }

        modal.dataset.itemId = itemId;

        if (editMode) {
            modalBody.innerHTML = this.generateEditForm(item);
            saveBtn.style.display = 'block';
            editBtn.style.display = 'none';
        } else {
            modalBody.innerHTML = this.generateViewDetails(item);
            saveBtn.style.display = 'none';
            editBtn.style.display = 'block';
        }

        modal.classList.add('active');
    }

    showCreateForm() {
        const modal = this.shadowRoot.getElementById('itemModal');
        const modalBody = modal.querySelector('.modal-body');
        const saveBtn = modal.querySelector('#saveBtn');
        const editBtn = modal.querySelector('#editBtn');

        modalBody.innerHTML = this.generateEditForm({});
        saveBtn.style.display = 'block';
        editBtn.style.display = 'none';
        modal.dataset.itemId = '';

        modal.classList.add('active');
    }

    async saveItem(itemId, formData) {
        try {
            const entityType = this.moduleConfig.entityType.toLowerCase();
            const method = itemId ? 'PUT' : 'POST';
            const baseUrl = this.moduleConfig.apiEndpoint.startsWith('/api/backoffice') ?
                this.moduleConfig.apiEndpoint :
                `/api/backoffice${this.moduleConfig.apiEndpoint}`;
            const url = itemId ? `${baseUrl}/${itemId}` : baseUrl;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to save ${entityType}: ${response.status}`);
            }

            this.showNotification(`${this.moduleConfig.entityType} saved successfully`, 'success');
            return await response.json();
        } catch (error) {
            console.error(`Error saving ${this.moduleConfig.entityType}:`, error);
            throw new Error(`Failed to save ${this.moduleConfig.entityType}. Please try again.`);
        }
    }

    formatFieldValue(value, type, field) {
        if (!value && type !== 'contact') return '';

        switch (type) {
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'percentage':
                return `${value}%`;
            case 'status':
                return `<span class="status-badge" data-status="${value}">${value}</span>`;
            case 'contact':
                // Handle nested contact fields (firstName,lastName)
                const paths = field.path.split(',');
                const names = paths.map(path => {
                    const parts = path.split('.');
                    let val = value;
                    for (const part of parts) {
                        val = val?.[part];
                    }
                    return val || '';
                });
                return names.filter(Boolean).join(' ');
            default:
                return value;
        }
    }
}

customElements.define('user-management-base-module', UserManagementBaseModule);
