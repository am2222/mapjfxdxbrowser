_map.getLayers().forEach(function (lyr) {
    // noinspection JSAnnotator
    // lyr.set("displayInLayerSwitcher",false);
    _map.getLayers().remove(lyr);
});

var _wkt_format = new ol.format.WKT();
var _geojson_format = new ol.format.GeoJSON();
var _4326_projection = new ol.proj.Projection({code: "EPSG:4326"});
var _3857_projection = new ol.proj.Projection({code: "EPSG:3857"});




////start of background

var background_base_url='';
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

_map.addLayer(back_sattlite);
_map.addLayer(back_road);

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
            displayInLayerSwitcher:false,
            style:style
         });
// _selectedfeaturelayer.setStyle(style);
_map.addLayer(_selectedfeaturelayer);


////turf.js section start


function getturf_style(feature, resolution)
{

    var type="nan";
    color= '#a1bff2';
    stcolor= '#a5d6f2';
    try{
        type= feature.get("type")
    }catch (e){}
    switch (type){
        case 'mid':
            color= '#f2372f';
            stcolor= '#f22b76';
            break;
        case 'start':
            color= '#51dd17';
            stcolor= '#3ef226';
            break;

        case 'end':
            color= '#51dd17';
            stcolor= '#3ef226';
            break;

        case 'ancher':
            color= '#a1bff2';
            stcolor= '#a5d6f2';
            break;
    }

    return new ol.style.Style({
        image: new ol.style.Circle({
            fill: new ol.style.Fill({
                color:color
            }),
            stroke: new ol.style.Stroke({
                color: stcolor,
                width: 1
            }),
            radius: 3
        }),
        fill: new ol.style.Fill({
            color: color
        }),
        stroke: new ol.style.Stroke({
            color: stcolor,
            width: 1
        })
    });

};


var turf_source = new ol.source.Vector();

var turf_vectorLayer = new ol.layer.Vector({
    source: turf_source,
    displayInLayerSwitcher:false,
    style:getturf_style
});


_map.addLayer(turf_vectorLayer);

//turf helpers
function fromoltoturf(olobject) {
    // convert to a turf.js feature
    var turfo= _geojson_format.writeFeatureObject(olobject);
   return turf.toWgs84(turfo,{mutate:true});
}

function fromturftool(turfobject,ismidpoint) {
    // convert the generated point to a OpenLayers feature
    var marker = _geojson_format.readFeature(turfobject);
    marker.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    if(ismidpoint){
        marker.set("type","mid");
    }else{
        marker.set("type","ancher")
    }
    turf_source.addFeature(marker);
    turf_source.changed();
    return marker;
}

function cleanTurfSource() {
    turf_source.forEachFeature(new function (f) {
        turf_source.removeFeature(f)
    });
    turf_source.changed();
}


////trufjs end




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
//var selectedFeatures = selectClick.getFeatures();
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

    if(_flag_enable_select){

        var obj = _geojson_format.writeFeatures(fs);
        var geojson=JSON.stringify(obj);
        // console.log(geojson);
        var wgs=cToWGS84([e.mapBrowserEvent.coordinate[1], e.mapBrowserEvent.coordinate[0]]);
        jsMapView.getJavaConnector().singleClickAtVectorFeature(geojson,wgs[0],wgs[1])
    }

    // this.javaConnector.singleClickAtVectorFeature(geojson,coordinate[1], coordinate[0]);
    // _javaConnector.singleClickAtVectorFeature(geojson);
    //perform wms select
    // if(!wmsquerylayersource)
    //     return;

    // var viewResolution = /** @type {number} */ (_view.getResolution());
    // var url = wmsquerylayersource.getGetFeatureInfoUrl(
    //     e.mapBrowserEvent.coordinate, viewResolution, 'EPSG:3857',
    //     {'INFO_FORMAT': 'application/json'});
    //
    // get_feature_onclick(url,fs);

});

function setEnableSelect() {
    _map.addInteraction(selectClick);
    _flag_enable_select=true;
}
function setDisableSelect() {
    try{
        _map.removeInteraction(selectClick);
    }catch (e){}
    _flag_enable_select=false;
}



// clear selection when drawing a new box and when clicking on the map
// dragBox.on('boxstart', function() {
//     selectedFeatures.clear();
// });
function setEnableSelectByBox() {
    removeInteractions();
    _map.addInteraction(dragBox);
}


