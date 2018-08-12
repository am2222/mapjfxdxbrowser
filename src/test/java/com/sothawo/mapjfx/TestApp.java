/*
 Copyright 2015-2017 Peter-Josef Meisch (pj.meisch@sothawo.com)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
package com.sothawo.mapjfx;

import com.sothawo.mapjfx.event.MapLabelEvent;
import com.sothawo.mapjfx.event.MapViewEvent;
import com.sothawo.mapjfx.event.MarkerEvent;
import com.sothawo.mapjfx.offline.OfflineCache;
import javafx.application.Application;
import javafx.event.EventHandler;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Slider;
import javafx.scene.control.TextField;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.stage.Stage;

import java.awt.event.ActionEvent;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileSystems;
import java.util.Collections;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.Logger;

/**
 * Test application.
 *
 * @author P.J. Meisch (pj.meisch@sothawo.com).
 */
public class TestApp extends Application {
// ------------------------------ FIELDS ------------------------------

    private static final Logger logger;
    /** some coordinates from around town */
    private static final Coordinate coordKarlsruheCastle = new Coordinate(49.013517, 8.404435);
    private static final Coordinate coordKarlsruheHarbour = new Coordinate(49.015511, 8.323497);
    private static final Coordinate coordKarlsruheStation = new Coordinate(48.993284, 8.402186);
    private static final Extent extentAll =
            Extent.forCoordinates(coordKarlsruheHarbour, coordKarlsruheCastle, coordKarlsruheStation);

    private static final CoordinateLine coordinateLine =
            new CoordinateLine(coordKarlsruheCastle, coordKarlsruheHarbour, coordKarlsruheStation).setVisible(true)
                    .setColor(Color.DODGERBLUE).setWidth(7);

    private static final int DEFAULT_ZOOM = 14;

    private static final Marker marker;

    private static final MapLabel mapLabel;

    private static final WMSParam wmsParam;

