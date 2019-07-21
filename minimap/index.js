let map;
let can;
let selectedCellIdx = -1;
let prevPosition = {};

// Define editor states here
const EditorState_Default = 'default';
const EditorState_PlaceCell = 'placeCell';
const EditorState_LinkCell = 'linkCell';
const EditorState_MoveCell = 'moveCell';
const EditorState_DeleteCell = 'deleteCell';
const EditorState_RemoveLinkCell = 'removeLinkCell';

let editorDragging = false;

let editorState = EditorState_Default;

window.onload = () => {
  if (localStorage.map)
  {
    LoadFromLocalStorage();
  }
  else {
    map = new Map();

    map.cells.push(new MapCell(new Vector2(0, 0), 'Start', ['start']));
    document.getElementById('storyTitle').value = 'New Story';
  }

  SetupEventListeners();

  map.customRenderCell = CustomCellRender;

  can = document.getElementById('canvas');

  RenderMap();
};

function SetupEventListeners()
{
  // Canvas events
  document.getElementById('canvas').onclick = MapClick;
  document.getElementById('canvas').onmousedown = MapMouseDown;
  document.getElementById('canvas').onmouseup = MapMouseUp;
  document.getElementById('canvas').onmousemove = MapMouseMove;
  window.onkeyup = MapKeyPress;

  // Action buttons
  document.getElementById('placeCell').onclick = () =>
    ChangeState(EditorState_PlaceCell);
  document.getElementById('deleteCell').onclick = () =>
    ChangeState(EditorState_DeleteCell);

  // Cell properties
  document.getElementById('cellName').onchange = Autosave;

  document.getElementById('cellPosX').onchange = Autosave;
  document.getElementById('cellPosY').onchange = Autosave;

  document.getElementById('cellSizeX').onchange = Autosave;
  document.getElementById('cellSizeY').onchange = Autosave;

  document.getElementById('cellFlavour').onchange = Autosave;

  // Story properties
  document.getElementById('storyTitle').onchange = Autosave;

  document.getElementById('defaultCellSizeX').onchange = Autosave;
  document.getElementById('defaultCellSizeY').onchange = Autosave;

  document.getElementById('cellVisible').onchange = Autosave;
  document.getElementById('cellHidden').onchange = Autosave;

  document.getElementById('cellTags').onchange = Autosave;

  document.getElementById('linkCell').onclick = () =>
  {
    if (selectedCellIdx < 0) return;
    ChangeState(EditorState_LinkCell);
  }

  document.getElementById('removeLinkCell').onclick = () =>
  {
    if (selectedCellIdx < 0) return;
    ChangeState(EditorState_RemoveLinkCell);
  }

  document.getElementById('moveCell').onclick = () =>
  {
    if (selectedCellIdx < 0) return;
    ChangeState(EditorState_MoveCell);
  }

  document.getElementById('exportTweego').onclick = ExportTweego

  document.getElementById('saveCell').onclick = SaveCellDetails;

  document.getElementById('snapGrid').onchange = RenderMap;
  document.getElementById('gridX').onchange = RenderMap;
  document.getElementById('gridY').onchange = RenderMap;
}

function CustomCellRender(ctx, cell)
{
  if (map.getCellIndexByName(cell.name) == selectedCellIdx)
  {
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 4;
  }
  else
  {
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 2;
  }

  ctx.font = '20px Arial';

  // If cell is visible and in map size or connected to cell in map size
  if (!cell.visible)
  {
    ctx.setLineDash([10, 5]);
  };

  ctx.save();
  {
    ctx.translate(-cell.size.x / 2, -cell.size.y / 2);

    ctx.beginPath();
    {
      ctx.rect(cell.position.x, cell.position.y, cell.size.x, cell.size.y);
      ctx.stroke();
    }
    ctx.closePath();

    let distance = '';
    let idx = map.getCellIndexByName(cell.name);
    if (selectedCellIdx > -1 && (map.paths[selectedCellIdx] || []).length)
    {
      // NOTE: This is gonna be hella slow
      distance = '[' + (map.paths[selectedCellIdx][idx] || -1) + ']';
    }

    ctx.fillText(cell.name + `(${idx})` + distance, cell.position.x, cell.position.y);
  }
  ctx.restore();
}

