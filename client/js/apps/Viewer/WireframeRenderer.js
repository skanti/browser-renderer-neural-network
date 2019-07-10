
import * as THREE from 'three/build/three';
window.THREE = THREE;

import WindowManager from "../Common/WindowManager"
import WireframeVAO from "../../lib/vao/ThickWireframe"

class WireframeData {
    constructor() {
		this.n_verts = 0;
		this.n_edges = 0;
        this.verts = null;
        this.edges = null;
    }
}


class ThickWireframe {

    init(window0, filename) {
        this.vao = new WireframeVAO();
        this.window0 = window0;

		this.vao.init(this.window0.gl);

		return this.load_wrf(filename).then(res => {
			console.log(res);
			let mesh_data = this.vao.edges2mesh(res["data"]);
			let colors = [];
			for (let i = 0; i < mesh_data.n_verts; i++) {
				colors.push(0.8);
				colors.push(0.8);
				colors.push(0.8);
			}
			mesh_data["colors"] = new Float32Array(colors);

			let c = this.calculate_center(res["data"]["verts"]);
			this.vao.translation_matrix.makeTranslation(-c.x, -c.y, -c.z);
			this.vao.calc_model_matrix();

			this.vao.upload_data(mesh_data);

			this.vao.is_visible = 1;
        });
    }

	calculate_center(verts) {
        let min_x = Infinity;
        let min_y = Infinity;
        let min_z = Infinity;

        let max_x = -Infinity;
        let max_y = -Infinity;
        let max_z = -Infinity;

        let n = verts.length/3;
        for (let i = 0; i < n; i++) {
            min_x = Math.min(min_x, verts[i][0]);
            min_y = Math.min(min_y, verts[i][1]);
            min_z = Math.min(min_z, verts[i][2]);

            max_x = Math.max(max_x, verts[i][0]);
            max_y = Math.max(max_y, verts[i][1]);
            max_z = Math.max(max_z, verts[i][2]);
        }


        let center_x = (min_x + max_x)/2.0;
        let center_y = (min_y + max_y)/2.0;
        let center_z = (min_z + max_z)/2.0;

        return new THREE.Vector3(center_x, center_y, center_z);
	}


	parse_wrf(filename, buffer) {
		let suffix = filename.split('.').pop();
		let accepted_files = new Set(["wrf"]);

		if (accepted_files.has(this.suffix) === false) {
			console.log("Filetype not known.");
			return 0;
		}


        let wrf = new WireframeData();

		let lines = buffer.split("\n");
		// -> parse
		let n_verts = parseInt(lines.shift());
		wrf.verts = lines.slice(0, n_verts).reduce(function(prev, curr) {
			    return prev.concat([curr.split(' ').map(parseFloat)]);
		}, []);

		let n_edges = parseInt(lines[n_verts]);
		wrf.edges = lines.slice(n_verts + 1, -1).reduce(function(prev, curr) {
			    return prev.concat([curr.split(' ').map(Number)]);
		}, []);
		wrf.n_verts = n_verts;
		wrf.n_edges = n_edges;
		return wrf;
		// <-
    }
    
    
	load_wrf(filename) {
		this.suffix = filename.split('.').pop();

      return xhr("GET", "/download/mesh/" + filename).then(res => {
		  let data = this.parse_wrf(filename, res);
          return {"filename" : filename, "data" : data};
      }).catch(err => {
		  return {"filename" : filename, "data" : null};
	  });
    }

	
    draw() {
        this.window0.clear();
        this.window0.advance(0, 16);
        this.vao.draw(this.vao.model_matrix, this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
		
    }

}

export default ThickWireframe
