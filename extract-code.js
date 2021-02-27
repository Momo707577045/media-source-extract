(function () {

  let _sourceBufferList = []
  let $btnDownload = document.createElement('div')
  let $downloadNum = document.createElement('div')
  let $tenRate = document.createElement('div') // 十倍速播放

  // 十倍速播放
  function _tenRatePlay () {
    let $domList = document.getElementsByTagName('video')
    for (let i = 0, length = $domList.length; i < length; i++) {
      const $dom = $domList[i]
      $dom.playbackRate = 10
    }
  }

  // 下载资源
  function _download () {
    const sourceBufferListLen = _sourceBufferList.length 
    const _sourceBufferListTemp =  _sourceBufferList.slice(sourceBufferListLen - 2)
    // 每次只下载最新的视频与音频
    _sourceBufferListTemp.forEach((target) => {
      const mime = target.mime.split(';')[0]
      const type = mime.split('/')[1]
      const fileBlob = new Blob(target.bufferList, { type: mime }) // 创建一个Blob对象，并设置文件的 MIME 类型
      const a = document.createElement('a')
      a.download = `${document.title}.${type}`
      a.href = URL.createObjectURL(fileBlob)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
    })
  }

  // 监听资源全部录取成功
  let _endOfStream = window.MediaSource.prototype.endOfStream
  window.MediaSource.prototype.endOfStream = function () {
    alert('资源全部捕获成功，即将下载！')
    _download()
    _endOfStream.call(this)
  }

  // 录取资源
  let _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer
  window.MediaSource.prototype.addSourceBuffer = function (mime) {
    console.log(mime)
    let sourceBuffer = _addSourceBuffer.call(this, mime)
    let _append = sourceBuffer.appendBuffer
    let bufferList = []
    _sourceBufferList.push({
      mime,
      bufferList,
    })
    const _sourceBufferListLen = _sourceBufferList.length
    sourceBuffer.appendBuffer = function (buffer) {
      $downloadNum.innerHTML = `已捕获 ${_sourceBufferList[_sourceBufferListLen - 1].bufferList.length} 个片段` // 显示最新的获取切片信息
      bufferList.push(buffer)
      _append.call(this, buffer)
    }
    return sourceBuffer
  }

  // 添加操作的 dom
  function _appendDom () {
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
    $tenRate.innerHTML = '十倍速捕获'
    $downloadNum.innerHTML = '已捕获 0 个片段'
    $btnDownload.innerHTML = '下载已捕获片段'
    $tenRate.style = baseStyle + `top: 150px;`
    $btnDownload.style = baseStyle + `top: 100px;`
    $downloadNum.style = baseStyle
    $btnDownload.addEventListener('click', _download)
    $tenRate.addEventListener('click', _tenRatePlay)
    document.getElementsByTagName('html')[0].insertBefore($tenRate, document.getElementsByTagName('head')[0]);
    document.getElementsByTagName('html')[0].insertBefore($downloadNum, document.getElementsByTagName('head')[0]);
    document.getElementsByTagName('html')[0].insertBefore($btnDownload, document.getElementsByTagName('head')[0]);
  }

  _appendDom()
})()