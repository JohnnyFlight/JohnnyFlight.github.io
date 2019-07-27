let map;
let can;
let selectedCellIdx = -1;
let pathCellIdx = -1;
let prevPosition = {};

// Define editor states here
const EditorState_Default = 'default';
const EditorState_PlaceCell = 'placeCell';
const EditorState_LinkCell = 'linkCell';
const EditorState_MoveCell = 'moveCell';
const EditorState_DeleteCell = 'deleteCell';
const EditorState_RemoveLinkCell = 'removeLinkCell';
const EditorState_PathCell = 'pathCell';

let editorDragging = false;

let editorState = EditorState_Default;

window.onload = () => {
  if (localStorage.map)
  {
    LoadFromLocalStorage();
  }
  else {
    map = new MiniMap();

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

  document.getElementById('includeEvents').onchange = Autosave;
  document.getElementById('includeMap').onchange = Autosave;
  document.getElementById('includeEventNavigation').onchange = Autosave;
  document.getElementById('includeMapReveal').onchange = Autosave;

  document.getElementById('cellX').onchange = Autosave;
  document.getElementById('cellY').onchange = Autosave;

  document.getElementById('gridX').onchange = Autosave;
  document.getElementById('gridY').onchange = Autosave;

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

  document.getElementById('exportTweego').onclick = ExportTweego;
  document.getElementById('exportJSON').onclick = ExportJSON;
  document.getElementById('importJSON').onclick = ImportJSON;

  document.getElementById('saveCell').onclick = SaveCellDetails;

  document.getElementById('snapGrid').onchange = () => {
    RenderMap();
    Autosave();
  };

  document.getElementById('gridX').onchange = RenderMap;
  document.getElementById('gridY').onchange = RenderMap;
}

function CustomCellRender(ctx, cell)
{
  let cellIdx = MiniMap.getCellIndexByName(map, cell.name);
  if (cellIdx == selectedCellIdx)
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

      if (selectedCellIdx > -1 && pathCellIdx > -1)
      {
        if (map.paths[selectedCellIdx][pathCellIdx] == map.paths[selectedCellIdx][cellIdx] + map.paths[cellIdx][pathCellIdx])
        {
          ctx.fillStyle = 'darkgreen';
          ctx.fill();
        }
      }
    }
    ctx.closePath();

    let distance = '';
    let idx = MiniMap.getCellIndexByName(map, cell.name);
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
  if (MiniMap.getCellIndexByName(map, 'Start') == -1)
  {
    alert('No Start passage found (case sensitive)');
    return;
  }

  let includeMap = document.getElementById('includeMap').checked;
  let includeEvents = document.getElementById('includeEvents').checked;
  let includeEventNavigation = document.getElementById('includeEventNavigation').checked;
  let includeMapReveal = document.getElementById('includeMapReveal').checked;

  // Need this boilerplate so Tweego can compile from export
  let output = `:: StoryTitle
${document.getElementById('storyTitle').value}

:: StorySettings
ifid:Map Export

:: StoryInit
<<script>>
${printMapCode()}
${MiniMap.generateInitCode(map, includeMapReveal)}

State.variables.map = map;

// Allows user to include their own init function without modifying the exported code
if (window.StoryInit) StoryInit();
<</script>>

:: PassageDone

:: StoryCaption
${includeMap ? '<canvas id="canvas" width="200" height="200"></canvas>' : ''}
${includeMap ? '<<script>>RenderMap();<</script>>' : ''}\n\n`;

  for (let cell of map.cells)
  {
    output += `:: ${cell.name} [ ${cell.tags.toString()} ]
${includeMap ? '<<set $mapName to "' + cell.name + '">>' : ''}
${includeMapReveal ? '<<print MiniMap.setCellVisibilityByName($map, "' + cell.name + '", true)>>' : ''}

${includeEvents ? '<<print GetEventsForScene("' + cell.name + '")>>' : ''}

${cell.flavourText || ''}\n\n`;

    if (!includeEventNavigation)
    {
      for (let linkIdx of cell.links)
      {
        let link = map.cells[linkIdx];

        output += `[[${link.name}]]\n`;
      }

      output += '\n\n';
    }
  }

  if (includeEventNavigation)
  {
    output += `:: EventNavigation [ script ]
    ${printEventCode()}

State.variables.events = State.variables.events || [];\n\n`;
    for (let cell of map.cells)
    {
      /*output += `State.variables.events.push(new StoryEvent("${cell.name} Navigation",
    [${ cell.links.map((x) => `"${map.cells[x].name}"`).join(', ') }],
    (scene) =>
    {
      return EventPassage('${cell.name}', '${cell.name}');
    }));\n\n`;*/
    let idx = parseInt(MiniMap.getCellIndexByName(map, cell.name));
    console.log(idx);
      output += `State.variables.events.push(new StoryEvent("${cell.name} Navigation",
    [${ map.cells.filter((x) => x.links.indexOf(idx) > -1).map((x) => `"${x.name}"`).join(', ') }],
    (scene) =>
    {
      return EventPassage('${cell.name}', '${cell.name}');
    }));\n\n`;
    }
  }

  document.getElementById('export').value = output;
}

function ExportJSON()
{
  document.getElementById('export').value = JSON.stringify(map);
}

