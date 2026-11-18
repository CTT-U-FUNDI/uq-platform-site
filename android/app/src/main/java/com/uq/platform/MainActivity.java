package com.uq.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UqUpdaterPlugin.class);
        registerPlugin(UqCryptoPlugin.class);
        registerPlugin(UqPinnedHttpPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
