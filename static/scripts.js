const socket = io();

const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('chat-container');
const footer = document.querySelector("footer");
const notificationPop = new Audio("./pop.mp3");

const sendBtn = document.getElementById('sendbtn');
let isGameFinished = false;

sendBtn.addEventListener('click', function() {
    if (isGameFinished) {
        location.reload();
    } else {
        sendMessage();
    }
});
  
document.getElementById('message-input').addEventListener('keypress', function(e) {
    socket.emit("typing");
    if (e.key === 'Enter') {
        sendMessage();
    }
});

footer.style.position = "fixed";
messageContainer.style.marginBottom = footer.clientHeight + "px";

function sendMessage() {
    const message = messageInput.value.trim();
    if (message !== '') {
        messageInput.disabled =  true;
        socket.emit('chat message', message);
        displayMessage('sent', message);
        messageInput.value = '';
        showLoader();
    }
}

showLoader();

socket.on('finish', () => {
    socket.disconnect();
    hideLoader();
    isGameFinished = true;
    messageInput.disabled =  true;
    messageInput.placeholder = "";
    sendBtn.innerText = "Restart";
    displayMessage('action', "GRAQE managed to escape. The end.");
});


socket.on('typing', () => {
    showLoader();
});

socket.on('ready', () => {
    hideLoader();
    messageInput.disabled =  false;
    messageInput.focus();
})

socket.on('chat message', ([type, msg]) => {
    displayMessage(type === "action" ? "action" : 'received', msg);
    notificationPop.play();
});


function createLoader() {
    const loader = document.createElement('img');
    loader.src = "./492.gif";
    loader.width = 20;
    return loader;
}

function showLoader() {
    const messageElement = document.createElement('div');
    messageElement.classList.add('loader', 'message', 'received');
    messageElement.appendChild(createLoader());
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    return messageElement;
}
  
function hideLoader() {
    messageInput.disabled =  false;
    const loader = document.querySelector(".loader");
    if (loader) {
        loader.outerHTML = "";
    }
}

function displayMessage(type, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = text;
    messageContainer.appendChild(messageElement);

    const loader = document.querySelector(".loader");
    if (loader) {
        messageContainer.appendChild(loader);
    }
    
    messageContainer.scrollTop = messageContainer.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
}