function ImportJSON()
{
  map = Object.assign(new MiniMap(), JSON.parse(document.getElementById('export').value));
  map.customRenderCell = CustomCellRender;
  console.log(map);
  RenderMap();
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

  window.MapCell = MapCell;
  window.MiniMap = MiniMap;

  window.RenderMap = () =>
  {
    let can = document.getElementById('canvas');

    let map = State.variables.map;
    MiniMap.centreCellWithName(map, State.variables.mapName);

    if (!can) return;
    let ctx = can.getContext('2d');

  	ctx.fillStyle = 'white';
  	ctx.fillRect(0, 0, can.width, can.height);

    MiniMap.render(map, ctx, can.width, can.height);
  }`;

  return output;
}

function printEventCode()
{
  let output = `function EventHint(description)
{
	return {
		success: false,
		description: description,
		showMessage: (description ? true : false)
	};
}

function EventPassage(passageName, description)
{
	return {
		success: true,
		passageName: passageName,
		description: description
	};
}

window.EventHint = EventHint;
window.EventPassage = EventPassage;

class StoryEvent
{
	constructor(name, scenes = [], criteriaFunction, priority = 0)
	{
		this.name = name;
		// Note: Scenes are separate from criteria function for filtering  / performance purposes
		// TODO: Create map of scenes with all applicable events on load
		this.scenes = scenes;

		// TODO: Criteria objects like MSON?
		// Criteria function returns a CriteriaResult detailing if the criteria was met and either the passage name or a message
		this.criteriaFunction = criteriaFunction;
		this.priority = priority;
	}

	hasScene(scene)
	{
		return this.scenes.indexOf(scene) >= 0;
	}
};

window.StoryEvent = StoryEvent;

State.variables.eventHasScene = (event, scene) =>
{
		return event.scenes.indexOf(scene) >= 0;
	}

State.variables.events = [];

function GetEventsForScene(scene)
{
	let priority = 0;
	let output = '';
	for (let event of State.variables.events)
	{
		if (State.variables.eventHasScene(event, scene))
		{
			console.log(event);
			let passage = event.criteriaFunction(scene);
			if (!passage) continue;

			if (event.priority > priority)
			{
				// Remove lower-priority events
				output = '';
				priority = event.priority;
			}
			else if (event.priority < priority) continue;

			if (passage.success)
			{
				output += '[[' + passage.description + '|' + passage.passageName + ']]\\n';
			}
			else if (passage.showMessage)
			{
				output += passage.description + '\\n';
			}
		}
	}

	if (!output)
	{
		output = 'No Events';
	}

	return output;
}

window.GetEventsForScene = GetEventsForScene;`;

  return output;
}

function Autosave()
{
  SaveCellDetails();
  SaveToLocalStorage();
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
      snapToGrid: document.getElementById('snapGrid').checked,
      cellSize: {
        x: document.getElementById('defaultCellSizeX').value,
        y: document.getElementById('defaultCellSizeY').value
      },
      gridSize: {
        x: document.getElementById('gridX').value,
        y: document.getElementById('gridY').value
      }
    },
    exportSettings: {
      includeEvents: document.getElementById('includeEvents').checked,
      includeMap: document.getElementById('includeMap').checked,
      includeEventNavigation: document.getElementById('includeEventNavigation').checked,
      includeMapReveal: document.getElementById('includeMapReveal').checked
    }
  });
}

function LoadFromLocalStorage()
{
  let load = JSON.parse(localStorage.map);
  map = Object.assign(new MiniMap(), load.map);

  document.getElementById('storyTitle').value = load.title;

  document.getElementById('defaultCellSizeX').value = load.defaults.cellSize.x;
  document.getElementById('defaultCellSizeY').value = load.defaults.cellSize.y;

  document.getElementById('snapGrid').checked = load.defaults.snapToGrid;

  document.getElementById('gridX').value = load.defaults.gridSize.x;
  document.getElementById('gridY').value = load.defaults.gridSize.y;

  document.getElementById('includeEvents').checked = load.exportSettings.includeEvents;
  document.getElementById('includeMap').checked = load.exportSettings.includeMap;
  document.getElementById('includeEventNavigation').checked = load.exportSettings.includeEventNavigation;
  document.getElementById('includeMapReveal').checked = load.exportSettings.includeMapReveal;

  for (let cell in map.cells)
  {
    map.cells[cell] = Object.assign(new MapCell(), map.cells[cell]);

    // This is a fudge because I cba to sort out the string links thing
    for (let link in map.cells[cell].links)
    {
      // Turns links into a set to make unique
      map.cells[cell].links = Array.from(new Set(map.cells[cell].links.map((x) => parseInt(x))));
    }
  }
}

function MapClick(evt)
{
  let pos = new Vector2(evt.offsetX - can.width / 2 + map.centre.x, evt.offsetY - can.height / 2 + map.centre.y);
  let idx = MiniMap.getCellIndexAtPoint(map, pos.x, pos.y);

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

      MiniMap.linkCells(map, selectedCellIdx, idx);
      if (!(document.getElementById('oneWayLink').checked))
        MiniMap.linkCells(map, idx, selectedCellIdx);

      MiniMap.bakePaths(map);

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

      MiniMap.bakePaths(map);

      MiniMap.removeCellByIndex(map, idx);
      ChangeState(EditorState_Default);
      break;
    case EditorState_RemoveLinkCell:
      if (selectedCellIdx < 0 || selectedCellIdx == idx) break;

      MapCell.removeCellIndex(map.cells[selectedCellIdx], idx);

      MiniMap.bakePaths(map);

      ChangeState(EditorState_Default);
      break;
    case EditorState_PathCell:
      if (idx == -1) break;
      pathCellIdx = idx;

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
    case 'y':
      ChangeState(EditorState_PathCell);
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
  while (MiniMap.getCellByName(map, 'Cell ' + i))
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
  MiniMap.render(map, ctx, can.width, can.height);
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
