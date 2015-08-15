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

