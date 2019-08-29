import GLProgram from "../webgl/GLProgram";
import * as PolygonColorGLSL from "../shader/PolygonColorGLSL";
import * as Beam from "../../lib/geometry/Beam"
import * as math from 'mathjs';

class VAOType {
    constructor() {
        this.id_program = null;
        this.id_vbo_verts = null;
        this.id_vbo_normals = null;
        this.id_vbo_colors = null;

		this.id_ebo = null;

        this.n_vertices = 0;
        this.n_elements = 0;
    }
}

class ThickWireframe {

    init(gl) {
        this.gl = gl;
        this.vao = new VAOType();

        this.vao.id_program = GLProgram.compile_shaders_and_link_with_program(this.gl, PolygonColorGLSL.VS, PolygonColorGLSL.FS);
        this.gl.useProgram(this.vao.id_program);
        
		this.scale_matrix = new THREE.Matrix4();
        this.rotation_matrix = new THREE.Matrix4();
        this.translation_matrix = new THREE.Matrix4();
        this.model_matrix = new THREE.Matrix4();
		
		this.is_visible = false;

    }

	edges2mesh(data) {

		let n_edges = data["n_edges"];
		let verts = [];
		let normals = [];
		let colors = [];
		let faces = [];
		let n_verts = 0;
		let n_faces = 0;

		for (let i = 0; i < n_edges; i++) {
			let p0 = data["verts"][data["edges"][i][0]];
			let p1 = data["verts"][data["edges"][i][1]];
			let beam = Beam.create_beam(0.05, p0, p1);
			verts = verts.concat(beam.vertices);
			normals = normals.concat(beam.normals);
			let c = [Math.random(), Math.random(), Math.random()];
			for (let j = 0; j < beam.vertices.length; j++) {
				colors.push(c);
			}
			beam.faces = math.add(n_verts, math.matrix(beam.faces)).valueOf();
			faces = faces.concat(beam.faces);
			n_verts += beam.vertices.length;
			n_faces += beam.faces.length;
		}


		verts = new Float32Array(verts.reduce(function(prev, curr) {
			return prev.concat(curr);
		}, []));
		normals = new Float32Array(normals.reduce(function(prev, curr) {
			return prev.concat(curr);
		}, []));
		colors = new Float32Array(colors.reduce(function(prev, curr) {
			return prev.concat(curr);
		}, []));
		faces = new Uint32Array(faces.reduce(function(prev, curr) {
			return prev.concat(curr);
		}, []));

		return {"n_verts" : n_verts, "n_faces" : n_faces, "verts" : verts, "faces" : faces, "normals" : normals, "colors" : colors};
	}

    upload_data(mesh_data) {
        this.gl.useProgram(this.vao.id_program);

        this.vao.n_vertices = mesh_data["n_verts"];
        this.vao.n_elements = mesh_data["n_faces"]

        this.vao.id_vbo_verts = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_verts);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh_data["verts"], this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        this.vao.id_vbo_normals = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_normals);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh_data["normals"], this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        
		this.vao.id_vbo_colors = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_colors);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh_data["colors"], this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        
		// -> ebo
        this.vao.id_ebo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vao.id_ebo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, mesh_data["faces"], this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        // <-


    }

    calc_model_matrix() {
        this.model_matrix.identity();
        this.model_matrix.premultiply(this.scale_matrix);
        this.model_matrix.premultiply(this.rotation_matrix);
        this.model_matrix.premultiply(this.translation_matrix);
    }


    draw(model_matrix, view_matrix, projection_matrix) {
		if (this.is_visible) {
			let vao = this.vao;
			let gl = this.gl;

			gl.useProgram(this.vao.id_program);
			gl.disable(gl.CULL_FACE);
        	gl.enable(gl.DEPTH_TEST);

			gl.bindBuffer(gl.ARRAY_BUFFER, vao.id_vbo_verts);
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(0);

			gl.bindBuffer(gl.ARRAY_BUFFER, vao.id_vbo_normals);
			gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(1);

			gl.bindBuffer(gl.ARRAY_BUFFER, vao.id_vbo_colors);
			gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(2);

			gl.uniformMatrix4fv(gl.getUniformLocation(vao.id_program, "model_matrix"), false, new Float32Array(model_matrix.elements));
			gl.uniformMatrix4fv(gl.getUniformLocation(vao.id_program, "view_matrix"), false, new Float32Array(view_matrix.elements));
			gl.uniformMatrix4fv(gl.getUniformLocation(vao.id_program, "projection_matrix"), false, new Float32Array(projection_matrix.elements));

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vao.id_ebo);
            gl.drawElements(gl.TRIANGLES, vao.n_elements*3, gl.UNSIGNED_INT, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.useProgram(null);
			gl.enable(gl.CULL_FACE);
		}
    }
}

export default ThickWireframe;
