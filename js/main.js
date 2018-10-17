
//stores current layer to allow for filtering
var mapLayer;

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
function createPropSymbols(data, map, attributes, index, filterCount){
    //create a Leaflet GeoJSON layer and add it to the map
   return L.geoJSON(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes, index);
        },
        filter: function(feature, latlng){
            return feature.properties[attributes[index]] > filterCount;
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
        fillColor: "#ffffb3",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    var attValue = Number(feature.properties[attribute]);
    options.radius = calcPropRadius(attValue);
    var layer = L.circleMarker(latlng, options);
    //create popup content and bind it to the marker
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

//create filter control 
function createFilterControls(map, attributes){
    var FilterControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function(map){
            var container = L.DomUtil.create('div', 'filter-control-container');
            $(container).append('<nav class="menu-ui"><a href="#" class="active all" \
            data-filter="all">Show all</a><a href="#" data-filter="greaterthan5" class="gt5">>5 \
            Clear Days</a><a href="#" data-filer="greaterthan10" class="gt10">>10 Clear Days</a><a \
            href="#" data-filter="greaterthan20" class="gt20">>20 Clear Days</a></nav>');
            //enable and disables map functions while using controls
            container.addEventListener('mousedown', function() {
                map.dragging.disable();
            });
            container.addEventListener('mouseup', function() {
                map.dragging.enable();
            });
            container.addEventListener('mouseover', function() {
                map.doubleClickZoom.disable();
            });
            container.addEventListener('mouseout', function(){
                map.doubleClickZoom.enable();
            });
            return container;
        }
    });
    map.addControl(new FilterControl());
}

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
            $(outerContainer).append('<div id="instruction" class="instruction">Clear Days By Month</div>');
            $(outerContainer).append(container);
            //enable and disables map functions while using controls
            container.addEventListener('mousedown', function() {
                map.dragging.disable();
            });
            container.addEventListener('mouseup', function() {
                map.dragging.enable();
            });
            container.addEventListener('mouseover', function() {
                map.doubleClickZoom.disable();
            });
            container.addEventListener('mouseout', function(){
                map.doubleClickZoom.enable();
            });
            return outerContainer;
        }
    });
    map.addControl(new SequenceControl());
};

//add control listeners to the map for the range slider, previous/next buttons, legend, and filter
function addControlListeners(map, attributes, data) {
    //month range slider
    $('#month-slider').click(function(){
        var index = $(this).val();
        var filterAmount = getDayFilter(document.getElementsByClassName('active')[0].innerText);
        $('#currentMonthText').text(getCurrentMonth(index));
        updatePropSymbols(map, attributes[index]);
        updateFilter(data, map, attributes, filterAmount);
        updateLegend(map, attributes[index]);
    });
    //next button
    $('#next').click(function(){
        var newIndex = $('#month-slider').val() < 11 ? parseInt($('#month-slider').val()) + 1 : 11;
        var filterAmount = getDayFilter(document.getElementsByClassName('active')[0].innerText);
        $('#month-slider').val(newIndex).slider;
        $('#currentMonthText').text(getCurrentMonth(newIndex));
        updatePropSymbols(map, attributes[newIndex]);
        updateFilter(data, map, attributes, filterAmount);
        updateLegend(map, attributes[newIndex]);
    });
    //previous button
    $('#previous').click(function(){
        var newIndex = $('#month-slider').val() > 0 ? parseInt($('#month-slider').val()) - 1 : 0;
        var filterAmount = getDayFilter(document.getElementsByClassName('active')[0].innerText);
        $('#month-slider').val(newIndex).slider;
        $('#currentMonthText').text(getCurrentMonth(newIndex));
        updatePropSymbols(map, attributes[newIndex]);
        updateFilter(data, map, attributes, filterAmount);

        updateLegend(map, attributes[newIndex]);
    });
    //filter menu controller
    $('.menu-ui a').click(function() {
        $(this).addClass('active').siblings().removeClass('active');
    });
    //greater than five filter controller
    $('.gt5').click(function(){
        updateFilter(data, map, attributes, 5)
    });
    //greater than 10 filter controller
    $('.gt10').click(function(){
        updateFilter(data, map, attributes, 10)
    });
    //greater than 20 filter controller
    $('.gt20').click(function(){
        updateFilter(data, map, attributes, 20)
    });
    //show all filter controller
    $('.all').click(function(){
        updateFilter(data, map, attributes, 0)
    });
};

//deletes current map layer and replaces it with new layer with given filters
function updateFilter(data, map, attributes, filterAmount){
    const index = $('#month-slider').val();
    map.removeLayer(mapLayer);
    mapLayer = createPropSymbols(data, map, attributes, index, filterAmount);
};

//takes filter button text and returns filter amount
function getDayFilter(buttonText){
    if (buttonText === ">5 Clear Days"){
        return 5;
    } else if (buttonText === ">10 Clear Days"){
        return 10;
    } else if (buttonText === ">20 Clear Days"){
        return 20;
    } else {
        return 0;
    };
};

//create array of months
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

//create temporal legend with SVG
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
           console.log = "making a legend...";
           for (var i=0; i<circles.length; i++){
               svg += '<circle class="legend-circle" id="' + circles[i] + '" fill="#ffffb3" fill-opacity="0.8" stroke="#000000" cx="75"/>';
           };
           svg += "</svg>";
           $(container).append(svg);
            //enable and disables map functions while using controls
            container.addEventListener('mousedown', function() {
                map.dragging.disable();
            });
            container.addEventListener('mouseup', function() {
                map.dragging.enable();
            });
            container.addEventListener('mouseover', function() {
                map.doubleClickZoom.disable();
            });
            container.addEventListener('mouseout', function(){
                map.doubleClickZoom.enable();
            });
           return container;
       } 
    });
    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
};

//update legend as attribute changes
 function updateLegend(map, attributes){
     var month = attributes;
     var content = "Clear Days in " + month;
     $('#temporal-legend').html(content);
     var circleValues = getCircleValues(map, attributes);
     for (var key in circleValues){
         var radius = calcPropRadius(circleValues[key]);
         $('#'+key).attr({
             cy: 105 - radius,
             r: radius
         });
     };
 };

 //create circle values for temporal legend
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
    return attributes;
 };


// Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/map.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
            mapLayer = createPropSymbols(response, map, attributes, 0, 0);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
            createFilterControls(map, attributes);
            addControlListeners(map, attributes, response);
        }
    });
};

$(document).ready(createMap)