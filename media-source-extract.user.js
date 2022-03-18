// ==UserScript==
// @name         media-source-extract
// @namespace    https://github.com/Momo707577045/media-source-extract
// @version      0.3
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

    let isClose = true
    let _sourceBufferList = []
    let $showBtn = document.createElement('div') // 展示按钮
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
    text-align: center;
    display: inline-block;
    border-radius: 50px;
    background-color: rgba(0, 0, 0, 0.5);
  " id="m3u8-close">
    <img style="
      padding-top: 4px;
      width: 24px;
      display: inline-block;
      cursor: pointer;
    " src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAk1BMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ROyVeAAAAMHRSTlMA1Sq7gPribxkJx6Ey8onMsq+GTe10QF8kqJl5WEcvIBDc0sHAkkk1FgO2ZZ+dj1FHfPqwAAACNElEQVRIx6VW6ZqqMAwtFlEW2Rm3EXEfdZa+/9PdBEvbIVXu9835oW1yjiQlTWQE/iYPuTObOTzMNz4bQFRlY2FgnFXRC/o01mytiafP+BPvQZk56bcLSOXem1jpCy4QgXvRtlEVCARfUP65RM/hp29/+0R7eSbhoHlnffZ8h76e6x1tyw9mxXaJ3nfTVLd89hQr9NfGceJxfLIXmONh6eNNYftNSESRmgkHlEOjmhgBbYcEW08FFQN/ro6dvAczjhgXEdQP76xHEYxM+igQq259gLrCSlwbD3iDtTMy+A4Yuk0B6zV8c+BcO2OgFIp/UvJdG4o/Rp1JQYXeZFflPEFMfvugiFGFXN587YtgX7C8lRGFXPCGGYCCzlkoxJ4xqmi/jrIcdYYh5pwxiwI/gt7lDDFrcLiMKhBJ//W78ENsJgVUsV8wKpjZBXshM6cCW0jbRAilICFxIpgGMmmiWGHSIR6ViY+DPFaqSJCbQ5mbxoZLIlU0Al/cBj6N1uXfFI0okLppi69StmumSFQRP6oIKDedFi3vRDn3j6KozCZlu0DdJb3AupJXNLmqkk9+X9FEHLt1Jq8oi1H5n01AtRlvwQZQl9hmtPY4JEjMDs5ftWJN4Xr4lLrV2OHiUDHCPgvA/Tn/hP4zGUBfjZ3eLJ+NIOfHxi8CMoAQtYfmw93v01O0e7VlqqcCsXML3Vsu94cxnb4c7ML5chG8JIP9b38dENGaj3+x+TpiA/AL/fen8In7H8l3ZjdJQt2TAAAAAElFTkSuQmCC">
  </div>`


    // 十倍速播放
    function _tenRatePlay() {
      let playbackRate = 10
      if ($tenRate.innerHTML === '十倍速捕获') {
        $tenRate.innerHTML = '恢复正常播放'
      } else {
        playbackRate = 1
        $tenRate.innerHTML = '十倍速捕获'
      }

      let $domList = document.getElementsByTagName('video')
      for (let i = 0, length = $domList.length; i < length; i++) {
        const $dom = $domList[i]
        $dom.playbackRate = playbackRate
      }
    }

    // 下载资源
    function _download() {
      var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?1f12b0865d866ae1b93514870d93ce89";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
      })();
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
      _sourceBufferList = []  //这里新增的
    }

    // 监听资源全部录取成功
    let _endOfStream = window.MediaSource.prototype.endOfStream
    window.MediaSource.prototype.endOfStream = function() {
      if (!isClose) {
        // alert('资源全部捕获成功，即将下载！')
        let text = '资源全部捕获成功，即将下载！';
        if (confirm(text) == true) {
          _download()
        } else {
          // 不下载资源
        }
        _endOfStream.call(this)
      } else {
        // closed
        _sourceBufferList = []  //这里新增的
      }
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
      $showBtn.innerHTML = '展示捕获面板'
      $showBtn.style = baseStyle + `top: 250px;`
      $closeBtn.style = `
        position: fixed;
        top: 200px;
        right: 50px;
        text-align: center;
        z-index: 9999;
        cursor: pointer;
      `
      $btnDownload.style.display = 'none'
      $closeBtn.style.display = 'none'
      $tenRate.style.display = 'none'

      $btnDownload.addEventListener('click', _download)
      $tenRate.addEventListener('click', _tenRatePlay)
      $closeBtn.addEventListener('click', function() {
        // $btnDownload.remove()
        // $downloadNum.remove()
        // $closeBtn.remove()
        // $tenRate.remove()
        $btnDownload.style.display = 'none'
        $closeBtn.style.display = 'none'
        $tenRate.style.display = 'none'
        $showBtn.style.display = 'block'
        isClose = true
      })
      $showBtn.addEventListener('click', function() {
        $btnDownload.style.display = 'block'
        $closeBtn.style.display = 'block'
        $tenRate.style.display = 'block'
        $showBtn.style.display = 'none'
        isClose = false
      })

      document.getElementsByTagName('html')[0].insertBefore($tenRate, document.getElementsByTagName('head')[0]);
      document.getElementsByTagName('html')[0].insertBefore($downloadNum, document.getElementsByTagName('head')[0]);
      document.getElementsByTagName('html')[0].insertBefore($btnDownload, document.getElementsByTagName('head')[0]);
      document.getElementsByTagName('html')[0].insertBefore($closeBtn, document.getElementsByTagName('head')[0]);
      document.getElementsByTagName('html')[0].insertBefore($showBtn, document.getElementsByTagName('head')[0]);
    }


  })()
})();
