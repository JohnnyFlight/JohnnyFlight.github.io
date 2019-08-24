var THREE;
var scene;
var camera;
var renderer;
var geometry;
var material;
var cubes = [];
var totalTime = 0;
function OnWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function ChangeSettings(evt) {
    if (evt === void 0) { evt = null; }
}
var frameTime = 0;
window.onload = function () {
    frameTime = (new Date()).getTime();
    init();
    requestAnimationFrame(run);
};
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.x = Math.PI / 4;
    camera.position.y = -5;
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.onresize = OnWindowResize;
    geometry = new THREE.PlaneGeometry(5, 5, 32, 32);
    material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, wireframe: true, vertexColors: THREE.VertexColors });
    //  Assign vertex colours
    for (var _i = 0, _a = geometry.faces; _i < _a.length; _i++) {
        var f = _a[_i];
        f.vertexColors[0] = new THREE.Color(0xFFFFFF);
        f.vertexColors[1] = new THREE.Color(0xFFFFFF);
        f.vertexColors[2] = new THREE.Color(0xFFFFFF);
    }
    for (var i = 0; i < 1; ++i) {
        var cube = new THREE.Mesh(geometry, material);
        cubes.push(cube);
        scene.add(cube);
    }
    ChangeSettings();
}
function run() {
    var deltaTime = ((new Date()).getTime() - frameTime) / 1000;
    frameTime = (new Date()).getTime();
    var state = update(deltaTime);
    draw(state);
    requestAnimationFrame(run);
}
function update(deltaTime) {
    totalTime += deltaTime;
    var state = {};
    return state;
}
function draw(state) {
    renderer.render(scene, camera);
}
