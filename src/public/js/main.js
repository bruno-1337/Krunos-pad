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
        }
    });
    socket.on('passwordSet', (data) => {
        if(data.success) {
            alert('Password set successfully!');
        } else {
            alert('Failed to set password.');
        }
    });

    // Load font size from local storage
    const savedFontSize = localStorage.getItem('fontSize') || '22px';
    const inputArea = document.querySelector('#input-area');
    if (inputArea) {
        inputArea.style.fontSize = savedFontSize;
    }
    const fontSizeSelect = document.querySelector('#fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
    }

    // Attach event listeners
    const inputAreaElement = document.getElementById('input-area');
    if (inputAreaElement) {
        inputAreaElement.addEventListener('keyup', sendData);
    }

    const goForm = document.getElementById('goForm');
    if (goForm) {
        goForm.addEventListener('submit', onGo);
    }

    const fontSizeSelectElement = document.getElementById('fontSizeSelect');
    if (fontSizeSelectElement) {
        fontSizeSelectElement.addEventListener('change', changeFontSize);
    }

    const setPasswordButton = document.getElementById('setPasswordButton');
    if (setPasswordButton) {
        setPasswordButton.addEventListener('click', setPassword);
    }

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', submitPassword);
    }

    window.socket = socket;
}

function onGo(event) {
    event.preventDefault();
    const content = document.querySelector('#input-go').value;
    window.location.replace(content);
}

function sendData() {
    const content = document.querySelector('#input-area').value;
    const path = window.location.pathname;
    if (window.bounceTimeOut) {
        clearTimeout(window.bounceTimeOut);
    }
    window.bounceTimeOut = setTimeout(() => {
        socket.emit('update', { path, content });
    }, 1000);
}

function setPassword() {
    const password = prompt('Enter a password to protect this pad:');
    if (password) {
        const path = window.location.pathname;
        socket.emit('setPassword', { path, password });
    }
}

function changeFontSize() {
    const fontSize = document.querySelector('#fontSizeSelect').value;
    document.querySelector('#input-area').style.fontSize = fontSize;
    localStorage.setItem('fontSize', fontSize);
}

function submitPassword(event) {
    event.preventDefault();
    const password = document.querySelector('#password').value;
    const formAction = window.location.pathname + '/password'; // Ensure it targets the correct URL

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
