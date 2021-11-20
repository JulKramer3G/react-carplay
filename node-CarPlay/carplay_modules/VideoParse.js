const EventEmitter = require('events');
const spawn = require('child_process').spawn;
const { Readable } = require('stream');
const fs = require('fs');

var record_video = false;

var show_local_viewer = false;

class VideoParse extends EventEmitter {
    constructor(width, height, bitrate, ws, updateState, fps) {
        super();

        this._parser = spawn('ffmpeg', [
            "-hide_banner",
            "-loglevel", "error",
            "-threads", "2",
            "-r", (fps + 5).toString(),
            "-i", "-",
            "-c:v", "h264_v4l2m2m",
            "-tune", "zerolatency",
            "-pix_fmt", "yuv420p",
            "-f", "mpegts",
            "-codec:v", "mpeg1video",
            "-s", `${width}x${height}`,
            "-b:v", bitrate.toString() + "k",
            "-bf", "0",
            ws
        ])

        if (show_local_viewer) {
            this._viewer = spawn('ffplay', [
                "-loglevel", "error",
                "-threads", "2",
                "-f", "h264",
                "-framerate", (fps + 5).toString(),
                "-tune", "zerolatency",
                "-"
            ])

            this._viewer.stderr.on('data', ((data) => {
                console.log(data.toString())
            }))

            this._viewer.stdout.on('data', ((data) => {
                console.log(data.toString())
            }))

            this._viewer.stdout.pipe(process.stdout)
        }

        // this._viewer = spawn('mpv', [
        //     "--hwdec=rpi",
        //     "--demuxer-rawvideo-fps=40",
        //     "--fps=" + (fps + 5).toString(),
        //     "-",
        //     "--framedrop=no"
        // ])

        if (record_video == true) {
            this.wstream = fs.createWriteStream('rec_video.bin');
        }

        this._parser.stderr.on('data', ((data) => {
            console.log(data.toString())
        }))

        this._parser.stdout.on('data', ((data) => {
            console.log(data.toString())
        }))

        this._parser.stdout.pipe(process.stdout)

        this._readable = new Readable(1024);
        this._readable._read = () => {
            this._readable.pipe(this._parser.stdin)
        }
        this.updateState = updateState;
        this._bytesToRead = 0;
        this._bytesRead = [];
        this._bytesSize = 0;

        this.testwstream = fs.createWriteStream('rec_hello.txt');

        this.placeholder_buffer = '';
        this.placeholder_ready = false;

        this._placeholder_gen = spawn('ffmpeg', [
            "-hide_banner",
            "-loglevel", "error",
            "-threads", "2",
            "-loop", "1",
            "-i", "wait_for_stream.png",
            "-r", "40",
            "-c:v", "h264_v4l2m2m",
            "-t", "10",
            "-pix_fmt", "yuv420p",
            "-f", "mpegts",
            "-codec:v", "h264",
            "-s", `${width}x${height}`,
            "-b:v", bitrate.toString() + "k",
            "-bf", "0",
            "-",
        ])

        this._placeholder_gen.stdout.on('data', (data) => {
            //Here is where the output goes

            // console.log('stdout: ' + data);

            // data = data.toString();
            // scriptOutput += data;
            this.placeholder_buffer += data;
            // console.log('stdout: ' + this.placeholder_buffer);
        });

        this._placeholder_gen.on('close', () => {
            //Here you can get the exit code of the script

            console.log('done generating placeholder');
            // console.log('stdout: ' + this.placeholder_buffer);
            this.placeholder_ready = true;
            this.pipePlaceholderToStream();
        });

        this.initVideo();
    }

    setActive = (bytesToRead) => {
        this._bytesToRead = bytesToRead;
        this.updateState(6)
    }

    addBytes = (bytes) => {
        this._bytesRead.push(bytes)
        this._bytesSize += Buffer.byteLength(bytes)
        if (this._bytesSize === this._bytesToRead) {
            this.pipeData()
        }
    }

    pipePlaceholderToStream() {
        console.log("READY: ", this.placeholder_ready);
        // this._parser.stdin.write(this.placeholder_buffer);
        // this._viewer.stdin.write(this.placeholder_buffer);
        console.log('done piping placeholder');
    }

    initVideo() {
        console.log("Init video");

        var binary = fs.readFileSync('rec_video.bin');
        // process.stdout.write(binary);

        if (show_local_viewer) {
            this._viewer.stdin.write(binary);
        }
        this._parser.stdin.write(binary);
    }

    pipeData = () => {
        let fullData = Buffer.concat(this._bytesRead)
        let outputData = fullData.slice(20, this._bytesToRead)

        // console.log("Video active");
        if (show_local_viewer) {
            if (this._viewer.stdin.writable) {
                this._viewer.stdin.write(outputData);
            } else {
                this.emit('warning', 'Viewer: Video Stream Full')
            }
        }

        if (this._parser.stdin.writable) {
            this._parser.stdin.write(outputData)
        } else {
            this.emit('warning', 'Converter: Video Stream Full')
        }

        if (record_video == true) {
            this.wstream.write(outputData);
        }

        // console.log("Video data", outputData);

        this._bytesToRead = 0;
        this._bytesRead = [];
        this._bytesSize = 0;
        this.updateState(0);
    }
}

module.exports = VideoParse;