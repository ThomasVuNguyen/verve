const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');

const socket = new WebSocket('ws://localhost:3000');

socket.onopen = (event) => {
    console.log('WebSocket opened:', event);
};

socket.onmessage = (event) => {
    const fullMessage = event.data;
    if (fullMessage.startsWith('AI: ')) {
        const aiResponse = fullMessage.substring(4);
        displayMessage(aiResponse, 'received');
    } else if (fullMessage.startsWith('User: ')) {
        const userMessage = fullMessage.substring(6);
        displayMessage(userMessage, 'received');
    } else {
        // Fallback for any other messages
        displayMessage(fullMessage, 'received');
    }
};

socket.onclose = (event) => {
    console.log('WebSocket closed:', event);
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

sendButton.addEventListener('click', () => {
    sendMessage();
});

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value;
    if (message.trim() !== '') {
        socket.send(message);
        displayMessage(message, 'sent'); // Display user's own message as sent
        messageInput.value = '';
    }
}

function displayMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
