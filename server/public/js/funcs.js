function addBlur(img, passes) {
    // Same as blur, but fakes borders for nicer code
    // Increase passes for blurrier image
    var i, j, k, m, n, w = img.width, h = img.height, im = img.data,
        rounds = passes || 0,
        pos = step = jump = inner = outer = arr = 0;

    for(n = 0; n < rounds; ++n) {
        for(m=0;m<2;m++) { // First blur rows, then columns
            if (m) {
                // Values for column blurring
                outer = w; inner = h;
                step = w*4;
            } else {
                // Row blurring
                outer = h; inner = w;
                step = 4;
            }
            for (i = 0; i < outer; ++i) {
                jump = m === 0 ? i*w*4 : 4*i;
                for (k = 0; k < 3; ++k) { // Calculate for every color: red, green and blue
                    pos = jump + k;
                    for(j = arr = 0; j < 5; ++j) { arr += im[pos+step*j]; }
                    img[pos] = im[pos+step] = im[pos+step*2] = Math.floor(arr/5); // Slightly wrong, but nicer to read
                    for (j = 3; j < inner-2; j++) {
                        arr = Math.max(0, arr - im[pos+(j-2)*step] + im[pos+(j+2)*step]);
                        im[pos+j*step] = Math.floor(arr/5);
                    }
                    // j is now inner - 2 (1 bigger)
                    im[pos+j*step] = im[pos+(j+1)*step] = Math.floor(arr/5); // Slightly wrong, but nicer to read
                }
            }
        }
    }
    return img;
}

(function() {
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x,
        length,
        currTime,
        timeToCall;

    for(x = 0, length = vendors.length; x < length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            lastTime = currTime + timeToCall;
            return window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());