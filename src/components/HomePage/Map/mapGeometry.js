import { geoMercator, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import topoData from "../../../data/indonesia-provinces.topo.json";

const PROVINCE_SHAPES = topoData.objects["indonesia-38-prov-topo"];
export const ALL_PROVINCES = feature(topoData, PROVINCE_SHAPES).features;
// Indonesia's coast and borders, from the provinces themselves, so the
// country and its provinces always line up
export const INDONESIA_OUTLINE = merge(topoData, PROVINCE_SHAPES.geometries);
export const PROVINCE_COLLECTION = { type: "FeatureCollection", features: ALL_PROVINCES };
export const WIDTH = 800;

// Fits features into a WIDTH × height box. Without a height, the map is made
// exactly as tall as the features need, so no band of empty sea is left.
export const fitProjection = (features, pad, height) => {
  const collection = { type: "FeatureCollection", features };
  let h = height;
  if (!h) {
    const probe = geoMercator().fitWidth(WIDTH - pad * 2, collection);
    const [[, top], [, bottom]] = geoPath(probe).bounds(collection);
    h = Math.ceil(bottom - top) + pad * 2;
  }
  const projection = geoMercator().fitExtent(
    [
      [pad, pad],
      [WIDTH - pad, h - pad],
    ],
    collection
  );
  return { projection, height: h };
};
