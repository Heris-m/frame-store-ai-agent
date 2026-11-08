// Create and inject the chat widget HTML dynamically
const widgetContainer = document.createElement('div');
widgetContainer.id = 'ai-chat-widget';
widgetContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: sans-serif;';
widgetContainer.innerHTML = `
    <div id="chat-bubble" style="background: #111; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 24px;">
        💬
    </div>
    
    <div id="chat-window" style="display: none; width: 320px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; position: absolute; bottom: 80px; right: 0;">
        <div style="background: #111; color: white; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
            <span>Frame Support AI</span>
            <span id="close-chat" style="cursor: pointer; font-size: 18px;">✕</span>
        </div>
        <div id="chat-messages" style="flex: 1; padding: 15px; overflow-y: auto; font-size: 14px; display: flex; flex-direction: column; gap: 10px; background: #fafafa;">
            <div style="background: #e0e0e0; color: #333; padding: 8px 12px; border-radius: 8px; max-width: 80%;">Hello! Looking for a specific frame size or style today?</div>
        </div>
        <div style="padding: 10px; border-top: 1px solid #ddd; display: flex; gap: 5px; background: white;">
            <input type="text" id="chat-input" placeholder="Ask about frames, sizing..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; outline: none;">
            <button id="send-btn" style="background: #111; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Send</button>
        </div>
    </div>
`;
document.body.appendChild(widgetContainer);

// Toggle chat window open/closed
const chatBubble = document.getElementById('chat-bubble');
const chatWindow = document.getElementById('chat-window');
const closeChat = document.getElementById('close-chat');

function toggleChat() {
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
}

chatBubble.addEventListener('click', toggleChat);
closeChat.addEventListener('click', toggleChat);

// Handle sending messages
const sendBtn = document.getElementById('send-btn');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append user message to UI
    chatMessages.innerHTML += `<div style="align-self: flex-end; background: #007bff; color: white; padding: 8px 12px; border-radius: 8px; max-width: 80%; word-break: break-word;">${text}</div>`;
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    chatMessages.innerHTML += `<div id="${loadingId}" style="align-self: flex-start; background: #e0e0e0; color: #666; padding: 8px 12px; border-radius: 8px; max-width: 80%;">Thinking...</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Send request to your local FastAPI backend
        const res = await fetch('http://127.0.0.1:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
         
        const data = await res.json();
 
        console.log("Server response received:", data); // <-- LOOK AT THIS IN CONSOLE
//        displayMessage(data.reply);
 
        // Remove loading indicator
        document.getElementById(loadingId).remove();

        // Append bot reply from Gemini + Catalog CSV
        chatMessages.innerHTML += `<div style="align-self: flex-start; background: #e0e0e0; color: #333; padding: 8px 12px; border-radius: 8px; max-width: 80%; word-break: break-word;">${data.reply}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
    } catch (err) {
        document.getElementById(loadingId).remove();
        chatMessages.innerHTML += `<div style="align-self: flex-start; background: #ffebee; color: #c62828; padding: 8px 12px; border-radius: 8px; max-width: 80%;">Error connecting to backend server.</div>`;
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});