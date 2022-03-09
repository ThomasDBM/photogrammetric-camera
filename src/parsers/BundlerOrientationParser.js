import { Vector2, Vector3, Vector4, Matrix4 } from 'three';
import { default as RadialDistortion } from '../distortions/RadialDistortion';


function parseNumbers(text) {
    return text.split(' ').map(Number);
}

export default {
    /** @module BundlerOrientationParser */
    /** Parse a bundler orientation file (see {@link http://www.cs.cornell.edu/~snavely/bundler/bundler-v0.3-manual.html#S6})
     * @function parse
     * @param {text} text - the text content of the orientation file.
     * @return {Promise} - a promise that resolves to a {cameras, points} object.
     *
     */
    parse: function parse(text, sizes, source) {
	const lines = text.split('\n');
	if (lines[0] != '# Bundle file v0.3') {
		console.error('not a bundler file :', lines[0]);
		return undefined;
	}
	const nums = parseNumbers(lines[1]);
	const num_cameras = nums[0];
	const num_points = nums[1];
	const cameras = new Array(num_cameras);
	var j = 2;
	for(var i = 0; i<num_cameras && i < sizes.length; ++i, j+=5)
	{
		const size = new Vector2(sizes[i].width, sizes[i].height);
		const point = size.clone().multiplyScalar(0.5);
		const fk = parseNumbers(lines[j+0]);
		const R0 = parseNumbers(lines[j+1]);
		const R1 = parseNumbers(lines[j+2]);
		const R2 = parseNumbers(lines[j+3]);
		const t  = parseNumbers(lines[j+4]);
		const focal = fk[0];
		const f2 = focal * focal;
		const K = [fk[1]/f2, fk[2]/(f2*f2), 0, 0];
		const C = point.clone();
		const disto = { type: 'ModRad', C, R:K, project: RadialDistortion.project, unproject: RadialDistortion.unproject};
		const tmp = disto.unproject(size.clone()).lengthSq();
		disto.R = new Vector4().fromArray(K);
		disto.R.w = tmp; // size.lengthSq();
		const R = new Matrix4().set(
			R0[0], R1[0], R2[0], 0,
			R0[1], R1[1], R2[1], 0,
			R0[2], R1[2], R2[2], 0,
			0, 0, 0, 1
		);
		const near = 0.1;
		const far = 1000;
		const camera = new PhotogrammetricCamera(focal, size, undefined, 0, [disto], near, far);
		camera.quaternion.setFromRotationMatrix(R);
		camera.position.fromArray(t);
		camera.position.negate().applyQuaternion(camera.quaternion);
		cameras[i] = camera;
	}

	j = 2 + 5 * num_cameras;
	const color = new Float32Array(num_points*3);
	const position = new Float32Array(num_points*3);
	const view_list = new Array(num_points);
	for(var i = 0; i<num_points; ++i, j+=3)
	{
		const p = parseNumbers(lines[j+0]);
		const c = parseNumbers(lines[j+1]);
		const v = parseNumbers(lines[j+2]);
		color[3*i  ] = c[0] / 255;
		color[3*i+1] = c[1] / 255;
		color[3*i+2] = c[2] / 255;
		position[3*i  ] = p[0];
		position[3*i+1] = p[1];
		position[3*i+2] = p[2];
		view_list[i] = v;
	}
	return {cameras, points: {position, color, view_list}};
    },
    format: 'bundler/orientation',
    extensions: ['out'],
    mimetypes: ['application/text'],
    fetchtype: 'text',
};
