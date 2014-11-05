d3p = function(name,options) {	
	var ioe = this.isObject;
	/**  some default values **/
	this.version = "0.0.0";
	this.projections = {"mercator":d3.geo.mercator()};
	this.prefix = this.prefixMatch(["webkit", "ms", "Moz", "O"]);	
	
	var ops = (ioe(options)?options:{});
	this.center = (ioe(ops.center)?ops.center:[107.8, -6.1]);
	this.zoomLevel = (ioe(ops.zoomLevel)?ops.zoomLevel:1);
	this.layers = (ioe(ops.layers)?ops.layers:[{name:"blank"}]);
	this.style = {position:"absolute",width:"100%",height:"100%",top:"0px",left:"0px"};
	
	var lys = this.layers;				
	var prs = this.projections;	
	
	this.options = ops;	
	this.name = (ioe(name)?name:"map");
	
	this.projection = (ioe(ops.projection)?prs[ops.projection]:prs['mercator']);
	var pr = this.projection;
		
	var sy = this.style;
	ops.style = (ioe(ops.style)?ops.style:{});
	
	var del = {"right":"left","top":"bottom"};
	d3.keys(ops.style).forEach(function(d){
		d3.keys(del).forEach(function(dl){
			if (d == dl) 
			{
				delete sy[del[dl]];
			}
			else if (d == del[dl]) 
			{
				delete sy[dl];
			}
		});
		sy[d] = ops.style[d];		
	});	
		
	var divp = d3.select("#"+this.name);	
	if (divp[0][0] == null)
	{			
		divp = d3.select("body")
				.append("div")
				.attr("id", this.name);
	}
	
	var div = d3.select("#"+this.name+" .d3p-map");		
	if (div[0][0] == null)
	{			
		div = d3.select("#"+this.name)
				.append("div")
				.attr("class","d3p-map")
				.style({width:"100%",height:"100%",top:"0px",left:"0px"});				
	}
	div[0][0].d3p = this;		
	//this.div = div;					
			
	var tw = this.toPix(divp.style("width"),innerWidth);
	var th = this.toPix(divp.style("height"),innerHeight);					
	
	if (th == 0 || tw == 0)
	{						
		divp.style(sy);
	}	
	
	tw = this.toPix(divp.style("width"),innerWidth);
	th = this.toPix(divp.style("height"),innerHeight);
	
	this.size = [tw, th];
		
	this.tile = d3.geo.tile().size(this.size);
	var tl = this.tile;
	
	this.zoom = d3.behavior.zoom()    	
		.on("zoom", this.onZoom);
		//.on("zoomend", this.draw);
	
	this.events = {mousemove:this.mouseMove};
	
	var ev= this.events;	
	ops.events = (ioe(ops.events)?ops.events:{});					
	d3.keys(ops.events).forEach(function(d){
		ev[d] = ops.events[d];
	});		
	
	d3.keys(ev).forEach(function(d){		
		div.on(d,ev[d]);			
	});		
	
	var zm = this.zoom;
	/**  set zoom level range 0 - 19 **/
	zm.scaleExtent([1 << 9, 1 << 28]);
				
	div.call(this.zoom);
		
	this.addLayer(this);
	
	//this.draw(this);
	
	this.zoomTo(this.center,this.zoomLevel);		
		
	//this.zoomPointLevel(this.center,this.zoomLevel);		
	//this.onZoom(this);
};

d3p.prototype.isObject = function(object) {
	return (typeof object != "undefined");
};

d3p.prototype.isUrl = function(url) {	
   var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    try{
		http.send();
	}	
	catch(error) {
		//console.log("false");
	}
    return (http.status==200?true:false);
};

d3p.prototype.toPix = function(str,ref) {
	str += "";
	return str.substr(str.length-1) == "%"?parseInt(str.replace("%",""))/100*ref:parseInt(str.replace("px",""));	
};

d3p.prototype.lon2xtile = function(lon,zoom)
{ 
	return (lon+180)/360*Math.pow(2,zoom);
};

