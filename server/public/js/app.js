var App = {

  BLUR: 3,
  THRESHOLD: 40,
  GREEN_COLOR: {
    red     : 17,
    green   : 170,
    blue    : 154
  },

  loading: true,
  rows: 480 / 80,
  cols: 640 / 80,
  cell: {
    width: 0,
    height: 0,
    pixels: 0,
    drawWidth: 0,
    drawHeight: 0
  },
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

    _.bindAll(this, 
      'gotStream', 
      'noStream',
      'streamError',
      'animLoop',
      'render',
      'resize'
    );

    this.video = document.getElementById('monitor');
    this.canvas = document.getElementById('canvas');
    this.output = document.getElementById('output');

    this.canvas.width = 640 * 0.3;
    this.canvas.height = 480 * 0.3;
    this.context = canvas.getContext('2d');
    this.context.translate(canvas.width, 0);
    this.context.scale(-1, 1);

    console.log(480 / 640);


    this.outputContext = this.output.getContext('2d');


    this.win.on('resize', _.throttle(this.resize, 50));



    this.resize();



    this.cell.width = Math.floor(canvas.width / this.cols);
    this.cell.height = Math.floor(canvas.height / this.rows);
    this.cell.pixels = this.cell.width * this.cell.height;

    this.cell.drawWidth = canvas.width / this.cols;
    this.cell.drawHeight = canvas.height / this.rows;

    this.audioTagSupport = true;

    var i = -1;
    for(var y = 0; y < this.rows; ++y) {
      this.colors[y] = [];
      this.sounds[y] = [];
      for(var x = 0; x < this.cols; ++x) {
        this.colors[y][x] = "#"+((1<<24)*Math.random()|0).toString(16);
        this.sounds[y][x] = this.addSound(this.soundFiles[++i]);
        if(i >= this.soundFiles.length-1) i = -1;
      }
    }

    

    navigator.getUserMedia_ = navigator.getUserMedia || navigator.webkitGetUserMedia;
    if(!!navigator.getUserMedia_ !== false) {
      try {
        navigator.getUserMedia_({
          'video': true, 
          toString: function() {
            return 'video';
          }
        }, this.gotStream, this.noStream);
      } 
      catch(error) {
        console.log(error);
      }
    }
  },

  gotStream: function(stream) {
    this.video.src = webkitURL.createObjectURL(stream);
    this.video.onerror = function() {
      stream.stop();
      this.streamError();
    };
    console.log('gotStream');
    $('#allow-it').hide();
    this.animLoop();
  },

  noStream: function() {
    console.log('noStream');
  },
  
  streamError: function() {
    console.log('streamError');
    window.cancelAnimationFrame(this.myReq);
  },

  addSound: function(fileName)
  {
    var audio = document.createElement('audio');
    audio.setAttribute("src", "audio/" + fileName + ".mp3");
    return audio;
  },

  animLoop: function() {
    this.render();
    this.myReq = window.requestAnimationFrame(this.animLoop, this);
  },

  render: function() {


    var width = this.canvas.width;
    var height = this.canvas.height;

    this.context.drawImage(this.video, 0, 0, width, height);



    this.outputContext.drawImage(this.video, 0, 0, output.width, output.height);




    var imageData = this.context.getImageData(0, 0, width, height);
    var imageDataBlur = this.context.getImageData(0, 0, width, height);

    addBlur(imageDataBlur, this.BLUR);



    if(this.loading) {
      this.loading = _.max(imageDataBlur.data) === 0;
      return;
    }

    if(this.bgImage === undefined) {
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

    for(var y = 0; y < this.rows; ++y) {
      grid[y] = [];
      for(var x = 0; x < this.cols; ++x) {
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

          if(diff < this.THRESHOLD) {
            this.merge(bgData, i - 3, bg, pixel, 0.7);
          }
          else {
            this.paintPixel(pixelData, i - 3, this.GREEN_COLOR);
            ++activityCount;

            this.merge(bgData, i - 3, bg, pixel, 0.3);

            yp = Math.floor((pixel.y / (height + 1)) * grid.length);
            xp = Math.floor((pixel.x / (width + 1)) * grid[yp].length);

            ++grid[yp][xp];
          }

          //update pixel position
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

    this.context.putImageData(imageData, 0, 0);

    for(var y = 0; y < grid.length; ++y) {
      for(var x = 0; x < grid[y].length; ++x) {
        var percent = grid[y][x] / this.cell.pixels;
        this.colorBox((grid[y].length - x) * this.cell.drawWidth, y * this.cell.drawHeight, this.colors[y][x], percent);
        this.playSound(this.sounds[y][x], percent);
      }
    }

    this.context.globalAlpha = 1;
    this.outputContext.globalAlpha = 1


  },

  colorBox: function(x, y, color, opacity) {
    this.outputContext.fillStyle = "#000000";
    this.outputContext.globalAlpha = 0.5 - opacity;
    this.outputContext.fillRect(x * this.scale, y * this.scale, (-this.cell.drawWidth * this.scale) - 1, (this.cell.drawHeight * this.scale) + 1);

    this.outputContext.fillStyle = color;
    this.outputContext.globalAlpha = opacity * 0.8;
    this.outputContext.fillRect(x * this.scale, y * this.scale, (-this.cell.drawWidth * this.scale) - 1, (this.cell.drawHeight * this.scale) + 1);

  },

  playSound: function(sound, volume) {
    if(sound && volume > 0.2 && (sound.currentTime == 0 || sound.currentTime == sound.duration)) {
      sound.volume = Math.min(1, Math.max(0, volume));
      sound.play();
    }
  },

  merge: function(pixelData, redComponentIndex, from, to, easing) {
    pixelData[redComponentIndex] += (to.red - from.red) * easing;
    pixelData[redComponentIndex + 1] += (to.green - from.green) * easing;
    pixelData[redComponentIndex + 2] += (to.blue - from.blue) * easing;
  },

  paintPixel: function(pixelData, redComponentIndex, paintColor) {
    pixelData[redComponentIndex] = paintColor.red;
    pixelData[redComponentIndex + 1] = paintColor.green;
    pixelData[redComponentIndex + 2] = paintColor.blue;
  },

  resize: function(event) {
    this.output.height = this.win.height();
    this.output.width = this.win.height() * this.aspectRatio;
    this.outputContext.translate(this.output.width, 0);
    this.outputContext.scale(-1, 1);
    this.scale = this.output.height / this.canvas.height;
    $(this.output).css({
      'left': (this.win.width() - this.output.width) * 0.5
    });
  }
};