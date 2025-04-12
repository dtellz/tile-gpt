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
  
  // State for panning
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Function to render the map using canvas
  const renderMap = (map: TmxMap) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply the view position (panning)
    ctx.save();
    ctx.translate(viewPosition.x, viewPosition.y);
    
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
    
    // Restore the canvas context
    ctx.restore();
    
    // Draw a mini-map or navigation indicator in the corner
    drawNavigationIndicator(ctx, map, canvas.width, canvas.height);
  };
  
  // Draw a small navigation indicator in the corner
  const drawNavigationIndicator = (ctx: CanvasRenderingContext2D, map: TmxMap, canvasWidth: number, canvasHeight: number) => {
    const indicatorSize = 100;
    const padding = 10;
    const x = canvasWidth - indicatorSize - padding;
    const y = canvasHeight - indicatorSize - padding;
    
    // Draw indicator background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, indicatorSize, indicatorSize);
    
    // Calculate map dimensions
    const mapWidth = map.width * map.tileWidth;
    const mapHeight = map.height * map.tileHeight;
    
    // Calculate scale for the indicator
    const scale = Math.min(indicatorSize / mapWidth, indicatorSize / mapHeight);
    
    // Draw map outline
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(x, y, mapWidth * scale, mapHeight * scale);
    
    // Draw viewport rectangle
    const viewportWidth = canvasWidth * scale;
    const viewportHeight = canvasHeight * scale;
    
    // Calculate viewport position in the indicator
    const viewportX = x - (viewPosition.x * scale);
    const viewportY = y - (viewPosition.y * scale);
    
    // Draw viewport rectangle
    ctx.strokeStyle = '#00ff00';
    ctx.strokeRect(
      Math.max(x, viewportX),
      Math.max(y, viewportY),
      Math.min(viewportWidth, indicatorSize),
      Math.min(viewportHeight, indicatorSize)
    );
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
  }, [width, height, viewPosition]);
  
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

  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setViewPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Prevent the default scroll behavior
    e.preventDefault();
    
    // Adjust the view position based on the wheel delta
    setViewPosition(prev => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY
    }));
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      className="map-renderer"
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
};