function removeInteractions() {
    //remove select interaction
    try{
        _map.removeInteraction(selectClick);
    }catch (e){}
    _flag_enable_select=false;

    //remove measure interaction and other parts
    _map.on('pointermove', pointerMoveHandler);

    _map.getViewport().addEventListener('mouseout', function() {
        if(helpTooltipElement)
            helpTooltipElement.classList.add('hidden');
    });

     measute_source.clear();
    _map.getOverlays().clear();
    _map.removeInteraction(draw);

}



function get_feature_onclick(url,fs) {
    if (url) {

        $.ajax({
            crossDomain:true,
            url:url,
        }).then(function(response) {
            // _selected_feature_source.clear();
            //var geojsonFormat = new ol.format.GeoJSON();
            var features = _geojson_format.readFeatures(response,
                {featureProjection: 'EPSG:3857'});

            // _selected_feature_source.addFeatures(features);
        });
    }
}

////wms query layer

var wmsquerylayer;
var wmsquerylayersource;

JSMapView.prototype.setwmsquerylayer  = function(url,workspace,layer) {
     wmsquerylayersource = new ol.source.TileWMS({
        url:url ,
        params: {'LAYERS':workspace+":"+layer , 'TILED': true},
        serverType: 'geoserver',
        // crossOrigin: 'anonymous'
    });


     wmsquerylayer = new ol.layer.Tile({
        source: wmsquerylayersource,
        title:'wmsquery',
        noSwitcherDelete:true,
        allwaysOnTop:false,
    });


}


//end of wms query layer
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
    displayInLayerSwitcher:false,
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
    removeInteractions();
    addMeasureInteraction(type);
};


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
    vectorLayer.getSource().changed();
}


