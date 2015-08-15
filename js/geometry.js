var Sphere = function(pos, radius){
	this.pos = pos;
	this.radius = radius;
}

var SPHERE_DISTANCE_GLSL =
"float sphere_distance(vec3 x, vec3 c, float r){" +
"	return length(x - c) - r;" +
"}";

// Generates GLSL code to compute the distance from the sphere of some point
// - x: name of GLSL variable containing point to find distance from
// - ret: name of GLSL variable to store return value in
Sphere.prototype.distance = function(x, ret){
	return ret + " = sphere_distance(" + x + ", " + this.pos.to_glsl()
		+ ", " + this.radius + ");";
}

// Describes a Torus in the X-Y plane
var Torus = function(pos, radius, ring_radius){
	this.pos = pos;
	this.radius = radius;
	this.ring_radius = ring_radius;
}

var TORUS_DISTANCE_GLSL =
"float torus_distance(vec3 x, vec3 c, float r, float ring_r){" +
"	return length(vec2(length(x.xy - c.xy) - r, x.z - c.z)) - ring_r;" +
"}";

// Generates GLSL code to compute the distance from the torus at some point
// - x: name of GLSL variable containing point to find distance from
// - ret: name of GLSL variable to store return value in
Torus.prototype.distance = function(x, ret){
	return ret + " = torus_distance(" + x + ", " + this.pos.to_glsl()
		+ ", " + this.radius + ", " + this.ring_radius + ");";
}

