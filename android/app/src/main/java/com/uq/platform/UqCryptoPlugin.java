package com.uq.platform;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * UqCryptoPlugin — cryptographie locale dans l'APK.
 * - Ed25519 : signature/verif de transactions et messages (cles privees restent
 *   sur l'appareil, jamais envoyees au serveur).
 * - AES-256-GCM : chiffrement de vaults, exports et donnees sensibles locales.
 */
@CapacitorPlugin(name = "UqCrypto")
public class UqCryptoPlugin extends Plugin {

    private static final String ED = "Ed25519";
    private static final String AES = "AES/GCM/NoPadding";
    private static final int GCM_TAG = 128;
    private static final int GCM_IV = 12;

    // ---------- Ed25519 ----------

    @PluginMethod
    public void generateKeyPair(PluginCall call) {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance(ED);
            KeyPair kp = kpg.generateKeyPair();
            JSObject ret = new JSObject();
            ret.put("publicKey", Base64.encodeToString(kp.getPublic().getEncoded(), Base64.NO_WRAP));
            ret.put("privateKey", Base64.encodeToString(kp.getPrivate().getEncoded(), Base64.NO_WRAP));
            call.resolve(ret);
        } catch (Exception e) { call.reject("KEYGEN_FAILED", e.getMessage()); }
    }

    @PluginMethod
    public void sign(PluginCall call) {
        try {
            String privB64 = call.getString("privateKey", "");
            String data = call.getString("data", "");
            if (privB64.isEmpty() || data.isEmpty()) { call.reject("ARGS"); return; }
            PrivateKey priv = KeyFactory.getInstance(ED)
                .generatePrivate(new PKCS8EncodedKeySpec(Base64.decode(privB64, Base64.NO_WRAP)));
            Signature sig = Signature.getInstance(ED);
            sig.initSign(priv);
            sig.update(data.getBytes(StandardCharsets.UTF_8));
            JSObject ret = new JSObject();
            ret.put("signature", Base64.encodeToString(sig.sign(), Base64.NO_WRAP));
            call.resolve(ret);
        } catch (Exception e) { call.reject("SIGN_FAILED", e.getMessage()); }
    }

    @PluginMethod
    public void verify(PluginCall call) {
        try {
            String pubB64 = call.getString("publicKey", "");
            String data = call.getString("data", "");
            String sigB64 = call.getString("signature", "");
            PublicKey pub = KeyFactory.getInstance(ED)
                .generatePublic(new X509EncodedKeySpec(Base64.decode(pubB64, Base64.NO_WRAP)));
            Signature sig = Signature.getInstance(ED);
            sig.initVerify(pub);
            sig.update(data.getBytes(StandardCharsets.UTF_8));
            JSObject ret = new JSObject();
            ret.put("valid", sig.verify(Base64.decode(sigB64, Base64.NO_WRAP)));
            call.resolve(ret);
        } catch (Exception e) { call.reject("VERIFY_FAILED", e.getMessage()); }
    }

    // ---------- AES-256-GCM ----------

    @PluginMethod
    public void encrypt(PluginCall call) {
        try {
            String keyB64 = call.getString("key", "");   // 32 bytes base64 ou passphrase derivee cote JS
            String plain = call.getString("data", "");
            byte[] keyBytes = Base64.decode(keyB64, Base64.NO_WRAP);
            SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");
            byte[] iv = new byte[GCM_IV];
            new java.security.SecureRandom().nextBytes(iv);
            Cipher c = Cipher.getInstance(AES);
            c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG, iv));
            byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            // iv(12) + ciphertext+tag
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            JSObject ret = new JSObject();
            ret.put("data", Base64.encodeToString(out, Base64.NO_WRAP));
            call.resolve(ret);
        } catch (Exception e) { call.reject("ENCRYPT_FAILED", e.getMessage()); }
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        try {
            String keyB64 = call.getString("key", "");
            String cipherB64 = call.getString("data", "");
            byte[] raw = Base64.decode(cipherB64, Base64.NO_WRAP);
            byte[] iv = Arrays.copyOfRange(raw, 0, GCM_IV);
            byte[] ct = Arrays.copyOfRange(raw, GCM_IV, raw.length);
            SecretKeySpec key = new SecretKeySpec(Base64.decode(keyB64, Base64.NO_WRAP), "AES");
            Cipher c = Cipher.getInstance(AES);
            c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG, iv));
            JSObject ret = new JSObject();
            ret.put("data", new String(c.doFinal(ct), StandardCharsets.UTF_8));
            call.resolve(ret);
        } catch (Exception e) { call.reject("DECRYPT_FAILED", e.getMessage()); }
    }

    /** Derive une cle AES-256 depuis une passphrase (PBKDF2-HMAC-SHA256, 100k iterations). */
    @PluginMethod
    public void deriveKey(PluginCall call) {
        try {
            String pass = call.getString("passphrase", "");
            String salt = call.getString("salt", "uq-platform-v1");
            int iter = call.getInt("iterations", 100000);
            javax.crypto.SecretKeyFactory skf = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            javax.crypto.spec.PBEKeySpec spec = new javax.crypto.spec.PBEKeySpec(
                pass.toCharArray(), salt.getBytes(StandardCharsets.UTF_8), iter, 256);
            SecretKey sk = skf.generateSecret(spec);
            JSObject ret = new JSObject();
            ret.put("key", Base64.encodeToString(sk.getEncoded(), Base64.NO_WRAP));
            call.resolve(ret);
        } catch (Exception e) { call.reject("DERIVE_FAILED", e.getMessage()); }
    }
}