function zoomToVectorLayer(vectorLayer,duration) {
    if(!vectorLayer)
        return;

    if(duration>1)
        duration=1000;
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


function setlayersbbox(gaswmslayer,layer) {
    var extent;
    for (var i=0, len = _layers_bbox.length; i<len; i++) {
        var layerobj = _layers_bbox[i];
        if (layerobj.name == layer) {
            extent = layerobj.extent;
            break;
        }
    }

    if(extent) {
        gaswmslayer.set("bbox_", extent)
        return true;
    }else{
        return false;
    }
}


function getlayersbbox(gaswmslayer, url,layer) {

    if(!setlayersbbox(gaswmslayer,layer)){
            var url = url+'?request=GetCapabilities&service=WMS&version=1.1.1';
            // console.log("layer extent url is " + url);
            var jqxhr = $.ajax( {
                crossDomain:true,
                url:url,
            } )
                .done(function(response ) {

                    loadcapabilities(response);
                    setlayersbbox(gaswmslayer,layer);
                })
                .fail(function() {
                    console.log( "error" );
                })
                .always(function() {
                    console.log( "complete" );
                });
    }
}



function loadcapabilities(response) {
    var parser = new ol.format.WMSCapabilities();
    var result = parser.read(response);
    var Layers = result.Capability.Layer.Layer;


    for (var i=0, len = Layers.length; i<len; i++) {
        var layerobj = Layers[i];
        var layer_ = {name:layerobj.Name, extent:layerobj.BoundingBox[0].extent};
        if(!isInArray(layer_,_layers_bbox)){
            _layers_bbox.push(layer_);
        }
    }

}

/////JSMAPVIEW wrapper functions
JSMapView.prototype.setDisableGlobe=function () {
    DisableGlobe();
}

JSMapView.prototype.setEnableGlobe=function () {
    DisableGlobe();
    ov = new ol.control.Globe(
        {	layers: [back_road,back_sattlite],
            follow: true,
            // align: 'right',
            panAnimation: "elastic"
        });
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

   var source_road= new ol.source.XYZ({
        url: background_base_url+'/geosuite/api/mbtile/road/{z}/{x}/{y}'
    });
    var source_sattlite= new ol.source.XYZ({
        url: background_base_url+'/geosuite/api/mbtile/sattlite/{z}/{x}/{y}'
    });
    back_sattlite.setSource(source_sattlite);
    back_road.setSource(source_road);
    back_sattlite.setVisible(false);

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


JSMapView.prototype.setDisableSelect = function () {
    setDisableSelect();
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

    // set_editlayer('gas:GasNet_parcel','http://127.0.0.1:8080',1);
};


var sourceWFS;
var layerWFS;


JSMapView.prototype.remove_edit_layer =function () {
    try{
        _map.removeLayer(layerWFS);
    }catch (e){}
}


JSMapView.prototype.set_editlayer = function (featureNS,url,maxres,title,edittype) {

    console.log("set editlayer");
    // formatGML.featureType=featureNS;//'gas:GasNet_riser';
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

    var listenerKey = sourceWFS.on('change', function(e) {
        if (sourceWFS.getState() == 'ready') {

            if(enable_grid_snap)
                return;

            try{
                _map.removeInteraction(snap);
            }catch (e){}

            snap = new ol.interaction.Snap({
                source: sourceWFS
            });
            _map.addInteraction(snap);
        }
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
    // var interactionSnap = new ol.interaction.Snap({
    //     source: layerWFS.getSource()
    // });
    // _map.addInteraction(interactionSnap);

    getlayersbbox(layerWFS,"http://127.0.0.1:8080/geoserver/gas/wms","GasNet_parcel");
    enableEditorBar(layerWFS,edittype);
};


/**
 * user must provide the rsult of this query as input
 * url = 'http://127.0.0.1:8080/geoserver/gas/wms?request=GetCapabilities&service=WMS&version=1.1.1';
 * @param respond
 */
JSMapView.prototype.loadcapabilities = function (respond) {
 loadcapabilities(respond);
};

/**
 *
 * @param value
 * top
 * top-left
 * left
 *  bottom-left
 *  bottom
 *  bottom-right
 *  right
 *  top-right
 */
JSMapView.prototype.setMainbarPosition = function (value) {

    switch (value){
        case 'top':
        case 'top-left':
        case 'left':
        case 'bottom-left':
        case 'bottom':
        case 'bottom-right':
        case 'right':
        case 'top-right':
            setMainbarPosition(value);
        default:
            setMainbarPosition(_mainbarPosition);
    }
};
///start of edittor toolbar

/**
 *
 * @param value
 * top
 * top-left
 * left
 *  bottom-left
 *  bottom
 *  bottom-right
 *  right
 *  top-right
 */
_mainbarPosition='top-left';
function setMainbarPosition(value) {
    mainbar.setPosition(value);
    _mainbarPosition=value;
}

var mainbar = new ol.control.Bar();
var snapi = new ol.interaction.SnapGuides();
var snap ;
enable_grid_snap=false;

function enablesnapping(vector) {
    if(enable_grid_snap)
        return;
    //adding snap function
// The snap interaction must be added after the Modify and Draw interactions
    // in order for its map browser event handlers to be fired first. Its handlers
    // are responsible of doing the snapping.
    try{
        _map.removeInteraction(snap);
    }catch (e){}

    snap = new ol.interaction.Snap({
        source: vector.getSource()
    });

    snap.source_.addFeatures(turf_source.getFeatures())
    _map.addInteraction(snap);
}

function enableEditorBar(vector,featuretype) {



    try{
        _map.removeControl(mainbar);
    }catch (e){}
    mainbar = new ol.control.Bar();
    mainbar.setPosition(_mainbarPosition);
    _map.addControl(mainbar);

// Edit control bar
    var editbar = new ol.control.Bar(
        {	toggleOne: true,	// one control active at the same time
            group:false			// group controls together
        });
    mainbar.addControl(editbar);

    var deletefeaturebtn=new ol.control.Button(
        {	html: '<i class="fa fa-minus-circle"></i>',
            title: "حذف عارضه",
            handleClick: function()
            {
              //  _javaConnector.debug('delete feature tool activated');
                editorRemoveInteraction();
                interaction = new ol.interaction.Select();
                interaction.getFeatures().on('add', function (e) {
                    transactWFS('delete', e.target.item(0));
                    interactionSelectPointerMove.getFeatures().clear();
                    interaction.getFeatures().clear();
                });
                _map.addInteraction(interaction);


                enablesnapping(vector)

                // var features = selectCtrl.getInteraction().getFeatures();
                // if (!features.getLength()) info("Select an object first...");
                // else alert(features.getLength()+" object(s) deleted.");
                // for (var i=0, f; f=features.item(i); i++)
                // {
                //     layerWFS.getSource().removeFeature(f);
                // }
                // selectCtrl.getInteraction().getFeatures().clear();
            }
        });

    var modifyfeaturebtn=new ol.control.Button(
        {	html: '<i class="fa fa-edit"></i>',
            title: "ویرایش عارضه",
            handleClick: function()
            {
                editorRemoveInteraction();


                _map.addInteraction(edit_interactionSelect);
                interaction = new ol.interaction.Modify({
                    features: edit_interactionSelect.getFeatures()
                });
                _map.addInteraction(interaction);
               // {#map.addInteraction(interactionSnap);#}
                dirty = {};
                edit_interactionSelect.getFeatures().on('add', function (e) {
                    e.element.on('change', function (e) {
                        dirty[e.target.getId()] = true;
                    });
                });
                edit_interactionSelect.getFeatures().on('remove', function (e) {
                    var f = e.element;
                    if (dirty[f.getId()]) {
                        delete dirty[f.getId()];
                        var featureProperties = f.getProperties();
                        delete featureProperties.boundedBy;
                        var clone = new ol.Feature(featureProperties);
                        clone.setId(f.getId());
                        transactWFS('update', clone);
                    }
                });
                enablesnapping(vector)

                // var features = selectCtrl.getInteraction().getFeatures();
                // if (!features.getLength()) info("Select an object first...");
                // else alert(features.getLength()+" object(s) deleted.");
                // for (var i=0, f; f=features.item(i); i++)
                // {
                //     layerWFS.getSource().removeFeature(f);
                // }
                // selectCtrl.getInteraction().getFeatures().clear();
            }
        });

    var addfeaturebtn=new ol.control.Button(
        {	html: '<i class="fa fa-plus"></i>',
            title: "افزودن عارضه",
            handleClick: function()
            {
                editorRemoveInteraction();

                if(!featuretype)
                    return;

                switch (featuretype){
                    case 'Point':
                        interaction = new ol.interaction.Draw({
                            type: 'Point',
                            source: vector.getSource()
                        });
                        //adding snap to grid interaction
                        snapi.setDrawInteraction(interaction);
                        _map.addInteraction(snapi);
                        interaction.on('drawend', function (e) {
                            // create a unique id
                            // it is later needed to delete features
                            // give the feature this id
                            var feature = e.feature;
                            feature.set('geom', feature.getGeometry());

                            transactWFS('insert', feature);
                        });
                        _map.addInteraction(interaction);
                        // enableSnapping(vector)
                        break;

                    case 'Line':
                        interaction = new ol.interaction.Draw({
                            type: 'LineString',
                            source: vector.getSource()
                        });
                        //adding snap to grid interaction
                        snapi.setDrawInteraction(interaction);
                        _map.addInteraction(snapi);
                        _map.addInteraction(interaction);
                        interaction.on('drawend', function (e) {
                            transactWFS('insert', e.feature);
                        });
                        // enableSnapping(vector)
                        break;

                    case 'Area':
                        interaction = new ol.interaction.Draw({
                            type: 'Polygon',
                            source: vector.getSource()
                        });

                        //adding snap to grid interaction
                        if(enable_grid_snap){
                            snapi.setDrawInteraction(interaction);
                            _map.addInteraction(snapi);
                        }

                        interaction.on('drawend', function (e) {
                            transactWFS('insert', e.feature);
                        });
                        _map.addInteraction(interaction);
                        // enableSnapping(vector)
                        break;
                    default:
                        break;

                }
                enablesnapping(vector)

            }
        });


    editbar.addControl(deletefeaturebtn);
    editbar.addControl(modifyfeaturebtn);
    editbar.addControl(addfeaturebtn);

    var findpointonline=new ol.control.Button(
        {	html: '<i class="fa fa-line"></i>',
            title: "یافتن نقطه بر روی خط",
            handleClick: function()
            {
                editorRemoveInteraction();
                interaction = new ol.interaction.Draw({
                    type: 'LineString',
                    source: _selectedfeaturelayer.getSource()
                });
                //adding snap to grid interaction
                // snapi.setDrawInteraction(interaction);
                //  _map.addInteraction(snapi);
                _map.addInteraction(interaction);
                interaction.on('drawend', function (e) {
                    transactWFS('pointonline', e.feature);
                });


                enablesnapping(vector)

            }
        });

    var linebearing=new ol.control.Button(
        {	html: '<i class="fa fa-"></i>',
            title: "یافتن نقطه بر روی خط",
            handleClick: function()
            {
                editorRemoveInteraction();
                interaction = new ol.interaction.Draw({
                    type: 'LineString',
                    source: _selectedfeaturelayer.getSource()
                });
                //adding snap to grid interaction
                // snapi.setDrawInteraction(interaction);
                //  _map.addInteraction(snapi);
                _map.addInteraction(interaction);
                interaction.on('drawend', function (e) {
                    transactWFS('pointonline', e.feature);
                });


                enablesnapping(vector)

            }
        });

    editbar.addControl(findpointonline);
    editbar.addControl(linebearing);


    var sbar = new ol.control.Bar();

    sbar.addControl (new ol.control.Button(
        {	html: '<i class="fa fa-info"></i>',
            title: "Show informations",
            handleClick: function()
            {	switch (selectCtrl.getInteraction().getFeatures().getLength())
            {	case 0: alert("Select an object first...");
                    break;
                case 1:
                    var f = selectCtrl.getInteraction().getFeatures().item(0);
                    alert("Selection is a "+f.getGeometry().getType());
                    break;
                default:
                    alert(selectCtrl.getInteraction().getFeatures().getLength()+ " objects seleted.");
                    break;
            }
            }
        }));

    var selectCtrl = new ol.control.Toggle(
        {	html: '<i class="fa fa-hand-pointer"></i>',
            title: "Enable Grid Snap",
            interaction: new ol.interaction.Select (),
            bar: sbar,
            autoActivate:false,
            active:enable_grid_snap
        });

    editbar.addControl ( selectCtrl);

// Add editing tools


    var pedit = new ol.control.Toggle(
        {	html: '<i class="fa fa-map-marker" ></i>',
            title: 'Point',
            interaction: new ol.interaction.Draw
            ({	type: 'Point',
                source: vector.getSource()
            })
        });
    editbar.addControl ( pedit );

    var ledit = new ol.control.Toggle(
        {	html: '<i class="fa fa-share-alt" ></i>',
            title: 'LineString',
            interaction: new ol.interaction.Draw
            ({	type: 'LineString',
                source: vector.getSource(),
                // Count inserted points
                geometryFunction: function(coordinates, geometry)
                {   if (geometry) geometry.setCoordinates(coordinates);
                else geometry = new ol.geom.LineString(coordinates);
                    this.nbpts = geometry.getCoordinates().length;
                    return geometry;
                }
            }),
            // Options bar associated with the control
            bar: new ol.control.Bar(
                {	controls:[ new ol.control.TextButton(
                        {	html: 'undo',
                            title: "Delete last point",
                            handleClick: function()
                            {	if (ledit.getInteraction().nbpts>1) ledit.getInteraction().removeLastPoint();
                            }
                        }),
                        new ol.control.TextButton(
                            {	html: 'Finish',
                                title: "finish",
                                handleClick: function()
                                {	// Prevent null objects on finishDrawing
                                    if (ledit.getInteraction().nbpts>2) ledit.getInteraction().finishDrawing();
                                }
                            })
                    ]
                })
        });

    editbar.addControl ( ledit );

    var fedit = new ol.control.Toggle(
        {	html: '<i class="fa fa-bookmark-o fa-rotate-270" ></i>',
            title: 'Polygon',
            interaction: new ol.interaction.Draw
            ({	type: 'Polygon',
                source: vector.getSource(),
                // Count inserted points
                geometryFunction: function(coordinates, geometry)
                {   this.nbpts = coordinates[0].length;
                    if (geometry) geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
                    else geometry = new ol.geom.Polygon(coordinates);
                    return geometry;
                }
            }),
            // Options bar ssociated with the control
            bar: new ol.control.Bar(
                {	controls:[ new ol.control.TextButton(
                        {	html: 'undo',//'<i class="fa fa-mail-reply"></i>',
                            title: "undo last point",
                            handleClick: function()
                            {	if (fedit.getInteraction().nbpts>1) fedit.getInteraction().removeLastPoint();
                            }
                        }),
                        new ol.control.TextButton(
                            {	html: 'finish',
                                title: "finish",
                                handleClick: function()
                                {	// Prevent null objects on finishDrawing
                                    if (fedit.getInteraction().nbpts>3) fedit.getInteraction().finishDrawing();
                                }
                            })
                    ]
                })
        });
    editbar.addControl ( fedit );

// Add a simple push button to save features
    var save = new ol.control.Button(
        {	html: '<i class="fa fa-download"></i>',
            title: "Save",
            handleClick: function(e)
            {	var json= new ol.format.GeoJSON().writeFeatures(vector.getSource().getFeatures());
                alert(json);
            }
        });
    mainbar.addControl ( save );
}
// Main control bar




var interaction;

var interactionSelectPointerMove = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
});

var edit_interactionSelect = new ol.interaction.Select({
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f2b223',
            width:1
        })
    })
});

