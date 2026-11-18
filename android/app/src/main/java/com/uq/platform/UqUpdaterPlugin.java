package com.uq.platform;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Pont de mise a jour OTA : ouvre l'installateur Android sur un APK
 * deja telecharge par l'app. Android affiche sa confirmation « Installer »
 * (obligatoire cote systeme, impossible de la supprimer).
 */
@CapacitorPlugin(name = "UqUpdater")
public class UqUpdaterPlugin extends Plugin {


    /**
     * Demande les permissions materiel a l'ouverture de l'app
     * (position, camera, micro, stockage, bluetooth...).
     * Retourne la liste des permissions encore manquantes.
     */
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        String[] wanted = new String[]{
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_MEDIA_AUDIO",
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.BLUETOOTH_CONNECT",
            "android.permission.BLUETOOTH_SCAN",
        };
        java.util.List<String> missing = new java.util.ArrayList<>();
        for (String p : wanted) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(getContext(), p)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                missing.add(p);
            }
        }
        if (missing.isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("allGranted", true);
            call.resolve(ret);
            return;
        }
        // Lance la demande systeme groupée
        getActivity().requestPermissions(
            missing.toArray(new String[0]), 1001);
        JSObject ret = new JSObject();
        ret.put("allGranted", false);
        ret.put("requested", missing.size());
        call.resolve(ret);
    }

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
