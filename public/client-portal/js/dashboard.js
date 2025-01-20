document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const companyNameElement = document.getElementById('companyName');
    const navLinks = document.querySelectorAll('.nav-section a');
    let clientInfo = null;

    // Fetch client info
    async function fetchClientInfo() {
        try {
            const response = await fetch('/api/client/info', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Unauthorized');
            }

            clientInfo = await response.json();
            updateClientInterface();
        } catch (error) {
            console.error('Error fetching client info:', error);
            if (error.message === 'Unauthorized') {
                window.location.href = '/login?portal=client';
            }
        }
    }

    // Update interface with client info
    function updateClientInterface() {
        if (clientInfo) {
            companyNameElement.textContent = clientInfo.companyName;
            updateDashboardStats();
        }
    }

    // Update dashboard statistics
    async function updateDashboardStats() {
        try {
            const response = await fetch('/api/client/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                updateStatsDisplay(stats);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    }

    // Update stats display
    function updateStatsDisplay(stats) {
        // Update stat cards with actual data
        document.querySelectorAll('.stat-card').forEach(card => {
            const statType = card.querySelector('h3').textContent.toLowerCase().replace(/\s+/g, '_');
            const numberElement = card.querySelector('.stat-number');
            if (stats[statType]) {
                numberElement.textContent = stats[statType];
            }
        });
    }

    // Handle quick actions
    function setupQuickActions() {
        const actionButtons = document.querySelectorAll('.action-buttons .btn');

        actionButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const action = e.target.textContent.toLowerCase().replace(/\s+/g, '_');

                switch (action) {
                    case 'schedule_training':
                        window.location.href = '/client-portal/training/schedule';
                        break;
                    case 'add_students':
                        window.location.href = '/client-portal/students/add';
                        break;
                    case 'view_reports':
                        window.location.href = '/client-portal/reports';
                        break;
                    case 'contact_support':
                        window.location.href = '/client-portal/support';
                        break;
                }
            });
        });
    }

    // Handle logout
    async function handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                localStorage.removeItem('authToken');
                window.location.href = '/login?portal=client';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout. Please try again.');
        }
    }

    // Navigation handling
    function handleNavigation(e) {
        e.preventDefault();
        const section = e.target.getAttribute('href').substring(1);

        // Update active state
        navLinks.forEach(link => {
            link.classList.toggle('active', link === e.target);
        });

        // Load section content
        loadSectionContent(section);
    }

    // Load section content
    async function loadSectionContent(section) {
        try {
            const response = await fetch(`/api/client/sections/${section}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                updateMainContent(section, data);
            }
        } catch (error) {
            console.error(`Error loading section ${section}:`, error);
        }
    }

    // Update main content area
    function updateMainContent(section, data) {
        // Implementation will vary based on section
        console.log(`Loading content for section: ${section}`);
    }

    // Mobile navigation
    function setupMobileNav() {
        const mobileNavToggle = document.createElement('button');
        mobileNavToggle.className = 'mobile-nav-toggle';
        mobileNavToggle.innerHTML = '☰';
        document.querySelector('.header-content').prepend(mobileNavToggle);

        mobileNavToggle.addEventListener('click', () => {
            const nav = document.querySelector('.dashboard-nav');
            nav.classList.toggle('active');
        });
    }

    // Event listeners
    logoutBtn.addEventListener('click', handleLogout);

    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Initialize
    fetchClientInfo();
    setupQuickActions();
    setupMobileNav();

    // Refresh dashboard data periodically
    setInterval(updateDashboardStats, 300000); // Every 5 minutes
});
