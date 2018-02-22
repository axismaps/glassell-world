var codesByName = {};
Object.keys(codes).forEach(function (c) {
  codesByName[codes[c]] = c;
});

var initCenter = [20, 0];
var initZoom = 3;

var map = L.map('map', {zoomControl: false}).setView(initCenter, initZoom);

var reset = L.control({ position: 'bottomright' });
reset.onAdd = function(map) {
  var div = document.createElement('div');
  div.className = 'reset';
  div.onclick = function () {
    map.setView([20, 0], 3);
  };
  return div;
}
reset.addTo(map);

L.control.zoom({position: 'bottomright'}).addTo(map);


var tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
  maxZoom: 16
}).addTo(map);

var geojson = topojson.feature(countriesData, countriesData.objects.countries);

var style = {
  fillOpacity: 0,
  stroke: false,
  color: '#EB6E2E',
  weight: 6
}

var highlightedFeature;

L.geoJSON(geojson, {
  style: function (){ return style; }
}).on('click', function (e) {
  document.getElementById('prompt').style.display = 'none';
  clearTimeout(resetTimer);
  resetTimer = setTimeout(resetAll, 60000);
  if (highlightedFeature != e.layer) {
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
  var target = e.originalEvent.target;
  if (!target || target.tagName.toLowerCase() != 'path') {
    removeHighlight();
    hideProbe();
  }
}).on('move', function () {
  clearTimeout(resetTimer);
  resetTimer = setTimeout(resetAll, 60000);
});

function highlightFeature (layer) {
  removeHighlight();
  layer.setStyle({stroke: true});
  highlightedFeature = layer;
}

function removeHighlight () {
  if (highlightedFeature) highlightedFeature.setStyle({stroke: false});
  highlightedFeature = null;
  hideProbe();
}

function showProbe (feature, point) {
  var probe = document.getElementById('probe');
  var iso2;
  if (feature.properties.ISO_A2 == -99) {
    iso2 = codesByName[feature.properties.NAME];
  } else {
    iso2 = feature.properties.ISO_A2;
  }
  var img = iso2 ? ('<img src="flags/' + iso2.toLowerCase() + '.png"/>') : ''
  probe.innerHTML = img + '<span class="country-name">' + feature.properties.NAME + '</span><br>' + 
    'Population: ' + feature.properties.POP_EST.toLocaleString() + '<br>' +
    'GDP: US $' + feature.properties.GDP_MD_EST.toLocaleString() + '<br>' + 
    'Income Group: ' + feature.properties.INCOME_GRP.slice(3).replace(' income', '').replace(': OECD', '');
  probe.style.display = 'block';
  var w = probe.offsetWidth;
  var h = probe.offsetHeight;
  var x = point.x > window.innerWidth / 2 ? (point.x - w - 10) : (point.x + 10);
  var y = point.y > 200 ? (point.y - h - 10) : (point.y + 10);
  probe.style.left = x + 'px';
  probe.style.top = y + 'px';
}

function hideProbe () {
  document.getElementById('probe').style.display = 'none';
}

var resetTimer;
function resetAll () {
  document.getElementById('prompt').style.display = 'block';
  map.setView(initCenter, initZoom);
}