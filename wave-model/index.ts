var THREE;
let scene;
let camera;
let renderer;

let geometry;
let marker;
let material;
let solidMaterial;
let cubes = [];
let origins = [];
let markers = [];
let originCount = 20;

let cutoff = 3;
let waveLengthScale = 2;
let waveFadingScale = 1;
let waveAmplitudeScale = 1;

let planeSize = 10;
let planePolys = 64;
let sinSteps = 1000;

let totalTime = 0;

function OnWindowResize()
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let sinValues = [];

function PopulateSinLookup()
{
  for (let i = 0; i < sinSteps; ++i)
  {
    sinValues.push(Math.sin((Math.PI / sinSteps) * i));
  }
}

function QuickSin(val)
{
  while (val < 0)
  {
    val += Math.PI;
  }

  val = Math.floor((val / Math.PI) * sinSteps) % sinSteps;
  return sinValues[val];
}

let frameTime = 0;

window.onload = () => {
  frameTime = (new Date()).getTime();

  init();

  requestAnimationFrame(run);
}

function ChangeSettings(evt, moveOrigins : boolean = false) : any
{
  let newWaveNumber = parseInt((<HTMLInputElement>document.getElementById('waveNumber')).value);
  waveAmplitudeScale = parseFloat((<HTMLInputElement>document.getElementById('waveAmplitude')).value);
  waveFadingScale = parseFloat((<HTMLInputElement>document.getElementById('waveFading')).value);
  waveLengthScale = parseFloat((<HTMLInputElement>document.getElementById('waveLength')).value);

  if (!moveOrigins) return;

  // Clear wave markers
  for (let i of markers)
  {
    scene.remove(i);
  }

  origins = [];
  markers = [];

  // Generate new markers
  for (let i = 0; i < newWaveNumber; ++i)
  {
    origins.push(new THREE.Vector3(Math.random() * planeSize - planeSize / 2, Math.random() * planeSize - planeSize / 2, 0));
    let ico = new THREE.Mesh(marker, solidMaterial);
    ico.position.copy(origins[origins.length - 1]);
    markers.push(ico);
    scene.add(ico);
  }
}

function init()
{
  PopulateSinLookup();

  document.getElementById('waveNumber').onchange = (evt) => ChangeSettings(evt, true);
  document.getElementById('waveLength').onchange = ChangeSettings;
  document.getElementById('waveFading').onchange = ChangeSettings;
  document.getElementById('waveAmplitude').onchange = ChangeSettings;
  document.getElementById('randomise').onclick = (evt) => ChangeSettings(evt, true);

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
  for (let f of geometry.faces)
  {
    f.vertexColors[0] = new THREE.Color(0x000000);
    f.vertexColors[1] = new THREE.Color(0x000000);
    f.vertexColors[2] = new THREE.Color(0x000000);
  }

  for (let i = 0; i < 1; ++i)
  {
    let cube = new THREE.Mesh(geometry, material);
    cubes.push(cube);
    scene.add(cube);
  }

  for (let i = 0; i < originCount; ++i)
  {
    origins.push(new THREE.Vector3(Math.random() * planeSize - planeSize / 2, Math.random() * planeSize - planeSize / 2, 0));

    let ico = new THREE.Mesh(marker, solidMaterial);
    ico.position.copy(origins[i]);
    scene.add(ico);
    markers.push(ico);
  }

  ChangeSettings(undefined, true);
}

function run()
{
  let deltaTime = ((new Date()).getTime() - frameTime) / 1000;
  frameTime = (new Date()).getTime();
  let state = update(deltaTime);

  draw(state);

  requestAnimationFrame(run);
}

function update(deltaTime)
{
  totalTime += deltaTime;
  let state = {
  };

  let verts = geometry.vertices;
  for (let v in verts)
  {
    let sum = 0;
    for (let o of origins)
    {
      let pos = verts[v].clone();
      pos.z = 0;
      let distance = pos.distanceTo(o);
      //if (distance < cutoff)
      //let val = Math.sin((distance - totalTime) * waveLengthScale) / ((1 + distance) / 5);
      let val = Math.sin((distance - totalTime) * waveLengthScale);
      val /= (1 + distance * waveFadingScale);
      sum += val * val;
    }
    sum /= origins.length;
    //sum *= sum; // TODO: Normalise
    //sum = Math.sqrt(Math.abs(sum)) * Math.sign(sum);

    verts[v].z = sum * waveAmplitudeScale;
  }

  for (let f of geometry.faces)
  {
    f.vertexColors[0].b = (verts[f.a].z / waveAmplitudeScale / 2 + 0.5);
    f.vertexColors[1].b = (verts[f.b].z / waveAmplitudeScale / 2 + 0.5);
    f.vertexColors[2].b = (verts[f.c].z / waveAmplitudeScale / 2 + 0.5);
  }

  geometry.verticesNeedUpdate = true;
  geometry.colorsNeedUpdate = true;

  for (let i in cubes)
  {
    //cubes[i].rotation.z += deltaTime * 0.1;
  }

  return state;
}

function draw(state)
{
  renderer.render(scene, camera);
}
