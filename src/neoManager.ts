
import neo4j from "neo4j-driver";
// import { visited } from "./types.ts"

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

let errorCount = 0;

const CONNECTION_STRING = `bolt://${process.env.DOCKER_HOST}:7687`;

let driver: any;

const runCypher = async (cypher: string, session: any) => {
    // console.log(cypher)
    try {
        const result = await session.run(cypher);
        return result;
    } catch (error: any) {
        if (error.code !== "Neo.ClientError.Schema.ConstraintValidationFailed" && error.code !== "Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists") {
            console.error(error);
        }
    }
}

const runCypherWithParams = async (cypher: string, session: any, params?: Record<string, any>) => {
    // console.log(cypher);
    try {
        const result = await session.run(cypher, params);
        return result;
    } catch (error: any) {
        if (error.code !== "Neo.ClientError.Schema.ConstraintValidationFailed" && error.code !== "Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists") {
            throw error
        } else {
            // logger.trace(error);
        }
    }
}


export const setupNeo = async () => {
    driver = neo4j.driver(CONNECTION_STRING, neo4j.auth.basic(process.env.NEO4J_USER || '', process.env.NEO4J_PASSWORD || ''));
    const session = driver.session();

    try {
        await runCypher(`CREATE CONSTRAINT IF NOT EXISTS FOR (e:Person) REQUIRE (e.name) IS UNIQUE`, session);
        await runCypher(`CREATE CONSTRAINT IF NOT EXISTS FOR (e:Location) REQUIRE (e.placeId) IS UNIQUE`, session);
        await runCypher(`CREATE CONSTRAINT IF NOT EXISTS FOR (e:Location) REQUIRE (e.address) IS UNIQUE`, session);
    } catch (error) {
        //contraint already exists so proceed
    } finally {
        session.close();
    }

    console.log(`NEO URL ${CONNECTION_STRING + process.env.NEO4J_USER + " " + process.env.NEO4J_PASSWORD}`);
}


export const createVistedRelationship = async (data: visited) => {

    const { person, visited, place } = data;

    const placeType = place.type;

    let combinedCypher = `
    MERGE (person:Person { Name: $personName })`;

    if (placeType === "HOME") {
        combinedCypher += `
        MERGE (location:Home { placeId: $placeId })
        SET 
            location.address = $address,
            location.type = $type 
        MERGE (person)-[:VISITED { startTimestamp: datetime($startTimestamp), endTimestamp: datetime($endTimestamp) }]->(location)
        `;
    } else {
        combinedCypher += `
        MERGE (location:Location { placeId: $placeId })
        SET 
            location.address = $address,
            location.type = $type 
        MERGE (person)-[:VISITED { startTimestamp: datetime($startTimestamp), endTimestamp: datetime($endTimestamp) }]->(location)
        `;
    }

    const params = {
        personName: person.name,
        placeId: place.placeId,
        address: place.address,
        type: place.type,
        startTimestamp: visited.startTimestamp,
        endTimestamp: visited.endTimestamp,
    };

    const session = driver.session();
    try {
        const result = await runCypherWithParams(combinedCypher, session, params);
        // console.log(combinedCypher);
    } catch (err) {        
        errorCount++;
        console.error(`Error #${console.error(err.message, params)}`, err.message, params)
    } finally {
        await session.close();
    }
};