function editorRemoveInteraction() {
    removeInteractions();
    _map.removeInteraction(interaction);
    edit_interactionSelect.getFeatures().clear();
    _map.removeInteraction(edit_interactionSelect);
    _map.removeInteraction(snapi);
    _map.removeInteraction(snap);
}

var transactWFS = function (mode, f) {
    var node;
    var fs=[];
    fs.push(f);
    var obj = _geojson_format.writeFeatures(fs);
    var geojson=JSON.stringify(obj);
    switch (mode) {
        case 'insert':
            jsMapView.getJavaConnector().insertFeature(geojson);
            break;
        case 'update':
            jsMapView.getJavaConnector().updateFeature(geojson);
            break;
        case 'delete':
            // console.log("Delete feature")
            jsMapView.getJavaConnector().deleteFeature(geojson);
            break;
        case 'pointonline':
          var turfline=  fromoltoturf(f);
          //getting start and line
            getLineAnchorPoints(turfline);
            // show a marker every 200 meters

            var distance = prompt("Please enter distance", "200");
            if (distance == null) {
               return;
            }
          // var distance =200;

            // get the line length in kilometers
          var length = turf.lineDistance(turfline, {units:'meters'});
          for (var i = 1; i <= length / distance; i++) {
              var turfPoint = turf.along(turfline, i * distance,{units:'meters'});
              snap.source_.addFeature(fromturftool(turfPoint));
          }

              break;
        case 'linebearing':
            var distance = prompt("Please enter distance in meters", "200");
            if (distance == null) {
                return;
            }
            var turfline=  fromoltoturf(f);
            result= getLineAnchorPoints(turfline);

            // show a marker every 200 meters

            var bearing = prompt("Please enter angle", result.bearing);
            if (bearing == null) {
                return;
            }

            var options = {units: 'meters'};

            var destination = turf.rhumbDestination(result.start, distance, bearing, options);

            break;
    }
};


