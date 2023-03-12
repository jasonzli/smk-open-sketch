
//Essentials that we need across the scope
let squares = [];
let backgroundColor = 0;
let chosenItem = 0;
const REQUEST_SIZE = 2000;

let jsonResponse;
let pingedResponse;
let loaded = false;

async function loadSMKAPI()
{
  //ok so we're gonna do some nonsense
  // 1. get the initial ping that shows us how many there are
  // 2. get a random one of many
  // 3. filter down to the ones with enrichment urls
  // 4. filter *further* into the ones that have color palettes

  console.log("Beginning loading");
  //1. get the initial ping that shows us how many there are
  const initialPing = await fetch("https://api.smk.dk/api/v1/art/search/?keys=*&offset=0&rows=1");
  let pingResults = await initialPing.json();

  let totalCount = pingResults.found;
  let randomOffset = await min(totalCount-2000, max(0,floor(random() * totalCount)));
  console.log(totalCount);

  // 2. get a random one of many
  console.log("Starting to get all random urls...");
  const randomSurvey = await fetch(`https://api.smk.dk/api/v1/art/search/?keys=*&offset=${randomOffset}&rows=${REQUEST_SIZE}`);
  let surveyResults = await randomSurvey.json();
  console.log(surveyResults);

  // 3. filter down to the ones with enrichment urls
  let surveyItems = surveyResults.items;
  
  // 3b. confirm enrichment urls
  const ENRICHMENT_URL = "enrichment_url";
  let enrichmentItems = surveyItems.filter( (object) => !object.hasOwnProperty('part_of') && object.hasOwnProperty(ENRICHMENT_URL));

  // 3b. split into chunks
  const chunkSize = 50;
  let enrichmentChunks = [];
  for (let i = 0; i < enrichmentItems.length; i += chunkSize) {
      const chunk = enrichmentItems
                      .slice(i, i + chunkSize)
                      .map((item) => {
                        return item.enrichment_url;
                      });
      enrichmentChunks.push(chunk);
  }
  console.log("Hit all random URLs");

  console.log("Pinging enrichment...");
  //Ping all the urls and get the response. yes this is a mess
  for(let i = 0; i < enrichmentChunks.length; i++){
    //await new Promise(resolve => setTimeout(resolve, 125));
    enrichmentChunks[i] = await Promise.all( 
      enrichmentChunks[i].map ( 
        async (url) => 
          {
            return await fetch(url)
              .then(async (response) => 
                  {
                    if (response.ok){
                      return await response.json();
                    }
                    throw new Error(`Some error occurred with ${response.url}`);
                  })
              .catch((error) => console.log(error)) 
          }
      )
    );
  }

  console.log("Filtering results...");
  //Add all enrichments into the items array after clearing space for it.
  enrichmentItems = [];
  for(let i = 0; i < enrichmentChunks.length; i++){
    enrichmentChunks[i].map( (enrichmentResponse) => {
      //sometimes the extractors are not in the same order...
      //and sometimes there are overlaps
      //we have to make sure we have the color extractor
      if (enrichmentResponse == undefined) return;

      let colorExtractor = enrichmentResponse.filter((object) => object.type == 'colorextractor')[0];
      
      //confirm that the data exists as we need
      let colorDataExists = 
        colorExtractor.data.hasOwnProperty("colors_palette") &&
        colorExtractor.data.hasOwnProperty("colors_palette_weighted_s") &&
        colorExtractor.data.hasOwnProperty("color_background_s") &&
        colorExtractor.data.hasOwnProperty("bg_color_s");
      
      //Push the data into the array
      if(colorDataExists){
        enrichmentItems.push(colorExtractor)
      }
    });
  }
  //Chunks has everything
  console.log(`Ping resulted in ${enrichmentItems.length} candidate urls`);

  //Finalize the items
  console.log(enrichmentItems);
  pingedResponse = enrichmentItems;

  //Standarized response
  jsonResponse = await fetch("https://enrichment.api.smk.dk/api/enrichment/KMS1?lang=en");
  jsonResponse = await jsonResponse.json();

  loaded = true;
}


async function setup() 
{
  createCanvas(windowWidth,windowHeight);
  frameRate(60);

  await loadSMKAPI();

  //Take extractor data for color data
  let extractor = pingedResponse;
  if (pingedResponse.length < 1){
    console.log(`Data is empty`);
    extractor = jsonResponse.filter( (object) => object.type == "colorextractor");
    pingedResponse = jsonResponse;
  }
 
  Reset();
}

function Reset(){
  SelectNewPainting();
}
function SelectNewPainting(){

  let newChoice = floor(random()*pingedResponse.length);
  while (newChoice == chosenItem){
    newChoice = floor(random()*pingedResponse.length);
  }
  chosenItem = newChoice;
  let chosenPalette = pingedResponse[chosenItem].data; //get the data from palette
  backgroundColor = chosenPalette.color_background_s;
  squares = PaletteSquares(chosenPalette);
  
  console.log(`Current item is: ${pingedResponse[chosenItem].id}`);
}

function windowResized(){
  if(loaded){
    createCanvas(windowWidth,windowHeight);
  }
}

function keyPressed(){
  if(loaded){
    if (keyCode == 32) // space
    {
      Reset();
    }
    if (keyCode == 83){
      console.log(`Current item is: ${pingedResponse[chosenItem].id}`);
    }
  }
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
function PaletteSquares(paletteData){

  let squares = [];

  //Set the background color
  let colorData = paletteData;

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