var App2 = {

    BLUR: 3,
    THRESHOLD: 40,
    GREEN_COLOR: {
      red     : 17,
      green   : 170,
      blue    : 154
    },
  
    rows: 480 / 80,
    cols: 640 / 80,
    win: $(window),
  
    aspectRatio: 640 / 480,
    colors: [],
    sounds: [],
    soundFiles: [
      "ZeekSound-0",
      "ZeekSound-1",
      "ZeekSound-2",
      "ZeekSound-3",
      "ZeekSound-4",
      "ZeekSound-5",
      "ZeekSound-6",
      "ZeekSound-7",
      "ZeekSound-8",
      "ZeekSound-9",
      "ZeekSound-10",
      "ZeekSound-11",
      "ZeekSound-12",
      "ZeekSound-13",
      "ZeekSound-14",
      "ZeekSound-15",
      "ZeekSound-16"
    ],
  
    init: function() {

        var i = -1;
        // initialize colors and sounds
        for (var y = 0; y < this.rows; ++y) {
          this.colors[y] = [];
          this.sounds[y] = [];
          for (var x = 0; x < this.cols; ++x) {
            this.colors[y][x] = "#"+((1<<24)*Math.random()|0).toString(16);
            this.sounds[y][x] = this.addSound(this.soundFiles[++i]);
            if (i >= this.soundFiles.length-1) i = -1;
          }
        }
  
    /*
        v1 = new VideoSquarer2('monitor', 'canvas-A', 'canvas-B',"");

        // TODO brAzzi64 - this enables us to pass object functions as callbacks, so that the 'this' attr gets properly set.
        // find a way to do this differently so we don't depend on Underscore.
        _.bindAll(v1, 
          'gotStream', 
          'streamError',
          'animLoop',
          'render'
        );
    */

    },

    addSound: function(fileName) {

        var audio = document.createElement('audio');
        audio.setAttribute("src", "audio/" + fileName + ".mp3");
        audio.setAttribute("src", "http://flashmonkey.co.uk/lab/webrtc-synth/audio/" + fileName + ".mp3");
        return audio;
   }
}


var VideoSquarer2 = function(monitor_id, canvasA_id, canvasB_id, video_src) {

    this.loading = true;
    this.cell = {
      width: 0,
      height: 0,
      pixels: 0,
      drawWidth: 0,
      drawHeight: 0
    }

    this.video = document.getElementById(monitor_id);
    this.canvasA = document.getElementById(canvasA_id);
    this.canvasB = document.getElementById(canvasB_id);

    this.canvasA.width = 640 * 0.3;
    this.canvasA.height = 480 * 0.3;

    this.contextA = this.canvasA.getContext('2d');
    this.contextA.translate(this.canvasA.width, 0);
    this.contextA.scale(-1, 1);

    this.contextB = this.canvasB.getContext('2d');

    // resize only one time
    this.canvasB.height = 240; //App2.win.height();
    this.canvasB.width = 320; //App2.win.height() * App2.aspectRatio;
    this.contextB.translate(this.canvasB.width, 0);
    this.contextB.scale(-1, 1);
    this.scale = this.canvasB.height / this.canvasA.height;
    $(this.canvasA).css({
      'left': (App2.win.width() - this.canvasB.width) * 0.5
    });

    this.cell.width = Math.floor(this.canvasA.width / App2.cols);
    this.cell.height = Math.floor(this.canvasA.height / App2.rows);
    this.cell.pixels = this.cell.width * this.cell.height;
    this.cell.drawWidth = this.canvasA.width / App2.cols;
    this.cell.drawHeight = this.canvasA.height / App2.rows;

    this.audioTagSupport = true;

    //this.video.src = video_src;
        //console.log('video_src');
        //console.log(video_src);


    var that = this;
    that.runStream(video_src);

}

VideoSquarer2.prototype.runStream = function(video_src) {

    this.video.src = video_src;
    console.log('gotStream');
    $('#allow-it').hide();
    //this.render2();
    this.animLoop();

}


/*
VideoSquarer.prototype.gotStream = function(stream) {

    this.video.src = webkitURL.createObjectURL(stream);
    this.video.onerror = function() {
      stream.stop();
      this.streamError();
    };
    console.log('gotStream');
    $('#allow-it').hide();
    this.animLoop();
}

VideoSquarer.prototype.streamError = function() {  

    console.log('streamError');
    window.cancelAnimationFrame(this.myReq);
}
*/


VideoSquarer2.prototype.animLoop = function() {

    //console.log("this in animLoop");
    //console.log(this);

    this.render();
    var self = this;
    var closure = function() { self.animLoop(); };
    this.myReq = window.requestAnimationFrame(closure, this);
}

