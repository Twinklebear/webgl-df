var Sphere = function(pos, radius, material){
	this.pos = pos;
	this.radius = radius;
	this.material = material;
}

var SPHERE_DISTANCE_GLSL =
"float sphere_distance(vec3 x, vec3 c, float r){" +
"	return length(x - c) - r;" +
"}";

// Generates GLSL code to compute the distance from the sphere of some point
// - x: name of GLSL variable containing point to find distance from
// - ret: name of GLSL variable to store return value in
// - mat: name of GLSL variable to store the material id in
Sphere.prototype.distance = function(x, ret, mat){
	var glsl = ret + " = sphere_distance(" + x + ", " + this.pos.to_glsl() + ", " + this.radius + ");";
	if (typeof mat !== "undefined"){
		glsl += mat + " = " + this.material + ";";
	}
	return glsl;
}

// Describes a Torus in the X-Y plane
var Torus = function(pos, radius, ring_radius, material){
	this.pos = pos;
	this.radius = radius;
	this.ring_radius = ring_radius;
	this.material = material;
}

var TORUS_DISTANCE_GLSL =
"float torus_distance(vec3 x, vec3 c, float r, float ring_r){" +
"	return length(vec2(length(x.xy - c.xy) - r, x.z - c.z)) - ring_r;" +
"}";

// Generates GLSL code to compute the distance from the torus at some point
// - x: name of GLSL variable containing point to find distance from
// - ret: name of GLSL variable to store return value in
// - mat: name of GLSL variable to store the material id in
Torus.prototype.distance = function(x, ret, mat){
	var glsl = ret + " = torus_distance(" + x + ", " + this.pos.to_glsl()
		+ ", " + this.radius + ", " + this.ring_radius + ");";
	if (typeof mat !== "undefined"){
		glsl += mat + " = " + this.material + ";";
	}
	return glsl;
}

