let square;
let squares = [];
let backgroundColor = 0;
function setup() 
{
  createCanvas(windowWidth,windowHeight);


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

  frameRate(60);
}


//Draw will be used to call update and draw on the objects we need
function draw() {
  background(backgroundColor);
  
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
    this.t = 0 - tOffset; //time count, NOTE THAT THIS IS MADE NEGATIVE
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

    translate(this.x,this.y);
    rect(0,0,this.w,this.h);
    pop();
  }

}