VideoSquarer2.prototype.render = function() {

    var width = this.canvasA.width;
    var height = this.canvasA.height;

    this.contextA.drawImage(this.video, 0, 0, width, height);
    this.contextB.drawImage(this.video, 0, 0, this.canvasB.width, this.canvasB.height);

    var imageData = this.contextA.getImageData(0, 0, width, height);
    var imageDataBlur = this.contextA.getImageData(0, 0, width, height);

    addBlur(imageDataBlur, App2.BLUR);

    if (this.loading) {
      this.loading = _.max(imageDataBlur.data) === 0;
      return;
    }

    if (this.bgImage === undefined) {
      this.bgImage = imageDataBlur;
      return;
    }

    var pixel = {
      red     : 0,
      green   : 0,
      blue    : 0,
      x       : 1,
      y       : 1
    };

    var bg = {
      red     : 0,
      green   : 0,
      blue    : 0
    };

    grid = [];

    for (var y = 0; y < App2.rows; ++y) {
      grid[y] = [];
      for (var x = 0; x < App2.cols; ++x) {
        grid[y][x] = 0;
      }
    }

    var activityCount = 0;
    var pixelData = imageData.data;
    var pixelDataLength = pixelData.length;

    var bgData = this.bgImage.data;

    var pixelDataBlurred = imageDataBlur.data;

    var xp, yp;

    var pixelComponent;
    for (var i = 0; i < pixelDataLength; i++) {
      pixelComponent = i % 4;

      switch (pixelComponent) {
        case 0:
          pixel.red = pixelDataBlurred[i];
          bg.red = bgData[i];
          break;

        case 1:
          pixel.green = pixelDataBlurred[i];
          bg.green = bgData[i];
          break;

        case 2:
          pixel.blue = pixelDataBlurred[i];
          bg.blue = bgData[i];
          break;

        case 3:
          
          var diff = Math.abs((pixel.red + pixel.green + pixel.blue) - (bg.red + bg.green + bg.blue));

          if (diff < App2.THRESHOLD) {
            this.merge(bgData, i - 3, bg, pixel, 0.7);
          }
          else {
            this.paintPixel(pixelData, i - 3, App2.GREEN_COLOR);
            ++activityCount;

            this.merge(bgData, i - 3, bg, pixel, 0.3);

            yp = Math.floor((pixel.y / (height + 1)) * grid.length);
            xp = Math.floor((pixel.x / (width + 1)) * grid[yp].length);

            ++grid[yp][xp];
          }

          // update pixel position
          ++pixel.x;
          if(pixel.x > width) {
            pixel.x = 1;
            ++pixel.y;
          }

          break;
      }
    }

    imageData.data = pixelData;
    this.bgImage.data = bgData;

    this.contextA.putImageData(imageData, 0, 0);

    for(var y = 0; y < grid.length; ++y) {
      for(var x = 0; x < grid[y].length; ++x) {
        var percent = grid[y][x] / this.cell.pixels;


        //hack
        percent=0.5;

        this.colorBox((grid[y].length - x) * this.cell.drawWidth, y * this.cell.drawHeight, App2.colors[y][x], percent);
        this.playSound(App2.sounds[y][x], percent);
      }
    }

    this.contextA.globalAlpha = 1;
    this.contextB.globalAlpha = 1;
}




VideoSquarer2.prototype.colorBox = function(x, y, color, opacity) {

    this.contextB.fillStyle = "#000000";
    this.contextB.globalAlpha = 0.5 - opacity;
    this.contextB.fillRect(x * this.scale, y * this.scale, (-this.cell.drawWidth * this.scale) - 1, (this.cell.drawHeight * this.scale) + 1);

    this.contextB.fillStyle = color;
    this.contextB.globalAlpha = opacity * 0.8;
    this.contextB.fillRect(x * this.scale, y * this.scale, (-this.cell.drawWidth * this.scale) - 1, (this.cell.drawHeight * this.scale) + 1);
}

VideoSquarer2.prototype.playSound = function(sound, volume) {

    if(sound && volume > 0.2 && (sound.currentTime == 0 || sound.currentTime == sound.duration)) {
      sound.volume = Math.min(1, Math.max(0, volume));
      sound.play();
    }
}

VideoSquarer2.prototype.merge = function(pixelData, redComponentIndex, from, to, easing) {

    pixelData[redComponentIndex] += (to.red - from.red) * easing;
    pixelData[redComponentIndex + 1] += (to.green - from.green) * easing;
    pixelData[redComponentIndex + 2] += (to.blue - from.blue) * easing;
}

VideoSquarer2.prototype.paintPixel = function(pixelData, redComponentIndex, paintColor) {

    pixelData[redComponentIndex] = paintColor.red;
    pixelData[redComponentIndex + 1] = paintColor.green;
    pixelData[redComponentIndex + 2] = paintColor.blue;
}