function ExportTweego()
{
  if (map.getCellIndexByName('Start') == -1)
  {
    alert('No Start passage found (case sensitive)');
    return;
  }

  let includeMap = document.getElementById('includeMap').checked;
  let includeEvents = document.getElementById('includeEvents').checked;
  let includeMapReveal = document.getElementById('includeMapReveal').checked;

  // Need this boilerplate so Tweego can compile from export
  let output = `:: StoryTitle
${document.getElementById('storyTitle').value}

:: StorySettings
ifid:Map Export

:: StoryInit
<<script>>
${printMapCode()}
${map.generateInitCode(includeMapReveal)}

State.variables.map = map;
<</script>>

:: PassageDone

:: StoryCaption
${includeMap ? '<canvas id="canvas" width="200" height="200"></canvas>' : ''}
${includeMap ? '<<script>>State.variables.RenderMap();<</script>>' : ''}\n\n`;

  for (let cell of map.cells)
  {
    output += `:: ${cell.name} [ ${cell.tags.toString()} ]
${includeMap ? '<<set $mapName to "' + cell.name + '">>' : ''}
${includeMapReveal ? '<<print $map.setCellVisibilityByName("' + cell.name + '", true)>>' : ''}

${includeEvents ? '<<print $GetEventsForScene("' + cell.name + '")>>' : ''}

${cell.flavourText || ''}\n\n`;

    for (let linkIdx of cell.links)
    {
      let link = map.cells[linkIdx];

      output += `[[${link.name}]]\n`;
    }

    output += '\n\n';
  }

  document.getElementById('export').innerHTML = output;
}

function printMapCode()
{
  let output = `/*
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

    removeCellIndex(idx, shift = false)
    {
      // Remove index
      this.links = this.links.filter((x) => x != idx);

      // Adjust indexes
      this.links = this.links.map((x) => (shift && x > idx) ? x - 1 : x);
    }

    isPointInCell(x, y)
    {
      let halfSize = { x: this.size.x, y: this.size.y };
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
    constructor(centre = { x: 0, y: 0 })
    {
      this.centre = centre;
      this.cells = [];

      this.paths = [];
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
        cell.removeCellIndex(idx, true);
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

    getPathStep(fromIdx, toIdx)
    {
      if (!this.paths[fromIdx][toIdx]) return;

      let output = [];
      for (let link of this.cells[fromIdx].links)
      {
        if (this.paths[link][toIdx] < this.paths[fromIdx][toIdx])
        {
          output.push(link);
        }
      }

      return output;
    }

    bakePaths()
    {
      this.paths = [];

      // For each cell do flood fill to get links
      for (let i in this.cells)
      {
        i = parseInt(i);

        this.paths[i] = [];

        let openSet = [i];
        let closedSet = [];

        let curIdx;
        // Set distance of current cell to itself
        this.paths[i][i] = 0;

        do
        {
          curIdx = openSet.pop();

          // Put all adjacent links in the open set and calculate distance
          for (let link of this.cells[curIdx].links)
          {
            link = parseInt(link);

            if (closedSet.indexOf(link) > -1) continue;

            if (this.paths[i][link] == undefined)
            {
              this.paths[i][link] = this.paths[i][curIdx] + 1;
            }

            closedSet.push(curIdx);
            openSet.unshift(link);
          }

          closedSet.push(curIdx);
        }
        while (openSet.length);
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

  State.variables.RenderMap = () =>
  {
    let can = document.getElementById('canvas');

    let map = State.variables.map;
    map.centreCellWithName(State.variables.mapName);

    if (!can) return;
    let ctx = can.getContext('2d');

	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, can.width, can.height);

    map.render(ctx, can.width, can.height);
  }`;

  return output;
}

