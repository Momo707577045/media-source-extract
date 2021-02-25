// ==UserScript==
// @name         media-source-extract
// @namespace    https://github.com/Momo707577045/media-source-extract
// @version      0.1
// @description  https://github.com/Momo707577045/media-source-extract 配套插件
// @author       Momo707577045
// @include      *
// @exclude      http://blog.luckly-mjw.cn/tool-show/media-source-extract/player/player.html
// @grant        none
// @run-at document-start
// ==/UserScript==

(function() {
  'use strict';
  (function() {
    if (document.getElementById('media-source-extract')) {
      return
    }

    let _sourceBufferList = []
    let $btnDownload = document.createElement('div')
    let $downloadNum = document.createElement('div')
    let $tenRate = document.createElement('div') // 十倍速播放
    let $closeBtn = document.createElement('div') // 关闭
    $closeBtn.innerHTML = `
  <div style="
    margin-top: 4px;
    height: 34px;
    width: 34px;
    line-height: 34px;
    display: inline-block;
    border-radius: 50px;
    background-color: rgba(0, 0, 0, 0.5);
  " id="m3u8-close">
    <img style="
      padding-top: 4px;
      width: 24px;
      cursor: pointer;
    " src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAk1BMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ROyVeAAAAMHRSTlMA1Sq7gPribxkJx6Ey8onMsq+GTe10QF8kqJl5WEcvIBDc0sHAkkk1FgO2ZZ+dj1FHfPqwAAACNElEQVRIx6VW6ZqqMAwtFlEW2Rm3EXEfdZa+/9PdBEvbIVXu9835oW1yjiQlTWQE/iYPuTObOTzMNz4bQFRlY2FgnFXRC/o01mytiafP+BPvQZk56bcLSOXem1jpCy4QgXvRtlEVCARfUP65RM/hp29/+0R7eSbhoHlnffZ8h76e6x1tyw9mxXaJ3nfTVLd89hQr9NfGceJxfLIXmONh6eNNYftNSESRmgkHlEOjmhgBbYcEW08FFQN/ro6dvAczjhgXEdQP76xHEYxM+igQq259gLrCSlwbD3iDtTMy+A4Yuk0B6zV8c+BcO2OgFIp/UvJdG4o/Rp1JQYXeZFflPEFMfvugiFGFXN587YtgX7C8lRGFXPCGGYCCzlkoxJ4xqmi/jrIcdYYh5pwxiwI/gt7lDDFrcLiMKhBJ//W78ENsJgVUsV8wKpjZBXshM6cCW0jbRAilICFxIpgGMmmiWGHSIR6ViY+DPFaqSJCbQ5mbxoZLIlU0Al/cBj6N1uXfFI0okLppi69StmumSFQRP6oIKDedFi3vRDn3j6KozCZlu0DdJb3AupJXNLmqkk9+X9FEHLt1Jq8oi1H5n01AtRlvwQZQl9hmtPY4JEjMDs5ftWJN4Xr4lLrV2OHiUDHCPgvA/Tn/hP4zGUBfjZ3eLJ+NIOfHxi8CMoAQtYfmw93v01O0e7VlqqcCsXML3Vsu94cxnb4c7ML5chG8JIP9b38dENGaj3+x+TpiA/AL/fen8In7H8l3ZjdJQt2TAAAAAElFTkSuQmCC">
  </div>`


    // 十倍速播放
    function _tenRatePlay() {
      let $domList = document.getElementsByTagName('video')
      for (let i = 0, length = $domList.length; i < length; i++) {
        const $dom = $domList[i]
        $dom.playbackRate = 10
      }
    }

    // 下载资源
    function _download() {
      _sourceBufferList.forEach((target) => {
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
    window.MediaSource.prototype.endOfStream = function() {
      alert('资源全部捕获成功，即将下载！')
      _download()
      _endOfStream.call(this)
    }

    // 录取资源
    let _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer
    window.MediaSource.prototype.addSourceBuffer = function(mime) {
      _appendDom()
      let sourceBuffer = _addSourceBuffer.call(this, mime)
      let _append = sourceBuffer.appendBuffer
      let bufferList = []
      _sourceBufferList.push({
        mime,
        bufferList,
      })
      sourceBuffer.appendBuffer = function(buffer) {
        $downloadNum.innerHTML = `已捕获 ${_sourceBufferList[0].bufferList.length} 个片段`
        bufferList.push(buffer)
        _append.call(this, buffer)
      }
      return sourceBuffer
    }

    // 添加操作的 dom
    function _appendDom() {
      if (document.getElementById('media-source-extract')) {
        return
      }
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
      $btnDownload.id = 'media-source-extract'
      $tenRate.style = baseStyle + `top: 150px;`
      $btnDownload.style = baseStyle + `top: 100px;`
      $downloadNum.style = baseStyle
      $closeBtn.style = `
        position: fixed;
        top: 200px;
        right: 50px;
        text-align: center;
        z-index: 9999;
        cursor: pointer;
      `
      $btnDownload.addEventListener('click', _download)
      $tenRate.addEventListener('click', _tenRatePlay)
      $closeBtn.addEventListener('click', function() {
        $btnDownload.remove()
        $downloadNum.remove()
        $closeBtn.remove()
        $tenRate.remove()
      })

      document.getElementsByTagName('html')[0].insertBefore($tenRate, document.getElementsByTagName('head')[0]);
      document.getElementsByTagName('html')[0].insertBefore($downloadNum, document.getElementsByTagName('head')[0]);
      document.getElementsByTagName('html')[0].insertBefore($btnDownload, document.getElementsByTagName('head')[0]);
      document.getElementsByTagName('html')[0].insertBefore($closeBtn, document.getElementsByTagName('head')[0]);
    }


  })()
})();
