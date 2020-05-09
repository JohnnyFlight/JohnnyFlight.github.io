class InputManager
{
  constructor()
  {
    this.keys = {};
  }

  OnKeyDown(e)
  {
    this.keys[e.key] = true;
  }

  OnKeyPress(e)
  {

  }

  OnKeyUp(e)
  {
    this.keys[e.key] = false;
  }
}
