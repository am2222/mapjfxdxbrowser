/*
 Copyright 2015 Peter-Josef Meisch (pj.meisch@sothawo.com)

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

import javafx.beans.value.ChangeListener;

import java.util.Objects;

/**
 * Internal helper class. Encapsulation of different ChangeListener instances.
 *
 * @author P.J. Meisch (pj.meisch@sothawo.com).
 */
public final class CoordinateLineListener {
// ------------------------------ FIELDS ------------------------------

    /** listener for visibility changes */
    private final ChangeListener<Boolean> visibleChangeListener;

// --------------------------- CONSTRUCTORS ---------------------------

    /**
     * @param visibleChangeListener
     *         visibility change listener
     * @throws NullPointerException
     *         if either argument is null
     */
    public CoordinateLineListener(ChangeListener<Boolean> visibleChangeListener) {
        this.visibleChangeListener = Objects.requireNonNull(visibleChangeListener);
    }

// --------------------- GETTER / SETTER METHODS ---------------------

    public ChangeListener<Boolean> getVisibleChangeListener() {
        return visibleChangeListener;
    }
}