function Autosave()
{
  SaveCellDetails();
}

function SaveCellDetails()
{
  if (selectedCellIdx < 0) return;

  let cell = map.cells[selectedCellIdx];
  cell.name = document.getElementById('cellName').value;

  cell.position.x = parseFloat(document.getElementById('cellPosX').value);
  cell.position.y = parseFloat(document.getElementById('cellPosY').value);

  cell.size.x = parseFloat(document.getElementById('cellSizeX').value);
  cell.size.y = parseFloat(document.getElementById('cellSizeY').value);

  cell.visible = document.getElementById('cellVisible').checked;
  cell.hidden = document.getElementById('cellHidden').checked;

  cell.flavourText = document.getElementById('cellFlavour').value;

  cell.tags = document.getElementById('cellTags').value.split(',').map((val) => val.trim());

  RenderMap();

  SaveToLocalStorage();
}

function SaveToLocalStorage()
{
  localStorage.map = JSON.stringify({
    map: map,
    title: document.getElementById('storyTitle').value,
    defaults: {
      cellSize: {
        x: document.getElementById('defaultCellSizeX').value,
        y: document.getElementById('defaultCellSizeY').value
      }
    }
  });
}

function LoadFromLocalStorage()
{
  let load = JSON.parse(localStorage.map);
  map = Object.assign(new Map(), load.map);

  document.getElementById('storyTitle').value = load.title;

  document.getElementById('defaultCellSizeX').value = load.defaults.cellSize.x;
  document.getElementById('defaultCellSizeY').value = load.defaults.cellSize.y;

  for (let cell in map.cells)
  {
    map.cells[cell] = Object.assign(new MapCell(), map.cells[cell]);
  }
}

function MapClick(evt)
{
  let pos = new Vector2(evt.offsetX - can.width / 2 + map.centre.x, evt.offsetY - can.height / 2 + map.centre.y);
  let idx = map.getCellIndexAtPoint(pos.x, pos.y);

  switch (editorState)
  {
    case EditorState_Default:
      if (idx > -1)
      {
        printCell(map.cells[idx]);
        selectedCellIdx = idx;
      }
      break;
    case EditorState_PlaceCell:
      PlaceCell(pos);
      ChangeState(EditorState_Default);
      selectedCellIdx = map.cells.length - 1;
      printCell(map.cells[selectedCellIdx]);
      break;
    case EditorState_LinkCell:
      if (selectedCellIdx < 0 || selectedCellIdx == idx) break;

      map.linkCells(selectedCellIdx, idx);
      if (!(document.getElementById('oneWayLink').checked))
        map.linkCells(idx, selectedCellIdx);

      map.bakePaths();

      ChangeState(EditorState_Default);
      break;
    case EditorState_MoveCell:
      if (selectedCellIdx < 0) break;

      if (document.getElementById('snapGrid').checked)
      {
        map.cells[selectedCellIdx].position = SnapToGrid(pos);
      }
      else
      {
        map.cells[selectedCellIdx].position = pos;
      }
      printCell(map.cells[selectedCellIdx]);

      ChangeState(EditorState_Default);
      break;
    case EditorState_DeleteCell:
      if (idx == -1) break;

      if (idx == selectedCellIdx)
      {
        selectedCellIdx = -1;
      }

      map.bakePaths();

      map.removeCellByIndex(idx);
      ChangeState(EditorState_Default);
      break;
    case EditorState_RemoveLinkCell:
      if (selectedCellIdx < 0 || selectedCellIdx == idx) break;

      map.cells[selectedCellIdx].removeCellIndex(idx);

      map.bakePaths();

      ChangeState(EditorState_Default);
      break;
  }

  SaveToLocalStorage();

  RenderMap();
}

function MapMouseUp(evt)
{
  editorDragging = false;
}

