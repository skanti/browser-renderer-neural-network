import * as THREE from 'three/build/three';

import GLProgram from './GLProgram.js';
import * as Shader from '../shader/PolygonColorGLSL.js';

class VAOMesh {
    constructor() {
        this.id_vbo_vertex = 0;
        this.id_vbo_norm = 0;
        this.id_vbo_color = 0;
        this.ebo = 0;
        this.n_vertices = 0;
        this.n_elements = 0;
        this.n_instance = 0;

        this.color = null;
    }
}

class Wireframe {
    init(gl) {
        this.gl = gl;
        this.program = GLProgram.compile_shaders_and_link_with_program(this.gl, Shader.VS, Shader.FS);
        this.gl.useProgram(this.program);

        this.is_active = 0;
        this.is_visible = 0;
        this.is_done = 0;

        // -> uniforms
        this.model_matrix = new THREE.Matrix4();;
        this.rotation_matrix = new THREE.Matrix4();;
        this.translation_matrix = new THREE.Matrix4();;
        this.scale_matrix = new THREE.Matrix4();;
        // <-

        this.box = null;

        this.vao = new VAOMesh();
        this.init_vao();
    }

    set_active(value) {
        this.is_active = value;
    }

    make_box(a, b, c) {

        return { vertices : new Float32Array([
					-a, -b, -c,   a,  -b, -c, // x
					-a, -b,  c,   a,  -b,  c, // x
					-a,  b, -c,   a,   b, -c, // x
					-a,  b,  c,   a,   b,  c, // x

					-a, -b, -c,  -a,  b, -c, // y
					 a, -b, -c,   a,  b, -c, // y
					-a, -b,  c,  -a,  b,  c, // y
					 a, -b,  c,   a,  b,  c, // y

					-a, -b, -c,  -a, -b,  c, // z
					 a, -b, -c,   a, -b,  c, // z
					-a,  b, -c,  -a,  b,  c, // z
					 a,  b, -c,   a,  b,  c]),

        		colors : 	new Float32Array([   
						0, 0, 0,   1, 0, 0, 
						1, 0, 0,   1, 0, 0, 
						1, 0, 0,   1, 0, 0, 
						1, 0, 0,   1, 1, 1, 

						0, 0, 0,   0, 1, 0, 
						0, 1, 0,   0, 1, 0, 
						0, 1, 0,   0, 1, 0, 
						0, 1, 0,   1, 1, 1, 

						0, 0, 0,   0, 0, 1, 
						0, 0, 1,   0, 0, 1, 
						0, 0, 1,   0, 0, 1, 
						0, 0, 1,   1, 1, 1]),
                elements: new Uint16Array([]),
                n_vertices : 24,
                n_elements: 0};
    }

    init_vao() {
        this.gl.useProgram(this.program);

        this.box = this.make_box(0.5, 0.5, 0.5);
        this.vao.n_vertices = this.box.n_vertices;
        this.vao.n_elements = this.box.n_elements;

        // -> vbo vertex
        this.vao.id_vbo_vertex = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.box.vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        // <-
        
		// -> vbo normal
		let dummy_normals = new Float32Array(this.box.n_vertices*3);
		dummy_normals.fill(0);
        this.vao.id_vbo_normal = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_normal);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, dummy_normals, this.gl.STATIC_DRAW); // <-- dummy fill
        this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(1);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        // <-
        
		// -> vbo color
        this.vao.id_vbo_color = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_color);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.box.colors, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(2);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        // <-

        // -> ebo
        //this.vao.ebo = this.gl.createBuffer();
        //this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vao.ebo);
        //this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.box.elements, this.gl.STATIC_DRAW);
        //this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        // <-
    }

    update_box(a, b, c) {
        this.box = this.make_box(a, b, c);

        // -> vbo vertex
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.box.vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(1);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        // <-
    }

    set_trsc(translation_matrix, rotation_matrix, scale_matrix) {
        this.translation_matrix.copy(translation_matrix);
        this.rotation_matrix.copy(rotation_matrix);
        this.scale_matrix.copy(scale_matrix);
        this.vao.color = new THREE.Vector4(1, 0, 0, 1.0);
    }

    draw(view_matrix, projection_matrix) {
        if (this.is_visible) {
            this.gl.useProgram(this.program);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_vertex);
            this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(0);
            
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_normal);
            this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(1);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_color);
            this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(2);
            

			this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, "model_matrix"), false, new Float32Array(this.model_matrix.elements));
            this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, "view_matrix"), false, new Float32Array(view_matrix.elements));
            this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, "projection_matrix"), false, new Float32Array(projection_matrix.elements));

            this.gl.drawArrays(this.gl.LINES, 0, 24)

            this.gl.useProgram(null);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        }
    }

    advance(i_iteration, mspf) {


    }

}

export default Wireframe;
