//most visited locations
MATCH (p:Person)-[v:VISITED]->(l:Location)
RETURN l.address, l.type, count(v) AS visitCount
ORDER BY visitCount DESC

//most visted in 2023
MATCH (p:Person)-[v:VISITED]->(l:Location)
WHERE v.startTimestamp >= datetime('2023-01-01T00:00:00Z') AND v.endTimestamp <= datetime('2023-12-31T23:59:59Z')
RETURN l.address, l.type, count(v) AS visitCount
ORDER BY visitCount DESC