/* 文字を低解像度のキャンバスに描き、アンチエイリアスを2値化してから
   拡大表示する。これで iOS / Android でも本当にジャギーが出る。
   （-webkit-font-smoothing:none は macOS でしか効かないため） */
(function(){
  var FAM = '"Songti TC","Songti SC","Noto Serif TC",PMingLiU,MingLiU,SimSun,serif';

  function fit(ctx, text, weight, maxLogical){
    var fs = 60;
    while(fs > 6){
      ctx.font = weight + ' ' + fs + 'px ' + FAM;
      if(ctx.measureText(text).width <= maxLogical) break;
      fs--;
    }
    return fs;
  }

  // text を1枚のキャンバスに焼いて返す
  function bake(text, o){
    var cv = document.createElement('canvas');
    var ctx = cv.getContext('2d');
    var fs = fit(ctx, text, o.weight, o.logicalW);

    cv.width  = o.logicalW;
    cv.height = Math.ceil(fs * 1.35);
    ctx = cv.getContext('2d');
    ctx.font = o.weight + ' ' + fs + 'px ' + FAM;
    if('letterSpacing' in ctx) ctx.letterSpacing = o.tracking || '0px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = o.color;
    ctx.fillText(text, cv.width / 2, cv.height / 2);

    // アンチエイリアスを潰す＝縁が階段になる
    try{
      var d = ctx.getImageData(0, 0, cv.width, cv.height), p = d.data;
      for(var i = 3; i < p.length; i += 4) p[i] = p[i] > 110 ? 255 : 0;
      ctx.putImageData(d, 0, 0);
    }catch(e){}

    cv.style.width  = (cv.width  * o.chunk) + 'px';
    cv.style.height = (cv.height * o.chunk * (o.scaleY || 1)) + 'px';
    cv.style.imageRendering = 'pixelated';
    cv.className = 'jagcv';
    return cv;
  }

  function build(){
    var host = document.querySelector('.container');
    if(!host) return;
    var avail = Math.min(host.clientWidth - 28, 560);

    // ── 献辞（2語が入れ替わる）──
    var ded = document.getElementById('dedication');
    if(ded){
      var chunk = 2, lw = Math.floor(avail / chunk);
      var a = bake('DEDICATED TO ALL CHIMERAS',
                   {logicalW: lw, chunk: chunk, weight: 'bold',
                    color: '#00ff00', tracking: '-1px', scaleY: 1.7});
      var b = bake('DEDICATED TO ALL HUMANS',
                   {logicalW: lw, chunk: chunk, weight: 'bold',
                    color: '#00ff00', tracking: '-1px', scaleY: 1.7});
      ded.textContent = '';
      ded.appendChild(a);
      b.style.position = 'absolute';
      b.style.left = '50%';
      b.style.top = '0';
      b.style.transform = 'translateX(-50%)';
      b.style.visibility = 'hidden';
      ded.appendChild(b);
      ded.style.position = 'relative';

      var still = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!still){
        var n = 0, on = false;
        (function tick(){
          if(++n >= 2){
            n = 0; on = !on;
            a.style.visibility = on ? 'hidden' : 'visible';
            b.style.visibility = on ? 'visible' : 'hidden';
          }
          requestAnimationFrame(tick);
        })();
      }
    }

    // ── 問い（全部大文字・やや縦長）──
    var ask = document.getElementById('ask');
    if(ask){
      var txt = (ask.getAttribute('data-text') || ask.textContent).toUpperCase();
      var c2 = 2, lw2 = Math.floor((avail - 24) / c2);
      var parts = txt.length > 26 ? splitTwo(txt) : [txt];
      ask.textContent = '';
      for(var i = 0; i < parts.length; i++){
        ask.appendChild(bake(parts[i],
          {logicalW: lw2, chunk: c2, weight: 'bold',
           color: '#ffffff', tracking: '0px', scaleY: 1.35}));
      }
    }
  }

  // 2行に割る。中央に近い空白で切る
  function splitTwo(t){
    var mid = t.length / 2, best = -1;
    for(var i = 0; i < t.length; i++){
      if(t.charAt(i) === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    }
    if(best < 0) return [t];
    return [t.slice(0, best), t.slice(best + 1)];
  }

  function start(){
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    else build();
  }
  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start);
  else start();

  var rt;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(function(){ location.reload(); }, 400);
  });
})();
