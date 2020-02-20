/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////

const DEFAULT__CONFIG_PROPERTIES = {
	w: 300,				//Width of the circle
	h: 300,				//Height of the circle
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

class RadialUtilsManager {
	
	constructor(data, options) {
		this._CONFIG_PROPERTIES = {
			...DEFAULT__CONFIG_PROPERTIES,
			...options,
			
			radius: (options.w || DEFAULT__CONFIG_PROPERTIES.w) / 2, 	//Radius of the outermost circle
			angleSlice: Math.PI * 2 / data[0].length,		//The width in radians of each "slice"
			maxValue: Math.max(
				options.maxValue || DEFAULT__CONFIG_PROPERTIES.maxValue,
				d3.max(
					data, i => d3.max(i.map(o => o.value))
				)
			), //If the supplied maxValue is smaller than the actual one, replace by the max in the data
		}
		
		const _radiusScale = d3.scaleLinear()
			.range([0, this._CONFIG_PROPERTIES.radius])
			.domain([0, this._CONFIG_PROPERTIES.maxValue]);
		
		this.getRadius = d => _radiusScale(d.value),
			this.xLocationFn = (scaleFactor = 1, dIgnored = false) => (d, i) => _radiusScale(scaleFactor * (dIgnored ? 1 : d.value)) *  Math.cos(this._CONFIG_PROPERTIES.angleSlice * i - Math.PI/2),
			this.yLocationFn = (scaleFactor = 1, dIgnored = false) => (d, i) => _radiusScale(scaleFactor * (dIgnored ? 1 : d.value)) *  Math.sin(this._CONFIG_PROPERTIES.angleSlice * i - Math.PI/2),
			this.radialPathGeneratorSansRadius = () => {
				return d3.lineRadial()
					.curve(d3.curveMonotoneX)
					.angle((d,i) => i * this._CONFIG_PROPERTIES.angleSlice)
				// just add .radius()!
			}
	}
	
	get config() {
		return this._CONFIG_PROPERTIES
	}
}

function RadarChart(id, data, options) {
	
	const radialUtils = new RadialUtilsManager(data, options)
	
	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////
	
	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();
	
	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
		.attr("width",  radialUtils.config.w + radialUtils.config.margin.left + radialUtils.config.margin.right)
		.attr("height", radialUtils.config.h + radialUtils.config.margin.top + radialUtils.config.margin.bottom)
		.attr("class", "radar"+id);
	//Append a g element
	var g = svg.append("g")
		.attr("transform", "translate(" + (radialUtils.config.w/2 + radialUtils.config.margin.left) + "," + (radialUtils.config.h/2 + radialUtils.config.margin.top) + ")");
	
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
		.data(d3.range(1,(radialUtils.config.levels+1)).reverse())
		.enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function(d, i){return radialUtils.config.radius/radialUtils.config.levels*d;})
		.style("fill", "#CDCDCD")
		.style("stroke", "none") // #CDCDCD
		.style("fill-opacity", radialUtils.config.opacityCircles)
		.style("filter" , "url(#glow)");
	
	//Text indicating at what % each level is
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1,(radialUtils.config.levels+1)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", 4)
		.attr("y", function(d){return -d*radialUtils.config.radius/radialUtils.config.levels;})
		.attr("dy", "0.4em")
		.style("font-size", "10px")
		.attr("fill", "#737373")
		.text(d => radialUtils.config.maxValue * d / radialUtils.config.levels);
	
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
		.attr("x2", radialUtils.xLocationFn(radialUtils.config.maxValue, true))
		.attr("y2", radialUtils.yLocationFn(radialUtils.config.maxValue, true))
		.attr("class", "line")
		.style("stroke", "white")
		.style("stroke-width", "2px");
	
	//Append the labels at each axis
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "11px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", radialUtils.xLocationFn(radialUtils.config.maxValue * radialUtils.config.labelFactor, true))
		.attr("y", radialUtils.yLocationFn(radialUtils.config.maxValue * radialUtils.config.labelFactor, true))
		.text(function(d){return d})
		.call(utils.wrap, radialUtils.config.wrapWidth);
	
	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	
	//Create a wrapper for the blobs
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper");
	
	//Append the backgrounds
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", radialUtils.radialPathGeneratorSansRadius().radius(radialUtils.getRadius))
		.style("fill", function(d,i) { return radialUtils.config.color(i); })
		.style("fill-opacity", radialUtils.config.opacityArea)
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
				.style("fill-opacity", radialUtils.config.opacityArea);
		});
	
	//Create the outlines
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", radialUtils.radialPathGeneratorSansRadius().radius(radialUtils.getRadius))
		.style("stroke-width", radialUtils.config.strokeWidth + "px")
		.style("stroke", function(d,i) { return radialUtils.config.color(i); })
		.style("fill", "none")
		.style("filter" , "url(#glow)");
	
	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", radialUtils.config.dotRadius)
		.attr("cx", radialUtils.xLocationFn())
		.attr("cy", radialUtils.yLocationFn())
		.style("fill", function(d,i,j) { return radialUtils.config.color(j); })
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
		.attr("r", radialUtils.config.dotRadius*1.5)
		.attr("cx", radialUtils.xLocationFn(radialUtils.config.maxValue))
		.attr("cy", radialUtils.yLocationFn(radialUtils.config.maxValue))
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
