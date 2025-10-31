// main.js

const USERNAME_EXPIRY_MS = 3600000;
const REMOTE_UPDATE_DELAY_MS = 50;
const SAVE_DEBOUNCE_MS = 1000;
const BROADCAST_DEBOUNCE_MS = 50;
const CURSOR_MOVE_DEBOUNCE_MS = 50;
const CURSOR_FADE_DELAY_MS = 3000;
const NOTIFICATION_DURATION_MS = 3000;
const NOTIFICATION_FADE_MS = 300;
const SAVE_INDICATOR_DURATION_MS = 2000;
const FOCUS_DELAY_MS = 100;
const CURSOR_UPDATE_DELAY_MS = 50;
const MIN_PASSWORD_LENGTH = 4;

const remoteCursors = new Map();
let myUserId = null;
let isUpdatingFromRemote = false;

function cleanupOldUsernames() {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
        if (key.startsWith('username_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (now - data.timestamp > USERNAME_EXPIRY_MS) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                localStorage.removeItem(key);
            }
        }
    });
}

function getStoredUsername(path) {
    const key = `username_${path}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
        try {
            const data = JSON.parse(stored);
            const now = Date.now();
            
            if (now - data.timestamp < USERNAME_EXPIRY_MS) {
                return data.username;
            } else {
                localStorage.removeItem(key);
            }
        } catch (e) {
            localStorage.removeItem(key);
        }
    }
    
    return null;
}

function storeUsername(path, username) {
    const key = `username_${path}`;
    const data = {
        username: username,
        timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
}

window.onload = function() {
    cleanupOldUsernames();
    
    const socket = io();
    
    socket.on('connect', function(){
        const inputArea = document.querySelector('#input-area');
        if (inputArea) {
            const path = window.location.pathname;
            const storedUsername = getStoredUsername(path);
            socket.emit('joinPad', { path, requestedUsername: storedUsername });
        }
    });
    
    socket.on('roomJoined', (data) => {
        myUserId = data.userId;
        updateUserCount(data.userCount);
        
        if (data.username) {
            const path = window.location.pathname;
            storeUsername(path, data.username);
        }
    });
    
    socket.on('userJoined', (data) => {
        updateUserCount(data.userCount);
    });
    
    socket.on('userLeft', (data) => {
        updateUserCount(data.userCount);
        removeRemoteCursor(data.userId);
    });
    
    socket.on('update', (data) => {
        const inputArea = document.querySelector('#input-area');
        if (inputArea && data.userId !== myUserId) {
            isUpdatingFromRemote = true;
            const cursorPosition = inputArea.selectionStart;
            inputArea.value = data.content;
            inputArea.setSelectionRange(cursorPosition, cursorPosition);
            setTimeout(() => { 
                isUpdatingFromRemote = false;
                updateAllRemoteCursors();
            }, REMOTE_UPDATE_DELAY_MS);
        }
        const lastUpdatedElement = document.querySelector('#lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.innerText = new Date(data.padData.lastUpdated).toLocaleString();
            lastUpdatedElement.setAttribute('datetime', data.padData.lastUpdated);
        }
    });
    
    socket.on('cursorUpdate', (data) => {
        updateRemoteCursor(data.userId, data.position, data.selection, data.username);
    });
    
    socket.on('passwordSet', (data) => {
        if(data.success) {
            showNotification('Password set successfully!', 'success');
            closePasswordModal();
        } else {
            const errorMessage = data.error || 'Failed to set password.';
            showNotification(errorMessage, 'error');
        }
    });

    initializeTheme();
    initializeFontSettings();
    initializePagePath();
    initializePageTitle();
    attachEventListeners();
    
    window.addEventListener('resize', updateAllRemoteCursors);

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

function initializePageTitle() {
    const path = window.location.pathname;
    if (path && path !== '/') {
        document.title = path.replace('/', '') + ' | KPad';
    }
}

function attachEventListeners() {
    const inputAreaElement = document.getElementById('input-area');
    if (inputAreaElement) {
        inputAreaElement.addEventListener('input', sendData);
        inputAreaElement.addEventListener('input', showSavingIndicator);
        inputAreaElement.addEventListener('input', updateAllRemoteCursors);
        inputAreaElement.addEventListener('input', handleCursorMove);
        inputAreaElement.addEventListener('click', () => handleCursorMove(true));
        inputAreaElement.addEventListener('keydown', handleCursorMove);
        inputAreaElement.addEventListener('keyup', handleCursorMove);
        inputAreaElement.addEventListener('select', () => handleCursorMove(true));
        inputAreaElement.addEventListener('scroll', updateAllRemoteCursors);
        inputAreaElement.addEventListener('blur', () => handleCursorMove(true));
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
        }, SAVE_INDICATOR_DURATION_MS);
    }
}

function sendData() {
    if (isUpdatingFromRemote) return;
    
    const content = document.querySelector('#input-area').value;
    const path = window.location.pathname;
    
    // Immediate broadcast to other users (no DB save)
    if (window.broadcastTimeout) {
        clearTimeout(window.broadcastTimeout);
    }
    
    window.broadcastTimeout = setTimeout(() => {
        socket.emit('broadcast', { path, content });
    }, BROADCAST_DEBOUNCE_MS);
    
    // Delayed save to database
    if (window.saveTimeout) {
        clearTimeout(window.saveTimeout);
    }
    
    window.saveTimeout = setTimeout(() => {
        socket.emit('update', { path, content });
        showSavedIndicator();
    }, SAVE_DEBOUNCE_MS);
}

function handleCursorMove(immediate = false) {
    if (isUpdatingFromRemote) return;
    
    const inputArea = document.querySelector('#input-area');
    if (!inputArea) return;
    
    const position = inputArea.selectionStart;
    const path = window.location.pathname;
    
    const selection = inputArea.selectionStart !== inputArea.selectionEnd ? {
        start: inputArea.selectionStart,
        end: inputArea.selectionEnd
    } : undefined;
    
    if (window.cursorMoveTimeout) {
        clearTimeout(window.cursorMoveTimeout);
    }
    
    if (immediate) {
        socket.emit('cursorMove', { path, position, selection });
    } else {
        window.cursorMoveTimeout = setTimeout(() => {
            socket.emit('cursorMove', { path, position, selection });
        }, CURSOR_MOVE_DEBOUNCE_MS);
    }
}

function updateUserCount(count) {
    let userCountElement = document.querySelector('#userCount');
    
    if (!userCountElement) {
        const toolbar = document.querySelector('.toolbar-left');
        if (toolbar) {
            userCountElement = document.createElement('div');
            userCountElement.id = 'userCount';
            userCountElement.className = 'user-count';
            toolbar.insertBefore(userCountElement, toolbar.firstChild);
        }
    }
    
    if (userCountElement) {
        const plural = count === 1 ? 'user' : 'users';
        userCountElement.textContent = `${count} ${plural} online`;
        userCountElement.className = 'user-count';
        if (count > 1) {
            userCountElement.classList.add('multiple-users');
        }
    }
}

function getTextPositionCoordinates(textarea, position) {
    const div = document.createElement('div');
    const styles = getComputedStyle(textarea);
    const rect = textarea.getBoundingClientRect();
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.top = rect.top + 'px';
    div.style.left = rect.left + 'px';
    div.style.pointerEvents = 'none';
    
    div.style.fontSize = styles.fontSize;
    div.style.fontFamily = styles.fontFamily;
    div.style.fontWeight = styles.fontWeight;
    div.style.lineHeight = styles.lineHeight;
    div.style.letterSpacing = styles.letterSpacing;
    div.style.padding = styles.padding;
    div.style.border = styles.border;
    div.style.width = textarea.clientWidth + 'px';
    div.style.boxSizing = styles.boxSizing;
    
    document.body.appendChild(div);
    
    const textBeforeCursor = textarea.value.substring(0, position);
    div.textContent = textBeforeCursor;
    
    const span = document.createElement('span');
    span.textContent = '\u200b';
    div.appendChild(span);
    
    const spanRect = span.getBoundingClientRect();
    
    document.body.removeChild(div);
    
    return {
        left: spanRect.left - rect.left,
        top: spanRect.top - rect.top
    };
}

function updateRemoteCursor(userId, position, selection, username) {
    const inputArea = document.querySelector('#input-area');
    if (!inputArea) return;
    
    let cursorElement = remoteCursors.get(userId);
    
    if (!cursorElement) {
        cursorElement = document.createElement('div');
        cursorElement.className = 'remote-cursor';
        cursorElement.dataset.userId = userId;
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        const colorIndex = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        const color = colors[colorIndex];
        cursorElement.style.borderLeftColor = color;
        cursorElement.style.color = color;
        
        const usernameLabel = document.createElement('div');
        usernameLabel.className = 'remote-cursor-label';
        usernameLabel.textContent = username || 'Anonymous';
        usernameLabel.style.backgroundColor = color;
        cursorElement.appendChild(usernameLabel);
        
        const cursorContainer = document.createElement('div');
        cursorContainer.className = 'remote-cursor-container';
        cursorContainer.appendChild(cursorElement);
        inputArea.parentElement.appendChild(cursorContainer);
        
        remoteCursors.set(userId, cursorElement);
    }
    
    cursorElement.dataset.position = position;
    
    const coords = getTextPositionCoordinates(inputArea, position);
    const container = cursorElement.parentElement;
    
    if (container) {
        container.style.left = coords.left + 'px';
        container.style.top = coords.top + 'px';
        container.style.display = 'block';
    }
    
    if (cursorElement.hideTimeout) {
        clearTimeout(cursorElement.hideTimeout);
    }
    
    cursorElement.hideTimeout = setTimeout(() => {
        if (container) {
            container.style.opacity = '0.3';
        }
    }, CURSOR_FADE_DELAY_MS);
    
    if (container) {
        container.style.opacity = '1';
    }
}

function removeRemoteCursor(userId) {
    const cursorElement = remoteCursors.get(userId);
    if (cursorElement) {
        const container = cursorElement.parentElement;
        if (container) {
            container.remove();
        }
        remoteCursors.delete(userId);
    }
}

let updateCursorsTimeout;
let updateCursorsFrame;
function updateAllRemoteCursors() {
    if (remoteCursors.size === 0) return;
    
    if (updateCursorsTimeout) {
        clearTimeout(updateCursorsTimeout);
    }
    
    if (updateCursorsFrame) {
        cancelAnimationFrame(updateCursorsFrame);
    }
    
    updateCursorsFrame = requestAnimationFrame(() => {
        const inputArea = document.querySelector('#input-area');
        if (!inputArea) return;
        
        remoteCursors.forEach((cursorElement, userId) => {
            const position = cursorElement.dataset.position;
            if (position !== undefined) {
                const coords = getTextPositionCoordinates(inputArea, parseInt(position));
                const container = cursorElement.parentElement;
                
                if (container) {
                    container.style.left = coords.left + 'px';
                    container.style.top = coords.top + 'px';
                }
            }
        });
    });
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
        setTimeout(updateAllRemoteCursors, CURSOR_UPDATE_DELAY_MS);
    }
}

function changeFontSize() {
    const fontSize = document.querySelector('#fontSizeSelect').value;
    const inputArea = document.querySelector('#input-area');
    if (inputArea) {
        inputArea.style.fontSize = fontSize;
        localStorage.setItem('fontSize', fontSize);
        setTimeout(updateAllRemoteCursors, CURSOR_UPDATE_DELAY_MS);
    }
}

function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), FOCUS_DELAY_MS);
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
    
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        showNotification(`Password must be at least ${MIN_PASSWORD_LENGTH} characters!`, 'error');
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
        setTimeout(() => notification.remove(), NOTIFICATION_FADE_MS);
    }, NOTIFICATION_DURATION_MS);
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
