package com.sothawo.mapjfx;

import com.sothawo.mapjfx.event.ClickType;
import com.sothawo.mapjfx.event.MapLabelEvent;
import com.sothawo.mapjfx.event.MapViewEvent;
import com.sothawo.mapjfx.event.MarkerEvent;
import com.sun.media.jfxmediaimpl.MediaDisposer;
import com.teamdev.jxbrowser.chromium.*;
import com.teamdev.jxbrowser.chromium.events.*;
import com.teamdev.jxbrowser.chromium.javafx.BrowserView;
import javafx.application.Platform;
import javafx.beans.property.*;
import javafx.concurrent.Worker;
import javafx.event.EventHandler;
import javafx.event.EventType;
import javafx.scene.control.SplitPane;
import javafx.scene.layout.Background;
import javafx.scene.layout.BackgroundFill;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Paint;
import javafx.scene.web.WebView;
import javafx.stage.WindowEvent;
import netscape.javascript.JSException;
import netscape.javascript.JSObject;

import javax.swing.*;
import java.awt.*;
import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.*;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static java.util.Objects.requireNonNull;

public class GfpMapViewJX extends StackPane implements MediaDisposer.Disposable {

    /** minimal zoom level, OL defines this as 0. */
    public static final int MIN_ZOOM = 0;
    /** maximal zoom level, OL defines this as 28. */
    public static final int MAX_ZOOM = 28;
    /** initial zoom value for the map. */
    public static final int INITIAL_ZOOM = 14;

    /** Logger for the class */
    private static final Logger logger = Logger.getLogger(GfpMapViewJX.class.getCanonicalName());

    /** URL of the html code for the WebView. */
    private static final String MAPVIEW_HTML = "/mapview.html";
    private static final String MAPVIEW_URL = "file:///D:/Desktop_app2/mapjfx/src/main/resources/mapview-local.html";
    private static final String MAP_VIEW_NOT_YET_INITIALIZED = "MapView not yet initialized";

    /** number of retries if Javascript object is not ready. */
    private static final int NUM_RETRIES_FOR_JS = 10;

    /** marker for custom_mapview.css. */
    private static final String CUSTOM_MAPVIEW_CSS = "custom_mapview.css";
    /** readonly property that informs if this MapView is fully initialized. */
    private final ReadOnlyBooleanWrapper initialized = new ReadOnlyBooleanWrapper(false);
    /** used to store the last coordinate that was reported by the map to prevent setting it again in the map. */
    private final AtomicReference<Coordinate> lastCoordinateFromMap = new AtomicReference<>();
    /** used to store the last zoom value that was reported by the map to prevent setting it again in the map. */
    private final AtomicReference<Long> lastZoomFromMap = new AtomicReference<>();

    /** the connector object in the web page; field to prevent it being gc'ed. */
    private final GfpMapViewJX.JavaConnector javaConnector = new GfpMapViewJX.JavaConnector();

    /** property containing the map's center. */
    private SimpleObjectProperty<Coordinate> center;
    /**
     * property containing the map's zoom; This is a Double so that the property might be bound to a slider, internally
     * a rounded value is used.
     */
    private SimpleDoubleProperty zoom;
    /** property containing the map's animation duration in ms. */
    private SimpleIntegerProperty animationDuration;
    /** Connector object that is created in the web page and initialized when the page is fully loaded */
    private com.teamdev.jxbrowser.chromium.JSObject jsMapView;
    /** Pattern to find resources to include in the local html file. */
    private Pattern htmlIncludePattern = Pattern.compile("^#(.+)#$");
    /** URL for custom mapview css. */
    private Optional<URL> customMapviewCssURL = Optional.empty();
    private Browser webengine;

    public SimpleBooleanProperty DEBUG = new SimpleBooleanProperty(this, "DEBUG", false);

    /**
     * create a MapView with no initial center coordinate.
     */
    public GfpMapViewJX() {
        initProperties();
        // we don't initialize the WebView here, as this would prevent the MapView from being created in SceneBuilder.
        // This is all done in the initialize method.

        // set a silver background to make the MapView distinguishable in SceneBuilder, this will later be hidden by
        // the WebView
        setBackground(new Background(new BackgroundFill(Paint.valueOf("#fff"), null, null)));


    }


// --------------------------- CONSTRUCTORS ---------------------------

