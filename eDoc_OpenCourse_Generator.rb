require 'rubygems'
require 'tk'
require 'fileutils'
require 'zip/zip'

$xml_state = 42
$slides_state = 42
$video_state = 42
$cover_inside_state = 42
Background ='#ededed'
title = TkVariable.new

def analyze_xml(xml)
  xml_content = File.read(xml)
  squence = xml_content.gsub("</T>\n<T>",'","').gsub("</T>\n</Time>",'"]').gsub("<?xml version='1.0' encoding='gb2312'?>\n<Time>\n<T>",'["')
  return squence
end

def folder_create(path)
  Dir.mkdir(path+'/edoc') if !File.directory?(path+'/edoc')
  Dir.mkdir(path+'/edoc/slides') if !File.directory?(path+'/edoc/slides')
  Dir.mkdir(path+'/edoc/src') if !File.directory?(path+'/edoc/src')
end

def copy_pack(path)
  FileUtils.cp_r Dir.pwd+'/edoc',path
end 

def index_html(path,title,description,xml_data,page)
  f = File.new("#{path}/edoc/index.html",'w')
  f.write(<<ABC 
  <!DOCTYPE html>
<html>
<head>
<meta charset='gb2312'>
<meta content='width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0' name='viewport'>
<meta content='yes' name='apple-mobile-web-app-capable'>
<link href="css/course.css" media="screen" rel="stylesheet" type="text/css" />
<style>
  /*<![CDATA[*/
    html{height:100%;min-height:100%;}
  /*]]>*/
</style>

<title>#{title}</title>
</head>
<body id='mobile'>
<div class='body-wrap'>
<div class='clearfix main-wrap video-and-slides'>
<div id='main'>
<div class='slides-container clearfix'>
<div class='slides-wrap clearfix clearfix'>
<ol data-timeline='#{xml_data}' id='ppts'>
<li class='first'><img src="slides/slides1.jpg" /></li>
</ol>
<div class='control-bar'>
<div class='prev'></div>
<div class='play'></div>
<div class='pause'></div>
<div class='next'></div>
<div class='pages'><span class='current-page'>1</span>/<span class='total-pages'>#{page}</span></div>
</div>
<div class='buttons'>
<div class='play' title='点击播放'></div>
<div class='buffer'><div class='bg'></div><div class='fg'>视频正在缓冲，请稍候</div></div>
</div>
</div>
</div>
</div>
<div id='aside'>
<div class='video-container'>
<div data-height='144' data-poster='src/cover.png' data-sd-video-path='src/SD.mp4' data-width='240' id='video'></div>
</div>
<div class='tabs'>
<ul class='tab-titles'>
<li class='tab-title'>课程信息</li>
<li class='tab-title current'>幻灯片控制</li>
</ul>
<ul class='tab-contents'>
<li class='tab-content'>
<div class='video-desc'>
<div class='subject'>
<p>
<label>讲题：</label>
<span>#{title}</span>
</p>
</div>
<div class='contents'>
<p>
<label>课程简介：</label>
<span>#{description}</span>
</p>
</div>
</div>
</li>
<li class='tab-content current'>
<div id='ppt-thumbs'>
<ol class='ppt-thumbs-list' data-clickable-title='点击缩略图切换至此页' data-current-title='您正在观看这一页' data-unavailable-title='课程视频暂时未缓冲到此处'>
<li class='first current'><img src='slides/slides1.jpg'></li>
</ol>
</div>
</li>
</ul>
</div>

</div>
</div>

<script src="js/jquery-1.7.1.js" type="text/javascript"></script>
<script src="jwplayer/jwplayer.js" type="text/javascript"></script>
<script src="js/slides.js" type="text/javascript"></script>
</div>
</body>
</html>
ABC
)
  f.close
end

def index_html_HD(path,title,description)
f = File.new("#{path}/edoc/index.html",'w')
  f.write(<<ABC 
<!DOCTYPE html>
<html>
<head>
<meta charset='gb2312'>
<meta content='width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0' name='viewport'>
<meta content='yes' name='apple-mobile-web-app-capable'>
<link href="css/course.css" media="screen" rel="stylesheet" type="text/css" />
<style>
  /*<![CDATA[*/
    html{height:100%;min-height:100%;}
  /*]]>*/
</style>

<title>#{title}</title>
</head>
<body id='mobile'>
<div class='body-wrap'>
<div class='clearfix main-wrap video-only'>
<div id='main'>
<div class='video-container'>
<div data-height='524' data-poster='src/cover.png' data-hd-video-path='src/HD_video.mp4' data-width='698' id='video'></div>
</div>
</div>
<div id='aside'>
<div class='video-desc'><div class='subject'>
<p>
<label>讲题：</label>
<span>#{title}</span>
</p>
</div>
<div class='contents'>
<p>
<label>课程简介：</label>
<span>#{description}</span>
</p>
</div>
</div>

</div>
</div>

<script src="js/jquery-1.7.1.js" type="text/javascript"></script>
<script src="jwplayer/jwplayer.js" type="text/javascript"></script>
<script src="js/slides.js" type="text/javascript"></script>
</div>
</body>
</html>
ABC
)
  f.close
end

def cp_video(video_path,dest_path)
  FileUtils.cp video_path, dest_path + '/edoc/src/SD.mp4'
end

def cp_video_HD(video_path,dest_path)
  FileUtils.cp video_path, dest_path + '/edoc/src/HD_video.mp4'
end

def cp_slides(slides_path,dest_path)
  Dir[slides_path + '/*.jpg'].each do |slide|
    FileUtils.cp slide, dest_path + '/edoc/slides/slides' + slide.sub(/^.+[^\d](\d+\.\S+)$/, "\\1")
  end
