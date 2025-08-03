// Enhanced JavaScript for Data2API with modern patterns and functionality

// Configuration
const CONFIG = {
    API_BASE_URL: 'https://data2api.onrender.com',
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        USER_EMAIL: 'userEmail'
    },
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 5000
};

// Application State
class AppState {
    constructor() {
        this.user = {
            token: localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN),
            email: localStorage.getItem(CONFIG.STORAGE_KEYS.USER_EMAIL),
            isAuthenticated: false
        };
        this.ui = {
            currentModal: null,
            currentTab: 'login',
            isLoading: false
        };
        this.files = {
            uploaded: [],
            selected: []
        };
        
        this.init();
    }
    
    init() {
        this.user.isAuthenticated = !!(this.user.token && this.user.email);
    }
    
    updateUser(userData) {
        this.user = { ...this.user, ...userData };
        if (userData.token) localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, userData.token);
        if (userData.email) localStorage.setItem(CONFIG.STORAGE_KEYS.USER_EMAIL, userData.email);
    }
    
    clearUser() {
        this.user = { token: null, email: null, isAuthenticated: false };
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_EMAIL);
    }
}

// DOM Manager
class DOMManager {
    constructor() {
        this.elements = this.cacheElements();
        this.bindEvents();
    }
    
    cacheElements() {
        return {
            // Page sections
            landingPage: document.getElementById('landing-page'),
            loggedInSection: document.getElementById('logged-in-section'),
            
            // Navigation
            showLoginBtn: document.getElementById('show-login-btn'),
            showSignupBtn: document.getElementById('show-signup-btn'),
            heroCTABtn: document.getElementById('hero-cta-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            
            // Modal
            authModal: document.getElementById('auth-modal'),
            closeModalBtn: document.getElementById('close-modal'),
            authTitle: document.getElementById('auth-title'),
            authSubtitle: document.getElementById('auth-subtitle'),
            
            // Tabs
            loginTabBtn: document.getElementById('login-tab-btn'),
            signupTabBtn: document.getElementById('signup-tab-btn'),
            loginFormContainer: document.getElementById('login-form-container'),
            signupFormContainer: document.getElementById('signup-form-container'),
            
            // Forms
            loginForm: document.getElementById('login-form'),
            signupForm: document.getElementById('signup-form'),
            uploadForm: document.getElementById('upload-form'),
            predictForm: document.getElementById('predict-form'),
            
            // Form inputs
            loginEmail: document.getElementById('login-email'),
            loginPassword: document.getElementById('login-password'),
            signupEmail: document.getElementById('signup-email'),
            signupPassword: document.getElementById('signup-password'),
            username: document.getElementById('username'),
            fullname: document.getElementById('fullname'),
            
            // File handling
            filesInput: document.getElementById('files'),
            fileInfo: document.querySelector('.file-info'),
            preprocessorFilename: document.getElementById('preprocessor-filename'),
            modelFilename: document.getElementById('model-filename'),
            inputData: document.getElementById('input-data'),
            
            // Response area
            responseArea: document.getElementById('response-area'),
            responseContent: document.getElementById('response-content'),
            clearResponseBtn: document.getElementById('clear-response-btn'),
            
            // User display
            userEmailDisplay: document.getElementById('user-email-display'),
            
            // Demo button
            demoBtn: document.querySelector('.demo-btn')
        };
    }
    
    bindEvents() {
        // Navigation events
        this.elements.showLoginBtn?.addEventListener('click', () => uiManager.showAuthModal('login'));
        this.elements.showSignupBtn?.addEventListener('click', () => uiManager.showAuthModal('signup'));
        this.elements.heroCTABtn?.addEventListener('click', () => uiManager.showAuthModal('signup'));
        this.elements.logoutBtn?.addEventListener('click', () => authManager.logout());
        
        // Modal events
        this.elements.closeModalBtn?.addEventListener('click', () => uiManager.hideAuthModal());
        this.elements.authModal?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                uiManager.hideAuthModal();
            }
        });
        
        // Tab events
        this.elements.loginTabBtn?.addEventListener('click', () => uiManager.switchAuthTab('login'));
        this.elements.signupTabBtn?.addEventListener('click', () => uiManager.switchAuthTab('signup'));
        
        // Form events
        this.elements.loginForm?.addEventListener('submit', (e) => authManager.handleLogin(e));
        this.elements.signupForm?.addEventListener('submit', (e) => authManager.handleSignup(e));
        this.elements.uploadForm?.addEventListener('submit', (e) => fileManager.handleUpload(e));
        this.elements.predictForm?.addEventListener('submit', (e) => predictionManager.handlePrediction(e));
        
        // File events
        this.elements.filesInput?.addEventListener('change', (e) => fileManager.handleFileSelection(e));
        
        // Response events
        this.elements.clearResponseBtn?.addEventListener('click', () => uiManager.clearResponse());
        
        // Demo button
        this.elements.demoBtn?.addEventListener('click', () => uiManager.showDemo());
        
        // Copy and format buttons (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-btn')) {
                uiManager.copyResponseToClipboard();
            }
            if (e.target.closest('.format-btn')) {
                uiManager.formatJSON();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.authModal?.classList.contains('hidden')) {
                uiManager.hideAuthModal();
            }
        });
    }
}

