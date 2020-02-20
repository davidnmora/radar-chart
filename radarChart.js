/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by David Mora ////////////////
////////////////// davidmora.us ///////////////////
/////////// Inspired by the code of Nadieh Bremer ///////////
//// .... who was inspired by the code of alangrafu /////////
/////////////////////////////////////////////////////////


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
		.attr("r", d => radialUtils.config.radius / radialUtils.config.levels * d)
		.style("fill", "#CDCDCD")
		.style("stroke", "none") // #CDCDCD
		.style("fill-opacity", radialUtils.config.opacityCircles)
	
	//Text indicating at what % each level is
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1,(radialUtils.config.levels+1)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", 4)
		.attr("y", d => -d * radialUtils.config.radius / radialUtils.config.levels)
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
		.text(d => d)
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
		.style("fill",(d, i) => radialUtils.config.color(i))
		.style("fill-opacity", radialUtils.config.opacityArea)
		.on('mouseover', function() {
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1);
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);
		})
		.on('mouseout', () => {
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
		.style("stroke", (d,i) => radialUtils.config.color(i))
		.style("fill", "none")
	
	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(d => d)
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", radialUtils.config.dotRadius)
		.attr("cx", radialUtils.xLocationFn())
		.attr("cy", radialUtils.yLocationFn())
		.style("fill", (d,i,j) => radialUtils.config.color(j))
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
		.data(d => d)
		.enter().append("circle")
		.attr("class", "radarBlobVertexCircle")
		.attr("r", radialUtils.config.dotRadius*1.5)
		.attr("cx", radialUtils.xLocationFn(radialUtils.config.maxValue))
		.attr("cy", radialUtils.yLocationFn(radialUtils.config.maxValue))
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;
			
			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(d.value)
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", () => {
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});
	
	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0)
		.style("font-size", 24)
	
}//RadarChart
