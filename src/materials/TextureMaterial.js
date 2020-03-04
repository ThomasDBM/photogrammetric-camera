import { Uniform, ShaderMaterial, ShaderLib, Matrix4, Vector3, Vector4, Color } from 'three';

function pop(options, property, defaultValue) {
    if (options[property] === undefined) return defaultValue;
    const value = options[property];
    delete options[property];
    return value;
}

function popUniform(options, property, defaultValue) {
    const value = pop(options, property, defaultValue);
    if (options.uniforms[property])
        return options.uniforms[property];
    return new Uniform(value);
}

function definePropertyUniform(object, property, defaultValue) {
    object.uniforms[property] = new Uniform(object[property] || defaultValue);
    Object.defineProperty(object, property, {
        get: () => object.uniforms[property].value,
        set: (value) => {
            if (object.uniforms[property].value != value) {
                object.uniformsNeedUpdate = true;
                object.uniforms[property].value = value;
            }
        }
    });
}

class ImageMaterial extends ShaderMaterial {
    constructor(options = {}) {
        const size = pop(options, 'size', 1);
        const diffuse = pop(options, 'diffuse', new Color(0xeeeeee));

        const uvwTexturePosition = pop(options, 'uvwTexturePosition', new Vector3());
        const uvwViewPosition = pop(options, 'uvwViewPosition', new Vector3());
        const uvwTexturePreTrans = pop(options, 'uvwPreTransform', new Matrix4());
        const uvwTexturePostTrans = pop(options, 'uvwPostTransform', new Matrix4());
        const uvwViewPreTrans = pop(options, 'uvwPreTransform', new Matrix4());
        const uvwViewPostTrans = pop(options, 'uvwPostTransform', new Matrix4());
        const uvwViewInvPostTrans = pop(options, 'uvwViewInvPostTrans', new Matrix4());
        const uvDistortion = pop(options, 'uvDistortion', {});
        const textureDisto = pop(options, 'textureDisto', false);
        const viewDisto = pop(options, 'viewDisto', false);
        const textureExtrapol = pop(options, 'textureExtrapol', false);
        const viewExtrapol = pop(options, 'viewExtrapol', false);
        const distortionType = pop(options, 'distortionType', 0);
        const mapDisto = pop(options, 'mapDistortion', null);
        const mapUndisto = pop(options, 'mapDistortion', null);

        const map = pop(options, 'map', null);
        const alphaMap = pop(options, 'alphaMap', null);
        const scale = pop(options, 'scale', 1);
        const borderSharpness = pop(options, 'borderSharpness', 10000);
        const diffuseColorGrey = pop(options, 'diffuseColorGrey', false);
        const debugOpacity = pop(options, 'debugOpacity', 0);

        options.vertexShader = options.vertexShader || ShaderLib.points.vertexShader;
        options.fragmentShader = options.fragmentShader || ShaderLib.points.fragmentShader;
        options.defines = options.defines || {};
        if (map) {
            options.defines.USE_MAP4 = '';
        }
        if (alphaMap) options.defines.USE_ALPHAMAP = '';
        if (options.vertexColors) options.defines.USE_COLOR = '';
        if (options.logarithmicDepthBuffer) options.defines.USE_LOGDEPTHBUF = '';
        if (pop(options, 'sizeAttenuation')) options.defines.USE_SIZEATTENUATION = '';
        if(options.color) options.defines.USE_COLOR = '';
        super(options);

        definePropertyUniform(this, 'size', size);
        definePropertyUniform(this, 'diffuse', diffuse);

        definePropertyUniform(this, 'uvwTexturePosition', uvwTexturePosition);
        definePropertyUniform(this, 'uvwViewPosition', uvwViewPosition);
        definePropertyUniform(this, 'uvwTexturePreTrans', uvwTexturePreTrans);
        definePropertyUniform(this, 'uvwViewPreTrans', uvwViewPreTrans);
        definePropertyUniform(this, 'uvwTexturePostTrans', uvwTexturePostTrans);
        definePropertyUniform(this, 'uvwViewPostTrans', uvwViewPostTrans);
        definePropertyUniform(this, 'uvwViewInvPostTrans', uvwViewInvPostTrans);
        definePropertyUniform(this, 'uvDistortion', uvDistortion);
        definePropertyUniform(this, 'textureDisto', textureDisto);
        definePropertyUniform(this, 'viewDisto', viewDisto);
        definePropertyUniform(this, 'textureExtrapol', textureExtrapol);
        definePropertyUniform(this, 'viewExtrapol', viewExtrapol);
        definePropertyUniform(this, 'distortionType', distortionType);
        definePropertyUniform(this, 'mapDisto', mapDisto);
        definePropertyUniform(this, 'mapUndisto', mapUndisto);

        definePropertyUniform(this, 'opacity', this.opacity);
        definePropertyUniform(this, 'map', map);
        definePropertyUniform(this, 'alphaMap', alphaMap);
        definePropertyUniform(this, 'scale', scale);
        definePropertyUniform(this, 'borderSharpness', borderSharpness);
        definePropertyUniform(this, 'diffuseColorGrey', diffuseColorGrey);
        definePropertyUniform(this, 'debugOpacity', debugOpacity);
    }

