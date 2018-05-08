import React from 'react';
import ReactDOM from 'react-dom';

import csvparse from 'csv-parse';

import RootUI from './view/RootUI';
import MeshOptionsUI from './view/MeshOptionsUI';

import * as THREE from 'three/build/three';
window.THREE = THREE;
import * as d3 from 'd3/build/d3';

import * as PolygonInstanceGLSL from '../../lib/shader/PolygonInstanceGLSL'
import WindowManager from "../Common/WindowManager"
import SceneModel from "../../lib/vao/SceneModel"


class SceneViewer {

    init(filename) {
		//this.model_loader = new ModelLoader();
        this.window0 = null;
		this.models = [];

        this.advance_ref = this.advance.bind(this);

        this.draw_root();

		this.window0 = new WindowManager("id_div_panel0", "id_div_canvas0");
		this.window0.init();
		this.attach_listener(this.window0);


		let filename_scene = SceneViewer.basename(filename);
		this.load_scene(filename_scene).then(scene => {
			this.models.push(scene);
		});

		
		this.load_csv(filename).then(csv => {
			for (let i = 0; i < csv.length; i++) {
				return;
			}
		});
		this.advance();
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

	load_csv(filename) {
		return new Promise((resolve, reject) => {
			return xhr("GET", "/download/csv/" + filename).then(csv => {
				csvparse(csv, {comment: '#'}, (err, out) => {
					resolve(out)
				});
			});
		});
	}
	
    advance() {
        this.window0.clear();
        this.window0.advance(0, 16);
		for (let i in this.models) {
			this.models[i].draw(this.window0.camera.matrixWorldInverse, this.window0.projection_matrix);
		}
        requestAnimationFrame(this.advance_ref);
    }

    draw_root() {
        ReactDOM.render(<RootUI  />, document.getElementById('id_div_root'));
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

window.SceneViewer = SceneViewer;
