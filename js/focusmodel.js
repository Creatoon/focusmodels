/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function setup(){
 var okay = false;
 wipeCanvas();

 allowedModels = ['vertex','edge','axis','newaxis','monoray']; // global
 allparams = new Array(); // global
 for (var m in allowedModels){
  var tmpmodel = new FocusModel;
  tmpmodel.themodeltype = allowedModels[m];
  tmpmodel.setDefaults();
  allparams.push(tmpmodel);
 } 

 var params = new FocusModel;
 params.saveCurrent();
// graphtype = params.themodeltype;

 // testing: look for an anchor in the URL (later, we might switch models based on this,
 //          but need to play nicely with existing model setups...)
 // -- if setup() only gets called on load, maybe we can just switch models: need to check
 var hashmodel = location.hash.split("#");
 if (hashmodel.length==2) urlmodel = hashmodel[1]; else urlmodel="";

 // make sure the control displays (labels) are the same as the controls' values:
 thevalencyOutput.value = thevalency.value;
 thewidthOutput.value = thewidth.value;
// if (graphtype=="newaxis"|graphtype=="monoray") thewidthOutput.value = thewidth.value;
 thelevelsOutput.value = thelevels.value;
 thescalingOutput.value = thescaling.value;
 thelengthOutput.value = thelength.value;
 thespreadOutput.value = thespread.value;
 theoffsetXOutput.value = theoffsetX.value;
 theoffsetYOutput.value = theoffsetY.value;
 thelabeloffsetXOutput.value = thelabeloffsetX.value;
 thelabeloffsetYOutput.value = thelabeloffsetY.value;
 thetextangleOutput.value = thetextangle.value;
 thefontsizeOutput.value = thefontsize.value;
 thenodesizeOutput.value = thenodesize.value;
 linewidthOutput.value = thelinewidth.value;
 // "more controls":
 thearrowsizeOutput.value = thearrowsize.value;
 thearrowoffsetOutput.value = thearrowoffset.value;
 thearrowratioOutput.value = thearrowratio.value;
// axislinewidthOutput.value = theaxislinewidth.value;
 axislinewidthOutput.value = thelinewidth.value; // on load, set the axis line width to the normal line width
 theaxislinewidth.value = thelinewidth.value;

 // change the canvas cursor to "alias" when pressing control (for picking automorphism nodes)
 $(document).on("keydown", function (event) {
  if (event.ctrlKey) {
   $("#thecanvas").css("cursor", "alias");
   $("#ctrlnote").addClass("redbg");
  } else if (event.shiftKey) {
   $("#thecanvas").css("cursor", "text");
   $(".midptlabel").css("display","inline");
  }
 });
 // otherwise, use the array (for selecting nodes whose custom label to change)
 $(document).on("keyup", function (event) {
  $("#thecanvas").css("cursor", "pointer");
  $("#ctrlnote").removeClass("redbg");
  $(".midptlabel").css("display","none");
 });

 // turn off the "width" control (it will be enabled only for newaxis):
 $("#thewidth").prop("disabled","disabled");
 $("#thewidth").addClass("disabledcontrol");
 $("#thewidthLabel").addClass("disabledcontrol");
 $("#thewidthOutput").addClass("disabledcontrol");

 if (urlmodel.length & urlmodel!=params.themodeltype){
  console.log("URL model anchor ("+urlmodel+") and user controls ("+params.themodeltype+") do not agree");
 }

 // do some conditional set-up:
 switch (params.themodeltype){
  case "vertex":
   console.log("graphtype = "+params.themodeltype);
   if (vertexmodel(params.initialfocus)) okay = true;
   break;
  case "edge":
   console.log("graphtype = "+params.themodeltype);
   if (edgemodel(params.initialfocus)) okay = true;
   break;
  case "axis":
   console.log("graphtype = "+params.themodeltype);
   if (axismodel(params.initialfocus)) okay = true;
   break;
  case "newaxis":
   console.log("graphtype = "+params.themodeltype);
   if (newaxismodel(params.initialfocus)) okay = true;
   $("#thewidth").removeProp("disabled");
   $("#thewidth").removeClass("disabledcontrol");
   $("#thewidthLabel").removeClass("disabledcontrol");
   $("#thewidthOutput").removeClass("disabledcontrol");
   break;
  case "monoray":
   console.log("graphtype = "+params.themodeltype);
   if (monoraymodel(params.initialfocus)) okay = true;
   break;
  default:
   console.log("graphtype = "+params.themodeltype);
   alert("Set-up must be called with a focus type");
   okay = false;
 }

 if (okay){
  if (typeof nodeLabel == 'object'){ // check if the custom label array exists
   // yes? then do nothing
  } else {
   // no? create it *once*
   createNodeLabel();
  }
  if (typeof midpointLabel == 'object'){ // check if the custom edge label array exists
   // yes? then do nothing
  } else {
   // no? create it *once*
   createMidpointLabel();
  }
  drawgraph();
 } else {
  alert("Graph set-up failed");
 }

 return 1;
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function createNodeLabel(){
 // make enough blank labels for every node
 nodeLabel = new Array(nodeIndex.length);
 nodeLabel.fill("");
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function createMidpointLabel(){
 // make enough blank labels for every edge
 midpointLabel = new Array(midpointPosition.length);
 midpointLabel.fill("");
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function reverseString(str){
 var newstr = [];
 for (var i=str.length;i>0;i--){
  newstr += str[i-1];
 }
 return newstr;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function checkValidAddress(el){
 var debug = false;
 var addr = $(el).attr("value");
 var valency = $("#thevalency").val();
 var labels = "";
 for (var i=0;i<valency;i++) labels += colournames[i]; // get available node label "alphabet"
 var re = new RegExp("^[" + labels + "]*$|^0$");
 var isValid = re.test(addr);
 if (debug) console.log("Checking "+addr+ ": "+(isValid?"valid":"invalid"));
 if (isValid){
  $(el).removeClass("invalid");
  $("#automorphismbutton").prop("disabled",false);
 } else {
  $(el).addClass("invalid");
  $("#automorphismbutton").prop("disabled",true);
 }
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function saveDot(){
 var dot = "";
 var lastsource = "";
 var lasttarget = "";
 // loop through the nodes and define their colours
//  nodes.forEach(function(d) {
//   dot += d.myindex+"{color:"+document.getElementById("picker"+d.group).value+", label:Node "+d.myindex+"}\n";
//  });
//  dot += "\n";

 // instead: loop through the groups and add their nodes (and colours):
 for (g=0;g<Ngroups;g++){
  dot += "{color:"+document.getElementById("picker"+g).value+"}\n";
  nodes.forEach(function(d) {
   if (d.group == g) {
    dot += " "+d.myindex+";\n"
   }
  });
 }
 dot += "\n";

 // loop through the links nodes and add them to the output
 links.forEach(function(d) {
  if (d.source.myindex == lasttarget && d.target.myindex == lastsource){
   // do nothing (do not print both links for an undirected edge)
  } else {
   dot += d.source.myindex+" -- "+d.target.myindex+"\n";
  }
  lastsource = d.source.myindex;
  lasttarget = d.target.myindex;
 });
// $("#dotcontent").html(dot.replace(/(\n)/g, "<br/>"));
 $("#dotcontent").html(dot);
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function copyDot(){
 var src = document.getElementById("dotcontent").innerHTML;
 function listener(e) {
  e.clipboardData.setData("text/html", src);
  e.clipboardData.setData("text/plain", src);
  e.preventDefault();
 }
 document.addEventListener("copy", listener);
 document.execCommand("copy");
 document.removeEventListener("copy", listener);
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function calcEdgeLength(level,valency,baselength=1,edgescaling=1){
 return baselength*Math.pow(edgescaling,level-1);
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function wipeCanvas(){
 var edgeColour = document.getElementById("edgepicker").value;
 var axesColour = document.getElementById("axespicker").value;
 var arrowSize = parseFloat($("#thearrowsize").val());
 var filledarrows = $("#filledarrowsbutton").prop("checked");
 var arrowratio = Math.pow(parseFloat($("#thearrowratio").val()),2.0);

 $("#thecanvas").empty();
 // after clearing the canvas we need to insert the marker definition:
 document.getElementById('thecanvas').insertAdjacentHTML('afterbegin','\
<defs>\
 <marker id="axesarrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">\
  <path d="M0,0 L0,6 L9,3 z" fill="'+axesColour+'" />\
 </marker>\
 <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">\
  <path d="M0,0 L0,6 L9,3 z" fill="'+edgeColour+'" />\
 </marker>\
 <marker id="rayarrow" markerWidth="10" markerHeight="10" refX="2" refY="3" orient="auto" markerUnits="strokeWidth">\
  <path d="M0,0 L3,3 L0,6" stroke-width="0.1" fill="none" stroke="'+edgeColour+'" />\
 </marker>\
 <path id="rayarrowbase" d="M-'+arrowSize+',0 L0,'+(arrowSize*arrowratio)+' L'+arrowSize+',0'+(filledarrows?' z" fill="'+edgeColour+'"':'"')+' stroke-width="0.5" fill="none" stroke="'+edgeColour+'" />\
 <path id="rayarrowbasefaded" d="M-'+arrowSize+',0 L0,'+(arrowSize*arrowratio)+' L'+arrowSize+',0'+(filledarrows?' z" fill="'+edgeColour+'55"':'"')+' stroke-width="0.5" fill="none" stroke="'+edgeColour+'55" />\
</defs>');
 return 1;
}
// <path id="rayarrowbase" d="M-4,0 L0,6 L4,0 " stroke-width="0.5" fill="none" stroke="'+edgeColour+'" />\

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function wipeInfo(){
 $('#info').html('');
 return 1;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function nodeDistance(a,b){
 a=collapseAddress(a);
 b=collapseAddress(b);

 // remove common prefix
 if (a.length>0 & b.length>0){
  while (a[0]==b[0]){
   a=a.substr(1,a.length-1);
   b=b.substr(1,b.length-1);
   if (a.length==0 | b.length==0){
    break;
   }
  }
 }
 // the count what path length is left
 var dist = a.length+b.length;
 return dist;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function edgeDistance(a,b,c,d){
 // a,b,c,d are vertices
 // distance between the edge (a,b) and the edge (c,d)
 // will return -1 if either (a,b) or (c,d) are not valid edges
 var L = new Array(4);
 L[0]=nodeDistance(a,c);
 L[1]=nodeDistance(a,d);
 L[2]=nodeDistance(b,c);
 L[3]=nodeDistance(b,d);

 // we need to check if the two edges are actually the same edge:
 var Nzeros=0;
 for (el in L){if (el==0) Nzeros++;} // count the number of zeros in L
 if (Nzeros>=2){
  dist = 0;
 } else {
  var minL = Math.min.apply(Math, L);
  dist=minL+1;
 }
 return dist;

}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function edgeLengthVF(level,valency,baselength=2){
// return = baselength./s.^2; % good for valency = 5
// return = baselength./s; % good for valency = 3
 return baselength/Math.pow(level,valency/2.5);
// return = baselength./s.^(valency/2);
// return = baselength./s.^(valency/valency);
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function edgeLengthEF(level,valency,baselength=2){
// return baselength/Math.pow(level,valency);
 return baselength*Math.pow(1/3,level); // "rule of thirds"
// return baselength/level; // good for valency = 3
// return baselength*Math.pow(6/7,level);
// return baselength;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function edgeLengthAF(level,valency,baselength=2){
// return baselength/Math.pow(level,valency);
// var s = edgeDistance(thisEdge[0],thisEdge[1],focusEdge[0],focusEdge[1]);
 return baselength*Math.pow(2/3,level); // "rule of thirds"
// return baselength/level; // good for valency = 3
// return baselength*Math.pow(6/7,level);
// return baselength;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function circshift(input,shiftsize){
 var output=new Array(input.length);
 var n = 0;
 var firstelement = input.length - shiftsize;
 while (firstelement>input.length) firstelement-=input.length;
 // first we copy the end of the input, with the requested offset:
 for (var i=firstelement;i<input.length;i++){
  output[n] = input[i];
  n++;
 }
 // and then finish by using the start of the input, up to the requested offset:
 for (i=0;i<firstelement;i++){
  output[n] = input[i];
  n++;
 }
 return output;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function collapseAddress(str=""){
 var changeflag = true;
 var oldstr = str;

 str = str.replace(/0/g,""); // remove the empty label throughout

 while (changeflag){
  str = str.replace(/(.)\1/,""); // replace consecutive chars, once
  if (oldstr==str) changeflag = false; // nothing changed? then stop
  oldstr = str; // save the current string
 }
 return str;
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function switchmodel(){
 var thismodeltype = $("#themodeltype").val(); // string, only one of {'vertex','edge','axis','newaxis','monoray'}
 allparams[allowedModels.indexOf(thismodeltype)].drawModel();
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function drawgraph(){
 var debug = false;
 var pi = Math.PI;

 // get the current settings for all the page controls:
 var params = new FocusModel;
 params.saveCurrent();

 // store them away into the "allparams" array, for switching between models:
 allparams[allowedModels.indexOf(params.themodeltype)].saveCurrent();

 switch (params.themodeltype){
  case "vertex":
   if (vertexmodel(params.initialfocus)) okay = true;
   break;
  case "edge":
   if (edgemodel(params.initialfocus)) okay = true;
   break;
  case "axis":
   if (axismodel(params.initialfocus)) okay = true;
   break;
  case "newaxis":
   if (newaxismodel(params.initialfocus)) okay = true;
   break;
  case "monoray":
   if (monoraymodel(params.initialfocus)) okay = true;
   break;
  default:
   alert("Set-up must be called with a focus type");
   okay = false;
   return 0;
 }

 // clear the canvas:
 wipeCanvas();

 if (debug) $('#info').append('Drawing the graph....');

 // make sure the custom node labels are up to date with the number of nodes:
 if (nodeLabel.length != nodeIndex.length) createNodeLabel();

 // Set some default values (which the user might change with the controls):
//MOVETOCLASS var axesColour = '#555';
//MOVETOCLASS var nodeColour = '#000';
//MOVETOCLASS var edgeColour = '#000';
//MOVETOCLASS var labelColour = '#f00';
 var ignoreNodeColour = ''; // set empty to not draw ignored nodes; was '#0f0'
 var ignoreEdgeColour = '#888'; // set empty to not draw edges for ignored nodes; was '#0f0'
 var ignoreLabelColour = ''; // set empty to not label ignored nodes; was '#0f0'
 var ignoreDash = '6'; // SVG dash pattern for edges between ignored nodes and their parents

 // Get values from user controls on the web page:
 // -- we're not too worried about NaN values here, which could arise if the user fiddles with the page or javascript and breaks something
 // user-selected colours:
 var axesColour = params.axespicker;
 var labelColour = params.labelpicker;
 var edgeColour = params.edgepicker;
 var nodeColour = params.nodepicker;
 // label-related variables:
 var fontSize = params.thefontsize;
 var textAngle = params.thetextangle;
 var showlabels = params.whichlabel;
 var showarrows = params.showarrowsbutton;
 // pen-related variables:
 var nodeRadius = params.thenodesize;
 var lineWidth = params.thelinewidth;
 var axisLineWidth = params.theaxislinewidth;
 var showaxes = params.axesbutton;
 var plainedges = params.plainedgesbutton; // plain=all the same colour; not plain=coloured by edge type
 // canvas-related variables:
 var offsetX = params.theoffsetX;
 var offsetY = params.theoffsetY;
 var labelOffsetX = params.thelabeloffsetX;
 var labelOffsetY = params.thelabeloffsetY;

 /* get the canvas element and size it properly (transfer the CSS size to the proper canvas attributes) */
 $('#thecanvas').attr('width',$('#thecanvas').width());
 $('#thecanvas').attr('height',$('#thecanvas').height());

 var canvaswidth = $('#thecanvas').width();
 var canvasheight = $('#thecanvas').height();
 var centreX = Math.round(canvaswidth/2) + offsetX;
 var centreY = Math.round(canvasheight/2) + offsetY;

 // Add markers for the edge midpoints (drawing yellow dots) but hide them for now:
 for (var i=0;i<midpointPosition.length;i++){
  if (!(isNaN(midpointPosition[i][0]) | isNaN(midpointPosition[i][1]))){
   $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
    "fill": "#ff0",
    "stroke": "none",
    "r": 5,
    "cx": midpointPosition[i][0],
    "cy": midpointPosition[i][1],
    "class": "midptlabel",
   }).appendTo("#thecanvas");
  }
 }

 // draw the axes, if requested:
 if (showaxes){
  $(document.createElementNS("http://www.w3.org/2000/svg","line")).attr({
   "id": "haxis",
   "marker-end": "url(#axesarrow)",
   "stroke": axesColour,
   "stroke-width": 1,
   // if we draw the axes as a path, use this:
   //   "d": "M "+(centreX-canvaswidth/2-offsetX)+","+(canvasheight-centreY)+" L "+(centreX+canvaswidth/2-offsetX)+","+(canvasheight-centreY),
   // but for now we are still using line:
   "x1": centreX - canvaswidth/2 - offsetX,
   "y1": canvasheight - centreY,
   "x2": centreX + canvaswidth/2 - offsetX,
   "y2": canvasheight - centreY,
  }).appendTo("#thecanvas");

  $(document.createElementNS("http://www.w3.org/2000/svg","line")).attr({
   "id": "vaxis",
   "marker-end": "url(#axesarrow)",
   "stroke": axesColour,
   "stroke-width": 1,
   // if we draw the axes as a path, use this:
   //   "d": "M "+(centreX)+","+(canvasheight)+" L "+(centreX)+","+(0),
   // but for now we are still using line:
   "x1": centreX,
   "y1": canvasheight, // orient the axis line towards the top of the screen (in case we have arrows on the end)
   "x2": centreX,
   "y2": 0,
  }).appendTo("#thecanvas");
 } // end if showaxes

 // edge-colouring way: pick a colour (https://medialab.github.io/iwanthue/) from the list
 colournames = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
// var someColours = ["#5238cb", "#67b53c", "#a63dd8", "#57b27a", "#da48ce", "#4c702a", "#9264e0", "#b09b3a", "#4a2891", "#d78232", "#6071de", "#da4528", "#32b8d3", "#d23d56", "#5592dd", "#863920", "#43519a", "#d87c61", "#4a2362", "#df3f92", "#ad8cd2", "#8e2a53", "#d97cd3", "#db7297", "#99308e", "#8b539a"];
// var someColours = ["#80752d", "#456dd3", "#7db93a", "#dd4a59", "#50c068", "#db5831", "#6e9bdb", "#de9735", "#335989", "#bbb13b", "#661e2a", "#60c3a4", "#9d3a22", "#5ab1c7", "#6d1f18", "#9fb878", "#ab414f", "#537e2d", "#e49185", "#314b22", "#b46e35", "#498362", "#52291f", "#cfa572", "#734d24", "#a1655c"];
 var someColours = ["#ff4444", "#44dd44", "#6677ff", "#ffaa55", "#aabbff", "#cccccc", "#888888", "#111111"];
 // moreColours taken from the work of Paul Green-Armytage quoted at https://graphicdesign.stackexchange.com/questions/3682/
 var moreColours = ["#F0A3FF", "#0075DC", "#993F00", "#4C005C", "#191919", "#005C31", "#2BCE48", "#FFCC99", "#808080", "#94FFB5", "#8F7C00", "#9DCC00", "#C20088", "#003380", "#FFA455", "#FFA8BB", "#426600", "#FF0010", "#5EF1F2", "#00998F", "#E0FF66", "#74AAFF", "#990000", "#FFFF80", "#FFFF00", "#FF5055"];
 someColours = someColours.concat(moreColours);

 for (var vv=0;vv<nodePosition.length;vv++){
  nodeScreenPosition[vv] = canvasScale(nodePosition[vv]);

  if (nodeParent[vv]>=0){ // use only non-root nodes
   var position0 = canvasScale(nodePosition[nodeParent[vv]]);
  }

//  if (debug) $("#info").append("<p class="debug">"+vv+"] "+xx.toFixed(2)+", "+yy.toFixed(2));
//  if (debug) $("#info").append("<p class="debug">"+nodeAngle[vv]/pi+"  "+nodePosition[vv][0].toFixed(3)+", "+nodePosition[vv][1].toFixed(3));

  $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
   "fill": (nodeIgnore[vv]?(ignoreNodeColour.length?ignoreNodeColour:"none"):nodeColour),
   "stroke": "none",
   "r": nodeRadius,
   "cx": nodeScreenPosition[vv][0],
   "cy": nodeScreenPosition[vv][1],
  }).appendTo("#thecanvas");

  // usual way: all edges are the same (user-selected) colour
  var thisEdgeColour = edgeColour;

  if (nodeParent[vv]>=0){  // for now, connect sequential nodes (only non-root nodes)
   //  instead of the usual way: colour the edge according to the child suffix:
   if (plainedges){
    thisEdgeColour = edgeColour;
   } else {
    var edgeFlavour = nodeAddress[vv].substr(nodeAddress[vv].length-1);
    if (edgeFlavour.length==0){ // for the empty node, we need the edge flavour of its parent (this will happen after automorphisms are applied)
     edgeFlavour = nodeAddress[nodeParent[vv]].substr(nodeAddress[nodeParent[vv]].length-1);
    }
    thisEdgeColour = someColours[colournames.indexOf(edgeFlavour)];
   }


   $(document.createElementNS("http://www.w3.org/2000/svg","line")).attr({
    "stroke": (nodeIgnore[vv]?(ignoreEdgeColour.length?ignoreEdgeColour:"none"):thisEdgeColour),
//old    "stroke-dasharray": (nodeIgnore[vv]?ignoreDash:"none"),
    "stroke-dasharray": (nodeIgnore[vv]?(nodeOnAxis[vv]?Math.max(ignoreDash,axisLineWidth*0.3*ignoreDash):ignoreDash):"none"),
    "stroke-width": (nodeOnAxis[vv]?Math.max(axisLineWidth,lineWidth):lineWidth),
    "stroke-linecap": "round",
//    "marker-end": "url(#axesarrow)", // we probably don't want these
    "x1": position0[0],
    "y1": position0[1],
    "x2": nodeScreenPosition[vv][0],
    "y2": nodeScreenPosition[vv][1],
    // give the extensions an id just in case we need to find them:
    "id": (nodeAddress[vv]=="RR"|nodeAddress[nodeParent[vv]]=="RR"|nodeAddress[vv]=="LL"|nodeAddress[nodeParent[vv]]=="LL"?nodeAddress[vv]:""),
   }).appendTo("#thecanvas");
  }

  var thislabel = "";
  if (showlabels>0) {
   // figure out the label for this node:
   switch (showlabels){
    case 0: // no label
     thislabel = ""; // should not happen but define this here in case we change things in the future
     break;
    case 1: // label is the node address
     thislabel = (nodeAddress[vv]==""?"\u{d8}":nodeAddress[vv]); // address or o-slash for the empty node
     break;
    case 2: // label is the node index
     thislabel = nodeIndex[vv]+""; // cast to a string
     break;
    case 3: // label is some custom text which the user can change
     thislabel = nodeLabel[vv]+"";
     break;
    default:
     thislabel = "";
   }

   if (thislabel.length>0){ // don't create (empty) labels with blank text
    var newText = document.createElementNS("http://www.w3.org/2000/svg","text");
    $(newText).attr({
     "fill": (nodeIgnore[vv]?(ignoreLabelColour.length?ignoreLabelColour:"none"):labelColour),
     "font-size": fontSize,
     "x": nodeScreenPosition[vv][0] + labelOffsetX,
     "y": nodeScreenPosition[vv][1] + labelOffsetY,
     "transform": "rotate("+textAngle+","+(nodeScreenPosition[vv][0]+labelOffsetX)+","+(nodeScreenPosition[vv][1]+labelOffsetY)+")",
     "style": "dominant-baseline:middle; text-anchor:"+(showlabels==3?"left":"middle")+";",
    });
    // the text node has been created, so insert the node's label
    var textNode = document.createTextNode(thislabel);
    newText.appendChild(textNode);
    document.getElementById("thecanvas").appendChild(newText);
   }
  } // end if showlabels


 } // end loop over nodes

 var showedgelabels = true; // make this a user control
 if (showedgelabels){
  for (var i=0;i<midpointLabel.length;i++){
   thislabel = midpointLabel[i]+"";

   if (thislabel.length>0){ // don't create (empty) labels with blank text
    var newText = document.createElementNS("http://www.w3.org/2000/svg","text");
    $(newText).attr({
     "fill": labelColour,
     "font-size": fontSize,
     "x": midpointPosition[i][0] + labelOffsetX,
     "y": midpointPosition[i][1] + labelOffsetY,
     "transform": "rotate("+textAngle+","+(midpointPosition[i][0]+labelOffsetX)+","+(midpointPosition[i][1]+labelOffsetY)+")",
     "style": "dominant-baseline:middle; text-anchor: middle;",
    });
    // the text node has been created, so insert the node's label
    var textNode = document.createTextNode(thislabel);
    newText.appendChild(textNode);
    document.getElementById("thecanvas").appendChild(newText);
   }

  } // end loop over edgelabels
 } // end showedgelabels

 // add arrows to the lines if requested:
 if (showarrows){
  addArrows();
 }

 // finally, scroll the info div to the end, in case we appended anything
 $("#info").animate({ scrollTop: $('#info').prop("scrollHeight")}, 1000);

 // finished successfully
 return 1;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
// calculate matrix product
// Thanks Ian: https://stackoverflow.com/a/44197345
function matrixXY(m,x,y) {
 return { x: x * m.a + y * m.c + m.e, y: x * m.b + y * m.d + m.f };
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
// get transformed bounding box
// Thanks Ian: https://stackoverflow.com/a/44197345
function getTransformedBBox(obj){
 var tr = obj.getCTM();
 var bbox0 = obj.getBBox();
 var bbox1 = [];
 var corners0 = [
   matrixXY(tr,bbox0.x,bbox0.y),
   matrixXY(tr,bbox0.x+bbox0.width,bbox0.y),
   matrixXY(tr,bbox0.x+bbox0.width,bbox0.y+bbox0.height),
   matrixXY(tr,bbox0.x,bbox0.y+bbox0.height)
 ];
 bbox1.x = Number.POSITIVE_INFINITY;
 bbox1.y = Number.POSITIVE_INFINITY;
 bbox1.width = Number.NEGATIVE_INFINITY;
 bbox1.height = Number.NEGATIVE_INFINITY;

 // get the left,top,width,height like getBBox()
 for (var i=0;i<4;i++){
  if (corners0[i].x<bbox1.x) bbox1.x = corners0[i].x;
  if (corners0[i].y<bbox1.y) bbox1.y = corners0[i].y;
 }
 for (var i=0;i<4;i++){
  if ((corners0[i].x-bbox1.x)>bbox1.width)  bbox1.width  = corners0[i].x-bbox1.x;
  if ((corners0[i].y-bbox1.y)>bbox1.height) bbox1.height = corners0[i].y-bbox1.y;
 }

 return bbox1;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
// function to find the bounding box of the extant nodes
function bounds() {
 var minX = Number.POSITIVE_INFINITY;
 var maxX = Number.NEGATIVE_INFINITY;
 var minY = Number.POSITIVE_INFINITY;
 var maxY = Number.NEGATIVE_INFINITY;

 var showlabels = parseInt($("#whichlabel").val());
 var showarrows = $("#showarrowsbutton").prop("checked");

 var svgchildren=document.getElementById("thecanvas").children;
 for (var i=0;i<svgchildren.length;i++){
  switch (svgchildren[i].nodeName){
   case "circle": // node
    if (svgchildren[i].className.baseVal!="midptlabel"){ // ignore the midpoint markers
     var bbox = getTransformedBBox(svgchildren[i]);
     var circleX = parseFloat(bbox.x); // left
     var circleY = parseFloat(bbox.y); // top (on screen)
     var circleW = parseFloat(bbox.width);
     var circleH = parseFloat(bbox.height);
     if ((circleX)<minX)         minX=(circleX);
     if ((circleX+circleW)>maxX) maxX=(circleX+circleW);
     if ((circleY)<minY)         minY=(circleY);
     if ((circleY+circleH)>maxY) maxY=(circleY+circleH);
    }
    break;
   case "text": // label
    if (showlabels>0){
     var bbox = getTransformedBBox(svgchildren[i]);
     var textX = parseFloat(bbox.x); // left
     var textY = parseFloat(bbox.y); // top (on screen)
     var textW = parseFloat(bbox.width);
     var textH = parseFloat(bbox.height);
     if ((textX)<minX)       minX=(textX);
     if ((textX+textW)>maxX) maxX=(textX+textW);
     if ((textY)<minY)       minY=(textY);
     if ((textY+textH)>maxY) maxY=(textY+textH);
    }
    break;
   case "use": // arrow
    if (showarrows>0){
     var bbox = getTransformedBBox(svgchildren[i]);
     var textX = parseFloat(bbox.x); // left
     var textY = parseFloat(bbox.y); // top (on screen)
     var textW = parseFloat(bbox.width);
     var textH = parseFloat(bbox.height);
     if ((textX)<minX)       minX=(textX);
     if ((textX+textW)>maxX) maxX=(textX+textW);
     if ((textY)<minY)       minY=(textY);
     if ((textY+textH)>maxY) maxY=(textY+textH);
    }
    break;
  }
 }

 minX=Math.floor(minX);
 maxX=Math.ceil(maxX);
 minY=Math.floor(minY);
 maxY=Math.ceil(maxY);

 return {minX, maxX, minY, maxY};
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function savePDF(){
 // make sure the midpoint markers are hidden
 $(".midptlabel").css("display","none");

 var saveBounds = bounds();
 var pdfwidth = Math.ceil(saveBounds.maxX-saveBounds.minX);
 var pdfheight = Math.ceil(saveBounds.maxY-saveBounds.minY);
 var xoff = -saveBounds.minX;
 var yoff = -saveBounds.minY;
 var layout = "portrait";

 if (pdfwidth>pdfheight) layout="landscape";
 var thepdf = new jsPDF(layout, "pt", [pdfheight, pdfwidth]);

 // This produces a PDF which is approx. 33% larger than on screen;
 // changing "scale" to 75% broke the offsets and/or width-height.
 svg2pdf(document.getElementById("thecanvas"), thepdf, {
       xOffset: xoff,
       yOffset: yoff,
       scale: 1,
 });
 thepdf.save("graph.pdf");
 return 0;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function savePNG(){
 // for options see https://github.com/exupero/saveSvgAsPng

 // make sure the midpoint markers are hidden
 $(".midptlabel").css("display","none");

 var transparentBG = $("#transparencybutton").prop('checked');
 var saveBounds = bounds();
 var saveOptions = {
  scale: 2.0, // larger, better quality
  backgroundColor: (transparentBG?"#fff0":"#fff"), // transparent or not
  left: saveBounds.minX,
  top: saveBounds.minY,
  width: saveBounds.maxX-saveBounds.minX,
  height: saveBounds.maxY-saveBounds.minY,
 };

 saveSvgAsPng(document.getElementById("thecanvas"), "graph.png", saveOptions);
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function deleteChildren(a){
 // loop over all nodes and find a's children, but before deleting them, delete their children
 for (var n=0;n<nodeIndex.length;n++){
  if (nodeParent[n]==a){
   deleteChildren(nodeIndex[n]); // call deleteChildren() on each child node recursively
   // child node's children have been deleted, so delete this child node:
   //
   // add code here:
   //  - delete the label SVG object
   //  - delete the node (circle) SVG object
   //  - delete (splice) the node's entry in various arrays
   //    -- this might not be necessary, could we just have a "don't draw this node" flag?
   //    -- that would obviate the SVG deletions too...
  }
 }
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function countOnAxis(){
 return nodeOnAxis.filter(function(s) { return s; }).length;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function nearestNode(x,y,maxDistance=-1){
 // Returns the closest node to the provided x and y coordinates, within a range of maxDistance
 // If maxDistance is negative, it is ignored (the nearest node is then returned, at *any* distance from (x,y))
 var thenode = -1;
 var dist = 10000000;
 for (var i=0;i<nodeScreenPosition.length;i++){
  var thisdist = Math.pow(Math.pow(nodeScreenPosition[i][0] - x,2) + Math.pow(nodeScreenPosition[i][1] - y,2),0.5);
  if (thisdist<dist & (thisdist<=maxDistance | maxDistance<0)){
   dist = thisdist;
   thenode = i;
  }
 }
 if (thenode>=0){
  return thenode;
 } else {
  return null;
 }
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function nearestMidpoint(x,y,maxDistance=-1){
 // Returns the closest edge midpoint to the provided x and y coordinates, within a range of maxDistance
 // If maxDistance is negative, it is ignored (the nearest midpoint then is returned, at *any* distance from (x,y))
 var themidpoint = -1;
 var dist = 10000000;
 for (var i=0;i<midpointPosition.length;i++){
  var thisdist = Math.pow(Math.pow(midpointPosition[i][0] - x,2) + Math.pow(midpointPosition[i][1] - y,2),0.5);
  if (thisdist<dist & (thisdist<=maxDistance | maxDistance<0)){
   dist = thisdist;
   themidpoint = i;
  }
 }
 if (themidpoint>=0){
  return themidpoint;
 } else {
  return null;
 }
}



/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function canvasClick(evt){
 // We need to test whether the user clicked on an empty piece of the canvas
 // or on an SVG element (node, line, etc.). In the latter case, get the bounding
 // box of the parent element (ie. the SVG object itself), not the clicked object.
 var debug = false;
 var e = evt.target;
 if (e.ownerSVGElement === null){ // clicked on the canvas
  var dim = e.getBoundingClientRect();
 } else { // clicked on an SVG element (node, line, etc.)
  var dim = e.parentElement.getBoundingClientRect();
 }

 var x = Math.round(evt.clientX - dim.left);
 var y = Math.round(evt.clientY - dim.top);
// console.log("CLICKED x: "+x+" y:"+y);

 var clickRadius = 100; // effective range of clicks: nodes further than this will not, in effect, be clicked

 if (evt.ctrlKey) {
  var usenode = nearestNode(x,y,clickRadius);
  if (usenode === null){
   //  No node is within a distance of clickRadius
   if (debug) console.log("Click was too far from any node to be used");
  } else {

   //
   // CTRL-click: set the automorphism nodes
   //

   var addr = nodeAddress[usenode];
   if (addr.length==0) addr = "0";
   if (debug) console.log("Chose nearest node: "+nodeAddress[usenode]);
   var changeField = $(".clickentry:first"); //.attr("id");
   $(changeField).attr("value",addr);
   $("#automorph1").addClass("clickentry");
   $("#automorph2").addClass("clickentry");
   $(changeField).removeClass("clickentry");
   checkValidAddress(changeField);
//   $(changeField).removeClass("invalid");
  } // end check for null node


 } else if (evt.shiftKey) {
//  alert("Clicked while pressing SHIFT key");

  //
  // SHIFT-click: set edge labels
  //

  var usemidpoint = nearestMidpoint(x,y,clickRadius);
  if (usemidpoint === null){
   //  No midpoint is within a distance of clickRadius
   if (debug) console.log("Click was too far from any node to be used");
  } else {

   //
   // set an edge's midpoint custom label
   //
//   var currentaddress = midpointLabel[usemidpoint];
//   if (currentaddress.length==0) currentaddress="\u{d8}";
   var currentlabel = midpointLabel[usemidpoint];
   // request the new label; give the current custom label (if any) as default
   newlabel = prompt("Set midpoint label");
   if (newlabel===null){
    // if the user clicked cancel hide the midpoints
    $("#thecanvas").css("cursor", "pointer");
    $(".midptlabel").css("display","none");
   } else {
    midpointLabel[usemidpoint] = newlabel;
    drawgraph();
   }
  } // end check for null node








 } else {
  var usenode = nearestNode(x,y,clickRadius);
  if (usenode === null){
   //  No node is within a distance of clickRadius
   if (debug) console.log("Click was too far from any node to be used");
  } else {

   //
   // simple click: set a node's custom label
   //
   var currentaddress = nodeAddress[usenode];
   if (currentaddress.length==0) currentaddress="\u{d8}";
   var currentlabel = nodeLabel[usenode];
   // request the new label; give the current custom label (if any) as default, and tell the user the node's address
   newlabel = prompt("Set node label for "+currentaddress,currentlabel);
   if (newlabel===null){
    // don't change anything if the user clicked cancel
   } else {
    nodeLabel[usenode] = newlabel;
    drawgraph();
   }
  } // end check for null node

 }
 return 1;
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function showallcontrols(){
 // toggles the extra control panel, an animation suggesting that it slides out
 var ex = $("#extracontrols");
 if (parseFloat(ex.css("width"))>200){
  ex.animate({width:"20px"},100);
 } else {
  ex.animate({width:"250px"},100);
 }
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function lineMidPoint(start,end,factor=0.5){
 var alongX = start[0]+factor*(end[0]-start[0]);
 var alongY = start[1]+factor*(end[1]-start[1]);
 return [alongX,alongY];
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function addArrows(){
 // Adds arrows to all lines in the drawn SVG graph
 // "Faded" ones are styled according to the fade style
 var lineWidth = parseFloat($("#thelinewidth").val());
 var axisLineWidth = parseFloat($("#theaxislinewidth").val());
 var canvaswidth = $('#thecanvas').width();
 var canvasheight = $('#thecanvas').height();
 var offsetX = parseFloat($("#theoffsetX").val()); // pixels, but allow float
 var offsetY = parseFloat($("#theoffsetY").val()); // pixels, but allow float
 var centreX = Math.round(canvaswidth/2) + offsetX;
 var centreY = Math.round(canvasheight/2) + offsetY;
 var arrowSize = parseFloat($("#thearrowsize").val()); // only needed if we make arrows with SVG lines (currently using <use> instances)
 var arrowOffset = parseFloat($("#thearrowoffset").val()); // pixels, but allow float
 var reversedarrows = $("#reversedarrowsbutton").prop("checked");
 var fadedarrows = $("#fadedarrowsbutton").prop("checked");
 var pi = Math.PI;

 for (var i=0;i<nodeIndex.length;i++){
  // for every node, add an arrow to the line between it and its parent
  var fromNode = nodeParent[i];
  var toNode = nodeIndex[i];
  if (nodeAddress[i]=="LL"|nodeAddress[nodeParent[i]]=="LL"){
   fromNode = nodeIndex[i];
   toNode = nodeParent[i];
  }

  if (fromNode>=0 & toNode>=0 & (fadedarrows | (!nodeIgnore[toNode] & !nodeIgnore[fromNode]))){ // skip it if this node has no parent, or the node is faded
   var arrowPosition = lineMidPoint(nodePosition[fromNode],nodePosition[toNode],arrowOffset);

   // "from" node position:
   var fromPosition = canvasScale(nodePosition[fromNode]);
   // "to" node position:
   var toPosition = canvasScale(nodePosition[toNode]);

/*
   $(document.createElementNS("http://www.w3.org/2000/svg","line")).attr({
    "marker-end": "url(#rayarrow)",
    "x1": xx1,
    "y1": yy1,
    "x2": xx2,
    "y2": yy2,
    "stroke": "none",
    "stroke-width": arrowSize,
   }).appendTo("#thecanvas");
*/
   // use the <use> element instead (we need to do our own rotation, though):
   var c = canvasScale(arrowPosition);
   var cx = c[0];
   var cy = c[1];
   // Calculate the rotation of the arrow (the orientation of arrows is such that they point straight down the page
   // ie. in the positive Y direction on the canvas; -90deg moves the angle origin to the right on the web page)
   var rotangle = Math.atan2(toPosition[1]-fromPosition[1], toPosition[0]-fromPosition[0])*(180/pi) - 90; // in degrees
   if (reversedarrows) rotangle+=180;
   if (nodeOnAxis[toNode]){ // scale arrows if the axis line is thicker than normal lines
    var thisscale = Math.pow(Math.max(1,axisLineWidth/lineWidth),0.4);
    cx /= thisscale;
    cy /= thisscale;
    document.getElementById('thecanvas').insertAdjacentHTML('beforeend','<use x="'+cx+'" y="'+cy+'" width="10" height="10" xlink:href="#rayarrowbase'+(nodeIgnore[fromNode]|nodeIgnore[toNode]?'faded':'')+'" transform="'+(nodeOnAxis[toNode]?'scale('+thisscale+'),':'')+'rotate('+rotangle+' '+cx+' '+cy+')" />');
   } else {
    document.getElementById('thecanvas').insertAdjacentHTML('beforeend','<use x="'+cx+'" y="'+cy+'" width="10" height="10" xlink:href="#rayarrowbase'+(nodeIgnore[fromNode]|nodeIgnore[toNode]?'faded':'')+'" transform="rotate('+rotangle+' '+cx+' '+cy+')" />');
   }
  } // end check that node has a parent
 } // end loop over nodes
 return 1;

}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function canvasScale(pos=[0,0]){
 // scaling:
 var offsetX = parseFloat($("#theoffsetX").val()); // pixels, but allow float
 var offsetY = parseFloat($("#theoffsetY").val()); // pixels, but allow float
 var canvaswidth = $('#thecanvas').width();
 var canvasheight = $('#thecanvas').height();
 var centreX = Math.round(canvaswidth/2) + offsetX;
 var centreY = Math.round(canvasheight/2) + offsetY;
 var useScale = 100; // this needs to be a global variable IE. put it on the "all controls" panel
 // output:

 if (pos.length==2){
  // single coordinate given as input:
  var x=pos[0];
  var y=pos[1];
  var newpos = [centreX + useScale*x, canvasheight - (centreY + useScale*y)];
 } else {
  // array of coordinates given as input:
  var newpos = Array(pos.length);
  for (var i=0;i<pos.length;i++){
   var x=pos[i][0];
   var y=pos[i][1];
   newpos[i] = [centreX + useScale*x, canvasheight - (centreY + useScale*y)];
  }
 }
 return newpos;
}
