const FORWARD = 0;
const BACK = 1;

const LEFT = 0;
const RIGHT = 1;

const UP = 0;
const DOWN = 1;

class OctreeNode
{
  constructor(position, size, depth = 0)
  {
    this.nodes = [];

    this.solid = true;

    this.depth = depth;

    // Position is centre of node
    this.position = position;
    this.size = size;
  }

  getNode(lr, fb, ud)
  {
    return this.nodes(nodeIndex(lr, fb, ud));
  }

  nodeIndex(lr, fb, ud)
  {
    return 1 * lr + 2 * fb + 4 * ud;
  }

  solidify()
  {
    // Destroy all children and make solid
    this.solid = true;

    this.destroy();
  }

  addNode(lr, fb, ud)
  {
    this.solid = false;

    let idx = this.nodeIndex(lr, fb, ud);

    if (this.nodes[idx])
    {
      this.nodes[idx].destroy();
    }

    let node = new OctreeNode(this.position.clone(), this.size.clone(), this.depth + 1);

    node.size = node.size.multiplyScalar(0.5);

    node.position.x += (lr ? node.size.x : -node.size.x) / 2;
    node.position.y += (fb ? node.size.y : -node.size.y) / 2;
    node.position.z += (ud ? node.size.z : -node.size.z) / 2;

    this.nodes[idx] = node;
  }

  destroy()
  {
    for (let child of this.nodes)
    {
      if (child)
      {
        child.destroy();
      }
    }

    this.nodes = [];
  }

  getBoundingBox()
  {
    let min = this.position.clone();
    min.x -= this.size.x / 2;
    min.y -= this.size.y / 2;
    min.z -= this.size.z / 2;

    let max = this.position.clone();
    max.x += this.size.x / 2;
    max.y += this.size.y / 2;
    max.z += this.size.z / 2;

    return new THREE.Box3(min, max);
  }

  getChildCount()
  {
    if (this.solid) return 1;

    let num = 0;

    for (let child of this.nodes)
    {
      if (child)
      {
        num += child.getChildCount();
      }
    }

    return num;
  }

  addSphere(sphere, maxDepth)
  {
    if (this.depth >= maxDepth) return;

    let nodeExplorer = [this];

    while (nodeExplorer.length)
    {
      let node = nodeExplorer[nodeExplorer.length - 1];
      if (node.depth >= maxDepth)
      {
        nodeExplorer.pop();
        continue;
      }

      let nodeBox = node.getBoundingBox();
      if (!nodeBox.intersectsSphere(sphere))
      {
        nodeExplorer.pop();
        continue;
      }
  
      // Check each position to see if position is in sphere
      for (let i = 0; i < 8; ++i)
      {
        // This is me being lazy and not wanting to deal with the vector arithmetic
        // Create all child octree nodes and remove them if they don't intersect
        let existed = false;

        // Only create child node if it doesn't exist
        if (!node.nodes[i])
        {
          node.addNode(i % 2, Math.floor(i / 2) % 2, Math.floor(i / 4) % 2);
        }
        else
        {
          if (node.nodes[i].solid) continue;
          existed = true;
        }

        //if (node.nodes[i].position.distanceTo(new THREE.Vector3(0, 0, 0)) > rad)
        let box = node.nodes[i].getBoundingBox();
  
        // Check if box is completely within sphere
        if (isBoxInsideSphere(box, sphere))
        {
          //node.nodes[i].solidify();
          node.nodes[i].solid = true;
          continue;
        }
  
        if (!box.intersectsSphere(sphere))
        {
          if (!existed)
          {
            console.log(node, i);
            node.nodes[i] = undefined;
          }
        }
        else
        {
          nodeExplorer.unshift(node.nodes[i]);
        }
      }
  
      nodeExplorer.pop();
    }
  }

  prune()
  {
    let allSolid = true;
    for (let child of this.nodes)
    {
      if (child)
      {
        child.prune();
        if (!child.solid)
        {
          allSolid = false;
        }
      }
      else
      {
        allSolid = false;
      }
    }

    if (allSolid)
    {
      this.solidify();
    }
  }
}
