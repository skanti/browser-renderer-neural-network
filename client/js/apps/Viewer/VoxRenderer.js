
import * as THREE from 'three/build/three';
window.THREE = THREE;

import * as PolygonInstanceGLSL from '../../lib/shader/PolygonInstanceGLSL'
import WindowManager from "../Common/WindowManager"
import VoxelGridVAO from "../../lib/vao/VoxelGrid"
import * as Cube from "../../lib/geometry/Cube"

class VoxData {
    constructor() {
        this.dims = [0, 0, 0];
        this.res = 0;
        this.grid2world = null;
        this.sdf = null;
        this.pdf = null;

		this.nocx = null;
		this.nocy = null;
		this.nocz = null;
    }
}

class VAOData {
    constructor() {
        this.scale = 0;
        this.model_matrix = null;

        this.vertices = null;
        this.normals = null;
        this.positions = null;
        this.colors = null;
        this.n_vertices = 0;
        this.n_instances = 0;
    }
}

class VoxRenderer {

    init(window0, filename) {
        this.vox = new VoxData();
        this.vao0 = new VoxelGridVAO();
        this.vao_data0 = new VAOData();
        this.window0 = window0;


		this.vao0.init(this.window0.gl);

		return this.load_vox(filename).then(buff0 => {
			let has_pdf = this.suffix === "vox2"
			let has_noc = this.suffix === "voxnoc"

			let vox0 = this.unpack_binary(buff0, has_pdf, has_noc);
			this.vox0 = vox0;

			this.vao_data0 = this.create_vao_data(vox0, has_pdf, has_noc);
			this.vao0.upload_data(this.vao_data0.n_vertices, this.vao_data0.n_instances, this.vao_data0.vertices, this.vao_data0.normals, this.vao_data0.positions, this.vao_data0.colors);
			this.vao0.set_active();
        });
    }

	create_vao_data(vox, has_pdf=false, has_noc=false) {
        let vao_data = new VAOData();

        let dims = vox.dims;
        let res = vox.res;
        let sdf = vox.sdf;
        let pdf = vox.pdf;

        let dimmax = Math.max(Math.max(dims[0], dims[1]), dims[2]);

        let positions = []
        let colors = []
        let n_size = 0;
        for (let k = 0; k < dims[2]; k++) {
			for (let j = 0; j < dims[1]; j++) {
				for (let i = 0; i < dims[0]; i++) {
					let index1 = k*dims[1]*dims[0] + j*dims[0] + i;
					if (Math.abs(sdf[index1]) < 2.0*res || pdf[index1] > 0) {
						positions.push(i/dimmax - 0.5);
						positions.push(j/dimmax - 0.5);
						positions.push(k/dimmax - 0.5);
						if (has_noc) {
							colors.push(vox.nocx[index1]);
							colors.push(vox.nocy[index1]);
							colors.push(vox.nocz[index1]);
						} else if (has_pdf) {
							let color1 = this.convert_value_to_rgb(pdf[index1])
							colors.push(color1[0]);
							colors.push(color1[1]);
							colors.push(color1[2]);
						} else {
							let color1 = this.convert_value_to_rgb(0);
							colors.push(color1[0]);
							colors.push(color1[1]);
							colors.push(color1[2]);
						}
						n_size++;
					}
				}
			}
		}

        vao_data.scale = 0.45/dimmax;
        vao_data.model_matrix = new THREE.Matrix4();
        let rot = new THREE.Matrix4();
        rot.makeRotationAxis(new THREE.Vector3(1, 0, 0), -Math.PI*0.5);
        vao_data.model_matrix.premultiply(rot);

        let cube = Cube.create_cube();
        vao_data.vertices = cube.vertices;``
        vao_data.normals = cube.normals;
        vao_data.positions = new Float32Array(positions);
        vao_data.colors = new Float32Array(colors);
        vao_data.n_vertices = cube.n_vertices;
        vao_data.n_instances = n_size;

        return vao_data;
    }
	
	convert_hsv_to_rgb(hsv) {
		let H = hsv[0];
		let S = hsv[1];
		let V = hsv[2];

		let hd = H/60.0;
		let h = Math.floor(hd);
		let f = hd - h;

		let p = V*(1.0 - S);
		let q = V*(1.0 - S*f);
		let t = V*(1.0 - S*(1.0 - f));

		if (h == 0 || h == 6)
			return [V, t, p];
		else if (h == 1) 
			return [q, V, p];
		else if (h == 2)
			return [p, V, t];
		else if (h == 3) 
			return [p, q, V];
		else if (h == 4) 
			return [t, p, V];
		else
			return [V, p, q];
	}

	convert_value_to_rgb(val, vmin = -0.2, vmax = 1) {
		let val0to1 = (val - vmin) / (vmax - vmin);
		let x = 1.0 - val0to1;
		if (x < 0.0)	x = 0.0;
		if (x > 1.0)	x = 1.0;
		return this.convert_hsv_to_rgb([240.0*x, 1.0, 0.5]);
	}
    
	unpack_binary(buffer0, has_pdf=false, has_noc=false) {
        let vox = new VoxData();

        let dims = new Int32Array(buffer0, 0*4, 3);
        vox.dims = [dims[0], dims[1], dims[2]]
        let res = new Float32Array(buffer0, 3*4, 1);
        vox.res = res;
        let grid2world = new Float32Array(buffer0, 4*4, 16);
        vox.grid2world
		console.log(vox.dims)

        const n_elems = dims[0]*dims[1]*dims[2];
        vox.sdf = new Float32Array(buffer0, (4 + 16 + 0)*4, n_elems);
		vox.pdf = new Float32Array(n_elems,0);
		if (has_pdf) { // <-- vox2 
			vox.pdf = new Float32Array(buffer0, (4 + 16 + n_elems)*4, n_elems);
		} 
		if (has_noc) { // <-- voxnoc
			vox.pdf = new Float32Array(buffer0, (4 + 16 + n_elems)*4, n_elems);
			vox.nocx = new Float32Array(buffer0, (4 + 16 + 2*n_elems)*4, n_elems);
			vox.nocy = new Float32Array(buffer0, (4 + 16 + 3*n_elems)*4, n_elems);
			vox.nocz = new Float32Array(buffer0, (4 + 16 + 4*n_elems)*4, n_elems);
		} 

        return vox;
    }

    load_vox(id) {
      return xhr_arraybuffer("GET", "/download/vox/" + id).then(res => {
          return res;
      });
    }

	
    draw() {
        this.window0.clear();
        this.window0.advance(0, 16);
        this.vao0.draw(this.vao_data0.scale, this.vao_data0.model_matrix, this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
		
		let pos_mouse = this.window0.get_pos_mouse();
    }

}

export default VoxRenderer;
