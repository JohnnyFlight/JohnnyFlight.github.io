/*
  NOTE: To prevent circular references, each map cell will only refer to an index of connected cells
  This means that you can still render half-paths to unseen map cells although it might be harder to manage
*/

class MapCell
{
  constructor(position, name, tags = [], links = [], size = { x: 40, y: 40 }, visible = true, hidden = false)
  {
    // Vector2
    this.position = position;
    this.name = name;
    this.tags = tags;

    // Array of indexes of other cells
    this.links = links;

    this.size = size;
    // Visible means show on map
    this.visible = visible;
    // Hidden means don't draw link
    this.hidden = hidden;
  }

  static generateInitCode(cell, mapReveal = false)
  {
    // Assumes there's already an object called map that been created
    let output = `map.cells.push(new MapCell({ x: ${cell.position.x}, y: ${cell.position.y}}, '${cell.name}', [${cell.tags.map((x) => '"' + x + '"').join(', ')}], [${cell.links.join(', ')}], { x: ${cell.size.x}, y: ${cell.size.y} }, ${mapReveal ? false : cell.visible}, ${cell.hidden}));`;

    return output;
  }

  static hasTag(cell, tag)
  {
    return cell.tags.indexOf(tag) > -1;
  }

  static addTag(cell, tag)
  {
    if (cell.tags.indexOf(tag) == -1)
    {
      cell.tags.push(tag);
    }
  }

  static removeTag(cell, tag)
  {
    let index = cell.tags.indexOf(tag);
    while (index > -1)
    {
      cell.tags.splice(index, 1);
    }
  }

  static removeCellIndex(cell, idx, shift = false)
  {
    // Remove index
    cell.links = cell.links.filter((x) => x != idx);

    // Adjust indexes
    cell.links = cell.links.map((x) => (shift && (parseInt(x) > idx)) ? x - 1 : x);
  }

  static isPointInCell(cell, x, y)
  {
    let halfSize = { x: cell.size.x, y: cell.size.y };
    halfSize.x /= 2;
    halfSize.y /= 2;

    // NOTE: Point in map space
    if (x < cell.position.x - halfSize.x) return false;
    if (x > cell.position.x + halfSize.x) return false;
    if (y < cell.position.y - halfSize.y) return false;
    if (y > cell.position.y + halfSize.y) return false;

    return true;
  }
};

class MiniMap
{
  constructor(centre = { x: 0, y: 0 })
  {
    this.centre = centre;
    this.cells = [];

    this.paths = [];
  }

  static generateInitCode(map, mapReveal = false)
  {
    let output = `let map = new MiniMap({ x: ${map.centre.x}, y: ${map.centre.y} });\n`;

    for (let cell of map.cells)
    {
      output += '\n';
      output += `${cell.generateInitCode(mapReveal)}`;
    }

    output += '\n\nmap.bakePaths();';

    return output;
  }

  static getCellByName(map, name)
  {
    for (let cell of map.cells)
    {
      if (cell.name == name)
        return cell;
    }

    return false;
  }

  static getCellIndexByName(map, name)
  {
    for (let cell in map.cells)
    {
      if (map.cells[cell].name == name)
        return cell;
    }

    return -1;
  }

  static removeCellByIndex(map, idx)
  {
    // Remove cell
    map.cells = map.cells.filter((x, y) => y != idx);

    for (let cell of map.cells)
    {
      // Remove and adjust all cell indexes
      MapCell.removeCellIndex(cell, idx, true);
    }
  }

  static getCellAtPoint(map, x, y)
  {
    // NOTE: Point is in Map space
    // Will need to be translated when using ie mouse clicks
    for (let cell of map.cells)
    {
      if (cell.isPointInCell(x, y))
        return cell;
    }

    return false;
  }

  static getCellIndexAtPoint(map, x, y)
  {
    // NOTE: Point is in Map space
    // Will need to be translated when using ie mouse clicks
    for (let cell in map.cells)
    {
      if (MapCell.isPointInCell(map.cells[cell], x, y))
        return cell;
    }

    return -1;
  }

  static getCellsByTag(map, tag)
  {
    let output = [];

    for (let cell of map.cells)
    {
      if (MapCell.hasTag(cell))
        output.push(cell);
    }

    return output;
  }

  static centreCellWithName(map, name)
  {
    let cell = MiniMap.getCellByName(map, name);
    if (!cell) return;

    map.centre = cell.position;
  }

