var THREE;
var scene;
var camera;
var renderer;
var geometry;
var shipGeometry;
var shipModel;
var shipLoaded = false;
var material;
var cubes = [];
var sun;
var ship;
var velocity = -1;
var angularVelocity = -0.1;
var goal;
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
function SetupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.x = Math.PI / 4;
    camera.position.y = -5;
    camera.position.z = 5;
    camera.up.set(0, 0, 1);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.onresize = OnWindowResize;
    material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, wireframe: true, vertexColors: THREE.VertexColors });
    scene.add(new THREE.DirectionalLight());
    sun = scene.children[scene.children.length - 1];
    sun.position.copy(new THREE.Vector3(0, 0, 100));
    sun.lookAt = new THREE.Vector3(0, 0, 0);
    scene.add(new THREE.AxesHelper(5, 10));
}
function LoadAssets() {
    var loader = new THREE.GLTFLoader();
    loader.load('ship.gltf', function (gltf) {
        console.log(gltf);
        shipModel = gltf.scene.children[0];
        shipGeometry = shipModel.geometry;
        ship = new Ship(shipModel);
        goal = new THREE.Object3D;
        shipModel.add(goal);
        goal.position.set(10, 0, 10);
    }, undefined, function (x) { return console.log(x); });
}
function init() {
    SetupScene();
    LoadAssets();
    ChangeSettings();
}
function run() {
    var deltaTime = ((new Date()).getTime() - frameTime) / 1000;
    frameTime = (new Date()).getTime();
    var state = update(deltaTime);
    if (shipModel && !shipLoaded) {
        shipLoaded = true;
        scene.add(shipModel);
    }
    draw(state);
    requestAnimationFrame(run);
}
function update(deltaTime) {
    totalTime += deltaTime;
    var state = {};
    if (ship) {
        ship.Update(deltaTime);
        var temp = (new THREE.Vector3).setFromMatrixPosition(goal.matrixWorld);
        camera.position.lerp(temp, 0.2);
        camera.lookAt(shipModel.position);
    }
    return state;
}
function draw(state) {
    renderer.render(scene, camera);
}
