// main.js

window.onload = function() {
    const socket = io();
    
    socket.on('connect', function(){});
    socket.on('event', function(data){});
    socket.on('disconnect', function(){});
    
    socket.on('update', (data) => {
        const inputArea = document.querySelector('#input-area');
        if (inputArea) {
            inputArea.value = data.content;
        }
        const lastUpdatedElement = document.querySelector('#lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.innerText = new Date(data.padData.lastUpdated).toLocaleString();
            lastUpdatedElement.setAttribute('datetime', data.padData.lastUpdated);
        }
    });
    
    socket.on('passwordSet', (data) => {
        if(data.success) {
            showNotification('Password set successfully!', 'success');
            closePasswordModal();
        } else {
            showNotification('Failed to set password.', 'error');
        }
    });

    initializeTheme();
    initializeFontSettings();
    initializePagePath();
    attachEventListeners();

    window.socket = socket;
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function initializeFontSettings() {
    const savedFontSize = localStorage.getItem('fontSize') || '16px';
    const savedFontStyle = localStorage.getItem('fontStyle') || 'sans-serif';
    
    const inputArea = document.querySelector('#input-area');
    if (inputArea) {
        inputArea.style.fontSize = savedFontSize;
        if (savedFontStyle === 'monospace') {
            inputArea.classList.add('monospace');
        }
    }
    
    const fontSizeSelect = document.querySelector('#fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
    }
    
    const fontToggle = document.querySelector('#fontToggle');
    if (fontToggle && savedFontStyle === 'monospace') {
        fontToggle.classList.add('active');
    }
}

function initializePagePath() {
    const pagePath = document.querySelector('#pagePath');
    if (pagePath) {
        pagePath.textContent = window.location.pathname;
    }
}

function attachEventListeners() {
    const inputAreaElement = document.getElementById('input-area');
    if (inputAreaElement) {
        inputAreaElement.addEventListener('keyup', sendData);
        inputAreaElement.addEventListener('input', showSavingIndicator);
    }

    const goForm = document.getElementById('goForm');
    if (goForm) {
        goForm.addEventListener('submit', onGo);
    }

    const fontSizeSelectElement = document.getElementById('fontSizeSelect');
    if (fontSizeSelectElement) {
        fontSizeSelectElement.addEventListener('change', changeFontSize);
    }

    const themeToggleElement = document.getElementById('themeToggle');
    if (themeToggleElement) {
        themeToggleElement.addEventListener('click', toggleTheme);
    }

    const fontToggleElement = document.getElementById('fontToggle');
    if (fontToggleElement) {
        fontToggleElement.addEventListener('click', toggleFontStyle);
    }

    const setPasswordButton = document.getElementById('setPasswordButton');
    if (setPasswordButton) {
        setPasswordButton.addEventListener('click', openPasswordModal);
    }

    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closePasswordModal);
    }

    const modalCancel = document.getElementById('modalCancel');
    if (modalCancel) {
        modalCancel.addEventListener('click', closePasswordModal);
    }

    const setPasswordForm = document.getElementById('setPasswordForm');
    if (setPasswordForm) {
        setPasswordForm.addEventListener('submit', submitPasswordModal);
    }

    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                closePasswordModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && passwordModal.classList.contains('active')) {
                closePasswordModal();
            }
        });
    }

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', submitPassword);
    }
}

function onGo(event) {
    event.preventDefault();
    const content = document.querySelector('#input-go').value.trim();
    if (content) {
        const path = content.startsWith('/') ? content : '/' + content;
        window.location.href = path;
    }
}

function showSavingIndicator() {
    const saveIndicator = document.querySelector('#saveIndicator');
    if (saveIndicator) {
        saveIndicator.classList.remove('saved');
        saveIndicator.classList.add('saving');
        saveIndicator.querySelector('.save-text').textContent = 'Saving...';
    }
}

function showSavedIndicator() {
    const saveIndicator = document.querySelector('#saveIndicator');
    if (saveIndicator) {
        saveIndicator.classList.remove('saving');
        saveIndicator.classList.add('saved');
        saveIndicator.querySelector('.save-text').textContent = 'Saved';
        
        setTimeout(() => {
            saveIndicator.classList.remove('saved');
        }, 2000);
    }
}

function sendData() {
    const content = document.querySelector('#input-area').value;
    const path = window.location.pathname;
    
    if (window.bounceTimeOut) {
        clearTimeout(window.bounceTimeOut);
    }
    
    window.bounceTimeOut = setTimeout(() => {
        socket.emit('update', { path, content });
        showSavedIndicator();
    }, 1000);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function toggleFontStyle() {
    const inputArea = document.querySelector('#input-area');
    const fontToggle = document.querySelector('#fontToggle');
    
    if (inputArea && fontToggle) {
        const isMonospace = inputArea.classList.toggle('monospace');
        fontToggle.classList.toggle('active');
        
        const fontStyle = isMonospace ? 'monospace' : 'sans-serif';
        localStorage.setItem('fontStyle', fontStyle);
    }
}

function changeFontSize() {
    const fontSize = document.querySelector('#fontSizeSelect').value;
    const inputArea = document.querySelector('#input-area');
    if (inputArea) {
        inputArea.style.fontSize = fontSize;
        localStorage.setItem('fontSize', fontSize);
    }
}

function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        
        const form = document.getElementById('setPasswordForm');
        if (form) {
            form.reset();
        }
    }
}

function submitPasswordModal(event) {
    event.preventDefault();
    
    const newPassword = document.querySelector('#newPassword').value;
    const confirmPassword = document.querySelector('#confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    if (newPassword.length < 4) {
        showNotification('Password must be at least 4 characters!', 'error');
        return;
    }
    
    const path = window.location.pathname;
    socket.emit('setPassword', { path, password: newPassword });
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
        color: white;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function submitPassword(event) {
    event.preventDefault();
    const password = document.querySelector('#password').value;
    const formAction = window.location.pathname + '/password';

    fetch(formAction, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ password }).toString(),
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            return response.text();
        }
    })
    .then(html => {
        if (html) {
            document.open();
            document.write(html);
            document.close();
        }
    })
    .catch(error => console.error('Error:', error));
}
