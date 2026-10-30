package com.emprende.directorio;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import java.util.ArrayList;
import java.util.List;

final class PermisosIniciales {
    private PermisosIniciales() {}

    static void solicitar(Activity activity) {
        SharedPreferences preferencias = activity.getSharedPreferences("permisos_iniciales", Context.MODE_PRIVATE);
        if (preferencias.getBoolean("solicitados_v1", false)) return;
        List<String> pendientes = new ArrayList<>();
        agregar(activity, pendientes, Manifest.permission.CAMERA);
        agregar(activity, pendientes, Manifest.permission.ACCESS_COARSE_LOCATION);
        agregar(activity, pendientes, Manifest.permission.ACCESS_FINE_LOCATION);
        agregar(activity, pendientes, Manifest.permission.READ_CONTACTS);
        if (Build.VERSION.SDK_INT >= 33) {
            boolean seleccionadas = Build.VERSION.SDK_INT >= 34 &&
                activity.checkSelfPermission(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) == PackageManager.PERMISSION_GRANTED;
            if (!seleccionadas) {
                agregar(activity, pendientes, Manifest.permission.READ_MEDIA_IMAGES);
                if (Build.VERSION.SDK_INT >= 34) agregar(activity, pendientes, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED);
            }
            agregar(activity, pendientes, Manifest.permission.POST_NOTIFICATIONS);
        } else {
            agregar(activity, pendientes, Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        preferencias.edit().putBoolean("solicitados_v1", true).apply();
        if (!pendientes.isEmpty()) activity.requestPermissions(pendientes.toArray(new String[0]), 8147);
    }

    private static void agregar(Activity activity, List<String> permisos, String permiso) {
        if (activity.checkSelfPermission(permiso) != PackageManager.PERMISSION_GRANTED) permisos.add(permiso);
    }
}
