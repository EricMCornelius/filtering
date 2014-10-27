var multipass = false;

var scale = {
  x: 1,
  y: 1
};

var width = window.innerWidth / scale.x;
var height = window.innerHeight / scale.y;
var depth = 1000;

var bounds = {
  x: [0, width],
  y: [0, height],
  z: [1, depth]
}

function onclick() {
  var e = d3.event;
  var target = e.target;
  var filter = target.dataset.filter;
  setFilter(filter);
}

d3.selectAll('.button')
  .on('click', onclick);

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(width, height);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.autoClear = false;
var container = document.getElementById('render_target');
container.appendChild(renderer.domElement);

var video = document.createElement('video');
video.width = 1024;
video.height = 768;
video.autoplay = true;

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

navigator.getUserMedia({video: true}, function(stream) {
  video.src = URL.createObjectURL(stream);
}, function(error){
  console.log("Failed to get a stream due to", error);
});

var scene = new THREE.Scene();
var stage = new THREE.Scene();

var imageMat = new THREE.MeshBasicMaterial({
  map: new THREE.Texture(video)
});

var geo = new THREE.PlaneGeometry(width, height);
var image = new THREE.Mesh(geo, imageMat);
image.position.x += width / 2;
image.position.y += height / 2;
scene.add(image);

function onImageUpdate(img) {
  imageMat.map = new THREE.Texture(img);
  imageMat.map.needsUpdate = true;
  scene.add(image);
}

var camera = new THREE.OrthographicCamera(0, width, height, 0, 0, 1000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z =  1000;

var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false, depthBuffer: true };
var framebuffer = new THREE.WebGLRenderTarget(width, height, parameters);
var framebuffer2 = new THREE.WebGLRenderTarget(width, height, parameters);

var uniforms = {
  tDiffuse: {
    type: 't',
    value: framebuffer
  },
  width: {
    type: 'f',
    value: 1.0 / width
  },
  height: {
    type: 'f',
    value: 1.0 / height
  },
  opacity: {
    type: 'f',
    value: 0.001
  },
  time: {
    type: 'f',
    value: 0.0
  }
};

var filter_map = {
  blur: 'blur_shader',
  edge: 'edge_shader',
  toon: 'toon_shader',
  red: 'red_shader',
  green: 'green_shader',
  blue: 'blue_shader',
  static: 'static_shader',
  julia: 'julia_shader',
  mandelbrot: 'mandelbrot_shader'
};

var singlepass = {
  static: true,
  julia: true,
  mandelbrot: true
}

var material_map = {};

for (var filter in filter_map) {
  var elemName = filter_map[filter];
  var mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: document.getElementById('vertex_shader_screen').textContent,
    fragmentShader: document.getElementById(elemName).textContent,
    depthWrite: true
  });
  material_map[filter] = mat;
}

var plane = new THREE.PlaneGeometry(width, height);
var quad = null;

function setFilter(filter) {
  console.log('setting filter:', filter);
  var mat = material_map[filter];
  if (quad)
    stage.remove(quad);
  quad = new THREE.Mesh(plane, mat);
  quad.position.x += width / 2;
  quad.position.y += height / 2;
  stage.add(quad);

  if (singlepass[filter])
    multipass = false;
  else
    multipass = true;
}

setFilter('mandelbrot');

function render(time) {
  requestAnimationFrame(render);
  uniforms.time.value = time / 1000.0;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    imageMat.map.needsUpdate = true;
  }

  if (multipass) {
    // render new content into accumulator buffer
    renderer.render(scene, camera, framebuffer, false);

    // render accumulator to screen
    renderer.render(stage, camera);

    // render screen to new back-buffer
    renderer.render(stage, camera, framebuffer2, true);

    // swap buffers
    var a = framebuffer2;
    framebuffer2 = framebuffer;
    framebuffer = a;

    uniforms.tDiffuse.value = framebuffer;
  }
  else {
    renderer.render(stage, camera);
  }
  //scene.remove(image);
}

render();
