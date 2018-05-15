/* globals L */
/* globals topojson */
/* globals codes */
/* globals countriesData */

let codesByName = {};
Object.keys(codes).forEach(function (c) {
  codesByName[codes[c]] = c;
});

let initCenter = [20, 0];
let initZoom = 3;
let resetTimer;

let map = L.map('map', {
  zoomControl: false,
  maxBounds: [[-90, -180], [90, 180]]
}).setView(initCenter, initZoom);

let reset = L.control({ position: 'bottomright' });
reset.onAdd = function () {
  let div = document.createElement('div');
  div.className = 'reset';
  div.onclick = function () {
    map.setView([20, 0], 3);
  };
  return div;
};
reset.addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);


L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
  maxZoom: 16,
  minZoom: 2,
  detectRetina: true
}).addTo(map);

let geojson = topojson.feature(countriesData, countriesData.objects.countries);

let style = {
  fillOpacity: 0,
  stroke: false,
  color: '#EB6E2E',
  weight: 3
};

let highlightedFeature;

L.geoJSON(geojson, {
  style: function () { return style; }
}).on('click', function (e) {
  // document.getElementById('prompt').style.display = 'none';
  clearTimeout(resetTimer);
  resetTimer = setTimeout(resetAll, 60000);
  if (highlightedFeature !== e.layer) {
    highlightFeature(e.layer);
    showProbe(e.layer.feature, e.containerPoint);
  } else {
    removeHighlight();
  }
}).addTo(map);

map.on('zoom', function () {
  removeHighlight();
  hideProbe();
}).on('click', function (e) {
  let { target } = e.originalEvent;
  if (!target || target.tagName.toLowerCase() !== 'path') {
    removeHighlight();
    hideProbe();
  }
}).on('move', function () {
  clearTimeout(resetTimer);
  resetTimer = setTimeout(resetAll, 60000);
});

function highlightFeature(layer) {
  removeHighlight();
  layer.setStyle({ stroke: true });
  highlightedFeature = layer;
}

function removeHighlight() {
  if (highlightedFeature) highlightedFeature.setStyle({ stroke: false });
  highlightedFeature = null;
  hideProbe();
}

function showProbe(feature, point) {
  let probe = document.getElementById('probe');
  let iso2;
  if (feature.properties.ISO_A2 === '-99') {
    iso2 = codesByName[feature.properties.NAME];
  } else {
    iso2 = feature.properties.ISO_A2;
  }
  let img = iso2 ? ('<img src="flags/' + iso2.toLowerCase() + '.png"/>') : '';
  probe.innerHTML = img + '<span class="country-name">' + feature.properties.NAME + '</span><br>' +
    'Population: ' + feature.properties.POP_EST.toLocaleString() + '<br>' +
    'GDP per capita: US $' + Math.round((feature.properties.GDP_MD_EST * 1000000) / feature.properties.POP_EST).toLocaleString() + '<br>' +
    'Income Group: ' + feature.properties.INCOME_GRP.slice(3).replace(' income', '').replace(': OECD', '');
  probe.style.display = 'block';
  let w = probe.offsetWidth;
  let h = probe.offsetHeight;
  let x = point.x > window.innerWidth / 2 ? (point.x - w - 10) : (point.x + 10);
  let y = point.y > 200 ? (point.y - h - 10) : (point.y + 10);
  probe.style.left = x + 'px';
  probe.style.top = y + 'px';
}

function hideProbe() {
  document.getElementById('probe').style.display = 'none';
}

function resetAll() {
  // document.getElementById('prompt').style.display = 'block';
  map.setView(initCenter, initZoom);
}
