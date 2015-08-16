var LambertianMaterial = function(color){
	this.color = color;
}

var LAMBERTIAN_MATERIAL_GLSL =
"vec3 lambertian_material(vec3 color){" +
"	return color * FRAC_1_PI;" +
"}";

// Generates GLSL code to shade the material
// - f: name of GLSL variable to store the computed color in
// - w_i: name of GLSL variable containing the incident light direction
// - w_o: name of GLSL variable containing the outgoing light direction
LambertianMaterial.prototype.shade = function(f, w_i, w_o){
	return f + " = lambertian_material(" + this.color.to_glsl() + ");";
}

