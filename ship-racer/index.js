let scene;
let camera;
let renderer;

let geometry;
let shipGeometry;
let shipModel;
let shipLoaded = false;
let material;
let cubes = [];
let sun;
let ship;

let velocity = -1;
let angularVelocity = -0.1;

let turn = 0;
let move = 0;

let goal;

let totalTime = 0;

function OnWindowResize()
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function OnKeyDown(e)
{
  turn = 0;
  move = 0;

  switch (e.key)
  {
    case 'a':
      turn = -1;
      break;
    case 'd':
      turn = 1;
      break;
    case 'w':
      move = 1;
      break;
  }

  console.log(e);
}

function ChangeSettings(evt)
{

}

let frameTime = 0;

window.onload = () => {
  frameTime = (new Date()).getTime();

  init();

  requestAnimationFrame(run);
}

function SetupScene()
{
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
  window.onkeydown = OnKeyDown;

  material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, wireframe: true, vertexColors: THREE.VertexColors });

  scene.add(new THREE.DirectionalLight());

  sun = scene.children[scene.children.length-1];
  sun.position.copy(new THREE.Vector3(0, 0, 100));
  sun.lookAt = new THREE.Vector3(0, 0, 0);

  scene.add(new THREE.AxesHelper(5));
}

function LoadAssets()
{
  let loader = new THREE.GLTFLoader();

  loader.load('ship.gltf',
    (gltf) => {
      console.log(gltf);
      shipModel = gltf.scene.children[0];
      shipGeometry = shipModel.geometry;

      ship = new Ship(shipModel);

      goal = new THREE.Object3D;
      shipModel.add(goal);
      goal.position.set(10, 0, 10);

    }, undefined, (x) => console.log(x));
}

function init()
{
  SetupScene();
  LoadAssets();

  ChangeSettings();
}

function run()
{
  let deltaTime = ((new Date()).getTime() - frameTime) / 1000;
  frameTime = (new Date()).getTime();
  let state = update(deltaTime);

  if (shipModel && !shipLoaded)
  {
    shipLoaded = true;
    scene.add(shipModel);
  }

  draw(state);

  requestAnimationFrame(run);
}

function update(deltaTime)
{
  totalTime += deltaTime;
  let state = {
  };

  if (ship)
  {
    ship.physics.velocity.x = Math.cos(ship.physics.rotation) * velocity * move;
    ship.physics.velocity.y = Math.sin(ship.physics.rotation) * velocity * move;

    ship.physics.angularVelocity = angularVelocity * turn;

    ship.Update(deltaTime);

    let temp = (new THREE.Vector3).setFromMatrixPosition(goal.matrixWorld);

    camera.position.lerp(temp, 0.2);
    camera.lookAt( shipModel.position );
  }

  return state;
}

function draw(state)
{
  renderer.render(scene, camera);
}
