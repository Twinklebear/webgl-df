var textured_quad_vs =
"attribute vec2 pos;" +
"varying vec2 texcoord;" +
"void main(void){" +
"	texcoord = (pos + vec2(1)) * 0.5;" +
"	gl_Position = vec4(pos, 0, 1);" +
"}";

var textured_quad_fs =
"precision highp float;" +
"uniform sampler2D tex;" +
"varying vec2 texcoord;" +
"void main(void){" +
"	gl_FragColor = texture2D(tex, texcoord);" +
"}";

var ray_vs_src =
"attribute vec2 pos;" +
"uniform vec3 ray00, ray10, ray01, ray11;" +
"varying vec3 px_ray;" +
"void main(void){" +
"	vec2 m = 0.5 * (pos.xy + vec2(1));" +
"	px_ray = mix(mix(ray00, ray01, m.y), mix(ray10, ray11, m.y), m.x);" +
"	gl_Position = vec4(pos, 0, 1);" +
"}";

var ray_fs_src =
"precision highp float;" +
"uniform float sample;" +
"uniform vec3 eye;" +
"varying vec3 px_ray;" +
"float sphere_distance(vec3 x, vec3 c, float r){" +
"	return length(x - c) - r;" +
"}" +
"void main(void){" +
"	vec3 ray_dir = normalize(px_ray);" +
"	const float max_dist = 1.0e10;" +
"	const int max_iter = 50;" +
"	float t = 0.0;" +
"	for (int i = 0; i < max_iter; ++i){" +
"		float dt = sphere_distance(eye + ray_dir * t, vec3(0, 0, 0), 0.5);" +
"		t += dt;" +
"		if (dt <= 1.0e-2){" +
"			gl_FragColor = vec4(1);" +
"			return;" +
"		}" +
"	}" +
"	gl_FragColor = 0.2 * vec4(mod(sample, 2.0), 0, mod(sample + 1.0, 2.0), 1);" +
"}";

window.onload = function(){
	var canvas = document.getElementById("glcanvas");
	var vertices = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];

	gl = initGL(canvas);
	gl.disable(gl.DEPTH_TEST);

	raytrace = compileShader(ray_vs_src, ray_fs_src);
	textured_quad = compileShader(textured_quad_vs, textured_quad_fs);

	vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	pos_attrib = gl.getAttribLocation(raytrace, "pos");
	sample_unif = gl.getUniformLocation(raytrace, "sample");
	eye_unif = gl.getUniformLocation(raytrace, "eye");
	var ray_unifs = [];
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray00"));
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray10"));
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray01"));
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray11"));
	gl.useProgram(raytrace);
	var rays = perspectiveCamera(new Vec3f(0, 0, -1), new Vec3f(0, 0, 0), new Vec3f(0, 1, 0), 75.0, 640.0 / 480.0);
	for (var i = 0; i < 4; ++i){
		var vals = rays[i].flatten();
		gl.uniform3fv(ray_unifs[i], rays[i].flatten());
	}
	gl.uniform3fv(eye_unif, [0.0, 0.0, -2.0]);

	gl.enableVertexAttribArray(pos_attrib);
	gl.vertexAttribPointer(pos_attrib, 2, gl.FLOAT, false, 0, 0);

	pos_attrib = gl.getAttribLocation(textured_quad, "pos");
	gl.enableVertexAttribArray(pos_attrib);
	gl.vertexAttribPointer(pos_attrib, 2, gl.FLOAT, false, 0, 0);

	textures = [gl.createTexture(), gl.createTexture()];
	for (var i = 0; i < 2; ++i){
		gl.bindTexture(gl.TEXTURE_2D, textures[i]);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 640, 480, 0, gl.RGB, gl.FLOAT, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	// Setup two RGB32F render targets to flip between
	framebuffers = [gl.createFramebuffer(), gl.createFramebuffer()];
	for (var i = 0; i < 2; ++i){
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[i], 0);
	}

	sample_pass = 0;

	var start = new Date();
	setInterval(function(){
		render((new Date() - start) * 0.001);
	}, 1000 / 5);
}

// Called every frame to render a new sampling pass
// elapsed contains the time elapsed in seconds
function render(elapsed){
	var target = sample_pass % 2 == 0 ? 0 : 1;

	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[target]);
	gl.useProgram(raytrace);
	gl.uniform1f(sample_unif, sample_pass);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, textures[target]);
	gl.useProgram(textured_quad);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	++sample_pass;
}

// Compute a perspective projection camera and return the directions to each corner pixel
// returns: [ray00, ray01, ray10, ray11]
function perspectiveCamera(eye, target, up, fovy, aspect_ratio){
	var dz = normalize(target.sub(eye));
	var dx = normalize(cross(dz, up).negate());
	var dy = normalize(cross(dx, dz));
	var dim_y = 2.0 * Math.sin((fovy * Math.PI) / 360.0);
	var dim_x = dim_y * aspect_ratio;
	rays = [];
	rays.push(normalize(dz.sub(dx.scale(0.5 * dim_x)).sub(dy.scale(0.5 * dim_y))));
	rays.push(normalize(dz.sub(dx.scale(0.5 * dim_x)).add(dy.scale(0.5 * dim_y))));
	rays.push(normalize(dz.add(dx.scale(0.5 * dim_x)).sub(dy.scale(0.5 * dim_y))));
	rays.push(normalize(dz.add(dx.scale(0.5 * dim_x)).add(dy.scale(0.5 * dim_y))));
	return rays;
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
		return null;
	}
	if (!gl.getExtension("OES_texture_float")){
		alert("Unable to get OES_texture_float extension. Your browser may not support it");
		return null;
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

