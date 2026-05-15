'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphEdge } from '@/types';

interface Props {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  selectedNodeId: string | null;
}

export function D3WhaleGraph({ data, onNodeClick, selectedNodeId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const getNodeColor = (node: GraphNode) => {
    if (node.winRate >= 70) return 'var(--signal-bull)';
    if (node.winRate >= 50) return 'var(--signal-watch)';
    if (node.winRate < 50 && node.tradeCount > 5) return 'var(--signal-bear)';
    return 'var(--text-muted)';
  };

  const getNodeSize = (node: GraphNode) => {
    const base = node.isKOL ? 10 : 7;
    const pnlBonus = Math.min(Math.abs(node.totalPnlUsd) / 200000, 8);
    return base + pnlBonus;
  };

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear existing SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Zoom behavior
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Stop any existing simulation
    simulationRef.current?.stop();

    // Create copies to avoid mutating original
    const nodes: GraphNode[] = data.nodes.map(n => ({ ...n }));
    const edges: GraphEdge[] = data.edges.map(e => ({ ...e }));

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(edges)
        .id(d => d.id)
        .distance(d => 120 - (d.copyScore * 0.5))
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => getNodeSize(d) + 10));

    simulationRef.current = simulation;

    // Draw edges
    const link = g.append('g')
      .selectAll<SVGLineElement, GraphEdge>('line')
      .data(edges)
      .join('line')
      .attr('stroke', 'var(--border-strong)')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => Math.max(1, d.copyScore / 30));

    // Draw diamond nodes
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Diamond shape
    node.append('polygon')
      .attr('points', d => {
        const s = getNodeSize(d);
        return `0,${-s} ${s},0 0,${s} ${-s},0`;
      })
      .attr('fill', 'var(--bg-elevated)')
      .attr('stroke', d => d.id === selectedNodeId ? 'var(--accent-critical)' : getNodeColor(d))
      .attr('stroke-width', d => d.id === selectedNodeId ? 2.5 : 1.5)
      .style('filter', d => d.id === selectedNodeId ? 'drop-shadow(0 0 6px var(--accent-critical))' : 'none');

    // KOL star overlay
    node.filter(d => d.isKOL)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '8px')
      .attr('fill', 'var(--accent-critical)')
      .text('★');

    // Label
    node.append('text')
      .attr('y', d => getNodeSize(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Barlow Condensed')
      .attr('font-size', '10px')
      .attr('fill', 'var(--text-secondary)')
      .text(d => d.label.length > 12 ? d.label.slice(0, 12) + '…' : d.label)
      .style('pointer-events', 'none');

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none');

    node
      .on('mouseover', (event, d) => {
        const color = getNodeColor(d);
        tooltip
          .html(`
            <div style="font-family: Bebas Neue; letter-spacing: 0.12em; font-size: 1rem; color: var(--text-primary); margin-bottom: 6px;">
              ${d.label}
            </div>
            ${d.xHandle ? `<div style="color: var(--accent-primary); font-size: 0.8rem; margin-bottom: 4px;">@${d.xHandle}</div>` : ''}
            <div style="font-family: IBM Plex Mono; font-size: 0.8rem; color: var(--text-secondary);">
              Win Rate: <span style="color: ${color}">${d.winRate.toFixed(1)}%</span><br/>
              PnL: <span style="color: ${d.totalPnlUsd >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)'}">
                $${(d.totalPnlUsd / 1000).toFixed(0)}K
              </span><br/>
              Trades: ${d.tradeCount}
            </div>
            <div style="margin-top: 6px; font-size: 0.7rem; color: var(--text-muted);">
              ${d.isKOL ? '⭐ KOL' : ''} ${d.isWhale ? '🐋 Whale' : ''}
            </div>
          `)
          .style('left', (event.offsetX + 16) + 'px')
          .style('top', (event.offsetY - 10) + 'px')
          .transition().duration(100)
          .style('opacity', 1);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', (event.offsetX + 16) + 'px')
          .style('top', (event.offsetY - 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      })
      .on('click', (_, d) => {
        onNodeClick(d);
      });

    // Tick update
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      tooltip.remove();
      simulation.stop();
    };
  }, [data, selectedNodeId, onNodeClick]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
