export const onRequest: PagesFunction = async (context) => {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
      worker: 'bolt-ai',
      cfRay: context.request.headers.get('cf-ray'),
      userAgent: context.request.headers.get('user-agent'),
      url: context.request.url,
      method: context.request.method,
    };

    // Try to import server build to verify it's accessible
    try {
      const serverBuild = await import('../../build/server');
      healthData.status = 'fully_operational';
      healthData.serverBuild = 'loaded';
    } catch (importError) {
      healthData.status = 'degraded';
      healthData.serverBuild = 'failed';
      healthData.importError = importError.message;
    }

    return new Response(JSON.stringify(healthData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        cfRay: context.request.headers.get('cf-ray'),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
};