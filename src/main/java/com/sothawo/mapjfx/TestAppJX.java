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

import com.sothawo.mapjfx.event.GeomType;
import com.sothawo.mapjfx.event.MapViewEvent;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.event.EventHandler;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.stage.WindowEvent;

import java.io.IOException;
import java.io.InputStream;
import java.util.logging.LogManager;
import java.util.logging.Logger;

/**
 * Test application.
 *
 * @author P.J. Meisch (pj.meisch@sothawo.com).
 */
public class TestAppJX extends Application {
// ------------------------------ FIELDS ------------------------------

    private static final Logger logger;

    private static final int DEFAULT_ZOOM = 14;



    static {
        // init the logging from the classpath logging.properties
        InputStream inputStream = TestAppJX.class.getResourceAsStream("/logging.properties");
        if (null != inputStream) {
            try {
                LogManager.getLogManager().readConfiguration(inputStream);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        logger = Logger.getLogger(TestAppJX.class.getCanonicalName());

    }

    /** the MapView */
    private GfpMapViewJX mapView;


// -------------------------- OTHER METHODS --------------------------

    public static void main(String[] args) {
        launch(args);
    }

    boolean globstatus=true;
    boolean selectstat=true;

    @Override
    public void start(final Stage primaryStage) throws Exception {
        logger.info("starting devtest program...");
        final BorderPane borderPane = new BorderPane();
        System.setProperty("sun.net.http.allowRestrictedHeaders", "true");
        // MapView in the center with an initial coordinate (optional)
        // the MapView is created first as the other elements reference it
        mapView = new GfpMapViewJX();
        // animate pan and zoom with 500ms
        mapView.setAnimationDuration(100);
        borderPane.setCenter(mapView);



        // at the top some buttons
        final Pane topPane = createTopPane();
        borderPane.setTop(topPane);

        // at the bottom some infos
        borderPane.setBottom(createBottomPane());



        mapView.DEBUG=new SimpleBooleanProperty(this, "DEBUG", true);;

        // at the bottom some infos
        borderPane.setBottom(createBottomPane());

        // now initialize the mapView
        mapView.initialize();

        // show the whole thing
      final  Scene scene = new Scene(borderPane, 1200, 800);

        primaryStage.setTitle("sothawo mapjfx devtest program");


        primaryStage.setScene(scene);


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


        primaryStage.show();
        logger.finer(() -> "application started.");


        mapView.addEventHandler(MapViewEvent.MAP_SINGLE_CLICK_AT_FEATURE, event -> {
            logger.info("MAP_SINGLE_CLICK_AT_FEATURE event: " + event.getURL());
//            Alert alert = new Alert(Alert.AlertType.CONFIRMATION, "Get Data from this url : " + event.getURL() + " ?", ButtonType.OK);
//            alert.showAndWait();
            event.consume();
        });

        mapView.addEventHandler(MapViewEvent.MAP_WFS_DELETE_EVENT, event -> {
            logger.info("MAP_WFS_DELETE_EVENT event: " + event.getEditorfeaturejeojson());

            event.consume();
        });

        mapView.addEventHandler(MapViewEvent.MAP_WFS_UPDATE_EVENT, event -> {
            logger.info("MAP_WFS_UPDATE_EVENT event: " + event.getEditorfeaturejeojson());

            event.consume();
        });

        mapView.addEventHandler(MapViewEvent.MAP_WFS_ADD_EVENT, event -> {
            logger.info("MAP_WFS_ADD_EVENT event: " + event.getEditorfeaturejeojson());

            event.consume();
        });
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
//        mapView.centerProperty().addListener((observable, oldValue, newValue) -> {
//            labelCenter.setText(newValue == null ? "" : ("center: " + newValue.toString()));
//        });

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


        Button btn = new Button();
        btn.setText("Init Map");
        btn.setOnAction(new EventHandler<javafx.event.ActionEvent>() {
            @Override
            public void handle(javafx.event.ActionEvent event) {

//                mapView.setStartMeasure("Polygon");
                //to init basemap you should setBackgroundMapBaseURL to the server ip, read this ip from a
                //config file
                mapView.setBackgroundMapBaseURL("http://127.0.0.1");
                mapView.setBackgroundMap("street");  //you can seve last base map in config and load it to save last status


                //TO enable select feature
                mapView.setWMSQueryLayer("http://127.0.0.1:8080/geoserver/gas/wms","gas","GasNet_parcel");
                mapView.setEnableSelect(selectstat);

                //Then you can listen to map event
//                mapView.addEventHandler(MapViewEvent.MAP_SINGLE_CLICK_AT_FEATURE, event -> {
//                    logger.info("MAP_SINGLE_CLICK_AT_FEATURE event: " + event.getURL());
//                    event.consume();
//                });


                //To enable globe control
                mapView.setGlobeControl(globstatus);

                ///TO load a layer from server (based on users access)

                mapView.addlayer("wms","http://127.0.0.1:8080/geoserver/gas/wms","gas","GasNet_parcel",-1,
                        "پارسل ها",true,false);
//                mapView.testwms();



            }
        });



        hbox.getChildren().add(btn);

        Button globebtn = new Button();
        globebtn.setText("Disable Globe");
        globebtn.setOnAction(new EventHandler<javafx.event.ActionEvent>() {
            @Override
            public void handle(javafx.event.ActionEvent event) {
                globstatus=!globstatus;
                mapView.setGlobeControl(globstatus);
               if(globstatus){
                   globebtn.setText("Disable Globe");
               }else{
                   globebtn.setText("Enable Globe");
               }
            }
        });
        hbox.getChildren().add(globebtn);

        btn = new Button();
        btn.setText("Add wkt to map and zoom");
        btn.setOnAction(new EventHandler<javafx.event.ActionEvent>() {
            @Override
            public void handle(javafx.event.ActionEvent event) {
                String wkt = "POLYGON((10.689 -25.092, 34.595 " +
                        "-20.170, 38.814 -35.639, 13.502 " +
                        "-39.155, 10.689 -25.092))";

                mapView.addWktFeatureToOverlay(wkt,false);
                mapView.zoomToOverlay();
            }
        });
        hbox.getChildren().add(btn);

        btn = new Button();
        btn.setText("Add another WKT and clean the other one");
        btn.setOnAction(new EventHandler<javafx.event.ActionEvent>() {
            @Override
            public void handle(javafx.event.ActionEvent event) {
                String wkt = "POINT(10.689 -25.092)";

                mapView.addWktFeatureToOverlay(wkt,true);
                mapView.zoomToOverlay();
            }
        });
        hbox.getChildren().add(btn);



        Button selectbtn = new Button();
        selectbtn.setText("Disable Select");
        selectbtn.setOnAction(new EventHandler<javafx.event.ActionEvent>() {
            @Override
            public void handle(javafx.event.ActionEvent event) {
                selectstat=!selectstat;
                mapView.setEnableSelect(selectstat);
                if(selectstat){
                    selectbtn.setText("Disable Select");
                }else{
                    selectbtn.setText("Enable Select");
                }
            }
        });
        hbox.getChildren().add(selectbtn);


        Button enable_edit = new Button();
        enable_edit.setText("Edit Parcel");
        enable_edit.setOnAction(new EventHandler<javafx.event.ActionEvent>() {
            @Override
            public void handle(javafx.event.ActionEvent event) {
                  mapView.setEditLayer("gas:GasNet_parcel","http://127.0.0.1:8080",0.5,"پارسل (ویرایش)", GeomType.POLYGON);
            }
        });
        hbox.getChildren().add(enable_edit);
        //vbox.getChildren().add(hbox);

//        vbox.setDisable(true);

        return vbox;
    }



}
