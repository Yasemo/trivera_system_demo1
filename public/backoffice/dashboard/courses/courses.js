console.log('Frontend: Courses module script loaded');

// Global state for courses data
window.coursesState = window.coursesState || {
    courses: [],
    filteredCourses: []
};

// Function to initialize the courses module
function initializeCoursesModule() {
    console.log('Frontend: Initializing courses module');

    // DOM Elements
    const courseSearch = document.getElementById('courseSearch');
    const statusFilter = document.getElementById('statusFilter');
    const skillLevelFilter = document.getElementById('skillLevelFilter');
    const formatFilter = document.getElementById('formatFilter');
    const coursesTableBody = document.getElementById('coursesTableBody');
    const courseModal = document.getElementById('courseModal');
    const modalClose = document.querySelectorAll('.modal-close');

    // Log DOM element status
    console.log('Frontend: DOM Elements found:', {
        courseSearch: !!courseSearch,
        statusFilter: !!statusFilter,
        skillLevelFilter: !!skillLevelFilter,
        formatFilter: !!formatFilter,
        coursesTableBody: !!coursesTableBody,
        courseModal: !!courseModal,
        modalClose: modalClose.length
    });

    // Fetch courses data
    async function fetchCourses() {
        try {
            console.log('Frontend: Fetching courses...');
            const response = await fetch('/api/backoffice/courses');
            console.log('Frontend: Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch courses: ${response.status}`);
            }
            window.coursesState.courses = await response.json();
            console.log('Frontend: Received courses data:', window.coursesState.courses);
            window.coursesState.filteredCourses = [...window.coursesState.courses];
            console.log('Frontend: Set filtered courses:', window.coursesState.filteredCourses.length, 'courses');
            renderCourses();
        } catch (error) {
            console.error('Error fetching courses:', error);
            if (error.message === 'Failed to fetch') {
                console.error('Network error or server not responding');
            } else {
                console.error('Response:', error.message);
            }
            alert('Error loading courses data. Please try again or contact support if the issue persists.');
        }
    }

    // Format price as currency
    function formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    // Render courses table
    function renderCourses() {
        console.log('Frontend: Starting render with', window.coursesState.filteredCourses.length, 'courses');
        if (!coursesTableBody) {
            console.error('Frontend: coursesTableBody element not found!');
            return;
        }
        coursesTableBody.innerHTML = window.coursesState.filteredCourses.map(course => `
            <tr data-course-code="${course.courseCode}">
                <td>${course.courseCode}</td>
                <td>${course.courseTitle}</td>
                <td>${course.skillLevel}</td>
                <td>${course.duration}</td>
                <td>${formatPrice(course.publicSeatPrice)}</td>
                <td><span class="status-badge" data-status="${course.status}">${course.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon view-course" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="btn btn-icon edit-course" title="Edit Course">
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
        document.querySelectorAll('.view-course').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const courseCode = e.target.closest('tr').dataset.courseCode;
                showCourseDetails(courseCode, false);
            });
        });

        document.querySelectorAll('.edit-course').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit button clicked');
                const row = btn.closest('tr');
                if (!row) {
                    console.error('Could not find parent row');
                    return;
                }
                const courseCode = row.dataset.courseCode;
                if (!courseCode) {
                    console.error('No course code found');
                    return;
                }
                console.log('Editing course:', courseCode);
                showCourseDetails(courseCode, true);
            });
        });

        document.querySelectorAll('tr[data-course-code]').forEach(row => {
            row.addEventListener('click', () => {
                const courseCode = row.dataset.courseCode;
                showCourseDetails(courseCode, false);
            });
        });
    }

    // Filter courses based on search and filter values
    function filterCourses() {
        const searchTerm = courseSearch.value.toLowerCase();
        const statusValue = statusFilter.value;
        const skillLevelValue = skillLevelFilter.value;
        const formatValue = formatFilter.value;

        window.coursesState.filteredCourses = window.coursesState.courses.filter(course => {
            const matchesSearch =
                course.courseCode.toLowerCase().includes(searchTerm) ||
                course.courseTitle.toLowerCase().includes(searchTerm) ||
                course.courseSubtitle.toLowerCase().includes(searchTerm) ||
                course.catalogSummary.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusValue || course.status === statusValue;
            const matchesSkillLevel = !skillLevelValue || course.skillLevel === skillLevelValue;
            const matchesFormat = !formatValue || course.availableFormats.includes(formatValue);

            return matchesSearch && matchesStatus && matchesSkillLevel && matchesFormat;
        });

        renderCourses();
    }

    // Show course details in modal
    function showCourseDetails(courseCode, editMode = false) {
        const course = window.coursesState.courses.find(c => c.courseCode === courseCode);
        if (!course) return;

        const modalBody = courseModal.querySelector('.modal-body');
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        modalTitle.textContent = editMode ? 'Edit Course' : 'Course Details';
        saveBtn.style.display = editMode ? 'block' : 'none';
        editBtn.style.display = editMode ? 'none' : 'block';

        if (editMode) {
            modalBody.innerHTML = `
                <div class="course-details edit-mode">
                    <div class="detail-section">
                        <h4>Course Information</h4>
                        <div class="form-group">
                            <label>Course Code</label>
                            <input type="text" id="courseCode" value="${course.courseCode}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" id="courseTitle" value="${course.courseTitle}">
                        </div>
                        <div class="form-group">
                            <label>Subtitle</label>
                            <input type="text" id="courseSubtitle" value="${course.courseSubtitle}">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="status">
                                <option value="Draft" ${course.status === 'Draft' ? 'selected' : ''}>Draft</option>
                                <option value="Approved" ${course.status === 'Approved' ? 'selected' : ''}>Approved</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Skill Level</label>
                            <select id="skillLevel">
                                <option value="Basic" ${course.skillLevel === 'Basic' ? 'selected' : ''}>Basic</option>
                                <option value="Intermediate" ${course.skillLevel === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                                <option value="Advanced" ${course.skillLevel === 'Advanced' ? 'selected' : ''}>Advanced</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Duration</label>
                            <input type="text" id="duration" value="${course.duration}">
                        </div>
                        <div class="form-group">
                            <label>Public Seat Price</label>
                            <input type="number" id="publicSeatPrice" value="${course.publicSeatPrice}">
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Available Formats</h4>
                        <div class="format-list">
                            ${['Instructor-Led Online', 'Instructor-Led, Onsite In Person', 'Courseware for License', 'On Public Schedule', 'Blended']
                    .map(format => `
                                    <label class="format-checkbox">
                                        <input type="checkbox" value="${format}" 
                                            ${course.availableFormats.includes(format) ? 'checked' : ''}>
                                        ${format}
                                    </label>
                                `).join('')}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Catalog Summary</h4>
                        <textarea id="catalogSummary">${course.catalogSummary}</textarea>
                    </div>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="course-details">
                    <div class="detail-section">
                        <h4>Course Information</h4>
                        <div class="detail-grid">
                            <span class="detail-label">Course Code:</span>
                            <span>${course.courseCode}</span>
                            <span class="detail-label">Title:</span>
                            <span>${course.courseTitle}</span>
                            <span class="detail-label">Subtitle:</span>
                            <span>${course.courseSubtitle}</span>
                            <span class="detail-label">Status:</span>
                            <span class="status-badge" data-status="${course.status}">${course.status}</span>
                            <span class="detail-label">Skill Level:</span>
                            <span>${course.skillLevel}</span>
                            <span class="detail-label">Duration:</span>
                            <span>${course.duration}</span>
                            <span class="detail-label">Public Seat Price:</span>
                            <span>${formatPrice(course.publicSeatPrice)}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Available Formats</h4>
                        <ul class="format-list">
                            ${course.availableFormats.map(format => `
                                <li>${format}</li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="detail-section">
                        <h4>Catalog Summary</h4>
                        <p>${course.catalogSummary}</p>
                    </div>
                </div>
            `;
        }

        courseModal.classList.add('active');

        // Add event listeners for edit mode
        if (editMode) {
            saveBtn.onclick = async () => {
                try {
                    await saveCourseChanges(courseCode);
                    courseModal.classList.remove('active');
                } catch (error) {
                    console.error('Failed to save changes:', error);
                }
            };
            cancelBtn.onclick = () => {
                courseModal.classList.remove('active');
            };
        } else {
            editBtn.onclick = () => showCourseDetails(courseCode, true);
        }
    }

    // Save course changes
    async function saveCourseChanges(courseCode) {
        console.log('Saving changes for course:', courseCode);

        const updatedCourse = {
            courseCode,
            courseTitle: document.getElementById('courseTitle').value,
            courseSubtitle: document.getElementById('courseSubtitle').value,
            status: document.getElementById('status').value,
            skillLevel: document.getElementById('skillLevel').value,
            duration: document.getElementById('duration').value,
            publicSeatPrice: parseFloat(document.getElementById('publicSeatPrice').value),
            availableFormats: Array.from(document.querySelectorAll('.format-checkbox input:checked'))
                .map(checkbox => checkbox.value),
            catalogSummary: document.getElementById('catalogSummary').value
        };

        console.log('Updated course data:', updatedCourse);

        try {
            const url = `/api/backoffice/courses/${encodeURIComponent(courseCode)}`;
            console.log('Making PUT request to:', url);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedCourse)
            });

            console.log('Response status:', response.status);
            const responseData = await response.text();
            console.log('Response data:', responseData);

            if (!response.ok) {
                throw new Error(`Failed to update course: ${response.status} - ${responseData}`);
            }

            // Update local data
            const index = window.coursesState.courses.findIndex(c => c.courseCode === courseCode);
            if (index !== -1) {
                console.log('Updating local data at index:', index);
                window.coursesState.courses[index] = updatedCourse;
                filterCourses(); // Re-render the table
            }

            courseModal.classList.remove('active');
            console.log('Course updated successfully');
        } catch (error) {
            console.error('Error updating course:', error);
            alert(`Error updating course: ${error.message}`);
            throw error;
        }
    }

    // Create new course
    async function createNewCourse(courseData) {
        try {
            console.log('Creating new course:', courseData);
            const response = await fetch('/api/backoffice/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to create course: ${response.status} - ${errorData}`);
            }

            const newCourse = await response.json();
            window.coursesState.courses.push(newCourse);
            filterCourses(); // Re-render the table
            courseModal.classList.remove('active');
            console.log('Course created successfully');
        } catch (error) {
            console.error('Error creating course:', error);
            alert(`Error creating course: ${error.message}`);
            throw error;
        }
    }

    // Show empty course form for creation
    function showCreateCourseForm() {
        const modalBody = courseModal.querySelector('.modal-body');
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        modalTitle.textContent = 'Create New Course';
        saveBtn.style.display = 'block';
        editBtn.style.display = 'none';

        modalBody.innerHTML = `
            <div class="course-details edit-mode">
                <div class="detail-section">
                    <h4>Course Information</h4>
                    <div class="form-group">
                        <label>Course Code</label>
                        <input type="text" id="courseCode" placeholder="Enter course code">
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="courseTitle" placeholder="Enter course title">
                    </div>
                    <div class="form-group">
                        <label>Subtitle</label>
                        <input type="text" id="courseSubtitle" placeholder="Enter course subtitle">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="status">
                            <option value="Draft">Draft</option>
                            <option value="Approved">Approved</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Skill Level</label>
                        <select id="skillLevel">
                            <option value="Basic">Basic</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Duration</label>
                        <input type="text" id="duration" placeholder="e.g., 5 Days">
                    </div>
                    <div class="form-group">
                        <label>Public Seat Price</label>
                        <input type="number" id="publicSeatPrice" placeholder="Enter price">
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Available Formats</h4>
                    <div class="format-list">
                        ${['Instructor-Led Online', 'Instructor-Led, Onsite In Person', 'Courseware for License', 'On Public Schedule', 'Blended']
                .map(format => `
                                <label class="format-checkbox">
                                    <input type="checkbox" value="${format}">
                                    ${format}
                                </label>
                            `).join('')}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Catalog Summary</h4>
                    <textarea id="catalogSummary" placeholder="Enter course description"></textarea>
                </div>
            </div>
        `;

        courseModal.classList.add('active');

        // Add event listener for save button
        saveBtn.onclick = async () => {
            try {
                const newCourse = {
                    courseCode: document.getElementById('courseCode').value,
                    courseTitle: document.getElementById('courseTitle').value,
                    courseSubtitle: document.getElementById('courseSubtitle').value,
                    status: document.getElementById('status').value,
                    skillLevel: document.getElementById('skillLevel').value,
                    duration: document.getElementById('duration').value,
                    publicSeatPrice: parseFloat(document.getElementById('publicSeatPrice').value),
                    availableFormats: Array.from(document.querySelectorAll('.format-checkbox input:checked'))
                        .map(checkbox => checkbox.value),
                    catalogSummary: document.getElementById('catalogSummary').value
                };

                await createNewCourse(newCourse);
            } catch (error) {
                console.error('Failed to create course:', error);
            }
        };

        cancelBtn.onclick = () => {
            courseModal.classList.remove('active');
        };
    }

    // Only set up event listeners if all required elements exist
    if (courseSearch && statusFilter && skillLevelFilter && formatFilter && courseModal && coursesTableBody) {
        // Event Listeners
        courseSearch.addEventListener('input', filterCourses);
        statusFilter.addEventListener('change', filterCourses);
        skillLevelFilter.addEventListener('change', filterCourses);
        formatFilter.addEventListener('change', filterCourses);

        // Create course button
        const createCourseBtn = document.getElementById('createCourseBtn');
        if (createCourseBtn) {
            createCourseBtn.addEventListener('click', showCreateCourseForm);
        }

        modalClose.forEach(btn => {
            btn.addEventListener('click', () => {
                courseModal.classList.remove('active');
            });
        });

        // Close modal when clicking outside
        courseModal.addEventListener('click', (e) => {
            if (e.target === courseModal) {
                courseModal.classList.remove('active');
            }
        });

        // Check if we have existing data
        if (window.coursesState.courses.length > 0) {
            console.log('Frontend: Using existing courses data');
            renderCourses();
        } else {
            // Initialize
            fetchCourses();
        }
    } else {
        console.error('Frontend: Some required DOM elements are missing');
    }
}

// Initialize when the courses section is loaded into the dashboard
if (document.getElementById('courseSearch')) {
    initializeCoursesModule();
} else {
    // Retry after a short delay
    setTimeout(() => {
        if (document.getElementById('courseSearch')) {
            initializeCoursesModule();
        }
    }, 100);
}
