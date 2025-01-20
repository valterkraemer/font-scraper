import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("Please add a ?url=https://example.com parameter", {
        status: 400,
      });
    }

    try {
      const normalizedUrl = new URL(url).toString(); // Normalize the URL
      const browser = await puppeteer.launch(env.BROWSER);

      const page = await browser.newPage();

      // Store font URLs
      const fontUrls = new Set<string>();

      // Intercept network requests
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const resourceUrl = request.url();
        if (resourceUrl.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
          fontUrls.add(resourceUrl);
        }
        request.continue();
      });

      await page.goto(normalizedUrl);

      // Close the browser
      await browser.close();

      // Convert Set to an array for JSON serialization
      return new Response(
        JSON.stringify({ fonts: Array.from(fontUrls) }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error occurred:", error);
      return new Response("An error occurred while processing your request.", {
        status: 500,
      });
    }
  },
};
