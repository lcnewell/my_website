// step1 create leaflet map

function createMap(){
    var map=L.map('mapid').setView([37.0902, -95.7129], 4.25);

    //add tilelayer
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoibGNuZXdlbGwiLCJhIjoiY2ptcXBreDVhMDZibzNqbnR2OThwZXlrdyJ9.EiRmLqyx2RBOS4Q6E_hzxg'
}).addTo(map);

getData(map);

};

function createPropSymbols(data, map, attributes){
    //create attribute
    var attribute = "March";
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#bcbddc",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            geojsonMarkerOptions.radius = calcPropRadius(attValue);
            var layer = L.circleMarker(latlng, geojsonMarkerOptions);

            var popupContent = attribute + '\xa0' + "has" + '\xa0' + feature.properties[attribute] + '\xa0' + "clear days";
            layer.bindPopup(popupContent,{
                offset: new L.Point(0,-geojsonMarkerOptions.radius)
            });
            layer.on({
                mouseover: function(){
                    this.openPopup();
                },
                mouseout: function(){
                    this.closePopup();
                },
                click: function(){
                    $("#panel").html(popupContent);
            return createPropSymbols(feature, latlng, attributes);
            }
        });
        return layer;
        //Step 6: Give each feature's circle marker a radius based on its attribute value
        //create circle markers
        }
    }).addTo(map);
};
//calculate radius of each proportional symbol
function calcPropRadius(attValue) {
    var scaleFactor = 50;
    var area = attValue * scaleFactor;
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};

//create new sequence controls
function createSequenceControls(map, attribute){
    $('#panel').append('<input class="range-slider" type="range">');
    $('.range-slider').attr({
        max: 12,
        min: 1,
        value: 0,
        step: 1
    });
    $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
    $('#panel').append('<button class="skip" id="forward">Skip</button>');
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
            if(attribute.indexOf(month)>-1){
                found = true;
                break;
            }
        }
    if (found){
        attributes.push(attribute);
    }
    };
    console.log(attributes);
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
        }
    });
};

$(document).ready(createMap)