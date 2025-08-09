// Pusher configuration
const pusher = new Pusher('81448c8d861b0292ba68', {
    cluster: 'eu',
    encrypted: true
});

// Global variables
let currentUser = '';
let currentDebateId = '';
let currentSide = '';
let debateChannel = null;
let hubChannel = null;
let messageRefreshInterval = null;
let lastMessageCount = 0;

// Initialize hub channel
function initializeHub() {
    hubChannel = pusher.subscribe('debate-hub');
    
    hubChannel.bind('user-joined', function(data) {
        updateOnlineUsers(data.users);
    });
    
    hubChannel.bind('user-left', function(data) {
        updateOnlineUsers(data.users);
    });
    
    hubChannel.bind('debate-created', function(data) {
        addDebateToList(data.debate);
    });
    
    hubChannel.bind('debate-updated', function(data) {
        updateDebateInList(data.debate);
    });
    
    hubChannel.bind('debate-ended', function(data) {
        removeDebateFromList(data.debateId);
        if (currentDebateId === data.debateId) {
            showNotification('This debate has ended.', 'warning');
            leaveDebate();
        }
    });
}

// Join the hub
function joinHub() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }
    
    currentUser = username;
    document.getElementById('userSetup').classList.add('hidden');
    document.getElementById('mainHub').classList.remove('hidden');
    
    initializeHub();
    
    startMessageRefresh();
    // Simulate joining hub (in real app, this would be a server call)
    setTimeout(() => {
        updateOnlineUsers([currentUser]);
        loadActiveDebates();
    }, 500);
}

// Start message refresh interval
function startMessageRefresh() {
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
    }
    
    messageRefreshInterval = setInterval(() => {
        // Simulate checking for new messages
        if (currentDebateId) {
            // In a real app, this would fetch latest messages from server
            updateDebateActivity();
        }
        updateOnlineActivity();
    }, 1000);
}

// Update debate activity indicator
function updateDebateActivity() {
    const messagesContainer = document.getElementById('debateMessages');
    const currentMessageCount = messagesContainer.children.length;
    
    if (currentMessageCount !== lastMessageCount) {
        lastMessageCount = currentMessageCount;
        // Add subtle animation to indicate new activity
        messagesContainer.style.borderColor = '#10b981';
        setTimeout(() => {
            messagesContainer.style.borderColor = '';
        }, 1000);
    }
}

