document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const loginForms = document.querySelectorAll('.login-form');

    function switchTab(portalType) {
        // Update tab buttons
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.portal === portalType);
        });

        // Update forms
        loginForms.forEach(form => {
            form.classList.toggle('active', form.dataset.portal === portalType);
        });
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.portal);
        });
    });

    // Form handling for each portal type
    const portalConfigs = {
        client: {
            formId: 'clientLoginForm',
            endpoint: '/api/auth/client/login',
            redirect: '/client/dashboard'
        },
        partner: {
            formId: 'partnerLoginForm',
            endpoint: '/api/auth/partner/login',
            redirect: '/partner/dashboard'
        },
        student: {
            formId: 'studentLoginForm',
            endpoint: '/api/auth/student/login',
            redirect: '/student/dashboard'
        }
    };

    Object.entries(portalConfigs).forEach(([portal, config]) => {
        const form = document.getElementById(config.formId);
        const emailInput = form.querySelector('input[type="email"]');
        const passwordInput = form.querySelector('input[type="password"]');
        const submitButton = form.querySelector('button[type="submit"]');

        // Form validation
        function validateForm() {
            const isEmailValid = emailInput.value.includes('@') && emailInput.value.includes('.');
            const isPasswordValid = passwordInput.value.length >= 6;
            submitButton.disabled = !(isEmailValid && isPasswordValid);
        }

        emailInput.addEventListener('input', validateForm);
        passwordInput.addEventListener('input', validateForm);
        validateForm();

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const response = await fetch(config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Store auth token
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('portalType', portal);

                    // Redirect to dashboard
                    window.location.href = config.redirect;
                } else {
                    // Show error message
                    alert(data.message || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error(`${portal} login error:`, error);
                alert('An error occurred during login. Please try again.');
            }
        });
    });

    // Handle query parameter for pre-selecting portal type
    const urlParams = new URLSearchParams(window.location.search);
    const portalType = urlParams.get('portal');
    if (portalType && portalConfigs[portalType]) {
        switchTab(portalType);
    }
});
