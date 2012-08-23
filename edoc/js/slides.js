

$(function(){
  var touchableDevice           = 'ontouchstart' in document,
      slidesFirstPage           = $('#ppts img').attr('src'),
      $ppts                     = $('#ppts'),
      ppts                      = [],
      $pptThumbs                = $("#ppt-thumbs"),
      $pptThumbsList            = $pptThumbs.find('ol'),
      pptThumbTitleTypes        = ['current', 'clickable', 'unavailable'],
      pptThumbTitles            = {},
      $video                    = $('#video'),
      jwplayerControlbarHeight  = touchableDevice ? 0 : 23,
      videoIsReady              = false,
      manualSeeking             = {'status' : false, 'processingPhase' : 0, 'targetTimeInSeconds' : 0},
//      jiaThisHtml               = '<div class="jia-this"><!-- JiaThis Button BEGIN --><div id="ckepop"><span class="jiathis_txt">分享到：</span><a class="jiathis_button_tsina"></a><a class="jiathis_button_tqq"></a><a class="jiathis_button_t163"></a><a class="jiathis_button_tsohu"></a><a class="jiathis_button_email"></a><a href="http://www.jiathis.com/share?uid=1601876" class="jiathis jiathis_txt jiathis_separator jtico jtico_jiathis" target="_blank"></a><a class="jiathis_counter_style"></a></div><script type="text/javascript" >var jiathis_config={data_track_clickback:true,summary:"",ralateuid:{"tsina":"2702744183"},appkey:{"tsina":"3927070012"},hideMore:false}</script><script type="text/javascript" src="http://v2.jiathis.com/code_mini/jia.js?uid=1601876" charset="utf-8"></script><!-- JiaThis Button END --></div>';
      jiaThisHtml               = "";
  for(var i in pptThumbTitleTypes){
    pptThumbTitles[pptThumbTitleTypes[i]] = $pptThumbsList.data(pptThumbTitleTypes[i] + '-title');
  }
  //根据video宽高比调整高度
  function ResizePlayer(){
    if(this.renderingMode === 'html5'){
      jwplayerControlbarHeight = 0;
    }
    var meta          = this.getMeta(),
        width         = $video.data('width') || this.getWidth(),
        height        = meta['height'] / meta['width'] * width + jwplayerControlbarHeight;
    if(!isNaN(width) && !isNaN(height) && width > 0 && height > 0){
      this.resize(width, height);
    }
  }
  //载入ppt时间数据
  var timeline = $ppts.data('timeline');
  if(timeline){
    //预载入幻灯片和缩略图
    function PreloadPptsAndThumbs(ppts, targetPage){
      if(!ppts.length){
        return;
      }
      var explictTargetPage = !!targetPage,
          loadedPages       = $ppts.find('li').length;
      if(explictTargetPage && targetPage <= loadedPages || targetPage > ppts.length){
          return;
      }
      targetPage = targetPage || (loadedPages + 1);
      var pptHtml = '<li><img src="' + slidesFirstPage.replace(/\d+(\D+)$/, targetPage + "$1") + '" /></li>';
      $ppts.append(pptHtml);
      $pptThumbsList.append($(pptHtml).addClass('unavailable'));
      SetPptThumbTitles();
      if(!explictTargetPage && targetPage < (ppts.length)){
        $ppts.find('li:last img')[0].onload = function(){
          if(targetPage === 2){
            $ppts.height($ppts.height() || $ppts.find('li.first img').height());
            $('.slides-container .buttons').height($ppts.height());
          }
          PreloadPptsAndThumbs(ppts);
        };
        //setTimeout(function(){PreloadPptsAndThumbs(ppts);}, 2000);
      }
    }
    //根据时间点计算对应幻灯片索引值
    function GetTargetPptIndex(ppts, playingTimeInSeconds){
      playingTimeInSeconds = Math.ceil(playingTimeInSeconds);
      var targetPptIndex   = 0;
      while(ppts[targetPptIndex][0] <= playingTimeInSeconds){
        if(++targetPptIndex >= ppts.length){
          break;
        }
      }
      return --targetPptIndex < 0 ? 0 : targetPptIndex;
    }
    //缓冲过程激活可用的缩略图
    function ActivatePptThumbs(bufferedTimeInSeconds){
      var bufferedPptThumbIndex = GetTargetPptIndex(ppts, bufferedTimeInSeconds);
      $pptThumbs.find('li:lt(' + (1 + bufferedPptThumbIndex) + ')')
                .filter('.unavailable').removeClass('unavailable').addClass('clickable');
      SetPptThumbTitles();
    }
    //处理缩略图的提示文字
    function SetPptThumbTitles(){
      $.each(pptThumbTitles, function(index, value){
        $pptThumbsList.find('.' + index + '').attr('title', value);
      });
    }
    //根据给定时间点(秒)切换幻灯片和缩略图
    function SwitchPptsAndThumbs(playingTimeInSeconds){
      var $currentPpt     = $ppts.find('li:visible'),
          currentPptIndex = $currentPpt.index(),
          targetPptIndex  = GetTargetPptIndex(ppts, playingTimeInSeconds),
          $targetPpt      = $ppts.find('li:eq(' + targetPptIndex + ')');
      if(targetPptIndex === currentPptIndex){
        return;
      }
      $ppts .find('li').hide()
            .filter('li:eq(' + targetPptIndex + ')').show();
      $('.slides-container .control-bar .current-page').text(targetPptIndex + 1);
      $pptThumbs.find('li:eq(' + currentPptIndex + ')').removeClass('current').addClass('clickable');
      $pptThumbs.find('li:eq(' + targetPptIndex + ')').removeClass('clickable').addClass('current');
      SetPptThumbTitles();
    }
    //显示缓冲提示
    function ShowBufferingTips(){
      var $bufferingTips  = $('.slides-container .buttons .buffer') .show()
                                                                    .siblings().hide()
                                                                    .end();
          $dots           = $bufferingTips.find('.fg > span')
      if(!$dots.length){
        $dots = $('<span>.</span><span>.</span><span>.</span>').appendTo($bufferingTips.find('.fg'));
      }
      (function animateDots(){
        setTimeout(function(){
          if($bufferingTips.is(':not(:visible)')){
            return;
          }
          var visibleDots = $dots.filter('.visible').length;
          if(visibleDots < 3){
            $dots.filter(':not(.visible):first').addClass('visible');
          }else{
            $dots.removeClass('visible');
          }
          animateDots();
        }, 1000);
      })();
      $('.slides-container .control-bar .play') .hide()
                                                .siblings('.pause').show();
    }
    //隐藏缓冲提示
    function HideBufferingTips(){
      $('.slides-container .buttons .buffer').hide();
    }

    //将时间轴数据转换为数组格式
    if(!$.isArray(timeline)){alert(timeline);
      timeline = $.parseJSON(timeline);
    }
    ppts = $.map(timeline, function(value){
      var ppt = value.split('|');
      return [[ppt[0] * 3600 + ppt[1] * 60 + ppt[2] * 1, ppt[3]]];
    });

    PreloadPptsAndThumbs(ppts);

    $pptThumbs.height($pptThumbs.closest('.tab-contents').height() || $pptThumbs.height());
    //$pptThumbs.show();
    //视频播放器
    var jwplayerVideo = jwplayer('video').setup({
      'controlbar'  : 'bottom',
      'file'        : $video.data('sd-video-path') || $video.data('hd-video-path'),
      'flashplayer' : $video.data('flashplayer') || 'jwplayer/jwplayer.swf',
      'height'      : ($video.data('height') || 240) + jwplayerControlbarHeight,
      'image'       : $video.data('poster'),
      'skin'        : 'jwplayer/skin/epico.zip',
      'width'       : $video.data('width') || 320,
      /*'plugins'     : { 'gapro-2' : {
                          'trackstarts'     : true,
                          'trackpercentage' : true,
                          'trackseconds'    : true}}*/
    }).onBuffer(function(){
      ShowBufferingTips();
    }).onBufferChange(function(e){
      var bufferedTimeInSeconds  = this.getDuration() * this.getBuffer() / 100;
      PreloadPptsAndThumbs(ppts, GetTargetPptIndex(ppts, bufferedTimeInSeconds) + 2);
      //缓冲过程激活可用的所缩略图
      ActivatePptThumbs(bufferedTimeInSeconds);
    }).onMeta(
      ResizePlayer
    ).onPause(function(){
      //PausePpts();
      $('.slides-container .buttons .play').show();
      $('.slides-container .control-bar .play') .show()
                                                .siblings('.pause').hide();
      HideBufferingTips();
    }).onPlay(function(){
      //PlayPpts();
      $('.slides-container .buttons .play').hide();
      $('.slides-container .control-bar .play') .hide()
                                                .siblings('.pause').show();
      HideBufferingTips();
      //缓冲过程激活可用的所缩略图
      ActivatePptThumbs(this.getDuration() * this.getBuffer() / 100);
    }).onReady(function(){
      videoIsReady = true;
    }).onSeek(function(e){
      var targetTimeInSeconds = e.offset;
      //拖拽控制条滑块跳转至未缓冲到的时间点时不切换幻灯片
      if(targetTimeInSeconds > this.getDuration() * this.getBuffer() / 100){
        return;
      }
      if(manualSeeking['status']){
        if(manualSeeking['processingPhase'] === 2){
          return;
        }else{
          targetTimeInSeconds = manualSeeking['targetTimeInSeconds'];
          ++manualSeeking['processingPhase'];
        }
      }

      SwitchPptsAndThumbs(targetTimeInSeconds);
    }).onTime(function(e){
      var targetTimeInSeconds = e.position;
      //手动容错播放器跳转时间点的不准确性
      try{
      if(manualSeeking['status']){
        if(e.position < manualSeeking['targetTimeInSeconds']){
          return;
        }
        if(manualSeeking['processingPhase'] === 2){
          manualSeeking['status'] = false;
          return;
        }else{
          targetTimeInSeconds = manualSeeking['targetTimeInSeconds'];
          ++manualSeeking['processingPhase'];
        }
      }}catch(err){console.log(err);}
      //TogglePauseButton();
      //根据播放进度切换幻灯片和缩略图
      SwitchPptsAndThumbs(targetTimeInSeconds);
    });
    //自动缓冲
    //jwplayerVideo.play().pause(true);
    //切换幻灯片缩略图和课程信息
    $('#ppt-thumbs').closest('.tabs').find('.tab-title').click(function(e){
      var $this = $(this);
      if($this.hasClass('current')){
        return;
      }
      $this .addClass('current')
            .siblings().removeClass('current');
      $this.closest('.tabs').find('.tab-content').removeClass('current')
                            .filter(':eq(' + $this.index() + ')').addClass('current');
    });

    //点击幻灯片上层按钮控制播放和暂停
    $('.slides-container .buttons').click(function(e){
      if(!videoIsReady){
        return alert("视频文件下载中，请稍后点击播放按钮。");
      }
      var $playButton       = $(this).find('.play'),
          playButtonClicked = $playButton.is(':visible'),
          videoIsBuffering  = jwplayerVideo.getState() === 'BUFFERING';
      if(playButtonClicked){
        $playButton.hide();
        HideBufferingTips();
      }else{
        $playButton.show();
        videoIsBuffering && ShowBufferingTips();
      }
      jwplayerVideo.play(playButtonClicked);
    });
    //点击幻灯片下方控制条
    $('.slides-container .control-bar .prev').click(function(){
      $pptThumbsList.find('li.current').prev().click();
    });
    $('.slides-container .control-bar .next').click(function(){
      $pptThumbsList.find('li.current').next().click();
    });
    $('.slides-container .control-bar .play').click(function(){
      jwplayerVideo.play(true);
    });
    $('.slides-container .control-bar .pause').click(function(){
      jwplayerVideo.pause(true);
    });
    //缩略图悬停状态
    if(!touchableDevice){
      $pptThumbsList.on('mouseenter', 'li', function(){
                      $(this).addClass('hover').siblings().removeClass('hover');})
                    .on('mouseleave', 'li', function(){
                      $(this).removeClass('hover')});
    }
    //点击缩略图切换幻灯片和视频时间点
    $pptThumbsList.on('click', 'li.clickable', function(){
      var targetTimeInSeconds = ppts[$(this).index()][0];
      manualSeeking = { 'status'              : true,
                        'processingPhase'     : 0,
                        'targetTimeInSeconds' : targetTimeInSeconds};
      jwplayerVideo.seek(targetTimeInSeconds).play(true);
    });
    //分享控件
    $('.slides-container').append(jiaThisHtml);
  }else{
    jwplayer('video').setup({
      'controlbar'  : 'bottom',
      'file'        : $video.data('sd-video-path') || $video.data('hd-video-path'),
      'flashplayer' : $video.data('flashplayer') || 'jwplayer/jwplayer.swf',
      'height'      : ($video.data('height') || 720) + jwplayerControlbarHeight,
      'image'       : $video.data('poster'),
      'skin'        : 'jwplayer/skin/epico.zip',
      'width'       : $video.data('width') || 960,
      'events'      : { 'onTime' : ResizePlayer},
      /*'plugins'     : { 'gapro-2' : {
                          'trackstarts'     : true,
                          'trackpercentage' : true,
                          'trackseconds'    : true}}*/
    });

  }

});