function MapMouseDown(evt)
{
  editorDragging = true;
  prevPosition.x = evt.offsetX;
  prevPosition.y = evt.offsetY;
}

function MapMouseMove(evt)
{
  if (editorDragging)
  {
    map.centre.x -= evt.offsetX - prevPosition.x;
    map.centre.y -= evt.offsetY - prevPosition.y;

    prevPosition.x = evt.offsetX;
    prevPosition.y = evt.offsetY;

    RenderMap();
  }
}

function MapKeyPress(evt)
{
  switch (evt.key)
  {
    case 'q':
      ChangeState(EditorState_PlaceCell);
      break;
    case 'w':
      ChangeState(EditorState_DeleteCell);
      break;
    case 'e':
      ChangeState(EditorState_MoveCell);
      break;
    case 'r':
      ChangeState(EditorState_LinkCell);
      break;
    case 't':
      ChangeState(EditorState_RemoveLinkCell);
      break;
    case 'Escape':
      ChangeState(EditorState_Default);
      break;
  }
}

function SnapToGrid(pos)
{
  let gridX = document.getElementById('gridX').value;
  let gridY = document.getElementById('gridY').value;

  pos.x = Math.floor((pos.x + gridX / 2) / gridX) * gridX;
  pos.y = Math.floor((pos.y + gridY / 2) / gridY) * gridY;

  return pos;
}

function ChangeState(state)
{
  editorState = state;
  document.getElementById('editorState').innerText = state;
}

function PlaceCell(pos)
{
  let i = map.cells.length + 1;
  while (map.getCellByName('Cell ' + i))
  {
    ++i;
  }

  let cell = new MapCell(pos, 'Cell ' + i);
  cell.size.x = document.getElementById('defaultCellSizeX').value;
  cell.size.y = document.getElementById('defaultCellSizeY').value;

  if (document.getElementById('snapGrid').checked)
  {
    cell.position = SnapToGrid(cell.position);
  }

  map.cells.push(cell);
}

function RenderMap()
{
  let ctx = can.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, can.width, can.height);

  ctx.strokeStyle = 'lightgrey';

  // draw grid
  if (document.getElementById('snapGrid').checked)
  {
    let gridX = document.getElementById('gridX').value;
    let gridY = document.getElementById('gridY').value;

    let linesAcross = Math.ceil(can.width / gridX) + 2;
    let linesDown = Math.ceil(can.height / gridY) + 2;

    for (let i = 0; i < linesAcross; ++i)
    {
      ctx.beginPath();
      {
        ctx.moveTo((i - 1) * gridX - map.centre.x % gridX + gridX / 2, 0);
        ctx.lineTo((i - 1)  * gridX - map.centre.x % gridX + gridX / 2, can.height);
        ctx.stroke();
      }
      ctx.closePath();
    }

    for (let i = 0; i < linesDown; ++i)
    {
      ctx.beginPath();
      {
        ctx.moveTo(0, (i - 1)  * gridY - map.centre.y % gridY + gridY / 2);
        ctx.lineTo(can.width, (i - 1)  * gridY - map.centre.y % gridY + gridY / 2);
        ctx.stroke();
      }
      ctx.closePath();
    }
  }

  // draw map
  map.render(ctx, can.width, can.height);
}

function printCell(cell)
{
  document.getElementById('cellName').value = cell.name || 'No name';

  document.getElementById('cellPosX').value = `${cell.position.x}`
  document.getElementById('cellPosY').value = `${cell.position.y}`;

  document.getElementById('cellSizeX').value = `${cell.size.x}`
  document.getElementById('cellSizeY').value = `${cell.size.y}`;

  document.getElementById('cellVisible').checked = cell.visible;
  document.getElementById('cellHidden').checked = cell.hidden;

  document.getElementById('cellFlavour').value = cell.flavourText || '';

  document.getElementById('cellTags').value = cell.tags.join(', ') || '';
}
