/**
 * Created by hxl on 2016/1/25.
 */
;(function($){
    var LightBox=function(settings){
        var self=this;
        this.settings={
            speed:500
        };
        $.extend(this.settings,settings || {});
        //创建遮罩和弹出框
        this.popupMask=$('<div id="G-lightbox-mask">');
        this.popupWin=$('<div id="G-lightbox-popup">');
        //保存Body
        this.bodyNode=$(document.body);
        //渲染剩余的DOM，并且插入到BODY
        this.renderDOM();

        this.picViewArea=this.popupWin.find('div.lightbox-pic-view');//图片预览区域
        this.popupPic=this.popupWin.find('img.lightbox-image');//图片
        this.picCaptionArea=this.popupWin.find('div.lightbox-pic-caption');//图片描述区域
        this.nextBtn=this.popupWin.find('span.lightbox-next-btn');
        this.prevBtn=this.popupWin.find('span.lightbox-prev-btn');
        this.captionText=this.popupWin.find('p.lightbox-pic-desc');//图片描述
        this.currentIndex=this.popupWin.find('span.lightbox-of-index');//图片当前索引
        this.closeBtn=this.popupWin.find('span.lightbox-close-btn');
        //准备开发事件委托，获取数据
        this.groupName=null;
        this.groupData=[];//放置同一组数据
        this.bodyNode.delegate('.js-lightbox,*[data-role=lightbox]','click',function(e){
            //阻止事件冒泡
            e.stopPropagation();
            var currentGroupName =$(this).attr('data-group');
            if(currentGroupName !=self.groupName){//如果点击的图片与当前不在同一组则获得该组中的图片信息
                self.groupName=currentGroupName;
                //根据当前组名获取同一组数据
                self.getGroup();
            };
            //初始化弹出框
            self.initPopup($(this));
        });
        //关闭弹出
        this.popupMask.click(function(){
            $(this).fadeOut();
            self.popupWin.fadeOut();
            self.clear=false;//关闭时再让其为false
        });
        this.closeBtn.click(function(){
            self.popupMask.fadeOut();
            self.popupWin.fadeOut();
            self.clear=false;
        });
        //绑定前后切换按钮事件
        this.flag=true;//做一标识，防止双击时打乱了index
        this.nextBtn.hover(function(){
           if(!$(this).hasClass('disabled')&&self.groupData.length>1){
               $(this).addClass('lightbox-next-btn-show');
           };
        },function(){
            if(!$(this).hasClass('disabled')&&self.groupData.length>1){
                $(this).removeClass('lightbox-next-btn-show');
            }
        }).click(function(e){
           if(!$(this).hasClass('disabled')&&self.flag&&self.groupData.length>1){
               self.flag=false;
               e.stopPropagation();
               self.goto('next');
           };
        });
        this.prevBtn.hover(function(){
            if(!$(this).hasClass('disabled')&&self.groupData.length>1){
                $(this).addClass('lightbox-prev-btn-show');
            };
        },function(){
            if(!$(this).hasClass('disabled')&&self.groupData.length>1){
                $(this).removeClass('lightbox-prev-btn-show');
            }
        }).click(function(e){
            if(!$(this).hasClass('disabled')&&self.flag&&self.groupData.length>1){
                self.flag=false;
                e.stopPropagation();
                self.goto('prev');
            };
        });
        //判断是否是IE6
        this.isIE6=/MSIE 6.0/gi.test(window.navigator.userAgent);
        //绑定窗口调整事件
        var timer=null;
        $(window).resize(function(){
            //当图片关闭后窗口再改变时图片不会再变（看控制台）
            if(self.clear){
                window.clearTimeout(timer);
                timer=window.setTimeout(function(){
                    self.loadPicSize(self.groupData[self.index].src);//重新加载图片
                },500);//500ms再重新加载图片
                //窗口变化时实时的改变IE6下遮罩层的宽高
                if(self.isIE6){
                    self.popupMask.css({
                        windth:$(window).width(),
                        height:$(window).height()
                    });
                }
            }
        }).keyup(function(e){//绑定键盘上下左右键事件
            var keyValue= e.which;
            if(self.clear){
                if(keyValue==38 || keyValue ==37){
                    self.prevBtn.click();//如为向上或向左键，则执行向前按钮的事件
                }else if(keyValue==40 || keyValue==39){
                    self.nextBtn.click();
                }
            }
        });
        //如果是IE6,仍然要实时设置遮罩层的高度
        if(this.isIE6){
            $(window).scroll(function(){
                self.popupMask.css('top',$(window).scrollTop());
            })
        }
    };
    LightBox.prototype={
        //点击上下按钮需要做的操作
        goto:function(dir){
            if(dir==='next'){
                this.index++;//如果索引大于等于图片个数则让按钮不可用且不可见
                if(this.index>=this.groupData.length-1){
                    this.nextBtn.addClass('disabled').removeClass('lightbox-next-btn-show');
                }
                if(this.index != 0){//如果索引不为0，则让pre按钮可用
                    this.prevBtn.removeClass('disabled');
                }
                //拿下一个要显示的图片的地址
                var src=this.groupData[this.index].src;
                this.loadPicSize(src);
            }else if(dir==='prev'){
                this.index--;
                if(this.index<=0){
                    this.prevBtn.addClass('disabled').removeClass('lightbox-prev-btn-show');
                };
                if(this.index !=this.groupData.length-1){
                    this.nextBtn.removeClass('disabled');
                };
                var src=this.groupData[this.index].src;
                this.loadPicSize(src);
            }
        },
        //获取图片尺寸
        loadPicSize:function(sourceSrc){
            var self=this;
            self.popupPic.css({width:'auto',height:'auto'}).hide();//每次要把上次的宽高清空
            this.picCaptionArea.hide();//切换图片时，图片未加载完成，下面的文字先隐藏
            //调用函数：监控图片是否加载完成
            this.preLoadImg(sourceSrc,function(){
                self.popupPic.attr('src',sourceSrc);
                var picWidth=self.popupPic.width();
                var picHeight=self.popupPic.height();
               self.changePic(picWidth,picHeight);
            });
            //设置描述文字和当前索引
            this.captionText.text(this.groupData[this.index].caption);
            this.currentIndex.text('当前索引:'+(this.index+1)+' of '+this.groupData.length);
        },
        //获得图片的宽高
        changePic:function(width,height){
            var self=this;
            var winWidth=$(window).width();
            var winHeight=$(window).height();
            //如果图片的宽高大于浏览器视口的宽高比例，查看是否溢出
            var scale=Math.min(winWidth/(width+10),winHeight/(height+10),1);//边框为10
            width=width*scale;//如果图片太大则只显示限定比例后的宽高
            height=height*scale;
            this.picViewArea.animate({
                width:width-10,//两边有5px边框
                height:height-10
            },self.settings.speed);

            var top=(winHeight-height)/2;
            if(this.isIE6){
                top+=$(window).scrollTop();
            }
            this.popupWin.animate({
                width:width,
                height:height,
                marginLeft:-(width/2),//仍然需要使图片处于视口的正中央
                top:top
            },self.settings.speed,function(){
                self.popupPic.css({
                    width:width-10,
                    height:height-10
                }).fadeIn();
                self.picCaptionArea.fadeIn();
                self.flag=true;//图片做完动画再改变标识值
                self.clear=true;
            });
        },
        //监控图片是否加载完成
        preLoadImg:function(src,callback){
            var img=new Image();
            if(!!window.ActiveXObject){
                img.onreadystatechange=function(){
                    if(this.readyState=='complete'){
                        callback();
                    };
                };
            }else{
                img.onload=function(){
                    callback();
                }
            }
            img.src=src;
        },
        //显示遮罩层及弹出层
        showMaskAndPopup:function(sourceSrc,currentId){
            var self=this;
            this.popupPic.hide();
            this.picCaptionArea.hide();

            //获得视口的宽与高
            var winWidth=$(window).width();
            var winHeight=$(window).height();
            //设置图片预览区域（弹出层）大小为视口宽高的一半
            this.picViewArea.css({width:winWidth/2,height:winHeight/2});
            //设置IE6下的遮罩层
            if(this.isIE6){
                var scrollTop=$(window).scrollTop();
                this.popupMask.css({
                    width:winWidth,
                    height:winHeight,
                    top:scrollTop
                })
            }
            this.popupMask.fadeIn();//遮罩层弹出
            this.popupWin.fadeIn();//弹出框弹出
            var viewHeight=winHeight/2+10;//因为CSS中设置了弹出层有5像素的边框
            var topAnimate=(winHeight-viewHeight)/2;
            //设置弹出层的水平垂直居中及动画效果
            this.popupWin.css({
                width:winWidth/2+10,//有5像素的边框
                height:winHeight/2+10,
                marginLeft:-(winWidth/2+10)/2,//水平居中
                top:(this.isIE6?-(winHeight+scrollTop):-viewHeight)//如果为IE6则高度还要加上滚动条滚动的高度
            }).animate({
                top:(this.isIE6?(topAnimate+scrollTop):topAnimate)},
                self.settings.speed,function(){
                self.loadPicSize(sourceSrc);
            });
            this.index=this.getIndexOf(currentId);
            var groupDataLength=this.groupData.length;
            if(groupDataLength>1){
                if(this.index ===0){
                    this.prevBtn.addClass('disabled');
                    this.nextBtn.removeClass('disabled');
                }else if(this.index===groupDataLength-1){
                    this.nextBtn.addClass('disabled');
                    this.prevBtn.removeClass('disabled');
                }else{
                    this.nextBtn.removeClass('disabled');
                    this.prevBtn.removeClass('disabled');
                }
            }else{//如果一组中只有一个图片时
                this.prevBtn.addClass('disabled');
                this.nextBtn.addClass('disabled');
            }

        },
        getIndexOf:function(currentId){
            var index=0;
            $(this.groupData).each(function(i){
                index=i;
                if(this.id===currentId){
                    return false;
                };
            });
            return index;
        },
        //初始化弹出框
        initPopup:function(currentObj){
            var self=this;
            //获得当前被点击图片的src及id,知道ID以便来确定是否可以有前后按钮
            sourceSrc=currentObj.attr('data-source');
            currentId=currentObj.attr('data-id');
            this.showMaskAndPopup(sourceSrc,currentId);//显示遮罩层及弹出层
        },
        //获得每组中图片信息
        getGroup:function(){
          var self=this;
            //根据当前组别名称获取页面中所有相同组别的对象
            var groupList=this.bodyNode.find('*[data-group='+this.groupName+']');
            //清空数据，以便存放下一组图片
            self.groupData.length=0;
            //把每一组的图片都放入groupData中
            groupList.each(function(){
                self.groupData.push({
                    src:$(this).attr('data-source'),
                    id:$(this).attr('data-id'),
                    caption:$(this).attr('data-caption')
                })
            })
        },
        renderDOM:function(){
            var strDom='<div class="lightbox-pic-view">'+
                            '<span class="lightbox-btn lightbox-prev-btn lightbox-prev-btn-show"></span>'+
                            '<img src="images/2-2.jpg" alt="" class="lightbox-image" width="100%"/>'+
                            '<span class="lightbox-btn lightbox-next-btn lightbox-next-btn-show"></span> '+
                        '</div>'+
                        '<div class="lightbox-pic-caption">'+
                            '<div class="lightbox-caption-area">'+
                                '<p class="lightbox-pic-desc">图片标题</p>'+
                                '<span class="lightbox-of-index">当前索引：1 of 4</span>'+
                            '</div>'+
                            '<span class="lightbox-close-btn"></span>'+
                        '</div>'
            //插入到this.popupWin
            this.popupWin.html(strDom);
            //把遮罩和弹出框插入到BODY
            this.bodyNode.append(this.popupMask,this.popupWin);
        }
    };
    window['LightBox']=LightBox;
})(jQuery)	
