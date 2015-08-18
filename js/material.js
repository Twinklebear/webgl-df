var MATERIAL_FUNCTIONS_GLSL =
"void coordinate_system(vec3 e1, out vec3 e2, out vec3 e3){" +
"	if (abs(e1.x) > abs(e1.y)){" +
"		float inv_len = 1.0 / sqrt(e1.x * e1.x + e1.z * e1.z);" +
"		e2 = vec3(-e1.z * inv_len, 0.0, e1.x * inv_len);" +
"	}" +
"	else {" +
"		float inv_len = 1.0 / sqrt(e1.y * e1.y + e1.z * e1.z);" +
"		e2 = vec3(0.0, e1.z * inv_len, -e1.y * inv_len);" +
"	}" +
"	e3 = cross(e1, e2);" +
"}" +
"float bxdf_cos_theta(vec3 v){ return v.z; }" +
"float bxdf_sin_theta(vec3 v){" +
"	return sqrt(max(0.0, 1.0 - v.z * v.z));" +
"}" +
"float bxdf_cos_phi(vec3 v){" +
"	float sin_theta = bxdf_sin_theta(v);" +
"	return sin_theta == 0.0 ? 1.0 : clamp(v.x / sin_theta, -1.0, 1.0);" +
"}" +
"float bxdf_sin_phi(vec3 v){" +
"	float sin_theta = bxdf_sin_theta(v);" +
"	return sin_theta == 0.0 ? 0.0 : clamp(v.y / sin_theta, -1.0, 1.0);" +
"}";

// Generates GLSL code to transform `v_in` to shading space and write the result to `v_out`
// - n: name of GLSL variable containing the normal
// - tan: name of GLSL variable containing the tangent
// - bitan: name of GLSL variable containing the bitangent
// - v_in: name of GLSL variable containing the input variable
// - v_out: name of GLSL variable containing the output variable
function transform_to_shading_glsl(n, tan, bitan, v_in, v_out){
	return v_out + " = vec3(dot(" + v_in + ", " + bitan + ")," +
		" dot(" + v_in + ", " + tan + "), dot(" + v_in + ", " + n + "));"
}

// Generates GLSL code to transform `v_in` from shading space to world space
// and write the result to `v_out`
// - n: name of GLSL variable containing the normal
// - tan: name of GLSL variable containing the tangent
// - bitan: name of GLSL variable containing the bitangent
// - v_in: name of GLSL variable containing the input variable
// - v_out: name of GLSL variable containing the output variable
function transform_from_shading_glsl(n, tan, bitan, v_in, v_out){
	return v_out +
		" = vec3(" + bitan + ".x * " + v_in + ".x + " + tan + ".x * " + v_in + ".y + " +
		n + ".x * " + v_in + ".z, " +
		bitan + ".y * " + v_in + ".x + " + tan + ".y * " + v_in + ".y + " +
		n + ".y * " + v_in + ".z, " +
		bitan + ".z * " + v_in + ".x + " + tan + ".z * " + v_in + ".y + " +
		n + ".z * " + v_in + ".z);";
}

var LambertianMaterial = function(color){
	this.color = color;
}

var LAMBERTIAN_MATERIAL_GLSL =
"vec3 lambertian_material(vec3 color){" +
"	return color * FRAC_1_PI;" +
"}";

// Generates GLSL code to shade the material
// - f: name of GLSL variable to store the computed color in
// - w_i: name of GLSL variable containing the incident light direction, in shading space
// - w_o: name of GLSL variable containing the outgoing light direction, in shading space
LambertianMaterial.prototype.shade = function(f, w_i, w_o){
	return f + " = lambertian_material(" + this.color.to_glsl() + ");";
}

var OrenNayarMaterial = function(color, roughness){
	this.color = color;
	var sigma = Math.pow(roughness * (Math.PI / 180.0), 2.0);
	this.a = 1.0 - 0.5 * sigma / (sigma + 0.33);
	this.b = 0.45 * sigma / (sigma + 0.09);
}

var OREN_NAYAR_MATERIAL_GLSL =
"vec3 oren_nayar_material(vec3 color, float a, float b, vec3 w_o, vec3 w_i){" +
"	float sin_theta_o = bxdf_sin_theta(w_o);" +
"	float sin_theta_i = bxdf_sin_theta(w_i);" +
"	float max_cos = 0.0;" +
"	if (sin_theta_i > 1e-4 && sin_theta_o > 1e-4){" +
"		max_cos = max(0.0, bxdf_cos_phi(w_i) * bxdf_cos_phi(w_o) + bxdf_sin_phi(w_i) * bxdf_sin_phi(w_o));" +
"	}" +
"	float sin_alpha = 0.0;" +
"	float tan_beta = 0.0;" +
"	if (abs(bxdf_cos_theta(w_i)) > abs(bxdf_cos_theta(w_o))){" +
"		sin_alpha = sin_theta_o;" +
"		tan_beta = sin_theta_i / abs(bxdf_cos_theta(w_i));" +
"	}" +
"	else {" +
"		sin_alpha = sin_theta_i;" +
"		tan_beta = sin_theta_o / abs(bxdf_cos_theta(w_o));" +
"	}" +
"	return color * FRAC_1_PI * (a + b * max_cos * sin_alpha * tan_beta);" +
"}";

// Generates GLSL code to shade the material
// - f: name of GLSL variable to store the computed color in
// - w_i: name of GLSL variable containing the incident light direction, in shading space
// - w_o: name of GLSL variable containing the outgoing light direction, in shading space
OrenNayarMaterial.prototype.shade = function(f, w_i, w_o){
	return f + " = oren_nayar_material(" + this.color.to_glsl() + ", " + this.a +
		", " + this.b + ", " + w_o + ", " + w_i + ");";
}

