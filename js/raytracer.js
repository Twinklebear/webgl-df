var constants =
"#define FRAC_1_PI 0.318309886183\n";
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

var light = new PointLight(new Vec3f(2, 3, 3), new Vec3f(10, 10, 10), "light");

window.onload = function(){
	var canvas = document.getElementById("glcanvas");
	var vertices = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
	WIDTH = canvas.getAttribute("width");
	HEIGHT = canvas.getAttribute("height");

	gl = initGL(canvas);
	gl.disable(gl.DEPTH_TEST);

	raytrace = buildSceneShader();
	textured_quad = compileShader(textured_quad_vs, textured_quad_fs);

	vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	pos_attrib = gl.getAttribLocation(raytrace, "pos");
	sample_unif = gl.getUniformLocation(raytrace, "sample");
	eye_unif = gl.getUniformLocation(raytrace, "eye");
	var canvas_dim_unif = gl.getUniformLocation(raytrace, "canvas_dim");
	ray_unifs = [];
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray00"));
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray10"));
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray01"));
	ray_unifs.push(gl.getUniformLocation(raytrace, "ray11"));
	gl.useProgram(raytrace);
	gl.uniform2f(canvas_dim_unif, WIDTH, HEIGHT);
	eye_pos = new Vec3f(0, 0, 2);
	var rays = perspectiveCamera(eye_pos, new Vec3f(0, 0, 0), new Vec3f(0, 1, 0), 60.0, WIDTH / HEIGHT);
	for (var i = 0; i < 4; ++i){
		var vals = rays[i].flatten();
		gl.uniform3fv(ray_unifs[i], rays[i].flatten());
	}
	gl.uniform3fv(eye_unif, eye_pos.flatten());

	gl.enableVertexAttribArray(pos_attrib);
	gl.vertexAttribPointer(pos_attrib, 2, gl.FLOAT, false, 0, 0);

	pos_attrib = gl.getAttribLocation(textured_quad, "pos");
	gl.enableVertexAttribArray(pos_attrib);
	gl.vertexAttribPointer(pos_attrib, 2, gl.FLOAT, false, 0, 0);

	textures = [gl.createTexture(), gl.createTexture()];
	for (var i = 0; i < 2; ++i){
		gl.bindTexture(gl.TEXTURE_2D, textures[i]);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, WIDTH, HEIGHT, 0, gl.RGB, gl.FLOAT, null);
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
	// Set the light x slider to the initial position
	document.getElementById("light_x").value = (light.pos.x + 5) * 5;
	document.getElementById("light_y").value = (light.pos.y + 5) * 5;
	document.getElementById("light_z").value = (light.pos.z + 5) * 5;

	var start = new Date();
	setInterval(function(){
		render((new Date() - start) * 0.001);
	}, 200);
}

// Called every frame to render a new sampling pass
// elapsed contains the time elapsed in seconds
function render(elapsed){
	var light_sliders = new Vec3f(document.getElementById("light_x").value / 5 - 5,
			document.getElementById("light_y").value / 5 - 5,
			document.getElementById("light_z").value / 5 - 5);
	if (!light.pos.equal(light_sliders)){
		light.pos = light_sliders;
		raytrace = buildSceneShader();
		pos_attrib = gl.getAttribLocation(raytrace, "pos");
		sample_unif = gl.getUniformLocation(raytrace, "sample");
		eye_unif = gl.getUniformLocation(raytrace, "eye");
		var canvas_dim_unif = gl.getUniformLocation(raytrace, "canvas_dim");
		ray_unifs = [];
		ray_unifs.push(gl.getUniformLocation(raytrace, "ray00"));
		ray_unifs.push(gl.getUniformLocation(raytrace, "ray10"));
		ray_unifs.push(gl.getUniformLocation(raytrace, "ray01"));
		ray_unifs.push(gl.getUniformLocation(raytrace, "ray11"));
		gl.useProgram(raytrace);
		gl.uniform2f(canvas_dim_unif, WIDTH, HEIGHT);
		eye_pos = new Vec3f(0, 0, 2);
		var rays = perspectiveCamera(eye_pos, new Vec3f(0, 0, 0), new Vec3f(0, 1, 0), 60.0, WIDTH / HEIGHT);
		for (var i = 0; i < 4; ++i){
			var vals = rays[i].flatten();
			gl.uniform3fv(ray_unifs[i], rays[i].flatten());
		}
		gl.uniform3fv(eye_unif, eye_pos.flatten());
		sample_pass = 0;
	}
	var target = sample_pass % 2 == 0 ? 0 : 1;
	var prev_tex = (target + 1) % 2;

	gl.useProgram(raytrace);
	var rays = perspectiveCamera(eye_pos, new Vec3f(0, 0, 0), new Vec3f(0, 1, 0), 60.0, WIDTH / HEIGHT);
	for (var i = 0; i < 4; ++i){
		var vals = rays[i].flatten();
		gl.uniform3fv(ray_unifs[i], rays[i].flatten());
	}

	gl.bindTexture(gl.TEXTURE_2D, textures[prev_tex]);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[target]);
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
	var jitter = new Vec3f((Math.random() * 2 - 1) / WIDTH, (Math.random() * 2 - 1) / HEIGHT, 0);
	var dz = normalize(target.sub(eye).add(jitter));
	var dx = normalize(cross(dz, up));
	var dy = normalize(cross(dx, dz));
	var dim_y = 2.0 * Math.sin(fovy / 2.0 * Math.PI / 180.0);
	var dim_x = dim_y * aspect_ratio;
	rays = [];
	// ray00
	rays.push(normalize(dz.sub(dx.scale(0.5 * dim_x)).sub(dy.scale(0.5 * dim_y))));
	// ray10
	rays.push(normalize(dz.add(dx.scale(0.5 * dim_x)).sub(dy.scale(0.5 * dim_y))));
	// ray01
	rays.push(normalize(dz.sub(dx.scale(0.5 * dim_x)).add(dy.scale(0.5 * dim_y))));
	// ray11
	rays.push(normalize(dz.add(dx.scale(0.5 * dim_x)).add(dy.scale(0.5 * dim_y))));
	return rays;
}

