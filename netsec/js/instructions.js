"use strict";

(function () {
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function parseFrontMatter(markdown) {
        const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
        if (!match) return { meta: {}, body: markdown };

        const meta = {};
        match[1].split(/\r?\n/).forEach((line) => {
            const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (field) meta[field[1]] = field[2].trim().replace(/^['"]|['"]$/g, "");
        });

        return { meta, body: markdown.slice(match[0].length) };
    }

    function configurePage(meta) {
        if (meta.title) {
            document.title = meta.title;
            const title = document.getElementById("lab-title");
            if (title) title.textContent = meta.title;
        }

        if (meta.panel_title) {
            const panelTitle = document.getElementById("guide-panel-title");
            if (panelTitle) panelTitle.textContent = meta.panel_title;
        }
    }

    function sectionLabel(heading, index) {
        const match = heading.match(/^([A-Za-z0-9]{1,8})\s*:\s*(.+)$/);
        if (match) return { label: match[1].toUpperCase(), title: match[2] };
        return { label: index === 0 ? "START" : String(index), title: heading };
    }

    function arrangeSections(rendered, guide) {
        const nodes = Array.from(rendered.childNodes);
        const sections = [];
        let current = null;

        nodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "H2") {
                current = { heading: node, nodes: [node] };
                sections.push(current);
            } else if (current) {
                current.nodes.push(node);
            }
        });

        guide.innerHTML = "";
        sections.forEach((section, index) => {
            const parsed = sectionLabel(section.heading.textContent.trim(), index);
            const wrapper = document.createElement("section");
            wrapper.className = "instruction-section";

            const label = document.createElement("div");
            label.className = "instruction-label";
            label.textContent = parsed.label === "REF" ? "Reference" : parsed.label === "START" ? "Start" : `Step ${parsed.label}`;
            wrapper.appendChild(label);

            const title = document.createElement("h3");
            title.textContent = parsed.title;
            wrapper.appendChild(title);

            const content = document.createElement("div");
            content.className = "instruction-content";
            section.nodes.slice(1).forEach((node) => content.appendChild(node));
            wrapper.appendChild(content);
            guide.appendChild(wrapper);
        });
    }

    async function loadInstructions() {
        const guide = document.getElementById("guide-scroll");
        if (!guide) return;

        const config = window.NETSEC_LAB_CONFIG || {};
        const path = config.md || document.body.dataset.labMd || "./snort.md";

        try {
            if (!window.marked || !window.DOMPurify) {
                throw new Error("The Markdown libraries did not load.");
            }

            const response = await fetch(path, { cache: "no-store" });
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

            const { meta, body } = parseFrontMatter(await response.text());
            configurePage(meta);

            marked.setOptions({ gfm: true, breaks: false });
            const rendered = document.createElement("div");
            rendered.innerHTML = DOMPurify.sanitize(marked.parse(body), { USE_PROFILES: { html: true } });
            arrangeSections(rendered, guide);
        } catch (error) {
            console.error("Instruction load error:", error);
            guide.innerHTML = `
                <div class="instructions-error">
                    <h3>Could not load instructions</h3>
                    <p>Check that <code>${escapeHtml(path)}</code> is present and readable.</p>
                    <pre>${escapeHtml(error.message || error)}</pre>
                </div>`;
        }
    }

    document.addEventListener("DOMContentLoaded", loadInstructions);
})();
