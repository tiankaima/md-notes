document.addEventListener("DOMContentLoaded", function () {
    // Function to fetch SVG and inject the styles
    function injectSVGStyles(imgElement) {
        // Retrieve the src attribute for the image
        const imgSrc = imgElement.getAttribute('src');

        // If it's an SVG file (basic check for ".svg")
        if (imgSrc && imgSrc.endsWith('.svg')) {
            // Fetch the SVG file
            fetch(imgSrc)
                .then(response => response.text()) // Get the SVG content as text
                .then(svgText => {
                    // Parse the SVG string into an HTML element
                    const parser = new DOMParser();
                    const svgDocument = parser.parseFromString(svgText, 'image/svg+xml');
                    const svgElement = svgDocument.querySelector('svg');

                    if (svgElement) {
                        // Convert old <img> to inline <svg>
                        imgElement.replaceWith(svgElement);

                        // Create a <style> element with desired CSS:
                        const styleElement = document.createElement('style');
                        styleElement.textContent = `
                            :root { --color: #000000; }
                            @media (prefers-color-scheme: dark) { :root { --color: #FFFFFF; } }
                            path {
                              fill: var(--md-default-fg-color);
                            }
                            .typst-shape {
                              stroke: var(--md-default-fg-color);
                            }
                        `;

                        // Append the style inside the <svg> element or <head> of SVG
                        svgElement.insertBefore(styleElement, svgElement.firstChild);
                    }
                })
                .catch(err => {
                    console.error("Error fetching SVG:", err);
                });
        }
    }

    // Find all <img> tags
    const imgElements = document.querySelectorAll('img');

    // Convert all SVG <img> tags to inline SVG with injected styles
    imgElements.forEach(imgElement => {
        injectSVGStyles(imgElement);
    });
});