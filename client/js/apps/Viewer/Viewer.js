import React from 'react';
import ReactDOM from 'react-dom';

import csvparse from 'csv-parse';
import plotly from 'plotly.js/lib/core';
plotly.register([
	require('plotly.js/lib/histogram'),
]);

import {RootUI, ImgUI} from './view/RootUI';
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
import SceneModel from "../../lib/vao/SceneModel"
import OBJModel from "../../lib/vao/OBJModel"
import Wireframe from "../../lib/vao/Wireframe"
import SceneRenderer from "./SceneRenderer"
import VoxRenderer from "./VoxRenderer"
import MeshRenderer from "./MeshRenderer"



class Viewer {

    init(filename) {
		this.suffix = filename.split('.').pop();
		console.log("filetype:", this.suffix);

		let vox_files = new Set(["vox", "vox2", "df", "sdf", "voxnoc", "voxsis"]);
		let mesh_files = new Set(["obj", "ply"]);
		let scene_files = new Set(["json"]);
		let image_files = new Set(["jpg", "jpeg", "png", "gif"]);

		if (vox_files.has(this.suffix))
			this.load_and_render_vox(filename);
		else if (mesh_files.has(this.suffix))
			this.load_and_render_mesh(filename);
		else if (image_files.has(this.suffix))
			this.load_and_draw_image(filename);
		else if (scene_files.has(this.suffix))
			this.load_and_render_scene(filename);
		else
			console.log("filetype not accepted");
    }

	load_and_render_scene(filename) {

        this.draw_root(true);
		
		this.window0 = new WindowManager("id_div_panel", "id_div_canvas");
		this.window0.init();
		this.attach_listener(this.window0);
        this.advance_ref = this.advance.bind(this);

		this.renderer = new SceneRenderer();
		this.renderer.init(this.window0, filename).then(res => {
			console.log("all loaded");
			this.advance();
		});
	}
	
	load_and_render_mesh(filename) {
        this.draw_root(true);

		this.window0 = new WindowManager("id_div_panel", "id_div_canvas");
		this.window0.init();
		this.attach_listener(this.window0);
        this.advance_ref = this.advance.bind(this);

		this.renderer = new MeshRenderer();
		this.renderer.init(this.window0, filename).then(res => {
			this.advance();
		});
	}

	load_and_render_vox(filename) {
        this.draw_root(true);

		this.window0 = new WindowManager("id_div_panel", "id_div_canvas");
		this.window0.init();
		this.attach_listener(this.window0);
        this.advance_ref = this.advance.bind(this);

		this.renderer = new VoxRenderer();
		this.renderer.init(this.window0, filename).then(res => {
			this.advance();
		});
	}
	

	load_and_draw_image(filename) {
        this.draw_root(false);
        ReactDOM.render(<ImgUI src={"/download/image/" + filename}/>, document.getElementById('id_div_pic'));
	}

    advance() {
        this.window0.clear();
        this.window0.advance(0, 16);
		this.renderer.draw();
        requestAnimationFrame(this.advance_ref);
    }
	
    draw_root(is_webgl) {
        ReactDOM.render(<RootUI  is_webgl={is_webgl}/>, document.getElementById('id_div_root'));
    }

   
	touchstart ( event ) {
        this.window0.touchstart(event);
    }

    touchmove ( event ) {
        this.window0.touchmove(event);
    }
    
	touchend( event ) {
        this.window0.touchend(event);
    }

    mousedown ( event ) {
        this.window0.mousedown(event);
    }

    mousemove ( event ) {
        this.window0.mousemove(event);
    }
    
	mouseup( event ) {
        this.window0.mouseup(event);
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
        this.mousedown_ref = this.mousedown.bind(this);
        this.mousemove_ref = this.mousemove.bind(this);
        this.mouseup_ref = this.mouseup.bind(this);
        this.touchstart_ref = this.touchstart.bind(this);
        this.touchmove_ref = this.touchmove.bind(this);
        this.touchend_ref = this.touchend.bind(this);
        this.mousewheel_ref = this.mousewheel.bind(this);

        window.add_listener('contextmenu', this.contextmenu_ref);
        window.add_listener('mousedown', this.mousedown_ref);
        window.add_listener('mousemove', this.mousemove_ref);
        window.add_listener('mouseup', this.mouseup_ref);
        window.add_listener('touchstart', this.touchstart_ref);
        window.add_listener('touchmove', this.touchmove_ref);
        window.add_listener('touchend', this.touchend_ref);
        window.add_listener('mousewheel', this.mousewheel_ref);
        // <-
    }

    dispose_listener(window) {
        window.remove_listener( "contextmenu", this.contextmenu_ref);
        window.remove_listener( "mousemove", this.mousemove_ref);
        window.remove_listener( "mousedown", this.mousedown_ref);
        window.remove_listener( "mouseup", this.mouseup_ref);
        window.remove_listener( "mousewheel", this.mousewheel_ref);
    }

}

window.Viewer = Viewer;
