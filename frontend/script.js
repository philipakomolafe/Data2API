document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://data2api.onrender.com';

    // --- DOM Elements ---
    // Auth tabs and forms
    const loginTabBtn = document.getElementById('login-tab-btn');
    const signupTabBtn = document.getElementById('signup-tab-btn');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    
    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const uploadForm = document.getElementById('upload-form');
    const predictForm = document.getElementById('predict-form');
    
    // Auth inputs
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const usernameInput = document.getElementById('username');
    const fullnameInput = document.getElementById('fullname');
    
    // Other inputs
    const filesInput = document.getElementById('files');
    const fileInfo = document.querySelector('.file-info');
    const preprocessorInput = document.getElementById('preprocessor-filename');
    const modelInput = document.getElementById('model-filename');
    const dataInput = document.getElementById('input-data');
    
    // Sections and UI elements
    const authSection = document.getElementById('auth-section');
    const loggedInSection = document.getElementById('logged-in-section');
    const responseArea = document.getElementById('response-area');
    const responseContent = document.getElementById('response-content');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const clearResponseBtn = document.getElementById('clear-response-btn');
    
    // --- State Management ---
    let userToken = localStorage.getItem('userToken');
    let userEmail = localStorage.getItem('userEmail');

    // --- UI Management Functions ---
    // Tab switching
    function switchToLoginTab() {
        loginTabBtn.classList.add('active');
        signupTabBtn.classList.remove('active');
        loginFormContainer.classList.add('active');
        signupFormContainer.classList.remove('active');
    }
    
    function switchToSignupTab() {
        signupTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        signupFormContainer.classList.add('active');
        loginFormContainer.classList.remove('active');
    }
    
    // Auth state
    function showLoggedInView() {
        authSection.classList.add('hidden');
        loggedInSection.classList.remove('hidden');
        userEmailDisplay.textContent = userEmail;
    }
    
    function showLoggedOutView() {
        authSection.classList.remove('hidden');
        loggedInSection.classList.add('hidden');
        responseArea.classList.add('hidden');
        // Reset forms
        loginForm.reset();
        signupForm.reset();
        uploadForm.reset();
        predictForm.reset();
        // Switch to login tab by default
        switchToLoginTab();
    }
    
    // Response display
    function displayResponse(data) {
        responseContent.textContent = JSON.stringify(data, null, 2);
        responseArea.classList.remove('hidden');
        // Scroll to response area
        responseArea.scrollIntoView({ behavior: 'smooth' });
    }
    
    function clearResponse() {
        responseArea.classList.add('hidden');
        responseContent.textContent = '';
    }
    
    // File input display
    function updateFileInfo() {
        if (filesInput.files.length === 0) {
            fileInfo.textContent = 'No files selected';
        } else if (filesInput.files.length === 1) {
            fileInfo.textContent = `Selected: ${filesInput.files[0].name}`;
        } else {
            fileInfo.textContent = `Selected ${filesInput.files.length} files`;
        }
    }
    
    // --- API Helper Function ---
    async function apiRequest(endpoint, method, body = null, isFormData = false) {
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
    }

    // --- Event Listeners ---
    // Tab switching
    loginTabBtn.addEventListener('click', switchToLoginTab);
    signupTabBtn.addEventListener('click', switchToSignupTab);
    
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiRequest('/auth/login', 'POST', {
                email: loginEmail.value,
                password: loginPassword.value,
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
    
    // Signup form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiRequest('/auth/signup', 'POST', {
                email: signupEmail.value,
                password: signupPassword.value,
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
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        userToken = null;
        userEmail = null;
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        showLoggedOutView();
    });
    
    // Clear response button
    clearResponseBtn.addEventListener('click', clearResponse);
    
    // File input change
    filesInput.addEventListener('change', updateFileInfo);
    
    // Upload form submission
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
            // Update file info
            updateFileInfo();
        } catch (error) {
            displayResponse({ error: error.message });
            console.error('Upload failed:', error);
        }
    });
    
    // Predict form submission
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

    // --- Initialize UI based on auth state ---
    if (userToken) {
        showLoggedInView();
    } else {
        showLoggedOutView();
    }
});
