package com.uq.platform;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Pont de mise a jour OTA : ouvre l'installateur Android sur un APK
 * deja telecharge par l'app. Android affiche sa confirmation « Installer »
 * (obligatoire cote systeme, impossible de la supprimer).
 */
@CapacitorPlugin(name = "UqUpdater")
public class UqUpdaterPlugin extends Plugin {

    @PluginMethod
    public void installApk(PluginCall call) {
        String path = call.getString("path");
        if (path == null || path.isEmpty()) {
            call.reject("path requis");
            return;
        }
        try {
            File apk = new File(path);
            if (!apk.exists()) {
                call.reject("APK introuvable: " + path);
                return;
            }
            Uri uri = FileProvider.getUriForFile(
                getContext(), getContext().getPackageName() + ".fileprovider", apk);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("installApk: " + e.getMessage());
        }
    }
}
