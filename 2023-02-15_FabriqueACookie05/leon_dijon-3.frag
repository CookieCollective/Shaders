/*{
  "osc": 4000,
  "glslify": true,
  "pixelRatio": 1
}*/


#pragma glslify: import('./common.glsl')


float rng;
vec3 coord;
float fft, vol, tot;
float material;

#define time (mod(time, 1000.))

float fbm2 (vec3 p)
{
  float result = 0.;
  float a = 0.5;
  for (float i = 0.; i < 4.; ++i) {
    p.z += result*.5 + time * .1;
    result += sin(gyroid(p/a)*3.+time)*a;
    a /= 2.;
  }
  return result;
}

float map(vec3 p) {
  float dist = 100.;
  float shape = 100.;
  vec3 pos = p;

  vec3 ppp = p;

  p.z -= time*.1;
  // p.xy *= rot(p.z*1.9-sin(time*.5));
  float pz = p.z;
  float cell = 2.;
  float iz = floor(pz/cell);
  p.z = repeat(p.z, cell);

  float a = 1.;
  material = 0.;

  float tt = time * .01;
  // tt = pow(fract(tt),20.)+floor(tt);
  // tt += pow(fract(tt), .5)*sin(tt*1000.)*rng*.1;
  // p.xz *= rot(tt);
  // p.yz *= rot(tt);

  material = 0.;

  const float count = 8.;
  float r = .5;
  float t = vol * .0 + time * .0 + 196. + tt * .1 + pz*.1;

  for (float i = 0.; i < count; ++i)
  {
    p.xz *= rot(t/a);
    p = abs(p)-.8*a;
    float shape = max(p.x,max(p.y,p.z));
    material = shape < dist ? i : material;
    dist = min(dist, shape);
    a /= 1.8;
  }
  dist = -dist;

  coord = p;
  // p.z += time*.5;
  // dist -= fbm2(p*1.)*.1*(.0+10.*vol);

  // dist = max(dist, -length(ppp)+.5);
  dist = max(abs(dist), -max(abs(ppp.x)-.01, abs(ppp.y)-.01));
  return dist;
}

void main() {
    vec2 vv = gl_FragCoord.xy/resolution;
    vv = abs(vv-.5);
    fft = texture2D(spectrum, vv).r;
    rng = hash12(gl_FragCoord.xy);
    vol = pow(volume, .8);
    vec4 data = texture2D(backbuffer, vec2(0));
    // vol = data.r;
    // vol = ss(.0,.4,vol);

    if (gl_FragCoord.x <= 2. && gl_FragCoord.y <= 2.)
    {
      gl_FragColor = vec4(mix(vol,volume,.5),0,0,1);
      // gl_FragColor = vec4(max(vol-.01,volume),0,0,1);
      return;
    }

    vec2 uv = (gl_FragCoord.xy-resolution/2.) / resolution.y;
    vec3 pos = vec3(.0,0,.1);
    vec3 ray = lookAt(pos, vec3(0), uv, .9);
    float shade = 0.;
    float total = 0.;
    float maxDist = 100.;
    const float count = 50.;
    for (float index = count; index > 0.; --index) {
      float dist = map(pos);
      if (dist < .2*total/resolution.y || total > maxDist) {
        shade = index/count;
        break;
      }
      dist *= 0.9 + 0.1 * rng;
      total += dist;
      pos += ray * dist;
    }
    vec3 color = vec3(0);
    if (shade > 0. && total < maxDist) {
      vec2 e = vec2(0.001,0);
      vec3 normal = normalize(map(pos)-vec3(map(pos-e.xyy),map(pos-e.yxy),map(pos-e.yyx)));
      color = vec3(.5);
      vec3 tint = .5+.5*cos(vec3(1,2,3)*5.5+material);
      // tint *= mod(material, 2.);
      float strips = ss(.0,.1,sin(coord.y*100.));
      tint = mix(tint, vec3(1.), mod(material+1., 2.));

      // color += tint;
      vec3 rf = reflect(ray, normal);
      color += vec3(0.9)*pow(dot(rf, N(0,1,2))*.5+.5, 4.);
      // color += vec3(0.5)*pow(dot(rf, ray)*.5+.5, 2.);
      color *= shade;
    }
    gl_FragColor = vec4(color, 1);
}
