(function() {

  let ffmpeg = null // 待初始化 ffmpeg 实例
  let fetchFile = null // 待初始化 fetchFile 实例
  let toBlobURL = null // 待初始化 toBlobURL 实例
  let _sourceBufferList = []
  let $btnDownload = document.createElement('div')
  let $downloadNum = document.createElement('div')
  let $x16Rate = document.createElement('div') // 十倍速播放

  // 十六倍速播放
  function _x16RatePlay() {
    let playbackRate = 16
    if ($x16Rate.innerHTML === '16倍速捕获') {
      $x16Rate.innerHTML = '恢复正常播放'
    } else {
      playbackRate = 1
      $x16Rate.innerHTML = '16倍速捕获'
    }

    let $domList = document.getElementsByTagName('video')
    for (let i = 0, length = $domList.length; i < length; i++) {
      const $dom = $domList[i]
      $dom.playbackRate = playbackRate
    }
  }
  
  // 初始化 FFmpeg
  async function initFFmpeg() {
    if (ffmpeg !== null) {
      return
    }
  
    function loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`加载脚本失败: ${src}`));
        document.body.appendChild(script);
      });
    }
  
    try {
      await loadScript('https://registry.npmmirror.com/@ffmpeg/util/0.12.1/files/dist/umd/index.js')
      fetchFile = FFmpegUtil.fetchFile
      toBlobURL = FFmpegUtil.toBlobURL
    } catch (error) {
      console.error('FFmpeg.util 初始化失败', error)
    }
  
    try {
      await loadScript('https://registry.npmmirror.com/@ffmpeg/ffmpeg/0.12.10/files/dist/umd/ffmpeg.js')
      ffmpeg = new FFmpegWASM.FFmpeg()
    } catch (error) {
      console.error('FFmpeg.wasm 初始化失败', error)
    }
  }

  // 下载资源
  async function _download() {
    const fileNames = []
    await initFFmpeg()
    const baseURL = 'https://registry.npmmirror.com/@ffmpeg/core/0.12.6/files/dist/esm'
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        classWorkerURL: await toBlobURL('https://registry.npmmirror.com/@ffmpeg/ffmpeg/0.12.10/files/dist/umd/814.ffmpeg.js', 'text/javascript'),
    })
    for (const target of _sourceBufferList) {
        const mime = target.mime.split(';')[0]
        const type = mime.split('/')[0]
        const extName = mime.split('/')[1]
        const fileBlob = new Blob(target.bufferList, { type: mime }) // 创建一个Blob对象，并设置文件的 MIME 类型
        await ffmpeg.writeFile(`${type}.${extName}`, await fetchFile(fileBlob))
        fileNames.push(`${type}.${extName}`)
    }
    await ffmpeg.exec(['-i', fileNames[0], '-i', fileNames[1], '-c', 'copy', `${getDocumentTitle()}.mp4`]) // 合并视频
    const mergedFile = await ffmpeg.readFile(`${getDocumentTitle()}.mp4`)
    const a = document.createElement('a')
    a.download = `${getDocumentTitle()}.mp4`
    a.href = URL.createObjectURL(new Blob([mergedFile.buffer], { type: 'video/mp4' }))
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // 监听资源全部录取成功
  let _endOfStream = window.MediaSource.prototype.endOfStream
  window.MediaSource.prototype.endOfStream = function() {
    alert('资源全部捕获成功，即将下载！')
    _download()
    _endOfStream.call(this)
  }

  // 录取资源
  let _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer
  window.MediaSource.prototype.addSourceBuffer = function(mime) {
    console.log(mime)
    let sourceBuffer = _addSourceBuffer.call(this, mime)
    let _append = sourceBuffer.appendBuffer
    let bufferList = []
    _sourceBufferList.push({
      mime,
      bufferList,
    })
    sourceBuffer.appendBuffer = function(buffer) {
      let sumFragment = 0
      _sourceBufferList.forEach(sourceBuffer => sumFragment += sourceBuffer.bufferList.length)
      $downloadNum.innerHTML = `已捕获 ${sumFragment} 个片段`
      bufferList.push(buffer)
      _append.call(this, buffer)
    }
    return sourceBuffer
  }

  // 添加操作的 dom
  function _appendDom() {
    const baseStyle = `
      position: fixed;
      top: 50px;
      right: 50px;
      height: 40px;
      padding: 0 20px;
      z-index: 9999;
      color: white;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      line-height: 40px;
      text-align: center;
      border-radius: 4px;
      background-color: #3498db;
      box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.3);
    `
    $x16Rate.innerHTML = '十六倍速捕获'
    $downloadNum.innerHTML = '已捕获 0 个片段'
    $btnDownload.innerHTML = '下载已捕获片段'
    $x16Rate.style = baseStyle + `top: 150px;`
    $btnDownload.style = baseStyle + `top: 100px;`
    $downloadNum.style = baseStyle
    $btnDownload.addEventListener('click', _download)
    $x16Rate.addEventListener('click', _x16RatePlay)
    document.getElementsByTagName('html')[0].insertBefore($x16Rate, document.getElementsByTagName('head')[0]);
    document.getElementsByTagName('html')[0].insertBefore($downloadNum, document.getElementsByTagName('head')[0]);
    document.getElementsByTagName('html')[0].insertBefore($btnDownload, document.getElementsByTagName('head')[0]);
  }

  _appendDom()
  initFFmpeg()
})()
