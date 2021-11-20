const EventEmitter = require('events');
const spawn = require('child_process').spawn;
const { Readable } = require('stream');
const fs = require('fs');

function pipePlaceholderToStream() {
    console.log("READY: ", placeholder_ready);
    // var binary = fs.readFileSync('rec_video.bin');
    var binary = fs.readFileSync('hello.txt');
    // process.stdout.write(binary);

    //  _parser.stdin.write(binary);
    //  _viewer.stdin.write(binary);

    testwstream.write(placeholder_buffer);
    //  _parser.stdin.write( placeholder_buffer);
    //  _viewer.stdin.write( placeholder_buffer);
    console.log('done piping placeholder');
}

var testwstream = fs.createWriteStream('rec_hello.txt');

var placeholder_buffer = '';
var placeholder_ready = false;

// ffmpeg -hide_banner -loglevel error -threads 2 -loop 1 -i wait_for_stream.png -r 40 -c:v h264_v4l2m2m -t 10 -pix_fmt yuv420p -f mpegts -codec:v h264 -s 2880x1800 -b:v 2000k -bf 0 - > hello.txt

// var _placeholder_gen = spawn("ffmpeg -hide_banner -loglevel error -threads 2 -loop 1 -i wait_for_stream.png -r 40 -c:v h264_v4l2m2m -t 10 -pix_fmt yuv420p -f mpegts -codec:v h264 -s 2880x1800 -b:v 2000k -bf 0 -")
var _placeholder_gen = spawn('ffmpeg', [
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
    "-s", "2880x1800",
    "-b:v", "2000k",
    "-bf", "0",
    "-"
])

_placeholder_gen.stdout.on('data', function(data) {
    //Here is where the output goes

    // console.log('stdout: ' + data);

    // data = data.toString();
    // scriptOutput += data;
    placeholder_buffer += data;
});

// _placeholder_gen.stdout.pipe(process.stdout);
// _placeholder_gen.stderr.pipe(process.stdout);


_placeholder_gen.on('close', () => {
    //Here you can get the exit code of the script

    console.log('done generating placeholder');

    placeholder_ready = true;
    pipePlaceholderToStream();
});