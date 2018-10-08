//create map
function createMap(){
    var map=L.map('mapid').setView([36.0902, -95.7129],5);

    //add tilelayer
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoibGNuZXdlbGwiLCJhIjoiY2ptcXBreDVhMDZibzNqbnR2OThwZXlrdyJ9.EiRmLqyx2RBOS4Q6E_hzxg'
}).addTo(map);

getData(map);

};
//add circle features to map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJSON(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};
// calculate the radius of each proportional symbol
function calcPropRadius(attValue){
    var scaleFactor = 50;
    var area = attValue * scaleFactor;
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};


//create point to layer
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0];
    var options = {
        fillColor: "#c51b8a",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    var attValue = Number(feature.properties[attribute]);
    options.radius = calcPropRadius(attValue);
    var layer = L.circleMarker(latlng, options);
    var popupContent = "<p><b>" + feature.properties.city + ': </b>' + '\xa0' + feature.properties[attribute] + '\xa0' + "clear days </p>";
    layer.bindPopup(popupContent,{
        offset: new L.Point(0, -options.radius)
    });
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $('#tools').html(popupContent);
        }
    });
    return layer;
};
//create new sequence controls on the map
function createSequenceControls(map, attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function(map){
            var container = L.DomUtil.create('div', 'sequence-control-container');
            $(container).append('<input class="range-slider" type="range" max="12" step="1" data-orientation="horizontal">');
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
                map.dragging.disable();
            });
            return container;
        }
    });
    map.addControl(new SequenceControl());
};
//create temporal legend
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
       options: {
           position: 'bottomright'
       },
       onAdd: function(map){
           var container = L.DomUtil.create('div', 'legend-control-container');
           $(container).append('<div id="temporal-legend">');


           return container;
       } 
    });
    map.addControl(new LegendControl());
};

// resizing proprtional symbosl according to new attributes
function updatePropSymbols(map, attributes) {
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attributes]){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props[attributes]);
            layer.setRadius(radius);
            var popupContent = "<p><b>" + feature.properties.city + ': </b>' + '\xa0' + feature.properties[attributes] + '\xa0' + "clear days </p>";
            layer.bindPopup(popupContent,{
                offset: new L.Point(0, -radius)        
            });
        };
    });
};

//process the incoming data to sort out by month feature property
function processData(data){
    var attributes = [];
    var properties = data.features[0].properties;
    var monthArray = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    for (var attribute in properties){
        var found = false;
        for (var month in monthArray){
            if(attribute.indexOf(monthArray[month])>-1){
                found = true;
                break;
            }
        }
        if (found){
            attributes.push(attribute);
        }
    };
    //holds jan-dec
    return attributes;
 };


// Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/map.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
        }
    });
};

$(document).ready(createMap)