"use strict";

(function () {
    function replaceAll(text, replacements) {
        return Object.entries(replacements).reduce((output, [key, value]) => {
            return output.split(`{{${key}}}`).join(String(value));
        }, text);
    }

    async function loadTemplate() {
        const config = window.NETSEC_LAB || {};
        const templateUrl = config.template || "../lab-template.html";
        const response = await fetch(templateUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Could not load ${templateUrl}: ${response.status} ${response.statusText}`);
        }

        const labConfig = {
            title: config.title || "Network Security Lab",
            md: config.md || "./instructions.md",
            assetBase: config.assetBase || "../",
            guideTitle: config.guideTitle || "Investigation Guide",
            visibleVm: config.visibleVm || {},
            computers: config.computers,
            bootStatus: Boolean(config.bootStatus),
            hiddenVms: Array.isArray(config.hiddenVms) ? config.hiddenVms : []
        };

        const html = replaceAll(await response.text(), {
            LAB_BASE: document.baseURI.replace(/&/g, "&amp;").replace(/"/g, "&quot;"),
            LAB_TITLE: labConfig.title,
            LAB_MD: labConfig.md,
            ASSET_BASE: labConfig.assetBase,
            GUIDE_TITLE: labConfig.guideTitle,
            VM_LABEL: labConfig.computers?.[0]?.label || labConfig.visibleVm.label || "Linux VM",
            VM_BADGE: labConfig.computers?.[0]?.badge || labConfig.visibleVm.badge || "Browser-based virtual machine",
            LAB_CONFIG: JSON.stringify(labConfig).replace(/</g, "\\u003c")
        });

        document.open();
        document.write(html);
        document.close();
    }

    loadTemplate().catch((error) => {
        console.error(error);
        document.body.innerHTML = `
            <main style="font-family:system-ui,sans-serif;padding:2rem;line-height:1.5">
                <h1>Network security lab could not start</h1>
                <p>The shared lab template could not be loaded.</p>
                <pre></pre>
            </main>`;
        document.querySelector("pre").textContent = String(error);
    });
})();