function getLineAnchorPoints(turfline) {
    //getting start and line
    var startCoord = turfline.geometry.coordinates[0];
    var endCoord =turfline.geometry.coordinates[turfline.geometry.coordinates.length-1];
    var startp = new ol.Feature({
        type: "startpoint",
        geometry:  new ol.geom.Point(startCoord).transform('EPSG:4326', 'EPSG:3857')
    });
    var endp = new ol.Feature({
        type: "endpoint",
        geometry: new ol.geom.Point(endCoord).transform('EPSG:4326', 'EPSG:3857')
    });


    var length = turf.lineDistance(turfline, {units:'meters'});
    var turfPoint = turf.along(turfline, (length/2),{units:'meters'});
    snap.source_.addFeature(fromturftool(turfPoint,true));

    var point1 =  fromoltoturf(startp);
    var point2 =  fromoltoturf(endp);
    var midpoint = turf.midpoint(point1, point2);
    var bearing = turf.rhumbBearing(point1, point2);

    startp.setId(snap.source_.getFeatures().length);
    endp.setId(snap.source_.getFeatures().length+1);
    var midpoint= fromturftool(midpoint,true);
    startp.set("type","start");
    endp.set("type","end");

    turf_source.addFeature(startp);
    turf_source.addFeature(endp);
    turf_source.changed();

    snap.source_.addFeature(midpoint);
    snap.source_.addFeature(startp);
    snap.source_.addFeature(endp);

    var result={}
    result.bearing=bearing;
    result.start=point1;

    return result;
}


