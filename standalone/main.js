const Carplay = require('local-node-carplay');

const config = {
    dpi: 240,
    nightMode: 1,
    hand: 1,
    boxName: 'nodePlay',
    width: 2880,
    height: 1800,
    fps: 30,
}

console.log("spawning carplay", config)
const carplay = new Carplay(config)

carplay.on('status', (data) => {
    if (data.status) {
        console.log('plugged');
        // mainWindow.webContents.send('plugged')
    } else {
        console.log('unplugged');
        // mainWindow.webContents.send('unplugged')
    }
    console.log("data received", data)
})