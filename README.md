d-trip
======

View the trip... map viewer based on d3.js. This just recompilation of awesome examples by Mike Bostock (http://bl.ocks.org/mbostock/raw/4132797/c58c40786e6b5bd64b2ff0c8f51b51b0e772c743/)

How to Start?
-------------

<p>
Add following code in your html:<br>
<code>
&lt;script src="d3.v3.min.js"&gt;&lt;/script&gt;<br>
&lt;script src="d3.geo.tile.v0.min.js">&lt;/script&gt;<br>
&lt;script src="d3p.js"&gt;&lt;/script&gt;<br>		
</code><br>
<br>
<code>
var options = {};
var map = new d3p("a-div-Id-or-map-name",options);
</code>
</p>

<p>
Available options:<br>
1. layers<br>
2. center<br>
3. zoomLevel<br>
4. events<br>
5. style<br>
</p>

<p>
Wants to zoom to certain lonlat with certain zoomlevel? Just:  map.zoomTo([lonlat],zoomlevel)
</p>

for complete example just see index.html or demo at http://cara.amilna.com/d3p/

