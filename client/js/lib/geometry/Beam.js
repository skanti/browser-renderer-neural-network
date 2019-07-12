
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
	let c = math.dot(a,b);

	let ab = math.reshape(math.add(a,b), [3,1]);
	let abt = math.reshape(ab.clone(), [1,3]);
	let s = math.multiply(abt, ab).valueOf()[0];
	let rot = math.multiply(-1.0, math.identity(3));
	if (s != 0)
		rot = math.subtract(math.multiply(2.0/s, math.multiply(ab, abt)), math.identity(3));


	let center = p0;

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

export function create_beam_polygon_on_3dplane(radius, p0, p1, n_sides=6) {
	// -> calc rot matrix
	let distance = math.norm(math.subtract(math.matrix(p1), math.matrix(p0)));
	let normal0 = math.multiply(1.0/distance, math.subtract(math.matrix(p0), math.matrix(p1))).valueOf();
	let normal1 = math.multiply(1.0/distance, math.subtract(math.matrix(p1), math.matrix(p0))).valueOf();

	//let argmax = normal.reduce((i_max, x, i, arr) => Math.abs(x) > Math.abs(arr[i_max]) ? i : i_max, 0);
	//let a = normal.slice();
	//[a[argmax], a[(argmax + 1)%3]] = [a[(argmax + 1)%3], a[argmax]];
	//a = math.matrix(a)
	//let b = math.cross(normal, a);

	//let d0 = -math.dot(normal0, p0); // <-- plane equation
	//let d1 = -math.dot(normal1, p1); // <-- plane equation

	let project_to_3dplane = (x, y, n, d=0) =>  {
		let k = -(n[0]*x + n[1]*y + d)/math.dot(n, n);
		return [x + n[0]*k, y + k*n[1], k*n[2]];
	};
	
	let vertices = [];
	let normals = [];
	let faces = [];

	let index = 0;
	let index_bottom = n_sides*2 + 0;
	let index_top = n_sides*2 + 1;
  	for(let j = 0; j < 2; j++) {
		for(let i = 0; i < n_sides; i++) {
			let r = radius;
			let x = r * Math.cos(i/n_sides * Math.PI * 2);
			let y = r * Math.sin(i/n_sides * Math.PI * 2);

			let p = null;
			let n = null;
			if (j == 0) {
				p = p0;
				n = normal0;
			} else if (j == 1) {
				p = p1;
				n = normal1;
			}

			let v = math.add(project_to_3dplane(x, y, n), p).valueOf();

			vertices.push(v);
			normals.push(n);

			if (j == 0) {
				faces.push([ index, (index + 1) % n_sides, (index + 1)%n_sides + n_sides])
				faces.push([ index, index + n_sides, (index + 1)%n_sides + n_sides])

				//faces.push([ index, (index + 1)%n_sides, index_bottom])
				//faces.push([ index + n_sides, (index + 1)%n_sides + n_sides, index_top])
			}

			index++;
		}
	}


	//vertices.push(trs(0, 0, 0));
	//normals.push(fix_normal(0, -1, 0));
	//
	//vertices.push(trs(0, height, 0));
	//normals.push(fix_normal(0, 1, 0));


	return {vertices : vertices, normals : normals, faces : faces}
}
