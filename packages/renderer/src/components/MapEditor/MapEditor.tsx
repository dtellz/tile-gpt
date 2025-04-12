import React, { useEffect, useRef, useState } from 'react';
import { TabItem } from '../../types';
import { readFile } from '../../utils/preload';
import { MapRenderer } from './MapRenderer';
import './MapEditor.css';

interface MapEditorProps {
  activeTab: TabItem | null;
}

export const MapEditor: React.FC<MapEditorProps> = ({ activeTab }) => {
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

  // Get container dimensions for the map renderer
  const editorRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (editorRef.current) {
      const updateDimensions = () => {
        if (editorRef.current) {
          setDimensions({
            width: editorRef.current.clientWidth,
            height: editorRef.current.clientHeight
          });
        }
      };

      // Initial dimensions
      updateDimensions();

      // Update dimensions on resize
      const resizeObserver = new ResizeObserver(updateDimensions);
      const currentRef = editorRef.current;
      resizeObserver.observe(currentRef);

      return () => {
        if (currentRef) {
          resizeObserver.unobserve(currentRef);
        }
      };
    }
  }, []);

  // Render the appropriate content
  const renderContent = () => {
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

    if (mapContent && activeTab.path.endsWith('.tmx')) {
      return (
        <MapRenderer 
          mapContent={mapContent} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
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
    <div className="map-editor" ref={editorRef}>
      {renderContent()}
    </div>
  );
};
