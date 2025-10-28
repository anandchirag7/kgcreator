import { GoogleGenAI, Type } from '@google/genai';
import { fileToBase64 } from '../utils/fileUtils';
import { GraphData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

const KNOWLEDGE_GRAPH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      description: "List of all entities (nodes) in the knowledge graph.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "A unique identifier for the node (e.g., 'resistor_r1'). Should be concise and descriptive, in snake_case."
          },
          label: {
            type: Type.STRING,
            description: "The primary category or type of the entity (e.g., 'Component', 'Specification', 'Material'). Should be in PascalCase."
          },
          properties: {
            type: Type.OBJECT,
            description: "A key-value map of attributes for the node. All relevant data from the document should be captured here. For example, {'name': 'R1', 'value': '10kΩ', 'tolerance': '5%'}.",
          },
        },
        required: ["id", "label", "properties"],
      },
    },
    relationships: {
      type: Type.ARRAY,
      description: "List of all connections (relationships) between the entities.",
      items: {
        type: Type.OBJECT,
        properties: {
          source: {
            type: Type.STRING,
            description: "The 'id' of the source node for the relationship."
          },
          target: {
            type: Type.STRING,
            description: "The 'id' of the target node for the relationship."
          },
          type: {
            type: Type.STRING,
            description: "The type of the relationship, in uppercase snake_case (e.g., 'HAS_SPECIFICATION', 'MANUFACTURED_BY', 'PART_OF')."
          },
          properties: {
            type: Type.OBJECT,
            description: "A key-value map of attributes for the relationship, if any.",
          },
        },
        required: ["source", "target", "type"],
      },
    },
  },
  required: ["nodes", "relationships"],
};


export const extractKnowledgeGraph = async (files: File[]): Promise<GraphData> => {
  const prompt = `
    You are an expert system designed to extract structured information from technical documents about product parts.
    Your task is to analyze the provided document pages (as images or text) and construct a detailed knowledge graph.
    Identify all key entities (components, specifications, materials, manufacturers, part numbers, etc.) and the relationships between them.

    Output a JSON object that strictly adheres to the provided schema.
    - Every node must have a unique 'id', a 'label', and a 'properties' object. The 'id' should be a descriptive, concise, snake_case string. The 'label' should be in PascalCase.
    - Capture all relevant details in the 'properties' objects for both nodes and relationships.
    - Relationships must connect nodes using their 'id' values. The relationship 'type' must be in UPPERCASE_SNAKE_CASE.
    - Ensure the graph is comprehensive and accurately reflects the information in the document.
    - If no meaningful entities or relationships can be extracted, return an object with empty arrays for 'nodes' and 'relationships'.
  `;

  const imageParts = await Promise.all(
    files.filter(file => file.type.startsWith('image/')).map(async (file) => {
        const base64Data = await fileToBase64(file);
        return {
            inlineData: {
                data: base64Data,
                mimeType: file.type,
            },
        };
    })
  );

  const textParts = await Promise.all(
      files.filter(file => file.type.startsWith('text/')).map(async (file) => {
          const textContent = await file.text();
          return { text: `\n\n--- DOCUMENT CONTENT ---\n${textContent}` };
      })
  );

  if (imageParts.length === 0 && textParts.length === 0) {
      throw new Error("No valid document files provided. Please upload images or text files.");
  }

  const contents = [{ parts: [{ text: prompt }, ...textParts, ...imageParts] }];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
        responseMimeType: 'application/json',
        responseSchema: KNOWLEDGE_GRAPH_SCHEMA,
    },
  });
  
  const jsonString = response.text.trim();
  try {
    const graphData: GraphData = JSON.parse(jsonString);
    // Basic validation
    if (!graphData.nodes || !graphData.relationships) {
        throw new Error("The model returned data missing 'nodes' or 'relationships' properties.");
    }
    return graphData;
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", jsonString, e);
    throw new Error("The model returned an invalid data structure. Please try again.");
  }
};
