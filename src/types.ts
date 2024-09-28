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
