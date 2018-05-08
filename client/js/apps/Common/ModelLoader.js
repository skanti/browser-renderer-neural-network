
import SceneModel from '../../lib/vao/SceneModel';
import OBJModel from '../../lib/vao/OBJModel.js';

class ModelLoader {


    load_alignment(data, window) {
		let id_scene = data[0];
        this.load_aligned_scene(id_scene, window).then( scene =>
				console.log(scene)
            //Promise.all(this.load_aligned_models(data.aligned_models, window, model_manager, pvv_model)).then( res => {
            //    this.load_all_keypoints(data.aligned_models, window, model_manager);
            //    this.create_all_wireframes(window, model_manager);
            //    pvv_model.set_active(1);
            //})
        );
    }

    load_aligned_scene(id_scene, window, model_manager) {
        return new Promise((resolve, reject) => {
            let scene = new SceneModel();
            scene.init(window.gl);

            scene.load_scene("scannet", id_scene).then( res => {
                resolve(scene);
            });
        });
    }

    load_aligned_models(aligned_models_info, window, model_manager) {
        let asyncs = [];

        for (let key in aligned_models_info) {
            let promise = new Promise((resolve, reject) => {

                let id_model_shapenet = aligned_models_info[key].id_shapenet;
                let id_category = aligned_models_info[key].id_category_shapenet;
                let id_model = aligned_models_info[key].id;
                this.spawn_model(id_category, id_model_shapenet, id_model, window, model_manager).then(res => {
                    let obj = model_manager.get_selected_obj();
                    let id_model = model_manager.get_selected_id_model();
                    const trs = aligned_models_info[key].trs;

                    const scale = new THREE.Vector3().fromArray(trs.scale.slice(0));
                    const rotation = new THREE.Quaternion().fromArray(trs.rotation.slice(0));
                    const translation = new THREE.Vector3().fromArray(trs.translation.slice(0));

                    obj.scale_matrix0.makeScale(scale.x, scale.y, scale.z);
                    obj.rotation_matrix0.makeRotationFromQuaternion(rotation);
                    obj.translation_matrix0.makeTranslation(translation.x, translation.y, translation.z);

                    obj.scale_matrix.makeScale(scale.x, scale.y, scale.z);
                    obj.rotation_matrix.makeRotationFromQuaternion(rotation);
                    obj.translation_matrix.makeTranslation(translation.x, translation.y, translation.z);

                    resolve();
                });
            });
            asyncs.push(promise);
        }
        return asyncs;
    }




    async spawn_model(id_category_shapenet, id_shapenet, id_model, window, model_manager, pvv_model) {

        var obj = new OBJModel();
        obj.init(window.gl);
        await obj.load(id_category_shapenet, id_shapenet);

        let label_int32 = model_manager.create_obj_label();
        let label_buffer_int32 = new Int32Array(obj.position_buffer.length/3);
        label_buffer_int32.fill(label_int32);
        obj.init_vao_offscreen(pvv_model.gl, obj.position_buffer, label_buffer_int32);

        model_manager.add_model_with_idmodel(id_category_shapenet, id_shapenet, id_model, obj);
    }


    load_all_keypoints(aligned_models, window, model_manager) {
        for (let key in model_manager.id2obj) {
            let obj = model_manager.id2obj[key];

            const aligned_model = aligned_models.find(elem => {return elem.id === key;});
            const data_keypoint0 = aligned_model.keypoint0;
            const data_keypoint1 = aligned_model.keypoint1;

            const pos0 = data_keypoint0.position.slice();
            const pos1 = data_keypoint1.position.slice();
            let pos = [];
            for (let i = 0; i < data_keypoint0.n_keypoints*3; i++) {
                pos.push(1*(pos0[i]));
            }

            var keypoint = new KeypointVAO();
            keypoint.init(window.gl);
            keypoint.set_position_from_array(pos, data_keypoint1.n_keypoints);

            keypoint.vao.base_scale = 0.05;
            keypoint.set_color_to_green();
            model_manager.add_keypoint0(key, keypoint);

            keypoint.is_visible = 1;

        }
    }

    create_all_wireframes(window, model_manager) {
        for (let key in model_manager.id2obj) {
            let id_model = key
            let obj = model_manager.id2obj[key];

            var wireframe = new Wireframe();
            wireframe.init(window.gl);
            wireframe.is_visible = 1;
            wireframe.update_box(obj.bounding_box.x, obj.bounding_box.y, obj.bounding_box.z);
            model_manager.add_wireframe0(id_model, wireframe);
        }
    }



}

export default ModelLoader;