////dialog
// dialog = $( "#dialog-form" ).dialog({
//     autoOpen: false,
//     height: 400,
//     width: 350,
//     modal: true,
//     buttons: {
//         "Create an account": addUser,
//         Cancel: function() {
//             dialog.dialog( "close" );
//         }
//     },
//     close: function() {
//         form[ 0 ].reset();
//         allFields.removeClass( "ui-state-error" );
//     }
// });
//
// form = dialog.find( "form" ).on( "submit", function( event ) {
//     event.preventDefault();
//     addUser();
// });


// Style function
function getFeatureStyle (feature,resolution,style,txtstyle)
{

    var st= [];

    var form_= style.form_?style.form_ :'marker';
    var gradient_=style.gradient_?style.gradient_: false;
    var glyph_=style.glyph_? style.glyph_: "fa-circle";
    var color_=style.color_? style.color_: '#49abf2';
    var fill_=style.fill_?style.fill_: "#f2b223";
    var st_color_=style.st_color_?style.st_width: "#a1bff2";
    var st_width=style.st_width?style.st_width: 1;





    // Shadow style
    if (true) st.push ( new ol.style.Style(
        {	image: new ol.style.Shadow(
                {	radius: 15,
                    blur: 5,
                    offsetX: 0,
                    offsetY: 0,
                    fill: new ol.style.Fill(
                        {	color: "rgba(0,0,0,0.5)"
                        })
                })
        }));
    // Font style
    st.push ( new ol.style.Style(
        {	image: new ol.style.FontSymbol(
                {	form: form_,
                    gradient: gradient_,
                    glyph: glyph_,//car[Math.floor(Math.random()*car.length)],
                    fontSize: 1,
                    radius: 15,
                    //offsetX: -15,
                    // rotation: Number($("#rotation").val())*Math.PI/180,
                    rotateWithView: true,
                    // offsetY: $("#offset").prop('checked') ? -Number($("#radius").val()):0 ,
                    color:color_,
                    fill: new ol.style.Fill(
                        {	color: fill_
                        }),
                    stroke: new ol.style.Stroke(
                        {	color: st_color_,
                            width: st_width
                        })
                }),
            stroke: new ol.style.Stroke(
                {	width: 2,
                    color: '#f80'
                }),
            fill: new ol.style.Fill(
                {	color: [255, 136, 0, 0.6]
                }),
            text:createTextStyle(feature, resolution,txtstyle)
        }));

    if(txtstyle){
        var txt_style= createTextStyle(feature, resolution,txtstyle);
        // st[1].text=(txt_style);
        // st[1].text=(txt_style);
    }
    return st;
}

