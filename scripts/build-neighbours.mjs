// Writes src/data/neighbours-50m.json: Indonesia's neighbours in Natural
// Earth's 50m detail, so their borders and coasts line up with the province
// map when the globe is close to Indonesia (the rest of the world stays at
// 110m). Run once after updating world-atlas: node scripts/build-neighbours.mjs
import { readFileSync, writeFileSync } from "fs";
import { geoArea } from "d3-geo";
import { feature } from "topojson-client";

// ISO numeric codes: Malaysia, Brunei, Singapore, Timor-Leste, Papua New
// Guinea, the Philippines, Palau, Australia, Thailand, Vietnam, Cambodia,
// Laos, Myanmar
const KEEP = ["458", "096", "702", "626", "598", "608", "585", "036", "764", "704", "116", "418", "104"];

const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const round = (c) => (typeof c[0] === "number" ? [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100] : c.map(round));
// rounding can squash a tiny island; drop any that would then fill the globe inside out
const sound = (polygon) => polygon[0].length >= 4 && geoArea({ type: "Polygon", coordinates: polygon }) < 2 * Math.PI;
const features = feature(topo, topo.objects.countries)
  .features.filter((f) => KEEP.includes(f.id) && f.properties.name !== "Ashmore and Cartier Is.")
  .map((f) => {
    const polygons = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).map(round).filter(sound);
    return { type: "Feature", id: f.id, properties: {}, geometry: { type: "MultiPolygon", coordinates: polygons } };
  });
writeFileSync("src/data/neighbours-50m.json", JSON.stringify({ type: "FeatureCollection", features }));
console.log(`${features.length} countries`);
