import React from 'react';
import ReactDOM from 'react-dom';

import csvparse from 'csv-parse';

import RootUI from './view/RootUI';
import MeshOptionsUI from './view/MeshOptionsUI';

import * as THREE from 'three/build/three';
window.THREE = THREE;
import * as d3 from 'd3/build/d3';

import * as PolygonInstanceGLSL from '../../lib/shader/PolygonInstanceGLSL'
import PickVisibleVertex from "../../lib/vao/PickVisibleVertex";
import WindowManager from "../Common/WindowManager"
import SceneModel from "../../lib/vao/SceneModel"
import OBJModel from "../../lib/vao/OBJModel"
import Wireframe from "../../lib/vao/Wireframe"


class SceneRenderer {

    init(window0, filename) {
		//this.model_loader = new ModelLoader();
        this.window0 = window0;
		this.models = [];


		this.pvv = new PickVisibleVertex();
		this.pvv.init(this.window0.gl, this.window0.window_width, this.window0.window_height);
		this.pvv.set_active();

		this.obj = null;

		return this.load_mesh(filename).then(obj => {

			//obj.scale_matrix.makeScale(trs.scale.x, trs.scale.y, trs.scale.z);
			//obj.rotation_matrix.makeRotationFromQuaternion(trs.rot);
			//obj.translation_matrix.makeTranslation(trs.trans.x, trs.trans.y, trs.trans.z);
			//obj.calc_model_matrix();


			let c = obj.bbox_center;
			obj.translation_matrix.makeTranslation(-c.x, -c.y, -c.z);
			obj.calc_model_matrix();


			this.obj = obj;
        	this.window0.gl.disable(this.window0.gl.CULL_FACE);
			console.log(obj);

			//let wireframe = new Wireframe();
			//wireframe.init(this.window0.gl);
			//wireframe.is_visible = 1;
			//wireframe.update_box(obj.bounding_box.x, obj.bounding_box.y, obj.bounding_box.z);
			//wireframe.model_matrix = obj.model_matrix;
			//this.models.push(wireframe);
		});



    }
	
	parse_trs(trans0, rot0, scale0) {
		let scale = new THREE.Vector3().fromArray(scale0.slice(0));
		rot0 = [rot0[1], rot0[2], rot0[3], rot0[0]];
		let rot = new THREE.Quaternion().fromArray(rot0.slice(0)).normalize();

		let trans = new THREE.Vector3().fromArray(trans0.slice(0));
		return {"trans" : trans, "rot" : rot, "scale" : scale};
	}

    load_mesh(filename, trs) {
        return new Promise((resolve, reject) => {
			if (filename.endsWith("obj")) {
				let obj = new OBJModel();
				obj.init(this.window0.gl);

				obj.load(filename).then( res => {
					resolve(obj);
				});
			} else if (filename.endsWith("ply")) {
				let ply = new SceneModel();
				ply.init(this.window0.gl);

				ply.load(filename).then( res => {
					resolve(ply);
				});

			}
        });
	}

	load_scene(id_scene) {
        return new Promise((resolve, reject) => {
            let scene = new SceneModel();
            scene.init(this.window0.gl);

            scene.load_scene("scannet", id_scene).then( res => {
                resolve(scene);
            });
        });
	}

	static basename(str) {
		let base = new String(str).substring(str.lastIndexOf('/') + 1); 
		if(base.lastIndexOf(".") != -1)       
			base = base.substring(0, base.lastIndexOf("."));
		return base;
	}

	
    draw() {
        this.window0.clear();
        this.window0.advance(0, 16);
		this.obj.draw(this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
		
    }

}

export default SceneRenderer;
