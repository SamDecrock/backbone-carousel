App = {
	init: function() {
		console.log("page loaded");
		var appendcount = 0;
		var prependcount = 0;

		var carousel = new App.Carousel();
		$("#fuckingcontainer").empty();
		$("#fuckingcontainer").append(carousel.el); //add it to something

		carousel.appendView( new App.TestView( {model: new App.TestModel({title: "testview append " + ++appendcount})} ) );
		carousel.appendView( new App.TestView( {model: new App.TestModel({title: "testview append " + ++appendcount})} ) );
		carousel.appendView( new App.TestView( {model: new App.TestModel({title: "testview append " + ++appendcount})} ) );

		carousel.prependView( new App.TestView( {model: new App.TestModel({title: "testview prepend " + ++prependcount})} ) );
		carousel.prependView( new App.TestView( {model: new App.TestModel({title: "testview prepend " + ++prependcount})} ) );
		carousel.prependView( new App.TestView( {model: new App.TestModel({title: "testview prepend " + ++prependcount})} ) );


		$("#btnAppend").click(function (ev){
			console.log("clicked append");

			carousel.appendView( new App.TestView( {model: new App.TestModel({title: "testview append " + ++appendcount})} ) );
		});

		$("#btnPrepend").click(function (ev){
			console.log("clicked prepend");

			carousel.prependView( new App.TestView( {model: new App.TestModel({title: "testview prepend " + ++prependcount})} ) );
		});

		$("#btnResize").click(function (ev){
			console.log("resize prepend");

			$("#fuckingcontainer").width($("#fuckingcontainer").width() - 10);
			carousel.updateDimensions();
		});

	}
};

App.TestModel = Backbone.Model.extend({});


App.TestView = Backbone.View.extend({
	className: "testview",

	initialize: function(){
		this.render();
	},

	render: function(){
		this.$el.text(this.model.get('title'));
		this.$el.css('background-color', "#"+((1<<24)*Math.random()|0).toString(16));
		return this;
	}
});

App.Carousel = Backbone.View.extend({
	className: "carousel",

	panes: [], //will hold an object of panes containing the view en the reference to DOM element inside the carousel
	currentPane: 0, //will hold the current pane

	events: {
		'release': 'release',
		'dragleft': 'drag',
		'dragright': 'drag',
		'swipeleft': 'swipeleft',
		'swiperight': 'swiperight'
	},

	initialize: function(){
		this.render();

		this.updateDimensions();

		var self = this;
		$(window).on("load resize orientationchange", function() {
			self.updateDimensions.call(self);
		})

		console.log("adding hammer");
		this.$el.hammer({ drag_lock_to_axis: true });
	},

	render: function(){
		// list:
		var ul = document.createElement('ul');
		this.$el.append(ul);
		return this;
	},

	appendView: function(view, goToIt){
		var li = document.createElement('li');
		this.$("ul").append(li);
		this.panes.push({
			el: li,
			view: view
		});
		// ad el of view to li:
		$(li).append(view.el);
		this.updateDimensions();

		if(goToIt){
			var index = this.panes.length - 1;
			this.gotoPane(index);
		}
	},

	prependView: function(view, goToIt){
		var li = document.createElement('li');
		this.$("ul").prepend(li);
		this.panes.unshift({
			el: li,
			view: view
		});
		// ad el of view to li:
		$(li).append(view.el);
		this.updateDimensions();

		// if a pane is prepended, the index of the currentpane increaess
		this.gotoPane(this.currentPane+1, false);
	},

	updateDimensions: function(){
		this.$("ul").removeClass("animate");

		pane_width = this.$el.width();

		// every pane get's the width of the view (the carousel)
		this.$("ul>li").each(function (i, elem){
			$(elem).width(pane_width);
		});

		// the list containing al the panes gets the width of view * nr of panes
		this.$("ul").width(pane_width * this.$("ul>li").length);

		this.$("ul").addClass("animate");

		this.gotoPane(this.currentPane,false);
	},

	drag: function(ev){
        ev.gesture.preventDefault(); // disable browser scrolling
		console.log("drag: " + ev.gesture.deltaX);

		var pane_count = this.$("ul>li").length;
		var pane_width = this.$el.width();
		// stick to the finger
		var pane_offset = -this.currentPane * pane_width;

		var drag_offset = ev.gesture.deltaX;
		// slow down at the first and last pane
		if((this.currentPane == 0 && ev.gesture.direction == Hammer.DIRECTION_RIGHT) ||
			(this.currentPane == pane_count-1 && ev.gesture.direction == Hammer.DIRECTION_LEFT)) {
			drag_offset *= .4;
		}

		this.setContainerOffset(drag_offset + pane_offset);
	},


	swipeleft: function(ev){
		ev.gesture.preventDefault(); // disable browser scrolling
		console.log("swipeleft");
		this.slideFromRight();
		ev.gesture.stopDetect();
	},


	swiperight: function(ev){
		ev.gesture.preventDefault(); // disable browser scrolling
		console.log("swiperight");
		this.slideFromLeft();
		ev.gesture.stopDetect();
	},

	release: function(ev){
		ev.gesture.preventDefault(); // disable browser scrolling
		console.log("release");
		var pane_width = this.$el.width();
		console.log( Math.abs(ev.gesture.deltaX) );
		console.log( pane_width );
		// more then 50% moved, navigate
		if(Math.abs(ev.gesture.deltaX) > pane_width/2) {
			if(ev.gesture.direction == 'right') {
				console.log("slide to the right");
				this.slideFromLeft();
			} else {
				console.log("slide to the left");
				this.slideFromRight();
			}
		}
		else {
			this.gotoPane(this.currentPane, true);
		}
	},

	setContainerOffset: function(pixels, animate) {
		this.$("ul").removeClass("animate");

		if(animate) {
			this.$("ul").addClass("animate");
		}

		if(Modernizr.csstransforms3d) {
			console.log("translate3d");
			this.$("ul").css("transform", "translate3d("+ pixels +"px,0,0) scale3d(1,1,1)");
		}
		else if(Modernizr.csstransforms) {
			this.$("ul").css("transform", "translate("+ pixels +"px,0)");
		}
		else {
			this.$("ul").css("left", pixels+"px");
		}
	},

	gotoPane: function(index, animate) {
		var pane_count = this.$("ul>li").length;
		var pane_width = this.$el.width();

		// between the bounds
		index = Math.max(0, Math.min(index, pane_count-1));
		this.currentPane = index;

		var offset = -pane_width*this.currentPane;
		this.setContainerOffset(offset, animate);
	},

	setInitialView: function(view){
		if(this.layers.length == 1 && this.layers[0].panes.length == 0){
			this.layers[0].panes
			this.layers[0].panes.push(view);

			var li = $(createElement('li'));
		}
	},

	slideFromLeft: function(view){
		this.gotoPane( this.currentPane - 1, true );
	},

	slideFromRight: function(view){
		this.gotoPane( this.currentPane + 1, true );
	},

	slideOverFromLeft: function(view){

	},

	slideOverFromRight: function(view){

	},

	popUp: function(view){

	},

	back: function(){

	}
});

