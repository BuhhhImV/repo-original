document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    
    const uploadView = document.getElementById('upload-view');
    const dashboardView = document.getElementById('dashboard-view');
    const analyzingState = document.getElementById('analyzing-state');
    
    const summaryContent = document.getElementById('summary-content');
    const redFlagsList = document.getElementById('red-flags-list');
    
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const newDocBtn = document.getElementById('new-doc-btn');

    let currentFileId = null;

    // --- Upload Handlers ---
    browseBtn.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    newDocBtn.addEventListener('click', () => {
        dashboardView.classList.add('hidden');
        uploadView.classList.remove('hidden');
        fileInput.value = '';
        currentFileId = null;
    });

    function handleFile(file) {
        // Validate
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
            alert('Please upload a PDF or DOCX file.');
            return;
        }

        // UI State
        dropzone.classList.add('hidden');
        analyzingState.classList.remove('hidden');

        // Simulate file upload
        const formData = new FormData();
        formData.append('document', file);

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            currentFileId = data.file_id;
            return fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_id: currentFileId })
            });
        })
        .then(res => res.json())
        .then(data => {
            populateDashboard(data);
            showDashboard();
        })
        .catch(err => {
            console.error(err);
            alert('Error processing file. Please try again.');
            resetUploadState();
        });
    }

    function resetUploadState() {
        dropzone.classList.remove('hidden');
        analyzingState.classList.add('hidden');
        fileInput.value = '';
    }

    function showDashboard() {
        uploadView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        resetUploadState();
        
        // Clear chat
        chatHistory.innerHTML = `
            <div class="message ai-message">
                <div class="avatar ai-avatar">AI</div>
                <div class="message-content">I've read the document completely. What specific questions do you have? (e.g., "Can my landlord enter without notice?")</div>
            </div>
        `;
    }

    function populateDashboard(data) {
        summaryContent.classList.remove('skeleton-text');
        summaryContent.textContent = data.summary || "No summary generated.";

        redFlagsList.innerHTML = '';
        if (data.red_flags && data.red_flags.length > 0) {
            data.red_flags.forEach(flag => {
                const li = document.createElement('li');
                li.innerHTML = flag; // allow strong tags
                redFlagsList.appendChild(li);
            });
        } else {
            redFlagsList.innerHTML = '<li>No critical red flags detected.</li>';
        }
    }

    // --- Chat Handlers ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || !currentFileId) return;

        // Add user message
        addChatMessage('user', text);
        chatInput.value = '';

        // Add AI typing indicator
        const typingId = addTypingIndicator();

        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_id: currentFileId, question: text })
        })
        .then(res => res.json())
        .then(data => {
            removeMessage(typingId);
            addChatMessage('ai', data.answer);
        })
        .catch(err => {
            console.error(err);
            removeMessage(typingId);
            addChatMessage('ai', 'Sorry, I encountered an error answering that.');
        });
    });

    function addChatMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatar = `<div class="avatar ${role}-avatar">${role === 'ai' ? 'AI' : 'You'}</div>`;
        
        // Parse markdown bold (**text**)
        const parsedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content">${parsedContent}</div>
        `;
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return messageDiv;
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ai-message`;
        messageDiv.id = id;
        
        messageDiv.innerHTML = `
            <div class="avatar ai-avatar">AI</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
