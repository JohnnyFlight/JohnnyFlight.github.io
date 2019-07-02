let map;
let can;

window.onload = () => {
  map = new Map();

  can = document.getElementById('canvas');
  map.cells.push(new MapCell(new Vector2(0, 0), true, false, [1, 2]));
  map.cells[0].name = 'Home Village';
  map.cells[0].tags = ['start', 'homeVillage', 'safe'];

  map.cells.push(new MapCell(new Vector2(50, 0), true, false, [0]));
  map.cells.push(new MapCell(new Vector2(0, 50), true, false));

  can.onclick = mapClick;

  let ctx = can.getContext('2d');

  map.render(ctx, can.width, can.height, (ctx, cell) => {
    if (cell.hasTag('safe'))
      ctx.strokeStyle = 'blue';
  });
};

function mapClick(evt)
{
  let pos = new Vector2(evt.offsetX - can.width / 2 + map.centre.x, evt.offsetY - can.height / 2 + map.centre.y);

  let target = map.getCellAtPoint(pos.x, pos.y);
  console.log(target);

  if (target)
    printCell(target);
}

function printCell(cell)
{
  document.getElementById('cellName').innerText = cell.name || 'No name';
  document.getElementById('cellPos').innerText = `${cell.position.x}, ${cell.position.y}`;
  document.getElementById('cellTags').innerText = cell.tags.join(', ') || 'No tags';
}

/*
  NOTE: To prevent circular references, each map cell will only refer to an index of connected cells
  This means that you can still render half-paths to unseen map cells although it might be harder to manage
*/

class MapCell
{
  constructor(position, visible = true, hidden = false, links = [])
  {
    // Vec2D
    this.position = position;
    // Array of indexes of other cells
    this.links = links;

    this.size = new Vector2(40, 40);

    // Visible means show on map
    this.visible = visible;

    // Hidden means don't draw link
    this.hidden = hidden;

    this.name = '';
    this.tags = [];
  }

  hasTag(tag)
  {
    return this.tags.indexOf(tag) > -1;
  }

  isPointInCell(x, y)
  {
    let halfSize = this.size.divide(2);
    // NOTE: Point in map space
    if (x < this.position.x - halfSize.x) return false;
    if (x > this.position.x + halfSize.x) return false;
    if (y < this.position.y - halfSize.y) return false;
    if (y > this.position.y + halfSize.y) return false;

    return true;
  }
};

class Map
{
  constructor()
  {
    this.centre = new Vector2(100, 100);
    this.cells = [];
    // List of indexes of visible cells
    this.visible = [];
  }

  getCellByName(name)
  {
    for (let cell of this.cells)
    {
      if (cell.name == name)
        return cell;
    }

    return false;
  }

  getCellAtPoint(x, y)
  {
    // NOTE: Point is in Map space
    // Will need to be translated when using ie mouse clicks
    for (let cell of this.cells)
    {
      if (cell.isPointInCell(x, y))
        return cell;
    }

    return false;
  }

  getCellsByTag(tag)
  {
    let output = [];

    for (let cell of this.cells)
    {
      if (cell.hasTag())
        output.push(cell);
    }

    return output;
  }

  centreCellWithName(name)
  {
    let cell = this.getCellByName(name);
    if (!cell) return;

    this.centre = cell.position;
  }

  // style function accepts a context and modifies the stroke and line width of the context for the purpose of rendering the next cell
  render(ctx, width, height, cellStyleFunction, pathStyleFunction)
  {
    //  Translate to centre of screen
    // Render each cell and it's half-connections if they're in range of the map centre and width
    for (let cell of this.cells)
    {
      ctx.save();
      {
        if (cellStyleFunction)
        {
          cellStyleFunction(ctx, cell);
        }
        else
        {
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
        }

        ctx.translate(width / 2 - this.centre.x, height / 2 - this.centre.y);

        // If cell is visible and in map size or connected to cell in map size
        if (!cell.visible) continue;
        ctx.save();
        {
          ctx.translate(-cell.size.x / 2, -cell.size.y / 2);
          ctx.rect(cell.position.x, cell.position.y, cell.size.x, cell.size.y);
          ctx.stroke();
        }
        ctx.restore();
        // Render cell connections
        for (let conIdx of cell.links)
        {
          if (pathStyleFunction)
          {
            pathStyleFunction(ctx, fromCell, toCell);
          }
          else
          {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
          }

          let con = this.cells[conIdx];
          if (con.hidden) continue;

          let midPoint = con.position.subtract(cell.position).divide(2).add(cell.position);

          ctx.beginPath();
          {
            ctx.moveTo(cell.position.x, cell.position.y);
            ctx.lineTo(midPoint.x, midPoint.y);
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
  }
};
