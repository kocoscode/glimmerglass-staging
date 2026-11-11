// Stacked-alpha test player. Each <video data-stacked> holds the colour picture
// on its left half and the cut-out (white = solid) on its right half. This draws
// the left half to a canvas, using the right half as its transparency.
(() => {
  const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;uv.y=1.0-uv.y;gl_Position=vec4(p,0.0,1.0);}'
  // e = one and a half video pixels: keeps samples off the seam between the two halves.
  const FS = 'precision mediump float;varying vec2 uv;uniform sampler2D t;uniform float e;void main(){' +
    'float x=clamp(uv.x*0.5,e,0.5-e);vec3 c=texture2D(t,vec2(x,uv.y)).rgb;float a=texture2D(t,vec2(0.5+x,uv.y)).r;' +
    'gl_FragColor=vec4(min(c,vec3(a)),a);}'
  const stats = { drawn: 0, dropped: 0, total: 0 }
  window.stackedStats = stats

  function start(video) {
    const canvas = document.createElement('canvas')
    canvas.className = 'stacked'
    video.after(canvas)
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) { canvas.replaceWith(document.createTextNode('WebGL is not available.')); return }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(prog); gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
    for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v)

    const draw = () => {
      if (video.readyState < 2 || !video.videoWidth) return
      const w = video.videoWidth / 2, h = video.videoHeight
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform1f(gl.getUniformLocation(prog, 'e'), 1.5 / video.videoWidth) }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      stats.drawn++
    }
    if ('requestVideoFrameCallback' in video) {
      const tick = () => { draw(); video.requestVideoFrameCallback(tick) }
      video.requestVideoFrameCallback(tick)
    } else {
      let last = -1
      const tick = () => { if (video.currentTime !== last) { last = video.currentTime; draw() } requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    }
    video.muted = true; video.loop = true; video.playsInline = true
    video.play().catch(() => {})
  }

  const videos = [...document.querySelectorAll('video[data-stacked]')]
  videos.forEach(start)
  setInterval(() => {
    let dropped = 0, total = 0
    for (const v of videos) { const q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null; if (q) { dropped += q.droppedVideoFrames; total += q.totalVideoFrames } }
    stats.dropped = dropped; stats.total = total
    const el = document.getElementById('stats')
    if (el) el.textContent = `Frames drawn ${stats.drawn} · decoded ${total} · dropped ${dropped} · running ${Math.round(performance.now() / 1000)} s`
  }, 1000)
})()
