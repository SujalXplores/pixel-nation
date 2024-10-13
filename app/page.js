'use client';

import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { feature } from 'topojson-client';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Maximize, Paintbrush, Search,
} from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';

// TopoJSON data of world countries
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const OrganizedCountryDotFill = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [dots, setDots] = useState([]);
  const [dotColor, setDotColor] = useState('#3b82f6'); // Default blue color
  const [worldData, setWorldData] = useState(null);
  const [dotSize, setDotSize] = useState(0.5);
  const [countries, setCountries] = useState([]);

  const fetchWorldData = useCallback(async () => {
    try {
      const response = await fetch(geoUrl);
      const data = await response.json();
      if (!data?.objects?.countries) {
        throw new Error('Invalid data structure');
      }
      const world = feature(data, data.objects.countries);
      setWorldData(world);

      const countryNames = world.features
        .map((f) => ({
          value: f.properties?.name,
          label: f.properties?.name,
        }))
        .filter((country) => country.value && country.label)
        .sort((a, b) => a.label.localeCompare(b.label));

      setCountries(countryNames);
    }
    catch (error) {
      setCountries([]);
    }
  }, []);

  useEffect(() => {
    fetchWorldData();
  }, [fetchWorldData]);

  const getBounds = (coords) => {
    const xs = coords.map((c) => c[0]);
    const ys = coords.map((c) => c[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };

  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      const intersect = ((yi > point[1]) !== (yj > point[1]))
        && (point[0] < (((xj - xi) * (point[1] - yi)) / (yj - yi)) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isPointInPolygons = useCallback((point, polygons) => polygons.some((polygon) => isPointInPolygon(point, polygon)), []);

  const generateDots = useCallback((country) => {
    const polygons = country.geometry.type === 'Polygon'
      ? [country.geometry.coordinates[0]]
      : country.geometry.coordinates.map((poly) => poly[0]);

    const bounds = getBounds(polygons.flat());
    const newDots = [];
    const gridSize = 40;
    const skipFactor = 1;

    for (let i = 0; i < gridSize; i += skipFactor) {
      for (let j = 0; j < gridSize; j += skipFactor) {
        const x = bounds.minX + ((bounds.maxX - bounds.minX) * (i / gridSize));
        const y = bounds.minY + ((bounds.maxY - bounds.minY) * (j / gridSize));

        if (isPointInPolygons([x, y], polygons)) {
          newDots.push({
            x: ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * 100,
            y: 100 - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * 100,
            color: dotColor,
          });
        }
      }
    }

    setDots(newDots);
  }, [dotColor, isPointInPolygons]);

  const handleSearch = useCallback(() => {
    const country = worldData?.features.find(
      (f) => f.properties.name.toLowerCase() === searchTerm.toLowerCase(),
    );
    if (country) {
      setSelectedCountry(country);
      generateDots(country);
    }
    else {
      setSelectedCountry(null);
      setDots([]);
    }
  }, [searchTerm, worldData, generateDots]);

  const handleDotClick = useCallback((index) => {
    setDots((prevDots) => {
      const newDots = [...prevDots];
      newDots[index] = { ...newDots[index], color: dotColor };
      return newDots;
    });
  }, [dotColor]);

  const renderedDots = useMemo(() => (
    dots.map((dot, index) => (
      <circle
        cx={dot.x}
        cy={dot.y}
        fill={dot.color}
        key={`${dot.x}-${dot.y}`}
        r={dotSize}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDotClick(index)}
      />
    ))
  ), [dots, dotSize, handleDotClick]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <Card className="w-full max-w-[95%] md:max-w-5xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-2">Pixel Nation Generator</CardTitle>
          <CardDescription className="text-lg">Discover countries re-imagined as vibrant dot patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              {countries.length > 0 ? (
                <Combobox
                  className="w-full sm:w-2/3"
                  countries={countries}
                  placeholder="Enter country name"
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              ) : (
                <div className="w-full sm:w-2/3 h-10 bg-gray-200 animate-pulse rounded" />
              )}
              <Button className="w-full sm:w-1/3 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
              <div className="w-full md:w-1/3 space-y-4">
                <div>
                  <Label className="flex items-center mb-2" htmlFor="dotColor">
                    <Paintbrush className="w-4 h-4 mr-2" />
                    Dot Color
                  </Label>
                  <HexColorPicker className="w-full" color={dotColor} onChange={setDotColor} />
                </div>
                <div>
                  <Label className="flex items-center mb-2" htmlFor="dotSize">
                    <Maximize className="w-4 h-4 mr-2" />
                    Dot Size:
                    {' '}
                    {dotSize.toFixed(1)}
                  </Label>
                  <Slider
                    id="dotSize"
                    max={5}
                    min={0.1}
                    step={0.1}
                    value={[dotSize]}
                    onValueChange={(value) => setDotSize(value[0])}
                  />
                </div>
              </div>

              <div className="w-full md:w-2/3 border rounded-lg p-4 bg-gray-50 aspect-video relative overflow-hidden">
                {selectedCountry ? (
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {renderedDots}
                  </svg>
                ) : (
                  <p className="absolute inset-0 flex items-center justify-center text-gray-500">No country selected or found</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizedCountryDotFill;