// UI Manager
class UIManager {
    constructor(domManager) {
        this.dom = domManager;
        this.setupAnimations();
    }
    
    setupAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe animated elements
        document.querySelectorAll('.feature-card, .step-card, .dashboard-card').forEach(el => {
            observer.observe(el);
        });
        
        // Setup floating animations
        this.setupFloatingAnimations();
    }
    
    setupFloatingAnimations() {
        const cards = document.querySelectorAll('.floating-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 2}s`;
        });
        
        const orbs = document.querySelectorAll('.gradient-orb');
        orbs.forEach((orb, index) => {
            orb.style.animationDelay = `${index * 2}s`;
        });
    }
    
    showAuthModal(mode = 'login') {
        this.dom.elements.authModal?.classList.remove('hidden');
        this.switchAuthTab(mode);
        document.body.style.overflow = 'hidden';
        appState.ui.currentModal = 'auth';
    }
    
    hideAuthModal() {
        this.dom.elements.authModal?.classList.add('hidden');
        document.body.style.overflow = 'auto';
        appState.ui.currentModal = null;
    }
    
    switchAuthTab(mode) {
        appState.ui.currentTab = mode;
        
        if (mode === 'login') {
            this.dom.elements.loginTabBtn?.classList.add('active');
            this.dom.elements.signupTabBtn?.classList.remove('active');
            this.dom.elements.loginFormContainer?.classList.add('active');
            this.dom.elements.signupFormContainer?.classList.remove('active');
            
            if (this.dom.elements.authTitle) this.dom.elements.authTitle.textContent = 'Welcome Back';
            if (this.dom.elements.authSubtitle) this.dom.elements.authSubtitle.textContent = 'Sign in to your account';
        } else {
            this.dom.elements.signupTabBtn?.classList.add('active');
            this.dom.elements.loginTabBtn?.classList.remove('active');
            this.dom.elements.signupFormContainer?.classList.add('active');
            this.dom.elements.loginFormContainer?.classList.remove('active');
            
            if (this.dom.elements.authTitle) this.dom.elements.authTitle.textContent = 'Create Account';
            if (this.dom.elements.authSubtitle) this.dom.elements.authSubtitle.textContent = 'Join thousands of developers';
        }
    }
    
    showDashboard() {
        this.dom.elements.landingPage?.classList.add('hidden');
        this.dom.elements.loggedInSection?.classList.remove('hidden');
        
        if (this.dom.elements.userEmailDisplay && appState.user.email) {
            this.dom.elements.userEmailDisplay.textContent = appState.user.email;
        }
        
        this.hideAuthModal();
    }
    
    showLandingPage() {
        this.dom.elements.landingPage?.classList.remove('hidden');
        this.dom.elements.loggedInSection?.classList.add('hidden');
        this.clearResponse();
        this.resetForms();
    }
    
    resetForms() {
        this.dom.elements.loginForm?.reset();
        this.dom.elements.signupForm?.reset();
        this.dom.elements.uploadForm?.reset();
        this.dom.elements.predictForm?.reset();
        
        if (this.dom.elements.fileInfo) {
            this.dom.elements.fileInfo.textContent = 'No files selected';
        }
    }
    
    showResponse(data) {
        if (this.dom.elements.responseContent) {
            this.dom.elements.responseContent.textContent = JSON.stringify(data, null, 2);
        }
        
        this.dom.elements.responseArea?.classList.remove('hidden');
        
        // Smooth scroll to response
        setTimeout(() => {
            this.dom.elements.responseArea?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
    
    clearResponse() {
        this.dom.elements.responseArea?.classList.add('hidden');
        if (this.dom.elements.responseContent) {
            this.dom.elements.responseContent.textContent = '';
        }
    }
    
    copyResponseToClipboard() {
        const text = this.dom.elements.responseContent?.textContent;
        if (!text) {
            notificationManager.show('No response to copy', 'error');
            return;
        }
        
        navigator.clipboard.writeText(text).then(() => {
            notificationManager.show('Response copied to clipboard!', 'success');
        }).catch(() => {
            notificationManager.show('Failed to copy to clipboard', 'error');
        });
    }
    
    formatJSON() {
        const textarea = this.dom.elements.inputData;
        if (!textarea) return;
        
        const text = textarea.value.trim();
        if (!text) {
            notificationManager.show('No data to format', 'error');
            return;
        }
        
        try {
            const parsed = JSON.parse(text);
            textarea.value = JSON.stringify(parsed, null, 2);
            notificationManager.show('JSON formatted successfully!', 'success');
        } catch (error) {
            notificationManager.show('Invalid JSON format', 'error');
        }
    }
    
    showDemo() {
        notificationManager.show('Demo feature coming soon! 🚀', 'info');
    }
    
    showLoadingState(button) {
        if (!button) return;
        
        const originalText = button.innerHTML;
        button.dataset.originalText = originalText;
        button.disabled = true;
        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading...</span>
        `;
    }
    
    hideLoadingState(button) {
        if (!button) return;
        
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// API Manager
class APIManager {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            ...options.headers
        };
        
        // Add auth token if available and not form data
        if (appState.user.token && !options.isFormData) {
            headers['Authorization'] = `Bearer ${appState.user.token}`;
        }
        
        // Add content type for JSON requests
        if (!options.isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };
        
        // Handle body data
        if (options.data) {
            config.body = options.isFormData ? options.data : JSON.stringify(options.data);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
}

// Authentication Manager
class AuthManager {
    constructor(apiManager, uiManager) {
        this.api = apiManager;
        this.ui = uiManager;
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = this.ui.dom.elements.loginEmail?.value;
        const password = this.ui.dom.elements.loginPassword?.value;
        
        if (!email || !password) {
            notificationManager.show('Please fill in all fields', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.ui.showLoadingState(submitBtn);
        
        try {
            const data = await this.api.request('/auth/login', {
                method: 'POST',
                data: { email, password }
            });
            
            appState.updateUser({
                token: data.access_token,
                email: data.user_email,
                isAuthenticated: true
            });
            
            this.ui.showDashboard();
            this.ui.showResponse(data);
            notificationManager.show('Login successful!', 'success');
            
        } catch (error) {
            notificationManager.show(error.message || 'Login failed', 'error');
        } finally {
            this.ui.hideLoadingState(submitBtn);
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        
        const username = this.ui.dom.elements.username?.value;
        const fullname = this.ui.dom.elements.fullname?.value;
        const email = this.ui.dom.elements.signupEmail?.value;
        const password = this.ui.dom.elements.signupPassword?.value;
        
        if (!username || !email || !password) {
            notificationManager.show('Please fill in required fields', 'error');
            return;
        }
        
        if (username.length < 3) {
            notificationManager.show('Username must be at least 3 characters', 'error');
            return;
        }
        
        if (password.length < 6) {
            notificationManager.show('Password must be at least 6 characters', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.ui.showLoadingState(submitBtn);
        
        try {
            const data = await this.api.request('/auth/signup', {
                method: 'POST',
                data: { username, full_name: fullname, email, password }
            });
            
            if (data.access_token) {
                appState.updateUser({
                    token: data.access_token,
                    email: data.user_email,
                    isAuthenticated: true
                });
                
                this.ui.showDashboard();
                notificationManager.show('Account created successfully!', 'success');
            } else {
                notificationManager.show(data.message || 'Please check your email to confirm account', 'info');
            }
            
            this.ui.showResponse(data);
            
        } catch (error) {
            notificationManager.show(error.message || 'Registration failed', 'error');
        } finally {
            this.ui.hideLoadingState(submitBtn);
        }
    }
    
    logout() {
        appState.clearUser();
        this.ui.showLandingPage();
        notificationManager.show('Logged out successfully', 'success');
    }
}

// File Manager
class FileManager {
    constructor(apiManager, uiManager) {
        this.api = apiManager;
        this.ui = uiManager;
    }
    
    handleFileSelection(e) {
        const files = Array.from(e.target.files);
        appState.files.selected = files;
        
        if (files.length === 0) {
            this.ui.dom.elements.fileInfo.textContent = 'No files selected';
            return;
        }
        
        const fileNames = files.map(f => f.name).join(', ');
        const fileCount = files.length;
        const totalSize = this.formatFileSize(files.reduce((sum, f) => sum + f.size, 0));
        
        this.ui.dom.elements.fileInfo.innerHTML = `
            <strong>${fileCount} file${fileCount > 1 ? 's' : ''} selected</strong><br>
            <span style="font-size: 0.75rem; opacity: 0.8;">${fileNames}</span><br>
            <span style="font-size: 0.75rem; opacity: 0.6;">Total size: ${totalSize}</span>
        `;
    }
    
    async handleUpload(e) {
        e.preventDefault();
        
        if (appState.files.selected.length === 0) {
            notificationManager.show('Please select files to upload', 'error');
            return;
        }
        
        const formData = new FormData();
        appState.files.selected.forEach(file => {
            formData.append('files', file);
        });
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.ui.showLoadingState(submitBtn);
        
        try {
            const data = await this.api.request('/upload/', {
                method: 'POST',
                data: formData,
                isFormData: true
            });
            
            this.ui.showResponse(data);
            notificationManager.show('Files uploaded successfully!', 'success');
            
            // Reset form
            this.ui.dom.elements.uploadForm?.reset();
            this.ui.dom.elements.fileInfo.textContent = 'No files selected';
            appState.files.selected = [];
            
        } catch (error) {
            notificationManager.show(error.message || 'Upload failed', 'error');
        } finally {
            this.ui.hideLoadingState(submitBtn);
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Prediction Manager
class PredictionManager {
    constructor(apiManager, uiManager) {
        this.api = apiManager;
        this.ui = uiManager;
    }
    
    async handlePrediction(e) {
        e.preventDefault();
        
        const preprocessorFilename = this.ui.dom.elements.preprocessorFilename?.value;
        const modelFilename = this.ui.dom.elements.modelFilename?.value;
        const inputDataText = this.ui.dom.elements.inputData?.value;
        
        if (!preprocessorFilename || !modelFilename || !inputDataText) {
            notificationManager.show('Please fill in all fields', 'error');
            return;
        }
        
        let inputData;
        try {
            inputData = JSON.parse(inputDataText);
        } catch (error) {
            notificationManager.show('Invalid JSON format in input data', 'error');
            this.ui.showResponse({
                error: 'Invalid JSON format. Please use double quotes for property names and string values.',
                details: error.message,
                example: '[{"age": 20, "gender": "male", "height": 172}]'
            });
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.ui.showLoadingState(submitBtn);
        
        try {
            const data = await this.api.request('/pipelines/predict', {
                method: 'POST',
                data: {
                    preprocessor_filename: preprocessorFilename,
                    model_filename: modelFilename,
                    input_data: inputData
                }
            });
            
            this.ui.showResponse(data);
            notificationManager.show('Prediction completed!', 'success');
            
        } catch (error) {
            notificationManager.show(error.message || 'Prediction failed', 'error');
            this.ui.showResponse({
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            this.ui.hideLoadingState(submitBtn);
        }
    }
}

// Notification Manager
class NotificationManager {
    constructor() {
        this.addStyles();
    }
    
    show(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
        this.remove(); // Remove existing notifications
        
        const notification = this.create(message, type);
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    create(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${this.getBackground(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            backdrop-filter: blur(20px);
            border: 1px solid ${this.getBorder(type)};
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(notification));
        
        return notification;
    }
    
    remove(notification = null) {
        const notifications = notification ? 
            [notification] : 
            document.querySelectorAll('.notification');
            
        notifications.forEach(n => {
            if (n.parentNode) {
                n.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => n.remove(), 300);
            }
        });
    }
    
    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    getBackground(type) {
        const backgrounds = {
            success: 'rgba(16, 185, 129, 0.9)',
            error: 'rgba(239, 68, 68, 0.9)',
            warning: 'rgba(245, 158, 11, 0.9)',
            info: 'rgba(59, 130, 246, 0.9)'
        };
        return backgrounds[type] || backgrounds.info;
    }
    
    getBorder(type) {
        const borders = {
            success: 'rgba(16, 185, 129, 0.3)',
            error: 'rgba(239, 68, 68, 0.3)',
            warning: 'rgba(245, 158, 11, 0.3)',
            info: 'rgba(59, 130, 246, 0.3)'
        };
        return borders[type] || borders.info;
    }
    
    addStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 0.25rem;
                transition: background-color 0.15s ease;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(styles);
    }
}

// Global instances
let appState, domManager, uiManager, apiManager, authManager, fileManager, predictionManager, notificationManager;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    appState = new AppState();
    domManager = new DOMManager();
    uiManager = new UIManager(domManager);
    apiManager = new APIManager();
    authManager = new AuthManager(apiManager, uiManager);
    fileManager = new FileManager(apiManager, uiManager);
    predictionManager = new PredictionManager(apiManager, uiManager);
    notificationManager = new NotificationManager();
    
    // Set initial UI state
    if (appState.user.isAuthenticated) {
        uiManager.showDashboard();
    } else {
        uiManager.showLandingPage();
    }
    
    // Add mouse movement parallax effect
    document.addEventListener('mousemove', (e) => {
        const shapes = document.querySelectorAll('.shape');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            const xMove = (x - 0.5) * speed * 20;
            const yMove = (y - 0.5) * speed * 20;
            
            shape.style.transform = `translate(${xMove}px, ${yMove}px) rotate(${index * 120 + Date.now() * 0.001}deg)`;
        });
    });
    
    console.log('🚀 Data2API application initialized successfully!');
});