    static {
        // init the logging from the classpath logging.properties
        InputStream inputStream = TestApp.class.getResourceAsStream("/logging.properties");
        if (null != inputStream) {
            try {
                LogManager.getLogManager().readConfiguration(inputStream);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        logger = Logger.getLogger(TestApp.class.getCanonicalName());

        marker = Marker.createProvided(Marker.Provided.BLUE).setPosition(coordKarlsruheCastle).setVisible(true);
        mapLabel = new MapLabel("blau!")
                .setCssClass("blue-label")
                .setPosition(coordKarlsruheCastle)
                .setVisible(true);

        marker.attachLabel(mapLabel);

//        wmsParam = new WMSParam()
//                .setUrl("http://irs.gis-lab.info/?")
//                .addParam("layers", "landsat")
//                .addParam("REQUEST", "GetTile");

        wmsParam = new WMSParam()
                .setUrl("http://127.0.0.1:8080/geoserver/gas/wms")
                .addParam("layers", "gas:GasNet_parcel");
    }

    /** the MapView */
    private gfpMapView mapView;
    private MapView mapView2;

// -------------------------- STATIC METHODS --------------------------
    /** api keys for bing maps. */
    private TextField bingApiKey;

// -------------------------- OTHER METHODS --------------------------

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(final Stage primaryStage) throws Exception {
        logger.info("starting devtest program...");
        final BorderPane borderPane = new BorderPane();
        System.setProperty("sun.net.http.allowRestrictedHeaders", "true");
        // MapView in the center with an initial coordinate (optional)
        // the MapView is created first as the other elements reference it
        mapView = new gfpMapView();
        // animate pan and zoom with 500ms
        mapView.setAnimationDuration(500);
        borderPane.setCenter(mapView);

        // at the top some buttons
        final Pane topPane = createTopPane();
        borderPane.setTop(topPane);

        // at the bottom some infos
        borderPane.setBottom(createBottomPane());

        // add WMSParam
        mapView.setWMSParam(wmsParam);


        // listen to MapViewEvent MAP_CLICKED
        mapView.addEventHandler(MapViewEvent.MAP_CLICKED, event -> {
//            logger.info("MAP_CLICKED event at " + event.getCoordinate());
            event.consume();
            if (marker.getVisible()) {
                marker.setPosition(event.getCoordinate());
            }
            if (mapLabel.getVisible()) {
                mapLabel.setPosition(event.getCoordinate());
            }
        });

        // listen to MapViewEvent MAP_RIGHT_CLICKED
        mapView.addEventHandler(MapViewEvent.MAP_RIGHT_CLICKED, event -> {
//            logger.info("MAP_RIGHT_CLICKED event at " + event.getCoordinate());
            event.consume();
        });

        // listen to MapViewEvent MAP_EXTENT
        mapView.addEventHandler(MapViewEvent.MAP_EXTENT, event -> {
//            logger.info(() -> "MAP_EXTENT event: " + event.getExtent());
            mapView.setExtent(event.getExtent());
            event.consume();
        });

        // listen to MapViewEvent MAP_BOUNDING_EXTENT
        mapView.addEventHandler(MapViewEvent.MAP_BOUNDING_EXTENT, event -> {
//            logger.info(() -> "MAP_BOUNDING_EXTENT event: " + event.getExtent());
            event.consume();
        });

        // listen to MARKER_CLICKED event.
        mapView.addEventHandler(MarkerEvent.MARKER_CLICKED, event -> {
//            logger.info("MARKER_CLICKED event: " + event.getMarker());
            event.consume();
        });
        // listen to MARKER_MOUSE_DOWN event.
        mapView.addEventHandler(MarkerEvent.MARKER_MOUSE_DOWN, event -> {
//            logger.info("MARKER_MOUSE_DOWN event: " + event.getMarker());
            event.consume();
        });
        // listen to MARKER_MOUSE_UP event.
        mapView.addEventHandler(MarkerEvent.MARKER_MOUSE_UP, event -> {
//            logger.info("MARKER_MOUSE_UP event: " + event.getMarker());
            event.consume();
        });
        // listen to MARKER_DOUBLE_CLICKED event.
        mapView.addEventHandler(MarkerEvent.MARKER_DOUBLE_CLICKED, event -> {
//            logger.info("MARKER_DOUBLE_CLICKED event: " + event.getMarker());
            event.consume();
        });
        // listen to MARKER_RIGHT_CLICKED event.
        mapView.addEventHandler(MarkerEvent.MARKER_RIGHT_CLICKED, event -> {
//            logger.info("MARKER_RIGHT_CLICKED event: " + event.getMarker());
            event.consume();
        });
        // listen to MARKER_ENTERED event.
        mapView.addEventHandler(MarkerEvent.MARKER_ENTERED, event -> {
//            logger.info("MARKER_ENTERED event: " + event.getMarker());
            event.consume();
        });
        // listen to MARKER_EXITED event.
        mapView.addEventHandler(MarkerEvent.MARKER_EXITED, event -> {
//            logger.info("MARKER_EXITED event: " + event.getMarker());
            event.consume();
        });
        // listen to MAPLABEL_MOUSE_DOWN event.
        mapView.addEventHandler(MapLabelEvent.MAPLABEL_MOUSE_DOWN, event -> {
//            logger.info("MAPLABEL_MOUSE_DOWN event: " + event.getMapLabel());
            event.consume();
        });
        // listen to MAPLABEL_MOUSE_UP event.
        mapView.addEventHandler(MapLabelEvent.MAPLABEL_MOUSE_UP, event -> {
//            logger.info("MAPLABEL_MOUSE_UP event: " + event.getMapLabel());
            event.consume();
        });
        // listen to MAPLABEL_CLICKED event.
        mapView.addEventHandler(MapLabelEvent.MAPLABEL_CLICKED, event -> {
//            logger.info("MAPLABEL_CLICKED event: " + event.getMapLabel());
            event.consume();
        });
        // listen to MAPLABEL_RIGHT_CLICKED event.
        mapView.addEventHandler(MapLabelEvent.MAPLABEL_RIGHT_CLICKED, event -> {
//            logger.info("MAPLABEL_RIGHT_CLICKED event: " + event.getMapLabel());
            event.consume();
        });
        // listen to MAPLABEL_DOUBLE_CLICKED event.
        mapView.addEventHandler(MapLabelEvent.MAPLABEL_DOUBLE_CLICKED, event -> {
//            logger.info("MAPLABEL_DOUBLE_CLICKED event: " + event.getMapLabel());
            event.consume();
        });
        // listen to MAPLABEL_ENTERED event.
        mapView.addEventHandler(MapLabelEvent.MAPLABEL_ENTERED, event -> {
//            logger.info("MAPLABEL_ENTERED event: " + event.getMapLabel());
            event.consume();
            event.getMapLabel().setCssClass("green-label");
        });
        // listen to MAPLABEL_EXITED event.
        mapView.addEventHandler(MapLabelEvent.MAPLABEL_EXITED, event -> {
//            logger.info("MAPLABEL_EXITED event: " + event.getMapLabel());
            event.consume();
            event.getMapLabel().setCssClass("blue-label");
        });
        // listen to MAP_POINTER_MOVED event
        mapView.addEventHandler(MapViewEvent.MAP_POINTER_MOVED, event -> {
//            logger.info("MAP_POINTER_MOVED event: " + event.getCoordinate());
            event.consume();
        });


        mapView.addEventHandler(MapViewEvent.MAP_SINGLE_CLICK_AT_FEATURE, event -> {
            logger.info("MAP_SINGLE_CLICK_AT_FEATURE event: " + event.getURL());
            event.consume();
        });

        initOfflineCache();
        // add listener for mapView initialization state
        mapView.initializedProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue) {
                // a map is only displayed when an initial coordinate is set
                mapView.setCenter(coordKarlsruheHarbour);
                mapView.setExtent(extentAll);
//                mapView.setZoom(0);

                // add two markers without keeping a ref to them, they should disappear from the map when gc'ed
//                mapView.addMarker(Marker.createProvided(Marker.Provided.GREEN).setPosition(coordKarlsruheHarbour)
//                        .setVisible(true));
//                mapView.addMarker(
//                        Marker.createProvided(Marker.Provided.ORANGE).setPosition(coordKarlsruheStation).setVisible(
//                                true));

                // add a coordinate line to be gc'ed
//                mapView.addCoordinateLine(
//                        new CoordinateLine(coordKarlsruheHarbour, coordKarlsruheStation, coordKarlsruheCastle)
//                                .setVisible(true)
//                                .setColor(Color.FUCHSIA).setWidth(5));

                // add a label to be gc'ed
//                mapView.addLabel(new MapLabel("clean me up").setPosition(coordKarlsruheStation)
//                        .setVisible(true));
                topPane.setDisable(false);
            }
        });

