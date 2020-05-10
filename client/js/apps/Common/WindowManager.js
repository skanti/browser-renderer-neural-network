import GLProgram from "../../lib/webgl/GLProgram";
import OrbitControls from "../../lib/controls/OrbitControls";

class WindowManager {
    constructor(id_panel, id_canvas) {
        this.gl = null;
        this.initialized = 0;
        this.pos_mouse = new THREE.Vector2();
        this.is_mouse_in = 0;

        this.id_panel = id_panel;
        this.id_canvas = id_canvas;

        this.container = document.getElementById(id_panel);
        this.canvas = document.getElementById(id_canvas);

        // this.canvas.addEventListener("webglcontextlost", (event) => {console.log("lost context");}, false);

        this.window_width = Math.floor(this.container.getBoundingClientRect().width);
        this.window_height = Math.floor(this.container.getBoundingClientRect().height);
        this.window_left = Math.floor(this.container.getBoundingClientRect().left);
        this.window_top = Math.floor(this.container.getBoundingClientRect().top);
        this.window_ar = this.window_height/this.window_width;

        this.mouseenter_ref = this.mouseenter.bind(this);
        this.mouseleave_ref = this.mouseleave.bind(this);
        this.container.addEventListener('mouseenter', this.mouseenter_ref, false);
        this.container.addEventListener('mouseleave', this.mouseleave_ref, false);

        this.canvas.left = Math.floor(this.window_left);
        this.canvas.top = Math.floor(this.window_top);
        this.canvas.width = Math.floor(this.window_width);
        this.canvas.height = Math.floor(this.window_height);

        this.z_near = 0.1;
        this.z_far = 200.0;
		
		this.is_firefox = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
		console.log("is_firefox", this.is_firefox);
    }


    reinit() {
        this.container = document.getElementById(this.id_panel);
        this.canvas = document.getElementById(this.id_canvas);

        this.window_width = Math.floor(this.container.getBoundingClientRect().width);
        this.window_height = Math.floor(this.container.getBoundingClientRect().height);
        this.window_left = Math.floor(this.container.getBoundingClientRect().left);
        this.window_top = Math.floor(this.container.getBoundingClientRect().top);
        this.window_ar = this.window_height/this.window_width;

        this.mouseenter_ref = this.mouseenter.bind(this);
        this.mouseleave_ref = this.mouseleave.bind(this);
        this.container.addEventListener('mouseenter', this.mouseenter_ref, false);
        this.container.addEventListener('mouseleave', this.mouseleave_ref, false);

        this.canvas.left = Math.floor(this.window_left);
        this.canvas.top = Math.floor(this.window_top);
        this.canvas.width = Math.floor(this.window_width);
        this.canvas.height = Math.floor(this.window_height);

        this.init();
    }

    init() {
        this.gl = GLProgram.init_webgl(this.canvas);
        this.init_camera();
        this.init_navigation();
    }

    advance(i_iteration, mspf) {
        this.navigation.update(mspf*0.001);
        this.camera.updateMatrixWorld(true);
    }

