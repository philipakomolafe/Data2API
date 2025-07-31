document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://data2api.onrender.com/';

    // --- DOM Elements ---
    const authSection = document.getElementById('auth-section');
    const loggedInSection = document.getElementById('logged-in-section');
    const responseArea = document.getElementById('response-area');
    const responseContent = document.getElementById('response-content');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const fullnameInput = document.getElementById('fullname');
    
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const uploadForm = document.getElementById('upload-form');
    const filesInput = document.getElementById('files');

    const predictForm = document.getElementById('predict-form');
    const preprocessorInput = document.getElementById('preprocessor-filename');
    const modelInput = document.getElementById('model-filename');
    const dataInput = document.getElementById('input-data');

    const userEmailDisplay = document.getElementById('user-email-display');

    // --- State Management ---
    let userToken = localStorage.getItem('userToken');
    let userEmail = localStorage.getItem('userEmail');

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
    const apiRequest = async (endpoint, method, body = null, isFormData = false) => {
        const headers = {};
        if (userToken && !isFormData) {
            headers['Authorization'] = `Bearer ${userToken}`;
        }
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (body) {
            config.body = isFormData ? body : JSON.stringify(body);
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
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
    loginBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('/auth/login', 'POST', {
                email: emailInput.value,
                password: passwordInput.value,
            });
            userToken = data.access_token;
            userEmail = data.user_email;
            localStorage.setItem('userToken', userToken);
            localStorage.setItem('userEmail', userEmail);
            showLoggedInView();
            displayResponse(data);
        } catch (error) {
            console.error('Login failed:', error);
        }
    });

    signupBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('/auth/signup', 'POST', {
                email: emailInput.value,
                password: passwordInput.value,
                username: usernameInput.value,
                full_name: fullnameInput.value,
            });
            // If signup also logs in the user
            if (data.access_token) {
                userToken = data.access_token;
                userEmail = data.user_email;
                localStorage.setItem('userToken', userToken);
                localStorage.setItem('userEmail', userEmail);
                showLoggedInView();
            }
            displayResponse(data);
        } catch (error) {
            console.error('Signup failed:', error);
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
            // The fetch for FormData is special and doesn't use the helper
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