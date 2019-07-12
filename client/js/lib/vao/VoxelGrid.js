import GLProgram from "../webgl/GLProgram";
import * as PolygonInstanceGLSL from "../shader/PolygonInstanceGLSL";

class VAOType {
    constructor() {
        this.id_program = null;
        this.id_vbo_vertex = null;
        this.id_vbo_normal = null;
        this.id_vbo_positions = null;
        this.id_vbo_colors = null;

        this.n_vertices = 0;
        this.n_instances = 0;
    }
}

class VoxelGrid {
	constructor() {
		this.is_active = false;
	}

    init(gl) {
        this.gl = gl;
        this.vao = new VAOType();
		console.log(PolygonInstanceGLSL);

        this.vao.id_program = GLProgram.compile_shaders_and_link_with_program(this.gl, PolygonInstanceGLSL.VS, PolygonInstanceGLSL.FS);
        this.gl.useProgram(this.vao.id_program);

        this.vao.id_vbo_vertex = this.gl.createBuffer();

        this.vao.id_vbo_normal = this.gl.createBuffer();

        this.vao.id_vbo_positions = this.gl.createBuffer();
        
		this.vao.id_vbo_colors = this.gl.createBuffer();

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
    }

    upload_data(n_vertices, n_instances, vertices, normals, positions, colors) {
        this.gl.useProgram(this.vao.id_program);

        this.vao.n_vertices = n_vertices;
        this.vao.n_instances = n_instances;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_normal);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_positions);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao.id_vbo_colors);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(3, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    }

	set_active() {
		this.is_active = true;
	}


    draw(scale, model_matrix, view_matrix, projection_matrix) {
		if (this.is_active) {
			let vao = this.vao;
			let gl = this.gl;

			gl.useProgram(this.vao.id_program);
			gl.vertexAttribDivisor(2, 1);
			gl.vertexAttribDivisor(3, 1);

			gl.bindBuffer(gl.ARRAY_BUFFER, vao.id_vbo_vertex);
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(0);

			gl.bindBuffer(gl.ARRAY_BUFFER, vao.id_vbo_normal);
			gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(1);

			gl.bindBuffer(gl.ARRAY_BUFFER, vao.id_vbo_positions);
			gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(2);

			gl.bindBuffer(gl.ARRAY_BUFFER, vao.id_vbo_colors);
			gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(3);

			gl.uniform1f(gl.getUniformLocation(vao.id_program, "scale"), scale);
			gl.uniformMatrix4fv(gl.getUniformLocation(vao.id_program, "model_matrix"), false, new Float32Array(model_matrix.elements));
			gl.uniformMatrix4fv(gl.getUniformLocation(vao.id_program, "view_matrix"), false, new Float32Array(view_matrix.elements));
			gl.uniformMatrix4fv(gl.getUniformLocation(vao.id_program, "projection_matrix"), false, new Float32Array(projection_matrix.elements));

			gl.drawArraysInstanced(gl.TRIANGLES, 0, vao.n_vertices, vao.n_instances);

			gl.useProgram(null);
			gl.vertexAttribDivisor(2, 0);
			gl.vertexAttribDivisor(3, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
    }
}

export default VoxelGrid;
