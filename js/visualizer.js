const ID3 = window.jsmediatags

function getRMS(arr) {
    var square = 0;
    var mean = 0;
    var rms = 0;
    var n = arr.length
 
    // Calculate square.
    for (var i = 0; i < n; i++) {
        square += Math.pow(arr[i], 2);
    }
 
    // Calculate Mean.
    mean = (square /  (n));
    // Calculate Root.
    rms =  Math.sqrt(mean);
    return rms;
}
function calcRMSColor(rms) {
    let intermed = rms/100
    let ret = intermed*150
    return ret
}
window.addEventListener('load',function() {
    var file = document.getElementById("thefile");
    var filetitle = document.getElementById("file-label")
    const z = 0
    var container = document.getElementById('media-container')
    container.innerHTML = `
    <canvas id="canvas"></canvas>
    <div id="main">
        <div id="album">
            <div id="MediaPlayerControls">
                <div id="MediaPlayerIcon-icon-play" class="MediaPlayerIcon icon-play" data-mediathumb-url="src"></div>
                <div id="sound_options" class="MediaPlayerIcon icon-volume">
                <input id="volume" class="MediaPlayerControl-volume" type="range" max="100" min="0">
            </div>
            <input id="MediaPlayerControl-seekbar" type="range" name="rng" min="0" value="0">
            <div id="time-position"></div>
        </div>
    </div>
    `
    var audio = new Audio();
    console.log(audio)
    var dur = document.getElementById('MediaPlayerControl-seekbar');
    var album = document.getElementById('album')
    var dataimage = document.getElementById("MediaPlayerIcon-icon-play");
    var button = document.getElementById("MediaPlayerIcon-icon-play");
    var position = document.getElementById("time-position");
    var setting = document.getElementById("sound_options");
    var vol = document.getElementById("volume");
    file.onchange = function() {
        var files = this.files;
        var colorValue = "#ff0000";
        dataimage.setAttribute("data-mediathumb-url", URL.createObjectURL(files[0]));
        var SRC=dataimage.getAttribute("data-mediathumb-url");
        audio.src = SRC;
        audio.load();
        if (filetitle.textContent != 'Unknown Artist - '+files[0].name) {
            filetitle.textContent = 'Unknown Artist - '+files[0].name
        };
        if (album.style.backgroundImage != "url(../../images/default/default-album-image.png)") {
            album.style.backgroundImage = "url(../../images/default/default-album-image.png)";
        }
        ID3.read(files[0],{
            onSuccess: function(tag){
                console.log(tag);
                const data = tag.tags.picture.data;
                const format = tag.tags.picture.format;
                const title = tag.tags.title;
                const artist = tag.tags.artist;
                if (data && format != null) {
                    let str = "";
                    for (var o=0;o<data.length;o++) {
                        str+=String.fromCharCode(data[o]);
                    };
                    album.style.backgroundImage = "url(data:"+format+";base64,"+window.btoa(str)+")";
                };
                if (title != "" && artist != "") {
                    filetitle.textContent = artist+' - '+title
                };
            },
            onError: function(error){
                console.log(error);
            },
        });
        audio.play()
        var context = new AudioContext();
        console.log(context);
        var src = context.createMediaElementSource(audio);
        var analyser = context.createAnalyser();
        var loud = 0
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        src.connect(analyser);
        var gn = context.createGain();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        analyser.connect(gn);
        gn.connect(context.destination);
        var fft_Size = 512;
        
        analyser.fftSize = fft_Size;
        analyser.maxDecibels = -3;
        analyser.minDecibels = -120;
                        
        var bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);
        console.log(analyser)
                        
        var dataArray = new Uint8Array(bufferLength);
        var dataArray1 = new Uint8Array(fft_Size);
                    
        var maxHeight = canvas.height/2;
        var WIDTH = canvas.width;
        var HEIGHT = canvas.height;
                        
        var barWidth = (WIDTH / bufferLength);
        var barHeight;
        
                        
        function renderFrame() {
            requestAnimationFrame(renderFrame);
                        
            // x2 = 0;
                        
            analyser.getByteFrequencyData(dataArray);
            analyser.getByteTimeDomainData(dataArray1);
            
            var curtime = formatTime(audio.currentTime);
            var time = formatTime(audio.duration);
            position.innerHTML = curtime+" / "+time
            loud = getRMS(dataArray);
            ctx.clearRect(0,0,WIDTH,HEIGHT)
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            let rad = (loud/7);
            gn.gain.setValueAtTime(vol.value/100, audio.currentTime);
            /*
            ctx.lineWidth = barWidth;
            let angle_step = (Math.PI * 2)/bufferLength
            for (var i=0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                                
                var r = barHeight + (25 * (i/bufferLength));
                var g = 250 * (i/bufferLength);
                var b = 50;
                var angle = angle_step * i;
                
                var y = centerY + rad * Math.sin(angle);
                var x = centerX + rad * Math.cos(angle);
                
                
                var y1 = centerY + rad * (barHeight/50) * Math.sin(angle);
                var x1 = centerX + rad * (barHeight/50) * Math.cos(angle);
                
                var rgb = "rgb(" + r + "," + g + "," + b + ")";
                
                ctx.beginPath();
                ctx.moveTo(x,y);
                ctx.strokeStyle = rgb;
                ctx.lineTo(x1,y1);
                ctx.stroke();
            }
            */
            for (var i = 0; i < bufferLength; i++) {
               barHeight = dataArray[i];
               ctx.save()
               ctx.translate(centerX, centerY)
               ctx.rotate(90+i*((Math.PI*2)/bufferLength))

               var r = barHeight + (25 * (i/bufferLength));
               var g = 250 * (i/bufferLength);
               var b = 50;

               ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
               ctx.fillRect(0,0+rad, barWidth, barHeight/3.5)
               ctx.fillStyle = "rgb(255,255,255)";
               ctx.fillRect(0,0+rad+barHeight/3.5, barWidth, 1)
               ctx.restore()
            }
            ctx.beginPath();
            ctx.arc(centerX, centerY,rad, 0, Math.PI * 2, false);
            ctx.fillStyle = 'rgb('+calcRMSColor(loud)+', '+calcRMSColor(loud)+',0)';
            ctx.fill();
            ctx.closePath();
        }
        renderFrame();
        audio.play();
        dur.addEventListener("change", function() {
            audio.currentTime = dur.value
        })
        setting.addEventListener("click", function() {
            if (vol.hidden == true) {
                vol.hidden = false
            }else{
                vol.hidden = true
            }
        })
        audio.addEventListener("timeupdate", function() {
            dur.value=audio.currentTime; 
            dur.max = audio.duration;
        });
        button.addEventListener("click", function() {
            if(this.className == 'MediaPlayerIcon icon-pause'){
                this.className = "MediaPlayerIcon icon-play";
                audio.pause();
            }else{
                this.className = "MediaPlayerIcon icon-pause";
                audio.play();
            };
            audio.addEventListener("ended", function() {
                button.className = "MediaPlayerIcon icon-play";
                dur.value = dur.max;
            });
        });
        audio.addEventListener("pause", function() {
            button.className = "MediaPlayerIcon icon-play";
        });
        audio.addEventListener("play", function() {
            button.className = "MediaPlayerIcon icon-pause";
        });
    };
    function formatTime(val) {
        var min = Math.floor((val/60));
        var sec = Math.floor(val - (min * 60));
        if (sec < 10) {sec = '0'+sec};
        return min+':'+sec;
    };
});
