import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

// Enhanced error handling and logging
const logError = (error: any, context: any) => {
  console.error('🔴 Worker Error:', {
    message: error.message,
    stack: error.stack,
    url: context.request.url,
    method: context.request.method,
    timestamp: new Date().toISOString(),
    userAgent: context.request.headers.get('user-agent'),
    cfRay: context.request.headers.get('cf-ray'),
    env: {
      hasOpenAI: !!context.env.OPENAI_API_KEY,
      hasAnthropic: !!context.env.ANTHROPIC_API_KEY,
      hasGroq: !!context.env.GROQ_API_KEY,
      hasHuggingFace: !!context.env.HuggingFace_API_KEY,
      hasOpenRouter: !!context.env.OPEN_ROUTER_API_KEY,
      hasOllama: !!context.env.OLLAMA_API_BASE_URL,
      hasOpenAILike: !!context.env.OPENAI_LIKE_API_KEY,
      hasTogether: !!context.env.TOGETHER_API_KEY,
      hasDeepSeek: !!context.env.DEEPSEEK_API_KEY,
      hasLMStudio: !!context.env.LMSTUDIO_API_BASE_URL,
      hasGoogle: !!context.env.GOOGLE_GENERATIVE_AI_API_KEY,
      hasMistral: !!context.env.MISTRAL_API_KEY,
      hasXAI: !!context.env.XAI_API_KEY,
      hasPerplexity: !!context.env.PERPLEXITY_API_KEY,
      hasBedrock: !!context.env.AWS_BEDROCK_CONFIG,
    }
  });
};

// Fallback response for critical failures
const createFallbackResponse = (error: any, context: any) => {
  const isAPIRequest = context.request.url.includes('/api/');
  
  if (isAPIRequest) {
    return new Response(
      JSON.stringify({
        error: 'Service temporarily unavailable',
        message: 'The application encountered an error and is being restarted.',
        timestamp: new Date().toISOString(),
        support: 'Please try again in a few moments.',
        rayId: context.request.headers.get('cf-ray'),
        path: new URL(context.request.url).pathname,
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Retry-After': '30',
        },
      }
    );
  }

  // For non-API requests, return a simple HTML error page
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>Service Temporarily Unavailable</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               margin: 0; padding: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; 
                    padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #e53e3e; margin-bottom: 20px; }
        .retry { background: #3182ce; color: white; padding: 12px 24px; 
                border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
        .retry:hover { background: #2c5aa0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔄 Service Temporarily Unavailable</h1>
        <p>The application encountered an error and is being restarted. This usually resolves within a few moments.</p>
        <p><strong>What happened?</strong> The server-side application crashed while processing your request.</p>
        <p><strong>What can you do?</strong></p>
        <ul>
          <li>Wait a moment and refresh the page</li>
          <li>Try again in a few minutes</li>
          <li>If the problem persists, contact support</li>
        </ul>
        <button class="retry" onclick="window.location.reload()">🔄 Try Again</button>
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Error ID: ${context.request.headers.get('cf-ray') || 'unknown'}<br>
          Time: ${new Date().toISOString()}
        </p>
      </div>
    </body>
    </html>`,
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Retry-After': '30',
      },
    }
  );
};

export const onRequest: PagesFunction = async (context) => {
  try {
    // Add request logging for debugging
    console.log('🚀 Worker Request:', {
      url: context.request.url,
      method: context.request.method,
      cfRay: context.request.headers.get('cf-ray'),
      timestamp: new Date().toISOString(),
      path: new URL(context.request.url).pathname,
    });

    // Validate environment variables (optional but helpful for debugging)
    const requiredEnvVars = [
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY', 'HuggingFace_API_KEY',
      'OPEN_ROUTER_API_KEY', 'OLLAMA_API_BASE_URL', 'OPENAI_LIKE_API_KEY',
      'TOGETHER_API_KEY', 'DEEPSEEK_API_KEY', 'LMSTUDIO_API_BASE_URL',
      'GOOGLE_GENERATIVE_AI_API_KEY', 'MISTRAL_API_KEY', 'XAI_API_KEY',
      'PERPLEXITY_API_KEY', 'AWS_BEDROCK_CONFIG'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !context.env[varName]);
    if (missingEnvVars.length > 0) {
      console.warn('⚠️ Missing environment variables:', missingEnvVars);
    }

    // Dynamic import with timeout and error handling
    let serverBuild: ServerBuild;
    try {
      // Add timeout to prevent hanging imports
      // In Cloudflare Pages, build files are deployed to the root
      const importPromise = import('/build/server');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Import timeout after 10 seconds')), 10000)
      );
      
      serverBuild = await Promise.race([importPromise, timeoutPromise]) as unknown as ServerBuild;
      
      // Validate the build object
      if (!serverBuild || typeof serverBuild !== 'object') {
        throw new Error('Invalid server build object - build is null or not an object');
      }
      
      // Check for required build properties
      if (!serverBuild.routes || !serverBuild.entry) {
        throw new Error('Server build missing required properties (routes, entry)');
      }
      
      console.log('✅ Server build loaded successfully', {
        hasRoutes: !!serverBuild.routes,
        hasEntry: !!serverBuild.entry,
        hasAssets: !!serverBuild.assets,
        buildType: typeof serverBuild,
      });
    } catch (importError) {
      logError(importError, context);
      return createFallbackResponse(importError, context);
    }

    // Create handler with error wrapping
    let handler;
    try {
      handler = createPagesFunctionHandler({
        build: serverBuild,
        mode: 'production', // Set to production for live deployment
      });
      console.log('✅ Handler created successfully');
    } catch (handlerError) {
      logError(handlerError, context);
      return createFallbackResponse(handlerError, context);
    }

    // Execute handler with comprehensive error handling
    try {
      const response = await handler(context);
      
      // Add security headers
      if (response instanceof Response) {
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        newResponse.headers.set('X-XSS-Protection', '1; mode=block');
        newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        newResponse.headers.set('X-Worker-Status', 'healthy');
        return newResponse;
      }
      
      return response;
    } catch (executionError) {
      logError(executionError, context);
      return createFallbackResponse(executionError, context);
    }

  } catch (criticalError) {
    // Catch-all for any unexpected errors
    logError(criticalError, context);
    
    // Return a proper error response instead of crashing
    return createFallbackResponse(criticalError, context);
  }
};
