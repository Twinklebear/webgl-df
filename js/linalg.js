var Vec3f = function(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
}

Vec3f.prototype.add = function(b){
	return new Vec3f(this.x + b.x, this.y + b.y, this.z + b.z);
}
Vec3f.prototype.sub = function(b){
	return new Vec3f(this.x - b.x, this.y - b.y, this.z - b.z);
}
Vec3f.prototype.mul = function(b){
	return new Vec3f(this.x * b.x, this.y * b.y, this.z * b.z);
}
Vec3f.prototype.scale = function(s){
	return new Vec3f(this.x * s, this.y * s, this.z * s);
}
Vec3f.prototype.negate = function(){
	return new Vec3f(-this.x, -this.y, -this.z);
}
Vec3f.prototype.flatten = function(){
	return [this.x, this.y, this.z];
}
Vec3f.prototype.toString = function(){
	return "Vec3f { x = " + this.x + ", y = " + this.y + ", z = " + this.z + " }";
}

function cross(a, b){
	return new Vec3f(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
function dot(a, b){
	return a.x * b.x + a.y * b.y + a.z * b.z;
}
function length(a){
	return Math.sqrt(dot(a, a));
}
function normalize(a){
	var inv_len = 1.0 / length(a);
	return new Vec3f(a.x * inv_len, a.y * inv_len, a.z * inv_len);
}

