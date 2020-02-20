class RadialUtilsManager {
	
	constructor(data, options) {
		const DEFAULT_CONFIG_PROPERTIES = {
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
		}
		
		this._CONFIG_PROPERTIES = {
			...DEFAULT_CONFIG_PROPERTIES,
			...options,
			
			radius: (options.w || DEFAULT_CONFIG_PROPERTIES.w) / 2, 	//Radius of the outermost circle
			angleSlice: Math.PI * 2 / data[0].length,		//The width in radians of each "slice"
			maxValue: Math.max(
				options.maxValue || DEFAULT_CONFIG_PROPERTIES.maxValue,
				d3.max(
					data, i => d3.max(i.map(o => o.value))
				)
			), //If the supplied maxValue is smaller than the actual one, replace by the max in the data
		}
		
		this._radiusScale = d3.scaleLinear()
			.range([0, this._CONFIG_PROPERTIES.radius])
			.domain([0, this._CONFIG_PROPERTIES.maxValue]);
		
		this._data = data
	}
	
	getRadius = d => this._radiusScale(d.value)
	
	xLocationFn = (scaleFactor = 1, dIgnored = false) => (d, i) => this._radiusScale(scaleFactor * (dIgnored ? 1 : d.value)) *  Math.cos(this._CONFIG_PROPERTIES.angleSlice * i - Math.PI/2)
	
	yLocationFn = (scaleFactor = 1, dIgnored = false) => (d, i) => this._radiusScale(scaleFactor * (dIgnored ? 1 : d.value)) *  Math.sin(this._CONFIG_PROPERTIES.angleSlice * i - Math.PI/2)
	
	radialPathGeneratorSansRadius = () => {
		return d3.lineRadial()
			.curve(d3.curveMonotoneX)
			.angle((d,i) => i * this._CONFIG_PROPERTIES.angleSlice)
		// just add .radius()!
	}
	
	wrap = (text, width) => {
		text.each(function() {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.4, // ems
				y = text.attr("y"),
				x = text.attr("x"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			
			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		});
	}//wrap
	
	get config() {
		return this._CONFIG_PROPERTIES
	}
	
	get data() {
		return this._data
	}
	
	get axisNames() {
		return this.data[0].map(d => d.axis)
	}
}
