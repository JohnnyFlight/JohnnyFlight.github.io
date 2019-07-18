/*
  NOTE: To prevent circular references, each map cell will only refer to an index of connected cells
  This means that you can still render half-paths to unseen map cells although it might be harder to manage
*/

class MapCell
{
  constructor(position, name, tags = [], links = [])
  {
    // Vec2D
    this.position = position;
    this.name = name;
    this.tags = tags;

    // Array of indexes of other cells
    this.links = links;

    this.size = new Vector2(40, 40);
    // Visible means show on map
    this.visible = true;
    // Hidden means don't draw link
    this.hidden = false;
  }

  hasTag(tag)
  {
    return this.tags.indexOf(tag) > -1;
  }

  addTag(tag)
  {
    if (this.tags.indexOf(tag) == -1)
    {
      this.tags.push(tag);
    }
  }

  removeTag(tag)
  {
    let index = this.tags.indexOf(tag);
    while (index > -1)
    {
      this.tags.splice(index, 1);
    }
  }

  removeCellIndex(idx)
  {
    // Remove index
    this.links = this.links.filter((x) => x != idx);

    // Adjust indexes
    this.links = this.links.map((x) => x > idx ? x - 1 : x);
  }

  isPointInCell(x, y)
  {
    let halfSize = new Vector2(this.size.x, this.size.y);
    halfSize.x /= 2;
    halfSize.y /= 2;

    // NOTE: Point in map space
    if (x < this.position.x - halfSize.x) return false;
    if (x > this.position.x + halfSize.x) return false;
    if (y < this.position.y - halfSize.y) return false;
    if (y > this.position.y + halfSize.y) return false;

    return true;
  }
};

class Path
{
  constructor()
  {

  }
};

class Map
{
  constructor()
  {
    this.centre = new Vector2(0, 0);
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

  getCellIndexByName(name)
  {
    for (let cell in this.cells)
    {
      if (this.cells[cell].name == name)
        return cell;
    }

    return -1;
  }

  removeCellByIndex(idx)
  {
    // Remove cell
    this.cells = this.cells.filter((x, y) => y != idx);

    for (let cell of this.cells)
    {
      // Remove and adjust all cell indexes
      cell.removeCellIndex(idx);
    }
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

  getCellIndexAtPoint(x, y)
  {
    // NOTE: Point is in Map space
    // Will need to be translated when using ie mouse clicks
    for (let cell in this.cells)
    {
      if (this.cells[cell].isPointInCell(x, y))
        return cell;
    }

    return -1;
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

  // Looks through map cell links and turns string names into indexes
  resolveCellLinkNames()
  {
    for (let cell of this.cells)
    {
      for (let l in cell.links)
      {
        if (typeof cell.links[l] == 'string')
        {
          for (let i in this.cells)
          {
            if (this.cells[i].name == cell.links[l])
            {
              cell.links[l] = parseInt(i);
            }
          }
        }
      }
    }
  }

  linkCells(from, to)
  {
    if (this.cells[from].links.indexOf(to) > -1) return;

    this.cells[from].links.push(to);
  }

  setCellVisibilityByTag(tag, visibility)
  {
    for (var cell of this.cells)
    {
      if (cell.hasTag(tag))
      {
        cell.visible = visibility;
      }
    }
  }

  setCellVisibilityByName(name, visibility)
  {
    for (var cell of this.cells)
    {
      if (cell.name == name)
      {
        cell.visible = visibility;
        return;
      }
    }
  }

  setCellHiddenByTag(tag, hidden)
  {
    for (let cell of this.cells)
    {
      if (cell.hasTag(tag))
      {
        cell.hidden = hidden;
      }
    }
  }

  setCellVisibilityAll(visibility)
  {
    for (var cell of this.cells)
    {
      cell.visible = visibility;
    }
  }

  setCellHiddenAll(hidden)
  {
    for (var cell of this.cells)
    {
      cell.hidden = hidden;
    }
  }

  // style function accepts a context and modifies the stroke and line width of the context for the purpose of rendering the next cell
  render(ctx, width, height)
  {
    //  Translate to centre of screen
    // Render each cell and it's half-connections if they're in range of the map centre and width

    for (let cell of this.cells)
    {
      ctx.save();
      {
        ctx.translate(width / 2 - this.centre.x, height / 2 - this.centre.y);

        ctx.save();
        {
          this.renderCell(ctx, cell);
        }
        ctx.restore();
        // Render cell connections
        for (let conIdx of cell.links)
        {
          let con = this.cells[conIdx];
          if (!con) continue;

          ctx.save();
          {
            this.renderPath(ctx, cell, con);
          }
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  renderCell(ctx, cell)
  {
    if (this.customRenderCell)
    {
      this.customRenderCell(ctx, cell);
      return;
    }

    // If cell is visible and in map size or connected to cell in map size
    if (!cell.visible) return;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    ctx.save();
    {
      ctx.translate(-cell.size.x / 2, -cell.size.y / 2);

      ctx.beginPath();
      {
        ctx.rect(cell.position.x, cell.position.y, cell.size.x, cell.size.y);
        ctx.stroke();
      }
      ctx.closePath();
    }
    ctx.restore();


    if (cell.hasTag('goal'))
    {
      ctx.save();
      ctx.beginPath();
      {
        ctx.fillStyle = 'blue';
        ctx.arc(cell.position.x, cell.position.y, 10, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.closePath();
      ctx.restore();
    }
  }

  renderPath(ctx, fromCell, toCell)
  {
    if (this.customRenderPath)
    {
      this.customRenderPath(ctx, fromCell, toCell);
      return;
    }

    if (!fromCell.visible) return;
    if (toCell.hidden) return;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    //let midPoint = toCell.position.subtract(fromCell.position).divide(2).add(fromCell.position);

    let midPoint = new Vector2((toCell.position.x - fromCell.position.x) / 2 + fromCell.position.x, (toCell.position.y - fromCell.position.y) / 2 + fromCell.position.y);

    console.log(midPoint);

    ctx.beginPath();
    {
      ctx.moveTo(fromCell.position.x, fromCell.position.y);
      ctx.lineTo(midPoint.x, midPoint.y);
      ctx.closePath();
      ctx.stroke();
    }
  }
};