        // set custom css url
        mapView.setCustomMapviewCssURL(getClass().getResource("/custom_mapview.css"));

        // now initialize the mapView
        mapView.initialize();

        mapView2 = new MapView();
        mapView2.setMinWidth(200);

//        borderPane.setRight(mapView2);
//        mapView2.initializedProperty().addListener((observable, oldValue, newValue) -> {
//            if (newValue) {
//                mapView2.setCenter(coordKarlsruheHarbour);
//                mapView2.setZoom(10);
//            }
//        });
//        mapView2.initialize();
//        mapView.getOfflineCache().setActive(false);
        // show the whole thing
        final Scene scene = new Scene(borderPane, 1200, 800);

        primaryStage.setTitle("sothawo mapjfx devtest program");
        primaryStage.setScene(scene);
        primaryStage.show();

        logger.finer(() -> "application started.");

    }

    private void initOfflineCache() {
//        final OfflineCache offlineCache = OfflineCache.INSTANCE;
//        (new File("tmpdata/cache")).mkdirs();
//        offlineCache.setCacheDirectory(FileSystems.getDefault().getPath("tmpdata/cache"));
//        offlineCache.setActive(true);
//        offlineCache.setNoCacheFilters(Collections.singletonList(".*\\.sothawo\\.com/.*"));
    }

    /**
     * creates the bottom pane with status labels.
     *
     * @return Pane
     */
    private Pane createBottomPane() {
        HBox hbox = new HBox();
        hbox.setPadding(new Insets(5, 5, 5, 5));
        hbox.setSpacing(10);

        // label for showing the map's center
        Label labelCenter = new Label();
        hbox.getChildren().add(labelCenter);
        // add an observer for the map's center property to adjust the corresponding label
        mapView.centerProperty().addListener((observable, oldValue, newValue) -> {
            labelCenter.setText(newValue == null ? "" : ("center: " + newValue.toString()));
        });

        // label for showing the map's zoom
        Label labelZoom = new Label();
        hbox.getChildren().add(labelZoom);
        // add an observer to adjust the label
        mapView.zoomProperty().addListener((observable, oldValue, newValue) -> {
            labelZoom.setText(null == newValue ? "" : ("zoom: " + newValue.toString()));
        });
        return hbox;
    }

