import React, { useEffect, useState } from "react";
import { Feature, Geometry, Position } from "../types/GeoJSON";
import "./App.css";

function App() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [features, setFeatures] = useState<Feature[]>([]);
  useEffect(() => {
    (async () => {
      const world = fetch("/map/world.json");
      const data = await (await world).json();
      setFeatures(data.features);
      console.log(data.features);
    })();
  }, []);
  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);
  const project = ([x, y]: Position) => {
    let latitudeToRadians = (y * Math.PI) / 180;
    let mercN = Math.log(Math.tan(Math.PI / 4 + latitudeToRadians / 2));
    return [(x + 180) * (width / 360), height / 2 - (width * mercN) / (2 * Math.PI)];
  };
  const [showLabelFor, setShowLabelFor] = useState<null | [number, number]>(null);
  return (
    <div className="App">
      <svg width={width} height={height} style={{ display: "flex", background: "#d1f4ff" }}>
        {features.map((feature, featureIndex) => (
          <g key={`feature-${featureIndex}`}>
            {((geometry: Geometry) => {
              switch (geometry.type) {
                case "MultiPolygon": {
                  return geometry.coordinates.map((multipolygon, multiPolygonIndex) => (
                    <g key={`multipolygon-${multiPolygonIndex}`}>
                      {showLabelFor &&
                        showLabelFor[0] === featureIndex &&
                        showLabelFor[1] === multiPolygonIndex &&
                        ((properties) => {
                          let minX = Infinity;
                          let maxX = -Infinity;
                          let minY = Infinity;
                          let maxY = -Infinity;
                          // for (const multipolygon of geometry.coordinates) {
                            for (const polygon of multipolygon) {
                              for (const [x, y] of polygon.map(project)) {
                                minX = Math.min(x, minX);
                                maxX = Math.max(x, maxX);
                                minY = Math.min(y, minY);
                                maxY = Math.max(y, maxY);
                              }
                            }
                          // }
                          const centerX = minX + (maxX - minX) / 2;
                          const centerY = minY + (maxY - minY) / 2;
                          return (
                            <text alignmentBaseline="middle" textAnchor="middle" fontSize={10} x={centerX} y={centerY}>
                              {properties.name!}
                            </text>
                          );
                        })(feature.properties)}
                      {multipolygon.map((polygon, index) => (
                        <polygon
                          onPointerOver={() => setShowLabelFor([featureIndex, multiPolygonIndex])}
                          onPointerOut={() => setShowLabelFor(null)}
                          fill="white"
                          stroke="black"
                          strokeWidth={1}
                          key={`polygon-${index}`}
                          points={polygon
                            .map(project)
                            .map((c) => c.join(","))
                            .join(' ')}
                        />
                      ))}
                    </g>
                  ));
                }
              }
            })(feature.geometry)}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default App;
