/**
 * Created by andres on 4/23/15.
 */

function buildLabels(d2root, labels, fontSize){
    // add the text
    var labelsText = addLabelText(labels, fontSize);
    // add the frame around
    var labelsFrame = addFrameBox(labels);

    // fix the collisions
    collisionFix(d2root, labels);
    // move the labels
    labels.attr("transform", function(d){
        return "translate(" + d.xOffset + ", " + d.yOffset + ")";
    });
    // append the line
    addLabelLines(labels);
    // move to frames to the front
    labelsFrame.each(function(){
        this.parentNode.appendChild(d3.select(this).node());
    });
    // move the text to the front
    labelsText.each(function(){
        this.parentNode.appendChild(d3.select(this).node());
    });

}
function addLabelText(labels){
    return labels.append("text")
        .text(function(d) {return d.label;})
        .attr("text-anchor", "middle")
        .attr("x", function(d){return Math.cos(d.angle) * d.r1;})
        .attr("y", function(d){return (Math.sin(d.angle) * d.r1 * -1);})
        .attr("font-size", function(d){
            return d.fontSize;
        })
        .each(function (d) {
            var box = getBox(this);
            d.frameBox = new LabelFrame(box.x, box.y, box.width, box.height);
        });
}
function labelCentroid(box, angle){
    var w = box.width * 1.065;
    var h = box.height * 1.065;

    var cos = Math.cos(angle);
    var sin = Math.sin(angle);

    w *= cos > 0 ? 1: -1;
    h *= sin > 0 ? -1: 1;

    return {
        x: w/2,
        y: h/2
    };
}

function addFrameBox(labels){
    return labels.append("rect")
        .attr("x", function(d){return d.frameBox.x - 5;})
        .attr("y", function (d) {return d.frameBox.y;})
        .attr("height", function (d) {return d.frameBox.height;})
        .attr("width", function (d) {return d.frameBox.width + 10;})
        .attr({
            "rx": 1,
            "ry": 1,
            "stroke": "grey",
            // "fill": "#d5f5d5",
            "fill": "white",
            "stroke-width": 0.75
        })
        .each(function (d) {
            var box = getBox(this);
            // override the frame box
            d.frameBox = new LabelFrame(box.x, box.y, box.width, box.height);
            var center = labelCentroid(d.frameBox, d.angle);
            // add the offsets
            d.xOffset = center.x;
            d.yOffset = center.y;
        });
}
function addLabelLines(labels){
    return labels.append("line")
        .attr("x1", function (d) {
            return Math.cos(d.angle) > 0 ? d.frameBox.x: d.frameBox.x + d.frameBox.width;
        })
        .attr("y1", function (d) {
            return d.frameBox.y + d.frameBox.height/2;
        })
        .attr("x2", function (d) {
            return Math.cos(d.angle) * (d.r0 + 3) - d.xOffset;
        })
        .attr("y2", function (d) {
            return (Math.sin(d.angle) * (d.r0 + 3) * - 1) - d.yOffset;
        })
        .attr({
            "stroke": "grey",
            "stroke-width": 1
        })
        .style("stroke-dasharray", ("1, 1"));
}
function ascending(a, b){
    return a.angle - b.angle;
}
function descending(a, b){
    return b.angle - a.angle;
}
function getQuadrant(angle){
    if(between(angle, 0, Math.PI/2))
        return "q1";
    if(between(angle, Math.PI/2, Math.PI))
        return "q4";
    if(between(angle, Math.PI, 3/2*Math.PI))
        return "q3";
    return "q4";
}

function between(x, min, max) {
    return x >= min && x <= max;
}

function collisionFix(d3root, labels){
    var angle = 0;
    var className = "";
    var lf = new LabelFixer(5, 0); // fix label overlapping

    labels.attr("class", function(d){
        // since we shift the angles as a clock
        // 12 o'clock we begin
        // from there it is clockwise
        // so 1st quadrant begins from 12 o'clock
        // then quadrant 4rd, 3rd and we end in the 2nd.
        className = d3.select(this).attr("class");
        angle = Math.PI / 2 - d.angle;
        return getQuadrant(angle);
    });
    // collisions
    lf.adjust(d3root.selectAll("g.q1").sort(ascending));
    lf.adjust(d3root.selectAll("g.q3").sort(ascending));
    lf.adjust(d3root.selectAll("g.q2").sort(descending));
    lf.adjust(d3root.selectAll("g.q4").sort(descending));
    labels.attr("class", className); // reset the style
}

