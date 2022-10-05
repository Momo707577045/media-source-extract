// ==UserScript==
// @name         media-source-extract
// @namespace    https://github.com/Momo707577045/media-source-extract
// @version      0.6
// @description  https://github.com/Momo707577045/media-source-extract 配套插件
// @author       Momo707577045
// @include      *
// @exclude      http://blog.luckly-mjw.cn/tool-show/media-source-extract/player/player.html
// @exclude      https://www.bilibili.com/*
// @downloadURL	 https://blog.luckly-mjw.cn/tool-show/media-source-extract/media-source-extract.user.js
// @updateURL	   https://blog.luckly-mjw.cn/tool-show/media-source-extract/media-source-extract.user.js
// @grant        none
// @run-at document-start
// ==/UserScript==

(function () {
  'use strict';
  (function () {
    if (document.getElementById('media-source-extract')) {
      return
    }


    let sumFragment = 0 // 已经捕获的所有片段数
    let isClose = false // 是否关闭
    let isStreamDownload = false // 是否使用流式下载
    let _sourceBufferList = [] // 媒体轨道
    const $showBtn = document.createElement('div') // 展示按钮
    const $btnDownload = document.createElement('div') // 下载按钮
    const $btnStreamDownload = document.createElement('div') // 流式下载按钮
    const $downloadNum = document.createElement('div') // 已捕获视频片段数
    const $tenRate = document.createElement('div') // 十倍速播放
    const $closeBtn = document.createElement('div') // 关闭
    const $container = document.createElement('div') // 容器
    $closeBtn.innerHTML = `
    <img style="
      padding-top: 4px;
      width: 24px;
      display: inline-block;
      cursor: pointer;
    " src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAk1BMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ROyVeAAAAMHRSTlMA1Sq7gPribxkJx6Ey8onMsq+GTe10QF8kqJl5WEcvIBDc0sHAkkk1FgO2ZZ+dj1FHfPqwAAACNElEQVRIx6VW6ZqqMAwtFlEW2Rm3EXEfdZa+/9PdBEvbIVXu9835oW1yjiQlTWQE/iYPuTObOTzMNz4bQFRlY2FgnFXRC/o01mytiafP+BPvQZk56bcLSOXem1jpCy4QgXvRtlEVCARfUP65RM/hp29/+0R7eSbhoHlnffZ8h76e6x1tyw9mxXaJ3nfTVLd89hQr9NfGceJxfLIXmONh6eNNYftNSESRmgkHlEOjmhgBbYcEW08FFQN/ro6dvAczjhgXEdQP76xHEYxM+igQq259gLrCSlwbD3iDtTMy+A4Yuk0B6zV8c+BcO2OgFIp/UvJdG4o/Rp1JQYXeZFflPEFMfvugiFGFXN587YtgX7C8lRGFXPCGGYCCzlkoxJ4xqmi/jrIcdYYh5pwxiwI/gt7lDDFrcLiMKhBJ//W78ENsJgVUsV8wKpjZBXshM6cCW0jbRAilICFxIpgGMmmiWGHSIR6ViY+DPFaqSJCbQ5mbxoZLIlU0Al/cBj6N1uXfFI0okLppi69StmumSFQRP6oIKDedFi3vRDn3j6KozCZlu0DdJb3AupJXNLmqkk9+X9FEHLt1Jq8oi1H5n01AtRlvwQZQl9hmtPY4JEjMDs5ftWJN4Xr4lLrV2OHiUDHCPgvA/Tn/hP4zGUBfjZ3eLJ+NIOfHxi8CMoAQtYfmw93v01O0e7VlqqcCsXML3Vsu94cxnb4c7ML5chG8JIP9b38dENGaj3+x+TpiA/AL/fen8In7H8l3ZjdJQt2TAAAAAElFTkSuQmCC">`
    $showBtn.innerHTML = `
    <img style="
      padding-top: 4px;
      width: 24px;
      display: inline-block;
      cursor: pointer;
    " src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAElBMVEUAAAD///////////////////8+Uq06AAAABXRSTlMA2kCAv5tF5NoAAAErSURBVHja7dzNasJAFIbhz8Tu7R0Eq/vQNHuxzL6YnPu/ldYpAUckxJ8zSnjfdTIPzHrOUawJdqmDJre1S/X7avigbM08kMgMSmt+iPWKbcwTsb3+KswXseOFLb2RnaTgjXTxtpwRq7XMgWz9kZ8cSKcwE6SX+SMGAgICAvJCyHdz2ud0pEx+/BpFaj2kEgQEBAQEBAQEBOT1kXWSkhbvk1vptOLs1LEWNrmVRgIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBeTayTqpufogxduqM3q2AgICAgICAgICA3IOko4ZXkB/pqOHzhyZBQEBAQLIieVahtDNBDnrLgZT+yC4HUkmtN9JnWUiVZbVWliVhseCJdPqvCH5IV2tQNl4r6Bod+wWq9eeDik+xFQAAAABJRU5ErkJggg==">`

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

    // 获取顶部 window title，因可能存在跨域问题，故使用 try catch 进行保护
    function getDocumentTitle() {
      let title = document.title;
      try {
        title = window.top.document.title
      } catch (error) {
        console.log(error)
      }
      return title
    }

    // 下载资源，因为无法判断当前 _sourceBufferList 中存在的是正片片段，还是广告片段，故无法清除 _sourceBufferList，
    function _download() {
      var _hmt = _hmt || [];
      (function () {
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
        a.download = `${getDocumentTitle()}.${type}`
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
      // alert('资源全部捕获成功，即将下载！')
      let text = '资源全部捕获成功，即将下载！';
      if (confirm(text) == true) {
        _download()
      } else {
        // 不下载资源
      }
      _endOfStream.call(this)
    }

    // 录取资源
    let _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer
    window.MediaSource.prototype.addSourceBuffer = function (mime) {
      _appendDom()
      let sourceBuffer = _addSourceBuffer.call(this, mime)
      let _append = sourceBuffer.appendBuffer
      let bufferList = []
      const _sourceBuffer = {
        mime,
        bufferList,
      }

      // 如果 streamSaver 已提前加载完成，则初始化对应的 streamWriter
      try {
        if(window.streamSaver){
          const type = mime.split(';')[0].split('/')[1]
          _sourceBuffer.streamWriter = streamSaver.createWriteStream(`${getDocumentTitle()}.${type}`).getWriter()
        }
      } catch (error) {
        console.error(error)
      }

      _sourceBufferList.push(_sourceBuffer)
      sourceBuffer.appendBuffer = function (buffer) {
        sumFragment++
        $downloadNum.innerHTML = `已捕获 ${sumFragment} 个片段`

        if (isStreamDownload && _sourceBuffer.streamWriter) { // 流式下载
          _sourceBuffer.streamWriter.write(new Uint8Array(buffer));
        } else { // 普通 blob 下载
          bufferList.push(buffer)
        }
        _append.call(this, buffer)
      }
      return sourceBuffer
    }

    // 添加操作的 dom
    function _appendDom() {
      if (document.getElementById('media-source-extract')) {
        return
      }
      $container.style = `
      position: fixed;
      top: 50px;
      right: 50px;
      text-align: right;
      z-index: 9999;
      `
      const baseStyle = `
      float:right;
      clear:both;
      margin-top: 10px;
      padding: 0 20px;
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
      $btnStreamDownload.innerHTML = '特大视频下载，边下载边保存'
      $btnDownload.innerHTML = '下载已捕获片段'
      $btnDownload.id = 'media-source-extract'
      $tenRate.style = baseStyle
      $downloadNum.style = baseStyle
      $btnDownload.style = baseStyle
      $btnStreamDownload.style = baseStyle
      $btnStreamDownload.style.display = 'none'
      $showBtn.style = `
      float:right;
      clear:both;
      display: none;
      margin-top: 4px;
      height: 34px;
      width: 34px;
      line-height: 34px;
      text-align: center;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.5);
      `
      $closeBtn.style = `
      float:right;
      clear:both;
      margin-top: 10px;
      height: 34px;
      width: 34px;
      line-height: 34px;
      text-align: center;
      display: inline-block;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.5);
      `

      $btnDownload.addEventListener('click', _download)
      $tenRate.addEventListener('click', _tenRatePlay)

      // 关闭控制面板
      $closeBtn.addEventListener('click', function () {
        $downloadNum.style.display = 'none'
        $btnStreamDownload.style.display = 'none'
        $btnDownload.style.display = 'none'
        $closeBtn.style.display = 'none'
        $tenRate.style.display = 'none'
        $showBtn.style.display = 'inline-block'
        isClose = true
      })

      // 显示控制面板
      $showBtn.addEventListener('click', function () {
        if (!isStreamDownload) {
          $btnDownload.style.display = 'inline-block'
          $btnStreamDownload.style.display = 'inline-block'
        }
        $downloadNum.style.display = 'inline-block'
        $closeBtn.style.display = 'inline-block'
        $tenRate.style.display = 'inline-block'
        $showBtn.style.display = 'none'
        isClose = false
      })

      // 启动流式下载
      $btnStreamDownload.addEventListener('click', function () {
        isStreamDownload = true
        $btnDownload.style.display = 'none'
        $btnStreamDownload.style.display = 'none'
        _sourceBufferList.forEach(sourceBuffer => {
          if (!sourceBuffer.streamWriter) {
            const type = sourceBuffer.mime.split(';')[0].split('/')[1]
            sourceBuffer.streamWriter = streamSaver.createWriteStream(`${getDocumentTitle()}.${type}`).getWriter()
            sourceBuffer.bufferList.forEach(buffer => {
              sourceBuffer.streamWriter.write(new Uint8Array(buffer));
            })
            sourceBuffer.bufferList = []
          }
        })
      })

      document.getElementsByTagName('html')[0].insertBefore($container, document.getElementsByTagName('head')[0]);
      $container.appendChild($btnStreamDownload)
      $container.appendChild($downloadNum)
      $container.appendChild($btnDownload)
      $container.appendChild($tenRate)
      $container.appendChild($closeBtn)
      $container.appendChild($showBtn)

      // 加载 stream 流式下载器
      try {
        let $streamSaver = document.createElement('script')
        $streamSaver.src = 'https://upyun.luckly-mjw.cn/lib/stream-saver.js'
        document.body.appendChild($streamSaver);
        $streamSaver.addEventListener('load', () => {
          $btnStreamDownload.style.display = 'inline-block'
        })
      } catch (error) {
        console.error(error)
      }
    }
  })()
})();
