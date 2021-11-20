function httpPostAsync(theUrl, data, callback) {
    var xmlHttp = new XMLHttpRequest(); // new HttpRequest instance
    xmlHttp.open('POST', theUrl, true);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback();
    }
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlHttp.send(data);
}

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
            callback(xmlHttp.responseText, (xmlHttp.status == 200));
        }
    }
    xmlHttp.open('GET', theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

class CarPlay_Renderer {
    constructor() {
        this.state = {
            height: 0,
            width: 0,
            mouseDown: false,
            lastX: 0,
            lastY: 0,
            status: false
        };

        this.height = 0;
        this.width = 0;

        this.canvas = document.getElementById('video-canvas');
        this.message_box = document.getElementById('msg-box');
        this.dev_info = document.getElementById('dev-info');
        this.url = 'ws://' + document.location.hostname + ':8082/';

        this.player = new JSMpeg.Player(this.url, {
            canvas: this.canvas
        });

        this.getSize();
        this.setCanvasSize();
        this.setupEventListeners();
        this.setuptPeriodicUpdater();
    }

    setuptPeriodicUpdater() {
        this.intervalUpdater = setInterval(
            () => {
                this.checkStatus();
            },
            500); // update every X ms
    }

    checkStatus() {
        console.log("Checking status");
        httpGetAsync("status/conn_status", (req, status) => {
            if (req == "true") {
                console.log("CarPlay active");
                this.canvas.hidden = false;
                this.message_box.hidden = true;
                this.dev_info.hidden = true;
            } else {
                console.log("CarPlay inactive");
                this.canvas.hidden = true;
                this.message_box.hidden = false;
                this.dev_info.hidden = false;
                this.getSize();
            }
        })
    }

    getSize() {
        this.state.height = window.innerHeight;
        this.state.width = window.innerWidth;

        this.dev_info.innerHTML = "Screen: X:" + this.state.width + "px Y:" + this.state.height + "px";
    }

    setCanvasSize() {
        this.canvas.setAttribute("style", this.canvas.getAttribute("style") + " height:" + this.state.height + "px; " +
            "width:" + this.state.width + "px;");
    }

    send_event(data) {
        var encoded = "type=" + data.type + "&x=" + data.x + "&y=" + data.y;
        httpPostAsync('event', encoded, (result, success) => {
            console.log(result);
        });
    }

    on_ActionStart(e) {
        console.log("user action START");
        // console.log(Object.prototype.toString.call(e) == "[object TouchEvent]");
        console.log(e, e.target.getBoundingClientRect());
        let currentTargetRect = e.target.getBoundingClientRect();
        let x, y = 0;
        if (Object.prototype.toString.call(e) == "[object TouchEvent]") {
            x = e.pageX;
            y = e.pageY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        x = (x - currentTargetRect.left) / this.state.width;
        y = (y - currentTargetRect.top) / this.state.height;
        this.state.lastX = x;
        this.state.lastY = y;
        this.state.mouseDown = true;
        var data = { type: 14, x: x, y: y };
        this.send_event(data);
    }
    on_ActionDone(e) {
        console.log("user action END");
        // console.log(e, e.target.getBoundingClientRect());
        let currentTargetRect = e.target.getBoundingClientRect();
        let x, y = 0;
        if (Object.prototype.toString.call(e) == "[object TouchEvent]") {
            x = e.pageX;
            y = e.pageY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        x = (x - currentTargetRect.left) / this.state.width;
        y = (y - currentTargetRect.top) / this.state.height;
        this.state.mouseDown = false;
        var data = { type: 16, x: x, y: y };
        this.send_event(data);
    }

    on_ActionMove(e) {
        if (this.state.mouseDown) {
            console.log("user action MOVE");
            // console.log(e, e.target.getBoundingClientRect());
            let currentTargetRect = e.target.getBoundingClientRect();
            let x, y = 0;
            if (Object.prototype.toString.call(e) == "[object TouchEvent]") {
                x = e.pageX;
                y = e.pageY;
            } else {
                x = e.clientX;
                y = e.clientY;
            }
            x = (x - currentTargetRect.left) / this.state.width;
            y = (y - currentTargetRect.top) / this.state.height;
            var data = { type: 15, x: x, y: y };
            this.send_event(data);
        }
    }

    setupEventListeners() {
        if (isTouchDevice()) {
            console.log("TOUCH listeners");
            this.canvas.addEventListener('touchstart',
                (e) => {
                    console.log("touchstart");
                    this.on_ActionStart(e);
                }
            );
            this.canvas.addEventListener('touchmove',
                (e) => {
                    console.log("touchmove");
                    this.on_ActionMove(e);
                }
            );
            this.canvas.addEventListener('touchend',
                (e) => {
                    console.log("touchend");
                    this.on_ActionDone(e);
                }
            );
        } else {
            console.log("MOUSE listeners");
            this.canvas.addEventListener('mousedown',
                (e) => {
                    console.log("mousedown");
                    this.on_ActionStart(e);
                }
            );
            this.canvas.addEventListener('mouseup',
                (e) => {
                    console.log("mouseup");
                    this.on_ActionDone(e);
                }
            );
            this.canvas.addEventListener('mousemove',
                (e) => {
                    console.log("mousemove");
                    this.on_ActionMove(e);
                }
            );
        }
    }
};

function init() {
    var instance = new CarPlay_Renderer();
}