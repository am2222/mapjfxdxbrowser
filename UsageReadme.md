#How To use
Refer to functions comment for more info about input parameters of each function. Here we only have example codes how to use.


#Exit
To exit do not forget to call `system.exit(0)`

```
        scene.getWindow().setOnCloseRequest(new EventHandler<WindowEvent>() {
            @Override
            public void handle(WindowEvent event) {
               // Platform.exit();
                Platform.exit();
                Thread start=new Thread(new Runnable() {

                    @Override
                    public void run() {
                        // TODO Auto-generated method stub
                        System.exit(0);
                    }
                });
                start.start();

            }
        });
```

#Debug Mode
You can enable map debugger 

``        
mapView.DEBUG=new SimpleBooleanProperty(this, "DEBUG", true);;
``

#Configuration
There are two steps to configure map. first you must get map capabilities from a url and pass it into mapview object.
this could be done in `js` like this

you have to do this in java part for instance using retrofit the `url:'http://127.0.0.1:8080/geoserver/gas/wms?request=GetCapabilities&service=WMS&version=1.1.1',`
then you can simply call `jsMapView.loadcapabilities(response)` to decode maps capabilities. Do not forget to add layers after this step


       //dont forget to call load capabilities
                   var jqxhr = $.ajax( {
                       crossDomain:true,
                       url:'http://127.0.0.1:8080/geoserver/gas/wms?request=GetCapabilities&service=WMS&version=1.1.1',
                   } )
        .done(function(response ) {

            jsMapView.loadcapabilities(response)


            //adding layer 


        })
        .fail(function() {
            console.log( "error" );
        })
        .always(function() {
            console.log( "complete" );
        });

#Base Map Configuration
to init basemap you should setBackgroundMapBaseURL to the server ip, read this ip from a config file
                
        mapView.setBackgroundMapBaseURL("http://127.0.0.1");
        mapView.setBackgroundMap("street");  //you can seve last base map in config and load it to save last status

#Enalbe Select Mode
This mode is used when user clicks on map and wants to get data from clicks point.
First you must add a `wmsquerylayer` into map
    
    mapView.setWMSQueryLayer("http://127.0.0.1:8080/geoserver/gas/wms","gas","GasNet_parcel");
later enable select tool 

    mapView.setEnableSelect(true);
    
Finally listen to related event `MapViewEvent.MAP_SINGLE_CLICK_AT_FEATURE`

                mapView.addEventHandler(MapViewEvent.MAP_SINGLE_CLICK_AT_FEATURE, event -> {
                    logger.info("MAP_SINGLE_CLICK_AT_FEATURE event: " + event.getURL());
                    event.consume();
               });
         
When this event fiers it returns a url such as `http://127.0.0.1:8080/geoserver/gas/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=gas%3AGasNet_parcel&LAYERS=gas%3AGasNet_parcel&TILED=true&INFO_FORMAT=application%2Fjson&I=123&J=140&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&STYLES=&BBOX=5675907.972344048%2C4279250.591517307%2C5676519.46857033%2C4279862.087743589` which this url returns a `geojson` object

````
{"type":"FeatureCollection","totalFeatures":"unknown","features":[{"type":"Feature","id":"GasNet_parcel.2266","geometry":{"type":"Polygon","coordinates":[[[5676254.74824976,4279479.90453238],[5676252.22964465,4279442.24470195],[5676136.84445546,4279450.488067],[5676138.08926177,4279487.95242825],[5676136.17028399,4279519.07696284],[5676130.83546269,4279549.07940125],[5676120.0748479,4279582.94455678],[5676123.2132782,4279584.45923087],[5676120.16310556,4279599.09830658],[5676215.12415977,4279592.82670852],[5676214.83619596,4279587.74876447],[5676238.75795045,4279586.22440159],[5676239.17661411,4279591.12900707],[5676253.89950986,4279590.07423284],[5676253.65901286,4279586.0434527],[5676261.95226709,4279585.82421471],[5676254.74824976,4279479.90453238]]]},"geometry_name":"geom","properties":{"city_code":"014","php":0,"phf":0,"area":1.197255519054153E-6,"address":"","pa_plaque":"0","pa_seir":"","pa_type":"","pa_gnaf":"","pa_name":"","pa_register":"","pa_des":"","pa_marketing":"75(B)  75(V)","r_giscodemain":"4D-169","edit_date":"2018-07-10T03:01:01.049Z","create_date":"2018-07-10T03:01:01.049Z","deleted":false,"a_id":7,"b_id":108,"code_g_id":null,"d_id":3,"s_id":736,"special_id":null,"zone_id":2}}],"crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::3857"}}}
````

The returned geojson is vary due to position of mouse click. in most of cases the `id` parameter in geojson ("id":"GasNet_parcel.2266") shows object type and its `id`, for example the above object is
`parcel` with id=2266


#Enable Globe
To enable globe control
                
     mapView.setGlobeControl(true); 
     
     
#loadUser Layers
TO load a layer from server (based on users access)

    mapView.addlayer("wms","http://127.0.0.1:8080/geoserver/gas/wms","gas","GasNet_parcel",-1, "پارسل ها",true,false);
    
 The above parameters could be get from `userlayers`
 
 
#Loading a wkt feature 
To load a wkt into map use this function. overlays are the objects which are added into map using wkt, geojson, feature (fornow we only support wkt)

      mapView.addWktFeatureToOverlay(wkt,true);
To zoom into layer use this code

       mapView.zoomToOverlay();