/**
 * @file: customize.js
 * @author: Khuc Nam Hai
 * @date: 08 May 2017
 * @pure javascript only
 */

var _size=0;
var DEFAULT_FILE = "palikkatiedosto.txt";
var nTetraminos = 4;
/**
 * Resolve tetraminos grid
 * @returns
 */
function resolve() {
	var web_worker = new Worker("tetris_jigsaw.js");
	document.getElementById("grid").style.display="";

	var post_message = '';

	var colors=new Array(nTetraminos+1);
	colors[0]="#FFFFFF";
	for(var i=0;i<nTetraminos;i++){
		colors[i+1]="hsl("+(360*(i/nTetraminos))+","+(i%2==0?100:50)+"%,50%)";
	}
	
	web_worker.onmessage=function(event) {
		var params=event.data.split(" ");
		if(params[0].indexOf("incorrect_file_format")==0){
			web_worker.terminate();
			document.getElementById("grid").style.display="none";
			document.getElementById("params").style.display="";
			alert("Incorrect file format");
			return;
		}
		
		if(params[0].indexOf("incorrect_data")==0){
			web_worker.terminate();
			document.getElementById("grid").style.display="none";
			document.getElementById("params").style.display="";
			alert("Incorrect file data");
			return;
		}
		if(params[0].indexOf("finished")==0){
			web_worker.terminate();
			document.getElementById("params").style.display="";
			return;
		}
		if(params[0].indexOf("filled")==0){
			var grid=document.getElementById("grid");
			var cols=parseInt(params[2]), rows=parseInt(params[1]);
			grid.width=_size*cols;
			grid.height=_size*rows;
			var cell=grid.getContext("2d");
			for(var y=0;y<rows;y++){
				for(var x=0;x<cols;x++){
					var v=parseInt(params[3+(y*cols)+x]);
					cell.fillStyle=colors[v];
					cell.fillRect(_size*x,_size*y,_size,_size);
				}
			}
			return;
		}
	}
	var fileInput = document.getElementById('pieces_data');
	var file = fileInput.files[0];
    var textType = /text.*/;

    if(file) {
    	if (file.type.match(textType)) {
    		var reader = new FileReader();
    		reader.onload = function(e) {
    			fullText = reader.result;
    			fullText = fullText.replace(/^\s*[\r\n]/gm, "");
    			pieces = fullText.split(/\r?\n/);
    			if(pieces.length != nTetraminos) {
    				document.getElementById("grid").style.display="none";
    				alert('Incorrect data');
    				return;
                }
    			web_worker.postMessage(pieces);
            }
            reader.readAsText(file);    
        } else {
        	alert("File not supported!");
        	document.getElementById("grid").style.display="none";
        	return;
        }
    } else {
    	console.log("No input file, use default file");
    	readTextFile(DEFAULT_FILE, web_worker);
    }
    
}

/** 
 * Read tetris pieces config file
 * @param file
 * @returns
 */
function readTextFile(file, web_worker) {
	// For default value
	var fullText = null;
    var rawFile;
    var pieces = [];
    try {
    	rawFile = new XMLHttpRequest(); 
    } catch(e) {
    	try {
    		rawFile=new ActiveXObject("Msxml2.XMLHTTP"); 
    	} catch(e) {
    		try {
    			rawFile=new ActiveXObject("Microsoft.XMLHTTP"); 
    		} catch(e) {
    			alert("Your browser does not support AJAX!"); 
    			return false;
    		}
    	}
    }
    
    rawFile.open("GET", file, true);
    rawFile.send();
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status == 0) {
                fullText = rawFile.responseText;
                fullText = fullText.replace(/^\s*[\r\n]/gm, "");
                pieces = fullText.split(/\r?\n/);
                web_worker.postMessage(pieces);
            }
        }
    }
    
    return pieces;
}