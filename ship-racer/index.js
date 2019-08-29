let scene;
let camera;
let renderer;

let geometries = {};
let obstacles = [];

let shipModel;
let shipLoaded = false;
let materials = {};
let cubes = [];
let sun;
let ship;

let velocity = -3;
let angularVelocity = -0.5;

let turn = 0;
let move = 1;

let cameraLerp = 0.1;

let goal;
let paused = false;
let totalTime = 0;

function OnWindowResize()
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function OnKeyDown(e)
{
  switch (e.key)
  {
    case 'a':
      turn = -1;
      break;
    case 'd':
      turn = 1;
      break;
    case ' ':
      paused = !paused;
      break;
  }
}

function OnKeyUp(e)
{
  switch (e.key)
  {
    case 'a':
      turn = 0;
      break;
    case 'd':
      turn = 0;
      break;
  }
}

function ChangeSettings(evt)
{

}

function SpawnObstacle()
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
  window.onkeyup = OnKeyUp;

  materials.default = new THREE.MeshBasicMaterial({ vertexColors: 0x333333 });

  scene.add(new THREE.DirectionalLight());

  sun = scene.children[scene.children.length-1];
  sun.position.copy(new THREE.Vector3(25, 50, 100));
  sun.lookAt = new THREE.Vector3(0, 0, 0);

  scene.add(new THREE.AxesHelper(5));
}

function LoadAssets()
{
  let shipLoader = new THREE.GLTFLoader();

  shipLoader.load('ship.gltf',
    (gltf) => {
      shipModel = gltf.scene.children[0];
      geometries.ship = shipModel.geometry;

      ship = new Ship(shipModel);

      goal = new THREE.Object3D;
      shipModel.add(goal);
      goal.position.set(10, 0, 10);

    }, undefined, (x) => console.log(x));

  let obstacleLoader = new THREE.GLTFLoader();

  obstacleLoader.load('obstacle.gltf',
    (gltf) => {
      geometries.obstacle = gltf.scene.children[0].geometry;
      materials.default = gltf.scene.children[0].material;

      obstacles.push(new THREE.Mesh(geometries.obstacle, materials.default));
      scene.add(obstacles[obstacles.length - 1]);

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

  if (paused) return;

  let state = {
  };

  if (ship)
  {
    ship.physics.velocity.x = Math.cos(ship.physics.rotation) * velocity * move;
    ship.physics.velocity.y = Math.sin(ship.physics.rotation) * velocity * move;

    if (turn)
    {
      ship.physics.angularVelocity = angularVelocity * turn;
    }
    else
    {
      ship.physics.angularVelocity = Math.sign(ship.physics.rotation) * angularVelocity;

      if (Math.abs(ship.physics.rotation) < 0.01)
      {
        ship.physics.angularVelocity = 0;
        ship.physics.rotation = 0;
      }
    }

    ship.Update(deltaTime);

    let temp = (new THREE.Vector3).setFromMatrixPosition(goal.matrixWorld);

    camera.position.lerp(temp, cameraLerp);
    camera.lookAt( shipModel.position );
  }

  return state;
}

function draw(state)
{
  renderer.render(scene, camera);
}
