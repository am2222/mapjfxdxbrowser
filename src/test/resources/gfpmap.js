
var _wkt_format = new ol.format.WKT();
var _4326_projection = new ol.proj.Projection({code: "EPSG:4326"});
var _3857_projection = new ol.proj.Projection({code: "EPSG:3857"});

var fill = new ol.style.Fill({
    color: [180, 0, 0, 0.3]
});

var stroke = new ol.style.Stroke({
    color: [180, 0, 0, 1],
    width: 1
});

var style = new ol.style.Style({
    image: new ol.style.Circle({
        fill: fill,
        stroke: stroke,
        radius: 8
    }),
    fill: fill,
    stroke: stroke
});

var _selected_feature_source = new ol.source.Vector();
var _selectedfeaturelayer = new ol.layer.Vector({
            source: _selected_feature_source ,
            style:style
         });
// _selectedfeaturelayer.setStyle(style);
_map.addLayer(_selectedfeaturelayer);



function flyTo(location, done) {
    var duration = 2000;
    var zoom = view.getZoom();
    var parts = 2;
    var called = false;
    function callback(complete) {
        --parts;
        if (called) {
            return;
        }
        if (parts === 0 || !complete) {
            called = true;
            done(complete);
        }
    }
    view.animate({
        center: location,
        duration: duration
    }, callback);
    view.animate({
        zoom: zoom - 1,
        duration: duration / 2
    }, {
        zoom: zoom,
        duration: duration / 2
    }, callback);
}


////start pdf
function print(dim,resolution) {
    $('#print').disable();
    document.body.style.cursor = 'progress';

    // var format = document.getElementById('format').value;
    // var resolution = document.getElementById('resolution').value;
    // var dim = dims[format];
    var width = Math.round(dim[0] * resolution / 25.4);
    var height = Math.round(dim[1] * resolution / 25.4);
    var size = /** @type {ol.Size} */ (_map.getSize());
    var extent = _map.getView().calculateExtent(size);

    var source = back.getSource();

    var tileLoadStart = function () {
        ++loading;
    };

    var tileLoadEnd = function () {
        ++loaded;
        if (loading === loaded) {
            var canvas = this;
            window.setTimeout(function () {
                loading = 0;
                loaded = 0;
                var data = canvas.toDataURL('image/png');
                // var pdf = new jsPDF('landscape', undefined, format);
                // pdf.addImage(data, 'JPEG', 0, 0, dim[0], dim[1]);
                // pdf.save('map.pdf');
                source.un('tileloadstart', tileLoadStart);
                source.un('tileloadend', tileLoadEnd, canvas);
                source.un('tileloaderror', tileLoadEnd, canvas);
                _map.setSize(size);
                _map.getView().fit(extent);
                _map.renderSync();

                document.body.style.cursor = 'auto';
            }, 100);
        }
    };
    _map.once('postcompose', function (event) {
        source.on('tileloadstart', tileLoadStart);
        source.on('tileloadend', tileLoadEnd, event.context.canvas);
        source.on('tileloaderror', tileLoadEnd, event.context.canvas);
    });

    _map.setSize([width, height]);
    _map.getView().fit(extent);
    _map.renderSync();
}
//// end pdf export




var back=    new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'http://127.0.0.1:8000/geosuite/api/mbtile/sattlite/{z}/{x}/{y}'
    })
});

_map.addLayer(back);



//////////////measure

var measute_source = new ol.source.Vector();

var measure_vector = new ol.layer.Vector({
    source: measute_source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});

_map.addLayer(measure_vector)
/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var sketch;


/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;

/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;


/**
 * Message to show when the user is drawing a polygon.
 * @type {string}
 */
var continuePolygonMsg = 'برای ادامه رسم چند ضلعی کلیک کنید';


/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'برای ادامه رسم خط کلیک کنید';


/**
 * Handle pointer move.
 * @param {ol.MapBrowserEvent} evt The event.
 */
var pointerMoveHandler = function(evt) {
    if (evt.dragging) {
        return;
    }
    if(!helpTooltipElement)
        return;
    /** @type {string} */
    var helpMsg = 'برای شروع اندازه گیری کلیک کنید';

    if (sketch) {
        var geom = (sketch.getGeometry());
        if (geom instanceof ol.geom.Polygon) {
            helpMsg = continuePolygonMsg;
        } else if (geom instanceof ol.geom.LineString) {
            helpMsg = continueLineMsg;
        }
    }


    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);

    helpTooltipElement.classList.remove('hidden');
};



var draw; // global so we can remove it later

/**
 * Format length output.
 * @param {ol.geom.LineString} line The line.
 * @return {string} The formatted length.
 */
var formatLength = function(line) {
    var length = ol.Sphere.getLength(line);
    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};


/**
 * Format area output.
 * @param {ol.geom.Polygon} polygon The polygon.
 * @return {string} Formatted area.
 */
