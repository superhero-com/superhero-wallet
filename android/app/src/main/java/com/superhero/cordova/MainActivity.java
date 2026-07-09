package com.superhero.cordova;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NavigationBarPlugin.class);
        super.onCreate(savedInstanceState);

        // Set the initial navigation bar color (matching the splash) before the
        // web layer loads and calls NavigationBar.setColor for the active screen.
        // On Android 15 + 3-button navigation the OS otherwise paints a white
        // contrast scrim behind the transparent bar; see NavigationBarPlugin.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setStatusBarContrastEnforced(false);
        }
        getWindow().setNavigationBarColor(Color.parseColor("#000000"));
    }
}
