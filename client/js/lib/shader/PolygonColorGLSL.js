export const VS = `#version 300 es
        precision mediump float;

        layout (location = 0) in vec3 vertex;
        layout (location = 1) in vec3 normal;
        layout (location = 2) in vec3 color;

        uniform mat4 model_matrix;
        uniform mat4 view_matrix;
        uniform mat4 projection_matrix;

        out vec3 position_vs;
        out vec3 normal_vs;
        out vec3 color_vs;

        void main() {
        	mat4 mvp_matrix = projection_matrix*view_matrix*model_matrix;
            gl_Position = mvp_matrix*vec4(vertex, 1.0);

        	mat4 normal_matrix = transpose(inverse(view_matrix*model_matrix));

        	vec4 pos1 = view_matrix*model_matrix*vec4(vertex, 1.0);
        	position_vs = pos1.xyz;
            normal_vs = vec3(normal_matrix*vec4(normal, 0));
        	color_vs = color;
        }


`;

export const FS = `#version 300 es
    precision mediump float;

    in vec3 position_vs;
    in vec3 normal_vs;
    in vec3 color_vs;

    const vec3 la = vec3(0.3);
    const vec3 ld = vec3(1.0);
    const vec3 ls = vec3(0.3);


    const vec3 ka = vec3(1.0, 1.0, 1.0);
    const vec3 ks = vec3(0.5, 0.5, 0.5);
    const float shininess = 1.0;

    uniform mat4 model_matrix;
    uniform mat4 view_matrix;

    out vec4 frag_color;

    void main() {
        vec3 normal1 = normalize(normal_vs);

        vec3 pos_light = -view_matrix[3].xyz;
        vec3 s = normalize(pos_light - position_vs);
        vec3 v = normalize(-position_vs);
        vec3 r = reflect(-s, normal1);

        float sDotN = max(dot(s, normal1), 0.0);
        vec3 ambient = la*ka;
        vec3 diffuse = ld*color_vs*sDotN;
        vec3 specular = vec3(0.0);
        if( sDotN > 0.0 )
            specular = ls*ks*pow(max(dot(r,v), 0.0), shininess);

        frag_color = vec4( diffuse + ambient + specular, 1 );
    }

`;
