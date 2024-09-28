import fs from 'fs';
import path from 'path';

// import { personNode, placeNode, visited, visitedRelationship } from "./src/types.ts"

export type personNode = {
  name: string;
}

export type placeNode = {
  placeId: string;
  address: string;
  type: string;
}

export type visitedRelationship = {
  startTimestamp: string;
  endTimestamp: string;
}

export type visited = {
  person: personNode;
  visited: visitedRelationship;
  place: placeNode;
}

import { createVistedRelationship, setupNeo } from "./src/neoManager.ts";

const ACTIVITY_KEY = "activitySegment"
const PLACES_KEY = "placeVisit"

export const rob: personNode = {
  name: "Rob"
}

const places: Array<visited> = [];

const createPlaceRelationship = (placesData): visited => {

  const person: personNode = rob;

  const visited: visitedRelationship = {
    startTimestamp: placesData.duration.startTimestamp,
    endTimestamp: placesData.duration.endTimestamp
  }

  const placeType = placesData.location.semanticType || "TYPE_UNKNOWN"

  const place: placeNode = {
    placeId: placesData.location.placeId,
    address: placesData.location.address || placesData.location.name,
    type: placeType.split("_")[1]
  }

  return { person, visited, place }

}

const processFiles = async (directoryPath: string) => {

  console.log("Processing files from ", directoryPath)
  
  try {
    const items = await fs.promises.readdir(directoryPath);

    for (const item of items) {
      const itemPath = path.join(directoryPath, item);
      const stat = await fs.promises.stat(itemPath);

      if (stat.isDirectory()) {
        // Recursively process the subdirectory
        await processFiles(itemPath);
      } else if (stat.isFile() && item.endsWith('.json')) {


        const data = await fs.promises.readFile(itemPath, 'utf8');
        const json = JSON.parse(data);

        json.timelineObjects.forEach((obj: any) => {
          Object.keys(obj).forEach((key: string) => {
            if (key === ACTIVITY_KEY) {
              //@ts-ignore
              // activities.push(obj[key]);
            } else if (key === PLACES_KEY) {
              //@ts-ignore
              places.push(createPlaceRelationship(obj[key]));
            } else {
              console.warn("Unexpected key ", key);
            }
          });
        });

      }
    }
    
  } catch (err) {
    console.error("Error reading directory or files:", err);
  }

}

const init = async () => {
  console.log("start");

  await setupNeo();

  const initPath = "C:/Users/rob/Downloads/takeout-20240928T074350Z-001/Takeout/Location History Timeline/Semantic Location History"

  await processFiles(initPath);

  // console.log(places.length);
  
  //@ts-ignore
  for (const place of places) {
    // console.log(">>>>> ", place);
    await createVistedRelationship(place);
  }


  console.log("Finished");

  //   const placeVisits = json.timelineObjects.filter(obj => obj.placeVisit);

  //   console.log(placeVisits); 
}

init();