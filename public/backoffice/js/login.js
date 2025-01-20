document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/backoffice/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store user info in localStorage
                localStorage.setItem('userInfo', JSON.stringify(data.user));
                // Redirect to dashboard
                window.location.href = '/backoffice/dashboard';
            } else {
                // Show error message
                alert(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    });

    // Simple form validation
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    function validateForm() {
        const isEmailValid = emailInput.value.includes('@') && emailInput.value.includes('.');
        const isPasswordValid = passwordInput.value.length >= 6;
        submitButton.disabled = !(isEmailValid && isPasswordValid);
    }

    emailInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);

    // Initial validation
    validateForm();
});