function hGraphMeasurementsBuilder(measurementGroup, startAngle, padAngle, endAngle, innerRadius, outerRadius) {
    var group = measurementGroup;
    var measurements = group.measurements;
    var angleStepsPerMeasurement = angleUnit(startAngle, padAngle, endAngle, measurements.length);
    var angle, dataM;
    var hGraphMs = [];
    var hGraphM = null;
    for(var i = 0; i < measurements.length; i ++){
        dataM = measurements[i];
        angle = startAngle + padAngle + ((i + 1) * angleStepsPerMeasurement);
        // move the result so it goes clockwise
        angle = Math.PI / 2 - angle;
        hGraphM = new HealthMeasurement(dataM, angle, innerRadius, outerRadius);
        hGraphMs.push(hGraphM);
    }
    // return the points in the whole section as an array
    return hGraphMs;
}


function getAngleAtSlice(startAngle, endAngle, padAngle, slice){
    var start = startAngle + padAngle/2;
    var end = endAngle - padAngle/2;
    var space = end - start;
    var result = startAngle + (space / slice);
    // move the result so it goes clockwise
    return Math.PI / 2 - result;
}

function angle(startAngle, endAngle) {
    var centroidAngle = (startAngle + endAngle)/2;
    // Math.PI (rad) = 180 (deg)
    // centroidAngle (rad) = x (deg)
    // return a > 90 ? a - 180 : a;
    return (centroidAngle * 180) / Math.PI;
}

function angleUnit(startAngle, padAngle, endAngle, n) {
    var start = startAngle + padAngle/2;
    var end = endAngle - padAngle/2;

    var space = end - start;
    return space / (n + 1);
}


function getBox(svgElement){
    return svgElement.getBBox();
}

// each circle has
// name of the measurement
// angle
// optimal range
// yellow ?
// red ?
// array of samples
// selected sample
// given a timestamp
// each circle computes: radius, x, y, color
// functions: first, last, next, previous, goto(timestamp)

/**
 *
 * @param measurement
 * @param angle
 * @param r0
 * @param r1
 * @constructor
 */
function HealthMeasurement(measurement, angle, r0, r1){

    this.label = measurement.label,
        this.r = 4, // this is the radius of the svg circle element
        this.units = measurement.units,
        this.angle = angle,
        this.min = measurement.min,
        this.max = measurement.max,
        this.samples = measurement.samples,
        this.sample = 0,
        this.r0 = r0,// inner radius
        this.r1 = r1,// outer radius
        this.additionalRanges = false;

    this.scale = d3.scale.linear()
            .domain([this.min, this.max])
            .range([this.r0, this.r1]);

    this.x = this.y = this.radius = 0;
    this.color = "white";
    // check for yellow and red ranges
    var ranges = HealthMeasurement.additionalRanges; // shorthand
    for(var i = 0; i < ranges.length; i++){
        if (typeof measurement[ranges[i]] != 'undefined'){
            this.additionalRanges = true;
            this[ranges[i]] = measurement[ranges[i]];
        }
    }
    // compute the position and color
    this.computePosition();
}
/**
 * Computes the position and sets the x, y and radius based on the selected sample.
 */
HealthMeasurement.prototype.computePosition = function () {
    var sample = this.samples[this.sample];
    var value = sample.value;
    this.radius = this.scale(value);
    this.x = Math.cos(this.angle) * this.radius;
    this.y = Math.sin(this.angle) * this.radius * -1;

    this.color = this.additionalRanges ? "#73D651": "white";

    if(this["yellow_max"] && value >= this.max){
        this.color = "gold";
    }
    if(this["red_max"] && value >= this["red_max"]){
        this.color = "tomato";
    }

    if(this["yellow_min"] && value <= this.min){
        this.color = "gold";
    }
    if(this["red_min"] && value <= this["red_min"]){
        this.color = "tomato";
    }

};

HealthMeasurement.additionalRanges = ["yellow_min", "yellow_max", "red_min", "red_max"];

function toDistanceString(healthMeasurements){
    var arr = [];
    for(var i = 0; i < healthMeasurements.length; i ++){
        arr.push([healthMeasurements[i].x, healthMeasurements[i].y]);
    }
    return [arr];
}
/**
 *
 * @param label
 * @param fontSize
 * @param angle
 * @param r0
 * @param r1
 * @constructor
 */
