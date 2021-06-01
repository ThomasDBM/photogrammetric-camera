export default {
    /** @module GMLSerializer */

    /** Serialize a camera using a GML format
     * @function serialize
     * @param {Camera} camera - the input camera.
     * @return {string} - a GML point encoding of the camera.
     *
     */
    serialize: function serializeFeature(camera, crsName) {
        const d = camera.distos ? camera.distos[0] : {};
        const e = camera.imageMatrix.elements;
        const pos = camera.position;
        const f = camera.focal;
        const v = camera.view;
        const p = camera.point;
        const q = camera.quaternion;

        // todo  (using crsName?)
        const epsg = '4978';
        const epsgquaternion = '4978'; // same as epsg ?
        const source = '0';

        const gml = `\
<point>
  <gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#${epsg}">
    <gml:coordinates xmlns:gml="http://www.opengis.net/gml" decimal="." cs="," ts=" ">${pos.x},${pos.y},${pos.z}</gml:coordinates>
  </gml:Point>
</point>
<name>${camera.name}</name>
<source>${source}</source>
<epsgquaternion>${epsgquaternion}</epsgquaternion>
<qx>${q.x}</qx>
<qy>${q.y}</qy>
<qz>${q.z}</qz>
<qw>${q.w}</qw>
<fx>${f.x}</fx>
<fy>${f.y}</fy>
<px>${p.x}</px>
<py>${p.y}</py>
<sk>0.0</sk>
<sx>${v.fullWidth}</sx>
<sy>${v.fullHeight}</sy>
<c3>${d.R.x}</c3>
<c5>${d.R.y}</c5>
<c7>${d.R.z}</c7>
<cm>${d.R.w}</cm>
<cx>${d.C.x}</cx>
<cy>${d.C.y}</cy>
<m00>${e[ 0]}</m00>
<m01>${e[ 1]}</m01>
<m10>${e[ 4]}</m10>
<m11>${e[ 5]}</m11>
<m20>${e[12]}</m20>
<m21>${e[13]}</m21>`;

      return gml;
    }
};
