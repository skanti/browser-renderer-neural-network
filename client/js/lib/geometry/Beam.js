
import * as THREE from 'three/build/three';
window.THREE = THREE;
import * as math from 'mathjs';

function skew_matrix(x) {
	return math.matrix([[0, -x[2], x[1]], [x[2], 0, -x[0]], [-x[1], x[0], 0]]);
}

export function create_beam(radius, p0, p1, n_sides=6) {
	// -> calc rot matrix
	let height = math.norm(math.subtract(math.matrix(p0), math.matrix(p1)));

	let a = math.matrix([0,1,0]);
	a = math.multiply(1.0/math.norm(a), a);
	let b = math.subtract(math.matrix(p1), math.matrix(p0));
	b = math.multiply(1.0/math.norm(b), b);
	let v = math.cross(a, b);
	let rot = math.identity(3);
	let rot_transpose = math.identity(3);
	let c = math.dot(a, b);

	if (math.norm(v) > 0.1) {
		v = math.multiply(1.0/math.norm(v), v);
		let s = math.norm(v);
		let skew = skew_matrix(v.valueOf());
		rot = math.add(rot, skew);
		rot = math.add(rot, math.multiply(1.0/(1.0 + c), math.multiply(skew, skew)));
	}

	else if (c < -9e-3) {
		//rot = math.identity(3);
		height = -height;
	}
	
	// <-


	let center = math.matrix(p0);
	let trs = (x,y,z) => math.add(math.multiply(rot, math.matrix([x,y,z])), center).valueOf();
	let fix_normal = (x,y,z) => math.multiply(rot, math.matrix([x,y,z])).valueOf();

	var index = 0;

	var offsetY = 0;

	let vertices = [];
	let normals = [];
	let faces = [];

	let index_bottom = n_sides*2 + 0;
	let index_top = n_sides*2 + 1;
	let p = null;
  	for(var j=0; j < 2; j++) {
		for(var i = 0; i < n_sides; i++) {
			var r = radius;
			var y = offsetY + height *j;
			var x = r * Math.cos(i/n_sides * Math.PI * 2);
			var z = r * Math.sin(i/n_sides * Math.PI * 2);

			vertices.push(trs(x,y,z));
			normals.push(fix_normal(x, 0, z));
			if (j == 0) {
				faces.push([ index, (index + 1) % n_sides, (index + 1)%n_sides + n_sides])
				faces.push([ index, index + n_sides, (index + 1)%n_sides + n_sides])
			}
			if (j == 0) {
				faces.push([ index, (index + 1)%n_sides, index_bottom])
				faces.push([ index + n_sides, (index + 1)%n_sides + n_sides, index_top])
			}

			index++;
		}
	}


	vertices.push(trs(0, 0, 0));
	normals.push(fix_normal(0, -1, 0));
	
	vertices.push(trs(0, height, 0));
	normals.push(fix_normal(0, 1, 0));


	return {vertices : vertices, normals : normals, faces : faces}
}