function LabelText(label, fontSize, angle, r0, r1){
    this.label = label,
        this.fontSize = fontSize,
        this.angle = angle,
        this.r0 = r0,
        this.r1 = r1,
        this.frameBox = null;
}
/**
 *
 * @param x
 * @param y
 * @param width
 * @param height
 * @constructor
 */
function LabelFrame(x, y, width, height){
    this.x = x,
        this.y = y,
        this.width = width,
        this.height = height;
}

/**
 *
 * @param margin
 * @param border
 * @constructor
 */
function LabelFixer(margin, border){
    this.margin = margin;
    this.border = border;
}
/**
 * Adjusts the y coordinate to avoid overlapping for a set of measurements in a quadrant.
 * @param i
 * @param angle
 * @param y
 * @param height
 * @param yOffset
 * @returns {number|*}
 */
LabelFixer.prototype.adjustLabel = function (i, angle, y, height, yOffset){
    var delta = 0,
        upper = Math.sin(angle) >= 0;

    var collision = upper ?
        y + height + this.margin >= this.border :
        y <= this.border;

    if(collision && i > 0)
        delta = upper ?
            this.border - y - height - this.margin : // negative to move it up
            this.border - y; // positive to move it down

    yOffset += delta;

    this.border = upper ?
        y + delta :
        y + height + this.margin + delta; // add the height and the margin plus possible delta

    return yOffset;
};
/**
 * Resets the border before the next calculation begins.
 */
LabelFixer.prototype.resetBorder = function () {
    this.border = 0;
};

/**
 * Runs the collision detection for each element in the d3 group
 * @param d3group
 */
LabelFixer.prototype.adjust = function (d3group){
    var self = this;
    d3group.each(function (d, i) {
        d.yOffset = self.adjustLabel(i, d.angle, d.frameBox.y, d.frameBox.height, d.yOffset);
    });
    self.resetBorder();
}

