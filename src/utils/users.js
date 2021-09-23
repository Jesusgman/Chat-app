const users = []

const addUser = ({id, username, room})=> {
    //Clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    if(!username || !room){
        return {
            error: 'Username and room are required fields'
        }
    }

    const existingUsr = users.find((user)=>{
        return user.room === room && user.username === username;
    });

    if(existingUsr){
        return {
            error: 'Username is already in use'
        }
    }

    const user = {id, username, room}
    users.push(user);
    return { user }
}

const removeUser = (id)=>{
    const index = users.findIndex((user)=>user.id === id);

    if(index!==-1){
        return users.splice(index,1)[0]
    }
}

const getUser = (id) =>{
    return users.find((user)=>user.id===id);
}

const getUsersInRoom = (room) =>{
    return users.filter((user)=>user.room===room) //No sanitization since it comes from the server
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
