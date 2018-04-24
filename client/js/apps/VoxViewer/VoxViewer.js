import React from 'react';
import ReactDOM from 'react-dom';

import csvparse from 'csv-parse';
import plotly from 'plotly.js/lib/core';
plotly.register([
	require('plotly.js/lib/histogram'),
]);

import RootUI from './view/RootUI';
import BrowseUI from './view/BrowseUI';
import MeshOptionsUI from './view/MeshOptionsUI';
import MetadataUI from './view/MetadataUI';

import * as THREE from 'three/build/three';
window.THREE = THREE;
import * as d3 from 'd3/build/d3';

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

class VoxViewer {

    init(filename) {

        this.vox = new VoxData();
        this.vao0 = new VoxelGridVAO();
        this.vao_data0 = new VAOData();
        this.window0 = null;

        this.advance_ref = this.advance.bind(this);

        this.draw_root();
		//this.draw_browse_button();
        //this.draw_meshoptions();

		this.window0 = new WindowManager("id_div_panel0", "id_div_canvas0");
		this.window0.init();
		this.attach_listener(this.window0);
		this.vao0.init(this.window0.gl);

		this.load_and_prepare_vox(filename);

		this.advance();

    }

	load_and_prepare_vox(filename) {
		let filetype = -1;
		if (filename.endsWith("vox2"))
			filetype = 0;
		else if (filename.endsWith("vox"))
			filetype = 1;
		else if (filename.endsWith("df"))
			filetype = 2;

		console.log(filetype)

		this.load_vox(filename).then(buff0 => {
			let vox0 = VoxViewer.unpack_binary(buff0, filetype);
			this.vox0 = vox0;

			this.vao_data0 = VoxViewer.create_vao_data(vox0);
			this.vao0.upload_data(this.vao_data0.n_vertices, this.vao_data0.n_instances, this.vao_data0.vertices, this.vao_data0.normals, this.vao_data0.positions, this.vao_data0.colors);
			this.vao0.set_active();
        });
	}

    advance() {
        this.window0.clear();
        this.window0.advance(0, 16);
        this.vao0.draw(this.vao_data0.scale, this.vao_data0.model_matrix, this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
        requestAnimationFrame(this.advance_ref);
    }

    static create_vao_data(vox) {
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
					if (Math.abs(sdf[index1]) < res) {
						positions.push(i/dimmax - 0.5);
						positions.push(j/dimmax - 0.5);
						positions.push(k/dimmax - 0.5);
						colors.push(pdf[index1]*0.8 + 0.2);
						colors.push(0.2);
						colors.push(0.2);
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

	onclick_thresh(id_canvas, is_thresh) {
        let dims = this.vox0.dims;
        let res = this.vox0.res;
        let sdf = this.vox0.sdf;
        let pdf = this.vox0.pdf;
		
		let colors = this.vao_data0.colors;
		let n_size = 0
        for (let k = 0; k < dims[2]; k++) {
			for (let j = 0; j < dims[1]; j++) {
				for (let i = 0; i < dims[0]; i++) {
					let index1 = k*dims[1]*dims[0] + j*dims[0] + i;
					if (Math.abs(sdf[index1]) < res) {
						if (is_thresh)
							colors[n_size*3 + 0] = pdf[index1]*0.8 + 0.2;
						else
							colors[n_size*3 + 0] = pdf[index1] >= 0.5 ? 1 : 0.2;
						colors[n_size*3 + 1] = (0.2);
						colors[n_size*3 + 2] = (0.2);
						n_size++;
					}
				}
			}
		}

		this.vao0.upload_data(this.vao_data0.n_vertices, this.vao_data0.n_instances, this.vao_data0.vertices, this.vao_data0.normals, this.vao_data0.positions, this.vao_data0.colors);
	}

	onclick_files() {
		let val = document.getElementById('id_input_browse').value
		this.load_and_prepare_vox(val);

	}
	
	draw_metadata(cargo) {
        ReactDOM.render(<MetadataUI cargo={cargo} />, document.getElementById('id_div_metadata'));
	}

	draw_meshoptions() {
        ReactDOM.render(<MeshOptionsUI onclick_thresh={this.onclick_thresh.bind(this, 0)} />, document.getElementById('id_meshoptions0'));
        //ReactDOM.render(<MeshOptionsUI onclick_thresh={this.onclick_thresh.bind(this, 1)} />, document.getElementById('id_meshoptions1'));
	}

	draw_browse_button() {
        ReactDOM.render(<BrowseUI label={"Browse files"} onclick={this.onclick_files.bind(this)}/>, document.getElementById('id_div_browse'));
	}

    draw_root() {
        ReactDOM.render(<RootUI  />, document.getElementById('id_div_root'));
    }

    static unpack_binary(buffer0, filetype) {
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
		if (filetype == 0)
			vox.pdf = new Float32Array(buffer0, (4 + 16 + n_elems)*4, n_elems);
		else
			vox.pdf = new Float32Array(n_elems);

        return vox;
    }

    load_vox(id) {
      return xhr_arraybuffer("GET", "/download/vox/" + id).then(res => {
          return res;
      });
    }

    mouseclick ( event ) {
    }

    mousedown ( event ) {
        this.window0.mousedown(event);
    }

    mouseup( event ) {
        this.window0.mouseup(event);
    }

    mousemove ( event ) {
        this.window0.mousemove(event);
    }

    mousewheel ( event ) {
        this.window0.navigation.mousewheel(event);
    }

    contextmenu( event ) {
        this.window0.navigation.contextmenu(event);
    }

    attach_listener(window) {
        // -> event listeners
        this.contextmenu_ref = this.contextmenu.bind(this);
        this.mouseclick_ref = this.mouseclick.bind(this);
        this.mousemove_ref = this.mousemove.bind(this);
        this.mousedown_ref = this.mousedown.bind(this);
        this.mouseup_ref = this.mouseup.bind(this);
        this.mousewheel_ref = this.mousewheel.bind(this);

        window.add_listener('contextmenu', this.contextmenu_ref);
        window.add_listener('click', this.mouseclick_ref);
        window.add_listener('mousemove', this.mousemove_ref);
        window.add_listener('mousedown', this.mousedown_ref);
        window.add_listener('mouseup', this.mouseup_ref);
        window.add_listener('mousewheel', this.mousewheel_ref);
        // <-
    }

    dispose_listener(window) {
        window.remove_listener( "contextmenu", this.contextmenu_ref);
        window.remove_listener( "click", this.mouseclick_ref);
        window.remove_listener( "mousemove", this.mousemove_ref);
        window.remove_listener( "mousedown", this.mousedown_ref);
        window.remove_listener( "mouseup", this.mouseup_ref);
        window.remove_listener( "mousewheel", this.mousewheel_ref);
    }

}

window.VoxViewer = VoxViewer;
