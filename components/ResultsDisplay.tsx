import React, { useEffect, useRef, useState } from 'react';
import { GraphData } from '../types';
// D3 is loaded from a script tag in index.html, so we can use the global `d3` object.
declare const d3: any;

interface ResultsDisplayProps {
  graphData: GraphData;
  cypherQuery: string;
  onReset: () => void;
}

const GraphVisualization: React.FC<{ data: GraphData }> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        const width = svgRef.current.parentElement?.clientWidth || 800;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .style('max-width', '100%')
            .style('height', 'auto');
        
        svg.selectAll("*").remove();

        const links = data.relationships.map(d => ({ ...d }));
        const nodes = data.nodes.map(d => ({ ...d }));
        
        if (nodes.length === 0) return;
        
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(0, 0))
            .force("x", d3.forceX())
            .force("y", d3.forceY());

        const linkGroup = svg.append("g");

        const link = linkGroup
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 2);

        const linkLabel = linkGroup
            .selectAll(".linkLabel")
            .data(links)
            .enter().append("text")
            .attr("class", "linkLabel")
            .attr('fill', '#aaa')
            .attr('font-size', 10)
            .attr('text-anchor', 'middle')
            .text((d: any) => d.type);

        const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 15)
            .attr("fill", (d: any) => color(d.label))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .call(drag(simulation));

        const nodeLabel = svg.append("g")
            .selectAll(".nodeLabel")
            .data(nodes)
            .enter().append("text")
            .attr("class", "nodeLabel")
            .attr("dx", 18)
            .attr("dy", ".35em")
            .attr('fill', '#ddd')
            .attr('font-size', 12)
            .text((d: any) => d.properties.name || d.id);

        node.append("title")
            .text((d: any) => `${d.label}: ${d.id}\n${JSON.stringify(d.properties, null, 2)}`);

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);
            
            nodeLabel
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y);

            linkLabel
                .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
                .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
        });

        function drag(simulation: any) {
            function dragstarted(event: any, d: any) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            function dragged(event: any, d: any) {
                d.fx = event.x;
                d.fy = event.y;
            }
            function dragended(event: any, d: any) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }
        
        return () => {
            simulation.stop();
        };

    }, [data]);

    return <div className="bg-slate-800 rounded-lg p-4"><svg ref={svgRef}></svg></div>;
};

const DataTable: React.FC<{ title: string, data: any[], columns: { key: string, label: string }[] }> = ({ title, data, columns }) => (
    <div className="bg-slate-800 rounded-lg p-4 h-96 overflow-auto">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 sticky top-0 bg-slate-800 py-2">{title} ({data.length})</h3>
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-700 text-slate-300 sticky top-12">
                <tr>
                    {columns.map(col => <th key={col.key} className="p-2">{col.label}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50">
                        {columns.map(col => (
                            <td key={col.key} className="p-2 align-top">
                                {typeof item[col.key] === 'object' ? 
                                  <pre className="text-xs whitespace-pre-wrap break-all bg-slate-900/50 p-1 rounded">{JSON.stringify(item[col.key], null, 2)}</pre>
                                  : <span className="break-all">{item[col.key]}</span>}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CypherQueryDisplay: React.FC<{ query: string }> = ({ query }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(query);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-cyan-400">Neo4j Cypher Query</h3>
                <button
                    onClick={handleCopy}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {copied ? 'Copied!' : 'Copy Query'}
                </button>
            </div>
            <pre className="bg-slate-900 text-cyan-300 p-4 rounded-md text-sm overflow-x-auto">
                <code>{query}</code>
            </pre>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ graphData, cypherQuery, onReset }) => {
    const nodeColumns = [
        { key: 'id', label: 'ID' },
        { key: 'label', label: 'Label' },
        { key: 'properties', label: 'Properties' },
    ];
    const relColumns = [
        { key: 'source', label: 'Source ID' },
        { key: 'type', label: 'Type' },
        { key: 'target', label: 'Target ID' },
        { key: 'properties', label: 'Properties' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Extraction Results</h2>
              <button
                  onClick={onReset}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                >
                  Start Over
                </button>
            </div>
            
            <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Knowledge Graph Visualization</h3>
                <GraphVisualization data={graphData} />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <DataTable title="Extracted Entities (Nodes)" data={graphData.nodes} columns={nodeColumns} />
                <DataTable title="Extracted Relationships" data={graphData.relationships} columns={relColumns} />
            </div>

            <CypherQueryDisplay query={cypherQuery} />
        </div>
    );
};