d3p.prototype.lat2ytile = function(lat,zoom)
{ 
	return (1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom);
};

d3p.prototype.pix64 = function(n)
{ 
	return Math.floor((n-Math.floor(n))/1*64);
};

d3p.prototype.lonlat2tile = function(lonlat,zoom)
{	
	var x = this.lon2xtile(lonlat[0],zoom);
	var xp = this.pix64(x);	
	var y = this.lat2ytile(lonlat[1],zoom);
	var yp = this.pix64(y);	
	return [Math.floor(x),Math.floor(y),xp,yp]; 
};

d3p.prototype.matrix3d = function(scale, translate) {
	var k = scale / 256, r = scale % 1 ? Number : Math.round;
	return  "matrix3d(" + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1 ] + ")";		
};

d3p.prototype.prefixMatch = function(p) {
	var i = -1, n = p.length, s = document.body.style;
	while (++i < n) if (p[i] + "Transform" in s) return "-" + p[i].toLowerCase() + "-";
	return "";
};

d3p.prototype.formatLocation = function(p, k) {
	var format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
	return (p[1] < 0 ? format(-p[1]) + "°S" : format(p[1]) + "°N") + " "
			+ (p[0] < 0 ? format(-p[0]) + "°W" : format(p[0]) + "°E");
};

d3p.prototype.zoomTo = function(point,zoomLevel) {			
	var d3p = this;
	
	var pr = d3p.projection;
	var zm = d3p.zoom;	
	var sz = d3p.size;
								
	zm
		.scale(1 << (8+zoomLevel));		
		
	fx = Math.floor(d3p.lon2xtile(point[0],zoomLevel))-Math.pow(2,zoomLevel-1);
	fy = Math.floor(d3p.lat2ytile(point[1],zoomLevel))-Math.pow(2,zoomLevel-1);
		
	var dy = (d3p.lat2ytile(point[1],zoomLevel)-Math.floor(d3p.lat2ytile(point[1],zoomLevel)))*256+(256*fy);	
	var dx = (d3p.lon2xtile(point[0],zoomLevel)-Math.floor(d3p.lon2xtile(point[0],zoomLevel)))*256+(256*fx);	
	//console.log(point,[dx,dy],[fx,fy],pr(point),pr([0,0]));
	
	//zm.translate([-dx,-dy]);
	zm.translate([sz[0]/2-dx,sz[1]/2-dy]);	
	
	d3p.onZoom(d3p);
};

d3p.prototype.addLayer = function() {
	var d3p = this;
		
	this.layers.forEach(function(l) {		
			d3.select("#"+d3p.name+" .d3p-map").append("div")
					.attr("id", "d3p-layer-"+l.name)
					.attr("class", "d3p-layer d3p-layer-"+l.type+"");		
	});	
};

d3p.prototype.getUtfGrid = function(z,g) {
	var data = [];
	
	this.layers.forEach(function(l) {
		
		var t = d3.select("#d3p-layer-"+l.name+" #d3p-tile-"+z+'-'+g[0]+'-'+g[1]);
		if (t[0][0] != null)
		{  
			var str = t.attr('data');  
			var json = JSON.parse(str);   
			if (json != null)
			{		
				code = json.grid[g[3]].substr(g[2],1).charCodeAt(0);
				if (code >= 93) { code--};
				if (code >= 35) { code--};
				code -= 32;
				
				var d = json.data[json.keys[code]];
				data.push(d);				
			}
		}
	});
	return data;
	
};


