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

let octree;
let octreeMeshes = [];

let maxDepth = 5;

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
    default:
      break;
  }
}

function OnKeyUp(e)
{
  switch (e.key)
  {
    default:
      break;
  }
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
  window.onkeyup = OnKeyUp;

  materials.default = new THREE.MeshBasicMaterial({ vertexColors: 0x333333 });

  materials.wireframe = new THREE.MeshBasicMaterial({ wireframe: true });

  materials.depth = [];

  for (let i = 0; i <= maxDepth; ++i)
  {
    let colour = i * (0xFF / (maxDepth + 1));
    colour = colour + colour * 255 + colour * 255 * 255;

    materials.depth.push(new THREE.MeshBasicMaterial({ wireframe: false, color: new THREE.Color(i * (1 / maxDepth), 0, 0), transparent: true, opacity: (maxDepth - i + 1) * (1 / (maxDepth + 1)) }));
  }

  scene.add(new THREE.DirectionalLight());

  sun = scene.children[scene.children.length-1];
  sun.position.copy(new THREE.Vector3(25, 50, 100));
  sun.lookAt = new THREE.Vector3(0, 0, 0);

  scene.add(new THREE.AxesHelper(5));

  geometries.cube = new THREE.BoxGeometry(1, 1, 1);
}

function LoadAssets()
{

}

function init()
{
  SetupScene();
  LoadAssets();

  octree = new OctreeNode(new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, 5, 5));

  let nodeExplorer = [octree];
  let rad = 2.5;

  let sphere = new THREE.Sphere(new THREE.Vector3(), rad);

  while (nodeExplorer.length)
  {
    let node = nodeExplorer[nodeExplorer.length - 1];
    if (node.depth >= maxDepth)
    {
      nodeExplorer.pop();
      continue;
    }

    // Check each position to see if position is in sphere
    for (let i = 0; i < 8; ++i)
    {
      // This is me being lazy and not wanting to deal with the vector arithmetic
      // Create all child octree nodes and remove them if they don't intersect
      node.addNode(i % 2, Math.floor(i / 2) % 2, Math.floor(i / 4) % 2);
      //if (node.nodes[i].position.distanceTo(new THREE.Vector3(0, 0, 0)) > rad)
      let box = node.nodes[i].getBoundingBox();

      // Check if box is completely within sphere
      if (isBoxInsideSphere(box, sphere))
      {
        node.nodes[i].solidify();
        continue;
      }

      if (!box.intersectsSphere(sphere))
      {
        node.nodes[i] = undefined;
      }
      else
      {
        nodeExplorer.unshift(node.nodes[i]);
      }
    }

    nodeExplorer.pop();
  }

  octree.prune();

  rebuildOctree(octree);

  ChangeSettings();
}

function isBoxInsideSphere(box, sphere)
{
  let boxSphere = new THREE.Sphere();
  box.getBoundingSphere(boxSphere);

  return (boxSphere.center.distanceTo(sphere.center) < sphere.radius - boxSphere.radius);
}

function rebuildOctree(octree)
{
  // Remove all previous cubes
  for (let cube of octreeMeshes)
  {
    scene.remove(cube);
  }

  octreeMeshes = [];

  // Go through octree to add more nodes
  let nodeExplorer = [octree];

  while (nodeExplorer.length)
  {
    let node = nodeExplorer[nodeExplorer.length - 1];

    // Check if current node is solid
    if (node.solid)
    {
      let mesh = new THREE.Mesh(geometries.cube, materials.depth[node.depth]);
      mesh.scale.copy(node.size);
      mesh.position.copy(node.position);
      octreeMeshes.push(mesh);
      scene.add(mesh);
    }

    // For each child
    for (let child of node.nodes)
    {
      if (child)
      {
        // Add it to explorer for later
        nodeExplorer.unshift(child);
      }
    }

    // Pop end of explorer
    nodeExplorer.pop();
  }

  /*let geometry = new THREE.Geometry();
  let idx = 0;
  let mats = [];

  for (let mesh of octreeMeshes)
  {
    mesh.updateMatrix();
    mesh.geometry.faces.forEach(function(face) {face.materialIndex = 0;});
    mats.push(mesh.material);
    geometry.merge(mesh.geometry, mesh.matrix, idx);
    idx++;
  }

  geometries.octree = new THREE.BufferGeometry().fromGeometry(geometry, mats);

  geometries.octree.groupNeedsUpdate = true;

  octreeMeshes = [];
  octreeMeshes.push(new THREE.Mesh(geometries.octree));
  octreeMeshes[0].geometry.computeFaceNormals();
  octreeMeshes[0].geometry.computeVertexNormals();
  scene.add(octreeMeshes[0]);*/
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

  if (paused) return;

  let state = {
  };

  let nodeExplorer = [octree];

  //while (nodeExplorer.length)
  while (false)
  {
    let node = nodeExplorer[nodeExplorer.length - 1];

    // Check if current node is solid
    if (node.solid)
    {
      let mesh = new THREE.Mesh(geometries.cube, materials.wireframe);
      mesh.scale.copy(node.size);
      mesh.position.copy(node.position);
      octreeMeshes.push(mesh);
      scene.add(mesh);
    }

    // For each child
    for (let child of node.nodes)
    {
      if (child)
      {
        // Add it to explorer for later
        nodeExplorer.unshift(child);
      }
    }

    // Pop end of explorer
    nodeExplorer.pop();
  }

  scene.rotation.z += deltaTime;

  return state;
}

function draw(state)
{
  renderer.render(scene, camera);
}
