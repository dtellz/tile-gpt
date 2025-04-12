import React, { useEffect, useRef, useState } from 'react';
import { TabItem } from '../../types';
import { readFile } from '../../utils/preload';
import './MapEditor.css';

interface MapEditorProps {
  activeTab: TabItem | null;
}

export const MapEditor: React.FC<MapEditorProps> = ({ activeTab }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapContent, setMapContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMapContent = async () => {
      if (!activeTab) {
        setMapContent(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Only load TMX files
        if (activeTab.path.endsWith('.tmx')) {
          const content = await readFile(activeTab.path);
          setMapContent(content);
          
          // In a real implementation, we would parse the TMX file and render it on the canvas
          // For now, we'll just display some basic information
        } else {
          setMapContent(null);
          setError('Not a TMX file');
        }
      } catch (err) {
        console.error('Error loading map:', err);
        setError('Failed to load map file');
        setMapContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapContent();
  }, [activeTab]);

  // This is a placeholder for actual map rendering
  // In a real implementation, you would parse the TMX file and render the map
  const renderPlaceholder = () => {
    if (isLoading) {
      return <div className="map-loading">Loading map...</div>;
    }

    if (error) {
      return <div className="map-error">{error}</div>;
    }

    if (!activeTab) {
      return (
        <div className="map-placeholder">
          <p>No map selected</p>
          <p>Open a TMX file from the file explorer</p>
        </div>
      );
    }

    if (mapContent) {
      // Display basic information about the map
      // In a real implementation, you would render the actual map
      return (
        <div className="map-info">
          <h3>Map: {activeTab.name}</h3>
          <p>Path: {activeTab.path}</p>
          <p>This is a placeholder for the actual map rendering</p>
          <p>In a real implementation, the map would be rendered here</p>
        </div>
      );
    }

    return (
      <div className="map-placeholder">
        <p>Unable to display content</p>
        <p>The selected file is not a valid TMX map</p>
      </div>
    );
  };

  return (
    <div className="map-editor">
      {renderPlaceholder()}
      <canvas 
        ref={canvasRef} 
        className="map-canvas"
        style={{ display: mapContent && !error ? 'block' : 'none' }}
      />
    </div>
  );
};