    /**
     * initializes the JavaFX properties.
     */
    private void initProperties() {
        center = new SimpleObjectProperty<>();
        center.addListener((observable, oldValue, newValue) -> {
            // check if this is the same value that was just reported from the map using object equality
            if (newValue != lastCoordinateFromMap.get()) {
                logger.finer(() -> "center changed from " + oldValue + " to " + newValue);
                setCenterInMap();
            }
        });

        zoom = new SimpleDoubleProperty(INITIAL_ZOOM);
        zoom.addListener((observable, oldValue, newValue) -> {
            // check if this is the same value that was just reported from the map using object equality
            //noinspection NumberEquality
            final Long rounded = Math.round((Double) newValue);
            if (!Objects.equals(rounded, lastZoomFromMap.get())) {
              setZoomInMap();
            }
        });

        animationDuration = new SimpleIntegerProperty(0);
    }


    /**
     * sets the value of the center property in the OL map.
     */
    private void setCenterInMap() {
        Coordinate actCenter = getCenter();
        if (getInitialized() && null != actCenter) {
            logger.finer(
                    () -> "setting center in OpenLayers map: " + actCenter + ", animation: " + animationDuration.get());
            // using Double objects instead of primitives works here
            JSValue function = jsMapView.asObject().getProperty("setCenter");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),actCenter.getLatitude(), actCenter.getLongitude(), animationDuration.get());
            }
        }
    }

    /**
     * sets the value of the actual zoom property in the OL map.
     */
    private void setZoomInMap() {
        if (getInitialized()) {
            int zoomInt = (int) getZoom();
            logger.finer(
                    () -> "setting zoom in OpenLayers map: " + zoomInt + ", animation: " + animationDuration.get());
            JSValue function = jsMapView.asObject().getProperty("setZoom");
            function.asFunction().invoke(jsMapView.asObject(),zoomInt,animationDuration.get());
        }
    }
    /**
     * @return true if the MapView is initialized.
     */
    public boolean getInitialized() {
        return initialized.get();
    }
    /**
     * @return the current zoom value.
     */
    public double getZoom() {
        return zoom.get();
    }

    /**
     * sets the center of the map. The coordinate must be in EPSG:4326 coordinates (WGS)
     *
     * @param center
     *         new center
     * @return this object
     */
    public GfpMapViewJX setCenter(Coordinate center) {
        this.center.set(center);
        return this;
    }


    /**
     * @return the current center of the map.
     */
    public Coordinate getCenter() {
        return center.get();
    }
    /**
     * @return the current animation duration.
     */
    public int getAnimationDuration() {
        return animationDuration.get();
    }

    /**
     * sets the animation duration in ms. If a value greater than 1 is set, then panning or zooming the map by setting
     * the center or zoom property will be animated in the given time. Setting this to zero does not switch off the zoom
     * animation shown when clicking the controls in the map.
     *
     * @param animationDuration
     *         animation duration in ms
     * @return this object
     */
    public GfpMapViewJX setAnimationDuration(int animationDuration) {
        this.animationDuration.set(animationDuration);
        return this;
    }

    /**
     * initializes the MapView. The internal HTML file is loaded into the contained WebView and the necessary setup is
     * made for communication between this object and the Javascript elements on the web page.
     */
    public void initialize() {

            logger.finer("initializing...");
//            BrowserContextParams params= new BrowserContextParams("d:\\my-data1");
            BrowserPreferences.setChromiumSwitches(
                    "--disable-web-security",
                    "--allow-file-access-from-files",
                    "--allow-file-access",
                    "--remote-debugging-port=9222");
//            BrowserContext browserContext = new BrowserContext(params);
            webengine = new Browser();
            BrowserView view = new BrowserView(webengine);

            ///debuging
          if(DEBUG.get()){
                String remoteDebuggingURL = webengine.getRemoteDebuggingURL();
                Browser    debugerbrowser = new Browser();
                debugerbrowser.loadURL(remoteDebuggingURL);
                BrowserView debuggerview = new BrowserView(debugerbrowser);
                SplitPane splitPane = new SplitPane(view, debuggerview);
                getChildren().add(splitPane);

            }else{
                getChildren().add(view);
            }


            ProtocolService protocolService = webengine.getContext().getProtocolService();
            protocolService.setProtocolHandler("jar", new ProtocolHandler() {
                @Override
                public URLResponse onRequest(URLRequest request) {
                    try {
                        URLResponse response = new URLResponse();
                        URL path = new URL(request.getURL());
                        InputStream inputStream = path.openStream();
                        DataInputStream stream = new DataInputStream(inputStream);
                        byte[] data = new byte[stream.available()];
                        stream.readFully(data);
                        response.setData(data);
                        String mimeType = getMimeType(path.toString());
                        response.getHeaders().setHeader("Content-Type", mimeType);
                        return response;
                    } catch (Exception ignored) {}
                    return null;
                }
            });


            logger.finer("BrowserView created");

            // log versions after webEngine is available
            logVersions();
        // pass JS alerts to the logger
            webengine.addConsoleListener(new ConsoleListener() {
                @Override
                public void onMessage(ConsoleEvent consoleEvent) {
                    logger.finer(consoleEvent.getLevel() +" "+consoleEvent.toString());
                }
            });


            webengine.loadURL(getClass().getResource("/mapview-local.html").toString());

            webengine.addScriptContextListener(new ScriptContextAdapter() {
                @Override
                public void onScriptContextCreated(ScriptContextEvent event) {
                    Browser browser = event.getBrowser();
                    JSValue window = browser.executeJavaScriptAndReturnValue("window");
                    window.asObject().setProperty("_javaConnector", javaConnector);
                }
            });

            webengine.addLoadListener(new LoadListener() {
                @Override
                public void onStartLoadingFrame(StartLoadingEvent startLoadingEvent) {

                }

                @Override
                public void onProvisionalLoadingFrame(ProvisionalLoadingEvent provisionalLoadingEvent) {

                }

                @Override
                public void onFinishLoadingFrame(FinishLoadingEvent finishLoadingEvent) {
                     // get the Javascript connector object. Even if the html file is loaded, JS may not yet
                    // be ready, so prepare for an exception and retry
                    int numRetries = 0;
                    do {

                        try {
                            JSValue value = webengine.executeJavaScriptAndReturnValue("getJSMapView()");
                            jsMapView = (com.teamdev.jxbrowser.chromium.JSObject) value.asObject();

                        } catch (JSException e) {
                            logger.warning("JS not ready, retrying...");
                            numRetries++;
                            try {
                                Thread.sleep(500);
                            } catch (InterruptedException e1) {
                                logger.warning("retry interrupted");
                            }
                        } catch (Exception e) {
                            logger.severe("getJSMapView: returned (null)");
                            numRetries++;
                        }
                    } while (null == jsMapView && numRetries < NUM_RETRIES_FOR_JS);

                    if (null == jsMapView) {
                        logger.severe(() -> "error loading " + MAPVIEW_HTML + ", JavaScript not ready.");
                    } else {
                        initialized.set(true);
                        setCenterInMap();
                        setZoomInMap();
                        logger.finer("initialized.");
                    }
                }

                @Override
                public void onFailLoadingFrame(FailLoadingEvent failLoadingEvent) {

                }

                @Override
                public void onDocumentLoadedInFrame(FrameLoadEvent frameLoadEvent) {


                }

                @Override
                public void onDocumentLoadedInMainFrame(LoadEvent loadEvent) {

                }
            });
            logger.finer("WebView created");

            // do the load
            logger.finer("load html into WebEngine");
    }

    private static String getMimeType(String path) {
        if (path.endsWith(".html")) {
            return "text/html";
        }
        if (path.endsWith(".css")) {
            return "text/css";
        }
        if (path.endsWith(".js")) {
            return "text/javascript";
        }
        return "text/html";
    }


    /**
     * log Java, JavaFX , OS and WebKit version.
     */
    private void logVersions() {
        logger.finer(() -> "Java Version:   " + System.getProperty("java.runtime.version"));
        logger.finer(() -> "JavaFX Version: " + System.getProperty("javafx.runtime.version"));
        logger.finer(() -> "OS:             " + System.getProperty("os.name") + ", " + System.getProperty("os.version")
                + ", " + System.getProperty("os.arch"));
        logger.finer(() -> "User Agent:     " + webengine.getUserAgent());
    }

    /**
     * processes a line from the html file, adding the base url and replacing template values.
     *
     * @param baseURL
     *         the URL of the file
     * @param line
     *         the line to process, must be trimmed
     * @return a List with the processed strings
     */
    private List<String> processHtmlLine(String baseURL, String line) {
        // insert base url
        if ("<head>".equalsIgnoreCase(line)) {
            return Arrays.asList(line, "<base href=\"" + baseURL + "\">");
        }

        // check for replacement pattern
        Matcher matcher = htmlIncludePattern.matcher(line);
        if (matcher.matches()) {
            String resource = baseURL + matcher.group(1);
            if (CUSTOM_MAPVIEW_CSS.equals(matcher.group(1))) {
                if (customMapviewCssURL.isPresent()) {
                    logger.finer(
                            () -> "loading custom mapview css from " + customMapviewCssURL.get().toExternalForm());
                    try (Stream<String> lines = new BufferedReader(
                            new InputStreamReader(customMapviewCssURL.get().openStream(), StandardCharsets.UTF_8))
                            .lines()
                    ) {
                        return lines
                                .filter(l -> !l.contains("<"))
                                .collect(Collectors.toList());
                    } catch (IOException e) {
                        logger.log(Level.SEVERE, "loading resource " + resource, e);
                    }
                }
            } else {
                logger.finer(() -> "loading from " + resource);
                try (Stream<String> lines = new BufferedReader(
                        new InputStreamReader(new URL(resource).openStream(), StandardCharsets.UTF_8))
                        .lines()
                ) {
                    return lines.collect(Collectors.toList());
                } catch (IOException e) {
                    logger.log(Level.SEVERE, "loading resource " + resource, e);
                }
            }
        }      // return the line
        return Collections.singletonList(line);
    }

    /**
     * @return the readonly initialized property.
     */
    public ReadOnlyBooleanProperty initializedProperty() {
        return initialized.getReadOnlyProperty();
    }


    /**
     * sets the center and zoom of the map so that the given extent is visible.
     *
     * @param extent
     *         extent to show, if null, nothing is changed
     * @return this object
     * @throws java.lang.NullPointerException
     *         when extent is null
     */
    public GfpMapViewJX setExtent(Extent extent) {
        if (!getInitialized()) {
            logger.warning(MAP_VIEW_NOT_YET_INITIALIZED);
        } else {
            requireNonNull(extent);
            logger.finer(
                    () -> "setting extent in OpenLayers map: " + extent + ", animation: " +
                            animationDuration.get());
            JSValue function = jsMapView.asObject().getProperty("setExtent");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),extent.getMin().getLatitude(), extent.getMin().getLongitude(),
                    extent.getMax().getLatitude(), extent.getMax().getLongitude(), animationDuration.get());
            }
       }
        return this;
    }

    public SimpleDoubleProperty zoomProperty() {
        return zoom;
    }


    /**
     * sets the zoom level. the zoom value is rounded to the next whole number using {@link Math#round(double)} and then
     * checked to be in the range between {@link #MIN_ZOOM} and {@link #MAX_ZOOM }. If the value is not in this range,
     * the call is ignored.
     *
     * @param zoom
     *         new zoom level
     * @return this object
     */
    public GfpMapViewJX setZoom(double zoom) {
        double rounded = Math.round(zoom);
        if (rounded < MIN_ZOOM || rounded > MAX_ZOOM) {
            return this;
        }
        this.zoom.set(rounded);
        return this;
    }
    //-------------------------gfp functions -----------
    public com.teamdev.jxbrowser.chromium.JSObject getMapview(){

        if(getInitialized()){
            return jsMapView ;
        }
        return null;
    }


    @Override
    public void dispose(){
        if(null!=webengine)
            webengine.dispose();
    }

    public Browser getWebengine() {
        return webengine;
    }



    /**
     * Zooms into selected items in map. this function only selects on overlays. overlays are the objects which are added into map
     * using wkt, geojson, feature
     */
    public void zoomToOverlay() {
        if (getInitialized()) {
            logger.finer(() -> "zoomToOverlay: ");
            JSValue function = jsMapView.asObject().getProperty("zoomtoOverlayLayer");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject());
            }
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
            JSValue function = jsMapView.asObject().getProperty("addwktfeature");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),wkt,clear_all);
            }
        }
    }


    /**
     * measuring area or lenght
     * @param type this shoule be one of the 'Polygon' or 'LineString' in case of measuring area or lenght
     */
    public void setStartMeasure(String type) {
        if (getInitialized()) {
            logger.finer(() -> "setStartMeasure: " + type);
            JSValue function = jsMapView.asObject().getProperty("setStartMeasure");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),type);
            }
        }
    }

    /**
     * Hint: call setBackgroundMapBaseURL first and set background map url to load these maps
     * @param type nobase or null will hide the base map,street,hybrid
     */
    public void setBackgroundMap(String type) {
        if (getInitialized()) {
            logger.finer(() -> "setbackgrounmap: " + type);
            JSValue function = jsMapView.asObject().getProperty("setBackgrounMap");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),type);
            }
        }
    }

    /**
     * Sets url to load base map from
     * @param url url
     */
    public void setBackgroundMapBaseURL(String url){

        if (getInitialized()) {
            logger.finer(() -> "setBackgroundMapBaseURL: " + url);
            JSValue function = jsMapView.asObject().getProperty("setBackgroundMapBaseURL");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),url);
            }
        }
    }



    public void addlayer(String type,String url,String workspace,String layer,double minres,String title,
                         boolean noSwitcherDelete,boolean allwaysOnTop){

        if (getInitialized()) {
            logger.finer(() -> "addlayer: " + url);
            JSValue function = jsMapView.asObject().getProperty("addlayer");

            if(minres==-1){
                if(function.asFunction().isFunction()){
                    function.asFunction().invoke(jsMapView.asObject(),type,url,workspace,layer,null,title,noSwitcherDelete,allwaysOnTop);
                }
            }else{

                if(function.asFunction().isFunction()){
                    function.asFunction().invoke(jsMapView.asObject(),type,url,workspace,layer,minres,title,noSwitcherDelete,allwaysOnTop);
                }
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
            JSValue function;

            if(Enable)
            {
                 function = jsMapView.asObject().getProperty("setEnableGlobe");

            }else
                {
                 function = jsMapView.asObject().getProperty("setDisableGlobe");

            }

            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject());
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
            JSValue function;
            if(Enable){
                 function = jsMapView.asObject().getProperty("setEnableSelect");

            }else{
                function = jsMapView.asObject().getProperty("setDisableSelect");
            }

            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject());
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
            JSValue function = jsMapView.asObject().getProperty("setwmsquerylayer");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),url,workspace,layer);
            }
        }
    }




    public void setEditLayer(String featureNS,String url,double maxres,String title){

        if (getInitialized()) {
            logger.finer(() -> "setEditLayer: " + featureNS +" "+url +" "+maxres+" "+title );
            JSValue function = jsMapView.asObject().getProperty("set_editlayer");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject(),featureNS,url,maxres,title);
            }
        }
    }

    public void removeEditLayer(){

        if (getInitialized()) {
            JSValue function = jsMapView.asObject().getProperty("remove_edit_layer");
            if(function.asFunction().isFunction()){
                function.asFunction().invoke(jsMapView.asObject());
            }
        }
    }



    // -------------------------- INNER CLASSES --------------------------

    /**
     * Connector object. Methods of an object of this class are called from JS code in the web page.
     */
    public class JavaConnector {

        private final Logger logger = Logger.getLogger(MapView.JavaConnector.class.getCanonicalName());

        /**
         * called when the user has moved the map. the coordinates are EPSG:4326 (WGS) values. The arguments are double
         * primitives and no Double objects.
         *
         * @param lat
         *         new latitude value
         * @param lon
         *         new longitude value
         */
        public void centerMovedTo(double lat, double lon) {
            Coordinate newCenter = new Coordinate(lat, lon);
            lastCoordinateFromMap.set(newCenter);
            setCenter(newCenter);
        }

        /**
         * called when the user has moved the pointer (mouse).
         *
         * @param lat
         *         new latitude value
         * @param lon
         *         new longitude value
         */
        public void pointerMovedTo(double lat, double lon) {
            final Coordinate coordinate = new Coordinate(lat, lon);
            // fire a coordinate event to whom it may be of importance
            fireEvent(new MapViewEvent(MapViewEvent.MAP_POINTER_MOVED, coordinate));
        }

        /**
         * called from the JS in the web page to output a message to the application's log.
         *
         * @param msg
         *         the message to log
         */
        public void debug(String msg) {
            logger.finer(() -> "JS: " + msg);
        }

        /**
         * called when an a href in the map is clicked and shows the URL in the default browser.
         *
         * @param href
         *         the url to show
         */
        public void showLink(String href) {
            if (null != href && !href.isEmpty()) {
                logger.finer(() -> "JS asks to browse to " + href);
                if (!Desktop.isDesktopSupported()) {
                    logger.warning(() -> "no desktop support for displaying " + href);
                } else {
                    try {
                        Desktop.getDesktop().browse(new URI(href));
                    } catch (IOException | URISyntaxException e) {
                        logger.log(Level.WARNING, "can't display " + href, e);
                    }
                }
            }
        }

        /**
         * called when the user has single-clicked in the map. the coordinates are EPSG:4326 (WGS) values.
         *
         * @param lat
         *         new latitude value
         * @param lon
         *         new longitude value
         */
        public void singleClickAt(double lat, double lon) {
            Coordinate coordinate = new Coordinate(lat, lon);
            logger.finer(() -> "JS reports single click at " + coordinate);
            // fire a coordinate event to whom it may be of importance
            fireEvent(new MapViewEvent(MapViewEvent.MAP_CLICKED, coordinate));
        }

        /**
         * called when the user has context-clicked in the map. the coordinates are EPSG:4326 (WGS) values.
         *
         * @param lat
         *         new latitude value
         * @param lon
         *         new longitude value
         */
        public void contextClickAt(double lat, double lon) {
            Coordinate coordinate = new Coordinate(lat, lon);
            logger.finer(() -> "JS reports context click at " + coordinate);
            // fire a coordinate event to whom it may be of importance
            fireEvent(new MapViewEvent(MapViewEvent.MAP_RIGHT_CLICKED, coordinate));
        }



        /**
         * called when the user changed the zoom with the controls in the map.
         *
         * @param newZoom
         *         new zoom value
         */
        public void zoomChanged(double newZoom) {
            final long roundedZoom = Math.round(newZoom);
            lastZoomFromMap.set(roundedZoom);
            setZoom(roundedZoom);
        }

        /**
         * called when the user selected an extent by dragging the mouse with modifier pressed.
         *
         * @param latMin
         *         latitude of upper left corner
         * @param lonMin
         *         longitude of upper left corner
         * @param latMax
         *         latitude of lower right corner
         * @param lonMax
         *         longitude of lower right corner
         */
        public void extentSelected(double latMin, double lonMin, double latMax, double lonMax) {
            final Extent extent = Extent.forCoordinates(new Coordinate(latMin, lonMin), new Coordinate(latMax, lonMax));
            logger.finer(() -> "JS reports extend selected: " + extent);
            fireEvent(new MapViewEvent(MapViewEvent.MAP_EXTENT, extent));
        }

        /**
         * called when the map extent changed by changing the center or zoom of the map.
         *
         * @param latMin
         *         latitude of upper left corner
         * @param lonMin
         *         longitude of upper left corner
         * @param latMax
         *         latitude of lower right corner
         * @param lonMax
         *         longitude of lower right corner
         */
        public void extentChanged(double latMin, double lonMin, double latMax, double lonMax) {
            final Extent extent = Extent.forCoordinates(new Coordinate(latMin, lonMin), new Coordinate(latMax, lonMax));
            fireEvent(new MapViewEvent(MapViewEvent.MAP_BOUNDING_EXTENT, extent));
        }

        public void singleClickAtFeature(String url,double lat, double lon) {
            Coordinate coordinate = new Coordinate(lat, lon);
            logger.finer(() -> "JS reports singleClickAtFeature url: " + url);
            fireEvent(new MapViewEvent(MapViewEvent.MAP_SINGLE_CLICK_AT_FEATURE, url,coordinate));
        }

        public void deleteFeature(String geojson) {
            logger.finer(() -> "JS reports deleteFeature geojson: " + geojson);
            fireEvent(new MapViewEvent(MapViewEvent.MAP_WFS_DELETE_EVENT, geojson));
        }

        public void updateFeature(String geojson) {
            logger.finer(() -> "JS reports updateFeature geojson: " + geojson);
            fireEvent(new MapViewEvent(MapViewEvent.MAP_WFS_UPDATE_EVENT, geojson));
        }

        public void insertFeature(String geojson) {
            logger.finer(() -> "JS reports insertFeature geojson: " + geojson);
            fireEvent(new MapViewEvent(MapViewEvent.MAP_WFS_ADD_EVENT, geojson));
        }
    }
}
