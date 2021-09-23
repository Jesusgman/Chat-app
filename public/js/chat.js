const socket = io() //io returns the events the server sends, it also allows the client to send new events

//User $ when we are storing elements
const $chatForm = document.querySelector('#chat-form');
const $chatFormInput = $chatForm.querySelector('#chat-message');
const $chatFormBtn = $chatForm.querySelector('#chat-submit-button');
const $messages = document.getElementById('messages');

//templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    //New message
    const $newMessage = $messages.lastElementChild;

    const newMsgStyles = getComputedStyle($newMessage);
    const newMsgMargin = parseInt(newMsgStyles.marginBottom);
    const newMsgHeight = $newMessage.offsetHeight + newMsgMargin;

    const visibleHeight = $messages.offsetHeight; //Height available without scrolling
    const contentHeight = $messages.scrollHeight; //The height of all messages

    //How far have we scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;


    if(contentHeight - newMsgHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

$chatForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    //const messageInput = e.target.elements.chat_message;
    $chatFormBtn.disabled = true;
    //elements allows tot arget all inputs within the form
    const message = $chatFormInput.value;

    socket.emit('sendMessage', message, (ackmsg)=>{ //The last function is used for acknowledgment
        console.log(`The message was delivered, ${ackmsg}`)
        $chatFormInput.value = "";
        $chatFormBtn.disabled = false;
        $chatFormInput.focus();
    });
});

socket.on('message',(message)=>{ //It's important the name matches the on and emit calls
    const html = Mustache.render(messageTemplate,{
        message: message.data,
        createdAt: moment(message.createdAt).format("hh:mm a"),
        username: message.user
    });
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll();
});

socket.on('locationMessage',(location)=>{ //It's important the name matches the on and emit calls
    const html = Mustache.render(locationTemplate,{
        location: location.data,
        createdAt: moment(location.createdAt).format('hh:mm a'),
        username: location.user
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
});

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.getElementById('sidebar').innerHTML = html;
});

const shareLocation = (btn)=>{
    if(!navigator.geolocation){
        return alert('Your browser doesn\'t support Geolocation :(')
    }
    const waitMessage = document.getElementById('wait-message');
    btn.disabled = true;
    waitMessage.style.display = "block";
    navigator.geolocation.getCurrentPosition((position)=>{
        const {latitude, longitude} = position.coords;
        socket.emit('sendLocation',{
            latitude,
            longitude
        },(ackmsg)=>{
            console.log(`Message delivered correctly to server: ${ackmsg}`);
            btn.disabled = false;
            waitMessage.style.display = "none";
        });
    });
}

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href ="/"
    }
})