// --------------------------- main() method ---------------------------

    /**
     * creates the top pane with the different location buttons.
     *
     * @return Pane
     */
    private Pane createTopPane() {
        VBox vbox = new VBox();
        vbox.setPadding(new Insets(5, 5, 5, 5));

        HBox hbox = new HBox();
        hbox.setPadding(new Insets(5, 5, 5, 5));
        hbox.setSpacing(5);
        vbox.getChildren().add(hbox);


        String wkt = "POLYGON((10.689 -25.092, 34.595 " +
                "-20.170, 38.814 -35.639, 13.502 " +
                "-39.155, 10.689 -25.092))";

        Button btn = new Button();
        btn.setText("Karlsruhe castle");
//        btn.setOnAction(event ->mapView.addWktFeatureToOverlay(wkt,true));
        btn.setOnAction(new EventHandler<javafx.event.ActionEvent>() {
            @Override
            public void handle(javafx.event.ActionEvent event) {
                mapView.addWktFeatureToOverlay(wkt,true);
//                mapView.zoomToOverlay();

//                mapView.setStartMeasure("Polygon");
                //to init basemap you should setBackgroundMapBaseURL to the server ip, read this ip from a
                //config file
                mapView.setBackgroundMapBaseURL("http://127.0.0.1");
                mapView.setBackgroundMap("street");  //you can seve last base map in config and load it to save last status


                //TO enable select feature
                mapView.setWMSQueryLayer("http://127.0.0.1:8080/geoserver/gas/wms","gas","GasNet_parcel");
                mapView.setEnableSelect(true);

                //Then you can listen to map event
//                mapView.addEventHandler(MapViewEvent.MAP_SINGLE_CLICK_AT_FEATURE, event -> {
//                    logger.info("MAP_SINGLE_CLICK_AT_FEATURE event: " + event.getURL());
//                    event.consume();
//                });


                //To enable globe control
                mapView.setGlobeControl(true);

                ///TO load a layer from server (based on users access)

                mapView.addlayer("wms","http://127.0.0.1:8080/geoserver/gas/wms","gas","GasNet_parcel",-1,
                        "پارسل ها",true,false);
                mapView.setEditLayer("gas:GasNet_parcel","http://127.0.0.1:8080",0.5,"پارسل (ویرایش)");
//                mapView.testwms();



            }
        });



        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("Karlsruhe harbour");
        btn.setOnAction(event -> mapView.setCenter(coordKarlsruheHarbour));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("Karlsruhe station");
        btn.setOnAction(event -> mapView.setCenter(coordKarlsruheStation));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("all");
        btn.setOnAction(event -> mapView.setExtent(extentAll));
        hbox.getChildren().add(btn);

        Slider slider = new Slider(MapView.MIN_ZOOM, MapView.MAX_ZOOM, MapView.INITIAL_ZOOM);
        slider.setBlockIncrement(1);
        slider.setShowTickMarks(true);
        slider.setShowTickLabels(true);
        slider.setSnapToTicks(true);
        slider.setMajorTickUnit(MapView.MAX_ZOOM / 4);
        slider.setMinorTickCount((MapView.MAX_ZOOM / 4) - 1);
        slider.valueProperty().bindBidirectional(mapView.zoomProperty());
        slider.setSnapToTicks(true);
        HBox.setHgrow(slider, Priority.ALWAYS);
        hbox.getChildren().add(slider);

        hbox = new HBox();
        hbox.setPadding(new Insets(5, 5, 5, 5));
        hbox.setSpacing(5);
        vbox.getChildren().add(hbox);

        btn = new Button();
        btn.setText("OSM");
        btn.setOnAction(evt -> mapView.setMapType(MapType.OSM));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("ST");
        btn.setOnAction(evt -> mapView.setMapType(MapType.STAMEN_WC));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("BR");
        btn.setOnAction(evt -> {
            mapView.setBingMapsApiKey(bingApiKey.getText());
            mapView.setMapType(MapType.BINGMAPS_ROAD);
        });
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("BA");
        btn.setOnAction(evt -> {
            mapView.setBingMapsApiKey(bingApiKey.getText());
            mapView.setMapType(MapType.BINGMAPS_AERIAL);
        });
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("WMS");
        btn.setOnAction(evt -> mapView.setMapType(MapType.WMS));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("add marker");
        btn.setOnAction(evt -> mapView.addMarker(marker));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("toggle marker visibility");
        btn.setOnAction(evt -> marker.setVisible(!marker.getVisible()));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("remove marker");
        btn.setOnAction(evt -> mapView.removeMarker(marker));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("add Track");
        btn.setOnAction(evt -> mapView.addCoordinateLine(coordinateLine));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("remove Track");
        btn.setOnAction(evt -> mapView.removeCoordinateLine(coordinateLine));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("toggle Track visibilty");
        btn.setOnAction(evt -> coordinateLine.setVisible(!coordinateLine.getVisible()));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("GC");
        btn.setOnAction(evt -> {
            System.gc();
        });
        hbox.getChildren().add(btn);

        hbox = new HBox();
        hbox.setPadding(new Insets(5, 5, 5, 5));
        hbox.setSpacing(5);
        hbox.getChildren().add(new Label("Bing Maps API Key:"));
        bingApiKey = new TextField();
        hbox.getChildren().add(bingApiKey);

        btn = new Button();
        btn.setText("add label");
        btn.setOnAction(evt -> mapView.addLabel(mapLabel));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("toggle label visibility");
        btn.setOnAction(evt -> mapLabel.setVisible(!mapLabel.getVisible()));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("remove label");
        btn.setOnAction(evt -> mapView.removeLabel(mapLabel));
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("clear cache");
        btn.setOnAction(evt -> {
            try {
                mapView.getOfflineCache().clear();
            } catch (IOException e) {
                logger.log(Level.WARNING, "could not clear cache", e);
            }
        });
        hbox.getChildren().add(btn);

        vbox.getChildren().add(hbox);

        vbox.setDisable(true);

        return vbox;
    }
}
