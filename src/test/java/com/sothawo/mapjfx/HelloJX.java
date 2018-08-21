package com.sothawo.mapjfx;

import com.teamdev.jxbrowser.chromium.Browser;
import com.teamdev.jxbrowser.chromium.BrowserCore;
import com.teamdev.jxbrowser.chromium.internal.Environment;
import com.teamdev.jxbrowser.chromium.javafx.BrowserView;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.layout.StackPane;
import javafx.stage.Stage;

/**
 * The sample demonstrates how to create Browser instance, embed it, display and load
 * specified URL.
 */
public class HelloJX extends Application {
    @Override
    public void init() throws Exception {
        // On Mac OS X Chromium engine must be initialized in non-UI thread.
        if (Environment.isMac()) {
            BrowserCore.initialize();
        }
    }

    @Override
    public void start(Stage primaryStage) {
        Browser browser = new Browser();
        BrowserView browserView = new BrowserView(browser);

        StackPane pane = new StackPane();
        pane.getChildren().add(browserView);
        Scene scene = new Scene(pane, 500, 400);
        primaryStage.setTitle("JxBrowser: JavaFX - Hello World");
        primaryStage.setScene(scene);
        primaryStage.show();

        browser.loadHTML("<html><body><h1>Hello World!</h1></body></html>");
    }

    public static void main(String[] args) {
        launch(args);
    }
}