    init_camera() {
        // -> view/projection
        this.projection_matrix = new THREE.Matrix4();
        const factor = 0.1;
        this.projection_matrix.makePerspective(-factor*1.0, factor*1.0, factor*this.window_ar, -factor*this.window_ar, this.z_near, this.z_far);
        //this.projection_matrix.makeOrthographic(-1.0, 1.0, this.window_ar, -this.window_ar, this.z_near, this.z_far);

        this.camera = new THREE.PerspectiveCamera();
        this.camera.position.set(2, 2, -1);
        this.camera.up = new THREE.Vector3(0, 1, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.updateMatrixWorld(true);
        // <-
    }

    init_navigation() {
        // -> navigation
        // this.navigation_fly = new FPFlyControls(this.camera, this.window_width, this.window_height, this.window_left, this.window_top);
        this.navigation_orbit = new OrbitControls(this.camera, this.container);
        this.navigation = this.navigation_orbit;
        // <-
    }

    set_camera_pos_and_lookat(pos, lookat) {
        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.up = new THREE.Vector3(0, 1, 0);
        this.navigation.target = lookat;
        this.camera.updateMatrixWorld(true);
    }

    set_camera_pos_and_lookat_to_default() {
        this.camera.position.set(5, 5, -5);
        this.camera.up = new THREE.Vector3(0, 1, 0);
        this.navigation.target = new THREE.Vector3(0, 0, 0);
        this.camera.updateMatrixWorld(true);
    }

    get_camera_pos() {
        return this.camera.position;
    }
    
	touchstart(event) {
		this.navigation.touchstart(event);
    }

	touchmove(event) {
        // if (this.is_mouse_in_model_panel()) {
            this.pos_mouse.x = event.clientX - this.window_left;
            this.pos_mouse.y = event.clientY - this.window_top;
            this.navigation.touchmove(event);
        // }
    }
	
	touchend(event) {
		this.navigation.touchend(event);
    }

    mousemove(event) {
        // if (this.is_mouse_in_model_panel()) {
            this.pos_mouse.x = event.clientX - this.window_left;
            this.pos_mouse.y = event.clientY - this.window_top;
            this.navigation.mousemove(event);
        // }
    }
    
    mousedown(event) {
		this.navigation.mousedown(event);
    }

    mouseup(event) {
		this.navigation.mouseup(event);
    }
    

    mousewheel(event) {
        // if (this.is_mouse_in_model_panel())
            this.navigation.mousewheel(event);
    }

    contextmenu(event) {
        this.navigation.contextmenu(event);
    }

    get_pos_mouse() {
        return this.pos_mouse;
    }

    get_relative_pos(pos) {
        return new THREE.Vector2(pos.x - this.window_left, pos.y - this.window_top);
    }

    on_window_resize(event) {
        this.window_width = Math.floor(this.container.getBoundingClientRect().width);
        this.window_height = Math.floor(this.container.getBoundingClientRect().height);
        this.window_left = Math.floor(this.container.getBoundingClientRect().left);
        this.window_top = Math.floor(this.container.getBoundingClientRect().top);
        this.window_ar = this.window_height/this.window_width;

        this.canvas.left = Math.floor(this.window_left);
        this.canvas.top = Math.floor(this.window_top);
        this.canvas.width = Math.floor(this.window_width);
        this.canvas.height = Math.floor(this.window_height);

        this.camera.aspect = this.window_width/this.window_height;
        this.camera.updateProjectionMatrix(true);
    };


    mouseenter(event) {
        this.is_mouse_in = 1;
    }

    mouseleave(event) {
        this.is_mouse_in = 0;
    }

    is_mouse_in_model_panel() {
        return this.is_mouse_in;
    }


	add_listener(event_tag, event_callback) {
		if (event_tag === "mousemove") {
			this.container.parentNode.addEventListener( event_tag, event_callback, false );
		} else if  (event_tag == "mousewheel") {
			this.container.addEventListener( "wheel", event_callback, false );
		} else {
			this.container.addEventListener( event_tag, event_callback, false );
		}
	}

	remove_listener(event_tag, event_callback) {
		if (event_tag === "mousemove") {
			this.container.parentNode.removeEventListener( event_tag, event_callback, false );
		} else if (event_tag === "mousewheel") {
			if (this.is_firefox)
				this.container.removeEventListener( "DOMMouseScroll", event_callback, false );
			else
				this.container.removeEventListener( "mousewheel", event_callback, false );
		} else {
			this.container.removeEventListener( event_tag, event_callback, false );
		}
	}

    clear(){
        this.gl.clearColor(230/255.0, 240/255.0, 230/255.0, 1.0);  // Clear to black, fully opaque
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

}

export default WindowManager;
