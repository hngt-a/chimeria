// undulating meat — WebGL domain warp. Falls back to the CSS background image.
(function(){
  var cv = document.getElementById('bg');
  var gl = null;
  try { gl = cv.getContext('webgl') || cv.getContext('experimental-webgl'); } catch(e){}
  if(!gl){ cv.style.display='none'; return; }

  var VS =
    'attribute vec2 p;varying vec2 v;' +
    'void main(){v=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}';

  var FS =
    'precision mediump float;' +
    'varying vec2 v;' +
    'uniform sampler2D tex;' +
    'uniform float t;' +
    'uniform vec2 res;' +
    'uniform vec2 img;' +
    'void main(){' +
    // cover-fit
    '  float ra=res.x/res.y, ia=img.x/img.y;' +
    '  vec2 uv=v;' +
    '  if(ra>ia){ uv.y=(uv.y-0.5)*(ia/ra)+0.5; } else { uv.x=(uv.x-0.5)*(ra/ia)+0.5; }' +
    // domain warp: two slow octaves
    '  vec2 w;' +
    '  w.x = sin(uv.y*7.0 + t*0.45) + 0.6*sin(uv.y*17.0 - t*0.31);' +
    '  w.y = cos(uv.x*6.0 - t*0.38) + 0.6*cos(uv.x*15.0 + t*0.27);' +
    '  vec2 uv2 = uv + w*0.028;' +
    '  w.x = sin(uv2.y*23.0 + t*0.6);' +
    '  w.y = cos(uv2.x*21.0 - t*0.52);' +
    '  uv2 += w*0.008;' +
    '  uv2 = clamp(uv2, 0.001, 0.999);' +
    '  vec3 c = texture2D(tex, uv2).rgb;' +
    // crush to a deep blood-red field so white type always reads
    '  c = pow(c, vec3(1.9));' +
    '  c *= vec3(0.92, 0.30, 0.26);' +
    '  c *= 0.86 + 0.14*sin(t*0.6 + uv.y*2.5);' +
    '  gl_FragColor = vec4(c,1.0);' +
    '}';

  function sh(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if(!vs || !fs){ cv.style.display='none'; return; }

  var pr = gl.createProgram();
  gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr, gl.LINK_STATUS)){ cv.style.display='none'; return; }
  gl.useProgram(pr);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uT = gl.getUniformLocation(pr, 't'),
      uR = gl.getUniformLocation(pr, 'res'),
      uI = gl.getUniformLocation(pr, 'img');

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([40,20,20,255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  var iw = 1080, ih = 1620, ready = false;
  var im = new Image();
  im.onload = function(){
    iw = im.width; ih = im.height;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    ready = true;
  };
  im.onerror = function(){ cv.style.display='none'; };
  im.src = 'img/meat-web.jpg';

  function size(){
    var d = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width  = Math.floor(window.innerWidth  * d);
    cv.height = Math.floor(window.innerHeight * d);
    gl.viewport(0, 0, cv.width, cv.height);
  }
  size();
  window.addEventListener('resize', size);

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t0 = Date.now();
  function draw(){
    var t = still ? 0 : (Date.now() - t0) / 1000;
    gl.uniform1f(uT, t);
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform2f(uI, iw, ih);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if(!still || !ready) requestAnimationFrame(draw);
  }
  draw();
})();
