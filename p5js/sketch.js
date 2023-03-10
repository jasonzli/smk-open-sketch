
function preload(){
  //assume some osrt of preload occurs here

}
let square;
let squares = [];
let backgroundColor = 0;
function setup() 
{
  createCanvas(windowWidth,windowHeight);

  console.log(exampleData[1]);
  //Need to investigate this later.
  //Move();

  squares = [];

  //Take extractor data for color data
  let extractor = exampleData.filter( (object) => object.type == "colorextractor");
  if (extractor.length < 0){
    //leave
  }

  //Set the background color
  let colorData = extractor[0].data;
  backgroundColor = colorData.bg_color_s; //background_color_suggested, in the standard api this is suggested background color

  //Create the palette data
  let paletteDictionary = {};
  colorData.colors_palette?.map( (colorString) => {
    paletteDictionary[colorString] = 0;
  });

  let totalCount = 0;
  let weightedPaletteStrings = colorData.colors_palette_weighted_s.split(' ');
  weightedPaletteStrings.forEach( (colorString, i) =>{
    paletteDictionary[colorString] += 1;
    totalCount++;
  });
  //let's do this simply first
  let paletteKeys = Object.keys(paletteDictionary);
  let totalSizeRatio = .68;
  let startingAnchor = .16;
  let cornerPositionX = width*startingAnchor;
  let anchor = startingAnchor;
  let buffer = .01;
  let bufferSpace = paletteKeys.length * buffer;
  let availableSizeRatio = totalSizeRatio - bufferSpace;
  
  //for each of the keys, we create a new entry
  paletteKeys.forEach( (key,i) => {
    let h = paletteDictionary[key] / totalCount * availableSizeRatio;
    squares.push(new Square(
      cornerPositionX,
      height * anchor,
      width * (.68),
      height*h,
      key,
      i * 10
    ));
    
    anchor = anchor + h + buffer;
  });


  
  //So now the palette dictionary and the totalCount gives us everything
/*
  let targetSize = .84;
  let startingSize = .16;
  let h = startingSize;
  let i = 0;

  
  while(h <= targetSize){
    
    //do a max and min to guarantee certain size constraint
    let randomSize =max(.02,  random(min(.3, targetSize - h)));

    //do a check if the *next* one is going to be too small, and consume it
    if ((targetSize - (h + randomSize)) < .05 ){
      randomSize = targetSize - h;
    }

    squares.push(new Square(
        width*.16,
        height*h,
        width*.68,
        height*randomSize,
        "#BBAAFF",
        10 * i
      )
    );
    i++;

    //that .01 is a good barrier
    h = h + randomSize + .01;
    
  }
*/
  frameRate(60);
}

function windowResized(){
  setup();
}

//Draw will be used to call update and draw on the objects we need
function draw() {
  background(backgroundColor);
  
  drawingContext.shadow
  squares.map( (square) => {
    square.Update();
    square.Draw();
  });
  
}



class Square{
  constructor(targetX, targetY, w, h, col, tOffset = 0)
  {
    this.xOffScreenStart = -width; // 1.5x widths off?
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
      this.SlideIn(max(this.t/60,0));
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

    // very optional shadow drawing, already weird practice with the offsets
    // drawingContext.shadowOffsetX = 0;
    // drawingContext.shadowOffsetY = 0;
    // drawingContext.shadowBlur = width*.01;//width*.02* ( .5 * sin(this.t/105*TWO_PI)+.5);
    // drawingContext.shadowColor = "black";
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
