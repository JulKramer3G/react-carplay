'use strict';

const webserver = function(callback_event, callback_status) {
    var express = require('express'),
        path = require('path'),
        bodyParser = require('body-parser');

    // Constants
    const PORT = 80;
    const HOST = '0.0.0.0';

    // App
    const app = express();

    // primary link / homepage
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '/../website/index.html'));
    });

    app.use(bodyParser.urlencoded({ extended: true }));

    // database access (write)
    app.post('/event', (req, res) => {
        res.sendStatus(200);
        callback_event(req.body);
    });

    // database access (write)
    app.get('/status/*', (req, res) => {
        var id = req.url.substring('/status/'.length);
        res.status(200).send(callback_status(id));
    });

    // all resources that should be "gettable"
    app.use(express.static(__dirname + "/../website"));

    app.listen(PORT, HOST);
    console.log(`Webserver running on http://${HOST}:${PORT}`);
}

exports.webserver = webserver;