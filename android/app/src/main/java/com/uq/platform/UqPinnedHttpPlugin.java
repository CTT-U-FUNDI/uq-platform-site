package com.uq.platform;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import okhttp3.CertificatePinner;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import java.util.concurrent.TimeUnit;

/**
 * UqPinnedHttp — requetes HTTP avec SSL pinning (façon Google Chrome).
 * Epingle les cles publiques SPKI des domaines UQ : une interception MITM
 * avec un certificat different est refusee au niveau TLS.
 *
 * Usage JS : UqPinnedHttp.request({ url, method, headers, body }) -> { status, body }
 */
@CapacitorPlugin(name = "UqPinnedHttp")
public class UqPinnedHttpPlugin extends Plugin {

    // Pins SPKI SHA-256 — regenere via :
    //   openssl s_client -connect api.uqplatform.com:443 -servername api.uqplatform.com | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | openssl enc -base64
    private static final CertificatePinner PINNER = new CertificatePinner.Builder()
        .add("api.uqplatform.com", "sha256/nTPTA+i5otuu/MNv+Ru2R+s1oiNIFb0g5/V1q/+MQfQ=")
        .add("uqplatform.com", "sha256/DQc7m3O0sO4W4/WA5SHHtseqIKSKdkp1jhsx3/UEPZA=")
        .add("*.uqplatform.com", "sha256/nTPTA+i5otuu/MNv+Ru2R+s1oiNIFb0g5/V1q/+MQfQ=")
        .build();

    private final OkHttpClient client = new OkHttpClient.Builder()
        .certificatePinner(PINNER)
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build();

    @PluginMethod
    public void request(PluginCall call) {
        try {
            String url = call.getString("url", "");
            String method = call.getString("method", "GET").toUpperCase();
            String body = call.getString("body", "");
            JSObject headersObj = call.getObject("headers", new JSObject());
            if (url.isEmpty()) { call.reject("URL_REQUIRED"); return; }

            Request.Builder rb = new Request.Builder().url(url);
            if (headersObj != null) {
                for (String k : headersObj.keys()) {
                    try { rb.header(k, String.valueOf(headersObj.get(k))); } catch (Exception ignored) {}
                }
            }
            RequestBody reqBody = null;
            if (body != null && !body.isEmpty() && !method.equals("GET")) {
                reqBody = RequestBody.create(body, MediaType.parse("application/json"));
            }
            rb.method(method, reqBody);

            try (Response resp = client.newCall(rb.build()).execute()) {
                String respBody = resp.body() != null ? resp.body().string() : "";
                JSObject ret = new JSObject();
                ret.put("status", resp.code());
                ret.put("body", respBody);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("HTTP_FAILED", e.getMessage());
        }
    }
}
