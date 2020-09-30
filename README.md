# 无差别视频提取工具

## 背景
- 之前笔者实现了[m3u8 视频在线提取工具](http://blog.luckly-mjw.cn/tool-show/m3u8-downloader/index.html)，可对 m3u8 视频进行提取，合并，下载。实现整个视频下载流程。
- 后续还实现了非定制性的 ASE 解密功能（不提供定制性服务，定制性解密，属于破解，侵权行为，需尊重知识产权）
- 但上述工具仍存在一定的通用性问题。为彻底解决通用性，实现无差别视频提取，开发了这个工具。

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/001.jpeg)


## 特点
- 优点，通用性强，无差别提取，只要使用到 MES 主流媒体播放技术的视频，均可捕获。
- 优点，足够简单，在视频播放的最后一个步骤进行拦截，规避视频加载，加密，解密等复杂过程。
- 缺点，被动，无法主动干预视频加载，只可被动捕获视频资源。
- 缺点，有一定门槛，依赖 chrome 浏览器开发者模式，无法实现全自动化，有一定使用门槛。

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/018.png)

## [使用示例链接](http://blog.luckly-mjw.cn/tool-show/media-source-extract/example/index.html)

## 原理
- 主流视频媒体播放技术，均使用到 [MES](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API) 技术
- MES 技术播放流程一般如下：
  - 创建 video 播放器标签。
  - 拉取视频片段。
  - 解密视频片段（如果对视频进行了加密操作）
  - 解析视频片段，分为「视频轨」「音频轨」。
  - 将每个片段的「视频轨」「音频轨」，"喂给" video 标签进行播放。
  - 当已加载的视频片段快要播完时，重复第二个步骤，拉取新的视频片段，进行投喂。

    ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/021.jpeg)
- 本工具的核心逻辑
  - 覆写视频片段的"投喂"操作。
  - 插入自定义代码，收集"投喂"的「视频」「音频」资源，进行下载。

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/019.jpeg)


## 核心源码（共 91 行）
```
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

  // 下载捕获到的资源
  function _download () {
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
  window.MediaSource.prototype.endOfStream = function () {
    alert('资源全部捕获成功，即将下载！')
    _download()
    _endOfStream.call(this)
  }

  // 捕获资源
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
    sourceBuffer.appendBuffer = function (buffer) {
      $downloadNum.innerHTML = `已捕获 ${_sourceBufferList[0].bufferList.length} 个片段`
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
```

## 功能说明
![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/017.png)

- 【已捕获 0 个片段】
  - 显示程序已捕获的视频片段数。
- 【下载已捕获片段】
  - 可以强制下载已经捕获的片段，无需等待整个视频全部捕获完成。
- 【十倍速捕获】
  - 由于视频捕获是依赖视频加载进度的。
  - 点击该按钮，可以十倍速播放，加速视频加载，加速视频捕获。
- 当视频全部加载完成，将触发自动下载。
  - 若无触发，可手动点击「下载已捕获片段」按钮，对捕获到的视频进行下载。




## 使用方式
*[示例实验链接](http://blog.luckly-mjw.cn/tool-show/media-source-extract/example/index.html)*
- 复制工具代码
  - 可以直接复制本文中的核心源码
  - 也可以点开[示例实验链接](http://blog.luckly-mjw.cn/tool-show/media-source-extract/example/index.html)，点击按钮，快速复制工具代码。

    ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/002.jpeg)

- 打开目前页面的控制台

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/003.jpeg)

- ctrl + f ，输入 iframe，判断是否存在 iframe 内嵌页面，若存在 iframe，请查看下一节「iframe 解决方案」。若无，则下一步

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/004.jpeg)

- 打开代码调试面板

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/005.jpeg)

- 在调试面板中，找到当前页面的代码
  - 注意文件的寻找方法，需根据 URL 中的路径层级寻找。
  - 点击下方按钮，对代码进行排版。

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/006.jpeg)

- 搜索，找到第一个 <script 标签，并设置多个断点

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/007.jpeg)

  - 搜索，如果第一个 <script 标签是一个链接。

    ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/015.jpeg)
  - 则找到对应文件，设置断点。

    ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/016.jpeg)

- 刷新页面，出现如下状态，则证明断点设置成功
  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/008.jpeg)

- 在 console 栏，粘贴工具代码，回车

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/009.jpeg)

- 回到 source 栏，点击按钮，恢复运行

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/010.jpeg)

- 若页面出现这几个按钮，则证明注入成功，工具运行成功

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/011.jpeg)

- 正常观看视频，等待视频捕获
  - 可点击「十倍速捕获」，接口视频播放速度，加快视频捕获速度。


- 若页面出现如下弹窗，即捕获完成，视频自动下载（也可以点击「下载已捕获片段」，手动下载）

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/012.jpeg)

- 视频下载完成，得到「音频」文件，「视频」文件

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/013.jpeg)

  - 可使用[专属播放器](http://blog.luckly-mjw.cn/tool-show/media-source-extract/player/player.html)，进行播放。
  - 也可以使用其他工具，进行合并。

    ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/014.jpeg)


## iframe 解决方案
*[示例实验链接](http://blog.luckly-mjw.cn/tool-show/media-source-extract/example/index.html)*


## [专属播放器](http://blog.luckly-mjw.cn/tool-show/media-source-extract/player/player.html)
- 由于采集工具是单独对「视频」和「音频」分开采集的。
- 使用普通播放器可能无法正常播放。
- 可利用本工具同时加载「视频」和「音频」同步播放。
- 本工具还附有倍速播放功能。

  ![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/014.jpeg)


## [项目源码](https://github.com/Momo707577045/media-source-extract)
![](http://upyun.luckly-mjw.cn/Assets/media-source/readme-picture/020.png)



## 声明
- 本项目仅用于学习，交流，切勿用于侵权行为。