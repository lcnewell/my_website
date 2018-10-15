//create map
function createMap(){
    var map=L.map('mapid').setView([36.0902, -95.7129],4.15);

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
function createPropSymbols(data, map, attributes, index){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJSON(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes, index);
        }
    }).addTo(map);
};
// calculate the radius of each proportional symbol
function calcPropRadius(attValue){
    var scaleFactor = 50;
    var area = Math.pow(attValue, 1.5) * scaleFactor;
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};


//create point to layer
function pointToLayer(feature, latlng, attributes, index){
    var attribute = attributes[index];
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
            $('#panel').html(popupContent);
        }
    });
    return layer;
};
//create search bar
function createSearchBar(map, attributes){
    var searchLayer = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function(map){
            var container = L.DomUtil.create('div', 'search-bar-container');
            $(container).append('<input class="search-bar" id="search-bar" title="Search Bar">');
        }
    });
    require([
        "leaflet",
        "leafletSearch"
    ], function(L, LeafletSearch){
        map.addControl(new LeafletSearch({
            layer: datalayer
        }) );
    });
};
    

//create new sequence controls on the map
function createSequenceControls(map, attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function(map){
            var outerContainer = L.DomUtil.create('div', 'instruction-wrapper');
            var container = L.DomUtil.create('div', 'sequence-control-container');
            $(container).append('<input class="range-slider sequence-control-item" id="month-slider" type="range" value="0" max="11" step="1" data-orientation="horizontal">');
            $(container).append('<button class="previous sequence-control-item" id="previous" title="Previous">Previous</button>');
            $(container).append('<button class="next sequence-control-item" id="next" title="Next">Next</button>');
            $(container).append('<div class="label-wrapper sequence-control-item"><div id="currentMonthText" class="month-label">January</div></div>');
            $(container).mousedown(function(e){
                L.DomEvent.stopPropagation(e);
                map.dragging.disable();
            });
            $(outerContainer).append('<div id="instruction" class="instruction">Clear Days By Month</div>');
            $(outerContainer).append(container);
            return outerContainer;
        }
    });
    console.log("About to make that listener...");
    map.addControl(new SequenceControl());
};

function addSequenceControlListeners(map, attributes) {
    $('#month-slider').click(function(){
        var index = $(this).val();
        $('#currentMonthText').text(getCurrentMonth(index));
        updatePropSymbols(map, attributes[index]);
    });
    $('#next').click(function(){
        var newIndex = parseInt($('#month-slider').val()) + 1;
        $('#month-slider').val(newIndex).slider;
        $('#currentMonthText').text(getCurrentMonth(newIndex));
        updatePropSymbols(map, attributes[newIndex]);
    });
    $('#previous').click(function(){
        var newIndex = parseInt($('#month-slider').val()) - 1;
        $('#month-slider').val(newIndex).slider;
        $('#currentMonthText').text(getCurrentMonth(newIndex));
        updatePropSymbols(map, attributes[newIndex]);
    });
}

function getCurrentMonth (index) {
    var monthArray = [
        "January",
        "Feburary",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    return monthArray[index];
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
           var svg = '<svg id="attribute-legend" width="180px" height="180px">';
           var circles = ["max", "mean", "min"];
           for (var i=0; i<circles.length; i++){
               svg += '<circle class="legend-circle" id="' + circles[i] + '" fill=#F47821" fill-opacity="0.8" stroke="#000000" cx="90"/>';
           };
           svg += "</svg>";
           $(container).append(svg);
           return container;
       } 
    });
    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
};
 function updateLegend(map, attribute){
     var month = attribute;
     var content = "Clear Days in " + month;
     $('#temporal-legend').html(content);
     var circleValues = getCircleValues(map, attribute);
     for (var key in circleValues){
         var radius = calcPropRadius(circleValues[key]);
         $('#'+key).attr({
             cy: 179 - radius,
             r: radius
         });
     };
 };

 function getCircleValues(map, attribute){
     var min = Infinity,
         max = -Infinity;
    map.eachLayer(function(layer){
        if(layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);
            if(attributeValue < min){
                min=attributeValue;
            };
            if(attributeValue > max){
                max=attributeValue;
            };
        };
    });
    var mean = (max + min)/2;
    return {
        max: max,
        mean: mean,
        min: min
    };
 };

// resizing proprtional symbols according to new attributes
function updatePropSymbols(map, attributes) {
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attributes]){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props[attributes]);
            layer.setRadius(radius);
            var popupContent = "<p><b>" + layer.feature.properties.city + ': </b>' + '\xa0' + layer.feature.properties[attributes] + '\xa0' + "clear days </p>";
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
            createPropSymbols(response, map, attributes, 0);
            createSequenceControls(map, attributes);
            addSequenceControlListeners(map, attributes);
            createLegend(map, attributes);
            createSearchBar(map,attributes);
        }
    });
};

$(document).ready(createMap)