function getStyle(feature, resolution)
{
    style={
        form_:'marker',
        gradient_:false,
        glyph_:"fa-cab",
        color_:'#392d09',
        fill_:"#f2b223",
        st_color_:"#a1bff2",
        st_width:1
    }
    var txtstyle={
        align:"Center",
        baseline:'bottom',
        size:'12px',
        placement:'point',
        overflow:false,
        fillColor :'#000',
        outlineColor:"#fff",
        outlineWidth:2,
        text:'none',
        maxreso:2400,
        field:'team_name',
        offsetX:0,
        offsetY:-20

    }

    var s = getFeatureStyle(feature,resolution,style,txtstyle);

    return s;

};

var createTextStyle = function(feature, resolution, dom) {
    var align = dom.align;
    var baseline = dom.baseline;
    var size = dom.size;
    // var offsetX = parseInt(dom.offsetX.value, 10);
    // var offsetY = parseInt(dom.offsetY.value, 10);
    // var weight = dom.weight;
    var placement = dom.placement ? dom.placement : undefined;
    // var maxAngle = dom.maxangle ? parseFloat(dom.maxangle) : undefined;
    var overflow = dom.overflow ? (dom.overflow == 'true') : undefined;
    // var rotation = parseFloat(dom.rotation.value);
    // if (dom.font.value == '\'Open Sans\'' && !openSansAdded) {
    //     var openSans = document.createElement('link');
    //     openSans.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
    //     openSans.rel = 'stylesheet';
    //     document.getElementsByTagName('head')[0].appendChild(openSans);
    //     openSansAdded = true;
    // }
    // var font = weight + ' ' + size + ' ' + dom.font.value;
    var fillColor = dom.fillColor;
    var outlineColor = dom.outlineColor;
    var outlineWidth = parseInt(dom.outlineWidth);
    var txt=getText(feature, resolution, dom);

    // return new ol.style.Text({
    //     textAlign: align == '' ? undefined : align,
    //     textBaseline: baseline,
    //     font: '12px Calibri,sans-serif',
    //     text: txt,
    //     fill: new ol.style.Fill({color: fillColor}),
    //     stroke: new ol.style.Stroke({color: outlineColor, width: outlineWidth}),
    //     offsetX: dom.offsetX,
    //     offsetY: dom.offsetY,
    //     // placement: placement,
    //     // maxAngle: maxAngle,
    //     // overflow: overflow,
    //     // rotation: rotation
    // });

    return new ol.style.Text({
        font: '12px tahoma,Calibri,sans-serif',
        // fill: new ol.style.Fill({ color: '#000' }),
        // stroke: new ol.style.Stroke({
        //     color: '#fff', width: 2
        // }),
        // get the text from the feature - `this` is ol.Feature
        // and show only under certain resolution
        text: txt,
        fill: new ol.style.Fill({color: fillColor}),
        stroke: new ol.style.Stroke({color: outlineColor, width: outlineWidth}),
        offsetX: dom.offsetX,
        offsetY: dom.offsetY,
    })

};


