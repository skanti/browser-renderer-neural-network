
import * as THREE from 'three/build/three';
window.THREE = THREE;

import * as PolygonInstanceGLSL from '../../lib/shader/PolygonInstanceGLSL'
import WindowManager from "../Common/WindowManager"
import VoxelGridVAO from "../../lib/vao/VoxelGrid"
import * as Cube from "../../lib/geometry/Cube"
import Wireframe from "../../lib/vao/Wireframe"

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
        this.wireframe = new Wireframe();


		this.vao0.init(this.window0.gl);

		return this.load_vox(filename).then(res => {
			this.vox0 = res["vox"];

			this.suffix = filename.split('.').pop();
			let colormode = "none";

			if (this.suffix == "vox2")
				colormode = "pdf";
			else if (this.suffix == "voxnoc")
				colormode = "noc";


			this.vao_data0 = this.create_vao_data(this.vox0, colormode)
			this.vao0.upload_data(this.vao_data0.n_vertices, this.vao_data0.n_instances, this.vao_data0.vertices, this.vao_data0.normals, this.vao_data0.positions, this.vao_data0.colors);
			this.vao0.set_active();

			this.wireframe.init(this.window0.gl);
			let dims = this.vox0.dims;
        	let dimmax = Math.max(Math.max(dims[0], dims[1]), dims[2]);
			this.wireframe.update_box(0.5*dims[0]/dimmax, 0.5*dims[1]/dimmax, 0.5*dims[2]/dimmax);
			this.wireframe.is_visible = 1;
        });
    }
	create_vao_data(vox, colormode="none", should_rotate=false, only_surface=false) {
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
					if (Math.abs(sdf[index1]) < 1.0*res) {
						positions.push(i/dimmax - 0.5*dims[0]/dimmax);
						positions.push(j/dimmax - 0.5*dims[1]/dimmax);
						positions.push(k/dimmax - 0.5*dims[2]/dimmax);
						if (colormode == "pdf") {
							let color1 = this.convert_value_to_rgb(pdf[index1])
							colors.push(color1[0]);
							colors.push(color1[1]);
							colors.push(color1[2]);
						} else if (colormode == "noc") {
							colors.push(vox.nocx[index1]);
							colors.push(vox.nocy[index1]);
							colors.push(vox.nocz[index1]);
						} else if (colormode == "bbox") {
							let color1 = this.convert_value_to_rgb(vox.bbox[index1])
							colors.push(color1[0]);
							colors.push(color1[1]);
							colors.push(color1[2]);
						} else if (colormode == "none") {
							colors.push(0.2);
							colors.push(0.2);
							colors.push(0.2);
						}
						n_size++;
					}
				}
			}
		}

        vao_data.scale = 0.45/dimmax;
        vao_data.model_matrix = new THREE.Matrix4();
        let rot = new THREE.Matrix4();
		if (should_rotate) {
			rot.makeRotationAxis(new THREE.Vector3(1, 0, 0), -Math.PI*0.5);
			vao_data.model_matrix.premultiply(rot);
		}

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

	unpack_binary(filename, buffer0) {
		let suffix = filename.split('.').pop();
		let vox_files = new Set(["vox", "vox2", "df", "sdf", "voxnoc", "voxsis"]);

		if (vox_files.has(this.suffix) === false) {
			console.log("Filetype not known.");
			return 0;
		}

		let is_col_major = true;

		if (suffix == "df")
			is_col_major = false;
		else if (suffix == "sdf")
			is_col_major = false;

        let vox = new VoxData();

        let dims = new Int32Array(buffer0, 0*4, 3);
        vox.dims = [dims[0], dims[1], dims[2]]
        let res = new Float32Array(buffer0, 3*4, 1);
        vox.res = res;
        let grid2world = new Float32Array(buffer0, 4*4, 16);
        vox.grid2world
		
		let offset = (4 + 16)*4;

        const n_elems = dims[0]*dims[1]*dims[2];
		console.log("dims", vox.dims, dims, n_elems);
        vox.sdf = new Float32Array(buffer0, offset, n_elems);
		offset += n_elems*4;

		if (buffer0.byteLength > offset) { // <-- vox2 
			vox.pdf = new Float32Array(buffer0, offset, n_elems);
			offset += n_elems*4;
		} 
		if (buffer0.byteLength > offset) { // <-- voxnoc
			vox.nocx = new Float32Array(buffer0, offset, n_elems);
			offset += n_elems*4;
			vox.nocy = new Float32Array(buffer0, offset, n_elems);
			offset += n_elems*4;
			vox.nocz = new Float32Array(buffer0, offset, n_elems);
			offset += n_elems*4;
		} 
		if (buffer0.byteLength > offset) { // <-- voxnoc
			vox.bbox = new Float32Array(buffer0, offset, n_elems);
			offset += n_elems*4;
		}

        return vox;
    }
    
    
	load_vox(filename) {
		this.suffix = filename.split('.').pop();

      return xhr_arraybuffer("GET", "/download/vox/" + filename).then(res => {
		  let vox = this.unpack_binary(filename, res);
          return {"filename" : filename, "vox" : vox};
      }).catch(err => {
		  return {"filename" : filename, "vox" : null};
	  });
    }

	
    draw() {
        this.window0.clear();
        this.window0.advance(0, 16);
        this.vao0.draw(this.vao_data0.scale, this.vao_data0.model_matrix, this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
        this.wireframe.draw(this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
		
		let pos_mouse = this.window0.get_pos_mouse();
    }

}

export default VoxRenderer;
