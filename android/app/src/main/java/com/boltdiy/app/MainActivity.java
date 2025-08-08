package com.boltdiy.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.view.WindowManager;
import android.content.pm.ActivityInfo;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Keep screen on for AI processing
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Set orientation to portrait by default but allow landscape
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER);
        
        // Configure WebView for better performance
        configureWebView();
    }
    
    private void configureWebView() {
        WebView webView = getBridge().getWebView();
        WebSettings webSettings = webView.getSettings();
        
        // Enable hardware acceleration
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Enable file access for AI models
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        
        // Performance optimizations
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        
        // Mixed content for development
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Enable debugging in development
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
    }
    
    @Override
    protected void init(Bundle savedInstanceState) {
        super.init(savedInstanceState);
        
        // Register additional plugins
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            // Add custom plugins here if needed
        }});
    }
    
    @Override
    public void onBackPressed() {
        // Handle back button - allow WebView to handle first
        if (getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
        } else {
            // Exit app
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onDestroy() {
        // Cleanup resources
        super.onDestroy();
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        // Save state if needed
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        // Restore state if needed
    }
}