var getText = function(feature, resolution, dom) {
    var type = dom.text;
    var maxResolution = dom.maxreso;
    var text='';
    try{
        text = feature.get(dom.field);
    }catch (e){

    }


    if (resolution > maxResolution) {
        text = '';
    } else if (type == 'hide') {
        text = '';
    } else if (type == 'shorten') {
        text = text.trunc(12);
    } else if (type == 'wrap' && (!dom.placement || dom.placement != 'line')) {
        text = stringDivider(text, 16, '\n');
    }

    return text;
};

/**
 * @param {number} n The max number of characters to keep.
 * @return {string} Truncated string.
 */
String.prototype.trunc = String.prototype.trunc ||
    function(n) {
        return this.length > n ? this.substr(0, n - 1) + '...' : this.substr(0);
    };


// http://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function stringDivider(str, width, spaceReplacer) {
    if (str.length > width) {
        var p = width;
        while (p > 0 && (str[p] != ' ' && str[p] != '-')) {
            p--;
        }
        if (p > 0) {
            var left;
            if (str.substring(p, p + 1) == '-') {
                left = str.substring(0, p + 1);
            } else {
                left = str.substring(0, p);
            }
            var right = str.substring(p + 1);
            return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
        }
    }
    return str;
}



////popup functions

// Popup overlay
var popup = new ol.Overlay.Popup (
    {	popupClass: "default", //"tooltips", "warning" "black" "default", "tips", "shadow",
        closeBox: true,
        // onshow: function(){  },
        // onclose: function(){  },
        positioning: 'auto',
        autoPan: true,
        autoPanAnimation: { duration: 250 }
    });



var temvector_url;
function autoreloadVector(temvector_url_) {
    temvector_url='http://127.0.0.1/views/teamlocation/1';
    reload();
    window.setInterval(reload, 50000);

}

var teams_vector;
var issues_vector;

function reload() {

var json='{"type": "FeatureCollection", "features": [{"id": 12, "type": "Feature", "geometry": {"type": "Point", "coordinates": [51.4473052, 35.7817819]}, "properties": {"team_id": 2, "team_mobile_key": "234", "team_name": "\u062a\u06cc\u0645 \u062f\u0648", "actor_id": 1, "actor_name": "\u0641\u0631\u062f\u06cc\u0633", "date_time": "2018-08-22 00:51:26"}}, {"id": 11, "type": "Feature", "geometry": {"type": "Point", "coordinates": [51.4473052, 35.7417819]}, "properties": {"team_id": 3, "team_mobile_key": "453", "team_name": "\u062a\u06cc\u0645 \u0633\u0647", "actor_id": 1, "actor_name": "\u0641\u0631\u062f\u06cc\u0633", "date_time": "2018-08-22 00:51:26"}}]}'
        var features = _geojson_format.readFeatures(json,
            {
                defaultDataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
        var vectorSource = new ol.source.Vector();
        vectorSource.addFeatures(features);
        var newLayer = new ol.layer.Vector({
            source: vectorSource,
            style: getStyle,
            title: 'خودرو امداد',
            description: 'some description'
        });
        _map.addLayer(newLayer);
        vectorSource.once('change', function() {
            console.log('remove')
            if (teams_vector) {
                _map.removeLayer(teams_vector);
            }
            teams_vector = newLayer;
        });
        // _selected_feature_source.addFeatures(features);






    // var vectorSource = new ol.source.Vector({
    //     format: new ol.format.GeoJSON({
    //     defaultDataProjection: 'EPSG:4326',
    //     featureProjection: 'EPSG:3857'
    //      }),
    //     url: temvector_url,
    //     crossOrigin: 'anonymous'
    //
    // });


}