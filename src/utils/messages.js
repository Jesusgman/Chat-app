const generateMessage = (data, user)=>{
    return {
        data,
        user,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage
}