end

def cp_cover(outside,inside,dest_path)
  FileUtils.cp inside, dest_path + '/edoc/src/cover.png'
end

def generate_status
    if $video_state == 1 && $cover_inside_state == 1
      if $xml_state == $slides_state
        $generate_button.state = 'normal'
      else
        $generate_button.state = 'disabled'
      end
    else
      $generate_button.state = 'disabled'
    end
end

def edoc_zip(path)
  FileUtils.rm(path+'/edoc.zip') if File.exists?(path+'/edoc.zip')
  if $slides_state == 1
    Dir.chdir(path+'/edoc')
    input_filenames = Dir['assets/course/*.png']+Dir['slides/*.jpg']+['index.html','src/SD.mp4','src/cover.png','jwplayer/jwplayer.js','jwplayer/jwplayer.swf','jwplayer/skin/epico.zip','js/jquery-1.7.1.js','js/slides.js','css/course.css']
  else
    input_filenames = Dir['assets/course/*.png']+['index.html','src/HD_video.mp4','src/cover.png','jwplayer/jwplayer.js','jwplayer/jwplayer.swf','jwplayer/skin/epico.zip','js/jquery-1.7.1.js','js/slides.js','css/course.css']
  end
  zipfile_name = path + '/edoc.zip'
  Zip::ZipFile.open(zipfile_name,Zip::ZipFile::CREATE) do |zipfile|
    input_filenames.each do|filename|
      zipfile.add(filename,path + '/edoc/' + filename)
    end
  end
end

root = TkRoot.new do
  title "eDoc OpenCourse Generator"
  bg Background
  minsize(280,150)
end

Title = TkFrame.new(root){
  bg Background
  pack :side => 'top',:fill => 'both'
}
TkLabel.new(Title){
  bg Background
  text 'Title'
  width 22
  pack :side => 'left'
}
TkEntry.new(Title){
  text title
  width 23
  pack :side => 'left'
}

Description_frame = TkFrame.new(root){
  bg Background
  pack :side => 'top',:fill => 'both'
}
TkLabel.new(Description_frame){
  bg Background  
  text 'Description'
  width 22
  pack :side => 'left'
}
Description = TkText.new(Description_frame){
  width 19
  height 10
  borderwidth 3
  pack :side => 'left'
}
scroll_bar=TkScrollbar.new(Description_frame) do
  orient 'vertical'
  pack :fill=>'both',:side=>'left'
end
scroll_bar.command(proc { |*args|
  Description.yview(*args)
})
Description.yscrollcommand(proc { |first, last|
  scroll_bar.set(first, last)
})

xml_button = TkButton.new(root){
    bg Background
    text 'Xml'
    pack :side => 'top',:fill => 'both'
    compound "left"
    command{
      xml = Tk.getOpenFile
      if xml[-3,3] == "xml" && xml !=''
        $xml_squence = analyze_xml(xml)
        $page = $xml_squence.count('|')/3
        xml_button.bg = 'green'
        $xml_state = 1
        $slides_button.state = 'normal'
        generate_status
      else
        xml_button.bg = 'red'
        $xml_state = 42
        generate_status
      end
    }
}

$slides_button = TkButton.new(root){
    bg Background
    text 'Slides'
    pack :side => 'top',:fill => 'both'
    state 'disabled'
    command{
      $slides = Tk.chooseDirectory
      if $slides != ''
        $slides_button.bg = 'green'
        $slides_state = 1
        generate_status
      else
        $slides_button.bg = 'red'
        $slides_state = 42
        generate_status
      end
    }
}

video_button = TkButton.new(root){
    bg Background
    text 'Video'
    pack :side => 'top',:fill => 'both'
    command{
      $video = Tk.getOpenFile
      if $video[-3,3] == 'mp4' && $video !=''
        video_button.bg = 'green'
        $video_state = 1
        generate_status
      else
        video_button.bg = 'red'
        $video_state = 42
        generate_status
      end
    }
}


cover_inside_button = TkButton.new(root){
  text 'Cover'
  bg Background
  pack :side => 'top',:fill =>'both'
  command{
      $cover_inside = Tk.getOpenFile
      if $cover_inside != '' && $cover_inside[-3,3] == 'png'
        cover_inside_button.bg = 'green'
        $cover_inside_state = 1
        generate_status
      else
        cover_inside_button.bg = 'red'
        $cover_inside_state = 42
        generate_status
      end
    }
}

$generate_button = TkButton.new(root){
    bg Background
    text 'Generate'
    pack :side => 'bottom'
    state 'disabled'
    command{
      path = Tk.chooseDirectory
      if path != ''
        #puts $xml_squence
        #puts $page
        #puts $video
        #puts $slides
        #puts $cover_inside
        #puts $cover_outside
        #puts title.value
        folder_create(path)
        if $slides_state == 1
          #folder_create(path)
          index_html(path,title.value,Description.value,$xml_squence,$page)
          cp_video($video,path)
          cp_slides($slides,path)
          #cp_cover($cover_outside,$cover_inside,path)
          copy_pack(path)
        else #没有ppt
          #folder_create(path)
          index_html_HD(path,title.value,Description.value)
          cp_video_HD($video,path)
          #cp_cover($cover_outside,$cover_inside,path)
          copy_pack(path)
        end
        cp_cover($cover_outside,$cover_inside,path)
        edoc_zip(path)
        Tk::messageBox :message => 'Congratulations! Mission Complete!'
      end
    }
}

Tk.mainloop