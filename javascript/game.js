function Level(plan)
{
  this.width = plan[0].length;
  this.height = plan.length;

  this.grid = [];
  //loop through each row in plan, creating an array in grid
  //height
  for (var y = 0; y < this.height; y++)
  {
    var line = plan[y], gridLine = [];
    //loop through each array elementin the inner array for the type of tile
    //width
    for( var x = 0; x < this.width; x++)
    {
      //get the type from the character in the string.  It can be
      // 'x' , '!', or ' '
      // if the character is  ' '
      var ch = line[x], fieldType = null;

      if (ch == 'x')
      {
        fieldType = 'wall';
      }
      else if (ch == '!')
      {
        fieldType = 'lava';
      }
      else if (ch == 'y')
      {
        fieldType = 'floater';
      }
      else if (ch == '@')
      {
        //fieldType = 'user';
        this.user = new User(new Vector(x,y));
      }
      else if (ch == 'o')
      {
        fieldType = 'coin';
      }
      // push the fieldType into the gridLine array (at the end)
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }
}


function Vector(x, y)
{
  this.x = x;
  this.y = y;
}

//vector arithmetic: v_1 + v_2 = <x,y> + <a,b> = <x,a>, <y,b>
Vector.prototype.plus = function(other)
{
    var addVector = new Vector();
    addVector.x = this.x + other.x;
    addVector.y = this.y + other.y;
    return addVector;
};
//vector arithmetic: v_1 * factor = <x,y> * factor = <x * factor, y*factor>
Vector.prototype.times = function(factor)
{
  return new Vector(this.x * factor, this.y * factor);
};

//A player has a size, speed and position
function User(pos)
{
  this.pos = pos.plus(new Vector(0, -1.0));
  this.size = new Vector(0.8, 1.0);
  this.speed = new Vector(0,0);
}
User.prototype.type = 'user';

//helper function to easily create an element of a type provided
//and assign a class to it
function elt(name, className)
{
    var elt = document.createElement(name);
    if (className)
    {
        elt.className = className;
    }
    return elt;
}

//main display class.  We keep track of the scroll window using it.
function DOMDisplay(parent, level)
{
  //this.wrap correspoints to a div created with class of 'game'
  this.wrap = parent.appendChild(elt('div', 'game'));
  this.level = level;

  //in this version, we only have a static background.
  this.wrap.appendChild(this.drawBackground());

  //keep track of actors
  this.actorLayer = null;

  //update the world based on player position
  this.drawFrame();

}
//global
var scale = 20;

DOMDisplay.prototype.drawBackground = function()
{
    var table = elt('table', 'background');
    table.style.width = this.level.width * scale + 'px';

    //assign a class to new row element directly form the string
    //from each tile in grid
    for (var i = 0; i < this.level.grid.length; i++)
    {
      var rowElt = table.appendChild(elt('tr'));
      rowElt.style.height = scale + 'px';
      for (var j = 0; j < this.level.grid[i].length; j++)
      {
        rowElt.appendChild(elt('td', this.level.grid[i][j]));
      }
    }
    return table;
};

//draw the player agent
DOMDisplay.prototype.drawUser = function ()
{
  //create a new container div for actor dom elements
  var wrap = elt('div');
  var actor = this.level.user;
  var rect = elt('div', 'actor user');
  rect = wrap.appendChild(rect);

  rect.style.width = actor.size.x * scale + 'px';
  rect.style.height = actor.size.y * scale + 'px';
  rect.style.left = actor.pos.x * scale + 'px';
  rect.style.right = actor.pos.y * scale + 'px';

  return wrap;
};

DOMDisplay.prototype.drawFrame = function()
{
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawUser());
  this.scrollUserIntoView();
};

DOMDisplay.prototype.scrollUserIntoView = function()
{
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;

  // We want to keep player at least 1/3 away from side of screen
  var margin = width / 3;

  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;

  var user = this.level.user;
  // Change coordinates from the source to our scaled.
  var center = user.pos.plus(user.size.times(0.5)).times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

Level.prototype.obstacleAt = function(pos,size)
{
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = (Math.ceil(pos.y + size.y));

  if(xStart < 0 || xEnd >this.width || yStart < 0 || yEnd > this.height)
    return 'wall';
  
  for(var y = yStart; y< yEnd; y++)
  {
    for(var x = xStart; x < xEnd; x++)
    {
      var fieldType = this.grid[y][x];
      if(fieldType)
      {
        return fieldType;
      }
    }
  }
};

// Update simulation each step based on keys & step size
Level.prototype.animate = function(step, keys)
{

  // Ensure each is maximum 100 milliseconds
  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
      this.user.act(thisStep, this, keys);
   // Do this by looping across the step size, subtracing either the
   // step itself or 100 milliseconds
    step -= thisStep;
  }
};

var maxStep = 0.05;

var userXSpeed = 7;

User.prototype.moveX = function(step, level, keys)
{
  this.speed.x = 0;
  if (keys.left) this.speed.x -= userXSpeed;
  if (keys.right) this.speed.x += userXSpeed;

  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if(obstacle != 'wall')
    this.pos = newPos;
};

var gravity = 30;
var jumpSpeed = 17;
var userYSpeed = 7;

User.prototype.moveY = function(step, level, keys)
{
  this.speed.y += step * gravity;
  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if(obstacle)
  {
  if (keys.up && this.speed.y > 0)
    this.speed.y = -jumpspeed;
  else
      this.speed.y = 0;
  }
  else
  {
    this.pos = newPos;
  }
};

User.prototype.act = function(step, level, keys)
{
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);
};

//arrow key codes for readability
var arrowCodes = {37: 'left', 38: 'up', 39: 'right', 40: 'down'};

//this assigns the object that will be updated anytime the player presses the arrow key
//var arrows = trackKeys(arrowCodes);

//translate the codes pressed from a key event
function trackKeys(codes)
{
  //var pressed = {};
  var pressed = Object.create(null);

  //alters the current 'pressed' array which is returned from this funcition.
  //The pressed variable persists even after this function terminates
  // That is why we needed to assign it using "Object.create()" as
  // otherwise it would be garbage collected
  function handler(event)
  {
    if(codes.hasOwnProperty(event.keyCode))
    {
      //if the event is keydown, set down to true, else set to false
      var down = event.type == 'keydown';
      pressed[codes[event.keyCode]] = down;

      //we dont want the key press to scroll the broswer window
      //this stops the event from continuing to be processed
      event.preventDefault();
      console.log(pressed);
      console.log(arrows);
    }
  }
  addEventListener('keydown', handler);
  addEventListener('keyup', handler);
  return pressed;
}

// frameFunc is a function called each frame with the parameter "step"
// step is the amount of time since the last call used for animation
function runAnimation(frameFunc)
{
  var lastTime = null;
  function frame(time)
  {
    var stop = false;
    if (lastTime != null)
    {
      // Set a maximum frame step of 100 milliseconds to prevent
      // having big jumps
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// This assigns the array that will be updated anytime the player
// presses an arrow key. We can access it from anywhere.
var arrows = trackKeys(arrowCodes);

// must use prototype if needing to change object type outside function
//draw player

function runLevel(level, Display)
{
  var display = new Display(document.body, level);

  runAnimation(function(step)
  {
    // Allow the viewer to scroll the level
    level.animate(step, arrows);
    display.drawFrame(step);
  });
  //display.actorLevel = display.wrap.append(display.drawUser());
}

function runGame(plans, Display){
  function startLevel(n)
  {
    //create an new level using the nth element in array plans
    runLevel(new Level(plans[n]), Display);
  }
  startLevel(0);
}
