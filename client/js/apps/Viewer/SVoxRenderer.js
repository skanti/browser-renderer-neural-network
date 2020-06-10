
import * as THREE from 'three/build/three';
window.THREE = THREE;

import * as PolygonInstanceGLSL from '../../lib/shader/PolygonInstanceGLSL'
import WindowManager from "../Common/WindowManager"
import VoxelGridVAO from "../../lib/vao/VoxelGrid"
import * as Cube from "../../lib/geometry/Cube"
import Wireframe from "../../lib/vao/Wireframe"
import {Data3} from "../../lib/proto/data3_pb.js"

class SVoxData {
    constructor() {
        this.n_elems = 0;
        this.res = 0;
		this.bbox = null;
        this.grid2world = null;
        this.coords = null;
        this.mask = null;
		this.rgb = null;

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
        this.svox = new SVoxData();
        this.vao0 = new VoxelGridVAO();
        this.vao_data0 = new VAOData();
        this.window0 = window0;
        this.wireframe = new Wireframe();


		this.vao0.init(this.window0.gl);

		return this.load_svox(filename).then(res => {
			this.vox0 = res["svox"];


			this.suffix = filename.split('.').pop();
			let colormode = "none";

			console.log(this.vox0);
			if (this.vox0.mask)
				colormode = "mask";
			if (this.vox0.rgb)
				colormode = "direct";


			this.vao_data0 = this.create_vao_data(this.vox0, colormode)
			this.vao0.upload_data(this.vao_data0.n_vertices, this.vao_data0.n_instances, this.vao_data0.vertices, this.vao_data0.normals, this.vao_data0.positions, this.vao_data0.colors);
			this.vao0.set_active();

			this.wireframe.init(this.window0.gl);
			let bbox = this.vox0.bbox;
			let extent = [bbox[3] - bbox[0], bbox[4] - bbox[1], bbox[5] - bbox[2]];
        	let dimmax = Math.max(Math.max(extent[0], extent[1]), extent[2]);
			this.wireframe.update_box(0.5*extent[0]/dimmax, 0.5*extent[1]/dimmax, 0.5*extent[2]/dimmax);
			this.wireframe.is_visible = 1;
        });
    }
	create_vao_data(svox, colormode="none", should_rotate=false, only_surface=false) {
        let vao_data = new VAOData();

        let res = svox.res;
        let coords = svox.coords;
        let mask = svox.mask;


		let bbox = this.vox0.bbox;
		let extent = [bbox[3] - bbox[0], bbox[4] - bbox[1], bbox[5] - bbox[2]];

		let dimmax = Math.max(extent[0], extent[1], extent[2]);

        let positions = []
		let colors = []
		let n_elems = svox.n_elems;
		console.log("n-elems:", n_elems);
		for (let i = 0; i < n_elems; i++) {
			let px = 1.0*coords[3*i + 0];
			let py = 1.0*coords[3*i + 1];
			let pz = 1.0*coords[3*i + 2];
				positions.push(px/dimmax - 0.5*extent[0]/dimmax);
				positions.push(py/dimmax - 0.5*extent[1]/dimmax);
				positions.push(pz/dimmax - 0.5*extent[2]/dimmax);
				if (colormode == "mask") {
					let color1 = this.convert_value_to_rgb(mask[i])
					colors.push(color1[0]);
					colors.push(color1[1]);
					colors.push(color1[2]);
				} else if (colormode == "direct") {
					colors.push(svox.rgb[3*i + 0]);
					colors.push(svox.rgb[3*i + 1]);
					colors.push(svox.rgb[3*i + 2]);
				} else if (colormode == "none") {
					colors.push(0.2);
					colors.push(0.2);
					colors.push(0.2);
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
        vao_data.n_instances = n_elems;

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
		let vox_files = new Set(["svox", "svox2", "svoxrgb"]);

		if (vox_files.has(suffix) === false) {
			console.log("Filetype not known.");
			return 0;
		}

		let is_col_major = true;


        let svox = new SVoxData();

		let offset = 0*4;

        let n_elems = new Int32Array(buffer0, offset, 1)[0];
		svox.n_elems = n_elems;
		offset += 1*4;


        let res = new Float32Array(buffer0, offset, 1)[0];
        svox.res = res;
		offset += 1*4;
		

        let bbox = new Int32Array(buffer0, offset, 6);
        svox.bbox = bbox;
		offset += 6*4;

        let grid2world = new Float32Array(buffer0, offset, 16);
        svox.grid2world = grid2world;
		
		console.log(grid2world);
		
		offset += 16*4;

        svox.coords = new Int32Array(buffer0, offset, n_elems*3);
		offset += n_elems*3*4;

		if (buffer0.byteLength > offset) { // <-- svox2 
			svox.mask = new Float32Array(buffer0, offset, n_elems);
			offset += n_elems*4;
		} 
		if (buffer0.byteLength > offset) { // <-- svoxrgb 
			svox.rgb = new Float32Array(buffer0, offset, n_elems*3);
			offset += n_elems*3*4;
		}

        return svox;
    }
    
	unpack_proto(filename, res) {
		let message = Data3.deserializeBinary(res).getSvox();
        
		let svox = new SVoxData();


        svox.n_elems = message.getNElems();
        svox.res = message.getRes();

        svox.bbox = message.getBboxList();
        svox.grid2world = message.getGrid2worldList();


        svox.coords = new Int32Array(message.getCoordsList());

		svox.mask = new Float32Array(message.getMaskList());

		svox.rgb = new Float32Array(message.getRgbList());

		return svox;

	}

	load_svox(filename) {
		return xhr_arraybuffer("GET", "/download/vox/" + filename).then(res => {
			let suffix = filename.split('.').pop();
			let svox = null;
			if (suffix === "pb") 
				svox = this.unpack_proto(filename, res);
			else
				svox = this.unpack_binary(filename, res);
			return {"filename" : filename, "svox" : svox};
		}).catch(err => {
			console.log(err);
			return {"filename" : filename, "svox" : null};
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