d3p.prototype.mouseMove = function() {		
	
	var pr = this.d3p.projection;
	var ms = d3.mouse(this);		
	
	var z=Math.round(Math.max(Math.log(this.d3p.zoom.scale())/Math.LN2-8,0));
					  
	var text = "";		
	
	/** get utfgrid data **/
	var g = this.d3p.lonlat2tile(pr.invert(ms),z);	
	var ioe = this.d3p.isObject;
	
	var data = this.d3p.getUtfGrid(z,g);					
	data.forEach(function(D) {			
		if (ioe(D))
		{
			var tx = "";
			d3.keys(D).forEach(function(d){						
				tx += (tx == ""?"":", ")+D[d];
			});					
			text += tx+"<br>";
		}	
	});
			
	/** put some additional info such as zoom level or scale **/
	text += "Zoom Level "+z+" ("+this.d3p.zoom.scale()+")";
	
	var info = d3.select("#"+this.d3p.name+" .d3p-map .d3p-info");
	if (info[0][0] == null)
	{			
		info = d3.select("#"+this.d3p.name+" .d3p-map")
				.append("div")
				.attr("class", "d3p-info");
	}
	
	/** print mouse coordinate **/		
	info.html(text+"<br>"+this.d3p.formatLocation(pr.invert(ms), this.d3p.zoom.scale()));
};

d3p.prototype.onZoom = function(d3p) {	
	var d3p = (typeof d3p == "undefined"?this.d3p:d3p);			 
	    
    var sz = d3p.size; 
    var pr = d3p.projection; 
    var zm = d3p.zoom;
    
    var z=Math.round(Math.max(Math.log(zm.scale())/Math.LN2-8,0));	 	 
    
    pr.scale(zm.scale() / 2 / Math.PI)
      .translate(zm.translate());
     
    d3p.center = pr.invert([sz[0]/2,sz[1]/2]);  
	d3p.zoomLevel = z;
	d3p.draw(d3p);	
	
	//console.log(d3p.center);
};	

d3p.prototype.draw = function(d3p) {
	
	var d3p = (typeof d3p == "undefined"?this.d3p:d3p);	    
    
    var pr = d3p.projection;
    var tls = d3p.tile
				  .scale(d3p.zoom.scale())
				  .translate(d3p.zoom.translate())
				  ();                
       
    d3p.projection = pr;        
    
    var ioe = d3p.isObject;
    
    d3p.layers.forEach(function(l) {		
						
		var layer = d3.select("#"+d3p.name+" .d3p-map #d3p-layer-"+l.name);								
		
		
		var img = layer.style(d3p.prefix + "transform", d3p.matrix3d(tls.scale, tls.translate))					
					.selectAll(".d3p-tile")
					.data(d3p.tile, function(d) {						
						return d;
					});				
				
		//img.exit()
		//	.remove();
			
		img.enter()
			.append("img")
			.attr("class", function(d) { return "d3p-tile d3p-zoom-"+d[2];})
			.attr("id", function(d) { return "d3p-tile-"+d[2]+"-"+d[0]+"-"+d[1];})      
			.attr("src",function(d) { 
				if (ioe(l.urls))
				{					
					var url = false;					
					l.urls.forEach(function(u) {												
						
						if (!url)
						{
							u = u.replace("{z}",d[2]).replace("{x}",d[0]).replace("{y}",d[1]);													
						//	if (d3p.isUrl(u)) {
								url = u;
						//	}
						}
					});					
										
					if (l.type == "utfgrid")
					{												
						d3.text(url, function (str) {
							str = str.substring(5,str.length-1);							
							d3.select("#"+d3p.name+" .d3p-map #d3p-layer-"+l.name+" #d3p-tile-"+d[2]+"-"+d[0]+"-"+d[1]).attr("data",str);							
						})
						
						url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
					}
										
					return url;
					 
				}
				else
				{
					return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
				}					
			})
			.style("left", function(d) { return (d[0] << 8) + "px"; })            
			.style("top", function(d) { return (d[1] << 8) + "px"; })
			.each(function(d) { 		
				var img = d3.select(this);
				img.style("display","none");	
			});					
		
		layer
			.selectAll(".d3p-tile")
			.style("display","none");	    	    	    		
							
		tls.forEach(function(d){  				
			layer
				.selectAll(".d3p-zoom-"+d[2])
				.style("display","");								
		});   	

	});	
    							
};
