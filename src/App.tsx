import { useEffect, useState } from "react";
import { Feature, Geometry, Position } from "../types/GeoJSON";
import "./App.css";

function App() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [base, setBase] = useState<Feature[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [dataset, setDataset] = useState<
    Record<
      string,
      {
        source: string;
        isLoad: boolean;
        features: Feature[];
      }
    >
  >({
    Turkey: {
      isLoad: false,
      features: [],
      source: "/map/turkey.json",
    },
  });
  useEffect(() => {
    (async () => {
      let features = [];
      {
        const world = fetch("/map/world.json");
        const data = await (await world).json();
        features = data.features;
      }

      // {
      //   const turkey = fetch("/map/turkey.json");
      //   const data = await (await turkey).json();
      //   features = [...features, ...data.features]
      // }
      setBase(features);
      setFeatures(features);
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
  const [level, setLevel] = useState(0);
  const [viewBox, setViewBox] = useState<[number, number, number, number] | null>(null);
  const loadDataset = (name: string) => {
    (async () => {
      if (dataset[name] !== undefined) {
        let features = [];
        if (!dataset[name].isLoad) {
          const source = fetch(dataset[name].source);
          const data = await (await source).json();
          features = data.features;
        }
        setFeatures(features)
        setDataset({
          ...dataset,
          name: {
            ...dataset[name],
            isLoad: true,
            features,
          }
        })
      }
    })()
  }
  const zoomIntoFeature = (featureIndex: number) => {
    switch (level) {
      case 0:
        const feature = features[featureIndex];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const multipolygon of feature.geometry.coordinates) {
          for (const polygon of multipolygon) {
            for (const [x, y] of polygon.map(project)) {
              minX = Math.min(x, minX);
              maxX = Math.max(x, maxX);
              minY = Math.min(y, minY);
              maxY = Math.max(y, maxY);
            }
          }
        }
        minX -= 5;
        maxX += 5;
        minY -= 5;
        maxY += 5;
        setViewBox([minX, minY, maxX - minX, maxY - minY]);
        setLevel(1);
        if (feature.properties.name) loadDataset(feature.properties.name);
        break;
      case 1: {
        setLevel(0);
        setViewBox(null);
        setFeatures(base);
      }
    }
  };
  const [showLabelFor, setShowLabelFor] = useState<null | [number, number]>(null);
  return (
    <div className="App">
      <svg width={width} height={height} viewBox={viewBox ? viewBox.join(" ") : undefined} style={{ display: "flex" }}>
        {features.map((feature, featureIndex) => (
          <g key={`feature-${featureIndex}`}>
            {((geometry: Geometry) => {
              switch (geometry.type) {
                case "MultiPolygon": {
                  return geometry.coordinates.map((multipolygon, multiPolygonIndex) => (
                    <g key={`multipolygon-${multiPolygonIndex}`}>
                      {multipolygon.map((polygon, index) => (
                        <polygon
                          onClick={() => zoomIntoFeature(featureIndex)}
                          onPointerOver={() => setShowLabelFor([featureIndex, multiPolygonIndex])}
                          // onPointerOut={() => setShowLabelFor(null)}
                          fill={showLabelFor && showLabelFor[0] === featureIndex ? "#94d7ff" : "transparent"}
                          stroke={"black"}
                          strokeWidth={level === 1 ? 0.05 : 1}
                          key={`polygon-${index}`}
                          style={{ cursor: "pointer" }}
                          points={polygon
                            .map(project)
                            .map((c) => c.join(","))
                            .join(String.fromCharCode(32))}
                        />
                      ))}
                      {((showLabelFor &&
                        showLabelFor[0] === featureIndex &&
                        showLabelFor[1] === multiPolygonIndex)) &&
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
                            <text
                              style={{ pointerEvents: "none" }}
                              fill={"black"}
                              alignmentBaseline="middle"
                              textAnchor="middle"
                              fontSize={level===1?  1: 10}
                              x={centerX}
                              y={centerY}
                            >
                              {properties.name}
                            </text>
                          );
                        })(feature.properties)}
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
