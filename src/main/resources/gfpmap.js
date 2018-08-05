_map.getLayers().forEach(function (lyr) {
    // noinspection JSAnnotator
    // lyr.set("displayInLayerSwitcher",false);
    _map.getLayers().remove(lyr);
});

var _wkt_format = new ol.format.WKT();
var _geojson_format = new ol.format.GeoJSON();
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


////
//select interaction
// select interaction working on "click"
var selectClick = new ol.interaction.Select({
    condition: ol.events.condition.click
});

function setEnableSelect() {
    _map.addInteraction(selectClick);
    selectClick.on('select', function(e) {
       // var res = '&nbsp;' +
       //     +
       //      ' selected features (last operation selected ' + e.selected.length +
       //      ' and deselected ' + e.deselected.length + ' features)';
        //
        var fs=[]

       for(var i=0;i<e.target.getFeatures().getLength();i++){
           if(!e.target.getFeatures().array_[i].getId()){
               e.target.getFeatures().array_[i].setId(i);
           }
           fs.push( e.target.getFeatures().array_[i]);
       }
        var obj = _geojson_format.writeFeatures(fs);
        console.log(JSON.stringify(obj));


        //perform wms select


        var viewResolution = /** @type {number} */ (_view.getResolution());
    var url = wmsquerylayer.getGetFeatureInfoUrl(
        evt.coordinate, viewResolution, 'EPSG:3857',
        {'INFO_FORMAT': 'application/json'});

    if (url) {

        $.ajax(url).then(function(response) {
            selected_feature_source.clear();
            var geojsonFormat = new ol.format.GeoJSON();
            var features = geojsonFormat.readFeatures(response,
                {featureProjection: 'EPSG:3857'});
            selected_feature_source.addFeatures(features);
        });
    }

    });
}

var wmsquerylayer;

