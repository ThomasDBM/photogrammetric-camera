import { Vector3 } from 'three';
import { default as PhotogrammetricCamera } from '../cameras/PhotogrammetricCamera';
import { default as RadialDistortion } from '../distortions/RadialDistortion';

export default {
    /** @module GeoJSONParser */


    /** Parse an orientation using a GEOJSON format
     * @function parseFeature
     * @param {JSON} feature - a GEOJSON point feature encoding a camera.
     * @return {Camera} - the decoded camera.
     *
     */
    parseFeature: function parseFeature(feature) {
      const coord = feature.geometry.coordinates;
      const prop = feature.properties;

      const name = prop.name;
      const epsgquaternion = prop.epsgquaternion || 2154;
      const source = prop.source;

      // Intrinsec properties
      var focal = [ prop.fx, prop.fy ];
      var size  = [ prop.sx, prop.sy ];
      var point = [ prop.px, prop.py ];
      var C = [ prop.cx, prop.cy ];
      var R = [ prop.c3, prop.c5, prop.c7 ];
      var disto = [ new RadialDistortion(C, R, prop.cm) ];

      var imageMatrix = new THREE.Matrix4();
      if(prop.m00 != undefined){  // If there are some Crop Infos, we set the image matrix (not identity)
          imageMatrix.elements[0]  = prop.m00;
          imageMatrix.elements[1]  = prop.m01;
          imageMatrix.elements[4]  = prop.m10;
          imageMatrix.elements[5]  = prop.m11;
          imageMatrix.elements[12] = prop.m20;
          imageMatrix.elements[13] = prop.m21;
      }
      var camera = new PhotogrammetricCamera(focal, size, point, 0, disto, undefined, undefined, undefined, imageMatrix );

      // We inject the name of the image in the camera attributes
      camera.name = name;

      // Extrinsics
      const position = new THREE.Vector3(coord[0], coord[1], coord[2]);
      const quaternion = new THREE.Quaternion(prop.qx, prop.qy, prop.qz, prop.qw);
      camera.position.copy(position);

/*
      // Here we need to check the coordinate system of the received camera
      // If already EPSG:4978, nothing to do. If other, we need to compute the new orientation in our scene system (4978)
      if(epsgquaternion != 4978){  // projectionCode
          var coords = new itowns.Coordinates('EPSG:4978', pos.x, pos.y, pos.z);
          var quat_crs2crs = itowns.OrientationUtils.quaternionFromCRSToCRS('EPSG:' + epsgquaternion, "EPSG:4978")(coords);
          quaternion.premultiply(quat_crs2crs);
      }
*/

      camera.quaternion.copy(quaternion);
      camera.userData.properties = prop;

      return camera;
    },

    /** Parse an orientation using a GEOJSON format
     * @function parse
     * @param {string} text - the text content of the GeoJSON entry.
     * @return {Camera[]} - an array of cameras.
     *
     */
    parse: function parse(text) {
        const cameras = [];
        try {
          const geojson = JSON.parse(text);
          for( var feature of geojson.features ) {
            cameras.push(this.parseFeature(feature))
          }
          return cameras;
        } catch (e) {
          //console.warn('not a geojson');
          return null;
        }
    },

    format: 'GEOJSON/orientation',
    extensions: ['json','geojson'],
    mimetypes: ['application/text'],
    fetchtype: 'text',
};
