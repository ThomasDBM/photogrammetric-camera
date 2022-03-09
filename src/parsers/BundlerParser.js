import { Vector2, Vector3, Vector4 } from 'three';
import PhotogrammetricCamera from '../cameras/PhotogrammetricCamera';
import { default as RadialDistortion } from '../distortions/RadialDistortion';

class BundlerOrientationParser  {
    /** @module BundlerOrientationParser */

    /** Parse orientations using the Bundler format
     * @function parse
     * @param {string[2]} texts - the text contents of the list and Bundler(out) files.
     * @return {Camera[]} - an array of cameras.
     */
     static parse(texts) {
        const list = BundlerOrientationParser.parseList(texts[0]);
        return BundlerOrientationParser.parseOut(texts[1], list);
      }

    /** Parse a list of image filenames and pixel dimensions
    * each line should be "filename width height"
    * @function parseList
    * @param {string} text - the text contents of the list file.
    * @return {names,sizes} - an array of names and an array of sizes (Number[2])
    */
    static parseList(text) {
        const lines = text.split(/\n/).map(l => l.trim().split(/\s+/));
        const names = [];
        const sizes = [];
        for(var l=0;l<lines.length; ++l) {
          names[l] = lines[l][0];
          sizes[l] = [Number(lines[l][1]), Number(lines[l][2])];
        }
         return {names:names, sizes:sizes};
    }

    /** Parse a Bundler out file
    * @function parseList
    * @param {string} text - the text contents of the list file.
    * @param {names,sizes} list - the parsed content of the list file.
    * @return {Camera[]} - an array of cameras.
    */
    static parseOut(text, list) {
      const header = "# Bundle file v0.3";
      if(!text.startsWith(header))
        {
          // console.error("Error parsing Bundler file : \""+filename+"\" should start with \""+header+"\"");
          return null;
        }
      const lines = text.split(/\n/).map(l => l.trim().split(/\s+/).map(Number));
      const num_cameras = lines[1][0];
      const num_points = lines[1][1];

      const cameras = [];
      for(var c=0;c<num_cameras; ++c)
      {
        const l = 2+5*c;
        const f = lines[l][0];
        const k1 = lines[l][1];
        const k2 = lines[l][2];
        const R1 = lines[l+1];
        const R2 = lines[l+2];
        const R3 = lines[l+3];
        const t  = lines[l+4];

        const size = list.sizes[c];
        const center = new Vector2().fromArray(size).multiplyScalar(0.5);
        const f2 = f*f;
        const k = [k1/f2, k2/(f2*f2), 0];
        const disto = new RadialDistortion(center, k);

        const cam = new PhotogrammetricCamera(f, size, center, 0, [disto]);
        cam.name = list.names[c];
        cam.matrix.set(
          R1[0], R2[0], R3[0], 0,
          R1[1], R2[1], R3[1], 0,
          R1[2], R2[2], R3[2], 0,
          0, 0, 0, 1);
        cam.position.fromArray(t);
        cam.position.applyMatrix4(cam.matrix).negate();
        cam.matrix.setPosition(cam.position);
        cam.quaternion.setFromRotationMatrix(cam.matrix);
        cam.near = 0.1;
        cam.far = 1000;
        cam.updateMatrixWorld(true);
        cameras.push(cam);

        cam.check = function check(epsilon, N) {
          epsilon = epsilon || this.check.epsilon;
          //console.log(epsilon, N, this.check.points);
          var array = N ? this.check.points.slice(0, N) : this.check.points;
          return array.reduce((ok, point) => {
            var pp = this.distort(point.p3.clone());
            var d = point.p2.distanceTo(pp);
            if (d > epsilon) {
              ok = false;
              console.warn(point.id, d, pp, point.p2, point.p3);
            }
            return ok;
          }, true);
        }
        cam.check.epsilon = 2;
        cam.check.points = [];
      }

      const points = new Float32Array(3*num_points);
      const colors = new Uint8Array(3*num_points);
      for(var p=0;p<num_points; ++p)
      {
        const i = 3*p;
        const l = 2+5*num_cameras+i;
        const xyz = lines[l];
        const rgb = lines[l+1];
        const viewlist = lines[l+2];
        points.set(xyz,i);
        colors.set(rgb,i);
        const p3 = new Vector3().fromArray(xyz);
        const num_views = viewlist[0];
        for(var v = 0; v<num_views; ++v)
        {
          const c = viewlist[1+4*v];
          if (c>=cameras.length) continue;
          const cam = cameras[viewlist[1+4*v]]
          // const key = viewlist[2+4*v];
          const p2 = new Vector2().fromArray(viewlist,3+4*v);
          p2.add(cam.point);
          p2.y = cam.view.fullHeight - p2.y;

          cam.check.points.push({
            id: p+"/"+v,
            p2: p2,
            p3: p3
          });
        }
      }
      cameras.points = points;
      cameras.colors = colors;
      return cameras;
    }

};

BundlerOrientationParser.format = 'Bundler/orientation';
BundlerOrientationParser.extensions = ['out'];
BundlerOrientationParser.mimetypes = ['application/text'];
BundlerOrientationParser.fetchtype = 'text';

export default BundlerOrientationParser;
