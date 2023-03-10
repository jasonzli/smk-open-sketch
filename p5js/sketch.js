
/*
  Make sure that the palette object looks like the following

*/
let jsonResponse = 
    {
      //Colors are in fucking Hex because God Himself hates you and you gon' learn today what 00->FF looks like
      "colorPalete" : [
        "#446644",
        "#66CC33"
      ],
      //Distribution of color is not distributed like percentages but is instead a deck of cards
      "colorDistribution": [

      ]
    };

function preload(){
  //assume some osrt of preload occurs here

}
let square;
function setup() 
{
  createCanvas(windowWidth,windowHeight);

  //Need to investigate this later.
  //Move();

  let heights = [];
  let rectSizes = .68;
  while(rectSizes > 0){
    let size = rand(rectSiz);
    if (rectSizes - size > 0){
      heights.add(size);
      rectSizes = rectSizes - size;
    }
    if(heights.length > 4){
      heights.add(rectSizes);
      rectSizes = -1;
    }
  }

  let squares = [];

  for(let i = 0; i < heights.length; i++){
    squares.add(
      new Square(
        width*.16, 
        height*.16, 
        width*.68,
        height*heights[i],
        "#BBAAFF",
        0)
    );
  }
  
  square = new Square(
    width*.16, 
    height*.16, 
    width*.68,
    height*.68,
    "#BBAAFF",
    0);

  frameRate(60);
}
function windowResized(){
  setup();
}
//Draw will be used to call update and draw on the objects we need
function draw() {
  background(220);
  square.Update();
  square.Draw();
}



class Square{
  constructor(targetX, targetY, w, h, col, tOffset = 0)
  {
    this.xOffScreenStart = -h*1.5; // 1.5x widths off?
    this.yOffScreenStart = 0; //not used
    this.xOffScreenEnd = width;
    this.targetX = targetX; 
    this.targetY = targetY; 
    this.x = this.xOffScreenStart;
    this.y = this.targetY;
    this.w = w;
    this.h = h;
    this.color = col;
    this.speed = 10; // canvas ratio 
    this.t = 0 - tOffset; //time count, NOTE THAT THIS IS NEGATIVE
    this.animationTime = 210; // 3.5 seconds 1 + 2 + .5
  }

  //A cube has a really simple movement
  Update()
  {
    //move into position over time, and then slide out after waiting.
    //let's say we do this over 
    //first section
    if(this.t <= 60){
      this.SlideIn(this.t/60);
    }

    if(this.t > 60 && this.t <= 180){
      //do nothing
    }

    if(this.t > 180 && this.t <= 210){
      this.SlideOut((this.t-180) / 30);
    }

    //increment t
    this.t = (this.t + 1) % this.animationTime;
  }

  SlideIn(increment)
  {
    //increment is between 0 and 1;
    let interp = sin(increment*PI - PI*.5)*.5 + .5;
    this.x = lerp(this.xOffScreenStart,this.targetX,interp);
  }

  SlideOut(increment)
  {
    //increment is between 0 and 1;
    let interp = sin(increment*PI - PI*.5)*.5 + .5;
    this.x = lerp(this.targetX,this.xOffScreenEnd,interp);
  }

  Draw()
  {
    push();
    noStroke();
    fill(this.color);
    translate(this.x,this.y);
    rect(0,0,this.w,this.h);
    pop();
  }


}


//Need to now create a set of cubes that match the height. 
async function Move(){
  await new Promise(() => {setTimeout(0,10)});
  console.log("hello");
}

//This needs to produce two json objects separately
function CreateRandomColorObject(){
  //return a brand new color object
  function CreateColorPalette(){

  }

  //split it into 100 or so, return a new object
  function DistributeColor(colorPaletteObject){

  }
}