// Update online activity
function updateOnlineActivity() {
    // Simulate online user activity updates
    const onlineUsers = document.querySelectorAll('#onlineUsers span');
    onlineUsers.forEach(user => {
        if (Math.random() > 0.95) {
            user.style.transform = 'scale(1.1)';
            setTimeout(() => {
                user.style.transform = 'scale(1)';
            }, 200);
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 transition-all duration-300 transform translate-x-full ${
        type === 'error' ? 'bg-red-600' : 
        type === 'warning' ? 'bg-yellow-600' : 
        type === 'success' ? 'bg-green-600' : 'bg-blue-600'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Update online users display
function updateOnlineUsers(users) {
    const container = document.getElementById('onlineUsers');
    const count = document.getElementById('onlineCount');
    
    count.textContent = users.length;
    container.innerHTML = users.map(user => 
        `<span class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover-scale cursor-pointer transition-all duration-200">
            <i class="fas fa-circle text-green-300 mr-2 pulse-dot"></i>${user}
        </span>`
    ).join('');
}

// Create new debate
function createDebate() {
    const topic = document.getElementById('debateTopicInput').value.trim();
    if (!topic) {
        showNotification('Please enter a debate topic', 'error');
        return;
    }
    
    const debateId = Date.now().toString();
    const debate = {
        id: debateId,
        topic: topic,
        creator: currentUser,
        sideA: null,
        sideB: null,
        spectators: [],
        messages: [],
        status: 'waiting'
    };
    
    // Clear input
    document.getElementById('debateTopicInput').value = '';
    
    // Add to local list and join immediately
    addDebateToList(debate);
    joinDebate(debateId, topic);
    showNotification('Debate created successfully!', 'success');
}

// Add debate to list
function addDebateToList(debate) {
    const container = document.getElementById('activeDebates');
    
    // Remove "no debates" message
    if (container.innerHTML.includes('No active debates')) {
        container.innerHTML = '';
    }
    
    const debateElement = document.createElement('div');
    debateElement.id = `debate-${debate.id}`;
    debateElement.className = 'glass-effect rounded-xl p-6 transition-all duration-200 hover-scale border border-gray-600/30';
    debateElement.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h4 class="font-bold text-white text-lg">${debate.topic}</h4>
            <span class="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">by ${debate.creator}</span>
        </div>
        <div class="flex justify-between items-center">
            <div class="flex gap-6 text-gray-300">
                <span class="flex items-center"><i class="fas fa-users mr-2 text-blue-400"></i>
                    ${(debate.sideA ? 1 : 0) + (debate.sideB ? 1 : 0)}/2 debaters
                </span>
                <span class="flex items-center"><i class="fas fa-eye mr-2 text-yellow-400"></i>${debate.spectators.length} spectators</span>
            </div>
            <button onclick="joinDebate('${debate.id}', '${debate.topic}')" 
                    class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold">
                Join
            </button>
        </div>
    `;
    
    container.appendChild(debateElement);
}

// Update debate in list
function updateDebateInList(debate) {
    const element = document.getElementById(`debate-${debate.id}`);
    if (element) {
        // Update the counts
        const countsDiv = element.querySelector('.flex.gap-4');
        countsDiv.innerHTML = `
            <span><i class="fas fa-users mr-1"></i>
                ${(debate.sideA ? 1 : 0) + (debate.sideB ? 1 : 0)}/2 debaters
            </span>
            <span><i class="fas fa-eye mr-1"></i>${debate.spectators.length} spectators</span>
        `;
    }
}

// Remove debate from list
function removeDebateFromList(debateId) {
    const element = document.getElementById(`debate-${debateId}`);
    if (element) {
        element.remove();
    }
    
    // Show "no debates" message if list is empty
    const container = document.getElementById('activeDebates');
    if (container.children.length === 0) {
        container.innerHTML = '<div class="text-gray-400 text-center py-8 text-lg">No active debates. Create one to get started!</div>';
    }
}

// Load active debates (simulated)
function loadActiveDebates() {
    // In a real app, this would fetch from server
    // For demo, we'll start with no debates
}

// Join debate
function joinDebate(debateId, topic) {
    currentDebateId = debateId;
    
    document.getElementById('mainHub').classList.add('hidden');
    document.getElementById('debateRoom').classList.remove('hidden');
    document.getElementById('debateTopic').textContent = topic;
    
    // Subscribe to debate channel
    debateChannel = pusher.subscribe(`debate-${debateId}`);
    
    debateChannel.bind('user-joined-side', function(data) {
        updateDebateParticipants(data);
    });
    
    debateChannel.bind('user-left-side', function(data) {
        updateDebateParticipants(data);
    });
    
    debateChannel.bind('new-message', function(data) {
        addMessageToDebate(data);
    });
    
    debateChannel.bind('spectator-joined', function(data) {
        updateSpectators(data.spectators);
    });
    
    debateChannel.bind('spectator-left', function(data) {
        updateSpectators(data.spectators);
    });
    
    // Simulate initial state
    setTimeout(() => {
        updateSpectators([currentUser]);
        showNotification('Joined debate successfully!', 'success');
    }, 500);
}

// Join a side in the debate
function joinSide(side) {
    if (currentSide) {
        showNotification('You are already participating in this debate', 'warning');
        return;
    }
    
    currentSide = side;
    document.getElementById('joinButtons').classList.add('hidden');
    document.getElementById('messageInput').classList.remove('hidden');
    
    // Update the side display
    const sideElement = document.getElementById(`side${side}`);
    sideElement.textContent = currentUser;
    sideElement.className = `font-semibold ${side === 'A' ? 'text-blue-400' : 'text-red-400'}`;
    
    // Update status
    document.getElementById('debateStatus').textContent = `You joined Side ${side}. Start debating!`;
    
    // Remove from spectators
    updateSpectators([]);
    showNotification(`Joined Side ${side}! Start debating!`, 'success');
}

// Update debate participants
function updateDebateParticipants(data) {
    if (data.sideA) {
        document.getElementById('sideA').textContent = data.sideA;
        document.getElementById('sideA').className = 'font-semibold text-blue-400';
    }
    if (data.sideB) {
        document.getElementById('sideB').textContent = data.sideB;
        document.getElementById('sideB').className = 'font-semibold text-red-400';
    }
}

// Update spectators
function updateSpectators(spectators) {
    const container = document.getElementById('spectators');
    const count = document.getElementById('spectatorCount');
    
    count.textContent = spectators.length;
    container.innerHTML = spectators.map(user => 
        `<span class="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover-scale cursor-pointer transition-all duration-200">
            <i class="fas fa-eye mr-2"></i>${user}
        </span>`
    ).join('');
}

// Send message
function sendMessage() {
    const messageText = document.getElementById('messageText').value.trim();
    if (!messageText) return;
    
    const message = {
        user: currentUser,
        text: messageText,
        side: currentSide,
        timestamp: new Date().toLocaleTimeString()
    };
    
    addMessageToDebate(message);
    document.getElementById('messageText').value = '';
    
    // Add sending animation
    const sendButton = document.querySelector('#messageInput button');
    sendButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        sendButton.style.transform = 'scale(1)';
    }, 150);
}

// Add message to debate
function addMessageToDebate(message) {
    const container = document.getElementById('debateMessages');
    
    const messageElement = document.createElement('div');
    messageElement.className = `p-4 rounded-xl message-animation ${
        message.side === 'A' ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/30 border border-blue-500/20' : 
        message.side === 'B' ? 'bg-gradient-to-r from-red-900/40 to-red-800/30 border border-red-500/20' : 
        'bg-gradient-to-r from-gray-700/40 to-gray-600/30 border border-gray-500/20'
    }`;
    
    const sideColor = message.side === 'A' ? 'text-blue-400' : 
                     message.side === 'B' ? 'text-red-400' : 'text-yellow-400';
    
    messageElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <span class="font-bold ${sideColor} flex items-center">
                <i class="fas fa-${message.side === 'A' ? 'shield-alt' : message.side === 'B' ? 'sword' : 'eye'} mr-2"></i>
                ${message.user}
            </span>
            <span class="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">${message.timestamp}</span>
        </div>
        <div class="text-white leading-relaxed">${message.text}</div>
    `;
    
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
    
    // Update message count for activity tracking
    lastMessageCount = container.children.length;
}

// Leave debate
function leaveDebate() {
    if (debateChannel) {
        pusher.unsubscribe(`debate-${currentDebateId}`);
        debateChannel = null;
    }
    
    currentDebateId = '';
    currentSide = '';
    
    document.getElementById('debateRoom').classList.add('hidden');
    document.getElementById('mainHub').classList.remove('hidden');
    
    // Reset debate room
    document.getElementById('sideA').textContent = 'Empty';
    document.getElementById('sideA').className = 'text-gray-300';
    document.getElementById('sideB').textContent = 'Empty';
    document.getElementById('sideB').className = 'text-gray-300';
    document.getElementById('joinButtons').classList.remove('hidden');
    document.getElementById('messageInput').classList.add('hidden');
    document.getElementById('debateMessages').innerHTML = '';
    
    showNotification('Left debate', 'info');
}

// Handle Enter key press for inputs
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (e.target.id === 'usernameInput') {
            joinHub();
        } else if (e.target.id === 'debateTopicInput') {
            createDebate();
        } else if (e.target.id === 'messageText') {
            sendMessage();
        }
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debate Hub initialized');
    
    // Add some initial animations
    setTimeout(() => {
        const header = document.querySelector('header');
        header.style.transform = 'translateY(0)';
        header.style.opacity = '1';
    }, 100);
});