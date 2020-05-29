function demoOne(){
 // change the values of the controls and then call setup(), which sets the control output labels and then draws the graph
 $("#thevalency").val(3);
 $("#thelevels").val(6);
 $("#thescaling").val(0.8);
 $("#thelength").val(1.3);
 $("#thespread").val(1.8);
 $("#plainedgesbutton").prop("checked",true);
 $("#edgeicker").spectrum("set","#000000");
 $("#nodepicker").spectrum("set","#990000");
 $("#whichlabel").val(1);
 $("#labelpicker").spectrum("set","#2244ff");
 $("#axesbutton").prop("checked",false);
 $("#axespicker").spectrum("set","#3399ff");
 $("#fadeleavesbutton").prop("checked",true);
 $("#showarrowsbutton").prop("checked",false);
 $("#theoffsetX").val(0);
 $("#theoffsetY").val(0);
 $("#thetextangle").val(0);
 $("#thefontsize").val(10);
 $("#thenodesize").val(4);
 $("#thelinewidth").val(1.3);
 $("#transparencybutton").prop("checked",false);
 $("#automorph1").val("");
 $("#automorph2").val("");
 $("#thearrowsize").val(3);
 $("#thearrowratio").val(2);
 $("#thearrowoffset").val(0.3);
 $("#filledarrowsbutton").prop("checked",true);
 $("#reversedarrowsbutton").prop("checked",false);
 $("#fadedarrowsbutton").prop("checked",false);
 $("#theaxislinewidth").val(0.2);
 setup("edge");
}