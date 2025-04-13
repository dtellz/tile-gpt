import React, { useCallback, useEffect, useRef, useState } from 'react';
import { parseTmx, TmxMap, getTilesetForTile, getLocalTileId } from '../../utils/tmxParser';
import { loadTileset, loadTilesetImage, getTileSourceRect } from '../../utils/tilesetLoader';
import { useLog } from '../../hooks/useLogContext';
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
  const { addLog } = useLog();
  
  // State for tracking loaded tilesets and images
  const [tilesetImages, setTilesetImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isLoadingTilesets, setIsLoadingTilesets] = useState<boolean>(false);
  const [workspacePath, setWorkspacePath] = useState<string>('');
  
  // State for panning and zooming
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Constants for zoom
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 5;
  const ZOOM_SPEED = 0.001;
  

  
  // Function to render the map using canvas - wrapped in useCallback to prevent recreation on each render
  const renderMap = useCallback((map: TmxMap) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply the view position (panning) and zoom
    ctx.save();
    
    // First translate to the center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    
    // Apply zoom around the center
    ctx.scale(zoomLevel, zoomLevel);
    
    // Then translate back and apply the pan offset
    ctx.translate(-centerX + viewPosition.x / zoomLevel, -centerY + viewPosition.y / zoomLevel);
    
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
    
    // Define colors for different layers (fallback for when images aren't available)
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
      
      // Get color for this layer (fallback)
      const color = layerColors[layerIndex % layerColors.length];
      
      // Set transparency for overlapping layers
      ctx.globalAlpha = layer.name.toLowerCase().includes('background') ? 1.0 : 0.8;
      
      // Render tiles
      for (let y = 0; y < layer.height; y++) {
        for (let x = 0; x < layer.width; x++) {
          const tileIndex = y * layer.width + x;
          const tileId = layer.data[tileIndex];
          
          if (tileId === 0) continue; // Empty tile
          
          // Try to find the tileset for this tile
          const tileset = getTilesetForTile(tileId, map.tilesets);
          
          if (tileset && tilesetImages.has(tileset.source)) {
            // We have the tileset image, draw the actual tile
            const image = tilesetImages.get(tileset.source);
            if (image) {
              // Calculate the local tile ID
              const localTileId = getLocalTileId(tileId, tileset);
              
              // Get the source rectangle for this tile
              const sourceRect = getTileSourceRect(tileset, localTileId);
              
              if (sourceRect) {
                // Draw the tile from the tileset image
                ctx.drawImage(
                  image,
                  sourceRect.x,
                  sourceRect.y,
                  sourceRect.width,
                  sourceRect.height,
                  x * tileWidth,
                  y * tileHeight,
                  tileWidth,
                  tileHeight
                );
              } else {
                // Fallback to colored rectangle if source rect couldn't be calculated
                drawFallbackTile(ctx, x, y, tileWidth, tileHeight, tileId, color);
              }
            } else {
              // Fallback to colored rectangle if image is null
              drawFallbackTile(ctx, x, y, tileWidth, tileHeight, tileId, color);
            }
          } else {
            // Fallback to colored rectangle if tileset or image not found
            drawFallbackTile(ctx, x, y, tileWidth, tileHeight, tileId, color);
          }
        }
      }
    });
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Restore the canvas context
    ctx.restore();
    
    // Draw a mini-map or navigation indicator in the corner
    drawNavigationIndicator(ctx, map, canvas.width, canvas.height);
  }, [viewPosition, zoomLevel, tilesetImages]);
  
  // Helper function to draw a fallback tile when the image isn't available
  const drawFallbackTile = (ctx: CanvasRenderingContext2D, x: number, y: number, tileWidth: number, tileHeight: number, tileId: number, color: string) => {
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
  };
  
  // Draw a small navigation indicator in the corner - memoized to prevent recreation
  const drawNavigationIndicator = useCallback((ctx: CanvasRenderingContext2D, map: TmxMap, canvasWidth: number, canvasHeight: number) => {
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
    
    // Display zoom level
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.fillText(`Zoom: ${Math.round(zoomLevel * 100)}%`, x + 5, y + 15);
  }, [viewPosition, zoomLevel]);
  
  // Set up canvas dimensions when they change
  useEffect(() => {
    if (!canvasRef.current) return;
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    
    // If we have map data, render it
    if (mapRef.current) {
      renderMap(mapRef.current);
    }
  }, [width, height, viewPosition, zoomLevel]);
  
  // Get the workspace path from localStorage
  useEffect(() => {
    const savedWorkspace = localStorage.getItem('workspace');
    if (savedWorkspace) {
      try {
        const parsedWorkspace = JSON.parse(savedWorkspace);
        setWorkspacePath(parsedWorkspace.path);
        addLog('Workspace path loaded', 'info');
      } catch (err) {
        addLog(`Failed to get workspace path: ${err}`, 'error');
      }
    } else {
      addLog('No workspace selected. Tileset images cannot be loaded.', 'warning');
    }
  }, [addLog]);

  // Function to load all tilesets for a map
  const loadMapTilesets = useCallback(async (map: TmxMap) => {
    if (!workspacePath) {
      addLog('No workspace path available. Cannot load tilesets.', 'error');
      return;
    }

    setIsLoadingTilesets(true);
    const newImages = new Map<string, HTMLImageElement>();
    
    try {
      // Process each tileset reference in the map
      for (const tilesetRef of map.tilesets) {
        addLog(`Loading tileset: ${tilesetRef.source}`, 'info');
        
        // Load the tileset
        const tileset = await loadTileset(tilesetRef.source, tilesetRef.firstGid, workspacePath);
        if (!tileset) {
          addLog(`Failed to load tileset: ${tilesetRef.source}`, 'warning');
          continue;
        }
        
        // Load the tileset image
        if (tileset.imageSource) {
          const image = await loadTilesetImage(tileset, workspacePath);
          if (image) {
            newImages.set(tileset.source, image);
            addLog(`Loaded tileset image: ${tileset.imageSource}`, 'success');
          } else {
            addLog(`Failed to load tileset image: ${tileset.imageSource}`, 'warning');
          }
        }
      }
      
      setTilesetImages(newImages);
      addLog(`Loaded ${newImages.size} tileset images`, 'success');
    } catch (err) {
      addLog(`Error loading tilesets: ${err}`, 'error');
    } finally {
      setIsLoadingTilesets(false);
    }
  }, [workspacePath, addLog]);

  // Ref to track if tilesets have been loaded for the current map content
  const tilesetLoadedRef = useRef<boolean>(false);
  
  // Parse and render map when content changes
  useEffect(() => {
    if (!mapContent || !canvasRef.current) return;
    
    try {
      // Parse the TMX content
      const map = parseTmx(mapContent);
      mapRef.current = map;
      
      // Load tilesets if we have a workspace path and haven't loaded them yet for this map
      if (workspacePath && !tilesetLoadedRef.current) {
        loadMapTilesets(map);
        tilesetLoadedRef.current = true;
      }
      
      // Render the map
      renderMap(map);
    } catch (error) {
      console.error('Error parsing map:', error);
      setError(`Error parsing map: ${error instanceof Error ? error.message : String(error)}`);
      addLog(`Error parsing map: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
    // Only re-run this effect when mapContent or workspacePath changes
    // renderMap and loadMapTilesets are memoized functions that shouldn't trigger re-renders
  }, [mapContent, workspacePath, addLog, renderMap]);
  
  // Reset the tilesetLoaded ref when mapContent changes
  useEffect(() => {
    tilesetLoadedRef.current = false;
  }, [mapContent]);
  
  // Set up wheel event listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Function to handle wheel events
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      
      // Check if Ctrl key is pressed (for both Mac and Windows/Linux)
      const isCtrlPressed = e.ctrlKey || e.metaKey;
      
      if (isCtrlPressed) {
        // Handle zooming
        const delta = -e.deltaY * ZOOM_SPEED;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate the point to zoom around (mouse position)
        const zoomPoint = {
          x: (mouseX - viewPosition.x) / zoomLevel,
          y: (mouseY - viewPosition.y) / zoomLevel
        };
        
        // Calculate new view position to zoom around mouse
        const newPosition = {
          x: mouseX - zoomPoint.x * newZoom,
          y: mouseY - zoomPoint.y * newZoom
        };
        
        setZoomLevel(newZoom);
        setViewPosition(newPosition);
      } else {
        // Regular panning
        setViewPosition(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };
    
    // Add the event listener with { passive: false }
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Clean up the event listener when component unmounts
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [zoomLevel, viewPosition]);
  
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
  
  // We've removed the handleWheel function since we're using the native event listener
  
  return (
    <div className="map-container">
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
        // We don't need the React onWheel handler anymore as we're using the native one
        // with { passive: false } in the useEffect
      />
      {isLoadingTilesets && (
        <div className="tileset-loading-indicator">
          <div className="loading-spinner"></div>
          <div>Loading tileset images...</div>
        </div>
      )}
      <div className="map-controls">
        <button 
          className="zoom-button" 
          onClick={() => setZoomLevel(prev => Math.min(MAX_ZOOM, prev + 0.1))}
          title="Zoom In"
        >
          +
        </button>
        <button 
          className="zoom-button" 
          onClick={() => setZoomLevel(prev => Math.max(MIN_ZOOM, prev - 0.1))}
          title="Zoom Out"
        >
          -
        </button>
        <button 
          className="zoom-button" 
          onClick={() => {
            setZoomLevel(1);
            setViewPosition({ x: 0, y: 0 });
          }}
          title="Reset View"
        >
          ↺
        </button>
      </div>
      <div className="zoom-info">
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};
