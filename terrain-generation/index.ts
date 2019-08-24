var THREE;
let scene;
let camera;
let renderer;

let geometry;
let material;
let cubes = [];

let totalTime = 0;

function OnWindowResize()
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function ChangeSettings(evt : any = null) : void
{

}

let frameTime = 0;

window.onload = () => {
  frameTime = (new Date()).getTime();

  init();

  requestAnimationFrame(run);
}

function init() : void
{
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
  for (let f of geometry.faces)
  {
    f.vertexColors[0] = new THREE.Color(0xFFFFFF);
    f.vertexColors[1] = new THREE.Color(0xFFFFFF);
    f.vertexColors[2] = new THREE.Color(0xFFFFFF);
  }

  for (let i = 0; i < 1; ++i)
  {
    let cube = new THREE.Mesh(geometry, material);
    cubes.push(cube);
    scene.add(cube);
  }

  ChangeSettings();
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

  return state;
}

function draw(state)
{
  renderer.render(scene, camera);
}
