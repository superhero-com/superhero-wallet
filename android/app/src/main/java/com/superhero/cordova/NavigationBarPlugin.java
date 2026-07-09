package com.superhero.cordova;

import android.graphics.Color;
import android.os.Build;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Colors the Android navigation bar with an exact color.
 *
 * On Android 15 the capawesome EdgeToEdge plugin colors the bar with an overlay
 * drawn behind the WebView, but for 3-button navigation the OS paints an
 * 80%-opaque contrast scrim on top of every app layer, so the overlay never
 * shows. window.setNavigationBarColor() is deprecated but still drives the
 * 3-button navigation bar, so we use it directly and disable the scrim.
 */
@CapacitorPlugin(name = "NavigationBar")
public class NavigationBarPlugin extends Plugin {

    @PluginMethod
    public void setColor(PluginCall call) {
        final String color = call.getString("color");
        if (color == null) {
            call.reject("color must be provided.");
            return;
        }
        // The wallet uses dark bars, so default to light (white) buttons.
        final boolean darkButtons = Boolean.TRUE.equals(call.getBoolean("darkButtons", false));

        getActivity()
            .runOnUiThread(() -> {
                try {
                    Window window = getActivity().getWindow();
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        // Remove the system contrast scrim so the exact color shows.
                        window.setNavigationBarContrastEnforced(false);
                    }
                    window.setNavigationBarColor(Color.parseColor(color));
                    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
                    controller.setAppearanceLightNavigationBars(darkButtons);
                    call.resolve();
                } catch (Exception exception) {
                    call.reject(exception.getMessage());
                }
            });
    }
}
