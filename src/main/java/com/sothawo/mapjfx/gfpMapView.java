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
     *
     * @param type nobase,street,hybrid
     */
    public void setBackgroundMap(String type) {
        if (getInitialized()) {
            logger.finer(() -> "setStartMeasure: " + type);
            getMapview().call("setbackgrounmap",type);
        }
    }

}