var formatArea = function(polygon) {
    var area = ol.Sphere.getArea(polygon);
    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
    }
    return output;
};

function addMeasureInteraction(type) {
    // {#var type = (type == 'area' ? 'Polygon' : 'LineString');#}
    draw = new ol.interaction.Draw({
        source: measute_source,
        type: type,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.7)'
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                })
            })
        })
    });
    _map.addInteraction(draw);

    createMeasureTooltip();
    createHelpTooltip();

    var listener;
    draw.on('drawstart',
        function(evt) {
            // set sketch
            sketch = evt.feature;

            /** @type {ol.Coordinate|undefined} */
            var tooltipCoord = evt.coordinate;

            listener = sketch.getGeometry().on('change', function(evt) {
                var geom = evt.target;
                var output;
                if (geom instanceof ol.geom.Polygon) {
                    output = formatArea(geom);
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                }
                measureTooltipElement.innerHTML = output;
                measureTooltip.setPosition(tooltipCoord);
            });
        }, this);

    draw.on('drawend',
        function() {
            measureTooltipElement.className = 'tooltip tooltip-static';
            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            ol.Observable.unByKey(listener);
        }, this);
}





function setbackgrounmap(type) {
    var params;
    if(!type|| type=='nobase')
        back.setVisible(false);
    else
        back.setVisible(true);

    var source;
    switch (type){
        case "street":
            source= new ol.source.XYZ({
                url: 'http://127.0.0.1:8000/geosuite/api/mbtile/Road/{z}/{x}/{y}'
            })

            // params = {'url': 'http://127.0.0.1:8000/geosuite/api/mbtile/Road/{z}/{x}/{y}'};


        // {#back.source=googleroad;#}
            break;
        case "hybrid":
            source= new ol.source.XYZ({
                url: 'http://127.0.0.1:8000/geosuite/api/mbtile/sattlite/{z}/{x}/{y}'
            })

            // params ={'url': 'http://127.0.0.1:8000/geosuite/api/mbtile/sattlite/{z}/{x}/{y}'};
        // {#back.source=googlehybrid;#}
            break;

        default:

            break
    }
    back.setSource(source)
}



/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
    if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });
    _map.addOverlay(helpTooltip);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    _map.addOverlay(measureTooltip);
}


/**
 * Let user change the geometry type.
 */

function measure (type) {
    clearmesure();
    addMeasureInteraction(type);
};
function clearmesure() {
    _map.on('pointermove', pointerMoveHandler);

    _map.getViewport().addEventListener('mouseout', function() {
        if(helpTooltipElement)
            helpTooltipElement.classList.add('hidden');
    });



    measute_source.clear();
    _map.getOverlays().clear();
    _map.removeInteraction(draw);
}

///endof mesure



function clearVectorLayerFeatures(vectorLayer) {
    if(!vectorLayer)
        return;

    var features = vectorLayer.getSource().getFeatures();
    // features.forEach((feature) => {
    //     vectorLayer.getSource().removeFeature(feature);
    // });
    for (var i=0;i<features.length;i++){
        vectorLayer.getSource().removeFeature(features[i]);

    }
}


function zoomToVectorLayer(vectorLayer,duration) {
    if(!vectorLayer)
        return;

    if(!duration)
        duration=2500;
    try {
        _map.getView().fit(vectorLayer.getSource().getExtent(), {duration: duration});
    }catch (e){
        alert(e);
    }
}





function addFeatureToVector(wkt, vectorlayer) {
    var feature = _wkt_format.readFeature(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });

    // feature.getGeometry().transform(_4326_projection, _3857_projection);

    if(vectorlayer)
        _selected_feature_source.addFeature(feature);

    return feature;
}



JSMapView.prototype.addlayer=function (type,url,layer,minres) {
    switch (type){

        case "wms":
            var gaswmssource = new ol.source.TileWMS({
                url:url ,
                params: {'LAYERS':layer , 'TILED': true},
                serverType: 'geoserver',
                crossOrigin: 'anonymous'
            });


            var gaswmslayer = new ol.layer.Tile({
                source: gaswmssource
            });
            if(minres){
                gaswmslayer.minResolution=minres
            }
            _map.addLayer(gaswmslayer);


            case "wfs":




    }
}




JSMapView.prototype.setStartMeasure=function (type) {
    measure(type);
}



JSMapView.prototype.addwktfeature = function (wkt,cleanall) {
   if(cleanall){
       clearVectorLayerFeatures(_selectedfeaturelayer);
   }
   addFeatureToVector(wkt,_selectedfeaturelayer);
};

JSMapView.prototype.zoomtoOverlayLayer = function () {
    zoomToVectorLayer(_selectedfeaturelayer,null);
};

JSMapView.prototype.setBackgrounMap = function (type) {
    setbackgrounmap(type);
};