function render(dataset){
    var pie = d3.layout.pie().value(function (d) {
        return d.measurements.length;
    }).sort(null);

    pie.padAngle(Math.PI / 105);

    var w = 800;
    var h = 800;

    var outerRadius = w * 0.27;
    var innerRadius = w * 0.17;
    var labelRadius = w * 0.32;

    var arc;
    arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    var svg = d3.select("div#hGraph-container")
        .append("svg")
        .attr("viewBox", "0 0 " + w + " " + h);

    var pieObjects = pie(dataset);

    var hGraphWrapper = svg.append("g").attr("class", "hGraph-wrapper");

    var hGraph = hGraphWrapper.append("g").attr("class", "hGraph");

    var arcsG = hGraph.append("g").attr("class", "arcs");

    var arcs = arcsG.selectAll("g.arc")
        .data(pieObjects)
        .enter()
        .append("g")
        .attr("class", "arc");

    var dataByAngles = [];
    var hGraphMeasurements = [];

    arcs.append("path")
        .attr({
            "fill": "#74c476",
            //"stroke": "#74c476",
            "stroke": "none",
            "d": arc
        });

    arcs.each(function (d, i) {
        var label = dataset[i].label,
            angle = getAngleAtSlice(d.startAngle, d.endAngle, d.padAngle, 2);
        dataByAngles.push(new LabelText(label, w * 0.0275, angle, outerRadius, labelRadius));

        // experiment
        hGraphMeasurements = hGraphMeasurements.concat(
            hGraphMeasurementsBuilder(dataset[i], d.startAngle, d.padAngle, d.endAngle, innerRadius, outerRadius)
        );
    });

    var groupLabelsG = hGraph.append("g").attr("class", "groupLabels");
    var groupLabels = groupLabelsG.selectAll("g.groupLabel")
        .data(dataByAngles)
        .enter()
        .append("g")
        .attr("class", "groupLabel");
    buildLabels(groupLabelsG, groupLabels, w * 0.0275);

    var labelData = [];
    for(var i = 0; i < hGraphMeasurements.length; i ++){
        var m = hGraphMeasurements[i],
            fontSize = w * 0.0125,
            label = m.label + ": " + m.samples[m.sample].value + " " + m.units,
            r1 = Math.max(m.radius + 20, outerRadius + 10);
        labelData.push(new LabelText(label, fontSize, m.angle, m.radius, r1));
    }

    var labelsG = hGraph.append("g").attr("class", "labels");
    var labels = labelsG.selectAll("g.label")
        .data(labelData)
        .enter()
        .append("g")
        .attr("class", "label");

    buildLabels(labelsG, labels, w * 0.0125);

    // polygon
    var polygonGroup = hGraph.append("g").attr("class", "polygon");
    polygonGroup.selectAll("polygon")
        .data(function () {
            return [toDistanceString(hGraphMeasurements)];
        })
        .enter()
        .append("polygon")
        .attr("points", function(d) {
            // compute the coordinates
            return d.join(" ");
        }).attr({
            "stroke": "#5b5b5b",
            "stroke-width": 1,
            "fill": "grey",
            "fill-opacity": 0.35
        });

    var hGraphMeasurementsGroup = hGraph.append("g").attr("class", "hGraphMeasurements");
    hGraphMeasurementsGroup.selectAll("circle")
        .data(hGraphMeasurements)
        .enter()
        .append("circle")
        .attr("r", function(d){return d.r;})
        .attr("cx", function(d){return d.x;})
        .attr("cy", function(d){return d.y;})
        .attr("fill", function(d){return d.color;})
        .attr({
            "stroke": "#5b5b5b",
            "stroke-width": 1
        });

    // flip the y axis
    // var scale = "scale(1, -1)";
    // rotate
    // var rotate = "rotate(90)";
    // all the transformations
    // var transformations = [scale, rotate];
    // apply
    // arcs.attr("transform", transformations.join(" "));
    // pointsGroup.attr("transform", scale + " " + rotate);
    // polygon.attr("transform", scale + " " + rotate);
    // move the hGraph
    var translate = "translate(" + (w/2) + ", " + (h/2) + ")";
    hGraph.attr("transform", translate);

    // show and hide
    labels.attr("opacity", 0);
    groupLabels.attr("opacity", 1);

    // this is app specific code
    // pan and zoom lib
    // setup the group animations
    var zoomEntryCall = function () {
        pzlib.allowZoom = false; // disable zoom
    };
    var zoomCallback = function () {
        pzlib.allowZoom = true; // enable zoom
    };
    // two groups, and function to call first and after the groups have finished the animation
    var ga = new GroupedAnimation(2, zoomEntryCall, zoomCallback);
    // zoom and pan
    pzlib.setup("hGraph-container");
    pzlib.deltaS = 0.50;
    pzlib.zoomLimit = 2.50;

    pzlib.afterZoom = function () {
        pzlib.zoomLevel > 1 ? zoomInAction(): zoomOutAction();
    };

    function zoomInAction(){
        ga.show(labels);
        ga.dim(groupLabels);
    }

    function zoomOutAction(){
        ga.show(groupLabels);
        ga.hide(labels);
    }
}

/**
 *
 * @param {number} n - Number of groups to be animated
 * @param {function} entryCall - Function to call when the animation starts
 * @param {function} callback - Function to call when the animation ends
 * @constructor
 */
function GroupedAnimation(n, entryCall, callback){
    this.n = n;
    this.elementsDone = 0;
    this.entryCall = entryCall;
    this.callback = callback;
}

GroupedAnimation.prototype.animateOpacity = function (d3element, val) {
    this.entryCall();
    var self = this;
    d3element
        .transition()
        .attr("opacity", val)
        .duration(1300)
        .call(endAll, function(){ self.check.apply(self); });
};

function endAll(transition, callback) {
    if (transition.size() === 0) { callback() }
    var n = 0;
    transition
        .each(function() { ++n; })
        .each("end", function() { if (!--n) callback.apply(this, arguments); });
}

// there are several groups that are being animated each with different elements so we
// need to make sure that all the groups and their elements have finished the animation
GroupedAnimation.prototype.check = function () {
    this.elementsDone++;
    if(this.elementsDone === this.n){
        this.elementsDone = 0;
        this.callback();
    }
};

GroupedAnimation.prototype.isVisible = function(d3element){
    return parseInt(d3element.attr("opacity")) != 0;
};

GroupedAnimation.prototype.show = function(d3element){
    if(!this.isVisible(d3element))
        this.animateOpacity(d3element, 1);
};

GroupedAnimation.prototype.dim = function(d3element){
    if(this.isVisible(d3element))
        this.animateOpacity(d3element, 0.1);
};

GroupedAnimation.prototype.hide = function(d3element){
    if(this.isVisible(d3element))
        this.animateOpacity(d3element, 0);
};