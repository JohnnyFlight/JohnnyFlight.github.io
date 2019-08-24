var THREE;
var scene;
var camera;
var renderer;
var geometry;
var marker;
var material;
var solidMaterial;
var cubes = [];
var origins = [];
var markers = [];
var originCount = 20;
var cutoff = 3;
var waveLengthScale = 2;
var waveFadingScale = 1;
var waveAmplitudeScale = 1;
var planeSize = 10;
var planePolys = 64;
var sinSteps = 1000;
var totalTime = 0;
function OnWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
var sinValues = [];
function PopulateSinLookup() {
    for (var i = 0; i < sinSteps; ++i) {
        sinValues.push(Math.sin((Math.PI / sinSteps) * i));
    }
}
function QuickSin(val) {
    while (val < 0) {
        val += Math.PI;
    }
    val = Math.floor((val / Math.PI) * sinSteps) % sinSteps;
    return sinValues[val];
}
var frameTime = 0;
window.onload = function () {
    frameTime = (new Date()).getTime();
    init();
    requestAnimationFrame(run);
};
function ChangeSettings(evt, moveOrigins) {
    if (moveOrigins === void 0) { moveOrigins = false; }
    var newWaveNumber = parseInt(document.getElementById('waveNumber').value);
    waveAmplitudeScale = parseFloat(document.getElementById('waveAmplitude').value);
    waveFadingScale = parseFloat(document.getElementById('waveFading').value);
    waveLengthScale = parseFloat(document.getElementById('waveLength').value);
    if (!moveOrigins)
        return;
    // Clear wave markers
    for (var _i = 0, markers_1 = markers; _i < markers_1.length; _i++) {
        var i = markers_1[_i];
        scene.remove(i);
    }
    origins = [];
    markers = [];
    // Generate new markers
    for (var i = 0; i < newWaveNumber; ++i) {
        origins.push(new THREE.Vector3(Math.random() * planeSize - planeSize / 2, Math.random() * planeSize - planeSize / 2, 0));
        var ico = new THREE.Mesh(marker, solidMaterial);
        ico.position.copy(origins[origins.length - 1]);
        markers.push(ico);
        scene.add(ico);
    }
}
function init() {
    PopulateSinLookup();
    document.getElementById('waveNumber').onchange = function (evt) { return ChangeSettings(evt, true); };
    document.getElementById('waveLength').onchange = ChangeSettings;
    document.getElementById('waveFading').onchange = ChangeSettings;
    document.getElementById('waveAmplitude').onchange = ChangeSettings;
    document.getElementById('randomise').onclick = function (evt) { return ChangeSettings(evt, true); };
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.x = Math.PI / 4;
    camera.position.y = -5;
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.onresize = OnWindowResize;
    geometry = new THREE.PlaneGeometry(planeSize, planeSize, planePolys, planePolys);
    material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, wireframe: true, vertexColors: THREE.VertexColors });
    solidMaterial = new THREE.MeshBasicMaterial({ color: 0xdddddd });
    marker = new THREE.IcosahedronGeometry(0.1, 2);
    //  Assign vertex colours
    for (var _i = 0, _a = geometry.faces; _i < _a.length; _i++) {
        var f = _a[_i];
        f.vertexColors[0] = new THREE.Color(0x000000);
        f.vertexColors[1] = new THREE.Color(0x000000);
        f.vertexColors[2] = new THREE.Color(0x000000);
    }
    for (var i = 0; i < 1; ++i) {
        var cube = new THREE.Mesh(geometry, material);
        cubes.push(cube);
        scene.add(cube);
    }
    for (var i = 0; i < originCount; ++i) {
        origins.push(new THREE.Vector3(Math.random() * planeSize - planeSize / 2, Math.random() * planeSize - planeSize / 2, 0));
        var ico = new THREE.Mesh(marker, solidMaterial);
        ico.position.copy(origins[i]);
        scene.add(ico);
        markers.push(ico);
    }
    ChangeSettings(undefined, true);
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
    var verts = geometry.vertices;
    for (var v in verts) {
        var sum = 0;
        for (var _i = 0, origins_1 = origins; _i < origins_1.length; _i++) {
            var o = origins_1[_i];
            var pos = verts[v].clone();
            pos.z = 0;
            var distance = pos.distanceTo(o);
            //if (distance < cutoff)
            //let val = Math.sin((distance - totalTime) * waveLengthScale) / ((1 + distance) / 5);
            var val = Math.sin((distance - totalTime) * waveLengthScale);
            val /= (1 + distance * waveFadingScale);
            sum += val * val;
        }
        sum /= origins.length;
        //sum *= sum; // TODO: Normalise
        //sum = Math.sqrt(Math.abs(sum)) * Math.sign(sum);
        verts[v].z = sum * waveAmplitudeScale;
    }
    for (var _a = 0, _b = geometry.faces; _a < _b.length; _a++) {
        var f = _b[_a];
        f.vertexColors[0].b = (verts[f.a].z / waveAmplitudeScale / 2 + 0.5);
        f.vertexColors[1].b = (verts[f.b].z / waveAmplitudeScale / 2 + 0.5);
        f.vertexColors[2].b = (verts[f.c].z / waveAmplitudeScale / 2 + 0.5);
    }
    geometry.verticesNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
    for (var i in cubes) {
        //cubes[i].rotation.z += deltaTime * 0.1;
    }
    return state;
}
function draw(state) {
    renderer.render(scene, camera);
}
