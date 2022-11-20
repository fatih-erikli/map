export type Position = [number, number];
export type Geometry = {
  type: "MultiPolygon",
  coordinates: Position[][][]
}
export type Feature = {
  properties: {
    name?: string;
  };
  geometry: Geometry;
}
