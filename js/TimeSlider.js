(function ($, window, document, undefined) {
    var TimeSlider = function (parent, params) {
        this.parentbox = parent;
        this.elements = {};
        this.times = {};
        this.defaults = {
            cunit: "hour",
            csplitnum: 12, /*每一大段分的小段数，此处是将1小时分为12段，每段5分钟*/
            leftcnum: 3, /*当前时间左边的大段数*/
            rightcnum: 12, /*当前时间右边的大段数*/
            playintervel:500,
        };
        this.params = $.extend({}, this.defaults, params);
    }

    TimeSlider.prototype = {
        init: function (callback) {
            this.elements.controlpanel = $("<div class='controlpanel'></div>");
            this.elements.sliderbox = $("<div class='sliderbox'></div>");
            this.parentbox.append(this.elements.controlpanel);
            this.parentbox.append(this.elements.sliderbox);

            this.params.bintime = 60 / this.params.csplitnum;
            this.params.total = this.elements.sliderbox.width();
            this.params.celllen = this.params.total / (this.params.leftcnum + this.params.rightcnum);
            this.params.binlen = this.params.celllen / this.params.csplitnum;
            this.initTime();
            this.creatControlPanel();
            this.createSliderBar();
            this.createShowBar();
            this.initSliderEvents(callback);
            this.initShowBarEvents(callback);
            this.initControlEvents(callback);
        },

        creatControlPanel: function () {
            this.elements.playbox = $("<li class='playbox'><a title='播放'></a></li>")
            this.elements.pausebox = $("<li class='pausebox'><a title='暂停'></a></li>")
            this.elements.forwardbox = forwardbox = $("<li class='forwardbox'><a title='下一时次'></a><a title='下一时次'></a></li>")
            this.elements.backwardbox = $("<li class='backwardbox'><a title='上一时次'></a><a title='上一时次'></a></li>")
            this.elements.controlpanel.append(this.elements.playbox);
            this.elements.controlpanel.append(this.elements.pausebox);
            this.elements.controlpanel.append(this.elements.backwardbox);
            this.elements.controlpanel.append(this.elements.forwardbox);
        },

        //创建点击进度条区域
        createSliderBar: function () {
            //构造页面元素
            var curbins = (this.times.curtime.getTime()-this.times.starttime.getTime())/60000/ this.params.bintime;
            var curlen = curbins * this.params.binlen;

            var baset = this.times.curtime;
            var timeStr = baset.getHours() + (baset.getMinutes() < 10 ? ":0" : ":")
                + baset.getMinutes();

            this.elements.sliderbar = $("<div class='sliderbar'></div>");
            this.elements.growLine = $("<div class='growline'></div>");
            this.elements.basepos = $("<div class='basepos'></div>");
            this.elements.staticLine = $("<div class='staticline'></div>")
                .append(this.elements.basepos);
            this.elements.clickLine = $("<div class='clickline'></div>");
            this.elements.datebox = $("<div class='datebox'></div>")
                .append($("<div></div>").append(timeStr))
                .append("<div class='datebox-trangle-bottom'></div>");
            this.elements.timetipbox = $("<div class='timetipbox'></div>")
                .append($("<div></div>").append(timeStr))
                .append("<div class='timetip-trangle-bottom'></div>");
            this.elements.sliderbox.append(this.elements.sliderbar);
            this.elements.sliderbar.append(this.elements.growLine);
            this.elements.sliderbar.append(this.elements.staticLine);
            this.elements.sliderbar.append(this.elements.clickLine);
            this.elements.sliderbar.append(this.elements.datebox);
            this.elements.sliderbar.append(this.elements.timetipbox);

            this.elements.basepos.css("left", curlen - 2 + "px");
            this.elements.datebox.css("left", curlen + "px");
            this.elements.timetipbox.css("left", curlen + "px");
            this.elements.growLine.width(curlen);
        },

        //创建时间按钮区域
        createShowBar: function () {
            var num = this.params.leftcnum + this.params.rightcnum;
            this.elements.showbar = $("<div class='showbar'></div>");
            this.elements.sliderbox.append(this.elements.showbar);
            this.elements.showcells = [];
            for (var i = 0; i < num; i++) {
                this.elements.showcells[i] = $("<div class='showcell'></div>");
                var celltime = new Date(this.times.starttime);
                celltime.setHours(celltime.getHours() + i);
                this.elements.showcells[i].time = new Date(celltime);
                this.elements.showcells[i].index = i;
                this.elements.showcells[i].text(celltime.getDate() + "日" + celltime.getHours() + "时");
                this.elements.showbar.append(this.elements.showcells[i]);
            }
        },

        initControlEvents: function (callback) {
            this.elements.forwardbox.click({
                timeslider: this,
            }, function (e) {
                var time = new Date(e.data.timeslider.times.curtime);
                time.setMinutes(time.getMinutes() + e.data.timeslider.params.bintime);
                if (time > e.data.timeslider.times.endtime)
                    return;
                e.data.timeslider.timeChanged(time, e.data.timeslider.times
                    , e.data.timeslider.params, e.data.timeslider.elements, callback);
            });

            this.elements.backwardbox.click({
                timeslider: this,
            }, function (e) {
                var time = new Date(e.data.timeslider.times.curtime);
                time.setMinutes(time.getMinutes() - e.data.timeslider.params.bintime);
                if (time < e.data.timeslider.times.starttime)
                    return;
                e.data.timeslider.timeChanged(time, e.data.timeslider.times
                    , e.data.timeslider.params, e.data.timeslider.elements, callback);
            });

            this.elements.playbox.click({
                timeslider: this,
            }, function (e) {
                window.clearInterval(e.data.timeslider.timer);
                e.data.timeslider.timer = window.setInterval(function(){
                    var time = new Date(e.data.timeslider.times.curtime);
                    time.setMinutes(time.getMinutes() + e.data.timeslider.params.bintime);
                    if (time > e.data.timeslider.times.endtime)
                        time.setTime(e.data.timeslider.times.starttime.getTime());
                    e.data.timeslider.timeChanged(time, e.data.timeslider.times
                        , e.data.timeslider.params, e.data.timeslider.elements, callback);
                },e.data.timeslider.params.playintervel);
            });

            this.elements.pausebox.click({
                timeslider: this,
            }, function (e) {
                e.data.timeslider.elements.pausebox.attr("disabled",true);
                window.clearInterval(e.data.timeslider.timer);
            });
        },

        initShowBarEvents: function (callback) {
            for (index in this.elements.showcells) {
                var showcell = this.elements.showcells[index];
                showcell.click({
                    timeslider: this,
                    time: showcell.time
                }, function (e) {
                    e.data.timeslider.timeChanged(e.data.time, e.data.timeslider.times
                        , e.data.timeslider.params, e.data.timeslider.elements, callback);
                });
            }
        },

        initSliderEvents: function (callback) {
            //添加时间轴点击事件
            this.elements.clickLine.click({
                timeslider: this
            }, function (e) {
                e.data.timeslider.posChanged(e.offsetX, e.data.timeslider.times
                    , e.data.timeslider.params, e.data.timeslider.elements, callback);
            });

            //以下三个配合完成在时间轴上移动的事件
            this.elements.clickLine.mouseenter({
                elements: this.elements,
                times: this.times
            }, function (e) {
                e.data.elements.timetipbox.animate({
                    opacity: 1
                }, "fast")
            });
            this.elements.clickLine.mouseleave({
                elements: this.elements,
                times: this.times
            }, function (e) {
                e.data.elements.timetipbox.animate({
                    opacity: 0
                }, "fast")
            });

            this.elements.clickLine.mousemove({
                elements: this.elements,
                times: this.times,
                params: this.params
            }, function (e) {
                var binlen = e.data.params.binlen;
                var nowPos = e.offsetX;
                var bins = Math.round(nowPos / binlen);
                var times = e.data.times;
                var time = new Date(times.starttime);
                time.setMinutes(times.starttime.getMinutes() + parseInt(e.data.params.bintime * bins));
                var timeStr = time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes();
                if (Math.abs(e.data.elements.growLine.width() - nowPos) < 54) {
                    e.data.elements.timetipbox.css("top", "-7em")
                } else {
                    e.data.elements.timetipbox.css("top", "-4em")
                }
                $(e.data.elements.timetipbox.children()[0]).text(timeStr);
                e.data.elements.timetipbox.css("left", bins * binlen + "px")
            });
        },

        initTime: function () {
            if (this.params.basetime == undefined) {
                this.times.basetime = new Date();
            } else {
                this.times.basetime = this.params.basetime;
            }
            var bins = parseInt(this.times.basetime.getMinutes()/this.params.bintime);
            this.times.basetime.setMinutes(bins * this.params.bintime); //滑块初始化的时间
            this.times.basetime.setSeconds(0);

            if (this.params.curtime == undefined) {//当前滑块的位置时间
                this.times.curtime = this.times.basetime;
            } else {
                this.times.curtime = this.params.curtime;
            }



            this.times.starttime = new Date(this.times.basetime);
            this.times.starttime.setHours(this.times.basetime.getHours() - this.params.leftcnum);
            this.times.starttime.setMinutes(0);
            this.times.endtime = new Date(this.times.basetime);
            this.times.endtime.setHours(this.times.basetime.getHours() + this.params.rightcnum);
            this.times.endtime.setMinutes(0);
        },

        timeChanged: function (time, times, params, elements, callback) {
            var ms = (time.getTime() - times.starttime.getTime()) / (60000);
            var bins = ms / params.bintime;
            var pos = bins * params.binlen;
            var timeStr = time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes();
            $(elements.datebox.children()[0]).text(timeStr);
            elements.growLine.animate({
                width: pos + "px"
            }, "fast");
            elements.datebox.animate({
                left: pos + "px"
            }, "fast");
            times.curtime = time;
            callback(time);
        },

        posChanged: function (pos, times, params, elements, callback) {
            var binlen = params.binlen;
            var bins = Math.round(pos / binlen);
            var time = new Date(times.starttime);
            time.setMinutes(times.starttime.getMinutes() + parseInt(params.bintime * bins));
            var timeStr = time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes();
            $(elements.datebox.children()[0]).text(timeStr);
            elements.growLine.animate({
                width: pos + "px"
            }, "fast");
            elements.datebox.animate({
                left: pos + "px"
            }, "fast");
            times.curtime = time;
            callback(time);
        }
    }

    $.fn.TimeSlider = function (params, callback) {
        return this.each(function () {
            var timeslider = new TimeSlider($(this), params);
            timeslider.init(callback);
        });
    };

})(jQuery, window, document);