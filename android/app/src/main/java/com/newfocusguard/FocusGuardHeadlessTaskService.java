package com.newfocusguard;

import android.content.Intent;
import android.os.Bundle;
import androidx.annotation.Nullable;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class FocusGuardHeadlessTaskService extends HeadlessJsTaskService {

    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Bundle extras = intent.getExtras();
        if (extras != null) {
            // Retrieve the task name passed from AppMonitoringService.java
            // We used "AppBlocked" as the registered JS task name.
            // We also passed "originalEventNameFired" and "eventType" in the bundle from AppMonitoringService.
            String taskKey = extras.getString("taskName", "AppBlocked"); // Default to AppBlocked if not specified

            return new HeadlessJsTaskConfig(
                taskKey, // The key registered in AppRegistry.registerHeadlessTask
                Arguments.fromBundle(extras), // The data bundle for the JS task
                5000, // Timeout for the task in milliseconds
                true // Whether or not the task is allowed to run in foreground
            );
        }
        return null;
    }
} 