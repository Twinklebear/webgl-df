
window.onload = function(){
	var canvas = document.getElementById("glcanvas");
	var vs_src =
		"attribute vec2 pos;\n" +
		"void main(void){\n" +
		"	gl_Position = vec4(pos, 0, 1);\n" +
		"}\n"
	var fs_src =
		"precision mediump float;\n" +
		"void main(void){\n" +
		"	vec2 col = gl_FragCoord.xy / vec2(640, 480);\n" +
		"	gl_FragColor = vec4(col.x, col.y, 0, 1);\n" +
		"}\n";
	var vertices = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];

	gl = initGL(canvas);
	gl.disable(gl.DEPTH_TEST);

	var shader = compileShader(vs_src, fs_src);

	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	var pos_attrib = gl.getAttribLocation(shader, "pos");
	gl.enableVertexAttribArray(pos_attrib);
	gl.vertexAttribPointer(pos_attrib, 2, gl.FLOAT, false, 0, 0);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(shader);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Initialize a WebGL context in the canvas DOM element passed
// will return null and alert the user if we couldn't initialize a WebGL context
function initGL(canvas){
	var gl = null;
	try {
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	catch (e){}

	if (!gl){
		alert("Unable to initialize WebGL. Your browser may not support it.");
	}
	return gl;
}

// Compile and link the shaders vert and frag. vert and frag should contain
// the shader source code for the vertex and fragment shaders respectively
// Returns the compiled and linked program, or null if compilation or linking failed
function compileShader(vert, frag){
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, vert);
	gl.compileShader(vs);
	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)){
		alert("Vertex shader failed to compile, see console for log");
		console.log(gl.getShaderInfoLog(vs));
		return null;
	}

	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, frag);
	gl.compileShader(fs);
	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)){
		alert("Fragment shader failed to compile, see console for log");
		console.log(gl.getShaderInfoLog(fs));
		return null;
	}

	var program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
		alert("Shader failed to link, see console for log");
		console.log(gl.getProgramInfoLog(program));
		return null;
	}
	return program;
}

