
import { GraphData, Node, Relationship } from '../types';

const formatProperties = (properties: Record<string, any>): string => {
  if (Object.keys(properties).length === 0) {
    return '';
  }
  const propsString = Object.entries(properties)
    .map(([key, value]) => {
      const formattedValue = typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}: ${formattedValue}`;
    })
    .join(', ');
  return `{${propsString}}`;
};

export const generateCypherQuery = (graphData: GraphData): string => {
  const nodeQueries = graphData.nodes.map((node: Node) => {
    const properties = formatProperties({ ...node.properties, id: node.id });
    return `MERGE (n:${node.label} ${properties})`;
  });

  const relationshipQueries = graphData.relationships.map((rel: Relationship) => {
    // Find the source and target nodes from the graphData to get their labels
    const sourceNode = graphData.nodes.find(n => n.id === rel.source);
    const targetNode = graphData.nodes.find(n => n.id === rel.target);

    if (!sourceNode || !targetNode) {
        console.warn(`Skipping relationship due to missing node: ${rel.source} -> ${rel.target}`);
        return `// WARNING: Could not create relationship for missing node: ${rel.source} -> ${rel.target}`;
    }

    const relProperties = formatProperties(rel.properties);
    const sourceProps = formatProperties({id: sourceNode.id});
    const targetProps = formatProperties({id: targetNode.id});

    return `
MATCH (a:${sourceNode.label} ${sourceProps}), (b:${targetNode.label} ${targetProps})
MERGE (a)-[r:${rel.type} ${relProperties}]->(b)`;
  });

  return `// Generated Cypher Query
// 1. Create Nodes
${nodeQueries.join('\n')}

// 2. Create Relationships
${relationshipQueries.join('\n')}
`;
};
