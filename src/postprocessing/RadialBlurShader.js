import { Vector2 } from 'three';
/**
 * Radial Blur Shader
 */

const RadialBlurShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'center': { value: new Vector2(0.5,0.5) },
    'resolution': { value: new Vector2(1,1) },
    'blur': { value: 0 },
    'pad': { value: 2 }
  },

  fragmentShader: /* glsl */`#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tDiffuse;
uniform vec2 center;
uniform vec2 resolution;
uniform float blur;
uniform float pad;

in vec2 vUv;
out highp vec4 pc_FragColor;

#include <postprocessing/radial>

void main() {
  float t = max(0.01, blur*0.01);
  vec2 p0 = mix(vUv,center,-t);
  vec2 p1 = mix(vUv,center, t);
  toRadial(center, resolution, pad, p0);
  toRadial(center, resolution, pad, p1);
  vec2 ddx = dFdx( vUv );
  vec2 ddy = dFdy( vUv );
  vec4 c0 = textureGrad(tDiffuse, p0, ddx, ddy);
  vec4 c1 = textureGrad(tDiffuse, p1, ddx, ddy);
  pc_FragColor = c1-c0;
  pc_FragColor /= pc_FragColor.a;
  pc_FragColor += 0.5;
}`

};

export { RadialBlurShader };
