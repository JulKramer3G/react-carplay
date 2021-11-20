const Carplay = require('./carplay_modules/Carplay')

const websocket_server = require('./websocket_server/websocket_server')
websocket_server.websocket_server()

const webserver = require('./webserver/webserver')
webserver.webserver(onUserEvent, onStatusRequested)

//ipad mini: 980 / 716
//ipad pro: 2732 / 2000
//macbook pro 15": 2880 / 1800
const config = {
    dpi: 150,
    nightMode: 1,
    hand: 1,
    boxName: 'nodePlay',
    width: 980,
    height: 716,
    fps: 15,
}

var device_connected = false;

console.log("spawning carplay", config)
const carplay = new Carplay(config)

function onUserEvent(data) {
    // data.type contains information about click, drag, release, etc.
    carplay.sendTouch(data.type, data.x, data.y);
    console.log("User action", data.type, data.x, data.y);
}

function onStatusRequested(id) {
    if (id == "conn_status") {
        return device_connected;
    }
}

carplay.on('status', (data) => {
    if (data.status) {
        console.log('plugged');
        device_connected = true;
    } else {
        console.log('unplugged');
        device_connected = false;
    }
    console.log("data received", data)
})