
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getDaysRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function calculatePercentage(current, total) {
    if (total === 0) return 0;
    const percentage = (current / total) * 100;
    return Math.min(Math.round(percentage * 100) / 100, 100);
}

function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getUserFriendlyErrorMessage(error) {
    if (!error) {
        return 'An unexpected error occurred. Please try again.';
    }
    
    if (typeof error === 'string') {
        return error;
    }
    
    const errorMessage = error.message || error.toString() || '';
    const errorStatus = error.status || error.statusCode;
    const errorData = error.data || {};
    
    if (errorData.title && (
        errorData.title.includes('InvalidCredentials') || 
        errorData.title.includes('Invalid Email') ||
        errorData.title.includes('Invalid Password') ||
        errorData.title === 'user.InvalidCredentials'
    )) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (errorData.detail && (
        errorData.detail.includes('Invalid Email/Password') ||
        errorData.detail.includes('Invalid credentials') ||
        errorData.detail.includes('Invalid email') ||
        errorData.detail.includes('Invalid password')
    )) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (errorData.message && (
        errorData.message.includes('Invalid Email/Password') ||
        errorData.message.includes('Invalid credentials') ||
        errorData.message.includes('Invalid email') ||
        errorData.message.includes('Invalid password')
    )) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (errorData.title && (
        errorData.title.includes('NotApproved') || 
        errorData.title === 'user.NotApproved'
    )) {
        return 'Your account is pending admin approval. Please wait for approval or contact support.';
    }
    
    if (errorData.detail && errorData.detail.includes('pending admin approval')) {
        return 'Your account is pending admin approval. Please wait for approval or contact support.';
    }
    
    if (errorData.title && (
        errorData.title.includes('EmailNotConfirmed') || 
        errorData.title === 'user.EmailNotConfirmed'
    )) {
        return 'Please confirm your email address before logging in.';
    }
    
    if (errorData.title && (
        errorData.title.includes('DuplicatedEmail') || 
        errorData.title === 'user.DuplicatedEmail'
    )) {
        return 'This email is already registered. Please use a different email or try logging in instead.';
    }
    
    if (errorData.detail && errorData.detail.includes('Email already exisit')) {
        return 'This email is already registered. Please use a different email or try logging in instead.';
    }
    
    if (errorData.title && typeof errorData.title === 'string') {
        let message = errorData.title;
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            message += ': ' + errorData.errors.join('. ');
        } else if (errorData.detail) {
            message = errorData.detail;
        }
        return message;
    }
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') || 
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Cannot connect') ||
        errorMessage.includes('backend is running')) {
        return 'Unable to connect to the server. Please check your internet connection and make sure the backend server is running on https://localhost:7221';
    }
    
    if (errorStatus === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        if (errorMessage.includes('Invalid credentials') || 
            errorMessage.includes('Invalid email or password') ||
            errorMessage.includes('Invalid Email/Password') ||
            errorMessage.includes('InvalidCredentials') ||
            errorMessage.includes('Invalid email') ||
            errorMessage.includes('Invalid password')) {
            return 'Invalid email or password. Please check your credentials and try again.';
        }
        if (errorMessage.includes('NotApproved') || errorMessage.includes('pending admin approval')) {
            return 'Your account is pending admin approval. Please wait for approval or contact support.';
        }
        if (errorMessage.includes('EmailNotConfirmed') || errorMessage.includes('email confirmation')) {
            return 'Please confirm your email address before logging in.';
        }
        return 'Your session has expired or you are not authorized. Please log in again.';
    }
    
    if (errorStatus === 403 || errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        return 'You do not have permission to perform this action.';
    }
    
    if (errorStatus === 404 || errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        return 'The requested resource was not found.';
    }
    
    if (errorStatus === 400 || errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        if (errorMessage.includes('Invalid credentials') || 
            errorMessage.includes('Invalid email or password') ||
            errorMessage.includes('Invalid Email/Password') ||
            errorMessage.includes('InvalidCredentials') ||
            errorMessage.includes('Invalid email') ||
            errorMessage.includes('Invalid password')) {
            return 'Invalid email or password. Please check your credentials and try again.';
        }
        if (errorMessage.includes('validation') || errorMessage.includes('Validation')) {
            return 'Please check your input. Some fields may be invalid or missing.';
        }
        if (errorMessage.includes('DuplicatedEmail') || errorMessage.includes('Email already exists')) {
            return 'This email is already registered. Please use a different email or try logging in instead.';
        }
        return 'Invalid request. Please check your input and try again.';
    }
    
    if (errorStatus === 500 || errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        return 'A server error occurred. Please try again later or contact support if the problem persists.';
    }
    
    if (errorMessage.includes('Invalid email or password') || 
        errorMessage.includes('Invalid credentials') ||
        errorMessage.includes('Invalid Email/Password') ||
        errorMessage.includes('InvalidCredentials') ||
        errorMessage.includes('Invalid email') ||
        errorMessage.includes('Invalid password') ||
        errorMessage.includes('Login failed')) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (errorMessage.includes('NotApproved') || errorMessage.includes('pending admin approval')) {
        return 'Your account is pending admin approval. Please wait for approval or contact support.';
    }
    
    if (errorMessage.includes('EmailNotConfirmed') || errorMessage.includes('email confirmation')) {
        return 'Please confirm your email address before logging in.';
    }
    
    if (errorMessage.includes('No token') || errorMessage.includes('token') && errorMessage.includes('received')) {
        return 'Authentication failed: Unable to receive authentication token. Please try logging in again.';
    }
    
    if (errorMessage.includes('Email already exists') || errorMessage.includes('already registered')) {
        return 'This email is already registered. Please use a different email or try logging in instead.';
    }
    
    if (errorMessage.includes('Password') && errorMessage.includes('required')) {
        return 'Password is required. Please enter your password.';
    }
    
    if (errorMessage.includes('Email') && errorMessage.includes('required')) {
        return 'Email is required. Please enter your email address.';
    }
    
    if (error.title && typeof error.title === 'string') {
        return error.title;
    }
    
    if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        return error.errors.join('. ');
    }
    
    if (errorMessage && 
        errorMessage.length < 200 && 
        !errorMessage.includes('Error:') && 
        !errorMessage.includes('at ') &&
        !errorMessage.includes('undefined') &&
        !errorMessage.includes('is not defined')) {
        return errorMessage;
    }
    
    if (errorMessage.includes('is not defined') || errorMessage.includes('undefined')) {
        return 'A system error occurred. Please refresh the page and try again.';
    }
    
    return 'An unexpected error occurred. Please try again. If the problem persists, please contact support.';
}

function handleError(error, customMessage = null) {
    console.error('Error occurred:', error);
    
    const friendlyMessage = customMessage || getUserFriendlyErrorMessage(error);
    showNotification(friendlyMessage, 'error');
    
    return friendlyMessage;
}

function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = '<div class="spinner"></div>';
    element.appendChild(spinner);
    return spinner;
}

function hideLoading(spinner) {
    if (spinner) spinner.remove();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function setQueryParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

function redirectTo(path) {
    window.location.href = path;
}

function isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return false;
    
    if (token.trim().length < 10) {
        console.warn('Token appears to be invalid (too short)');
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        return false;
    }
    
    return true;
}

function getCurrentUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
}

function isAdmin() {
    const user = getCurrentUser();
    return !!(user && (
        user.role === 'Admin' ||
        (Array.isArray(user.roles) && user.roles.includes('Admin')) ||
        user.isAdmin === true
    ));
}

function buildImageUrl(imagePath) {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    const fullUrl = `${API_CONFIG.BASE_URL}${cleanPath}`;
    
    return fullUrl;
}