function setwmsquerylayer(url,workspace,layer) {
     wmsquerylayersource = new ol.source.TileWMS({
        url:url ,
        params: {'LAYERS':workspace+":"+layer , 'TILED': true},
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    });


     wmsquerylayer = new ol.layer.Tile({
        source: wmsquerylayersource,
        title:'wmsquery',
        noSwitcherDelete:true,
        allwaysOnTop:false,
    });
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



////start of background

var background_base_url='http://127.0.0.1:8000';
var back_sattlite=    new ol.layer.Tile({
    title: "آفلاین ماهواره ای",
    baseLayer: true,
    displayInLayerSwitcherImage:true,
    displayInLayerSwitcher:false,

    logo:background_base_url+'geosuite/api/mbtile/sattlite/0/0/0',

    source: new ol.source.XYZ({
        url: background_base_url+'/geosuite/api/mbtile/sattlite/{z}/{x}/{y}'
    })
});
var back_road=    new ol.layer.Tile({
    title: "آفلاین معابر",
    baseLayer: true,
    displayInLayerSwitcherImage:true,
    displayInLayerSwitcher:false,
    logo:background_base_url+'/geosuite/api/mbtile/road/0/0/0',

    source: new ol.source.XYZ({
        url: background_base_url+'/geosuite/api/mbtile/road/{z}/{x}/{y}'
    })
});



function setbackgrounmap(type) {
    var params;
    if(!type|| type=='nobase'){
        back_sattlite.setVisible(false);
        back_road.setVisible(false);
    }


    var source;
    switch (type){
        case "street":
            back_road.setVisible(true);


            break;
        case "hybrid":
            back_sattlite.setVisible(true);

            break;

        default:

            break
    }
    // back.setSource(source)
}
ol.control.LayerSwitcherImage.prototype.drawList = function(ul, layers)
{	var self = this;
    var setVisibility = function(e)
    {	e.preventDefault();
        var l = $(this).data("layer");
        self.switchLayerVisibility(l,layers);
        if (e.type=="touchstart") $(self.element).addClass("ol-collapsed");
    };
    ul.css("height","auto");
    layers.forEach(function(layer)
    {	if (layer.get("displayInLayerSwitcherImage"))
    {	var prev = layer.getPreview ? layer.getPreview([0,0],150000) : ["none"];
        var d = $("<li>").addClass("ol-imgcontainer")
            .data ('layer', layer)
            .click (setVisibility)
            .on ("touchstart", setVisibility);
        if (layer.getVisible()) d.addClass("select");
        for (var k=0; k<prev.length; k++)
        {	$("<img>").attr('src', prev[k])
            .appendTo(d);
        }
        $("<p>").text(layer.get("title") || layer.get("name")).appendTo(d);
        if (self.testLayerVisibility(layer)) d.addClass("ol-layer-hidden");
        d.appendTo(ul);
    }
    });
};
_map.addControl (new ol.control.LayerSwitcherImage());

//end of backgroun layer



//start of layer switcher


_map.getLayers().forEach(function (lyr) {
    // noinspection JSAnnotator
    if(!lyr.get("displayInLayerSwitcher"))
        lyr.set("displayInLayerSwitcher",false);
    // _map.getLayers().remove(lyr);
});


/** Render a list of layer
 * @param {elt} element to render
 * @layers {Array{ol.layer}} list of layer to show
 * @api stable
 */
ol.control.LayerSwitcher.prototype.drawList = function(ul, collection)
{	var self = this;
    var layers = collection.getArray();
    var setVisibility = function(e)
    {	e.stopPropagation();
        e.preventDefault();
        var l = $(this).parent().parent().data("layer");
        self.switchLayerVisibility(l,collection);
    };
    function moveLayer (l, layers, inc)
    {
        for (var i=0; i<layers.getLength(); i++)
        {	if (layers.item(i) === l)
        {	layers.remove(l);
            layers.insertAt(i+inc, l);
            return true;
        }
            if (layers.item(i).getLayers && moveLayer (l, layers.item(i).getLayers(), inc)) return true;
        }
        return false;
    };
    function moveLayerUp(e)
    {	e.stopPropagation();
        e.preventDefault();
        moveLayer($(this).closest('li').data("layer"), self.map_.getLayers(), +1);
    };
    function moveLayerDown(e)
    {	e.stopPropagation();
        e.preventDefault();
        moveLayer($(this).closest('li').data("layer"), self.map_.getLayers(), -1);
    };
    function onInfo(e)
    {	e.stopPropagation();
        e.preventDefault();
        self.oninfo($(this).closest('li').data("layer"));
    };
    function zoomExtent(e)
    {	e.stopPropagation();
        e.preventDefault();
        if (self.onextent) self.onextent($(this).closest('li').data("layer"));
        else self.map_.getView().fit ($(this).closest('li').data("layer").getExtent(), self.map_.getSize());
    };
    function removeLayer(e)
    {	e.stopPropagation();
        e.preventDefault();
        var li = $(this).closest("ul").parent();
        if (li.data("layer"))
        {	li.data("layer").getLayers().remove($(this).closest('li').data("layer"));
            if (li.data("layer").getLayers().getLength()==0 && !li.data("layer").get('noSwitcherDelete'))
            {	removeLayer.call($(".layerTrash", li), e);
            }
        }
        else self.map_.removeLayer($(this).closest('li').data("layer"));
    };
    // Add the layer list
    for (var i=layers.length-1; i>=0; i--)
    {	var layer = layers[i];
        if (!self.displayInLayerSwitcher(layer)) continue;
        var li = $("<li>").addClass((layer.getVisible()?"visible ":" ")+(layer.get('baseLayer')?"baselayer":""))
            .data("layer",layer).appendTo(ul);
        var layer_buttons = $("<div>").addClass("ol-layerswitcher-buttons").appendTo(li);
        var d = $("<div>").addClass('li-content').appendTo(li);
        if (!this.testLayerVisibility(layer)) d.addClass("ol-layer-hidden");
        // Visibility
        $("<input>")
            .attr('type', layer.get('baseLayer') ? 'radio' : 'checkbox')
            .attr("checked",layer.getVisible())
            .on ('click', setVisibility)
            .appendTo(d);
        // Label
        $("<label>").text(layer.get("title") || layer.get("name")||"بدون نام")
            .attr('title', layer.get("title") || layer.get("name"))
            .on ('click', setVisibility)
            .attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false)
            .appendTo(d);
        //  up/down
        if (this.reordering)
        {	if ( (i<layers.length-1 && (layer.get("allwaysOnTop") || !layers[i+1].get("allwaysOnTop")) )
            || (i>0 && (!layer.get("allwaysOnTop") || layers[i-1].get("allwaysOnTop")) ) )
        {	$("<div>").addClass("layerup")
            .on ("mousedown touchstart", {self:this}, this.dragOrdering_ )
            .attr("title", this.tip.up)
            .appendTo(layer_buttons);
        }
        }
        // Show/hide sub layers
        if (layer.getLayers)
        {	var nb = 0;
            layer.getLayers().forEach(function(l)
            {	if (self.displayInLayerSwitcher(l)) nb++;
            });
            if (nb)
            {	$("<div>").addClass(layer.get("openInLayerSwitcher") ? "collapse-layers" : "expend-layers" )
                .click(function()
                {	var l = $(this).closest('li').data("layer");
                    l.set("openInLayerSwitcher", !l.get("openInLayerSwitcher") )
                })
                .attr("title", this.tip.plus)
                .appendTo(layer_buttons);
            }
        }
        // $("<div>").addClass("ol-separator").appendTo(layer_buttons);
        // Info button
        if (this.oninfo)
        {	$("<div>").addClass("layerInfo")
            .on ('click', onInfo)
            .attr("title", this.tip.info)
            .appendTo(layer_buttons);
        }
        // Layer remove
        if (this.hastrash && !layer.get("noSwitcherDelete"))
        {	$("<div>").addClass("layerTrash")
            .on ('click', removeLayer)
            .attr("title", this.tip.trash)
            .appendTo(layer_buttons);
        }
        // Layer extent
        if (this.hasextent && layers[i].getExtent())
        {	var ex = layers[i].getExtent();
            if (ex.length==4 && ex[0]<ex[2] && ex[1]<ex[3])
            {	$("<div>").addClass("layerExtent")
                .on ('click', zoomExtent)
                .attr("title", this.tip.extent)
                .appendTo(layer_buttons);
            }
        }
        // Progress
        if (this.show_progress && layer instanceof ol.layer.Tile)
        {	var p = $("<div>")
            .addClass("layerswitcher-progress")
            .appendTo(d);
            this.setprogress_(layer);
            layer.layerswitcher_progress = $("<div>").appendTo(p);
        }
        // Opacity
        var opacity = $("<div>").addClass("layerswitcher-opacity")
            .on("click", function(e)
            {	e.stopPropagation();
                e.preventDefault();
                var x = e.pageX
                    || (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].pageX)
                    || (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].pageX);
                var dx = Math.max ( 0, Math.min( 1, (x - $(this).offset().left) / $(this).width() ));
                $(this).closest("li").data('layer').setOpacity(dx);
            })
            .appendTo(d);
        $("<div>").addClass("layerswitcher-opacity-cursor")
            .on("mousedown touchstart", { self: this }, self.dragOpacity_ )
            .css ('left', (layer.getOpacity()*100)+"%")
            .appendTo(opacity);
        // Percent
        $("<div>").addClass("layerswitcher-opacity-label")
            .text(Math.round(layer.getOpacity()*100))
            .appendTo(d);
        // Layer group
        if (layer.getLayers)
        {	li.addClass('ol-layer-group');
            if (layer.get("openInLayerSwitcher")===true)
            {	this.drawList ($("<ul>").appendTo(li), layer.getLayers());
            }
        }
        else if (layer instanceof ol.layer.Vector) li.addClass('ol-layer-vector');
        else if (layer instanceof ol.layer.VectorTile) li.addClass('ol-layer-vector');
        else if (layer instanceof ol.layer.Tile) li.addClass('ol-layer-tile');
        else if (layer instanceof ol.layer.Image) li.addClass('ol-layer-image');
        else if (layer instanceof ol.layer.Heatmap) li.addClass('ol-layer-heatmap');
    }
    if (ul==this.panel_) this.overflow();
};
var switcher = new ol.control.LayerSwitcher(
    {	target:$(".layerSwitcher").get(0),
        // displayInLayerSwitcher: function (l) { return false; },
        show_progress:true,
        extent: true,
        trash: true,
        oninfo: function (l)
        {
            if(l.get("bbox_"))
                _map.getView().fit(l.get("bbox_"), {size:_map.getSize(), padding: [15, 0, 0, 0],duration: 2000});
            var ltype=l.get("type_");
            if(ltype){

                switch (ltype){
                    case 'wms':


                    case 'wfs':

                }
            }

        }
    });

