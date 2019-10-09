export const SceneVS = `#version 300 es
            precision mediump float;

            layout(location = 0) in vec3 position;
            layout(location = 1) in vec3 normal;
            layout(location = 2) in vec3 color;

            out vec3 position_vs;
            out vec3 normal_vs;
            out vec3 color_vs;

            uniform mat4 model_matrix;
            uniform mat4 view_matrix;
            uniform mat4 projection_matrix;

            void main() {
                position_vs = vec3(view_matrix*model_matrix*vec4(position, 1.0));
                normal_vs = vec3(transpose(inverse(view_matrix*model_matrix))*vec4(normalize(normal), 1.0));
                color_vs = color;
                gl_Position = projection_matrix*view_matrix*model_matrix*vec4(position, 1.0);
            }`;

export const SceneFS = `#version 300 es
            precision mediump float;

            in vec3 position_vs;
            in vec3 normal_vs;
            in vec3 color_vs;

            out vec4 frag_color;

            const vec3 pos_light = vec3(0, 0, 0);
            const vec3 ld = vec3(1.0);
            const vec3 ls = vec3(0.1);

            void main() {
				vec3 X = dFdx(position_vs);
				vec3 Y = dFdy(position_vs);
				vec3 normal1 = normalize(cross(X,Y));
                vec3 s = normalize(pos_light - position_vs);
                vec3 v = normalize(-position_vs);
                vec3 r = reflect(-s, normal1);

                float sDotN = max(dot(s, normal1), 0.0);
                vec3 diffuse = ld*color_vs*sDotN;
                vec3 specular = vec3(0.0);
                if(sDotN > 0.0)
                    specular = ls*pow(max(dot(r,v), 0.0), 1.0);

                frag_color = vec4(diffuse + specular, 1);
            }`;
