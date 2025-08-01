document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://data2api.onrender.com';

    // --- DOM Elements ---
    const authSection = document.getElementById('auth-section');
    const loggedInSection = document.getElementById('logged-in-section');
    const responseArea = document.getElementById('response-area');
    const responseContent = document.getElementById('response-content');
    
    // Auth Form Elements
    const authForm = document.getElementById('auth-form');
    const loginTabBtn = document.getElementById('login-tab-btn');
    const signupTabBtn = document.getElementById('signup-tab-btn');
    const signupFields = document.getElementById('signup-fields');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const fullnameInput = document.getElementById('fullname');
    
    // Logged In Elements
    const logoutBtn = document.getElementById('logout-btn');
    const userEmailDisplay = document.getElementById('user-email-display');
    const uploadForm = document.getElementById('upload-form');
    const filesInput = document.getElementById('files');
    const predictForm = document.getElementById('predict-form');
    const preprocessorInput = document.getElementById('preprocessor-filename');
    const modelInput = document.getElementById('model-filename');
    const dataInput = document.getElementById('input-data');

    // --- State Management ---
    let userToken = localStorage.getItem('userToken');
    let userEmail = localStorage.getItem('userEmail');
    let isLoginMode = true;

    // --- UI Update Functions ---
    const showLoggedInView = () => {
        authSection.classList.add('hidden');
        loggedInSection.classList.remove('hidden');
        userEmailDisplay.textContent = userEmail;
    };

    const showLoggedOutView = () => {
        authSection.classList.remove('hidden');
        loggedInSection.classList.add('hidden');
        responseArea.classList.add('hidden');
    };

    const displayResponse = (data) => {
        responseContent.textContent = JSON.stringify(data, null, 2);
        responseArea.classList.remove('hidden');
    };

    // --- API Helper ---
    const apiRequest = async (endpoint, method, body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: method,
                headers: headers,
                body: body ? JSON.stringify(body) : null,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'An unknown error occurred.');
            }
            return data;
        } catch (error) {
            displayResponse({ error: error.message });
            throw error;
        }
    };

    // --- Event Handlers ---
    loginTabBtn.addEventListener('click', () => {
        isLoginMode = true;
        loginTabBtn.classList.add('active');
        signupTabBtn.classList.remove('active');
        signupFields.classList.add('hidden');
        authSubmitBtn.textContent = 'Login';
    });

    signupTabBtn.addEventListener('click', () => {
        isLoginMode = false;
        signupTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        signupFields.classList.remove('hidden');
        authSubmitBtn.textContent = 'Sign Up';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            let data;
            if (isLoginMode) {
                data = await apiRequest('/auth/login', 'POST', { email, password });
            } else {
                data = await apiRequest('/auth/signup', 'POST', {
                    email,
                    password,
                    username: usernameInput.value,
                    full_name: fullnameInput.value,
                });
            }

            if (data.access_token) {
                userToken = data.access_token;
                userEmail = data.user_email;
                localStorage.setItem('userToken', userToken);
                localStorage.setItem('userEmail', userEmail);
                showLoggedInView();
            }
            displayResponse(data);
        } catch (error) {
            console.error('Auth action failed:', error);
        }
    });

    logoutBtn.addEventListener('click', () => {
        userToken = null;
        userEmail = null;
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        showLoggedOutView();
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        for (const file of filesInput.files) {
            formData.append('files', file);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/upload/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userToken}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);
            displayResponse(data);
        } catch (error) {
            displayResponse({ error: error.message });
            console.error('Upload failed:', error);
        }
    });

    predictForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const inputData = JSON.parse(dataInput.value);
            const data = await apiRequest('/pipelines/predict', 'POST', {
                preprocessor_filename: preprocessorInput.value,
                model_filename: modelInput.value,
                input_data: inputData,
            });
            displayResponse(data);
        } catch (error) {
            displayResponse({ error: "Prediction failed. Check that your input data is valid JSON." });
            console.error('Prediction failed:', error);
        }
    });

    // --- Initial Page Load ---
    if (userToken) {
        showLoggedInView();
    } else {
        showLoggedOutView();
    }
});