_map.addControl (switcher);

//end of layer switcher

// _map.on('singleclick', function(evt) {
//     var viewResolution = /** @type {number} */ (_view.getResolution());
//
//     var url = gaswmssource.getGetFeatureInfoUrl(
//         evt.coordinate, viewResolution, 'EPSG:3857',
//         {'INFO_FORMAT': 'application/json'});
//
//
//     if (url) {
//
//         $.ajax(url).then(function(response) {
//             selected_feature_source.clear();
//             var geojsonFormat = new ol.format.GeoJSON();
//             var features = geojsonFormat.readFeatures(response,
//                 {featureProjection: 'EPSG:3857'});
//             selected_feature_source.addFeatures(features);
//         });
//     }
//
//
//
// });


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





function addFeaturesToVector(wkt, vectorlayer,type,reproject) {
    var features;
    if(type){
       switch (type){

           case "geojson":
               if(reproject){
                   features = _geojson_format.readFeatures(wkt, {
                       dataProjection: 'EPSG:4326',
                       featureProjection: 'EPSG:3857'
                   });
               }else{
                   features = _geojson_format.readFeatures(wkt);
               }


               break;
           case "wkt":

               if(reproject){
                   features = _wkt_format.readFeature(wkt, {
                       dataProjection: 'EPSG:4326',
                       featureProjection: 'EPSG:3857'
                   });
               }
               else
                   {
                   features = _wkt_format.readFeature(wkt);
               }
               break;

       }


    }


    if(vectorlayer&&features)
        _selected_feature_source.addFeatures(features);

    return features;
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
///ol-e globe
//ov.setCenter([260516, 6253858]);

// New control on the map
var ov = new ol.control.Globe(
    {	layers: [back_road,back_sattlite],
        follow: true,
        // align: 'right',
        panAnimation: "elastic"
    });
// _map.addControl(ov);

function DisableGlobe() {
    try{
        _map.removeControl(ov);

    }catch (e){

    }
}


///end of globe



///
// TODO: zoom to layer


var _layers_bbox=[];
function isInArray(value, array) {
    return array.indexOf(value) > -1;
}
function getlayersbbox(gaswmslayer, url,layer) {
    var extent;
    for (var i=0, len = _layers_bbox.length; i<len; i++) {
        var layerobj = _layers_bbox[i];
        if (layerobj.name == layer) {
            extent = layerobj.extent;
            break;
        }
    }

    if(extent){
        gaswmslayer.set("bbox_",extent)
    }else{

            var url = url+'?request=GetCapabilities&service=WMS&version=1.1.1';
            var parser = new ol.format.WMSCapabilities();
            // console.log("layer extent url is " + url);
            var jqxhr = $.ajax( {
                crossDomain:true,
                url:url,
            } )
                .done(function(response ) {
                    var result = parser.read(response);
                    var Layers = result.Capability.Layer.Layer;

                    for (var i=0, len = Layers.length; i<len; i++) {
                        var layerobj = Layers[i];
                        var layer_ = {name:layerobj.Name, extent:layerobj.BoundingBox[0].extent};
                       if(!isInArray(layer_,_layers_bbox)){
                           _layers_bbox.push(layer_);
                       }

                        if (layerobj.Name == layer) {
                            extent = layerobj.BoundingBox[0].extent;
                            break;
                        }
                    }
                    if(!extent){
                        console.log("could not find respurce " );
                        return;
                    }

                    gaswmslayer.set("bbox_",extent)
                })
                .fail(function() {
                    console.log( "error" );
                })
                .always(function() {
                    console.log( "complete" );
                });
    }
}


/////JSMAPVIEW wrapper functions
JSMapView.prototype.setDisableGlobe=function () {
    DisableGlobe();
}

JSMapView.prototype.setEnableGlobe=function () {
    DisableGlobe();
    _map.addControl(ov);
}




JSMapView.prototype.addlayer=function (type,url,workspace,layer,minres,title,noSwitcherDelete,allwaysOnTop) {
    switch (type){

        case "wms":
            var gaswmssource = new ol.source.TileWMS({
                url:url ,
                params: {'LAYERS':workspace+":"+layer , 'TILED': true},
                serverType: 'geoserver',
                // crossOrigin: 'anonymous'
            });


            var gaswmslayer = new ol.layer.Tile({
                source: gaswmssource,
                title:title,
                noSwitcherDelete:noSwitcherDelete,
                allwaysOnTop:allwaysOnTop,
            });
            if(minres){
                gaswmslayer.minResolution=minres
            }
            _map.addLayer(gaswmslayer);
            gaswmslayer.set("type_",'wms');
            getlayersbbox(gaswmslayer,url,layer);

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

/**
 * Set setBackgroundMapBaseURL first and then call this function
 * @param type map type
 */
JSMapView.prototype.setBackgrounMap = function (type) {
    setbackgrounmap(type);
};

JSMapView.prototype.setBackgroundMapBaseURL = function (baseurl) {
    background_base_url=baseurl;
    back_road=    new ol.layer.Tile({
        title: "آفلاین معابر",
        baseLayer: true,
        displayInLayerSwitcherImage:true,
        displayInLayerSwitcher:false,
        logo:background_base_url+'/geosuite/api/mbtile/road/0/0/0',

        source: new ol.source.XYZ({
            url: background_base_url+'/geosuite/api/mbtile/road/{z}/{x}/{y}'
        })
    });

    back_sattlite=    new ol.layer.Tile({
        title: "آفلاین ماهواره ای",
        baseLayer: true,
        displayInLayerSwitcherImage:true,
        displayInLayerSwitcher:false,

        logo:background_base_url+'geosuite/api/mbtile/sattlite/0/0/0',

        source: new ol.source.XYZ({
            url: background_base_url+'/geosuite/api/mbtile/sattlite/{z}/{x}/{y}'
        })
    });

    ov = new ol.control.Globe(
        {	layers: [back_road,back_sattlite],
            follow: true,
            // align: 'right',
            panAnimation: "elastic"
        });

    try {
        _map.removeLayer(back_sattlite);

    }catch (e){}
    try {
    _map.removeLayer(back_road);
    }catch (e){}


    _map.addLayer(back_sattlite);
    _map.addLayer(back_road);
    back_road.setVisible(false);
};


JSMapView.prototype.addFeaturesToVector = function (data,cleanall,type,reproject) {
    if(cleanall){
        clearVectorLayerFeatures(_selectedfeaturelayer);
    }
    addFeaturesToVector(data,_selectedfeaturelayer,type,reproject);
};


JSMapView.prototype.setEnableSelect = function () {
   setEnableSelect();
};
JSMapView.prototype.setWmsQueryLayer = function (url,workspace,layer) {
    setwmsquerylayer(url,workspace,layer)
};


JSMapView.prototype.addTestwms = function () {
//     console.log("add test wms");
//
//     var gaswmssource = new ol.source.TileWMS({
//         url:"http://127.0.0.1:8080/geoserver/gas/wms/" ,
//         params: {'LAYERS':'gas:GasNet_parcel', 'TILED': true},
//         serverType: 'geoserver',
//         // crossOrigin: 'anonymous'
//     });
//
//
//     var gaswmslayer = new ol.layer.Tile({
//         source: gaswmssource,
//         title:"title",
//         noSwitcherDelete:true,
//         allwaysOnTop:false,
//     });
//     console.log("add to map");
//     _map.addLayer(gaswmslayer);
//     // _map.addLayer( new ol.layer.Tile({
//     //     source: new ol.source.TileWMS({
//     //         url: "http://127.0.0.1:8080/geoserver/gas/wms/",
//     //         params: {'layers':'gas:GasNet_parcel', 'TILED': true},
//     //         serverType: 'geoserver',
//     //         crossOrigin: 'anonymous'
//     //
//     //     }),
//     //     title:"title",
//     //     noSwitcherDelete:true,
//     //     allwaysOnTop:false,
//     // }));
// //, 'TILED': true
//     getlayersbbox(gaswmslayer,"http://127.0.0.1:8080/geoserver/gas/wms","GasNet_parcel");
//
//
//     var layerWFS = new ol.layer.Vector({
//         source: new ol.source.Vector({
//             loader: function (extent) {
//                 $.ajax('http://127.0.0.1:8080/geoserver/gas/wfs', {
//                     type: 'GET',
//                     data: {
//                         service: 'WFS',
//                         version: '1.1.0',
//                         request: 'GetFeature',
//                         typename: 'GasNet_parcel',
//                         srsname: 'EPSG:3857',
//                         outputFormat: 'application/json',
//                         bbox: extent.join(',') + ',EPSG:3857'
//                     }
//                 }).done(function (response) {
//                     layerWFS
//                         .getSource()
//                         .addFeatures(new ol.format.GeoJSON()
//                             .readFeatures(response));
//                 });
//             },
//             strategy: ol.loadingstrategy.bbox,
//             projection: 'EPSG:3857'
//         })
//     });

   // _map.addLayer(layerWFS);
    // var layerWFS = new ol.layer.Vector({
    //     source: new ol.source.Vector({
    //         loader: function (extent) {
    //             $.ajax('http://127.0.0.1:8080/geoserver/gas/wfs', {
    //                 type: 'GET',
    //                 data: {
    //                     service: 'WFS',
    //                     version: '1.1.0',
    //                     request: 'GetFeature',
    //                     typename: 'GasNet_parcel',
    //                     srsname: 'EPSG:3857',
    //                     outputFormat: 'text/javascript',
    //                     bbox: extent.join(',') + ',EPSG:3857'
    //                 },
    //                 dataType: 'jsonp',
    //                 jsonpCallback:'callback:loadFeatures',
    //                 jsonp: 'format_options'
    //             })
    //         },
    //         strategy: ol.loadingstrategy.bbox,
    //         projection: 'EPSG:3857'
    //     })
    // });
    //
    // window.loadFeatures = function (response) {
    //     layerWFS
    //         .getSource()
    //         .addFeatures(new ol.format.GeoJSON().readFeatures(response));
    // };

    set_editlayer('gas:GasNet_parcel','http://127.0.0.1:8080',1);
};

var formatGML = new ol.format.GML({
    featureNS: 'http://127.0.0.1:8080/geoserver/gas/ows',
    featureType: 'gas:GasNet_riser',
    srsName: 'EPSG:3857'
});


var sourceWFS;
var layerWFS;
function set_editlayer(featureNS,url,maxres,title) {

    alert("set editlayer")
    formatGML.featureType=featureNS;//'gas:GasNet_riser';
    sourceWFS = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: function(extent) {
            return url+'/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&' +
                'typeName='+featureNS+'&outputFormat=application/json' +
                '&bbox=' + extent.join(',') + ',EPSG:3857';
        },
        strategy: ol.loadingstrategy.bbox,
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    });
    layerWFS = new ol.layer.Vector({
        source: sourceWFS,
        maxResolution:maxres,
        title:title,
        noSwitcherDelete:true,
        allwaysOnTop:true,
    });
    try{
        _map.removeLayer(layerWFS);
    }catch (e){}

    layerWFS.set("type_",'wfs');
    _map.addLayer(layerWFS);
    var interactionSnap = new ol.interaction.Snap({
        source: layerWFS.getSource()
    });
    _map.addInteraction(interactionSnap);

    getlayersbbox(layerWFS,"http://127.0.0.1:8080/geoserver/gas/wms","GasNet_parcel");
}

function remove_edit_layer() {
    try{
        _map.removeLayer(layerWFS);
    }catch (e){}
}
