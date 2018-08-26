/*
 Copyright 2016-2018 Peter-Josef Meisch (pj.meisch@sothawo.com)

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
package com.sothawo.mapjfx.event;

import com.sothawo.mapjfx.Coordinate;
import com.sothawo.mapjfx.Extent;
import javafx.event.Event;
import javafx.event.EventType;

import static java.util.Objects.requireNonNull;

/**
 * Event class for MapView events.
 *
 * @author P.J. Meisch (pj.meisch@sothawo.com).
 */
public class MapViewEvent extends Event {
    /** base event type */
    public static final EventType<MapViewEvent> ANY = new EventType<>("MAPVIEW_EVENT_ANY");

    /** coordinate clicked in map */
    public static final EventType<MapViewEvent> MAP_CLICKED = new EventType<>(ANY, "MAP_CLICKED");

    /** pointer moved over map */
    public static final EventType<MapViewEvent> MAP_POINTER_MOVED = new EventType<>(ANY, "MAP_POINTER_MOVED");

    /** coordinate context clicked in map */
    public static final EventType<MapViewEvent> MAP_RIGHT_CLICKED = new EventType<>(ANY, "MAP_RIGHT_CLICKED");

    /** extent selected  in map */
    public static final EventType<MapViewEvent> MAP_EXTENT = new EventType<>(ANY, "MAP_EXTENT");

    /** vounding extent changed  in map */
    public static final EventType<MapViewEvent> MAP_BOUNDING_EXTENT = new EventType<>(ANY, "MAP_BOUNDING_EXTENT");

    /** clicked on a mouse position when select tool is enabled*/
    public static final EventType<MapViewEvent> MAP_SINGLE_CLICK_AT_FEATURE = new EventType<>(ANY, "MAP_SINGLE_CLICK_AT_FEATURE");

    /** clicked on a mouse position when select tool is enabled*/
    public static final EventType<MapViewEvent> MAP_SINGLE_CLICK_AT_WFS_FEATURE = new EventType<>(ANY, "MAP_SINGLE_CLICK_AT_WFS_FEATURE");


    /** clicked on a mouse position when DELETE tool is enabled*/
    public static final EventType<MapViewEvent> MAP_WFS_DELETE_EVENT = new EventType<>(ANY, "MAP_WFS_DELETE_EVENT");
    /** clicked on a mouse position when ADD tool is enabled*/
    public static final EventType<MapViewEvent> MAP_WFS_ADD_EVENT = new EventType<>(ANY, "MAP_WFS_ADD_EVENT");
    /** clicked on a mouse position when select UPDATE is enabled*/
    public static final EventType<MapViewEvent> MAP_WFS_UPDATE_EVENT = new EventType<>(ANY, "MAP_WFS_UPDATE_EVENT");

    /** the coordinate where the event happened, only set on MAP_CLICKED event */
    private final Coordinate coordinate;

    /** the extent that was selected in the map, only set on MAP_EXTENT and MAP_BOUNDING_EXTENT events. */
    private final Extent extent;

    private final String url;

    private final String editorfeaturejeojson;


    private final EditType editType;



    /**
     * creates an CoordinateEvent of the given type and name for a clicked object.
     *
     * @param eventType
     *         type
     * @param coordinate
     *         coordinate
     */
    public MapViewEvent(EventType<? extends MapViewEvent> eventType, Coordinate coordinate) {
        super(eventType);
        this.coordinate = requireNonNull(coordinate);
        this.extent = null;
        this.url=null;
        this.editorfeaturejeojson=null;
        this.editType=EditType.NONE;

    }

    /**
     * creates an ExtentEvent.
     *
     * @param eventType
     *         type
     * @param extent
     *         the extent
     */
    public MapViewEvent(EventType<? extends MapViewEvent> eventType, Extent extent) {
        super(eventType);
        this.extent = requireNonNull(extent);
        this.coordinate = null;
        this.editorfeaturejeojson=null;
        this.url=null;
        this.editType=EditType.NONE;
    }

    public MapViewEvent(EventType<? extends MapViewEvent> eventType, String url, Coordinate coordinate) {
        super(eventType);
        this.extent = null;
        this.coordinate = requireNonNull(coordinate);
        this.editorfeaturejeojson=null;
        this.url=requireNonNull(url);
        this.editType=EditType.NONE;
    }

    public MapViewEvent(EventType<? extends MapViewEvent> eventType,EditType type, String editorfeaturejeojson) {
        super(eventType);
        this.extent = null;
        this.coordinate = null;
        this.url=null;
        this.editorfeaturejeojson=requireNonNull(editorfeaturejeojson);
        editType=type;
    }
    /**
     * @return the extent for a {@link #MAP_EXTENT} event.
     */
    public Extent getExtent() {
        return extent;
    }

    /**
     * @return the coordinate where the event happend.
     */
    public Coordinate getCoordinate() {
        return coordinate;
    }

    public String getURL() {
        return url;
    }

    /**
     * returns a geojson (in string format) of data which is deleting
     * @return String of geojson
     */
    public String getEditorfeaturejeojson() {
        return editorfeaturejeojson;
    }

    public EditType getEditType(){
        return this.editType;
    }
}