    setCamera(textureCamera, viewCamera) {
        viewCamera.getWorldPosition(this.uvwViewPosition);
        textureCamera.getWorldPosition(this.uvwTexturePosition);

        this.uvwTexturePreTrans.copy(textureCamera.matrixWorldInverse);
        this.uvwTexturePreTrans.setPosition({x:0,y:0,z:0});
        this.uvwTexturePreTrans.premultiply(textureCamera.preProjectionMatrix);

        this.uvwViewPreTrans.copy(viewCamera.matrixWorldInverse);
        this.uvwViewPreTrans.setPosition({x:0,y:0,z:0});
        this.uvwViewPreTrans.premultiply(viewCamera.preProjectionMatrix);

        this.uvwTexturePostTrans.copy(textureCamera.postProjectionMatrix);
        this.uvwViewPostTrans.copy(viewCamera.postProjectionMatrix);
        this.uvwViewInvPostTrans = new THREE.Matrix4()
            .getInverse(viewCamera.postProjectionMatrix);

        // TODO: handle other distorsion types and arrays of distortions
        if (textureCamera.distos && textureCamera.distos.length == 1) {
            switch (textureCamera.distos[0].type){
                case 'ModRad':
                    this.uvDistortion.C = textureCamera.distos[0].C;
                    this.uvDistortion.R = textureCamera.distos[0].R;
                    this.distortionType = 1;
                    break;
                case 'ModPhgrStd':
                    this.uvDistortion.C = textureCamera.distos[0].C;
                    this.uvDistortion.R = textureCamera.distos[0].R;
                    this.uvDistortion.P = textureCamera.distos[0].P;    
                    this.uvDistortion.b = textureCamera.distos[0].b;
                    this.distortionType = 3;
                    break;
                case 'eModele_FishEye_10_5_5':
                case 'eModele_EquiSolid_FishEye_10_5_5':
                    this.uvDistortion.F = textureCamera.distos[0].F;
                    this.uvDistortion.C = textureCamera.distos[0].C;
                    this.uvDistortion.R = textureCamera.distos[0].R;
                    this.uvDistortion.P = textureCamera.distos[0].P;
                    this.distortionType = 4;
                default:
                    break;
            }
        }else{
            this.uvDistortion = {F: 0., C: new THREE.Vector2(), R: new THREE.Vector4(),
                P: new THREE.Vector2(), l: new THREE.Vector2(), b: new THREE.Vector2()};
            this.uvDistortion.R.w = Infinity;
        }
    }
}

export default ImageMaterial;