// Rebuild scene shader based on the updated scene
// TODO: This should take a scene object containing the new scene
// but for now we're just changing the global light
function buildSceneShader(){
	var ray_fs_src =
		constants +
		"precision highp float;" +
		"uniform float sample;" +
		"uniform vec3 eye;" +
		"uniform sampler2D prev_tex;" +
		"uniform vec2 canvas_dim;" +
		"varying vec3 px_ray;" +
		POINT_LIGHT_SAMPLE_GLSL +
		"float sphere_distance(vec3 x, vec3 c, float r){" +
		"	return length(x - c) - r;" +
		"}" +
		"float torus_distance(vec3 x, vec3 c, float r, float ring_r){" +
		"	return length(vec2(length(x.xy - c.xy) - r, x.z - c.z)) - ring_r;" +
		"}" +
		"float scene_distance(vec3 x){" +
		"	vec3 centers = vec3(0, 0, 0);" +
		"	return min(sphere_distance(x, centers, 0.4), torus_distance(x, centers, 0.6, 0.1));" +
		"}" +
		"vec3 lambertian_material(){" +
		"	vec3 reflectance = vec3(1, 0, 0);" +
		"	return reflectance * FRAC_1_PI;" +
		"}" +
		"vec3 gradient(vec3 p){" +
		"	float h = 0.5 * 0.00001;" +
		"	float den = 1.0 / (2.0 * h);" +
		"	float dx = den * (scene_distance(p + vec3(h, 0, 0)) - scene_distance(p - vec3(h, 0, 0)));" +
		"	float dy = den * (scene_distance(p + vec3(0, h, 0)) - scene_distance(p - vec3(0, h, 0)));" +
		"	float dz = den * (scene_distance(p + vec3(0, 0, h)) - scene_distance(p - vec3(0, 0, h)));" +
		"	return vec3(dx, dy, dz);" +
		"}" +
		"bool shadow_test(vec3 ray_dir, vec3 ray_orig){" +
		"	const float max_dist = 1.0e10;" +
		"	const int max_iter = 50;" +
		"	float t = 0.001;" +
		"	for (int i = 0; i < max_iter; ++i){" +
		"		vec3 p = ray_orig + ray_dir * t;" +
		"		float dt = scene_distance(p);" +
		"		t += dt;" +
		"		if (dt <= 1.0e-4){" +
		"			return true;" +
		"		}" +
		"	}" +
		"	return false;" +
		"}" +
		"vec3 intersect_scene(vec3 ray_dir, vec3 ray_orig){" +
		"	const float max_dist = 1.0e10;" +
		"	const int max_iter = 50;" +
		"	float t = 0.0;" +
		"	vec3 pass_color = vec3(0);" +
		"	for (int i = 0; i < max_iter; ++i){" +
		"		vec3 p = ray_orig + ray_dir * t;" +
		"		float dt = scene_distance(p);" +
		"		t += dt;" +
		"		if (dt <= 1.0e-4){" +
		"			vec3 li = vec3(0);" +
		"			vec3 w_i = vec3(0);" +
		light.sample("p", "li", "w_i") +
		"			if (!shadow_test(w_i, p)){" +
		"				vec3 normal = normalize(gradient(p));" +
		"				pass_color = lambertian_material() * li * abs(dot(w_i, normal));" +
		"			}" +
		"			break;" +
		"		}" +
		"	}" +
		"	return pass_color;" +
		"}" +
		"void main(void){" +
		"	vec3 ray_dir = normalize(px_ray);" +
		"	vec3 pass_color = intersect_scene(ray_dir, eye);" +
		"	vec3 prev_pass = texture2D(prev_tex, gl_FragCoord.xy / canvas_dim).rgb;" +
		"	gl_FragColor = vec4(prev_pass + (pass_color - prev_pass) / (sample + 1.0), 1.0);" +
		"}";
	return compileShader(ray_vs_src, ray_fs_src);
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

