import React, { useEffect, useRef, useState } from 'react';
import { parseTmx, TmxMap } from '../../utils/tmxParser';
import './MapRenderer.css';

interface MapRendererProps {
  mapContent: string;
  width: number;
  height: number;
}

export const MapRenderer: React.FC<MapRendererProps> = ({ mapContent, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<TmxMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Function to render the map using canvas
  const renderMap = (map: TmxMap) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a checkerboard pattern for the background
    ctx.fillStyle = '#2c2c2c';
    const patternSize = 20;
    for (let y = 0; y < canvas.height; y += patternSize) {
      for (let x = 0; x < canvas.width; x += patternSize) {
        if ((Math.floor(x / patternSize) + Math.floor(y / patternSize)) % 2 === 0) {
          ctx.fillRect(x, y, patternSize, patternSize);
        }
      }
    }
    
    // Get map dimensions
    const { tileWidth, tileHeight } = map;
    
    // Define colors for different layers
    const layerColors = [
      '#4a90e2', // Blue
      '#50e3c2', // Teal
      '#b8e986', // Green
      '#f8e71c', // Yellow
      '#f5a623', // Orange
      '#d0021b', // Red
      '#9013fe'  // Purple
    ];
    
    // Render each layer
    map.layers.forEach((layer, layerIndex) => {
      if (!layer.visible) return;
      
      // Get color for this layer
      const color = layerColors[layerIndex % layerColors.length];
      
      // Set transparency for overlapping layers
      ctx.globalAlpha = 0.7;
      
      // Render tiles
      for (let y = 0; y < layer.height; y++) {
        for (let x = 0; x < layer.width; x++) {
          const tileIndex = y * layer.width + x;
          const tileId = layer.data[tileIndex];
          
          if (tileId === 0) continue; // Empty tile
          
          // Draw a colored rectangle for this tile
          ctx.fillStyle = color;
          ctx.fillRect(
            x * tileWidth, 
            y * tileHeight, 
            tileWidth - 1, // Leave a small gap between tiles
            tileHeight - 1
          );
          
          // Draw tile ID for debugging
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px Arial';
          ctx.fillText(
            tileId.toString(), 
            x * tileWidth + 2, 
            y * tileHeight + 10
          );
        }
      }
    });
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
  };
  
  // Set up canvas dimensions when they change
  useEffect(() => {
    if (!canvasRef.current) return;
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    
    // If we have map data, render it
    if (mapRef.current) {
      renderMap(mapRef.current);
    }
  }, [width, height]);
  
  // Parse and render map when content changes
  useEffect(() => {
    if (!mapContent || !canvasRef.current) return;
    
    try {
      // Parse the TMX content
      const map = parseTmx(mapContent);
      mapRef.current = map;
      
      // Render the map
      renderMap(map);
    } catch (error) {
      console.error('Error parsing map:', error);
      setError(`Error parsing map: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [mapContent]);
  
  if (error) {
    return (
      <div className="map-renderer-error">
        <p>Error: {error}</p>
        <p>Please check the console for more details.</p>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="map-renderer"
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};
