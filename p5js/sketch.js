
//Essentials that we need across the scope
let squares = [];
let backgroundColor = 0;

let jsonResponse;
async function preload()
{
  const enrichmentURL = "enrichment_url";
  //ok so we're gonna do some nonsense
  // 1. get the initial ping that shows us how many there are
  // 2. get a random one of many
  // 3. filter down to the ones with enrichment urls
  // 4. filter *further* into the ones that have color palettes

  // 1. get the initial ping that shows us how many there are
  // const initialPing = await fetch("https://api.smk.dk/api/v1/art/search/?keys=*&offset=0&rows=1");
  // await new Promise((resolve) => {
  //   setTimeout(() => {}, 2000);
  // });
  // let totalCount = initialPing.json().found;
  // let randomOffset = min(totalCount-2000, max(0,floor(random() * totalCount)));

  // // 2. get a random one of many
  // const randomSurvey = await fetch(`https://api.smk.dk/api/v1/art/search/?keys=*&offset=${randomOffset}&rows=2000`);
  // await new Promise((resolve) => {
  //   setTimeout(() => {}, 2000);
  // });
  // // 3. filter down to the ones with enrichment urls
  // let surveyedItems = randomSurvey.json().items;
  // let enrichmentItems = surveyedItems.filter( (object) => object.hasOwnProperty(enrichmentURL));
  // console.log(enrichmentItems);


  jsonResponse = await fetch("https://enrichment.api.smk.dk/api/enrichment/KMS1?lang=en");
  jsonResponse = await jsonResponse.json();
}

async function setup() 
{
  createCanvas(windowWidth,windowHeight);

  //Take extractor data for color data
  let extractor = jsonResponse.filter( (object) => object.type == "colorextractor");
  if (extractor.length < 0){
    return;
  }

  squares = PaletteSquares(extractor[0].data);
  
  frameRate(60);
}

function windowResized(){
  setup();
}

//Draw will be used to call update and draw on the objects we need
function draw() {
  background(backgroundColor);
  
  squares.map( (square) => {
    square.Update();
    square.Draw();
  });
  
}

//This function takes the data from the colorextractor features of the SMK enrichment API
//And processes it into a set of palette distributions that can be use to draw the squares on the screen
function PaletteSquares(extractorData){

  let squares = [];

  //Set the background color
  let colorData = extractorData;
  backgroundColor = colorData.bg_color_s; //background_color_suggested, in the standard api this is suggested background color

  //Create the palette dictionary with counts
  let paletteDictionary = {};
  colorData.colors_palette?.map( (colorString) => {
    paletteDictionary[colorString] = 0;
  });

  //Increment the counts into the dictionary and create
  let totalCount = 0;
  let weightedPaletteStrings = colorData.colors_palette_weighted_s.split(' ');
  weightedPaletteStrings.forEach( (colorString, i) =>{
    paletteDictionary[colorString] += 1;
    totalCount++;
  });

  //Set all the essential values that we need
  let paletteKeys = Object.keys(paletteDictionary);
  let totalSizeRatio = .68;
  let startingAnchor = .16;
  let cornerPositionX = width*startingAnchor;
  let anchor = startingAnchor;
  let buffer = .01; //1% buffers between segments
  let bufferSpace = paletteKeys.length * buffer;
  let availableSizeRatio = totalSizeRatio - bufferSpace; //should be reduced somewhat
  
  //for each of the keys, we create a new entry
  paletteKeys.forEach( (key,i) => {
    //determine how much of the available size we should use 
    let h = paletteDictionary[key] / totalCount * availableSizeRatio;

    squares.push(new Square(
      cornerPositionX,    //left position
      height * anchor,    //top positoin
      width * (.68),      //horizontal size
      height*h,           //height from ratio
      key,                //the color
      i * 10              //time delay
    ));
    
    anchor = anchor + h + buffer;
  });

  return squares;
}

//Squares have are deferred into two parts that update
//What would be good is to apply actions to objects rather than... the objects housing the actions.
/*

function AnimationIn(Object O){
  //the animation in
}

this is what we should do

and then the animator itself holds those.

Instead this square has tons of details about its motion that it doesn't need.
*/
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