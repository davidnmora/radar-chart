/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////

// todo: probably a better way than mutating this (ie set a class prop)
let CONFIG_PROPERTIES = {
	w: 600,				//Width of the circle
	h: 600,				//Height of the circle
	margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
	levels: 3,				//How many levels or inner circles should there be drawn
	maxValue: 0, 			//What is the value that the biggest circle will represent
	labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
	wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
	opacityArea: 0.35, 	//The opacity of the area of the blob
	dotRadius: 4, 			//The size of the colored circles of each blog
	opacityCircles: 0.1, 	//The opacity of the circles of each blob
	strokeWidth: 2, 		//The width of the stroke around each blob
	roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
	// color: REQUIRED	//Color function
};

function RadarChart(id, data, options) {
	
	CONFIG_PROPERTIES = {
		...CONFIG_PROPERTIES,
		...options,
	}
	
	CONFIG_PROPERTIES = {
		...CONFIG_PROPERTIES,
		radius: Math.min(CONFIG_PROPERTIES.w/2, CONFIG_PROPERTIES.h/2), 	//Radius of the outermost circle
	}
	//If the supplied maxValue is smaller than the actual one, replace by the max in the data
	var maxValue = Math.max(CONFIG_PROPERTIES.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
	
	var	total = data[0].length,					//The number of different axes
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
	
	//Scale for the radius
	var rScale = d3.scaleLinear()
		.range([0, CONFIG_PROPERTIES.radius])
		.domain([0, maxValue]);
	
	// TODO: this should be a class which takes in seed values
	const radialUtils = {
		getRadius: d => rScale(d.value),
		xLocationFn: (scaleFactor = 1, dIgnored = false) => (d, i) => rScale(scaleFactor * (dIgnored ? 1 : d.value)) *  Math.cos(angleSlice * i - Math.PI/2),
		yLocationFn: (scaleFactor = 1, dIgnored = false) => (d, i) => rScale(scaleFactor * (dIgnored ? 1 : d.value)) *  Math.sin(angleSlice * i - Math.PI/2),
		radialPathGeneratorSansRadius: () => {
			return d3.lineRadial()
				.curve(d3.curveMonotoneX)
				.angle((d,i) => i * angleSlice)
			// just add .radius()!
		}
	}
	
	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////
	
	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();
	
	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
		.attr("width",  CONFIG_PROPERTIES.w + CONFIG_PROPERTIES.margin.left + CONFIG_PROPERTIES.margin.right)
		.attr("height", CONFIG_PROPERTIES.h + CONFIG_PROPERTIES.margin.top + CONFIG_PROPERTIES.margin.bottom)
		.attr("class", "radar"+id);
	//Append a g element
	var g = svg.append("g")
		.attr("transform", "translate(" + (CONFIG_PROPERTIES.w/2 + CONFIG_PROPERTIES.margin.left) + "," + (CONFIG_PROPERTIES.h/2 + CONFIG_PROPERTIES.margin.top) + ")");
	
	/////////////////////////////////////////////////////////
	////////// Glow filter for some extra pizzazz ///////////
	/////////////////////////////////////////////////////////
	
	//Filter for the outside glow
	var filter = g.append('defs').append('filter').attr('id','glow'),
		feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
		feMerge = filter.append('feMerge'),
		feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
		feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');
	
	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////
	
	//Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");
	
	//Draw the background circles
	axisGrid.selectAll(".levels")
		.data(d3.range(1,(CONFIG_PROPERTIES.levels+1)).reverse())
		.enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function(d, i){return CONFIG_PROPERTIES.radius/CONFIG_PROPERTIES.levels*d;})
		.style("fill", "#CDCDCD")
		.style("stroke", "none") // #CDCDCD
		.style("fill-opacity", CONFIG_PROPERTIES.opacityCircles)
		.style("filter" , "url(#glow)");
	
	//Text indicating at what % each level is
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1,(CONFIG_PROPERTIES.levels+1)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", 4)
		.attr("y", function(d){return -d*CONFIG_PROPERTIES.radius/CONFIG_PROPERTIES.levels;})
		.attr("dy", "0.4em")
		.style("font-size", "10px")
		.attr("fill", "#737373")
		.text(d => maxValue * d / CONFIG_PROPERTIES.levels);
	
	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////
	
	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(data[0].map(d => d.axis))
		.enter()
		.append("g")
		.attr("class", "axis");
	//Append the lines
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", radialUtils.xLocationFn(maxValue, true))
		.attr("y2", radialUtils.yLocationFn(maxValue, true))
		.attr("class", "line")
		.style("stroke", "white")
		.style("stroke-width", "2px");
	
	//Append the labels at each axis
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "11px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", radialUtils.xLocationFn(maxValue * CONFIG_PROPERTIES.labelFactor, true))
		.attr("y", radialUtils.yLocationFn(maxValue * CONFIG_PROPERTIES.labelFactor, true))
		.text(function(d){return d})
		.call(utils.wrap, CONFIG_PROPERTIES.wrapWidth);
	
	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	
	//The radial line function
	const radarLinePreDataDefinedRadius = radialUtils.radialPathGeneratorSansRadius().radius(10)
	
	setTimeout(() => {
		const newLine = radialUtils.radialPathGeneratorSansRadius().radius(radialUtils.getRadius)

		d3.selectAll('.radarArea, .radarStroke')
			.transition().duration(2000)
			.attr("d", d => newLine(d))

	}, 400)
	
	// if(CONFIG_PROPERTIES.roundStrokes) {
	// 	radarLinePreDataDefinedRadius.curve(d3.curveCardinalClosed)
	// }
	
	//Create a wrapper for the blobs
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper");
	
	//Append the backgrounds
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d,i) { return radarLinePreDataDefinedRadius(d); })
		.style("fill", function(d,i) { return CONFIG_PROPERTIES.color(i); })
		.style("fill-opacity", CONFIG_PROPERTIES.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1);
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", CONFIG_PROPERTIES.opacityArea);
		});
	
	//Create the outlines
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLinePreDataDefinedRadius(d); })
		.style("stroke-width", CONFIG_PROPERTIES.strokeWidth + "px")
		.style("stroke", function(d,i) { return CONFIG_PROPERTIES.color(i); })
		.style("fill", "none")
		.style("filter" , "url(#glow)");
	
	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", CONFIG_PROPERTIES.dotRadius)
		.attr("cx", radialUtils.xLocationFn())
		.attr("cy", radialUtils.yLocationFn())
		.style("fill", function(d,i,j) { return CONFIG_PROPERTIES.color(j); })
		.style("fill-opacity", 0.8);
	
	/////////////////////////////////////////////////////////
	//////// Append circles for tooltip at vertex ///////////
	/////////////////////////////////////////////////////////
	
	//Wrapper for the circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper");
	
	//Append a set of circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarBlobVertexCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarBlobVertexCircle")
		.attr("r", CONFIG_PROPERTIES.dotRadius*1.5)
		.attr("cx", radialUtils.xLocationFn(CONFIG_PROPERTIES.maxValue))
		.attr("cy", radialUtils.yLocationFn(CONFIG_PROPERTIES.maxValue))
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;
			
			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(d.value)
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});
	
	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0)
		.style("font-size", 24)
	
}//RadarChart