  // Looks through map cell links and turns string names into indexes
  static resolveCellLinkNames(map)
  {
    for (let cell of map.cells)
    {
      for (let l in cell.links)
      {
        if (typeof cell.links[l] == 'string')
        {
          for (let i in map.cells)
          {
            if (map.cells[i].name == cell.links[l])
            {
              cell.links[l] = parseInt(i);
            }
          }
        }
      }
    }
  }

  static getPathStep(map, fromIdx, toIdx)
  {
    if (!map.paths[fromIdx][toIdx]) return;

    let output = [];
    for (let link of map.cells[fromIdx].links)
    {
      if (map.paths[link][toIdx] < map.paths[fromIdx][toIdx])
      {
        output.push(link);
      }
    }

    return output;
  }

  static bakePaths(map)
  {
    map.paths = [];

    // For each cell do flood fill to get links
    for (let i in map.cells)
    {
      i = parseInt(i);

      map.paths[i] = [];

      let openSet = [i];
      let closedSet = [];

      let curIdx;
      // Set distance of current cell to itself
      map.paths[i][i] = 0;

      do
      {
        curIdx = openSet.pop();

        // Put all adjacent links in the open set and calculate distance
        for (let link of map.cells[curIdx].links)
        {
          link = parseInt(link);

          if (closedSet.indexOf(link) > -1) continue;

          if (map.paths[i][link] == undefined)
          {
            map.paths[i][link] = map.paths[i][curIdx] + 1;
          }

          closedSet.push(curIdx);
          openSet.unshift(link);
        }

        closedSet.push(curIdx);
      }
      while (openSet.length);
    }
  }

  static linkCells(map, from, to)
  {
    if (map.cells[from].links.indexOf(to) > -1) return;

    map.cells[from].links.push(to);
  }

  static setCellVisibilityByTag(map, tag, visibility)
  {
    for (var cell of map.cells)
    {
      if (MapCell.hasTag(cell, tag))
      {
        cell.visible = visibility;
      }
    }
  }

  static setCellVisibilityByName(map, name, visibility)
  {
    for (var cell of map.cells)
    {
      if (cell.name == name)
      {
        cell.visible = visibility;
        return;
      }
    }
  }

  static setCellHiddenByTag(map, tag, hidden)
  {
    for (let cell of map.cells)
    {
      if (MapCell.hasTag(cell, tag))
      {
        cell.hidden = hidden;
      }
    }
  }

  static setCellVisibilityAll(map, visibility)
  {
    for (var cell of map.cells)
    {
      cell.visible = visibility;
    }
  }

  static setCellHiddenAll(map, hidden)
  {
    for (var cell of map.cells)
    {
      cell.hidden = hidden;
    }
  }

  // style function accepts a context and modifies the stroke and line width of the context for the purpose of rendering the next cell
  static render(map, ctx, width, height)
  {
    //  Translate to centre of screen
    // Render each cell and it's half-connections if they're in range of the map centre and width

    for (let cell of map.cells)
    {
      ctx.save();
      {
        ctx.translate(width / 2 - map.centre.x, height / 2 - map.centre.y);

        ctx.save();
        {
          MiniMap.renderCell(map, ctx, cell);
        }
        ctx.restore();
        // Render cell connections
        for (let conIdx of cell.links)
        {
          let con = map.cells[conIdx];
          if (!con) continue;

          ctx.save();
          {
            MiniMap.renderPath(map, ctx, cell, con);
          }
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  static renderCell(map, ctx, cell)
  {
    if (map.customRenderCell)
    {
      map.customRenderCell(ctx, cell);
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


    if (MapCell.hasTag(cell, 'goal'))
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

  static renderPath(map, ctx, fromCell, toCell)
  {
    if (map.customRenderPath)
    {
      map.customRenderPath(ctx, fromCell, toCell);
      return;
    }

    if (!fromCell.visible) return;
    if (toCell.hidden) return;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    //let midPoint = toCell.position.subtract(fromCell.position).divide(2).add(fromCell.position);

    let midPoint = {
      x: (toCell.position.x - fromCell.position.x) / 2 + fromCell.position.x,
      y: (toCell.position.y - fromCell.position.y) / 2 + fromCell.position.y
    };

    ctx.beginPath();
    {
      ctx.moveTo(fromCell.position.x, fromCell.position.y);
      ctx.lineTo(midPoint.x, midPoint.y);
      ctx.closePath();
      ctx.stroke();
    }
  }
};
