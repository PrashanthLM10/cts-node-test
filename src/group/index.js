const {WebSocketServer} = require('ws');

const getUniqueID= () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    
    return s4() + s4() + '-' + s4();
}

const setSocket = (server) => {
    const socket = new WebSocketServer({server: server});
    socket.on('connection', ws => {
        ws.socketID = getUniqueID();
        ws.send(JSON.stringify({type: 'setSocketID', socketID: ws.socketID}));
        socket.clients.forEach(client => client.send(JSON.stringify({type:'newClient', socketID: ws.socketID, time: Date.now()})));
    
        ws.on('message', data => {
            const parsedData = JSON.parse(data);
            socket.clients.forEach(client => {if (client.socketID !== ws.socketID) client.send(JSON.stringify({...parsedData, type: 'message'}))});
        });
    
        ws.onerror = (e) => {
            console.log('websocket error', e);
            ws.send(JSON.stringify({type: 'ws:error', error: e}));
        }
    
        ws.onclose = e => {
            ws.send(JSON.stringify({type: 'ws:close', code: e.code, reason: e.reason}));
            console.log('close');
        }
    });
}


module.exports = {
    setSocket
}
