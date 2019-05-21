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
		this.M_global = new THREE.Matrix4();

		this.geometric_centers = [];

		return xhr_json("GET", "/download/json/" + filename).then(res => {
			let trs_global = this.parse_trs(res["trs_global"]["trans"], res["trs_global"]["rot"], res["trs_global"]["scale"]);
			let t0 = new THREE.Matrix4();
			let r0 = new THREE.Matrix4();
			let s0 = new THREE.Matrix4();

			t0.makeTranslation(trs_global.trans.x, trs_global.trans.y, trs_global.trans.z);
			r0.makeRotationFromQuaternion(trs_global.rot);
			s0.makeScale(trs_global.scale.x, trs_global.scale.y, trs_global.scale.z);

			let M_global = new THREE.Matrix4();
			M_global.premultiply(s0);
			M_global.premultiply(r0);
			M_global.premultiply(t0);

			let asyncs = [];
			for (let [i,mesh] of Object.entries(res["meshes"])) {
				let filename = mesh["filename"];

				let trs = this.parse_trs(mesh["trs"]["trans"], mesh["trs"]["rot"], mesh["trs"]["scale"]);

				let a = this.load_mesh(filename).then(obj => {

					obj.scale_matrix.makeScale(trs.scale.x, trs.scale.y, trs.scale.z);
					obj.rotation_matrix.makeRotationFromQuaternion(trs.rot);
					obj.translation_matrix.makeTranslation(trs.trans.x, trs.trans.y, trs.trans.z);
					obj.calc_model_matrix();


					this.correct_mesh_trs(obj, M_global);
					
					let c = obj.bbox_center.applyMatrix4(obj.model_matrix);
					this.geometric_centers.push(c);

					let label_buffer = new Int32Array(obj.position_buffer.length/3);
					label_buffer.fill(i + 1)

					this.models.push(obj);

					//let wireframe = new Wireframe();
					//wireframe.init(this.window0.gl);
					//wireframe.is_visible = 1;
					//wireframe.update_box(obj.bounding_box.x, obj.bounding_box.y, obj.bounding_box.z);
					//wireframe.model_matrix = obj.model_matrix;
					//this.models.push(wireframe);
				});
				asyncs.push(a);
			}

			Promise.all(asyncs).then(reses => {
				let c = new THREE.Vector3(0,0,0);
				for (let i in this.geometric_centers) {
					c.add(this.geometric_centers[i]);
				}

				c.multiplyScalar(-1.0/this.geometric_centers.length);
				let C = new THREE.Matrix4();
				C.makeTranslation(c.x, c.y, c.z);
				//C.premultiply(M_global);
				//M_global.multiply(C);
				this.M_global = C.clone();

				for (let i in this.models) {
					this.correct_mesh_trs(this.models[i], C);
				}
			});

		});

    }
	correct_mesh_trs(model, M_global) {
		let model_matrix = model.model_matrix;
		model_matrix.premultiply(M_global);
		let t = new THREE.Vector3(); let q = new THREE.Quaternion(); let s = new THREE.Vector3();
		model_matrix.decompose(t, q, s);

		let trans = (new THREE.Matrix4()).makeTranslation(t.x, t.y, t.z);
		let rot = (new THREE.Matrix4()).makeRotationFromQuaternion(q);
		let scale = (new THREE.Matrix4()).makeScale(s.x, s.y, s.z);

		model.translation_matrix = trans;
		model.rotation_matrix = rot;
		model.scale_matrix = scale;
		model.calc_model_matrix();
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
		for (let i in this.models) {
			this.models[i].draw(this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
		}

		let tmp = this.M_global.clone();
		let t = new THREE.Vector3(); let q = new THREE.Quaternion(); let s = new THREE.Vector3();
		tmp.decompose(t, q, s);
		t.multiplyScalar(-1);
		let cam_pos = this.window0.camera.position.clone().add(t);
		//let cam_target = this.window0.navigation.target.clone().applyMatrix4(tmp);
		let cam_target = this.window0.navigation.target.clone().add(t);


		console.log("cam-pos:",[cam_pos.x, cam_pos.y, cam_pos.z], "cam-target:",[cam_target.x, cam_target.y, cam_target.z]);
		
		//let pos_mouse = this.window0.get_pos_mouse();
    }

}

export default SceneRenderer;
