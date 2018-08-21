package com.sothawo.mapjfx;

import netscape.javascript.JSObject;

import java.util.logging.Logger;

public final class gfpMapView extends MapView {
    private final Logger logger = Logger.getLogger(gfpMapView.class.getCanonicalName());
    public gfpMapView(){
        super();
    }

    /**
     * Zooms into selected items in map. this function only selects on overlays. overlays are the objects which are added into map
     * using wkt, geojson, feature
     */
    public void zoomToOverlay() {
        if (getInitialized()) {
            logger.finer(() -> "zoomToOverlay: ");
            getMapview().call("zoomtoOverlayLayer");
        }
    }


    /**
     * Adds a wkt object into map
     * @param wkt wkt format
     * @param clear_all  clears all other objects before adding new one
     */
    public void addWktFeatureToOverlay(String wkt,boolean clear_all) {
        if (getInitialized()) {
            logger.finer(() -> "addwktfeature: " + wkt);
            getMapview().call("addwktfeature",wkt,clear_all);
        }
    }


    /**
     * measuring area or lenght
     * @param type this shoule be one of the 'Polygon' or 'LineString' in case of measuring area or lenght
     */
    public void setStartMeasure(String type) {
        if (getInitialized()) {
            logger.finer(() -> "setStartMeasure: " + type);
            getMapview().call("setStartMeasure",type);
        }
    }

    /**
     * Hint: call setBackgroundMapBaseURL first and set background map url to load these maps
     * @param type nobase or null will hide the base map,street,hybrid
     */
    public void setBackgroundMap(String type) {
        if (getInitialized()) {
            logger.finer(() -> "setStartMeasure: " + type);
            getMapview().call("setbackgrounmap",type);
        }
    }

    /**
     * Sets url to load base map from
     * @param url url
     */
      public void setBackgroundMapBaseURL(String url){

        if (getInitialized()) {
            logger.finer(() -> "setBackgroundMapBaseURL: " + url);
            getMapview().call("setBackgroundMapBaseURL",url);
        }
    }

    public void testwms(){

        if (getInitialized()) {
            logger.finer(() -> "addTestwms: ");
            getMapview().call("addTestwms");
        }
    }

    public void addlayer(String type,String url,String workspace,String layer,double minres,String title,
                         boolean noSwitcherDelete,boolean allwaysOnTop){

        if (getInitialized()) {
            logger.finer(() -> "addlayer: " + url);
            if(minres==-1){
                getMapview().call("addlayer",type,url,workspace,layer,null,title,noSwitcherDelete,allwaysOnTop);

            }else{
                getMapview().call("addlayer",type,url,workspace,layer,minres,title,noSwitcherDelete,allwaysOnTop);

            }
        }
    }
    /**
     * Enable or disable Globe object
     * @param Enable True to enable, False to disable
     */
    public void setGlobeControl(boolean Enable){

        if (getInitialized()) {
            logger.finer(() -> "setGlobeControl: " + Enable);
            if(Enable){
                getMapview().call("setEnableGlobe");

            }else{
                getMapview().call("setDisableGlobe");

            }
        }
    }

    /**
     * Enable Select
     * @param Enable True to enable, False to disable
     */
    public void setEnableSelect(boolean Enable){

        if (getInitialized()) {
            logger.finer(() -> "setEnableSelect: " + Enable);
            if(Enable){
                getMapview().call("setEnableSelect");

            }else{
                getMapview().call("setDisableSelect");

            }
        }
    }

    /**
     * This function must be called in order to get information when user clicks on map. if this function does not call correctly
     * the singleClickAtFeature in js (MAP_SINGLE_CLICK_AT_FEATURE in java)  event  will not be called.
     * @param url wms url of geoserver. this url is sth like "http://127.0.0.1:8080/geoserver/gas/wms"
     * @param workspace the name of workspace
     * @param layer layer name. it is better to create a layergroup which includes all of gas layers so we can query all layers at one time
     */
    public void setWMSQueryLayer(String url,String workspace,String layer){

        if (getInitialized()) {
            logger.finer(() -> "setwmsquerylayer: " + url +" "+workspace +" "+layer+" " );
            getMapview().call("setwmsquerylayer",url,workspace,layer);

        }
    }




    public void setEditLayer(String featureNS,String url,double maxres,String title){

        if (getInitialized()) {
            logger.finer(() -> "setEditLayer: " + featureNS +" "+url +" "+maxres+" "+title );
            getMapview().call("set_editlayer",featureNS,url,maxres,title);

        }
    }

    public void removeEditLayer(){

        if (getInitialized()) {
            getMapview().call("remove_edit_layer");

        }
    }
}
