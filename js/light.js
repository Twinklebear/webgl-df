var PointLight = function(pos, emission){
	this.pos = pos;
	this.emission = emission;
}

var POINT_LIGHT_SAMPLE_GLSL =
"vec3 sample_point_light(vec3 light_pos, vec3 emission, vec3 p, out vec3 w_i){" +
"	w_i = light_pos - p;" +
"	vec3 e = emission / length(w_i);" +
"	w_i = normalize(w_i);" +
"	return e;" +
"}";

// Generates GLSL code to sample the point light.
// - p: name of GLSL variable containing the position we want to sample the light at
// - li: name of GLSL variable to save the emitted light to
// - w_i: name of GLSL variable to save the light direction ray to
// Each of these variables should already be defined
PointLight.prototype.sample = function(p, li, w_i){
	return li + " = sample_point_light(" + this.pos.to_glsl()
		+ ", " + this.emission.to_glsl() + ", " + p + ", " + w_i + ");"
}

var DirectLight = function(dir, emission){
	this.dir = dir;
	this.emission = emission;
}

var DIRECT_LIGHT_SAMPLE_GLSL =
"vec3 sample_direct_light(vec3 light_dir, vec3 emission, vec3 p, out vec3 w_i){" +
"	w_i = normalize(light_dir);" +
"	return emission;" +
"}";

DirectLight.prototype.sample = function(p, li, w_i){
	return li + " = sample_direct_light(" + this.dir.to_glsl()
		+ ", " + this.emission.to_glsl() + ", " + p  + ", " + w_i + ");";
}

