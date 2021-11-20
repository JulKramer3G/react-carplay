'use strict';

const express = require('express');
const path = require('path');

// Constants
const PORT = 3900;
const HOST = '0.0.0.0';

// App
const app = express();

// primary link / homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/../website/index.html'));
});

// all resources that should be "gettable"
app.use(express.static(__dirname + "/../website"));

app.use(express.static(__dirname + "/../live"));

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);