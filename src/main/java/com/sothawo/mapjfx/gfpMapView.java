package com.sothawo.mapjfx;

import netscape.javascript.JSObject;

import java.util.logging.Logger;

public final class gfpMapView extends MapView {
    private final Logger logger = Logger.getLogger(gfpMapView.class.getCanonicalName());
    public gfpMapView(){
        super();

    }


    public void zoomToOverlay() {
        if (getInitialized()) {
            logger.finer(() -> "zoomToOverlay: ");
            getMapview().call("zoomtoOverlayLayer");
        }
    }


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
