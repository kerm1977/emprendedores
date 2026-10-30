package com.emprende.directorio;

import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

/* BLINDADO TOTAL: la interfaz ModifiedMainActivityForSocialLoginPlugin
   es la marca que exige el plugin Capgo para Google sign-in.
   No quitar, no renombrar, no tocar. */
public class MainActivity extends BridgeActivity
        implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        PermisosIniciales.solicitar(this);
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
